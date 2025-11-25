// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String },
    role: { 
        type: String, 
        enum: ['admin', 'worker'], 
        default: 'worker' 
    },
    allowedZones: [{ type: String }], // admin để rỗng = toàn quyền
    phone: String,
    email: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
});

module.exports = mongoose.model('User', userSchema);