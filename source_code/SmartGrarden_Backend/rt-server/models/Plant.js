// models/Plant.js – PHIÊN BẢN SẠCH SẼ NHẤT, CHỈ CÓ 7 TRƯỜNG BẠN MUỐN
const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  plantTypeId: {
    type: String,           // ← DÙNG CHUỖI: "ca_chua", "dua_leo",...
    required: true
  },
  zoneId: {
    type: String,           // ← DÙNG CHUỖI: "zone_vuon_chinh", "zone_nha_luoi",...
    required: true
  },
  deviceId: {
    type: String,
    default: 'esp32_vuonrau'
  },
  datePlanted: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['growing', 'harvested', 'failed'],
    default: 'growing'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual để lấy thông tin loại cây (nếu cần hiển thị tên, ảnh, ngưỡng...)
PlantSchema.virtual('typeInfo', {
  ref: 'PlantType',
  localField: 'plantTypeId',
  foreignField: 'plantTypeId',
  justOne: true
});

module.exports = mongoose.model('Plant', PlantSchema);