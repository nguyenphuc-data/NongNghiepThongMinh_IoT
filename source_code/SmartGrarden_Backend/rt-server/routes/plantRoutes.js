// routes/plantRoutes.js – ĐÃ SỬA HOÀN CHỈNH, CHẤP NHẬN plant_type_id = "ca_chua", zoneId = "zone_01"
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const PlantType = require('../models/PlantType');

// Middleware (giữ nguyên)
const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
  req.user = req.session.user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.session.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới được thực hiện' });
  }
  next();
};

// GET: Lấy cây theo zone
router.get('/', async (req, res) => {
  const { zoneId } = req.query;
  if (!zoneId) return res.status(400).json({ message: 'Thiếu zoneId' });

  // Nếu zoneId là string (ví dụ: "zone_vuon_chinh") thì tìm ObjectId thật
  let realZoneId = zoneId;
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    const zone = await mongoose.connection.db.collection('zones').findOne({ zoneId: zoneId });
    if (!zone) return res.status(400).json({ message: 'Khu vực không tồn tại' });
    realZoneId = zone._id;
  }

  const plants = await Plant.find({ zoneId: realZoneId })
    .populate('plant_type_id', 'name image_url code thresholds warnings')
    .lean();

  res.json(plants);
});

// GET: Danh sách loại cây
router.get('/types', async (req, res) => {
  const types = await PlantType.find().lean();
  res.json(types);
});

// POST: Thêm cây mới – CHẤP NHẬN CẢ STRING VÀ OBJECTID
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, plantTypeId, zoneId, deviceId, datePlanted } = req.body;

    if (!name || !plantTypeId || !zoneId) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const newPlant = new Plant({
      name: name.trim(),
      plantTypeId,
      zoneId,
      deviceId: deviceId || 'esp32_vuonrau',
      datePlanted: datePlanted || new Date(),
    });

    const saved = await newPlant.save();
    const populated = await Plant.findById(saved._id).populate('typeInfo', 'name image_url').lean();

    res.status(201).json(populated);
  } catch (err) {
    console.error('Lỗi thêm cây:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// === XÓA CÂY – CHỈ ADMIN ===
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const plantId = req.params.id;

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(plantId)) {
      return res.status(400).json({ message: 'ID cây không hợp lệ' });
    }

    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ message: 'Không tìm thấy cây này' });
    }

    // XÓA THẬT (hoặc có thể dùng soft-delete: set status = 'deleted')
    await Plant.findByIdAndDelete(plantId);

    // Gợi ý: nếu bạn có lưu dữ liệu cảm biến theo plant_id thì cũng nên xóa luôn
    // await SensorData.deleteMany({ plant_id: plantId });

    console.log(`[XÓA CÂY] Admin ${req.user.username} đã xóa cây: ${plant.name} (${plantId})`);
    res.json({ 
      success: true, 
      message: 'Đã xóa cây thành công!',
      deletedPlant: plant 
    });

  } catch (err) {
    console.error('Lỗi xóa cây:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;