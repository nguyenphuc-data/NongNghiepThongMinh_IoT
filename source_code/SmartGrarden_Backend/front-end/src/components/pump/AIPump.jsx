import React, { useState, useEffect, useCallback, useRef } from 'react';

const AIPump = ({ latestData, activePlant, isActive, onToggle }) => {
  const [aiStatus, setAiStatus] = useState({
    probability: 0,
    need_pump: false,
    loading: false,
    lastUpdate: null,
    current_soil: null,
    message: 'AI chưa hoạt động',
    isPumping: false,
    remainingSeconds: 0
  });

  const intervalRef = useRef(null);
  const pumpTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const pumpingRef = useRef(false);   // TRACK TRẠNG THÁI BƠM – tránh stale state
  const secondsRef = useRef(0);       // TRACK GIÂY ĐẾM NGƯỢC – tránh frozen countdown

  const autoWaterDuration = activePlant?.thresholds?.auto_water_duration || 10;

  const fetchAIDecision = useCallback(async () => {
    if (!isActive || !activePlant?._id) return;

    setAiStatus(prev => ({ ...prev, loading: true, message: 'AI đang suy nghĩ...' }));

    try {
      const res = await fetch('http://localhost:3000/api/pump/ai-decision', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plant_id: activePlant._id })
      });

      if (!res.ok) throw new Error('Lỗi server');

      const data = await res.json();

      const needPump = data.need_pump ?? false;
      const probability = data.probability ?? 0;

      setAiStatus(prev => ({
        ...prev,
        probability,
        need_pump: needPump,
        loading: false,
        lastUpdate: new Date(),
        current_soil: data.current_soil ?? latestData?.soil_percent ?? 0,
        message: needPump ? "CẦN TƯỚI NGAY!" : "KHÔNG CẦN TƯỚI"
      }));

      // Nếu cần tưới & chưa bơm → kích hoạt
      if (needPump && !pumpingRef.current) {

        // BẬT BƠM
        await fetch('http://localhost:3000/api/control-pump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'ON' })
        });

        pumpingRef.current = true;
        secondsRef.current = autoWaterDuration;

        setAiStatus(prev => ({
          ...prev,
          isPumping: true,
          remainingSeconds: secondsRef.current,
          message: `Đang tưới... còn ${secondsRef.current}s`
        }));

        console.log(`AI bật bơm ${autoWaterDuration} giây`);

        // TẠO TIMER ĐẾM NGƯỢC
        countdownRef.current = setInterval(() => {
          secondsRef.current -= 1;

          setAiStatus(prev => ({
            ...prev,
            remainingSeconds: secondsRef.current,
            message:
              secondsRef.current > 0
                ? `Đang tưới... còn ${secondsRef.current}s`
                : "Đang tắt bơm..."
          }));

          if (secondsRef.current <= 0) {
            clearInterval(countdownRef.current);
          }
        }, 1000);

        // TIMER TẮT BƠM
        pumpTimeoutRef.current = setTimeout(async () => {
          await fetch('http://localhost:3000/api/control-pump', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'OFF' })
          });

          pumpingRef.current = false;
          secondsRef.current = 0;
          clearInterval(countdownRef.current);

          setAiStatus(prev => ({
            ...prev,
            isPumping: false,
            remainingSeconds: 0,
            message: "Tưới xong – đang theo dõi tiếp"
          }));

          console.log("AI đã tắt bơm tự động");
        }, autoWaterDuration * 1000);
      }
    } catch (err) {
      console.error("Lỗi gọi AI:", err);
      setAiStatus(prev => ({ ...prev, loading: false, message: 'AI tạm offline' }));
    }
  }, [isActive, activePlant?._id, latestData?.soil_percent, autoWaterDuration]);


  // Handle ON/OFF AI
  useEffect(() => {
    if (!isActive) {
      clearInterval(intervalRef.current);
      clearTimeout(pumpTimeoutRef.current);
      clearInterval(countdownRef.current);

      pumpingRef.current = false;
      secondsRef.current = 0;

      setAiStatus({
        probability: 0,
        need_pump: false,
        loading: false,
        lastUpdate: null,
        current_soil: null,
        message: 'AI đã tắt',
        isPumping: false,
        remainingSeconds: 0
      });
      return;
    }

    fetchAIDecision();

    intervalRef.current = setInterval(fetchAIDecision, 60_000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(pumpTimeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, [isActive, fetchAIDecision]);


  return (
    <div style={{
      padding: "20px 16px",
      background: isActive
        ? (aiStatus.isPumping ? "linear-gradient(135deg, #d4f4dd, #a7f3d0)" : "linear-gradient(135deg, #fee2e2, #fecaca)")
        : "#f1f5f9",
      borderRadius: 20,
      border: isActive ? "3px dashed #f59e0b" : "3px dashed #94a3b8",
      position: "relative",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif",
      transition: "all 0.4s ease"
    }}>
      <div onClick={onToggle} style={{
        position: "absolute", top: 10, right: 10,
        width: 50, height: 28,
        background: isActive ? "#f59e0b" : "#cbd5e1",
        borderRadius: 28, padding: "3px", cursor: "pointer",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
      }}>
        <div style={{
          width: 22, height: 22, background: "white", borderRadius: "50%",
          transform: isActive ? "translateX(22px)" : "translateX(0)",
          transition: "all 0.4s ease"
        }} />
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: "1.5rem", color: isActive ? "#92400e" : "#64748b", fontWeight: "bold" }}>
        Tưới Thông Minh
        {isActive && (
          <span style={{ fontSize: "0.8rem", display: "block", color: "#d97706", fontWeight: "bold", marginTop: 4 }}>
            {aiStatus.isPumping ? "ĐANG TƯỚI" : "HOẠT ĐỘNG"}
          </span>
        )}
      </h3>

      <div style={{ margin: "16px 0" }}>
        <div style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          color: "#78350f",
          minHeight: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {aiStatus.loading
            ? "Đang suy nghĩ..."
            : aiStatus.isPumping
              ? `Đang tưới... còn ${aiStatus.remainingSeconds}s`
              : aiStatus.message}
        </div>
      </div>

      <div style={{ fontSize: "0.9rem", color: "#78350f", marginTop: 12, lineHeight: "1.5" }}>
        <div>Thời gian tưới tự động: <strong>{autoWaterDuration} giây</strong></div>
        {aiStatus.lastUpdate && (
          <div style={{ fontSize: "0.75rem", color: "#a16207", marginTop: 6 }}>
            Cập nhật lúc: {aiStatus.lastUpdate.toLocaleTimeString('vi-VN')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPump;
