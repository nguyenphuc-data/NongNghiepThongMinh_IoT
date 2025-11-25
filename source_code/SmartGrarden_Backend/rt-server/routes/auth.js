// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

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

    // LẤY ZONES
    let zones = [];
    if (user.role === 'admin') {
      zones = await mongoose.connection.db.collection('zones').find({}).toArray();
    } else if (user.allowedZones?.length > 0) {
      zones = await mongoose.connection.db.collection('zones')
        .find({ zoneId: { $in: user.allowedZones } }).toArray();
    }

    // LƯU VÀO SESSION
    req.session.user = {
      id: user._id,
      username: user.username,
      fullName: user.fullName || user.username,
      role: user.role
    };

    res.json({
      success: true,
      user: req.session.user,
      zones
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;