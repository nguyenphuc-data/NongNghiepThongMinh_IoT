const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
    temp: { type: Number, required: true }, 
    hum: { type: Number, required: true }, 
    soil_percent: { type: Number, required: true }, 
    rain_percent: { type: Number, required: true, min: 0, max: 100 },
    is_raining: { type: Boolean, required: true },
    is_bright: { type: Boolean, required: true },
    pump: { type: String, enum: ['ON', 'OFF'], required: true },
    
    // Liên kết tới Cây cụ thể
    plant_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant', 
        required: true 
    }, 
    
    device: { type: String, default: 'esp32_gateway' },
    timestamp: { type: Date, default: Date.now, expires: '180d' }
});

module.exports = mongoose.model('SensorData', sensorSchema);