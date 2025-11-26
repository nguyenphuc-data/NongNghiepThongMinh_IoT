// models/Plant.js – PHIÊN BẢN HOÀN CHỈNH VỚI thresholds & warnings
const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  plantTypeId: {
    type: String,           // "ca_chua", "dua_leo",...
    required: true
  },
  zoneId: {
    type: String,
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
  },

  // THÊM 2 FIELD MỚI – ĐÂY LÀ ĐIỀU BẠN MUỐN!
  thresholds: {
    type: {
      temp_min: { type: Number, default: 18 },
      temp_max: { type: Number, default: 32 },
      air_humidity_min: { type: Number, default: 50 },
      air_humidity_max: { type: Number, default: 85 },
      soil_moisture_min: { type: Number, default: 40 },
      soil_moisture_max: { type: Number, default: 75 },
      auto_water_duration: { type: Number, default: 10 } // giây
    },
    default: () => ({
      temp_min: 18,
      temp_max: 32,
      air_humidity_min: 50,
      air_humidity_max: 85,
      soil_moisture_min: 40,
      soil_moisture_max: 75,
      auto_water_duration: 10
    })
  },

  warnings: {
    type: {
      temp_min: { type: String, default: '' },
      temp_max: { type: String, default: '' },
      air_humidity_min: { type: String, default: '' },
      air_humidity_max: { type: String, default: '' },
      soil_moisture_min: { type: String, default: '' },
      soil_moisture_max: { type: String, default: '' }
    },
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual để lấy thông tin loại cây (tên, ảnh, ngưỡng mặc định,...)
PlantSchema.virtual('typeInfo', {
  ref: 'PlantType',
  localField: 'plantTypeId',
  foreignField: 'plantTypeId',
  justOne: true
});

module.exports = mongoose.model('Plant', PlantSchema);