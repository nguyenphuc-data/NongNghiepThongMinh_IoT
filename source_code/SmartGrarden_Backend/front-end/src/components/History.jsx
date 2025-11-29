// src/components/History.jsx – SIÊU SẠCH, SIÊU ĐẸP, NGÀY NẰM DƯỚI ĐÁY, KHÔNG CÒN GÌ THỪA!
import React, { useRef, useEffect, useState } from 'react';

const History = ({ activePlant, fullHistoryData = [] }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const canvasRefs = {
    temp: useRef(null),
    hum: useRef(null),
    soil: useRef(null),
    rain: useRef(null)
  };

  const getDayLabel = (ts) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const drawChart = (canvas, dataKey, color, title, unit) => {
    if (!canvas || fullHistoryData.length === 0) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const validPoints = fullHistoryData
      .map((item, i) => ({ value: item[dataKey], ts: item.timestamp, idx: i }))
      .filter(p => p.value != null);

    if (validPoints.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có dữ liệu', w / 2, h / 2);
      return;
    }

    const values = validPoints.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const padding = 70;
    const chartWidth = w - 2 * padding;
    const chartHeight = h - 140; // Để dành chỗ cho ngày ở dưới cùng

    ctx.clearRect(0, 0, w, h);

    // Tiêu đề + giá trị hiện tại
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 42);

    const latest = fullHistoryData[fullHistoryData.length - 1][dataKey];
    ctx.fillStyle = color;
    ctx.font = 'bold 40px system-ui';
    ctx.fillText(latest != null ? `${latest.toFixed(1)}${unit}` : '—', w / 2, 98);

    // Vẽ đường line mượt
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    validPoints.forEach((p, i) => {
      const x = padding + (i / (validPoints.length - 1)) * chartWidth + offsetX;
      const y = 125 + chartHeight - ((p.value - min) / range) * chartHeight;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // NGÀY NẰM DƯỚI ĐÁY – SẠCH ĐẸP, KHÔNG CHEN VÀO ĐỒ THỊ
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom'; // Quan trọng: chữ nằm sát đáy

    const seenDays = new Set();
    validPoints.forEach((p, i) => {
      const dayLabel = getDayLabel(p.ts);
      if (!seenDays.has(dayLabel)) {
        seenDays.add(dayLabel);
        const x = padding + (i / (validPoints.length - 1)) * chartWidth + offsetX;
        if (x > padding - 80 && x < w - padding + 80) {
          ctx.fillText(dayLabel, x, h - 12); // Cách đáy 12px → sát dưới cùng
        }
      }
    });
  };

  const handleDown = e => { setIsDragging(true); setStartX(e.clientX - offsetX); };
  const handleMove = e => { if (isDragging) setOffsetX(e.clientX - startX); };
  const handleUp = () => setIsDragging(false);

  useEffect(() => {
    const charts = [
      { ref: canvasRefs.temp, key: 'temp', color: '#ef4444', title: 'Nhiệt độ', unit: '°C' },
      { ref: canvasRefs.hum, key: 'hum', color: '#3b82f6', title: 'Độ ẩm không khí', unit: '%' },
      { ref: canvasRefs.soil, key: 'soil_percent', color: '#8b5cf6', title: 'Độ ẩm đất', unit: '%' },
      { ref: canvasRefs.rain, key: 'rain_percent', color: '#06b6d4', title: 'Lượng mưa', unit: '%' }
    ];
    charts.forEach(c => drawChart(c.ref.current, c.key, c.color, c.title, c.unit));
  }, [fullHistoryData, offsetX]);

  if (!activePlant || fullHistoryData.length === 0) {
    return (
      <div style={{ padding: 120, textAlign: 'center', background: '#fff', borderRadius: 32, margin: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '2.8rem', color: '#64748b' }}>Chọn cây để xem lịch sử</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', background: '#f8fafc' }}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 16, color: '#1e293b', fontSize: '2rem', fontWeight: 'bold' }}>
        Lịch sử cảm biến – {activePlant.name}
      </h2>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32 }}>
        Kéo sang trái/phải để xem dữ liệu cũ • {fullHistoryData.length} bản ghi
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 32, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', cursor: 'grab' }} onMouseDown={handleDown}>
          <canvas ref={canvasRefs.temp} width={720} height={360} style={{ width: '100%', height: '360px' }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 32, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', cursor: 'grab' }} onMouseDown={handleDown}>
          <canvas ref={canvasRefs.hum} width={720} height={360} style={{ width: '100%', height: '360px' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div style={{ background: '#fff', borderRadius: 32, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', cursor: 'grab' }} onMouseDown={handleDown}>
          <canvas ref={canvasRefs.soil} width={720} height={360} style={{ width: '100%', height: '360px' }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 32, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', cursor: 'grab' }} onMouseDown={handleDown}>
          <canvas ref={canvasRefs.rain} width={720} height={360} style={{ width: '100%', height: '360px' }} />
        </div>
      </div>
    </div>
  );
};

export default History;