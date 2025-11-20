// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client'; // ← thêm import này
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import History from './components/History';
import PlantSelectionModal from './components/PlantSelectionModal';
import './App.css';

const SOCKET_SERVER_URL = 'http://localhost:3000'; // ← giữ nguyên
const DEVICE_KEY = 'esp32_vuonrau';

const getInitialLoginState = () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return {
        isLoggedIn: !!token,
        user: token ? (username || 'Người dùng') : ''
    };
};

function App() {
    const initialState = getInitialLoginState();
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);
    const [user, setUser] = useState(initialState.user);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [activePlant, setActivePlant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(initialState.isLoggedIn && !activePlant);

    // ==================== ĐOẠN NÀY ĐƯỢC COPY NGUYÊN TỪ DASHBOARD.JSX ====================
    const [latestData, setLatestData] = useState({});
    const [historyData, setHistoryData] = useState([]);
    const [status, setStatus] = useState('Connecting...');
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket;

        console.log("Socket.IO connecting...");

        socket.on("connect", () => {
            console.log("Socket connected!");
            setStatus('Connected');

            if (activePlant?._id) {
                console.log(`[FE] send active on connect: ${activePlant._id}`);
                socket.emit("set_active_plant", activePlant._id);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setStatus('Disconnected');
        });

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
    }, []); // ← giữ nguyên dependency rỗng như cũ

    useEffect(() => {
        if (!socketRef.current || !socketRef.current.connected) return;
        if (activePlant?._id) {
            console.log(`[FE] ActivePlant changed → send set_active_plant: ${activePlant._id}`);
            socketRef.current.emit("set_active_plant", activePlant._id);
            setStatus('Connected & Active');
        } else {
            setStatus('Connected (no plant selected)');
        }
    }, [activePlant]);
    // ================================================================================

    const handleLoginSuccess = (username) => {
        setIsLoggedIn(true);
        setUser(username);
        localStorage.setItem('username', username);
        localStorage.setItem('token', 'valid_jwt_token');

        if (!activePlant) {
            setIsModalOpen(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setUser('');
        setCurrentPage('dashboard');
        setActivePlant(null);
        setIsModalOpen(false);
    };

    const selectActivePlantInApp = useCallback((plant) => {
        setActivePlant(plant);
        setIsModalOpen(false);
    }, []);

    const renderPage = () => {
        const componentProps = {
            activePlant,
            selectActivePlant: selectActivePlantInApp,
            latestData,        // ← truyền xuống
            status,            // ← truyền xuống
            historyData        // ← truyền xuống (nếu History cần)
        };

        switch (currentPage) {
            case 'dashboard':
                return <Dashboard {...componentProps} />;
            case 'history':
                return <History activePlant={activePlant} historyData={historyData} />;
            default:
                return <Dashboard {...componentProps} />;
        }
    };

    if (!isLoggedIn) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <>
            {/* Header – giữ nguyên hoàn toàn */}
            <header className="header">
                <div className="app-title">
                    <span style={{ marginRight: '10px' }}>SmartGarden</span>
                    {activePlant && (
                        <div style={{ padding: '5px 12px', backgroundColor: '#FF8C00', color: 'white', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9em', display: 'inline-block' }}>
                            Đang theo dõi: {activePlant.name}
                        </div>
                    )}
                </div>

                <div className="user-info">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            padding: '8px 15px',
                            marginRight: '20px',
                            border: 'none',
                            borderRadius: '5px',
                            backgroundColor: '#00593F',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Chọn Cây
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
                            History
                        </a>
                    </div>
                </nav>

                <main className="main-content">
                    {renderPage()}
                </main>
            </div>

            <PlantSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={selectActivePlantInApp}
                currentActivePlant={activePlant}
                deviceKey={DEVICE_KEY}
            />
        </>
    );
}

export default App;