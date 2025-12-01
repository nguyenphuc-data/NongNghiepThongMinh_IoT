// routes/plantZoneRoutes.js – ĐÃ SỬA XONG, CHẠY NGON LẬP TỨC!!!
const express = require('express');
const router = express.Router();

// API: Lấy danh sách cây trong 1 zone + populate loại cây
router.get('/by-zone/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params; // ← ĐÃ SỬA ĐÚNG!!!

    const plants = await req.db.collection('plants')
      .aggregate([
        { $match: { zoneId } },
        {
          $lookup: {
            from: 'planttypes',
            localField: 'plantTypeId',
            foreignField: 'plantTypeId',
            as: 'plant_type_id'
          }
        },
        { $unwind: { path: '$plant_type_id', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: 1,
            zoneId: 1,
            deviceId: 1,
            datePlanted: 1,
            status: 1,
            thresholds: 1,
            warnings: 1,
            plant_type_id: {
              name: 1,
              thresholds: 1,
              warnings: 1,
              description: 1,
              watering_tips: 1,
              image_url: 1,
              icon_url: 1
            }
          }
        },
        { $sort: { name: 1 } }
      ])
      .toArray();

    res.json(plants);
  } catch (err) {
    console.error('Lỗi lấy cây theo zone:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;