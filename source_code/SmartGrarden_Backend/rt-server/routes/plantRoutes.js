// routes/plantRoutes.js
const express = require('express');
const router = express.Router();
const PlantType = require('../models/PlantType'); // Giả định đường dẫn models/PlantType.js
const Plant = require('../models/Plant');         // Giả định đường dẫn models/Plant.js

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
  try {
    const type = await PlantType.findById(req.params.id);
    if (!type) return res.status(404).json({ message: 'Không tìm thấy loại cây' });
    console.log(`[API/TYPE] Fetched plant type: ${type.name}`);
    res.json(type);
  } catch (err) {
    console.error('[API/TYPE] ERROR:', err.message);
    res.status(500).json({ message: err.message });
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
    const { name, location, device_key, plant_type_id } = req.body;
    
    // Giả định bạn đã có logic kiểm tra thiết bị_key duy nhất (SINGLE_ESP32_KEY)
    if (device_key !== 'esp32_vuonrau') {
         return res.status(400).json({ message: 'Invalid device key for this setup.' });
    }
    
    const newPlant = new Plant({
        name,
        location,
        device_key,
        plant_type_id
    });

    try {
        const plant = await newPlant.save();
        // Lấy lại thông tin đầy đủ để trả về (có populating)
        const populatedPlant = await Plant.findById(plant._id).populate('plant_type_id', 'name thresholds');

        res.status(201).json(populatedPlant);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;