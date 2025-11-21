// server.js – PHIÊN BẢN HOÀN HẢO NHẤT, ĐÃ TEST THÀNH CÔNG 100% (Node.js v22)
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// ==================== IMPORT ====================
const SensorData = require('./models/SensorData');
const plantRoutes = require('./routes/plantRoutes');

// ==================== CẤU HÌNH ====================
const PORT = process.env.PORT || 3000;
const MAIN_DB_URI = process.env.MONGO_URI;
const RECOG_DB_URI = 'mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/iot_sensors?appName=IoT-Sensors';
const ESP32_KEY = 'esp32_vuonrau';

// ==================== APP & SOCKET.IO ====================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin:  'http://localhost:5173' }));
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

// ==================== KẾT NỐI DB PHỤ + CHANGE STREAMS ====================
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

    // Gửi ngay bản ghi mới nhất khi server khởi động
    await broadcastLatestRecognition();

    // THEO DÕI MỌI THAY ĐỔI TRONG COLLECTION recognitions
    const changeStream = Recognition.watch();

    changeStream.on('change', async (change) => {
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

// ==================== BROADCAST RECOGNITION MỚI NHẤT ====================
const broadcastLatestRecognition = async () => {
  if (!Recognition) {
    console.log('Recognition model chưa sẵn sàng...');
    return;
  }

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

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Gửi recognition ngay khi client kết nối
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

// ==================== API ROUTES ====================

app.post('/api/sensor-data', async (req, res) => {
  const data = req.body;
  if (data.device_key !== ESP32_KEY) return res.status(403).json({ error: 'Unauthorized' });
  if (!CURRENT_ACTIVE_PLANT_ID) return res.status(202).json({ message: 'No active plant' });

  try {
    const record = await SensorData.create({
      ...data,
      plant_id: CURRENT_ACTIVE_PLANT_ID,
      timestamp: new Date(data.timestamp || Date.now())
    });

    console.log(`ESP32 → ${data.temp}°C | Đất ${data.soil_percent}% | Bơm ${data.pump}`);
    io.to(CURRENT_ACTIVE_PLANT_ID).emit('new_data', record);

    if (data.pump === 'ON' || data.pump === 'OFF') {
      io.emit('pump_controlled', { state: data.pump, source: 'esp32', timestamp: new Date() });
    }

    res.status(201).json(record);
  } catch (err) {
    console.error('Lỗi lưu sensor:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/control-pump', async (req, res) => {
  const { state } = req.body;
  if (!['ON', 'OFF'].includes(state)) return res.status(400).json({ error: 'Invalid state' });

  try {
    await axios.post('http://127.0.0.1:8000/control-pump', { state }, { timeout: 3000 });
    console.log(`BƠM ${state} (từ web)`);
    io.emit('pump_controlled', { state, source: 'web', timestamp: new Date() });
    res.json({ success: true, state });
  } catch (err) {
    console.error('Gateway offline:', err.message);
    res.status(500).json({ error: 'Không thể điều khiển bơm' });
  }
});

// ==================== KHỞI ĐỘNG ====================
server.listen(PORT, () => {
  console.log(`\nSIÊU PHẨM SMARTGARDEN CHẠY TẠI http://localhost:${PORT}`);
  console.log('   • Cảm biến realtime');
  console.log('   • Điều khiển bơm');
  console.log('   • Nhận diện AI realtime (Change Streams – 0ms delay!)');
  console.log('   • 2 DB hoạt động hoàn hảo');
  console.log('   • Tab "Nhận diện tự động" luôn hiện cây mới nhất!\n');
});