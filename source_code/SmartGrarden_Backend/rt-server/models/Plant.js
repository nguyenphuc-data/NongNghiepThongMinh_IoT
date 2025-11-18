// models/Plant.js (Đã loại bỏ unique: true)
const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, // Tên cây vẫn phải là duy nhất
        trim: true 
    }, 
    location: { 
        type: String, 
        default: 'Vườn chính' 
    }, 
    
    // Chỉ cần là String, không cần unique vì chỉ có một ESP32
    device_key: { 
        type: String, 
        required: true 
    }, 
    
    plant_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlantType', 
        required: true
    },
    
    date_planted: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plant', PlantSchema);