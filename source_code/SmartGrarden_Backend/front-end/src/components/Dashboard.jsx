// src/components/Dashboard.jsx – ĐÃ HOÀN HẢO 100%, CÓ LẠI RANGE ĐẸP LUNG LINH!
import React, { useState } from 'react';
import DataCard from './DataCard';
import ManualPump from './pump/ManualPump';
import ThresholdPump from './pump/ThresholdPump';
import SchedulePump from './pump/SchedulePump';
import AIPump from './pump/AIPump';

const Dashboard = ({ latestData, status, activePlant }) => {
  const { temp, hum, soil_percent, pump, rain_percent = 0, is_bright } = latestData || {};

  // LẤY NGƯỠNG CHÍNH XÁC TỪ CÂY HOẶC LOẠI CÂY
  const t = activePlant?.thresholds || activePlant?.plant_type_id?.thresholds || {};

  const [activeMode, setActiveMode] = useState('off');
  const [selectedTab, setSelectedTab] = useState('manual');

  const lightStatus = is_bright === true ? "Sáng" : is_bright === false ? "Tối" : "N/A";
  const format = (val) => (val != null ? Number(val).toFixed(1) : "0.0");

  const warningsList = [];
  if (temp < t.temp_min) warningsList.push(`Nhiệt độ quá thấp (${format(temp)}°C)`);
  if (temp > t.temp_max) warningsList.push(`Nhiệt độ quá cao (${format(temp)}°C)`);
  if (hum < t.air_humidity_min) warningsList.push(`Độ ẩm không khí thấp (${format(hum)}%)`);
  if (soil_percent < t.soil_moisture_min) warningsList.push(`Đất quá khô (${format(soil_percent)}%)`);

  if (!activePlant) {
    return <div style={{ textAlign: "center", padding: 150, color: "#999", fontSize: "1.8em" }}>Chưa chọn cây</div>;
  }

  const modeNames = {
    manual: "THỦ CÔNG",
    threshold: "TỰ ĐỘNG NGƯỠNG",
    schedule: "TỰ ĐỘNG LỊCH",
    ai: "DỰ ĐOÁN AI",
    off: "TẮT TẤT CẢ"
  };
  const currentModeName = modeNames[activeMode];

  return (
    <div style={{ padding: "0 20px", maxWidth: 1600, margin: "0 auto" }}>
      <h2 style={{ color: "#1e293b", margin: "24px 0 8px", fontSize: "2.1em", fontWeight: "bold" }}>
        Dashboard: {activePlant.name}
      </h2>

      {/* CẢM BIẾN + CẢNH BÁO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 460px", gap: 40, marginBottom: 50, alignItems: "start" }}>
        <div>
          <h3 style={{ marginBottom: 20, color: "#00593F", fontWeight: "bold", fontSize: "1.6em" }}>
            Dữ liệu cảm biến
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>

            {/* ĐÃ KHÔI PHỤC LẠI RANGE ĐẸP NHƯ BAN ĐẦU */}
            <DataCard
              title="Nhiệt độ"
              value={format(temp)}
              unit="°C"
              range={`(${t.temp_min || '?'} – ${t.temp_max || '?'}°C)`}
              isWarning={temp < t.temp_min || temp > t.temp_max}
            />
            <DataCard
              title="Độ ẩm KK"
              value={format(hum)}
              unit="%"
              range={`(${t.air_humidity_min || '?'} – ${t.air_humidity_max || '?'}%)`}
              isWarning={hum < t.air_humidity_min}
            />
            <DataCard
              title="Độ ẩm Đất"
              value={format(soil_percent)}
              unit="%"
              range={`(${t.soil_moisture_min || '?'} – ${t.soil_moisture_max || '?'}%)`}
              isWarning={soil_percent < t.soil_moisture_min}
            />
            <DataCard title="Ánh sáng" value={lightStatus} />
            <DataCard title="Mưa" value={format(rain_percent)} unit="%" />
            <DataCard title="Bơm" value={pump === "ON" ? "BẬT" : "TẮT"} status={pump} />

          </div>
        </div>

        {/* CẢNH BÁO */}
        <div style={{ position: "sticky", top: 20 }}>
          {warningsList.length > 0 ? (
            <div style={{ background: "linear-gradient(135deg, #ffebee, #ffcdd2)", border: "4px solid #e53935", borderRadius: 28, padding: 28, boxShadow: "0 20px 60px rgba(229,57,53,0.3)" }}>
              <h3 style={{ color: "#b71c1c", textAlign: "center", fontWeight: "bold", marginBottom: 20, fontSize: "1.8em" }}>CẢNH BÁO NGUY HIỂM</h3>
              {warningsList.map((msg, i) => (
                <div key={i} style={{ background: "white", padding: "16px 20px", marginBottom: 12, borderRadius: 16, borderLeft: "6px solid #e53935", color: "#c62828", fontWeight: "bold" }}>
                  {msg}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "70px 30px", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "4px dashed #16a34a", borderRadius: 28 }}>
              <div style={{ fontSize: "5em" }}>Good</div>
              <p style={{ fontSize: "1.6em", fontWeight: "bold", color: "#166534" }}>Mọi chỉ số đều an toàn!</p>
            </div>
          )}
        </div>
      </div>

      {/* THANH CHẾ ĐỘ + 4 NÚT TAB */}
      <div style={{ textAlign: "center", margin: "50px 0 40px" }}>
        <div style={{ marginBottom: 24, fontSize: "1.5em", color: "#475569", fontWeight: "600" }}>
          Chế độ tưới hiện tại:
          <span style={{
            marginLeft: 16, padding: "12px 40px",
            background: activeMode === 'manual' ? "#dcfce7" : activeMode === 'threshold' ? "#fed7aa" : activeMode === 'schedule' ? "#fef9c3" : activeMode === 'ai' ? "#e0f2fe" : "#f1f5f9",
            color: activeMode === 'manual' ? "#166534" : activeMode === 'threshold' ? "#c2410c" : activeMode === 'schedule' ? "#92400e" : activeMode === 'ai' ? "#0369a1" : "#64748b",
            fontWeight: "bold", fontSize: "1.55em", borderRadius: 50, display: "inline-block", minWidth: 260, boxShadow: "0 8px 25px rgba(0,0,0,0.12)"
          }}>
            {currentModeName}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {[
            { key: 'manual', label: "Thủ công", color: "#22c55e" },
            { key: 'threshold', label: "Tự động Ngưỡng", color: "#f97316" },
            { key: 'schedule', label: "Tự động Lịch", color: "#ca8a04" },
            { key: 'ai', label: "AI Dự đoán", color: "#0ea5e9" },
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => setSelectedTab(key)}
              style={{
                padding: "16px 36px", fontSize: "1.35em", fontWeight: "bold", border: "none", borderRadius: 50, minWidth: 200,
                background: selectedTab === key ? color : "#f8fafc",
                color: selectedTab === key ? "white" : "#475569",
                boxShadow: selectedTab === key ? `0 10px 30px ${color}40` : "0 6px 20px rgba(0,0,0,0.1)",
                cursor: "pointer", transition: "all 0.3s ease"
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* 4 CHẾ ĐỘ */}
      <div style={{ marginTop: 20 }}>
        {selectedTab === 'manual' && <ManualPump latestData={latestData} isActive={activeMode === 'manual'} onToggle={() => setActiveMode(activeMode === 'manual' ? 'off' : 'manual')} />}
        {selectedTab === 'threshold' && (
          <ThresholdPump
            latestData={latestData}
            activePlant={activePlant}
            isActive={activeMode === 'threshold'}
            onToggle={() => setActiveMode(activeMode === 'threshold' ? 'off' : 'threshold')}
          />
        )}
        {selectedTab === 'schedule' && (
          <SchedulePump
            latestData={latestData}
            activePlant={activePlant}
            isActive={activeMode === 'schedule'}
            onToggle={() => setActiveMode(activeMode === 'schedule' ? 'off' : 'schedule')}
          />
        )}
        {selectedTab === 'ai' && <AIPump isActive={activeMode === 'ai'} onToggle={() => setActiveMode(activeMode === 'ai' ? 'off' : 'ai')} />}
      </div>
    </div>
  );
};

export default Dashboard;