// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react'; 
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import History from './components/History';
import PlantSelectionModal from './components/PlantSelectionModal'; 
import './App.css'; 

const getInitialLoginState = () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return {
        isLoggedIn: !!token,
        user: token ? (username || 'Người dùng') : ''
    };
};
const DEVICE_KEY = 'esp32_vuonrau'; 

function App() {
    const initialState = getInitialLoginState();
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);
    const [user, setUser] = useState(initialState.user);
    const [currentPage, setCurrentPage] = useState('dashboard');
    
    const [activePlant, setActivePlant] = useState(null); 
    
    // ⭐ 1. Khởi tạo isModalOpen dựa trên trạng thái login ban đầu
    // Nếu chưa đăng nhập, Modal chắc chắn không mở. Nếu đã đăng nhập, mặc định mở
    // để người dùng chọn cây ngay, sau đó sẽ tắt khi chọn xong.
    const [isModalOpen, setIsModalOpen] = useState(initialState.isLoggedIn && !activePlant); 

    const handleLoginSuccess = (username) => {
        setIsLoggedIn(true);
        setUser(username);
        localStorage.setItem('username', username);
        localStorage.setItem('token', 'valid_jwt_token'); 
        
        // ⭐ 2. Gọi setIsModalOpen(true) TẠI ĐÂY (Event Handler)
        // Đây là cách an toàn nhất để kích hoạt Modal ngay sau một hành động (login).
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
        // Khi logout, đóng Modal
        setIsModalOpen(false);
    };

    const selectActivePlantInApp = useCallback((plant) => {
        setActivePlant(plant); 
        setIsModalOpen(false); 
    }, []);

    // ❌ 3. BỎ HOÀN TOÀN useEffect GÂY LỖI:
    // Vì logic kích hoạt Modal đã được chuyển sang handleLoginSuccess và useState ban đầu.
    /*
    useEffect(() => {
        if (isLoggedIn && !activePlant) {
            setIsModalOpen(true); 
        }
    }, [isLoggedIn, activePlant]);
    */
    
    const renderPage = () => {
        const componentProps = { activePlant, selectActivePlant: selectActivePlantInApp };
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard {...componentProps} />;
            case 'history':
                return <History activePlant={activePlant} />;
            default:
                return <Dashboard {...componentProps} />;
        }
    };

    if (!isLoggedIn) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <>
            {/* Header / Top Navigation */}
            <header className="header">
                <div className="app-title">
                    <span style={{ marginRight: '10px' }}>⚡️ SmartGarden</span>
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
                        🪴 Chọn Cây
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
                {/* Sidebar / Left Navigation */}
                <nav className="sidebar">
                    <div className="sidebar-nav">
                        <a 
                            href="#" 
                            onClick={() => setCurrentPage('dashboard')}
                            className={currentPage === 'dashboard' ? 'active' : ''}
                        >
                            📊 Dashboard
                        </a>
                        <a 
                            href="#" 
                            onClick={() => setCurrentPage('history')}
                            className={currentPage === 'history' ? 'active' : ''}
                        >
                            📜 History
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