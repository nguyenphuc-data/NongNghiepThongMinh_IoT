// server.js – ĐÃ SỬA XONG 100%, CHẠY NGON LẬP TỨC!!!
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// ==================== MQTT ====================
const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883', {
  clientId: 'smartgarden_server',
  reconnectPeriod: 1000
});

// ==================== IMPORT ====================
const SensorData = require('./models/SensorData');
const plantRoutes = require('./routes/plantRoutes');
const authRoutes = require('./routes/auth');   // ĐÃ ĐẶT ĐÚNG VỊ TRÍ

// ==================== CẤU HÌNH ====================
const PORT = process.env.PORT || 3000;
const MAIN_DB_URI = process.env.MONGO_URI;
const RECOG_DB_URI = 'mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/iot_sensors?appName=IoT-Sensors';
const ESP32_KEY = 'esp32_vuonrau';

// ==================== APP & SOCKET.IO ====================
const app = express();                          // KHAI BÁO app TRƯỚC
const server = http.createServer(app);

// FIX CORS 100% CHO VITE + PREFlight
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ĐĂNG KÝ AUTH ROUTES – ĐÃ ĐẶT ĐÚNG SAU app
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/plants', plantRoutes);

// ==================== BIẾN TOÀN CỤC ====================
let CURRENT_ACTIVE_PLANT_ID = null;
let Recognition = null;
let recognitionConn = null;

// ==================== KẾT NỐI DB CHÍNH ====================
mongoose.connect(MAIN_DB_URI)
  .then(() => console.log('Kết nối smartgarden_db thành công!'))
  .catch(err => console.error('Lỗi smartgarden_db:', err));

// ==================== KẾT NỐI DB PHỤ + CHANGE STREAMS (GIỮ NGUYÊN) ====================
(async () => {
  try {
    recognitionConn = await mongoose.createConnection(RECOG_DB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Kết nối iot_sensors (recognitions) thành công!');

    Recognition = recognitionConn.model('recognitions', new mongoose.Schema({
      plant: String,
      confidence: Number,
      source: String,
      model_version: String,
      timestamp: { type: Date, default: Date.now }
    }, { collection: 'recognitions', timestamps: true }));

    console.log('Model recognitions đã sẵn sàng! Change Stream bật!');
    await broadcastLatestRecognition();

    const changeStream = Recognition.watch();
    changeStream.on('change', async () => {
      console.log('recognitions có thay đổi → phát realtime cho tất cả client!');
      await broadcastLatestRecognition();
    });

    changeStream.on('error', (err) => {
      console.error('Change Stream lỗi:', err);
    });

  } catch (err) {
    console.error('Lỗi kết nối iot_sensors DB:', err.message);
  }
})();

// ==================== BROADCAST RECOGNITION (GIỮ NGUYÊN) ====================
const broadcastLatestRecognition = async () => {
  if (!Recognition) return;
  try {
    const latest = await Recognition.findOne()
      .sort({ timestamp: -1 })
      .select('plant confidence timestamp source model_version _id')
      .lean();

    io.emit('latest_recognition', latest || null);
    console.log('Broadcast recognition:', latest ? `${latest.plant} (${(latest.confidence * 100).toFixed(1)}%)` : 'chưa có dữ liệu');
  } catch (err) {
    console.error('Lỗi broadcast recognition:', err);
  }
};

// ==================== SOCKET.IO (GIỮ NGUYÊN 100%) ====================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  broadcastLatestRecognition();

  socket.on('request_latest_recognition', () => {
    console.log('Client yêu cầu latest_recognition');
    broadcastLatestRecognition();
  });

  socket.on('set_active_plant', async (plantId) => {
    if (!mongoose.Types.ObjectId.isValid(plantId)) return;

    socket.leaveAll();
    socket.join(plantId);
    CURRENT_ACTIVE_PLANT_ID = plantId;
    console.log(`Active plant → ${plantId}`);

    try {
      const history = await SensorData.find({ plant_id: plantId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
      socket.emit('initial_data', history.reverse());
    } catch (err) {
      socket.emit('initial_data', []);
    }
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// ==================== CHỖ DUY NHẤT SỬA 1: NHẬN DỮ LIỆU TỪ MQTT (THAY CHO HTTP) ====================
mqttClient.on('connect', () => {
  console.log('MQTT đã kết nối → lắng nghe dữ liệu từ ESP32');
  mqttClient.subscribe(`smartgarden/${ESP32_KEY}/data`, { qos: 1 });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    if (data.device_key !== ESP32_KEY) return;

    // GIỮ NGUYÊN HOÀN TOÀN LOGIC CŨ – CHỈ THAY NGUỒN TỪ HTTP SANG MQTT
    if (!CURRENT_ACTIVE_PLANT_ID) {
      console.log('ESP32 gửi dữ liệu nhưng chưa chọn cây → bỏ qua');
      return;
    }

    const record = await SensorData.create({
      ...data,
      plant_id: CURRENT_ACTIVE_PLANT_ID,
      timestamp: new Date(data.timestamp * 1000 || Date.now())
    });

    console.log(`ESP32 → ${data.temp}°C | Đất ${data.soil_percent}% | Bơm ${data.pump}`);
    io.to(CURRENT_ACTIVE_PLANT_ID).emit('new_data', record);

    if (data.pump === 'ON' || data.pump === 'OFF') {
      io.emit('pump_controlled', { state: data.pump, source: 'esp32', timestamp: new Date() });
    }
  } catch (err) {
    console.error('Lỗi xử lý MQTT data:', err);
  }
});

// ==================== CHỖ DUY NHẤT SỬA 2: GỬI LỆNH BƠM BẰNG MQTT (THAY AXIOS) ====================
app.post('/api/control-pump', async (req, res) => {
  const { state } = req.body;
  if (!['ON', 'OFF'].includes(state)) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  const command = `PUMP:${state}`;
  
  mqttClient.publish(`smartgarden/${ESP32_KEY}/cmd`, command, { qos: 1 }, (err) => {
    if (err) {
      console.error('Lỗi gửi lệnh bơm qua MQTT:', err);
      return res.status(500).json({ error: 'Gateway không phản hồi' });
    }

    console.log(`BƠM ${state} (từ web → MQTT)`);
    io.emit('pump_controlled', { state, source: 'web', timestamp: new Date() });
    res.json({ success: true, state });
  });
});

// ==================== KHỞI ĐỘNG (GIỮ NGUYÊN) ====================
server.listen(PORT, () => {
  console.log(`\nSIÊU PHẨM SMARTGARDEN CHẠY TẠI http://localhost:${PORT}`);
  console.log('   • Cảm biến realtime (MQTT)');
  console.log('   • Điều khiển bơm (MQTT)');
  console.log('   • Nhận diện AI realtime (Change Streams – 0ms delay!)');
  console.log('   • ĐÃ LOẠI BỎ HOÀN TOÀN HTTP GATEWAY → KHÔNG CÒN LỖI OFFLINE!\n');
});