// routes/plantRoutes.js
const express = require('express');
const router = express.Router();
const PlantType = require('../models/PlantType'); // Giả định đường dẫn models/PlantType.js
const Plant = require('../models/Plant');         // Giả định đường dẫn models/Plant.js


router.get('/', async (req, res) => {
    try {
        let query = Plant.find();

        // Luôn populate nếu không có query hoặc có yêu cầu populate
        if (!req.query.populate || req.query.populate === 'plant_type_id') {
            query = query.populate('plant_type_id', 'name thresholds warnings description watering_tips light growth_time_days image_url');
        }

        const plants = await query.lean(); // lean() cho tốc độ nhanh hơn
        res.json(plants);
    } catch (err) {
        console.error('[API/PLANTS] Lỗi:', err.message);
        res.status(500).json({ message: err.message });
    }
});
// [GET] /api/plants/types - Lấy danh sách các loại cây
router.get('/types', async (req, res) => {
    // ⭐ LOG 1: Bắt đầu xử lý request
    console.log('[API/TYPES] Request received to fetch plant types.'); 

    try {
        const types = await PlantType.find();
        
        // ⭐ LOG 2: Kiểm tra số lượng bản ghi tìm thấy
        console.log(`[API/TYPES] Found ${types.length} plant types.`);
        
        // ⭐ LOG 3: Log 5 bản ghi đầu tiên (để kiểm tra dữ liệu)
        if (types.length > 0) {
            console.log('[API/TYPES] Sample data:', types.slice(0, 5).map(t => ({ _id: t._id, name: t.name })));
        }

        res.json(types);
    } catch (err) {
        // ⭐ LOG 4: Bắt lỗi nếu truy vấn DB thất bại
        console.error('[API/TYPES] ERROR during database query:', err.message);
        res.status(500).json({ message: err.message });
    }
});

router.get('/types/:id', async (req, res) => {
  const id = req.params.id.trim();
  
  console.log('[API/TYPE] Đang tìm loại cây với ID:', id);

  try {
    // ĐƠN GIẢN – NHANH – CHUẨN – VÌ _id BÂY GIỜ ĐÃ LÀ ObjectId THẬT SỰ
    const type = await PlantType.findById(id);

    if (!type) {
      console.log('[API/TYPE] Không tìm thấy loại cây với ID:', id);
      return res.status(404).json({ message: 'Không tìm thấy loại cây' });
    }

    console.log('[API/TYPE] TÌM THẤY →', type.name);
    res.json(type);

  } catch (err) {
    // Nếu ID không hợp lệ (không phải 24 ký tự hex), mongoose sẽ ném lỗi
    if (err.name === 'CastError') {
      console.log('[API/TYPE] ID không hợp lệ:', id);
      return res.status(400).json({ message: 'ID loại cây không hợp lệ' });
    }

    console.error('[API/TYPE] Lỗi server:', err.message);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// [GET] /api/plants - Lấy danh sách các cây cụ thể (Đã gieo trồng)
router.get('/', async (req, res) => {
    try {
        // Sử dụng populate để lấy thông tin loại cây kèm theo
        const plants = await Plant.find().populate('plant_type_id', 'name thresholds');
        res.json(plants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [POST] /api/plants - Thêm cây mới
router.post('/', async (req, res) => {
    const { 
        name, 
        location, 
        device_key, 
        plant_type_id,
        thresholds,
        warnings
    } = req.body;
    
    if (device_key !== 'esp32_vuonrau') {
         return res.status(400).json({ message: 'Invalid device key for this setup.' });
    }
    
    const newPlant = new Plant({
        name,
        location,
        device_key,
        plant_type_id,
        thresholds: thresholds || undefined,
        warnings: warnings || undefined
    });

    try {
        const plant = await newPlant.save();
        const populatedPlant = await Plant.findById(plant._id)
            .populate('plant_type_id', 'name thresholds warnings description watering_tips light growth_time_days image_url');

        res.status(201).json(populatedPlant); // ← chỉ trả về plant đã populate đầy đủ
    } catch (err) {
        console.error("Lỗi tạo cây:", err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;