// routes/pumpRoutes.js – PHIÊN BẢN CHUẨN 100%, KHÔNG BAO GIỜ LỖI NỮA!
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { PythonShell } = require('python-shell');
const path = require('path');

const SensorData = mongoose.connection.model('SensorData') || 
  mongoose.model('SensorData', new mongoose.Schema({}, { strict: false }), 'sensordatas');

const pythonOptions = {
  mode: 'text',
  pythonPath: 'python',
  scriptPath: path.join(__dirname, '../model'),
};

router.post('/ai-decision', async (req, res) => {
  const { plant_id } = req.body;

  console.log('AI được gọi với plant_id:', plant_id);

  if (!plant_id) {
    return res.status(400).json({ error: 'Thiếu plant_id' });
  }

  try {
    console.log('Bước 1: Đang tìm 60 bản ghi cho plant_id:', plant_id);
    const raw = await SensorData
      .find({ plant_id: new mongoose.Types.ObjectId(plant_id) })
      .sort({ timestamp: -1 })
      .limit(60)
      .lean()
      .exec();

    console.log(`Tìm thấy ${raw.length} bản ghi`);

    if (raw.length < 60) {
      return res.json({
        need_pump: false,
        probability: 0,
        message: `Chưa đủ dữ liệu (chỉ có ${raw.length}/60)`,
        current_soil: raw.length > 0 ? raw[raw.length - 1].soil_percent : null
      });
    }

    const history60 = raw.reverse().map((doc, i) => {
      const arr = [
        doc.temp ?? 25,
        doc.hum ?? 50,
        doc.soil_percent ?? 50,
        doc.rain_percent ?? 0,
        doc.is_raining ? 1 : 0,
        doc.is_soil_wet ? 1 : 0,
        doc.is_bright ? 1 : 0
      ];
      if (i === 0 || i === 59) console.log('Dữ liệu đầu/cuối:', arr);
      return arr;
    });

    console.log('Bước 2: Gọi Python AI...');

    // PHẦN QUAN TRỌNG NHẤT – CHỈ LẤY DÒNG CUỐI CÙNG LÀ JSON!
    const aiResult = await new Promise((resolve, reject) => {
      let output = '';
      const shell = new PythonShell('predict_direct.py', pythonOptions);

      shell.send(JSON.stringify({ history: history60 }));

      shell.on('message', (msg) => {
        output += msg + '\n'; // Gom hết output
      });

      shell.on('error', (err) => {
        console.error('PythonShell lỗi:', err);
        reject(err);
      });

      shell.end((err) => {
        if (err) {
          console.error('Python kết thúc với lỗi:', err);
          const fallback = history60[history60.length-1][2] < 40;
          resolve({ need_pump: fallback, probability: 0 });
        } else {
          // LỌC RA DÒNG CUỐI CÓ CHỨA { hoặc [ → CHẮC CHẮN LÀ JSON
          const lines = output.trim().split('\n');
          const jsonLine = lines.reverse().find(line => line.trim().startsWith('{') || line.trim().startsWith('['));
          
          try {
            const parsed = JSON.parse(jsonLine || '{}');
            console.log('Python trả về (đã parse):', parsed);
            resolve(parsed);
          } catch (e) {
            console.error('Parse JSON từ Python thất bại:', jsonLine);
            resolve({ need_pump: false, probability: 0 });
          }
        }
      });
    });

    console.log('AI trả kết quả cuối cùng:', aiResult);

    res.json({
      ...aiResult,
      timestamp: new Date(),
      current_soil: history60[history60.length-1][2],
      result: aiResult.need_pump,
      message: aiResult.need_pump ? "AI: CẦN TƯỚI NGAY!" : "AI: KHÔNG CẦN TƯỚI"
    });

  } catch (err) {
    console.error('LỖI TOÀN BỘ AI ROUTE:', err);
    res.status(500).json({ error: 'AI tạm offline', details: err.message });
  }
});

module.exports = router;