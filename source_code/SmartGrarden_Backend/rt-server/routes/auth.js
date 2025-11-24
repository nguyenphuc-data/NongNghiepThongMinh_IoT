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
    let { username, password } = req.body;

    // SIÊU QUAN TRỌNG: Loại bỏ khoảng trắng thừa
    if (username) username = username.trim();
    if (password) password = password.trim();

    console.log('=======================================');
    console.log('Dữ liệu nhận được:', { username, password });
    console.log('Độ dài password:', password?.length);

    try {
        // Tìm user (không phân biệt hoa thường - khuyến khích)
        const user = await User.findOne({ 
            username: { $regex: `^${username}$`, $options: 'i' } 
        });

        if (!user) {
            console.log('Không tìm thấy user:', username);
            return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        console.log('User tìm thấy:', user.username);
        console.log('Password trong DB:', user.password);
        console.log('Password người dùng nhập:', password);

        // So sánh chính xác từng ký tự (plain text)
        if (password !== user.password) {
            console.log('Mật khẩu KHÔNG khớp!');
            return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        // Thành công → tạo token
        const payload = { userId: user._id, username: user.username };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || "your_very_secret_key_here", // ĐẢM BẢO có giá trị
            { expiresIn: '7d' }
        );

        console.log('Đăng nhập THÀNH CÔNG:', user.username);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (err) {
        console.error('Lỗi server:', err.message);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;