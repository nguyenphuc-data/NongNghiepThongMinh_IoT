// src/components/pump/AIPump.jsx
const AIPump = () => {
  return (
    <div style={{
      padding: "60px 40px",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      borderRadius: 36,
      border: "5px dashed #0ea5e9",
      textAlign: "center",
      boxShadow: "0 20px 70px rgba(14,165,233,0.3)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        top: -50, right: -50,
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)",
        borderRadius: "50%"
      }}></div>

      <h3 style={{ fontSize: "2.6em", color: "#0c4a6e", margin: "0 0 24px", fontWeight: 900 }}>
        Chế độ Tưới bằng AI
      </h3>
      <p style={{ fontSize: "1.5em", color: "#0369a1", maxWidth: 700, margin: "0 auto 32px" }}>
        Hệ thống sử dụng AI dự báo thời tiết, độ ẩm đất trong 24h tới<br/>
        để quyết định tưới trước khi cây bị thiếu nước
      </p>
      <div style={{ fontSize: "2em", color: "#0284c7", fontWeight: "bold" }}>
        Tương lai đã đến...
      </div>
      <div style={{ marginTop: 20, fontSize: "1.4em", color: "#0ea5e9" }}>
        Đang huấn luyện mô hình AI...
      </div>
    </div>
  );
};

export default AIPump;