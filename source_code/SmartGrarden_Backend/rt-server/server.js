// server.js – PHIÊN BẢN HOÀN CHỈNH (có điều khiển bơm + gửi ngay khi pump thay đổi)
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');          // THÊM DÒNG NÀY
require('dotenv').config();

// --- Import Models & Routes ---
const SensorData = require('./models/SensorData');
const Plant = require('./models/Plant');
const plantRoutes = require('./routes/plantRoutes');

// --- Cấu hình cố định ---
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI;
const SINGLE_ESP32_KEY = 'esp32_vuonrau';

// Biến toàn cục: ID cây đang được theo dõi
let CURRENT_ACTIVE_PLANT_ID = null;

// --- Khởi tạo app & socket.io ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- Kết nối MongoDB ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Kết nối MongoDB thành công!'))
    .catch(err => console.error('Lỗi MongoDB:', err));

// --- Routes ---
app.use('/api/plants', plantRoutes);

// ================================================
// 1. API nhận dữ liệu từ gateway.py (giữ nguyên)
// ================================================
app.post('/api/sensor-data', async (req, res) => {
    const data = req.body;
    const { device_key } = data;

    if (!device_key || device_key !== SINGLE_ESP32_KEY) {
        return res.status(403).json({ message: 'Unauthorized device' });
    }

    if (!CURRENT_ACTIVE_PLANT_ID) {
        return res.status(202).json({ message: 'No active plant - data ignored' });
    }

    try {
        const newRecord = await SensorData.create({
            ...data,
            plant_id: CURRENT_ACTIVE_PLANT_ID
        });

        // Phát realtime cho đúng room (cây đang active)
        io.to(CURRENT_ACTIVE_PLANT_ID).emit('new_data', newRecord);

        // Nếu pump vừa thay đổi → phát thêm event riêng để web biết ngay
        if (data.pump === 'ON' || data.pump === 'OFF') {
            io.emit('pump_controlled', { state: data.pump, timestamp: new Date() });
        }

        res.status(201).json({ message: 'Logged & broadcasted', data: newRecord });
    } catch (error) {
        console.error('Lỗi lưu dữ liệu:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ================================================
// 2. API ĐIỀU KHIỂN BƠM TỪ WEB → GỬI LỆNH QUA GATEWAY
// ================================================
app.post('/api/control-pump', async (req, res) => {
    const { state } = req.body; // "ON" hoặc "OFF"

    if (!['ON', 'OFF'].includes(state)) {
        return res.status(400).json({ error: 'state must be ON or OFF' });
    }

    try {
        // Gửi lệnh đến gateway.py (đang chạy FastAPI trên cổng 8000)
        await axios.post('http://127.0.0.1:8000/control-pump', { state }, { timeout: 3000 });

        console.log(`ĐÃ GỬI LỆNH BƠM: ${state} → ESP32`);

        // Phát realtime cho tất cả client đang xem (không cần đợi ESP32 phản hồi)
        io.emit('pump_controlled', { state, source: 'web', timestamp: new Date() });

        res.json({ success: true, state });
    } catch (err) {
        console.error('Gateway không phản hồi:', err.message);
        res.status(500).json({ error: 'Không thể điều khiển bơm (Gateway offline)' });
    }
});

// ================================================
// 3. Socket.IO - Quản lý Active Plant + Gửi lịch sử
// ================================================
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('set_active_plant', async (plantId) => {
        if (!mongoose.Types.ObjectId.isValid(plantId)) return;

        // Rời room cũ
        socket.rooms.forEach(room => {
            if (room !== socket.id) socket.leave(room);
        });

        // Tham gia room mới
        socket.join(plantId);
        CURRENT_ACTIVE_PLANT_ID = plantId;
        console.log(`Active plant → ${plantId}`);

        // Gửi 10 bản ghi lịch sử gần nhất
        try {
            const history = await SensorData.find({ plant_id: plantId })
                .sort({ timestamp: -1 })
                .limit(10);
            socket.emit('initial_data', history.reverse());
        } catch (err) {
            socket.emit('initial_data', []);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Không reset CURRENT_ACTIVE_PLANT_ID vì có thể còn client khác đang xem
    });
});

// --- Khởi động server ---
server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log(`→ Điều khiển bơm: POST http://localhost:${PORT}/api/control-pump`);
});