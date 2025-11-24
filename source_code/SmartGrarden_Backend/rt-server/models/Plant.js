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

    date_planted: { 
        type: Date, 
        default: Date.now 
    },

    // === TÙY CHỈNH RIÊNG CHO TỪNG CÂY ===
    thresholds: {
        temp_min: { type: Number },
        temp_max: { type: Number },

        air_humidity_min: { type: Number },
        air_humidity_max: { type: Number },

        soil_moisture_min: { type: Number },
        soil_moisture_max: { type: Number },

        auto_water_duration: { type: Number } // giây tưới tự động
    },

    warnings: {
        temp_min:         { type: String },
        temp_max:         { type: String },
        air_humidity_min: { type: String },
        air_humidity_max: { type: String },
        soil_moisture_min:{ type: String },
        soil_moisture_max:{ type: String }
    }

}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual để tự động điền thresholds + warnings từ PlantType nếu chưa có
PlantSchema.virtual('type', {
    ref: 'PlantType',
    localField: 'plant_type_id',
    foreignField: '_id',
    justOne: true
});

PlantSchema.pre('save', async function(next) {
    if (!this.isModified('thresholds') && !this.thresholds?.temp_min) {
        const type = await this.model('PlantType').findById(this.plant_type_id);
        if (type) {
            this.thresholds = { ...type.defaultThresholds };
            this.warnings = { ...type.defaultWarnings };
        }
    }
    next();
});

module.exports = mongoose.model('Plant', PlantSchema);