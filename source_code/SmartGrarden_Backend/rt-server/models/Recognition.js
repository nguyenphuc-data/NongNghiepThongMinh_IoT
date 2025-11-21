// models/Recognition.js
const mongoose = require('mongoose');

const RecognitionSchema = new mongoose.Schema({
  plant: { type: String, required: true },        // "Cà chua", "Bí đỏ",...
  confidence: { type: Number, required: true },   // 0.3698...
  source: { type: String, default: 'webcam_once' },
  model_version: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Recognition', RecognitionSchema);