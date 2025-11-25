// src/components/Login.jsx – PHIÊN BẢN CUỐI CÙNG, DÙNG SESSION, KHÔNG TOKEN
import React, { useState } from 'react';
import axios from 'axios';

const THEME = {
    PRIMARY_COLOR: '#00593F',
    SECONDARY_COLOR: '#00885E',
    BORDER_COLOR: '#CCCCCC',
};

const API_BASE_URL = 'http://localhost:3000/api/auth';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setMessage('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        setLoading(true);
        setMessage('Đang đăng nhập...');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/login`,
                { username: username.trim(), password: password.trim() },
                { withCredentials: true } // QUAN TRỌNG: gửi cookie session
            );

            console.log("Đăng nhập thành công! Response:", response.data);

            const user = response.data.user;
            const zones = response.data.zones || [];

            // CHỈ LƯU USER + ROLE VÀO LOCALSTORAGE (để hiển thị UI)
            localStorage.setItem('username', user.fullName || user.username);
            localStorage.setItem('role', user.role);

            setMessage('Đăng nhập thành công! Đang chuyển hướng...');

            // Gọi callback để App cập nhật trạng thái
            if (onLoginSuccess) {
                onLoginSuccess(user, zones);
            }

        } catch (error) {
            console.error("LỖI ĐĂNG NHẬP:", error.response || error);

            let errorMsg = 'Đăng nhập thất bại. Vui lòng thử lại.';

            if (error.response) {
                errorMsg = error.response.data?.message || 'Sai tên đăng nhập hoặc mật khẩu';
            } else if (error.message.includes('Network Error')) {
                errorMsg = 'Không kết nối được đến server. Kiểm tra backend!';
            }

            setMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            maxWidth: '420px',
            margin: '80px auto',
            padding: '40px',
            border: '1px solid #ddd',
            borderRadius: '16px',
            backgroundColor: '#fff',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h2 style={{
                textAlign: 'center',
                color: THEME.PRIMARY_COLOR,
                fontSize: '2em',
                margin: '0 0 30px 0',
                fontWeight: '900'
            }}>
                SmartGarden
            </h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        marginBottom: '16px',
                        border: '2px solid #ccc',
                        borderRadius: '12px',
                        fontSize: '1.1em',
                        boxSizing: 'border-box'
                    }}
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        marginBottom: '24px',
                        border: '2px solid #ccc',
                        borderRadius: '12px',
                        fontSize: '1.1em',
                        boxSizing: 'border-box'
                    }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: loading ? '#666' : THEME.PRIMARY_COLOR,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>

            {message && (
                <p style={{
                    marginTop: '20px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: message.includes('thành công') ? '#d4edda' : '#f8d7da',
                    color: message.includes('thành công') ? '#155724' : '#721c24',
                    border: `1px solid ${message.includes('thành công') ? '#c3e6cb' : '#f5c6cb'}`,
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default Login;