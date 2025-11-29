// src/components/pump/ThresholdPump.jsx
import React, { useState, useEffect, useRef } from 'react';

const ThresholdPump = ({ latestData, activePlant, isActive, onToggle }) => {
  const { soil_percent, pump } = latestData || {};
  const t = activePlant?.thresholds || activePlant?.plant_type_id?.thresholds || {};
  const minSoil = t.soil_moisture_min || 40;
  const duration = (t.auto_water_duration || 10) * 1000;
  const intervalRef = useRef(null);

  const [status, setStatus] = useState("");

  const triggerPump = async () => {
    if (pump === 'ON') return;
    setStatus(`Đang tưới ${t.auto_water_duration || 10}s...`);
    try {
      await fetch('http://localhost:3000/api/control-pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'ON' })
      });
      await new Promise(r => setTimeout(r, duration));
      await fetch('http://localhost:3000/api/control-pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'OFF' })
      });
      setStatus("Tưới xong!");
    } catch (err) {
      setStatus("Lỗi bơm!");
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus("");
      return;
    }

    intervalRef.current = setInterval(() => {
      if (soil_percent !== undefined && soil_percent < minSoil && pump !== 'ON') {
        triggerPump();
      }
    }, 10000);

    return () => clearInterval(intervalRef.current);
  }, [isActive, soil_percent, pump, minSoil, duration]);

  const isDry = soil_percent !== undefined && soil_percent < minSoil;

  return (
    <div style={{
      padding: "20px 16px",
      background: isActive ? "linear-gradient(135deg, #fff7ed, #fed7aa)" : "#f8fafc",
      borderRadius: 20,
      border: isActive ? "3px dashed #c2410c" : "3px dashed #94a3b8",
      position: "relative",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      {/* NÚT GẠT BÉ TÍ */}
      <div onClick={onToggle} style={{
        position: "absolute", top: 10, right: 10,
        width: 50, height: 28,
        background: isActive ? "#fb923c" : "#cbd5e1",
        borderRadius: 28, padding: "3px", cursor: "pointer"
      }}>
        <div style={{
          width: 22, height: 22, background: "white", borderRadius: "50%",
          transform: isActive ? "translateX(22px)" : "translateX(0)",
          transition: "all 0.4s ease"
        }} />
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: "1.4rem", color: isActive ? "#c2410c" : "#64748b" }}>
        Tự động Ngưỡng
        {isActive && <span style={{ fontSize: "0.75rem", display: "block", color: "#ea580c", fontWeight: "bold" }}>ĐANG CHẠY</span>}
      </h3>

      <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#444" }}>
        <div>Ngưỡng: <strong>{minSoil}%</strong></div>
        <div>Hiện tại: <strong style={{ color: isDry ? "#dc2626" : "#16a34a" }}>
          {soil_percent !== undefined ? soil_percent + "%" : "Đang tải..."}
        </strong></div>
        <div>Tưới {t.auto_water_duration || 10}s • Kiểm tra mỗi 10s</div>
      </div>

      <div style={{
        marginTop: 14,
        padding: "10px",
        background: "#fff",
        borderRadius: 12,
        fontSize: "1rem",
        fontWeight: "bold",
        color: isDry ? "#dc2626" : "#16a34a",
        border: `2px solid ${isDry ? "#dc2626" : "#16a34a"}`
      }}>
        {status || (isDry ? "Đất khô → Sắp tưới..." : "Đất đủ ẩm")}
      </div>
    </div>
  );
};

export default ThresholdPump;