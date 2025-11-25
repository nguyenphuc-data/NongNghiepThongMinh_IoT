// src/App.jsx – ĐÃ ĐƯỢC CẬP NHẬT THEO YÊU CẦU: NÚT BACK NGAY CẠNH NÚT ĐỔI CÂY & GIỐNG HỆT
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import History from './components/History';
import PlantSelectionModal from './components/PlantSelectionModal';
import ZoneSelection from './components/ZoneSelection';
import axios from 'axios';
import './App.css';

const SOCKET_SERVER_URL = 'http://localhost:3000';

function App() {
    // ============== TRẠNG THÁI ĐĂNG NHẬP & PHÂN QUYỀN ==============
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState('');
    const [availableZones, setAvailableZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);

    // ============== TRẠNG THÁI CÂY & DASHBOARD ==============
    const [activePlant, setActivePlant] = useState(null);
    const [activePlantType, setActivePlantType] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('dashboard');

    // Socket & dữ liệu realtime
    const [latestData, setLatestData] = useState({});
    const [historyData, setHistoryData] = useState([]);
    const [status, setStatus] = useState('Connecting...');
    const socketRef = useRef(null);

    // ============== SOCKET.IO ==============
    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected!");
            setStatus('Connected');
            if (activePlant?._id) {
                socket.emit("set_active_plant", activePlant._id);
            }
        });

        socket.on("disconnect", () => setStatus('Disconnected'));

        socket.on("initial_data", (data) => {
            if (data.length > 0) {
                setLatestData(data[data.length - 1]);
                setHistoryData(data);
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
    }, []);

    useEffect(() => {
        if (socketRef.current?.connected && activePlant?._id) {
            socketRef.current.emit("set_active_plant", activePlant._id);
            setStatus('Connected & Active');
        }
    }, [activePlant]);

    // ============== ĐĂNG NHẬP ==============
    const handleLoginSuccess = (userData, zonesFromServer) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('username', userData.fullName || userData.username);
        localStorage.setItem('role', userData.role);

        setIsLoggedIn(true);
        setUser(userData.fullName || userData.username);
        setAvailableZones(zonesFromServer);

        if (zonesFromServer.length === 1) {
            setSelectedZone(zonesFromServer[0]);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setUser('');
        setAvailableZones([]);
        setSelectedZone(null);
        setActivePlant(null);
        setIsModalOpen(false);
    };

    useEffect(() => {
        window.resetToZoneSelection = () => {
            setSelectedZone(null);
            setActivePlant(null);
            setIsModalOpen(false);
        };
        return () => delete window.resetToZoneSelection;
    }, []);

    // ============== CHỌN CÂY ==============
    const selectActivePlantInApp = useCallback((plant) => {
        console.log('Cây được chọn:', plant.name);
        setActivePlant(plant);
        setActivePlantType(plant?.plant_type_id || null);
        setIsModalOpen(false);
    }, []);

    // ============== RENDER ==============
    if (!isLoggedIn) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    if (!selectedZone) {
        return (
            <>
                <header className="header" style={{
                    backgroundColor: '#00593F',
                    color: 'white',
                    padding: '15px 30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1 style={{ margin: 0 }}>SmartGarden</h1>
                    <div>
                        <span style={{ marginRight: '20px', fontWeight: 'bold' }}>
                            Xin chào, {user}
                        </span>
                        <button onClick={handleLogout} style={{
                            padding: '8px 16px',
                            background: '#FF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}>
                            Đăng xuất
                        </button>
                    </div>
                </header>

                <ZoneSelection
                    zones={availableZones}
                    onSelectZone={(zone) => {
                        setSelectedZone(zone);
                        setActivePlant(null);
                        setTimeout(() => setIsModalOpen(true), 100);
                    }}
                />
            </>
        );
    }

    // ============== GIAO DIỆN CHÍNH – CÓ NÚT BACK NGAY CẠNH NÚT ĐỔI CÂY ==============
    return (
        <>
            <header className="header">
                <div className="app-title">
                    <span style={{ marginRight: '10px', fontSize: '1.5em' }}>SmartGarden</span>
                    <div style={{
                        display: 'inline-block',
                        background: '#00593F',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.9em',
                        marginRight: '10px'
                    }}>
                        Khu vực: {selectedZone.name}
                    </div>
                    {activePlant && (
                        <div style={{
                            padding: '6px 14px',
                            backgroundColor: '#FF8C00',
                            color: 'white',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '0.9em',
                            display: 'inline-block'
                        }}>
                            Cây: {activePlant.name}
                        </div>
                    )}
                </div>

                <div className="user-info">
                    {/* NÚT BACK – ĐẶT NGAY TRƯỚC NÚT ĐỔI CÂY, THIẾT KẾ GIỐNG HỆT */}
                    <button
                        onClick={() => {
                            setSelectedZone(null);
                            setActivePlant(null);
                            setIsModalOpen(false);
                        }}
                        style={{
                            padding: '8px 15px',
                            marginRight: '12px',
                            backgroundColor: '#00593F',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ← Back
                    </button>

                    {/* Nút Đổi cây / Chọn cây – giữ nguyên */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            padding: '8px 15px',
                            marginRight: '20px',
                            backgroundColor: '#00593F',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {activePlant ? 'Đổi cây' : 'Chọn cây'}
                    </button>

                    <span style={{ marginRight: '15px', fontWeight: 'bold' }}>
                        Xin chào, {user}
                    </span>
                    <button onClick={handleLogout} className="logout-button">
                        Đăng xuất
                    </button>
                </div>
            </header>

            <div className="layout-container">
                <nav className="sidebar">
                    <div className="sidebar-nav">
                        <a href="#" onClick={() => setCurrentPage('dashboard')} className={currentPage === 'dashboard' ? 'active' : ''}>
                            Dashboard
                        </a>
                        <a href="#" onClick={() => setCurrentPage('history')} className={currentPage === 'history' ? 'active' : ''}>
                            Lịch sử
                        </a>
                    </div>
                </nav>

                <main className="main-content">
                    {currentPage === 'dashboard' ? (
                        <Dashboard
                            activePlant={activePlant}
                            activePlantType={activePlantType}
                            selectActivePlant={selectActivePlantInApp}
                            latestData={latestData}
                            status={status}
                            historyData={historyData}
                        />
                    ) : (
                        <History activePlant={activePlant} historyData={historyData} />
                    )}
                </main>
            </div>

            <PlantSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={selectActivePlantInApp}
                currentActivePlant={activePlant}
                zoneId={selectedZone?.zoneId}
                deviceKey="esp32_vuonrau"
            />
        </>
    );
}

export default App;