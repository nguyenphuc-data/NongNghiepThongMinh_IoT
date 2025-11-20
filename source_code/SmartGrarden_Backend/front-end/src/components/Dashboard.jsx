// src/components/Dashboard.jsx
import React, { useState } from 'react';
import DataCard from './DataCard';

const Dashboard = ({ latestData, status, activePlant }) => {
    const { temp, hum, soil_percent, pump } = latestData;

    // TRẠNG THÁI KHÓA NÚT KHI ĐANG XỬ LÝ LỆNH
    const [isPumpBusy, setIsPumpBusy] = useState(false);

    // Hàm điều khiển bơm – CÓ CHỐNG SPAM
    const controlPump = async (state) => {
        if (!activePlant) {
            alert("Vui lòng chọn cây trước khi điều khiển bơm!");
            return;
        }

        if (isPumpBusy) {
            console.log("Đang xử lý lệnh bơm, vui lòng đợi 2 giây...");
            return;
        }

        setIsPumpBusy(true);

        try {
            const response = await fetch('http://localhost:3000/api/control-pump', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state })
            });

            if (!response.ok) {
                alert("Lỗi gửi lệnh bơm!");
            }
        } catch (err) {
            console.error(err);
            alert("Không kết nối được server!");
        } finally {
            // TỰ ĐỘNG MỞ LẠI SAU 2 GIÂY (đủ để ESP32 xử lý xong)
            setTimeout(() => setIsPumpBusy(false), 2000);
        }
    };

    const displayStatus = () => {
        if (status === 'Disconnected') return 'Mất kết nối';
        if (status === 'Connecting...') return 'Đang kết nối...';
        return activePlant?._id ? 'Kết nối & Hoạt động' : 'Đã kết nối (chưa chọn cây)';
    };

    return (
        <div style={{ padding: "0 20px" }}>
            <h2 style={{ color: "#333", marginBottom: 10 }}>
                {activePlant ? `Dashboard: ${activePlant.name}` : "Dashboard"}
            </h2>

            <p style={{ color: "#666", fontSize: "0.9em", marginBottom: 20 }}>
                Trạng thái: <strong style={{ color: activePlant?._id ? '#0b0' : '#e67e22' }}>
                    {displayStatus()}
                </strong>
            </p>

            {activePlant ? (
                <>
                    {/* DỮ LIỆU CẢM BIẾN */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "30px" }}>
                        <DataCard title="Nhiệt độ" value={temp} unit="°C" />
                        <DataCard title="Độ ẩm KK" value={hum} unit="%" />
                        <DataCard title="Độ ẩm Đất" value={soil_percent} unit="%" />
                        <DataCard title="Trạng thái Bơm" value={pump} unit="" status={pump} />
                    </div>

                    {/* ĐIỀU KHIỂN TƯỚI – ĐẸP & CHỐNG SPAM */}
                    <div style={{
                        textAlign: "center",
                        padding: "30px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "15px",
                        border: "3px dashed #00593F",
                        boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                    }}>
                        <h3 style={{ margin: "0 0 25px 0", color: "#00593F", fontSize: "1.6em" }}>
                            Điều khiển tưới nước
                        </h3>

                        <div style={{ display: "flex", gap: "25px", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={() => controlPump('ON')}
                                disabled={isPumpBusy || pump === 'ON'}
                                style={{
                                    padding: "18px 50px",
                                    fontSize: "1.5em",
                                    fontWeight: "bold",
                                    border: "none",
                                    borderRadius: "15px",
                                    backgroundColor: (isPumpBusy || pump === 'ON') ? '#28a745' : '#0d6efd',
                                    color: "white",
                                    cursor: (isPumpBusy || pump === 'ON') ? 'not-allowed' : 'pointer',
                                    opacity: isPumpBusy ? 0.7 : 1,
                                    boxShadow: "0 6px 20px rgba(13,110,253,0.4)",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {isPumpBusy && pump !== 'ON' ? 'Đang bật...' : 'BẬT BƠM'}
                            </button>

                            <button
                                onClick={() => controlPump('OFF')}
                                disabled={isPumpBusy || pump === 'OFF'}
                                style={{
                                    padding: "18px 50px",
                                    fontSize: "1.5em",
                                    fontWeight: "bold",
                                    border: "none",
                                    borderRadius: "15px",
                                    backgroundColor: (isPumpBusy || pump === 'OFF') ? '#dc3545' : '#6c757d',
                                    color: "white",
                                    cursor: (isPumpBusy || pump === 'OFF') ? 'not-allowed' : 'pointer',
                                    opacity: isPumpBusy ? 0.7 : 1,
                                    boxShadow: "0 6px 20px rgba(220,53,69,0.4)",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {isPumpBusy && pump === 'ON' ? 'Đang tắt...' : 'TẮT BƠM'}
                            </button>
                        </div>

                        <p style={{ marginTop: "20px", color: "#333", fontSize: "1.1em" }}>
                            Trạng thái hiện tại: {' '}
                            <strong style={{ 
                                color: pump === 'ON' ? '#28a745' : '#dc3545',
                                fontSize: "1.3em"
                            }}>
                                {pump === 'ON' ? 'ĐANG TƯỚI' : 'ĐÃ TẮT'}
                            </strong>
                        </p>
                    </div>
                </>
            ) : (
                <div style={{
                    textAlign: "center",
                    padding: "100px 20px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "20px",
                    marginTop: "50px",
                    border: "4px dashed #ccc"
                }}>
                    <p style={{ fontSize: "1.8em", color: "#888" }}>
                        Vui lòng chọn cây để xem dữ liệu và điều khiển tưới
                    </p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;