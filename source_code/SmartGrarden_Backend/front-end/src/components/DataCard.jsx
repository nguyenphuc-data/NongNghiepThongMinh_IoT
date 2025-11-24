// src/components/DataCard.jsx
const DataCard = ({ title, value, unit, range, color, status }) => {
  return (
    <div style={{
      background: "white",
      borderRadius: 20,
      padding: "20px 16px",
      textAlign: "center",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      border: "2px solid #e0e0e0",
      transition: "all 0.3s"
    }}>
      <p style={{ margin: "0 0 8px", fontSize: "0.95em", color: "#555", fontWeight: "bold" }}>
        {title}
      </p>
      <p style={{
        margin: 0,
        fontSize: "2.4em",
        fontWeight: "900",
        color: color || "#00593F"
      }}>
        {value}<span style={{ fontSize: "0.5em", marginLeft: 4 }}>{unit}</span>
      </p>
      {range && (
        <p style={{
          margin: "8px 0 0",
          fontSize: "0.78em",
          color: "#888",
          fontWeight: "600"
        }}>
          {range}
        </p>
      )}
    </div>
  );
};

export default DataCard;