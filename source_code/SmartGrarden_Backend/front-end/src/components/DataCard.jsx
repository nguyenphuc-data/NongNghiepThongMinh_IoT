// src/components/DataCard.jsx
import React from 'react';

const THEME = {
    PRIMARY_COLOR: '#00593F', // Xanh đậm
    SECONDARY_COLOR: '#F3F9F8', // Nền sáng
};

const DataCard = ({ title, value, unit, status }) => {
    // Logic tạo màu sắc cho trạng thái bơm (Pump)
    let statusColor = status === 'ON' ? '#FF5733' : '#4CAF50';
    
    return (
        <div style={{
            flex: '1 1 200px', // Đảm bảo responsive
            margin: '10px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s',
            borderLeft: `5px solid ${THEME.PRIMARY_COLOR}`
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em', color: '#555' }}>{title}</h3>
            <div style={{ 
                fontSize: '2.5em', 
                fontWeight: 'bold', 
                color: status ? statusColor : THEME.PRIMARY_COLOR 
            }}>
                {value}
                <span style={{ fontSize: '0.5em', fontWeight: 'normal', color: '#888', marginLeft: '5px' }}>{unit}</span>
            </div>
        </div>
    );
};

export default DataCard;