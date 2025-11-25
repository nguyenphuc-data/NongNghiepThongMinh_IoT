// models/PlantType.js
const mongoose = require('mongoose');

const PlantTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image_url: {
        type: String,
        default: ''
    },
    growth_time_days: {
        type: Number,
        default: 60
    },
    light: {
        type: String,
        default: 'Ánh sáng mạnh'
    },
    watering_tips: {
        type: String,
        default: 'Tưới đều đặn, giữ ẩm vừa phải'
    },

    // Ngưỡng mặc định cho loại cây này
    defaultThresholds: {
        temp_min: { type: Number, default: 18 },
        temp_max: { type: Number, default: 32 },
        air_humidity_min: { type: Number, default: 40 },
        air_humidity_max: { type: Number, default: 85 },
        soil_moisture_min: { type: Number, default: 35 },
        soil_moisture_max: { type: Number, default: 70 },
        auto_water_duration: { type: Number, default: 8 } // giây
    },

    // Cảnh báo mặc định
    defaultWarnings: {
        low_temp: { type: String, default: 'Nhiệt độ quá thấp, cây phát triển chậm.' },
        high_temp: { type: String, default: 'Nhiệt độ quá cao, dễ cháy lá!' },
        low_humidity: { type: String, default: 'Độ ẩm không khí thấp, cây bị héo.' },
        high_humidity: { type: String, default: 'Độ ẩm quá cao, dễ bị nấm mốc.' },
        low_soil: { type: String, default: 'Đất quá khô! Cần tưới ngay để tránh héo.' },
        high_soil: { type: String, default: 'Đất quá ướt, dễ thối rễ. Hãy giảm tưới.' }
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlantType', PlantTypeSchema);