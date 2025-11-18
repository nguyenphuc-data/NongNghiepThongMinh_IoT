// src/components/History.jsx
import React from 'react';

const History = () => {
  return (
    <div style={{ backgroundColor: '#FFFFFF' }}> {/* Đảm bảo nền là trắng */}
      <h2>📜 Lịch sử Dữ liệu</h2>
      <p>Đây là nơi hiển thị các bản ghi dữ liệu cảm biến trong quá khứ dưới dạng bảng hoặc biểu đồ lịch sử.</p>
      <div style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #CCCCCC', borderRadius: '8px', minHeight: '300px' }}>
        {/* Vùng hiển thị Bảng dữ liệu lịch sử */}
        <p>Chức năng phân trang và tìm kiếm sẽ được thêm vào sau...</p>
      </div>
    </div>
  );
};

export default History;