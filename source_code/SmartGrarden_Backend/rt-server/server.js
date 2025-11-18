// server.js
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
// --- 1. Import Models & Routes ---
const SensorData = require('./models/SensorData'); // Dữ liệu cảm biến
const Plant = require('./models/Plant');           // Cây cụ thể
const plantRoutes = require('./routes/plantRoutes'); // Routes quản lý cây

// --- 2. Cấu hình Cố định & Biến Trạng thái ---
const PORT = process.env.PORT || 3000; // Sử dụng PORT từ .env
const MONGODB_URI = process.env.MONGO_URI;

// KHÓA THIẾT BỊ CỐ ĐỊNH (Theo yêu cầu của bạn)
const SINGLE_ESP32_KEY = 'esp32_vuonrau'; 

// BIẾN TRẠNG THÁI GLOBAL: ID của cây hiện đang được Dashboard theo dõi.
let CURRENT_ACTIVE_PLANT_ID = null; 

// --- 3. Khởi tạo Ứng dụng & Server ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Thay đổi nếu Front-end chạy ở port khác
        methods: ['GET', 'POST']
    }
});

// --- 4. Middleware ---
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json()); // Cho phép Express đọc JSON từ request body

// --- 5. Kết nối MongoDB ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Kết nối MongoDB thành công!'))
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// --- 6. API Routes (Quản lý Cây) ---
// Tích hợp routes quản lý cây (GET/POST plants/types)
app.use('/api/plants', plantRoutes);

// --- 7. API Endpoint để nhận dữ liệu từ Gateway (HTTP POST) ---
app.post('/api/sensor-data', async (req, res) => {
    const data = req.body;
    const { device_key } = data; // Gateway phải gửi kèm device_key: 'esp32_vuonrau'

    if (!device_key) {
        return res.status(400).send({ message: 'Missing device_key in payload' });
    }
    
    // B1: Kiểm tra khóa thiết bị
    if (device_key !== SINGLE_ESP32_KEY) { 
        console.log(`[POST-IGNORE] Dữ liệu đến từ thiết bị không hợp lệ: ${device_key}`);
        return res.status(403).send({ message: 'Unauthorized device key' });
    }

    // B2: Kiểm tra trạng thái Active
    if (!CURRENT_ACTIVE_PLANT_ID) {
        console.log(`[POST-IGNORE] Dữ liệu đến, nhưng không có cây nào Active. Bỏ qua lưu DB.`);
        return res.status(202).send({ message: 'Data ignored: No active plant selected.' });
    }

    try {
        // ⭐ LOG DEBUG 1: Kiểm tra payload trước khi lưu
        console.log(`[DB-CREATE] Payload: ${JSON.stringify(data)}`); 
        console.log(`[DB-CREATE] Target Plant ID: ${CURRENT_ACTIVE_PLANT_ID}`);

        // B3: Lưu dữ liệu vào DB (Gán plant_id đang active)
        const newRecord = await SensorData.create({ 
            ...data, 
            plant_id: CURRENT_ACTIVE_PLANT_ID // Sử dụng ID cây đang active
        }); 
        
        // ⭐ LOG DEBUG 2: Xác nhận bản ghi đã được tạo
        console.log(`[DB-SUCCESS] Record created with ID: ${newRecord._id}`); 
        
        // B4: Phát sóng dữ liệu real-time
        io.to(CURRENT_ACTIVE_PLANT_ID).emit('new_data', newRecord); 
        
        console.log(`[POST-ACTIVE] Logged & broadcasted for Plant ID: ${CURRENT_ACTIVE_PLANT_ID}`);

        res.status(201).send({ message: 'Data logged and broadcasted', data: newRecord });
    } catch (error) {
        // ⭐ LOG DEBUG 3: Bắt và in chi tiết lỗi nếu create() thất bại
        console.error('❌ [DB-FAILURE] Error processing data:', error.message);
        // Nếu lỗi do validation, chúng ta in ra lỗi chi tiết hơn
        if (error.name === 'ValidationError') {
            console.error('❌ [DB-FAILURE] Validation Errors:', error.errors);
        }
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// --- 8. Xử lý Kết nối Socket.IO (Thiết lập Active Plant) ---
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Lắng nghe sự kiện khi Front-end chọn Cây khác/Thêm Cây mới.
    // plantId là ID của cây mà người dùng muốn theo dõi.
    socket.on('set_active_plant', async (plantId) => {
        // Kiểm tra xem plantId có phải là một ID hợp lệ (ví dụ: ObjectId) không
        if (!mongoose.Types.ObjectId.isValid(plantId)) {
            console.warn(`[SOCKET] Invalid Plant ID received: ${plantId}`);
            return;
        }

        // 1. Tắt Active Cũ (Rời khỏi các room cũ)
        socket.rooms.forEach(room => {
            if (room !== socket.id) socket.leave(room); 
        });

        // 2. Chuyển Active Mới (Tham gia Room mới)
        socket.join(plantId);
        console.log(`[SOCKET] Client ${socket.id} set active plant to ID: ${plantId}`);

        // 3. Cập nhật trạng thái active plant global trên server
        CURRENT_ACTIVE_PLANT_ID = plantId; 
        
        // 4. Gửi 10 bản ghi lịch sử CỦA PLANT ID NÀY
        try {
            const initialData = await SensorData.find({ plant_id: plantId }) 
                                                .sort({ timestamp: -1 })
                                                .limit(10);
            socket.emit('initial_data', initialData.reverse());
        } catch (error) {
            console.error('❌ Error fetching initial data:', error);
            socket.emit('initial_data', []);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        
        // NOTE: Không cần thiết lập CURRENT_ACTIVE_PLANT_ID = null khi 1 client disconnect, 
        // vì có thể có client khác đang xem. Biến này chỉ được thay đổi khi có lệnh 'set_active_plant'.
    });
});

// --- 9. Khởi động Server ---
server.listen(PORT, () => {
    console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
});