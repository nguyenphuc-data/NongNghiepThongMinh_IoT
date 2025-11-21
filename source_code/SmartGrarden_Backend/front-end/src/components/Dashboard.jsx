// src/components/Dashboard.jsx
import React, { useState } from 'react';
import DataCard from './DataCard';

const Dashboard = ({ latestData, status, activePlant }) => {
  const {
    temp,
    hum,
    soil_percent,
    pump,
    rain_percent = 0,
    is_bright,
  } = latestData || {};

  // Ánh sáng: chỉ "Sáng" hoặc "Tối"
  const lightStatus = is_bright === true ? "Sáng" : is_bright === false ? "Tối" : "N/A";

  // Format tất cả số về 1 chữ số thập phân
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

      {/* CÁC THẺ TÁCH RỜI RÕ RÀNG, ĐẸP NHƯ ẢNH */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "28px",           // Tăng gap lên 28px → tách rõ ràng hơn
        marginBottom: "48px"
      }}>
        <DataCard title="Nhiệt độ"      value={format(temp)}         unit="°C" />
        <DataCard title="Độ ẩm KK"      value={format(hum)}          unit="%" />
        <DataCard title="Độ ẩm Đất"     value={format(soil_percent)} unit="%" />
        <DataCard title="Ánh sáng"      value={lightStatus}          unit=""   color={is_bright ? "#e67e22" : "#2c3e50"} />
        <DataCard title="Mưa"           value={format(rain_percent)} unit="%"  color={rain_percent > 50 ? "#3498db" : "#95a5a6"} />
        <DataCard title="Bơm"           value={pump === "ON" ? "BẬT" : "TẮT"} unit="" status={pump} />
      </div>

      {/* ĐIỀU KHIỂN TƯỚI – ĐẸP LUNG LINH */}
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