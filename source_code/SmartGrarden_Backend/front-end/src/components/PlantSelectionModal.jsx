// src/components/PlantSelectionModal.jsx
// PHIÊN BẢN HOÀN HẢO CUỐI CÙNG – 3 BƯỚC SIÊU MƯỢT – CHUNG 1 FILE

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
  const [step, setStep] = useState('list'); // 'list' | 'add' | 'customize'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Dữ liệu khi thêm cây mới
  const [newPlantData, setNewPlantData] = useState({
    name: '',
    location: 'Vườn chính',
    useAI: false,
    plant_type_id: ''
  });

  // Dữ liệu tạm khi vào trang tùy chỉnh
  const [tempPlantTypeId, setTempPlantTypeId] = useState('');
  const [thresholds, setThresholds] = useState({});
  const [warnings, setWarnings] = useState({});

  const resetAll = () => {
    setNewPlantData({ name: '', location: 'Vườn chính', useAI: false, plant_type_id: '' });
    setTempPlantTypeId('');
    setThresholds({});
    setWarnings({});
    setStep('list');
  };

  const fetchPlants = useCallback(async () => {
  setLoading(true);
  try {
    const [plantsRes, typesRes] = await Promise.all([
      // ĐÃ THÊM ?populate=plant_type_id → danh sách cây có sẵn type đầy đủ
      axios.get(`${API_BASE_URL}?populate=plant_type_id`),
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

  useEffect(() => {
    if (isOpen) {
      resetAll();
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

  const selectedTypeId = newPlantData.useAI ? recognizedType?._id : newPlantData.plant_type_id;
  const selectedType = newPlantData.useAI ? recognizedType : plantTypes.find(t => t._id === newPlantData.plant_type_id);

  // Bước 2 → Bước 3: Vào trang tùy chỉnh
  const goToCustomize = async () => {
    if (!newPlantData.name.trim()) {
      return alert('Vui lòng nhập tên cây!');
    }

    let typeId = null;
    let selectedType = null;

    if (newPlantData.useAI) {
      if (!recognizedType?._id) {
        return alert('AI chưa nhận diện được cây! Vui lòng thử lại hoặc chọn thủ công.');
      }
      typeId = recognizedType._id;
      selectedType = recognizedType;
    } else {
      if (!newPlantData.plant_type_id) {
        return alert('Vui lòng chọn loại cây từ danh sách!');
      }
      typeId = newPlantData.plant_type_id;
      selectedType = plantTypes.find(t => t._id === typeId);
    }

    // Nếu đã có sẵn thresholds + warnings từ API /types → dùng luôn (nhanh hơn)
    if (selectedType?.thresholds && selectedType?.warnings) {
      console.log('[FAST FILL] Dùng dữ liệu từ danh sách loại cây →', selectedType.name);

      setThresholds({
        temp_min: selectedType.thresholds.temp_min ?? 18,
        temp_max: selectedType.thresholds.temp_max ?? 30,
        air_humidity_min: selectedType.thresholds.air_humidity_min ?? 40,
        air_humidity_max: selectedType.thresholds.air_humidity_max ?? 85,
        soil_moisture_min: selectedType.thresholds.soil_moisture_min ?? 35,
        soil_moisture_max: selectedType.thresholds.soil_moisture_max ?? 70,
        auto_water_duration: selectedType.thresholds.auto_water_duration ?? 8
      });

      setWarnings({
        low_temp: selectedType.warnings?.low_temp || '',
        high_temp: selectedType.warnings?.high_temp || '',
        low_humidity: selectedType.warnings?.low_humidity || '',
        high_humidity: selectedType.warnings?.high_humidity || '',
        low_soil: selectedType.warnings?.low_soil || '',
        high_soil: selectedType.warnings?.high_soil || '',
        soil_moisture_min: selectedType.warnings?.soil_moisture_min || '',
        soil_moisture_max: selectedType.warnings?.soil_moisture_max || '',
        temp_max: selectedType.warnings?.temp_max || ''
      });

      setTempPlantTypeId(typeId);
      setStep('customize');
      return; // → XONG, KHÔNG CẦN GỌI API LẠI!
    }

    // Nếu chưa có → mới gọi API chi tiết
    console.log('[API CALL] Đang tải chi tiết loại cây ID:', typeId);
    try {
      const res = await axios.get(`${API_BASE_URL}/types/${typeId}`);
      const typeDetail = res.data;

      console.log('[ĐÃ TẢI] Loại cây:', typeDetail.name);

      setThresholds({
        temp_min: typeDetail.thresholds.temp_min ?? 18,
        temp_max: typeDetail.thresholds.temp_max ?? 30,
        air_humidity_min: typeDetail.thresholds.air_humidity_min ?? 40,
        air_humidity_max: typeDetail.thresholds.air_humidity_max ?? 85,
        soil_moisture_min: typeDetail.thresholds.soil_moisture_min ?? 35,
        soil_moisture_max: typeDetail.thresholds.soil_moisture_max ?? 70,
        auto_water_duration: typeDetail.thresholds.auto_water_duration ?? 8
      });

      setWarnings({
        low_temp: typeDetail.warnings?.low_temp || '',
        high_temp: typeDetail.warnings?.high_temp || '',
        low_humidity: typeDetail.warnings?.low_humidity || '',
        high_humidity: typeDetail.warnings?.high_humidity || '',
        low_soil: typeDetail.warnings?.low_soil || '',
        high_soil: typeDetail.warnings?.high_soil || '',
        soil_moisture_min: typeDetail.warnings?.soil_moisture_min || '',
        soil_moisture_max: typeDetail.warnings?.soil_moisture_max || '',
        temp_max: typeDetail.warnings?.temp_max || ''
      });

      setTempPlantTypeId(typeId);
      setStep('customize');
    } catch (err) {
      console.error('Lỗi tải loại cây:', err.response?.data);
      alert('Không thể tải thông tin loại cây. Vui lòng thử lại!');
    }
  };

  // Lưu cây cuối cùng
  const savePlant = async () => {
  setSubmitting(true);
  try {
    const payload = {
      name: newPlantData.name,
      location: newPlantData.location,
      device_key: deviceKey,
      plant_type_id: tempPlantTypeId,
      thresholds,
      warnings
    };

    const res = await axios.post(API_BASE_URL, payload);
    const fullPlant = res.data; // ← backend đã trả về plant + plant_type_id đầy đủ

    setPlants(prev => [...prev, fullPlant]);
    onSelect(fullPlant);   // GỬI LUÔN PLANT + TYPE VỀ APP
    onClose();
  } catch (err) {
    alert(err.response?.data?.message || 'Lỗi thêm cây!');
  } finally {
    setSubmitting(false);
  }
};

  if (!isOpen) return null;

  // ================== BƯỚC 3: TÙY CHỈNH NGƯỠNG ==================
  if (step === 'customize') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
      }}>
        <div style={{
          background: 'white', borderRadius: 28, width: '94vw', maxWidth: 780,
          maxHeight: '94vh', padding: '40px 44px', overflowY: 'auto',
          boxShadow: '0 40px 120px rgba(0,0,0,0.5)', fontFamily: '"Segoe UI", system-ui, sans-serif'
        }}>

          {/* Nút Back & Close */}
          <button onClick={() => setStep('add')}
            style={{ position: 'absolute', top: 18, left: 20, background: 'none', border: 'none', fontSize: '2em', color: '#27ae60', fontWeight: 'bold', cursor: 'pointer' }}>
            ←
          </button>
          <button onClick={onClose}
            style={{ position: 'absolute', top: 18, right: 20, background: '#f1f1f1', border: 'none', width: 44, height: 44, borderRadius: '50%', fontSize: '1.5em', color: '#999', cursor: 'pointer' }}>
            ×
          </button>

          <h2 style={{ textAlign: 'center', color: '#00593F', fontSize: '2.1em', fontWeight: 900, margin: '0 0 6px' }}>
            Tùy chỉnh ngưỡng
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.4em', margin: '0 0 36px', color: '#27ae60', fontWeight: 'bold' }}>
            {newPlantData.name || 'Cây của bạn'}
          </p>

          <div style={{ display: 'grid', gap: 26 }}> {/* Tăng khoảng cách giữa các nhóm lớn */}

            {/* NHIỆT ĐỘ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {[
                { label: 'Nhiệt độ thấp', key: 'temp_min', unit: '°C', ph: '22', warn: 'low_temp' },
                { label: 'Nhiệt độ cao',  key: 'temp_max', unit: '°C', ph: '35', warn: 'high_temp' }
              ].map(item => (
                <div key={item.key} style={{
                  background: '#f8fff9', border: '2.5px solid #86efac', borderRadius: 24,
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#00593F', fontSize: '0.98em' }}>{item.label}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      value={thresholds[item.key] || ''}
                      onChange={e => setThresholds(p => ({ ...p, [item.key]: +e.target.value }))}
                      style={{
                        width: 78, padding: '9px 6px', borderRadius: 16, border: 'none',
                        background: 'white', fontSize: '1.22em', fontWeight: 'bold', textAlign: 'center',
                        color: '#000', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)', outline: 'none'
                      }}
                      placeholder={item.ph}
                    />
                    <span style={{ fontSize: '1.28em', color: '#27ae60', fontWeight: 'bold' }}>{item.unit}</span>
                  </div>

                  {/* Ô cảnh báo chỉ 1 dòng, vừa khung, không tràn */}
                  <input
                    type="text"
                    value={warnings[item.warn] || ''}
                    onChange={e => setWarnings(p => ({ ...p, [item.warn]: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 16,
                      border: '2px solid #d0f8e0', background: 'white',
                      fontSize: '0.92em', color: '#000', lineHeight: '1.4',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Cảnh báo khi vượt ngưỡng..."
                  />
                </div>
              ))}
            </div>

            {/* 4 NGƯỠNG CÒN LẠI */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {[
                { label: 'Độ ẩm không khí thấp', key: 'air_humidity_min',  unit: '%', ph: '50', warn: 'low_humidity' },
                { label: 'Độ ẩm không khí cao',  key: 'air_humidity_max',  unit: '%', ph: '85', warn: 'high_humidity' },
                { label: 'Độ ẩm đất khô',       key: 'soil_moisture_min', unit: '%', ph: '50', warn: 'low_soil' },
                { label: 'Độ ẩm đất ướt',       key: 'soil_moisture_max', unit: '%', ph: '80', warn: 'high_soil' }
              ].map(item => (
                <div key={item.key} style={{
                  background: '#f8fff9', border: '2.5px solid #86efac', borderRadius: 24,
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#00593F', fontSize: '0.98em' }}>{item.label}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      value={thresholds[item.key] || ''}
                      onChange={e => setThresholds(p => ({ ...p, [item.key]: +e.target.value }))}
                      style={{
                        width: 78, padding: '9px 6px', borderRadius: 16, border: 'none',
                        background: 'white', fontSize: '1.22em', fontWeight: 'bold', textAlign: 'center',
                        color: '#000', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)', outline: 'none'
                      }}
                      placeholder={item.ph}
                    />
                    <span style={{ fontSize: '1.28em', color: '#27ae60', fontWeight: 'bold' }}>{item.unit}</span>
                  </div>

                  <input
                    type="text"
                    value={warnings[item.warn] || ''}
                    onChange={e => setWarnings(p => ({ ...p, [item.warn]: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 16,
                      border: '2px solid #d0f8e0', background: 'white',
                      fontSize: '0.92em', color: '#000', lineHeight: '1.4',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Cảnh báo tùy chỉnh..."
                  />
                </div>
              ))}
            </div>

            {/* THỜI GIAN TƯỚI TỰ ĐỘNG */}
            <div style={{
              background: '#f0fdf4', border: '3px solid #86efac', borderRadius: 28,
              padding: 28, textAlign: 'center', marginTop: 12
            }}>
              <p style={{ margin: '0 0 18px', fontWeight: 'bold', color: '#00593F', fontSize: '1.18em' }}>
                Thời gian tưới tự động
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
                <input
                  type="number"
                  value={thresholds.auto_water_duration || ''}
                  onChange={e => setThresholds(p => ({ ...p, auto_water_duration: +e.target.value }))}
                  style={{
                    width: 126, padding: '15px 10px', borderRadius: 26, border: 'none',
                    background: 'white', fontSize: '2em', fontWeight: 'bold', textAlign: 'center',
                    color: '#000', boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.12)', outline: 'none'
                  }}
                  placeholder="12"
                />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '1.45em', fontWeight: 'bold', color: '#27ae60' }}>giây</span><br/>
                  <span style={{ fontSize: '0.96em', color: '#555' }}>(8 giây ≈ 1 lít)</span>
                </div>
              </div>
            </div>
          </div>

          {/* NÚT HOÀN TẤT */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 38 }}>
            <button onClick={() => setStep('add')}
              style={{ padding: '14px 42px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: 28, fontWeight: 'bold', fontSize: '1.05em' }}>
              ← Quay lại
            </button>
            <button onClick={savePlant} disabled={submitting}
              style={{
                padding: '16px 58px', background: '#27ae60', color: 'white', border: 'none',
                borderRadius: 30, fontWeight: 'bold', fontSize: '1.15em',
                boxShadow: '0 12px 35px rgba(39,174,96,0.4)'
              }}>
              {submitting ? 'Đang lưu...' : 'Hoàn tất & Kích hoạt'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================== BƯỚC 2: FORM THÊM CÂY MỚI ==================
  if (step === 'add') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: '#fff', borderRadius: 32, width: '92vw', maxWidth: 660, maxHeight: '94vh', padding: '44px 56px', boxShadow: '0 40px 120px rgba(0,0,0,0.45)', overflowY: 'auto', position: 'relative' }}>
          <button onClick={() => setStep('list')} style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', border: 'none', fontSize: '1.8em', color: '#888', cursor: 'pointer' }}>×</button>

          <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.1em', fontWeight: 900, margin: '0 0 40px' }}>Thêm Cây Mới</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>
            <input placeholder="Tên cây (ví dụ: Cà chua ban công)" value={newPlantData.name} onChange={e => setNewPlantData(p => ({ ...p, name: e.target.value }))}
              style={{ padding: '16px 20px', fontSize: '1.05em', border: '2px solid #e0e0e0', borderRadius: 20, background: '#fafafa', outline: 'none', color: '#000' }}
              onFocus={e => e.target.style.borderColor = THEME.PRIMARY} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
            <input placeholder="Vị trí (ví dụ: Vườn chính)" value={newPlantData.location} onChange={e => setNewPlantData(p => ({ ...p, location: e.target.value }))}
              style={{ padding: '16px 20px', fontSize: '1.05em', border: '2px solid #e0e0e0', borderRadius: 20, background: '#fafafa', outline: 'none', color: '#000' }}
              onFocus={e => e.target.style.borderColor = THEME.PRIMARY} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
          </div>

          <h3 style={{ margin: '0 0 20px', fontSize: '1.35em', fontWeight: 'bold', color: THEME.PRIMARY }}>Chọn loại cây</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            <label style={{ padding: '16px 20px', background: newPlantData.useAI ? '#f9f9f9' : '#e8f7f3', border: `3px solid ${newPlantData.useAI ? '#ddd' : THEME.PRIMARY}`, borderRadius: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: '1em', fontWeight: 'bold', color: '#000' }}
              onClick={() => setNewPlantData(p => ({ ...p, useAI: false }))}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: newPlantData.useAI ? '#ccc' : 'white', border: `5px solid ${newPlantData.useAI ? '#ccc' : THEME.PRIMARY}` }} />
              Chọn từ danh sách
            </label>
            <label style={{ padding: '16px 20px', background: newPlantData.useAI ? '#e8f7f3' : '#f9f9f9', border: `3px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ddd'}`, borderRadius: 24, cursor: recognizedType ? 'pointer' : 'not-allowed', opacity: recognizedType ? 1 : 0.55, display: 'flex', alignItems: 'center', gap: 12, fontSize: '1em', fontWeight: 'bold', color: '#000' }}
              onClick={() => recognizedType && setNewPlantData(p => ({ ...p, useAI: true }))}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: newPlantData.useAI ? 'white' : '#ccc', border: `5px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ccc'}` }} />
              Dùng AI nhận diện {latestRecognition && `(${latestRecognition.plant})`}
            </label>
          </div>

          {!newPlantData.useAI ? (
            <select value={newPlantData.plant_type_id || ''} onChange={e => setNewPlantData(p => ({ ...p, plant_type_id: e.target.value }))}
              style={{ width: '100%', padding: '18px 20px', fontSize: '1.08em', border: `3px solid ${THEME.BORDER}`, borderRadius: 24, background: 'white', color: '#000', outline: 'none' }}>
              <option value="" disabled>-- Chọn loại cây --</option>
              {plantTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          ) : recognizedType ? (
            <div style={{ padding: '28px 20px', background: THEME.BG_LIGHT, border: `4px solid ${THEME.BORDER}`, borderRadius: 24, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.35em', fontWeight: 'bold', color: THEME.PRIMARY }}>AI nhận diện: {latestRecognition.plant}</p>
              <p style={{ margin: '8px 0 0', fontSize: '0.98em', color: '#166534' }}>Độ tin cậy: {(latestRecognition.confidence * 100).toFixed(1)}%</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 44 }}>
            <button onClick={() => setStep('list')} style={{ padding: '14px 36px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 28, fontWeight: 'bold' }}>Hủy</button>
            <button onClick={goToCustomize} style={{ padding: '14px 48px', background: THEME.PRIMARY, color: 'white', border: 'none', borderRadius: 28, fontWeight: 'bold', fontSize: '1.08em', boxShadow: '0 10px 30px rgba(0,89,63,0.35)' }}>
              Tiếp theo →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================== BƯỚC 1: DANH SÁCH CÂY ==================
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 32, width: '88vw', maxWidth: 560, maxHeight: '88vh', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.4)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', border: 'none', fontSize: '1.6em', color: '#999', cursor: 'pointer' }}>×</button>

        <div style={{ padding: '20px 20px 12px', background: '#f8fff9', textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: THEME.PRIMARY, fontSize: '1.9em', fontWeight: 900 }}>Chọn Cây Theo Dõi</h2>
        </div>

        <div style={{ padding: '24px 32px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {plants.length === 0 && !loading && <p style={{ color: '#aaa', fontSize: '1.1em', margin: '60px 0' }}>Chưa có cây nào được thêm</p>}
            {plants.map(plant => {
              const isActive = currentActivePlant?._id === plant._id;
              return (
                <div key={plant._id} onClick={() => { onSelect(plant); onClose(); }}
                  style={{ width: '100%', maxWidth: 420, padding: '10px 28px', background: '#fff', border: `2px solid ${isActive ? THEME.PRIMARY : '#eee'}`, borderRadius: 24, cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.borderColor = THEME.PRIMARY)}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.borderColor = '#eee')}>
                  <h3 style={{ margin: 0, fontSize: '1.25em', fontWeight: 'bold', color: '#000' }}>{plant.name}</h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.95em', color: '#000' }}>{plant.plant_type_id?.name} • {plant.location}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 32px 32px', textAlign: 'center' }}>
          <button onClick={() => setStep('add')}
            style={{ width: '100%', maxWidth: 420, padding: '20px', background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: 24, fontSize: '1.1em', fontWeight: 'bold', color: '#000', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e8f7f3'; e.currentTarget.style.borderColor = THEME.PRIMARY; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#86efac'; }}>
            + Thêm cây mới
          </button>
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