// models/Plant.js
const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        default: 'Vườn chính'
    },
    device_key: {
        type: String,
        required: true
    },
    plant_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlantType',
        required: true
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        required: true
    },
    date_planted: {
        type: Date,
        default: Date.now
    },

    // Ngưỡng riêng của từng cây (có thể khác với loại cây)
    thresholds: {
        temp_min: { type: Number },
        temp_max: { type: Number },
        air_humidity_min: { type: Number },
        air_humidity_max: { type: Number },
        soil_moisture_min: { type: Number },
        soil_moisture_max: { type: Number },
        auto_water_duration: { type: Number }
    },

    warnings: {
        low_temp: String,
        high_temp: String,
        low_humidity: String,
        high_humidity: String,
        low_soil: String,
        high_soil: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual để lấy thông tin loại cây nếu chưa có thresholds riêng
PlantSchema.virtual('type', {
    ref: 'PlantType',
    localField: 'plant_type_id',
    foreignField: '_id',
    justOne: true
});

// Tự động điền thresholds + warnings từ PlantType nếu cây chưa có
PlantSchema.pre('save', async function(next) {
    if (!this.thresholds?.temp_min || Object.keys(this.thresholds).length === 0) {
        try {
            const PlantType = mongoose.model('PlantType');
            const type = await PlantType.findById(this.plant_type_id);
            if (type) {
                this.thresholds = { ...type.defaultThresholds };
                this.warnings = { ...type.defaultWarnings };
            }
        } catch (err) {
            console.error('Lỗi lấy defaultThresholds:', err);
        }
    }
    next();
});

module.exports = mongoose.model('Plant', PlantSchema);