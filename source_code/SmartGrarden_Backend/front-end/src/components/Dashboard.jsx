// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import DataCard from './DataCard'; // <-- CHỈ CẦN import component con DataCard

const SOCKET_SERVER_URL = 'http://localhost:3000';
const THEME = { PRIMARY_COLOR: '#00593F' };

const Dashboard = ({ activePlant }) => { 
    const [latestData, setLatestData] = useState({});
    const [historyData, setHistoryData] = useState([]);
    const [status, setStatus] = useState('Connecting...'); 
    const socketRef = useRef(null); 

    // =========================================================
    // 1. Khởi tạo socket và lắng nghe sự kiện
    // =========================================================
    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket;

        console.log("🔌 Socket.IO connecting...");

        socket.on("connect", () => {
            console.log("✅ Socket connected!");
            setStatus('Connected'); 

            if (activePlant?._id) {
                console.log(`[FE] send active on connect: ${activePlant._id}`);
                socket.emit("set_active_plant", activePlant._id);
            }
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected");
            setStatus('Disconnected'); 
        });

        // Nhận dữ liệu (Logic giữ nguyên)
        socket.on("initial_data", (data) => {
            console.log(`[INIT] ${data.length} history records`);
            if (data.length > 0) {
                setLatestData(data[data.length - 1]);
                setHistoryData(data);
            } else {
                setLatestData({});
                setHistoryData([]);
            }
        });

        socket.on("new_data", (data) => {
            setLatestData(data);
            setHistoryData(prev => {
                const newArr = [...prev, data];
                if (newArr.length > 10) newArr.shift();
                return newArr;
            });
        });

        return () => socket.disconnect();
    }, []); // <-- Khởi tạo 1 lần

    // =========================================================
    // 2. Khi đổi activePlant → gửi emit ra ngoài
    // =========================================================
    useEffect(() => {
        if (!socketRef.current || !socketRef.current.connected) return;

        if (activePlant?._id) {
            console.log(`[FE] ActivePlant changed → send set_active_plant: ${activePlant._id}`);
            socketRef.current.emit("set_active_plant", activePlant._id);
            setStatus('Connected & Active'); 
        } else {
            // Nếu không có cây active, nhưng socket vẫn kết nối
            setStatus('Connected (no plant selected)');
        }
    }, [activePlant]);

    // =========================================================
    // 3. Logic hiển thị trạng thái kết nối
    // =========================================================
    const displayStatus = (activePlant) => {
        if (status === 'Disconnected' || status === 'Connecting...') return status; 
        
        if (status === 'Connected' || status === 'Connected & Active') {
            return activePlant?._id ? 'Connected & Active' : 'Connected (no plant selected)';
        }
        return status;
    }

    const { temp, hum, soil_percent, pump } = latestData;

    return (
        <div style={{ padding: "0 20px" }}>
            <h2 style={{ color: "#333" }}>
                {activePlant ? `📊 Dashboard: ${activePlant.name}` : "📊 Dashboard"}
            </h2>

            <p style={{ color: "#666", fontSize: "0.9em" }}>
                Trạng thái kết nối: **{displayStatus(activePlant)}**
            </p>

            {activePlant ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
                    <DataCard title="Nhiệt độ" value={temp} unit="°C" />
                    <DataCard title="Độ ẩm KK" value={hum} unit="%" />
                    <DataCard title="Độ ẩm Đất" value={soil_percent} unit="%" />
                    <DataCard title="Trạng thái Bơm" value={pump} unit="" status={pump} />
                </div>
            ) : (
                <div style={{
                    textAlign: "center",
                    padding: "50px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    marginTop: "30px"
                }}>
                    <p style={{ color: "#888", fontSize: "1.2em" }}>
                        👉 Vui lòng chọn cây từ nút "🪴 Chọn Cây" trên thanh Header.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;