// src/components/pump/ManualPump.jsx
import React from 'react';

const ManualPump = ({ latestData, isActive, onToggle }) => {
  const { pump } = latestData || {};

  const handlePump = async () => {
    if (!isActive) return;
    const newState = pump === 'ON' ? 'OFF' : 'ON';
    try {
      await fetch('http://localhost:3000/api/control-pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
    } catch (err) {
      console.error("Lỗi điều khiển bơm:", err);
    }
  };

  return (
    <div style={{
      padding: "20px 16px",
      background: isActive ? "linear-gradient(135deg, #f0fdf4, #bbf7d0)" : "#f8fafc",
      borderRadius: 20,
      border: isActive ? "3px dashed #16a34a" : "3px dashed #94a3b8",
      position: "relative",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      {/* NÚT GẠT BÉ TÍ */}
      <div onClick={onToggle} style={{
        position: "absolute", top: 10, right: 10,
        width: 50, height: 28,
        background: isActive ? "#22c55e" : "#cbd5e1",
        borderRadius: 28, padding: "3px", cursor: "pointer"
      }}>
        <div style={{
          width: 22, height: 22, background: "white", borderRadius: "50%",
          transform: isActive ? "translateX(22px)" : "translateX(0)",
          transition: "all 0.4s ease"
        }} />
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: "1.4rem", color: isActive ? "#166534" : "#64748b" }}>
        Thủ công
        {isActive && <span style={{ fontSize: "0.75rem", display: "block", color: "#16a34a", fontWeight: "bold" }}>SẴN SÀNG</span>}
      </h3>

      <button
        onClick={handlePump}
        disabled={!isActive}
        style={{
          padding: "16px 36px",
          fontSize: "1.4rem",
          fontWeight: "bold",
          border: "none",
          borderRadius: 16,
          background: pump === 'ON' ? "#ef4444" : "#22c55e",
          color: "white",
          cursor: isActive ? "pointer" : "not-allowed",
          opacity: isActive ? 1 : 0.5,
          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          transition: "all 0.3s"
        }}
      >
        {pump === 'ON' ? 'TẮT BƠM' : 'BẬT BƠM'}
      </button>

      <div style={{ marginTop: 12, fontSize: "0.95rem", color: "#444" }}>
        Trạng thái: <strong style={{ color: pump === 'ON' ? '#dc2626' : '#16a34a' }}>
          {pump || 'OFF'}
        </strong>
      </div>
    </div>
  );
};

export default ManualPump;