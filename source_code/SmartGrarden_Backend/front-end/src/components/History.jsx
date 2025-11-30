// src/components/History.jsx – BẢNG CUỘN 10 DÒNG + TÌM KIẾM + SẮP XẾP + XUẤT EXCEL – ĐỈNH CAO 2025!
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const History = ({ activePlant, fullHistoryData = [] }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const canvasRefs = {
    temp: useRef(null),
    hum: useRef(null),
    soil: useRef(null),
    rain: useRef(null)
  };

  // === BIỂU ĐỒ (giữ nguyên đẹp lung linh) ===
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
    const chartHeight = h - 140;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 42);

    const latest = fullHistoryData[fullHistoryData.length - 1][dataKey];
    ctx.fillStyle = color;
    ctx.font = 'bold 40px system-ui';
    ctx.fillText(latest != null ? `${latest.toFixed(1)}${unit}` : '—', w / 2, 98);

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

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px system-ui';
    ctx.textBaseline = 'bottom';
    const seenDays = new Set();
    validPoints.forEach((p, i) => {
      const dayLabel = getDayLabel(p.ts);
      if (!seenDays.has(dayLabel)) {
        seenDays.add(dayLabel);
        const x = padding + (i / (validPoints.length - 1)) * chartWidth + offsetX;
        if (x > padding - 80 && x < w - padding + 80) {
          ctx.fillText(dayLabel, x, h - 12);
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

  // === BẢNG DỮ LIỆU ĐÃ LỌC + SẮP XẾP ===
  const tableData = useMemo(() => {
    let data = [...fullHistoryData];

    // Tìm kiếm
    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(item =>
        format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm').toLowerCase().includes(term) ||
        item.temp?.toString().includes(term) ||
        item.hum?.toString().includes(term) ||
        item.soil_percent?.toString().includes(term) ||
        item.rain_percent?.toString().includes(term)
      );
    }

    // Sắp xếp
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'timestamp') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [fullHistoryData, search, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tableData.map(item => ({
      'Thời gian': format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      'Nhiệt độ (°C)': item.temp?.toFixed(1) ?? '-',
      'Độ ẩm KK (%)': item.hum?.toFixed(1) ?? '-',
      'Độ ẩm đất (%)': item.soil_percent?.toFixed(1) ?? '-',
      'Lượng mưa (%)': item.rain_percent?.toFixed(1) ?? '-',
      'Ánh sáng': item.is_bright ? 'Có' : 'Không',
      'Đang mưa': item.is_raining ? 'Có' : 'Không',
      'Đất ướt': item.is_soil_wet ? 'Có' : 'Không'
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LichSu');
    XLSX.writeFile(wb, `LichSu_${activePlant.name || 'Cay'}_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`);
  };

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

      {/* Biểu đồ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 40 }}>
        {Object.entries(canvasRefs).map(([key, ref]) => (
          <div key={key} style={{ background: '#fff', borderRadius: 32, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', cursor: 'grab' }} onMouseDown={handleDown}>
            <canvas ref={ref} width={720} height={360} style={{ width: '100%', height: '360px' }} />
          </div>
        ))}
      </div>

      {/* BẢNG DỮ LIỆU – CHỈ HIỆN 10 DÒNG, CÒN LẠI CUỘN */}
      <div style={{ background: '#fff', borderRadius: 32, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>
            Bảng dữ liệu ({tableData.length} bản ghi)
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Tìm kiếm thời gian, nhiệt độ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: '1rem',
                minWidth: 280
              }}
            />
            <button onClick={exportToExcel} style={{
              padding: '12px 28px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1.1rem'
            }}>
              Xuất Excel
            </button>
          </div>
        </div>

        {/* CHỖ CUỘN – CHỈ HIỆN 10 DÒNG */}
        <div style={{
          maxHeight: '520px',           // Chiều cao cố định ~10 dòng
          overflowY: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          background: '#fff'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {[
                  { key: 'timestamp', label: 'Thời gian' },
                  { key: 'temp', label: 'Nhiệt độ (°C)' },
                  { key: 'hum', label: 'Độ ẩm KK (%)' },
                  { key: 'soil_percent', label: 'Độ ẩm đất (%)' },
                  { key: 'rain_percent', label: 'Mưa (%)' },
                  { key: 'is_bright', label: 'Ánh sáng' },
                  { key: 'is_raining', label: 'Đang mưa' },
                  { key: 'is_soil_wet', label: 'Đất ướt' }
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: '#f1f5f9'
                    }}
                  >
                    {col.label}
                    {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, idx) => (
                <tr key={idx} style={{
                  background: idx % 2 === 0 ? '#fdfdfd' : '#fff',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={cellStyle}>{format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td style={cellStyle}>{item.temp?.toFixed(1) || '-'}</td>
                  <td style={cellStyle}>{item.hum?.toFixed(1) || '-'}</td>
                  <td style={{ ...cellStyle, fontWeight: item.soil_percent < 30 ? 'bold' : 'normal', color: item.soil_percent < 30 ? '#dc2626' : '#166534' }}>
                    {item.soil_percent?.toFixed(1) || '-'}
                  </td>
                  <td style={cellStyle}>{item.rain_percent?.toFixed(1) || '-'}</td>
                  <td style={cellStyle}>{item.is_bright ? 'Có' : 'Không'}</td>
                  <td style={cellStyle}>{item.is_raining ? 'Có' : 'Không'}</td>
                  <td style={cellStyle}>{item.is_soil_wet ? 'Có' : 'Không'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hiển thị số lượng */}
        <div style={{ marginTop: 16, textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
          Đang hiển thị {tableData.length} bản ghi {search && `(đã lọc từ ${fullHistoryData.length})`}
        </div>
      </div>
    </div>
  );
};

const cellStyle = {
  padding: '14px 12px',
  color: '#334155',
  fontSize: '0.98rem'
};

export default History;