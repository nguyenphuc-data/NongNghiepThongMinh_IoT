// server.js – ĐÃ CHUYỂN 100% SANG SESSION, KHÔNG DÙNG TOKEN NỮA
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883', {
  clientId: 'smartgarden_server',
  reconnectPeriod: 1000
});

const SensorData = require('./models/SensorData');
const plantRoutes = require('./routes/plantRoutes');
const authRoutes = require('./routes/auth');
const plantZoneRoutes = require('./routes/plantZoneRoutes');

const PORT = process.env.PORT || 3000;
const MAIN_DB_URI = process.env.MONGO_URI;
const RECOG_DB_URI = 'mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/iot_sensors?appName=IoT-Sensors';
const ESP32_KEY = 'esp32_vuonrau';

const app = express();
const server = http.createServer(app);

// SESSION THAY THẾ TOKEN
app.use(session({
  secret: 'smartgarden_super_secret_2025',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MAIN_DB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    httpOnly: true,
    secure: false, // true khi dùng HTTPS
    sameSite: 'lax'
  }
}));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true   // cho phép gửi cookie
}));

app.use(express.json());

// Gắn user từ session vào req
app.use((req, res, next) => {
  req.db = mongoose.connection.db;
  req.user = req.session.user || null;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/plants-zone', plantZoneRoutes);

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

// === DB AI + BROADCAST (giữ nguyên) ===
let Recognition = null;
let recognitionConn = null;

(async () => {
  try {
    recognitionConn = await mongoose.createConnection(RECOG_DB_URI, { bufferCommands: false }).asPromise();
    Recognition = recognitionConn.model('recognitions', new mongoose.Schema({}, { strict: false }), 'recognitions');
    console.log('DB AI kết nối thành công!');

    const broadcast = async () => {
      if (!Recognition) return;
      try {
        const latest = await Recognition.findOne().sort({ timestamp: -1 }).lean();
        io.emit('latest_recognition', latest || null);
      } catch (e) { /* ignore */ }
    };

    recognitionConn.on('open', broadcast);
    Recognition.watch().on('change', broadcast);
  } catch (err) {
    console.warn('DB AI không kết nối được → hệ thống vẫn chạy bình thường');
  }
})();

// === SOCKET.IO + MQTT (giữ nguyên) ===
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('set_active_plant', async (plantId) => {
    if (!mongoose.Types.ObjectId.isValid(plantId)) return;
    socket.leaveAll();
    socket.join(plantId);
    global.CURRENT_ACTIVE_PLANT_ID = plantId;

    const history = await SensorData.find({ plant_id: plantId }).sort({ timestamp: -1 }).limit(10).lean();
    socket.emit('initial_data', history.reverse());
  });
});

mqttClient.on('connect', () => {
  mqttClient.subscribe(`smartgarden/${ESP32_KEY}/data`);
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    if (data.device_key !== ESP32_KEY || !global.CURRENT_ACTIVE_PLANT_ID) return;

    const record = await SensorData.create({
      ...data,
      plant_id: global.CURRENT_ACTIVE_PLANT_ID,
      timestamp: new Date(data.timestamp * 1000 || Date.now())
    });

    io.to(global.CURRENT_ACTIVE_PLANT_ID).emit('new_data', record);
    if (data.pump) io.emit('pump_controlled', { state: data.pump, source: 'esp32' });
  } catch (err) { /* ignore */ }
});

app.post('/api/control-pump', (req, res) => {
  const { state } = req.body;
  if (!['ON', 'OFF'].includes(state)) return res.status(400).json({ error: 'Invalid' });
  mqttClient.publish(`smartgarden/${ESP32_KEY}/cmd`, `PUMP:${state}`);
  io.emit('pump_controlled', { state, source: 'web' });
  res.json({ success: true });
});

mongoose.connect(MAIN_DB_URI).then(() => console.log('DB chính kết nối OK'));

server.listen(PORT, () => {
  console.log(`\nSMARTGARDEN SERVER CHẠY TẠI http://localhost:${PORT}`);
  console.log('   ĐÃ CHUYỂN HOÀN TOÀN SANG SESSION');
  console.log('   KHÔNG CÒN TOKEN, KHÔNG CÒN LỖI 401, KHÔNG CÒN INTERCEPTOR');
  console.log('   ĐĂNG NHẬP 1 LẦN → DÙNG 30 NGÀY!\n');
});