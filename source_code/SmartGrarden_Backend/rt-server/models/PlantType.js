const mongoose = require('mongoose');

const PlantTypeSchema = new mongoose.Schema({
    // Sử dụng String và đảm bảo tính duy nhất
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    thresholds: {
        temp_max: { type: Number, default: 30 }, 
        temp_min: { type: Number, default: 18 },
        soil_moisture_min: { type: Number, default: 30 }, 
        soil_moisture_max: { type: Number, default: 70 },
    },
    description: {
        type: String,
        default: 'Không có mô tả'
    }
});

module.exports = mongoose.model('PlantType', PlantTypeSchema);