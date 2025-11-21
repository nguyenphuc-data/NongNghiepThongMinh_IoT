const mongoose = require('mongoose');

const PlantTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },

    // THRESHOLDS – ĐÃ THÊM AIR HUMIDITY + BỎ auto_water, CHỈ GIỮ duration
    thresholds: {
        temp_min: { type: Number, default: 18 },
        temp_max: { type: Number, default: 30 },

        air_humidity_min: { type: Number, default: 40 },   // thêm cảnh báo độ ẩm không khí
        air_humidity_max: { type: Number, default: 85 },   // thêm cảnh báo độ ẩm không khí

        soil_moisture_min: { type: Number, default: 35 },
        soil_moisture_max: { type: Number, default: 70 },

        auto_water_duration: { type: Number, default: 8 }  // còn lại: mỗi lần tưới tự động bao nhiêu giây (8s ≈ 1 lít)
        // → BỎ auto_water (bật/tắt tự động) → bạn sẽ điều khiển thủ công ở frontend hoặc garden settings
    },

    // CẢNH BÁO ĐẸP – ĐÃ CÓ CẢ AIR HUMIDITY
    warnings: {
        low_temp:     { type: String, default: "Nhiệt độ quá thấp, cây phát triển chậm." },
        high_temp:    { type: String, default: "Nhiệt độ quá cao, dễ cháy lá!" },
        low_humidity: { type: String, default: "Độ ẩm không khí thấp, cây dễ mất nước." },
        high_humidity:{ type: String, default: "Độ ẩm không khí quá cao, dễ bị nấm mốc." },
        low_soil:     { type: String, default: "Đất quá khô! Cần tưới ngay để tránh cây héo." },
        high_soil:    { type: String, default: "Đất quá ẩm, dễ thối rễ. Hãy ngừng tưới tạm thời." }
    },

    description:   { type: String, default: 'Không có mô tả' },
    watering_tips: { type: String, default: 'Tưới đều đặn vào sáng sớm hoặc chiều mát.' },
    light:         { type: String, default: 'Ánh sáng toàn phần' },
    growth_time_days: { type: Number, default: 45 },
    image_url:     { type: String }

}, { timestamps: true });

module.exports = mongoose.model('PlantType', PlantTypeSchema);