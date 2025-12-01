// routes/camRoutes.js – PHIÊN BẢN ĐÃ SỬA, KHÔNG BAO GIỜ GÂY RESTART NỮA!
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const LATEST_JSON = path.join(__dirname, '../public/latest_ai_result.json');

router.get('/snapshot', (req, res) => {
  try {
    if (!fs.existsSync(LATEST_JSON)) {
      return res.json({
        success: false,
        message: "Chưa có dữ liệu AI. ESP32-CAM chưa gửi ảnh hoặc Python chưa chạy."
      });
    }

    const raw = fs.readFileSync(LATEST_JSON, 'utf-8');
    const data = JSON.parse(raw);

    const photoPath = path.join(__dirname, '..', 'public', data.photo.replace(/^\//, ''));
    if (!fs.existsSync(photoPath)) {
      return res.json({
        success: false,
        message: "Đang xử lý ảnh... Vui lòng thử lại sau 2 giây!"
      });
    }

    res.json({
      success: true,
      data: {
        plant: data.plant,
        confidence: data.confidence,
        photo: data.photo,
        timestamp: data.timestamp || Date.now()
      }
    });

  } catch (err) {
    console.error("Lỗi /cam/snapshot:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server AI CAM"
    });
  }
});

module.exports = router;