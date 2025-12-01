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
router.get('/types/:identifier', async (req, res) => {
  console.log('Fetching plant type with identifier:', req.params.identifier);

  try {
    const identifier = req.params.identifier.trim();
    if (!identifier) {
      return res.status(400).json({ message: 'Thiếu identifier' });
    }

    let plantType = null;

    // 1. Ưu tiên tìm theo CODE (không phân biệt hoa thường)
    plantType = await PlantType.findOne({ 
      code: identifier.toLowerCase() 
    }).select('name code thresholds warnings image_url description').lean();

    // 2. Nếu không tìm thấy bằng code → tìm theo NAME (có dấu, không phân biệt hoa thường)
    if (!plantType) {
      plantType = await PlantType.findOne({ 
        name: { $regex: '^' + identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', $options: 'i' }
      }).select('name code thresholds warnings image_url description').lean();
    }

    // 3. Nếu vẫn chưa có → mới thử tìm theo ObjectId
    if (!plantType && mongoose.Types.ObjectId.isValid(identifier)) {
      plantType = await PlantType.findById(identifier)
        .select('name code thresholds warnings image_url description')
        .lean();
    }

    // 4. Không tìm thấy gì → báo lỗi rõ ràng
    if (!plantType) {
      return res.status(404).json({ 
        message: `Không tìm thấy loại cây với: "${identifier}" (code/name/id)` 
      });
    }

    console.log('Tìm thấy loại cây:', plantType.name, '(code:', plantType.code, ')');
    res.json(plantType);

  } catch (err) {
    console.error('Lỗi lấy loại cây:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
// POST: Thêm cây mới – CHẤP NHẬN CẢ STRING VÀ OBJECTID
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      plantTypeId,
      zoneId,
      deviceId,
      datePlanted,
      thresholds,   // NHẬN thresholds từ frontend
      warnings      // NHẬN warnings từ frontend
    } = req.body;

    // Kiểm tra bắt buộc
    if (!name || !plantTypeId || !zoneId) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: name, plantTypeId, zoneId' 
      });
    }

    // Tạo object plant mới
    const newPlant = new Plant({
      name: name.trim(),
      plantTypeId,
      zoneId,
      deviceId: deviceId || 'esp32_vuonrau',
      datePlanted: datePlanted || new Date(),

      // GHI ĐÈ HOẶC THÊM MỚI thresholds + warnings
      thresholds: thresholds || {},     // nếu frontend không gửi → để rỗng (hoặc có thể lấy từ plantType)
      warnings: warnings || {}          // nếu frontend không gửi → để rỗng
    });

    // Lưu vào DB
    const saved = await newPlant.save();

    // Populate thông tin loại cây (để frontend hiển thị tên + ảnh)
    const populated = await Plant.findById(saved._id)
      .populate('typeInfo', 'name code image_url description')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    console.error('Lỗi thêm cây:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
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