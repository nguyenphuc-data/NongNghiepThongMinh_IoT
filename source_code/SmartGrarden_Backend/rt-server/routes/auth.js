// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Giả định một khóa bí mật (THAY ĐỔI TRONG MÔI TRƯỜNG THẬT)
const JWT_SECRET = 'your_super_secret_key_for_iot_project'; 

// === 1. Đăng ký người dùng mới (Register) ===
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Kiểm tra người dùng đã tồn tại chưa
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại.' });
        }

        // Mã hóa mật khẩu (HASHING)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo và lưu người dùng mới
        user = new User({
            username,
            password: hashedPassword,
        });
        await user.save();

        res.status(201).json({ message: 'Đăng ký thành công.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// === 2. Đăng nhập (Login) ===
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('\n=======================================');
    console.log(`[DEBUG LOG] Dữ liệu nhận: Username: ${username}, Password: ${password}`);
    try {
        // 1. Kiểm tra người dùng
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Thông tin đăng nhập không hợp lệ.' });
        }

        let isMatch = false; 
        isMatch = (password === user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Thông tin đăng nhập không hợp lệ.' });
        }

        const payload = { userId: user.id, username: user.username };
        
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, username: user.username });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;