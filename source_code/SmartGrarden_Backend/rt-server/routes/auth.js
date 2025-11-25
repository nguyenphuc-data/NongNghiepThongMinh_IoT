// routes/auth.js – FILE HOÀN CHỈNH, CHẠY NGON NGAY
const express = require('express');
const router = express.Router();        // ← DÒNG NÀY BỊ THIẾU!!!
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'smartgarden_super_secret_2025';

// ==================== ĐĂNG NHẬP ====================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({
            username: { $regex: `^${username.trim()}$`, $options: 'i' },
            isActive: true
        });

        if (!user || password !== user.password) {
            return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        // Cập nhật lần đăng nhập cuối
        user.lastLogin = new Date();
        await user.save();

        // LẤY DANH SÁCH ZONE THEO QUYỀN
        let zones = [];
        if (user.role === 'admin') {
            zones = await mongoose.connection.db.collection('zones')
            .find({ isActive: { $ne: false } })
            .toArray();
        } else if (user.allowedZones?.length > 0) {
            zones = await mongoose.connection.db.collection('zones')
            .find({ 
                zoneId: { $in: user.allowedZones },
                isActive: { $ne: false } 
            })
            .toArray();
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName || user.username,
                role: user.role
            },
            zones
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Nếu bạn còn route register thì để ở đây, còn không thì xóa luôn cũng được
// router.post('/register', async (req, res) => { ... });

module.exports = router;