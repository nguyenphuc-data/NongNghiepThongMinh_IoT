// src/components/pump/SchedulePump.jsx – CHỈ CÓ 2 TRẠNG THÁI: ĐANG TƯỚI & ĐỢI LỊCH
import React, { useState, useEffect } from 'react';

const SchedulePump = ({ latestData, activePlant, isActive, onToggle }) => {
  const { pump } = latestData || {};
  const saved = activePlant?.watering_schedule || { daily: ["07:00", "18:00"], specific: [] };
  const [daily, setDaily] = useState(saved.daily);
  const [specific, setSpecific] = useState(saved.specific);
  const [time, setTime] = useState("07:00");
  const [datetime, setDatetime] = useState("");
  const [msg, setMsg] = useState("Đợi lịch...");

  const duration = (activePlant?.thresholds?.auto_water_duration || 10) * 1000;

  const triggerPump = async () => {
    if (pump === 'ON') return;
    setMsg("Đang tưới...");
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
      setMsg("Đợi lịch..."); // Trở về trạng thái đợi sau khi tưới
    } catch (err) {
      setMsg("Đợi lịch..."); // Nếu lỗi, cũng quay lại trạng thái đợi
      console.error(err);
    }
  };

  // CHECK MỖI 60 GIÂY – SIÊU CHÍNH XÁC!
  useEffect(() => {
    if (!isActive) {
      setMsg("Đợi lịch...");
      return;
    }

    const checkSchedule = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const currentDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      let shouldWater = false;

      // KIỂM TRA LỊCH HÀNG NGÀY
      if (daily.includes(currentTime)) {
        shouldWater = true;
      }

      // KIỂM TRA LỊCH CỤ THỂ (và xóa sau khi tưới)
      const specificMatch = specific.find(s => s.datetime === currentDateTime);
      if (specificMatch) {
        shouldWater = true;
        setSpecific(prev => prev.filter(s => s.datetime !== currentDateTime)); // Xóa sau khi tưới
      }

      if (shouldWater && pump !== 'ON') {
        triggerPump();
      }
    };

    // Chạy ngay lập tức khi bật
    checkSchedule();

    // Sau đó cứ mỗi 60 giây kiểm tra 1 lần
    const intervalId = setInterval(checkSchedule, 60000);

    return () => clearInterval(intervalId);
  }, [isActive, daily, specific, pump, duration]);

  const addDaily = () => {
    if (time && !daily.includes(time)) {
      setDaily(p => [...p, time].sort());
      setTime("07:00");
    }
  };

  const addSpecific = () => {
    if (datetime) {
      const formatted = datetime.slice(0, 16);
      if (!specific.some(s => s.datetime === formatted)) {
        setSpecific(p => [...p, { datetime: formatted }].sort((a, b) => a.datetime.localeCompare(b.datetime)));
      }
      setDatetime("");
    }
  };

  const removeDaily = (t) => setDaily(p => p.filter(x => x !== t));
  const removeSpecific = (dt) => setSpecific(p => p.filter(x => x.datetime !== dt));

  return (
    <div style={{
      padding: "20px 16px",
      background: isActive ? "linear-gradient(135deg, #fefce8, #fef08a)" : "#f8fafc",
      borderRadius: 20,
      border: isActive ? "3px dashed #ca8a04" : "3px dashed #94a3b8",
      position: "relative",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      {/* NÚT GẠT BÉ TÍ */}
      <div onClick={onToggle} style={{
        position: "absolute", top: 10, right: 10,
        width: 50, height: 28,
        background: isActive ? "#fbbf24" : "#cbd5e1",
        borderRadius: 28, padding: "3px", cursor: "pointer"
      }}>
        <div style={{
          width: 22, height: 22, background: "white", borderRadius: "50%",
          transform: isActive ? "translateX(22px)" : "translateX(0)",
          transition: "all 0.4s ease"
        }} />
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: "1.4rem", color: isActive ? "#92400e" : "#64748b" }}>
        Tự động Lịch
        {isActive && <span style={{ fontSize: "0.75rem", display: "block", color: "#d97706", fontWeight: "bold" }}>HOẠT ĐỘNG</span>}
      </h3>

      <div style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "#444" }}>
        <strong>Hàng ngày:</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", margin: "6px 0" }}>
          {daily.length === 0 ? <span style={{ color: "#aaa" }}>Chưa đặt</span> : daily.map(t => (
            <span key={t} style={{ background: "#fff7ed", padding: "5px 10px", borderRadius: 10, border: "1px solid #fb923c", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
              {t}
              <button
  onClick={() => removeDaily(t)}
  aria-label="Xóa"
  style={{
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#ef4444',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginLeft: 6,

    // CĂN GIỮA × HOÀN HẢO 100%
    display: 'grid',
    placeItems: 'center',

    // Font + chữ × chuẩn tuyệt đối
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '800',
    fontSize: '13px',        // Chính xác 13px cho × nằm tâm hoàn hảo
    lineHeight: 1,
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = '#dc2626';
    e.currentTarget.style.transform = 'scale(1.1)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = '#ef4444';
    e.currentTarget.style.transform = 'scale(1)';
  }}
>
  ×
</button>
            </span>
          ))}
        </div>

        <strong style={{ display: "block", marginTop: 12 }}>Một lần:</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", margin: "6px 0" }}>
          {specific.length === 0 ? <span style={{ color: "#aaa" }}>Chưa đặt</span> : specific.map(s => (
            <span key={s.datetime} style={{ background: "#fee2e2", padding: "5px 10px", borderRadius: 10, border: "1px solid #f87171", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
              {s.datetime.replace("T", " ")}
              <button onClick={() => removeSpecific(s.datetime)} style={{ width: 18, height: 18, border: "none", borderRadius: "50%", background: "#b91c1c", color: "white", fontSize: "0.8rem", cursor: "pointer" }}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div style={{ margin: "10px 0", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ padding: 6, borderRadius: 8, border: "2px solid #f59e0b", fontSize: "0.9rem" }} />
        <button onClick={addDaily} style={{ padding: "6px 12px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, fontSize: "0.85rem" }}>+ Hàng ngày</button>
      </div>

      <div style={{ margin: "10px 0", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} style={{ padding: 6, borderRadius: 8, border: "2px solid #dc2626", fontSize: "0.9rem" }} />
        <button onClick={addSpecific} style={{ padding: "6px 12px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, fontSize: "0.85rem" }}>+ Một lần</button>
      </div>

      <div style={{
        marginTop: 14,
        padding: "10px",
        background: "#fff",
        borderRadius: 12,
        fontSize: "1rem",
        fontWeight: "bold",
        color: pump === 'ON' ? "#d97706" : "#16a34a",
        border: "2px solid #fbbf24"
      }}>
        {msg}
      </div>
    </div>
  );
};

export default SchedulePump;