// // routes/recognitionRoutes.js – HOÀN HẢO CHO DỮ LIỆU CỦA BẠN
// const express = require('express');
// const router = express.Router();
// const mongoose = require('mongoose');

// // Chỉ cần kết nối DB chứa recognitions
// const IOT_SENSORS_URI = 'mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/iot_sensors';

// let recognitionsCollection = null;

// (async () => {
//   try {
//     const conn = await mongoose.createConnection(IOT_SENSORS_URI, {
//       bufferCommands: false,
//     }).asPromise();
//     recognitionsCollection = conn.collection('recognitions');
//     console.log('Kết nối iot_sensors.recognitions thành công!');
//   } catch (err) {
//     console.warn('Lỗi kết nối DB AI:', err.message);
//   }
// })();

// // BẢN MAP CHUẨN NHẤT CHO DỮ LIỆU HIỆN TẠI CỦA BẠN
// const CAMERA_TO_ZONE = {
//   'colab_camera': 'zone_vuon_chinh',     // ← Đây là cái đang có dữ liệu AI
//   // 'camera_2': 'zone_vuon_phu',
//   // 'camera_3': 'zone_nha_luoi',
//   // Thêm sau khi có camera mới
// };

// // API: Lấy cây AI mới nhất theo zoneId
// router.get('/latest-one/:zoneId', async (req, res) => {
//   if (!recognitionsCollection) {
//     return res.json(null);
//   }

//   const { zoneId } = req.params;

//   // Tìm camera tương ứng với zone này
//   const cameraSource = Object.keys(CAMERA_TO_ZONE).find(
//     key => CAMERA_TO_ZONE[key] === zoneId
//   );

//   if (!cameraSource) {
//     return res.json(null); // zone chưa được map
//   }

//   try {
//     const latest = await recognitionsCollection
//       .find({ source: cameraSource })
//       .sort({ timestamp: -1 })
//       .limit(1)
//       .next();

//     if (!latest) return res.json(null);

//     res.json({
//       predictedName: (latest.plant || 'Không xác định').trim(),
//       confidence: latest.confidence || 0,
//       recognizedAt: latest.timestamp || new Date(),
//       source: latest.source,
//       imageId: latest.imageId || null
//     });
//   } catch (err) {
//     console.error('Lỗi lấy AI:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;

// routes/recognitionRoutes.js – PHIÊN BẢN SIÊU NHANH, SIÊU ĐƠN GIẢN
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const IOT_SENSORS_URI = 'mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/iot_sensors';

let recognitions = null;

(async () => {
  try {
    const conn = await mongoose.createConnection(IOT_SENSORS_URI).asPromise();
    recognitions = conn.collection('recognitions');
    console.log('Kết nối recognitions thành công – sẵn sàng trả cây AI!');
  } catch (err) {
    console.warn('Lỗi kết nối DB AI:', err.message);
  }
})();

// API: Lấy cây AI MỚI NHẤT (không cần zone, không cần mapping)
router.get('/latest-global', async (req, res) => {
  if (!recognitions) return res.json(null);

  try {
    const latest = await recognitions
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .next();

    if (!latest) return res.json(null);

    res.json({
      predictedName: (latest.plant || 'Không xác định').trim(),
      confidence: latest.confidence || 0,
      recognizedAt: latest.timestamp,
      source: latest.source || 'unknown',
      imageId: latest.imageId || null
    });
  } catch (err) {
    console.error('Lỗi lấy cây AI:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;