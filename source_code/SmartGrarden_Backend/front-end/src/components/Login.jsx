// src/components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';

// Định nghĩa màu sắc theo theme Xanh Lá Cây & Trắng/Bạc
const THEME = {
    PRIMARY_COLOR: '#00593F', // Xanh Lá Đậm Chủ đạo
    SECONDARY_COLOR: '#00885E', // Xanh Lá Cây Nhạt hơn cho hover
    BACKGROUND_LIGHT: '#E3FCF7', // Nền Chính
    BORDER_COLOR: '#CCCCCC',
};

const API_BASE_URL = 'http://localhost:3000/api/auth';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Đang xử lý...');
        
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username); 
            
            setMessage(`Đăng nhập thành công, chào mừng ${response.data.username}!`);
            onLoginSuccess(response.data.username); 
            
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi kết nối hoặc thông tin không hợp lệ.';
            setMessage(msg);
        }
    };

    return (
        <div 
            style={{ 
                maxWidth: '400px', 
                margin: '100px auto', 
                padding: '30px', 
                border: `1px solid ${THEME.BORDER_COLOR}`, 
                borderRadius: '8px',
                backgroundColor: '#ffffff', // Nền hộp trắng
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
        >
            <h2 style={{ color: THEME.PRIMARY_COLOR, borderBottom: `2px solid ${THEME.BORDER_COLOR}`, paddingBottom: '10px' }}>
                🌿 Đăng nhập Smart Garden
            </h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        margin: '15px 0 10px 0',
                        border: `1px solid ${THEME.BORDER_COLOR}`,
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                    }}
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        margin: '10px 0 20px 0',
                        border: `1px solid ${THEME.BORDER_COLOR}`,
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                    }}
                />
                <button 
                    type="submit" 
                    style={{ 
                        width: '100%',
                        padding: '12px 20px', 
                        backgroundColor: THEME.PRIMARY_COLOR, // Màu xanh lá đậm
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.SECONDARY_COLOR}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.PRIMARY_COLOR}
                >
                    Đăng nhập
                </button>
            </form>
            <p 
                style={{ 
                    marginTop: '20px', 
                    fontWeight: 'bold',
                    color: message.includes('thành công') ? THEME.PRIMARY_COLOR : 'red' 
                }}
            >
                {message}
            </p>
        </div>
    );
};

export default Login;