// src/components/ZoneSelection.jsx
import React from 'react';

const ZoneSelection = ({ zones, onSelectZone }) => {
    if (!zones || zones.length === 0) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                <h3>Không có khu vực nào được phân quyền</h3>
                <p>Liên hệ quản trị viên để được cấp quyền truy cập.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 20px', minHeight: '80vh' }}>
            <h2 style={{ textAlign: 'center', color: '#00593F', marginBottom: '30px' }}>
                Chọn khu vực làm việc
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '25px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {zones.map(zone => (
                    <div
                        key={zone.zoneId}
                        onClick={() => onSelectZone(zone)}
                        style={{
                            padding: '30px 20px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #E3FCF7 0%, #FFFFFF 100%)',
                            border: '3px solid #00593F',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: '0 8px 20px rgba(0,89,63,0.15)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,89,63,0.25)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,89,63,0.15)';
                        }}
                    >
                        <h3 style={{ margin: '0 0 12px', color: '#00593F', fontSize: '1.4em' }}>
                            {zone.name}
                        </h3>
                        <p style={{ margin: '8px 0', color: '#444', fontSize: '1em' }}>
                            {zone.description || 'Chưa có mô tả'}
                        </p>
                        {zone.area && (
                            <p style={{ margin: '10px 0 0', color: '#00593F', fontWeight: 'bold' }}>
                                Diện tích: {zone.area} m²
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ZoneSelection;