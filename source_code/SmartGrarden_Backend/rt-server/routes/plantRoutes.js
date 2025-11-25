// routes/plantRoutes.js
const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const PlantType = require('../models/PlantType'); // THÊM DÒNG NÀY
// GET: Lấy cây theo zone (bắt buộc có zoneId)
router.get('/', async (req, res) => {
    try {
        const { zoneId } = req.query;
        if (!zoneId) {
            return res.status(400).json({ message: 'Thiếu zoneId' });
        }

        const plants = await Plant.find({ zoneId })
            .populate('plant_type_id', 'name thresholds warnings description watering_tips light growth_time_days image_url')
            .lean();

        res.json(plants);
    } catch (err) {
        console.error('[API/PLANTS] Lỗi:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// GET: Lấy tất cả loại cây
router.get('/types', async (req, res) => {
    try {
        const types = await PlantType.find().lean();
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Chi tiết 1 loại cây
router.get('/types/:id', async (req, res) => {
    try {
        const type = await PlantType.findById(req.params.id);
        if (!type) return res.status(404).json({ message: 'Không tìm thấy loại cây' });
        res.json(type);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Thêm cây mới – BẮT BUỘC CÓ zoneId
router.post('/', async (req, res) => {
    const { name, location, device_key, plant_type_id, zoneId, thresholds, warnings } = req.body;

    if (!zoneId) {
        return res.status(400).json({ message: 'Vui lòng chọn khu vực (zone)!' });
    }
    if (device_key !== 'esp32_vuonrau') {
        return res.status(400).json({ message: 'Device key không hợp lệ!' });
    }

    const newPlant = new Plant({
        name,
        location: location || 'Vườn chính',
        device_key,
        plant_type_id,
        zoneId,
        thresholds,
        warnings
    });

    try {
        const saved = await newPlant.save();
        const populated = await Plant.findById(saved._id)
            .populate('plant_type_id', 'name thresholds warnings description watering_tips light growth_time_days image_url')
            .lean();

        res.status(201).json(populated);
    } catch (err) {
        console.error('Lỗi tạo cây:', err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;