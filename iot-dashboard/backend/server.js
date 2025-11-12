const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Sensor = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" }
});

app.use(cors());

// Lấy dữ liệu mới nhất
app.get('/api/latest', async (req, res) => {
  try {
    const latest = await Sensor.findOne().sort({ received_at: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy 50 bản ghi gần nhất cho biểu đồ
app.get('/api/history', async (req, res) => {
  try {
    const history = await Sensor.find()
      .sort({ received_at: -1 })
      .limit(50);
    res.json(history.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Theo dõi thay đổi trong MongoDB (thời gian thực)
const changeStream = Sensor.watch();
changeStream.on('change', (change) => {
  if (change.operationType === 'insert') {
    io.emit('new-data', change.fullDocument);
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});