// src/components/PlantSelectionModal.jsx
// PHIÊN BẢN HOÀN HẢO CUỐI CÙNG – LUÔN MỞ VÀO "CHỌN CÂY THEO DÕI" TRƯỚC!

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
const socket = io(SOCKET_URL, { autoConnect: false });

const THEME = {
  PRIMARY: '#00593F',
  BORDER: '#86efac',
  BG_LIGHT: '#f8fff9'
};

const API_BASE_URL = 'http://localhost:3000/api/plants';

const PlantSelectionModal = ({ isOpen, onClose, onSelect, currentActivePlant, deviceKey }) => {
  const [plants, setPlants] = useState([]);
  const [plantTypes, setPlantTypes] = useState([]);
  const [latestRecognition, setLatestRecognition] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false); // ← Luôn bắt đầu bằng false
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newPlantData, setNewPlantData] = useState({
    name: '',
    location: 'Vườn chính',
    useAI: false,
    plant_type_id: ''
  });

  const resetForm = () => {
    setNewPlantData({
      name: '',
      location: 'Vườn chính',
      useAI: false,
      plant_type_id: ''
    });
  };

  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const [plantsRes, typesRes] = await Promise.all([
        axios.get(API_BASE_URL),
        axios.get(`${API_BASE_URL}/types`)
      ]);
      setPlants(plantsRes.data || []);
      setPlantTypes(typesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // QUAN TRỌNG NHẤT: MỖI KHI MODAL MỞ → RESET VỀ TRẠNG THÁI CHỌN CÂY
  useEffect(() => {
    if (isOpen) {
      setIsAddingNew(false);     // ← Đảm bảo luôn vào trang chọn cây trước
      resetForm();               // ← Xóa dữ liệu cũ
      fetchPlants();

      socket.connect();
      const handleRecognition = (data) => setLatestRecognition(data);
      socket.on('latest_recognition', handleRecognition);
      socket.emit('request_latest_recognition');
      return () => socket.off('latest_recognition', handleRecognition);
    } else {
      socket.disconnect();
    }
    return () => socket.disconnect();
  }, [isOpen, fetchPlants]);

  const recognizedType = latestRecognition
    ? plantTypes.find(t => t.name.toLowerCase() === latestRecognition.plant.toLowerCase())
    : null;

  const handleAddAndActivate = async () => {
    if (!newPlantData.name.trim()) return alert('Vui lòng nhập tên cây!');
    if (!newPlantData.useAI && !newPlantData.plant_type_id) return alert('Vui lòng chọn loại cây!');
    if (newPlantData.useAI && !recognizedType) return alert('AI chưa nhận diện được cây hợp lệ!');

    setSubmitting(true);
    try {
      const payload = {
        name: newPlantData.name,
        location: newPlantData.location,
        device_key: deviceKey,
        plant_type_id: newPlantData.useAI ? recognizedType._id : newPlantData.plant_type_id
      };

      const res = await axios.post(API_BASE_URL, payload);
      const newPlant = res.data;

      setPlants(prev => [...prev, newPlant]);
      onSelect(newPlant);
      onClose();

      // Form sạch + trạng thái về chọn cây
      resetForm();
      setIsAddingNew(false);

    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm cây!');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ================== FORM THÊM CÂY MỚI ==================
  if (isAddingNew) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: '#fff', borderRadius: 32, width: '92vw', maxWidth: 660, maxHeight: '94vh', padding: '44px 56px', boxShadow: '0 40px 120px rgba(0,0,0,0.45)', overflowY: 'auto', position: 'relative' }}>

          <button onClick={() => {
            setIsAddingNew(false);
            resetForm();
          }}
            style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', border: 'none', fontSize: '1.8em', fontWeight: '300', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>

          <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.1em', fontWeight: 900, margin: '0 0 40px' }}>
            Thêm Cây Mới
          </h2>

          {/* === PHẦN FORM GIỮ NGUYÊN NHƯ CŨ === */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>
            <input placeholder="Tên cây (ví dụ: Cà chua ban công)" value={newPlantData.name}
              onChange={e => setNewPlantData(prev => ({ ...prev, name: e.target.value }))}
              style={{ padding: '16px 20px', fontSize: '1.05em', border: '2px solid #e0e0e0', borderRadius: 20, background: '#fafafa', outline: 'none', color: '#000' }}
              onFocus={e => e.target.style.borderColor = THEME.PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
            <input placeholder="Vị trí (ví dụ: Vườn chính)" value={newPlantData.location}
              onChange={e => setNewPlantData(prev => ({ ...prev, location: e.target.value }))}
              style={{ padding: '16px 20px', fontSize: '1.05em', border: '2px solid #e0e0e0', borderRadius: 20, background: '#fafafa', outline: 'none', color: '#000' }}
              onFocus={e => e.target.style.borderColor = THEME.PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <h3 style={{ margin: '0 0 20px', fontSize: '1.35em', fontWeight: 'bold', color: THEME.PRIMARY }}>Chọn loại cây</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            <label style={{ padding: '16px 20px', background: newPlantData.useAI ? '#f9f9f9' : '#e8f7f3', border: `3px solid ${newPlantData.useAI ? '#ddd' : THEME.PRIMARY}`, borderRadius: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: '1em', fontWeight: 'bold', color: '#000' }}
              onClick={() => setNewPlantData(prev => ({ ...prev, useAI: false }))}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: newPlantData.useAI ? '#ccc' : 'white', border: `5px solid ${newPlantData.useAI ? '#ccc' : THEME.PRIMARY}` }} />
              Chọn từ danh sách
            </label>
            <label style={{ padding: '16px 20px', background: newPlantData.useAI ? '#e8f7f3' : '#f9f9f9', border: `3px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ddd'}`, borderRadius: 24, cursor: recognizedType ? 'pointer' : 'not-allowed', opacity: recognizedType ? 1 : 0.55, display: 'flex', alignItems: 'center', gap: 12, fontSize: '1em', fontWeight: 'bold', color: '#000' }}
              onClick={() => recognizedType && setNewPlantData(prev => ({ ...prev, useAI: true }))}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: newPlantData.useAI ? 'white' : '#ccc', border: `5px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ccc'}` }} />
              Dùng AI nhận diện {latestRecognition && `(${latestRecognition.plant})`}
            </label>
          </div>

          {!newPlantData.useAI ? (
            <select value={newPlantData.plant_type_id || ''} onChange={e => setNewPlantData(prev => ({ ...prev, plant_type_id: e.target.value }))}
              style={{ width: '100%', padding: '18px 20px', fontSize: '1.08em', border: `3px solid ${THEME.BORDER}`, borderRadius: 24, background: 'white', color: '#000', outline: 'none' }}>
              <option value="" disabled style={{ color: '#999' }}>-- Chọn loại cây --</option>
              {plantTypes.map(t => <option key={t._id} value={t._id} style={{ color: '#000' }}>{t.name}</option>)}
            </select>
          ) : recognizedType ? (
            <div style={{ padding: '28px 20px', background: THEME.BG_LIGHT, border: `4px solid ${THEME.BORDER}`, borderRadius: 24, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.35em', fontWeight: 'bold', color: THEME.PRIMARY }}>AI nhận diện: {latestRecognition.plant}</p>
              <p style={{ margin: '8px 0 0', fontSize: '0.98em', color: '#166534' }}>Độ tin cậy: {(latestRecognition.confidence * 100).toFixed(1)}%</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 44 }}>
            <button onClick={() => { setIsAddingNew(false); resetForm(); }}
              style={{ padding: '14px 36px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 28, fontSize: '1.02em', fontWeight: 'bold', cursor: 'pointer' }}>
              Hủy
            </button>
            <button onClick={handleAddAndActivate} disabled={submitting}
              style={{ padding: '14px 48px', background: THEME.PRIMARY, color: 'white', border: 'none', borderRadius: 28, fontSize: '1.08em', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,89,63,0.35)' }}>
              {submitting ? 'Đang thêm...' : 'Thêm & Kích hoạt'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================== TRANG CHỌN CÂY – LUÔN HIỆN TRƯỚC ==================
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 32, width: '88vw', maxWidth: 560, maxHeight: '88vh', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.4)', position: 'relative' }}>
        {/* ... phần chọn cây giữ nguyên đẹp như cũ ... */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', border: 'none', fontSize: '1.6em', fontWeight: '300', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

        <div style={{ padding: '40px 40px 24px', background: '#f8fff9', textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: THEME.PRIMARY, fontSize: '1.9em', fontWeight: 900 }}>Chọn Cây Theo Dõi</h2>
        </div>

        <div style={{ padding: '32px 40px 40px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {plants.length === 0 && !loading && <p style={{ color: '#aaa', fontSize: '1.1em', margin: '60px 0' }}>Chưa có cây nào được thêm</p>}

            {plants.map(plant => {
              const isActive = currentActivePlant?._id === plant._id;
              return (
                <div key={plant._id} onClick={() => { onSelect(plant); onClose(); }}
                  style={{ width: '100%', maxWidth: 420, padding: '20px 28px', background: '#fff', border: `2px solid ${isActive ? THEME.PRIMARY : '#eee'}`, borderRadius: 24, cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.borderColor = THEME.PRIMARY)}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.borderColor = '#eee')}>
                  <h3 style={{ margin: 0, fontSize: '1.25em', fontWeight: 'bold', color: '#000' }}>{plant.name}</h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.95em', color: '#000' }}>{plant.plant_type_id?.name} • {plant.location}</p>
                </div>
              );
            })}

            <button onClick={() => setIsAddingNew(true)}
              style={{ width: '100%', maxWidth: 420, padding: '20px', background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: 24, fontSize: '1.1em', fontWeight: 'bold', color: '#000', cursor: 'pointer', marginTop: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e8f7f3'; e.currentTarget.style.borderColor = THEME.PRIMARY; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#86efac'; }}>
              + Thêm cây mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

PlantSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  currentActivePlant: PropTypes.object,
  deviceKey: PropTypes.string
};

export default PlantSelectionModal;