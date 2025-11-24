// src/components/Dashboard.jsx – PHIÊN BẢN ĐỈNH CAO NHẤT 2025
import React, { useState } from 'react';
import DataCard from './DataCard';

const Dashboard = ({ latestData, status, activePlant, activePlantType }) => {
  const {
    temp,
    hum,
    soil_percent,
    pump,
    rain_percent = 0,
    is_bright,
  } = latestData || {};

  // LẤY NGƯỠNG TỪ CÂY (ưu tiên thresholds cá nhân, nếu không có thì dùng của loại cây)
  const t = activePlant?.thresholds || activePlantType?.thresholds || {};
  const w = activePlant?.warnings || activePlantType?.warnings || {};

  const lightStatus = is_bright === true ? "Sáng" : is_bright === false ? "Tối" : "N/A";

  const format = (val) => (val != null ? Number(val).toFixed(1) : "0.0");

  const [isPumpBusy, setIsPumpBusy] = useState(false);

  const controlPump = async (state) => {
    if (!activePlant) return alert("Vui lòng chọn cây trước!");
    if (isPumpBusy) return;

    setIsPumpBusy(true);
    try {
      await fetch('http://localhost:3000/api/control-pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
    } catch (err) {
      alert("Lỗi gửi lệnh bơm!");
    } finally {
      setTimeout(() => setIsPumpBusy(false), 2000);
    }
  };

  const displayStatus = () => {
    if (status === 'Disconnected') return 'Mất kết nối';
    if (status === 'Connecting...') return 'Đang kết nối...';
    return activePlant?._id ? 'Kết nối & Hoạt động' : 'Đã kết nối (chưa chọn cây)';
  };

  // TẠO DANH SÁCH CẢNH BÁO
  const warningsList = [];
  if (temp < t.temp_min) warningsList.push(`Nhiệt độ quá thấp (${temp}°C < ${t.temp_min}°C)`);
  if (temp > t.temp_max) warningsList.push(`Nhiệt độ quá cao (${temp}°C > ${t.temp_max}°C)`);
  if (hum < t.air_humidity_min) warningsList.push(`Độ ẩm không khí thấp (${hum}% < ${t.air_humidity_min}%)`);
  if (hum > t.air_humidity_max) warningsList.push(`Độ ẩm không khí cao (${hum}% > ${t.air_humidity_max}%)`);
  if (soil_percent < t.soil_moisture_min) warningsList.push(`Đất quá khô (${soil_percent}% < ${t.soil_moisture_min}%)`);
  if (soil_percent > t.soil_moisture_max) warningsList.push(`Đất quá ẩm (${soil_percent}% > ${t.soil_moisture_max}%)`);

  // Thêm cảnh báo tùy chỉnh nếu có
  if (temp < t.temp_min && w.low_temp) warningsList.push(w.low_temp);
  if (temp > t.temp_max && w.high_temp) warningsList.push(w.high_temp);
  if (hum < t.air_humidity_min && w.low_humidity) warningsList.push(w.low_humidity);
  if (hum > t.air_humidity_max && w.high_humidity) warningsList.push(w.high_humidity);
  if (soil_percent < t.soil_moisture_min && w.low_soil) warningsList.push(w.low_soil);
  if (soil_percent > t.soil_moisture_max && w.high_soil) warningsList.push(w.high_soil);

  if (!activePlant) {
    return (
      <div style={{ textAlign: "center", padding: "120px 20px", background: "#f8f9fa", borderRadius: 24, marginTop: 40, border: "4px dashed #ccc" }}>
        <p style={{ fontSize: "1.9em", color: "#777", fontWeight: "bold" }}>Chưa chọn cây theo dõi</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      <h2 style={{ color: "#333", marginBottom: 8 }}>
        Dashboard: {activePlant.name}
      </h2>
      <p style={{ color: "#666", fontSize: "0.9em", marginBottom: 32 }}>
        Trạng thái: <strong style={{ color: '#0b0' }}>{displayStatus()}</strong>
      </p>

      {/* CẢNH BÁO – Ô RIÊNG SIÊU ĐẸP */}
      {warningsList.length > 0 && (
        <div style={{
          background: "#ffebee",
          border: "3px solid #e53935",
          borderRadius: 20,
          padding: "20px 24px",
          marginBottom: 32,
          boxShadow: "0 8px 25px rgba(229,57,53,0.2)"
        }}>
          <h3 style={{ margin: "0 0 16px", color: "#c62828", fontWeight: "bold", fontSize: "1.4em" }}>
            CẢNH BÁO
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {warningsList.map((msg, i) => (
              <div key={i} style={{
                background: "white",
                padding: "12px 16px",
                borderRadius: 16,
                borderLeft: "5px solid #e53935",
                fontSize: "1em",
                color: "#b71c1c",
                fontWeight: "bold"
              }}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CÁC THẺ DỮ LIỆU – CÓ NGƯỠNG MIN/MAX NHỎ NHẮN BÊN DƯỚI */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "28px",
        marginBottom: "48px"
      }}>
        <DataCard
          title="Nhiệt độ"
          value={format(temp)}
          unit="°C"
          range={`(${t.temp_min || '?'} – ${t.temp_max || '?'}°C)`}
        />
        <DataCard
          title="Độ ẩm KK"
          value={format(hum)}
          unit="%"
          range={`(${t.air_humidity_min || '?'} – ${t.air_humidity_max || '?'}%)`}
        />
        <DataCard
          title="Độ ẩm Đất"
          value={format(soil_percent)}
          unit="%"
          range={`(${t.soil_moisture_min || '?'} – ${t.soil_moisture_max || '?'}%)`}
        />
        <DataCard
          title="Ánh sáng"
          value={lightStatus}
          unit=""
          color={is_bright ? "#e67e22" : "#2c3e50"}
        />
        <DataCard
          title="Mưa"
          value={format(rain_percent)}
          unit="%"
          color={rain_percent > 50 ? "#3498db" : "#95a5a6"}
        />
        <DataCard
          title="Bơm"
          value={pump === "ON" ? "BẬT" : "TẮT"}
          unit=""
          status={pump}
        />
      </div>

      {/* ĐIỀU KHIỂN TƯỚI */}
      <div style={{
        textAlign: "center",
        padding: "40px 28px",
        backgroundColor: "#f8f9fa",
        borderRadius: "28px",
        border: "4px dashed #00593F",
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)"
      }}>
        <h3 style={{ margin: "0 0 32px", color: "#00593F", fontSize: "1.85em", fontWeight: "900" }}>
          Điều khiển tưới nước
        </h3>

        <div style={{ display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => controlPump('ON')}
            disabled={isPumpBusy || pump === 'ON'}
            style={{
              padding: "22px 72px",
              fontSize: "1.7em",
              fontWeight: "bold",
              border: "none",
              borderRadius: "20px",
              backgroundColor: (isPumpBusy || pump === 'ON') ? '#28a745' : '#0d6efd',
              color: "white",
              cursor: (isPumpBusy || pump === 'ON') ? 'not-allowed' : 'pointer',
              opacity: isPumpBusy ? 0.85 : 1,
              minWidth: "200px",
              boxShadow: "0 12px 35px rgba(13,110,253,0.45)",
              transition: "all 0.3s ease"
            }}
          >
            {isPumpBusy && pump !== 'ON' ? 'Đang bật...' : 'BẬT BƠM'}
          </button>

          <button
            onClick={() => controlPump('OFF')}
            disabled={isPumpBusy || pump === 'OFF'}
            style={{
              padding: "22px 72px",
              fontSize: "1.7em",
              fontWeight: "bold",
              border: "none",
              borderRadius: "20px",
              backgroundColor: (isPumpBusy || pump === 'OFF') ? '#dc3545' : '#6c757d',
              color: "white",
              cursor: (isPumpBusy || pump === 'OFF') ? 'not-allowed' : 'pointer',
              opacity: isPumpBusy ? 0.85 : 1,
              minWidth: "200px",
              boxShadow: "0 12px 35px rgba(220,53,69,0.45)",
              transition: "all 0.3s ease"
            }}
          >
            {isPumpBusy && pump === 'ON' ? 'Đang tắt...' : 'TẮT BƠM'}
          </button>
        </div>

        {rain_percent > 60 && (
          <p style={{ marginTop: "28px", color: "#0066cc", fontWeight: "bold", fontSize: "1.2em" }}>
            Đang mưa ({format(rain_percent)}%) – Hệ thống tự động tạm dừng tưới
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;