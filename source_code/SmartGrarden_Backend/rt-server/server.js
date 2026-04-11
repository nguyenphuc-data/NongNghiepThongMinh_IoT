// server.js – ĐÃ CHUYỂN 100% SANG SESSION, KHÔNG DÙNG TOKEN NỮA
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const aedes = require('aedes')();
const net = require('net');
const mqttServer = net.createServer(aedes.handle);
const MQTT_PORT = 1883;

mqttServer.listen(MQTT_PORT, function () {
  console.log(`MQTT Broker đang chạy trên cổng ${MQTT_PORT}`);
});

aedes.on('client', function (client) {
  console.log(`[MQTT] Client connected: ${client ? client.id : client}`);
});

aedes.on('clientDisconnect', function (client) {
  console.log(`[MQTT] Client Disconnected: ${client ? client.id : client}`);
});
const PHOTOS_DIR = path.join(__dirname, 'public/photos');
const ensureDir = () => {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    console.log('Đã tạo thư mục photos');
  }
};
ensureDir();
const SensorData = require('./models/SensorData');
const plantRoutes = require('./routes/plantRoutes');
const authRoutes = require('./routes/auth');
const plantZoneRoutes = require('./routes/plantZoneRoutes');

const PORT = process.env.PORT || 3000;
const MAIN_DB_URI = process.env.MONGO_URI;
const ESP32_KEY = 'esp32_vuonrau';

const app = express();
const server = http.createServer(app);
const pumpRoutes = require('./routes/pumpRoutes');

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // THÊM OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'],     // cho phép header
  credentials: true   // cho phép gửi cookie
}));
app.use(express.json());

// Gắn user từ session vào req
app.use((req, res, next) => {
  req.db = mongoose.connection.db;
  req.user = req.session.user || null;
  next();
});
app.use('/', express.static('public'));
app.use('/api/pump', pumpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/plants-zone', plantZoneRoutes);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

// Đã xóa bỏ khối kết nối DB AI Camera

// === SOCKET.IO + MQTT (giữ nguyên) ===
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // === 1. Khi chọn cây → gửi 10 bản ghi gần nhất ===
  socket.on('set_active_plant', async (plantId) => {
    if (!mongoose.Types.ObjectId.isValid(plantId)) return;

    socket.leaveAll();
    socket.join(plantId);
    global.CURRENT_ACTIVE_PLANT_ID = plantId;

    try {
      const history = await SensorData.find({ plant_id: plantId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean()
        .exec();

      socket.emit('initial_data', history.reverse());
    } catch (err) {
      console.error('Lỗi lấy initial_data:', err);
      socket.emit('initial_data', []);
    }
  });

  // === 2. Khi yêu cầu toàn bộ lịch sử ===
  socket.on('request_full_history', async (plantId) => {
    if (!mongoose.Types.ObjectId.isValid(plantId)) {
      socket.emit('full_history_data', []);
      return;
    }

    try {
      const fullHistory = await SensorData.find({ plant_id: plantId })
        .sort({ timestamp: 1 })  // cũ nhất trước
        .lean()
        .exec();

      socket.emit('full_history_data', fullHistory);
      console.log(`Đã gửi toàn bộ lịch sử (${fullHistory.length} bản ghi) cho plant ${plantId}`);
    } catch (err) {
      console.error('Lỗi lấy full history:', err);
      socket.emit('full_history_data', []);
    }
  });
});

aedes.on('publish', async function (packet, client) {
  if (packet.topic === 'smartgarden/telemetry') {
    try {
      const jsonStr = packet.payload.toString().trim();
      if (!jsonStr) return;

      const data = JSON.parse(jsonStr);
      data.device_key = ESP32_KEY;

      console.log(`[MQTT → Web] Nhiệt độ ${data.temp}°C, Ẩm ${data.hum}%, Bơm: ${data.pump}`);

      if (!global.CURRENT_ACTIVE_PLANT_ID) return;

      const record = await SensorData.create({
        ...data,
        plant_id: global.CURRENT_ACTIVE_PLANT_ID,
        timestamp: new Date()
      });

      io.to(global.CURRENT_ACTIVE_PLANT_ID).emit('new_data', record);
      if (data.pump) io.emit('pump_controlled', { state: data.pump, source: 'esp32' });
    } catch (err) {
      // ignore
    }
  }
});

app.post('/api/control-pump', (req, res) => {
  const { state } = req.body;
  if (!['ON', 'OFF'].includes(state)) return res.status(400).json({ error: 'Invalid' });

  const cmd = state;
  aedes.publish({
    topic: 'smartgarden/command/pump',
    payload: Buffer.from(cmd),
    qos: 0,
    retain: false
  }, (err) => {
    if (err) {
      console.error('Lỗi gửi lệnh qua MQTT: ', err.message);
      return res.status(500).json({ error: 'Failed to send command to device' });
    }
    console.log(`[Web → MQTT] Đã gửi lệnh Tới ESP32: PUMP ${cmd}`);
    io.emit('pump_controlled', { state, source: 'web' });
    res.json({ success: true });
  });
});

mongoose.connect(MAIN_DB_URI).then(() => console.log('DB chính kết nối OK'));

server.listen(PORT, () => {
  console.log(`\nSMARTGARDEN SERVER CHẠY TẠI http://localhost:${PORT}`);
});

const recognitionRoutes = require('./routes/recognitionRoutes');

app.use('/api/recognitions', recognitionRoutes);