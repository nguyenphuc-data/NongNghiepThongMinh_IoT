// src/components/PlantSelectionModal.jsx
// PHIÊN BẢN HOÀN CHỈNH – CHỈ THÊM TÍNH NĂNG LẤY LOẠI CÂY THEO ZONE (plantTypes)

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axiosClient from '../api/axiosClient';

const THEME = {
  PRIMARY: '#00593F',
  SUCCESS: '#27ae60',
  DANGER: '#e74c3c',
  BORDER: '#86efac',
  BG_LIGHT: '#f8fff9'
};

const PlantSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  currentActivePlant,
  zoneId,
  deviceKey = 'esp32_vuonrau',
  zoneData // ← BẮT BUỘC TRUYỀN VÀO ĐỂ LẤY plantTypes
}) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestAI, setLatestAI] = useState(null);

  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [step, setStep] = useState('list');
  const [newPlantData, setNewPlantData] = useState({
    name: '',
    useAI: false,
    plantTypeId: ''
  });
  const [thresholds, setThresholds] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = localStorage.getItem('role') === 'admin';

  // === CHỈ THÊM ĐOẠN NÀY: LẤY LOẠI CÂY TỪ ZONE (HỖ TRỢ CẢ STRING & OBJECT) ===
  const allowedPlantTypes = Array.isArray(zoneData?.plantTypes)
    ? zoneData.plantTypes.map(item => {
        if (typeof item === 'string') {
          return { id: item, name: item };
        }
        if (item && item.name) {
          return { id: item._id || item.name, name: item.name };
        }
        return null;
      }).filter(Boolean)
    : [];

  // AI gợi ý – tìm trong allowedPlantTypes
  const getAIPlantTypeId = () => {
    if (!latestAI?.predictedName) return '';
    const predicted = latestAI.predictedName.toLowerCase();
    const match = allowedPlantTypes.find(t => 
      t.name.toLowerCase().includes(predicted) || 
      predicted.includes(t.name.toLowerCase())
    );
    return match?.id || allowedPlantTypes[0]?.id || '';
  };
  // ============================================================

  const fetchPlants = useCallback(async () => {
    if (!zoneId || !isOpen) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/plants-zone/by-zone/${zoneId}`);
      setPlants(res.data || []);
    } catch (err) {
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [zoneId, isOpen]);

  const fetchLatestAI = useCallback(async () => {
    if (!isOpen) return;
    try {
      const res = await axiosClient.get(`/recognitions/latest-global`);
      setLatestAI(res.data);
    } catch (err) {
      setLatestAI(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchPlants();
      fetchLatestAI();
    }
  }, [isOpen, fetchPlants, fetchLatestAI]);

  const handleDeletePlant = async (plantId, plantName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cây "${plantName}"?\n\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      // GỌI ĐÚNG API XÓA CÂY
      await axiosClient.delete(`/plants/${plantId}`);
      
      alert(`Đã xóa cây "${plantName}" thành công!`);
      
      // Cập nhật lại danh sách cây
      setPlants(prev => prev.filter(p => p._id !== plantId));
      
      // Nếu cây đang được chọn bị xóa → bỏ chọn
      if (currentActivePlant?._id === plantId) {
        onSelect(null);
      }
    } catch (err) {
      console.error('Lỗi xóa cây:', err);
      alert(err.response?.data?.message || 'Không thể xóa cây. Vui lòng thử lại!');
    }
  };

  const saveAdvancedPlant = async () => {
    if (!newPlantData.name.trim()) return alert('Nhập tên cây!');
    if (!newPlantData.plantTypeId) return alert('Chọn loại cây!');

    setSubmitting(true);
    try {
      const payload = {
        name: newPlantData.name.trim(),
        plantTypeId: newPlantData.plantTypeId,
        zoneId,
        deviceId: deviceKey,
        datePlanted: new Date().toISOString().split('T')[0],
        thresholds,
        warnings: {}
      };

      const res = await axiosClient.post('/plants', payload);
      setPlants(prev => [...prev, res.data]);
      onSelect(res.data);
      onClose();
      alert('Thêm cây thành công!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể thêm cây!');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  

  // BƯỚC 3: TÙY CHỈNH NGƯỠNG
  if (showAdvancedAdd && step === 'customize') {
    // ... giữ nguyên toàn bộ phần customize như cũ của bạn
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: 'white', borderRadius: 36, width: '92vw', maxWidth: 800, maxHeight: '94vh', padding: 44, overflowY: 'auto', boxShadow: '0 50px 140px rgba(0,0,0,0.5)', position: 'relative' }}>
          <button onClick={() => setStep('add')} style={{ position: 'absolute', top: 20, left: 24, fontSize: '2.4em', background: 'none', border: 'none', color: THEME.SUCCESS, cursor: 'pointer' }}>Back</button>
          <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, width: 50, height: 50, borderRadius: '50%', background: '#f0f0f0', fontSize: '1.9em', color: '#999' }}>Close</button>

          <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.4em', fontWeight: 900, marginBottom: 16 }}>
            Tùy Chỉnh Ngưỡng Cho
          </h2>
          <p style={{ textAlign: 'center', fontSize: '2em', fontWeight: 'bold', color: THEME.SUCCESS, marginBottom: 40 }}>
            {newPlantData.name || 'Cây mới'}
          </p>

          <div style={{ display: 'grid', gap: 28 }}>
            {[
              { label: 'Nhiệt độ thấp', key: 'temp_min', unit: '°C', default: 18 },
              { label: 'Nhiệt độ cao', key: 'temp_max', unit: '°C', default: 32 },
              { label: 'Độ ẩm không khí thấp', key: 'air_humidity_min', unit: '%', default: 50 },
              { label: 'Độ ẩm không khí cao', key: 'air_humidity_max', unit: '%', default: 85 },
              { label: 'Độ ẩm đất khô', key: 'soil_moisture_min', unit: '%', default: 40 },
              { label: 'Độ ẩm đất ướt', key: 'soil_moisture_max', unit: '%', default: 75 },
            ].map(item => (
              <div key={item.key} style={{ background: '#f8fff9', border: '3px solid #86efac', borderRadius: 28, padding: 24 }}>
                <p style={{ margin: '0 0 12px', fontWeight: 'bold', color: '#00593F', fontSize: '1.2em' }}>
                  {item.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
                  <input
                    type="number"
                    value={thresholds[item.key] ?? ''}
                    onChange={e => setThresholds(p => ({ ...p, [item.key]: +e.target.value || item.default }))}
                    placeholder={item.default.toString()}
                    style={{ width: 120, padding: '16px', fontSize: '2em', fontWeight: 'bold', textAlign: 'center', borderRadius: 20, border: 'none', background: 'white', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.12)', color: '#00593F' }}
                  />
                  <span style={{ fontSize: '2em', fontWeight: 'bold', color: THEME.SUCCESS }}>{item.unit}</span>
                </div>
              </div>
            ))}

            <div style={{ background: '#ecfdf5', border: '4px solid #10b981', borderRadius: 32, padding: 40, textAlign: 'center' }}>
              <p style={{ margin: '0 0 24px', fontSize: '1.5em', fontWeight: 'bold', color: '#00593F' }}>Thời gian tưới tự động</p>
              <input
                type="number"
                value={thresholds.auto_water_duration ?? ''}
                onChange={e => setThresholds(p => ({ ...p, auto_water_duration: +e.target.value || 10 }))}
                placeholder="10"
                style={{ width: 160, padding: '24px', fontSize: '3.5em', fontWeight: 'bold', textAlign: 'center', borderRadius: 32, border: 'none', background: 'white', boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.15)', color: '#00593F' }}
              />
              <div style={{ marginTop: 16, fontSize: '1.3em', fontWeight: 'bold', color: '#16a34a' }}>
                giây (10 giây ≈ 1.2 lít)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 48 }}>
            <button onClick={() => setStep('add')} style={{ padding: '18px 48px', background: '#f1f5f9', color: '#475569', borderRadius: 32, fontWeight: 'bold', fontSize: '1.1em', border: 'none' }}>
              Back Quay lại
            </button>
            <button onClick={saveAdvancedPlant} disabled={submitting} style={{ padding: '20px 64px', background: THEME.SUCCESS, color: 'white', borderRadius: 32, fontWeight: 'bold', fontSize: '1.3em', border: 'none', boxShadow: '0 8px 25px rgba(39,174,96,0.4)' }}>
              {submitting ? 'Đang lưu...' : 'Hoàn tất & Theo dõi ngay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // BƯỚC 2: FORM THÊM CÂY (ĐÃ XÓA AI CARD & FIX MÀU CHỮ)
  if (showAdvancedAdd && step === 'add') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: 'white', borderRadius: 36, width: '92vw', maxWidth: 660, padding: '48px 56px', boxShadow: '0 50px 140px rgba(0,0,0,0.5)', position: 'relative' }}>
          <button onClick={() => { setShowAdvancedAdd(false); setStep('list'); }} style={{ position: 'absolute', top: 24, right: 24, width: 50, height: 50, borderRadius: '50%', background: '#f0f0f0', fontSize: '1.9em', color: '#999', border: 'none', cursor: 'pointer' }}>×</button>

          <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.4em', fontWeight: 900, marginBottom: 40 }}>Thêm Cây Mới</h2>

          {/* Ô NHẬP TÊN: NỀN TRẮNG - CHỮ ĐEN */}
          <input
            type="text"
            placeholder="Tên cây (VD: Cà chua vườn chính)"
            value={newPlantData.name}
            onChange={e => setNewPlantData(p => ({ ...p, name: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '18px 24px', 
              fontSize: '1.2em', 
              borderRadius: 24, 
              border: '3px solid #86efac', 
              marginBottom: 32,
              background: '#ffffff', // Nền trắng tuyệt đối
              color: '#000000',      // Chữ đen tuyệt đối
              fontWeight: 600
            }}
          />

          {/* ĐÃ XÓA PHẦN AI GỢI Ý (CARD XANH) Ở ĐÂY */}

          <h3 style={{ margin: '10px 0 20px', fontSize: '1.5em', fontWeight: 'bold', color: THEME.PRIMARY }}>Chọn loại cây</h3>

          {allowedPlantTypes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold', fontSize: '1.3em' }}>
              Khu vực này chưa cấu hình loại cây nào!
            </p>
          ) : (
            <>
              {/* Nút chọn chế độ: Chữ đen cho dễ đọc */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <label style={{ 
                    padding: 28, 
                    background: newPlantData.useAI ? '#f9f9f9' : '#e8f7f3', 
                    border: `4px solid ${newPlantData.useAI ? '#ccc' : THEME.PRIMARY}`, 
                    borderRadius: 28, 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    color: '#000000' // Chữ đen
                  }}
                  onClick={() => setNewPlantData(p => ({ ...p, useAI: false }))}>
                  <div style={{ fontSize: '1.3em', marginBottom: 12, fontWeight: 'bold' }}>Chọn thủ công</div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: newPlantData.useAI ? '#ccc' : 'white', border: `6px solid ${newPlantData.useAI ? '#ccc' : THEME.PRIMARY}`, margin: '0 auto' }} />
                </label>

                <label style={{ 
                    padding: 28, 
                    background: newPlantData.useAI ? '#e8f7f3' : '#f9f9f9', 
                    border: `4px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ccc'}`, 
                    borderRadius: 28, 
                    cursor: latestAI ? 'pointer' : 'not-allowed', 
                    opacity: latestAI ? 1 : 0.5,
                    color: '#000000' // Chữ đen
                  }}
                  onClick={() => latestAI && setNewPlantData(p => ({ ...p, useAI: true, plantTypeId: getAIPlantTypeId() }))}>
                  <div style={{ fontSize: '1.3em', marginBottom: 12, fontWeight: 'bold' }}>Dùng AI</div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: newPlantData.useAI ? 'white' : '#ccc', border: `6px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ccc'}`, margin: '0 auto' }} />
                </label>
              </div>

              {!newPlantData.useAI ? (
                // MENU CHỌN: NỀN TRẮNG - CHỮ ĐEN
                <select
                  value={newPlantData.plantTypeId}
                  onChange={e => setNewPlantData(p => ({ ...p, plantTypeId: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '18px', 
                    fontSize: '1.2em', 
                    borderRadius: 24, 
                    border: '3px solid #86efac',
                    background: '#ffffff', // Nền trắng
                    color: '#000000',      // Chữ đen
                    fontWeight: 600
                  }}
                >
                  <option value="" style={{ color: '#888' }}>-- Chọn loại cây --</option>
                  {allowedPlantTypes.map(t => (
                    <option key={t.id} value={t.id} style={{ color: '#000' }}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: 28, background: '#ecfdf5', border: '4px solid #10b981', borderRadius: 28, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.6em', fontWeight: 'bold', color: THEME.PRIMARY }}>
                    {allowedPlantTypes.find(t => t.id === newPlantData.plantTypeId)?.name || latestAI.predictedName}
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#059669' }}>Đã chọn tự động từ AI</p>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 20, marginTop: 40, justifyContent: 'center' }}>
            <button onClick={() => { setShowAdvancedAdd(false); setStep('list'); }} style={{ padding: '16px 40px', background: '#f0f0f0', borderRadius: 30, fontWeight: 'bold', color: '#333', border: 'none', cursor: 'pointer' }}>Hủy</button>
            <button
              onClick={() => {
                if (!newPlantData.name.trim()) return alert('Nhập tên cây!');
                if (!newPlantData.plantTypeId) return alert('Chọn loại cây!');
                setStep('customize');
              }}
              style={{ padding: '16px 48px', background: THEME.PRIMARY, color: 'white', borderRadius: 30, fontWeight: 'bold', fontSize: '1.1em', border: 'none', cursor: 'pointer' }}
              disabled={allowedPlantTypes.length === 0}
            >
              Tiếp theo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN CHÍNH – GIỮ NGUYÊN
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 36, width: '90vw', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.48)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, width: 50, height: 50, borderRadius: '50%', background: '#f1f1f1', border: 'none', fontSize: '1.9em', color: '#999', zIndex: 10 }}>×</button>

        <div style={{ padding: '36px', background: 'linear-gradient(135deg, #f8fff9 0%, #e8f7f3 100%)', textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: THEME.PRIMARY, fontSize: '2.3em', fontWeight: 900 }}>Chọn Cây Theo Dõi</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px' }}>
          {loading && <p style={{ textAlign: 'center', color: '#999' }}>Đang tải...</p>}
          {plants.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: '#888', fontSize: '1.2em', marginTop: 60 }}>
              {isAdmin ? 'Chưa có cây nào. Bấm nút dưới để thêm!' : 'Chưa có cây nào trong khu vực này'}
            </p>
          )}
          {plants.map(plant => (
            <div key={plant._id} onClick={() => { onSelect(plant); onClose(); }} style={{
              padding: '20px', marginBottom: 16, background: '#fff', border: '3px solid #86efac', borderRadius: 24, cursor: 'pointer', position: 'relative'
            }}>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlant(plant._id, plant.name);
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 40,
                    height: 40,
                    background: THEME.DANGER,
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '1.4em',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(231,76,60,0.4)'
                  }}
                  title="Xóa cây này"
                >
                  ×
                </button>
              )}
              <h3 style={{ margin: 0, fontWeight: 'bold' }}>{plant.name}</h3>
              <p style={{ margin: '8px 0 0', color: '#166534', fontSize: '0.95em' }}>
                {plant.typeInfo?.name || plant.plantTypeId || 'Chưa xác định'}
              </p>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div style={{ padding: '20px 36px 40px' }}>
            <button onClick={() => { setShowAdvancedAdd(true); setStep('add'); }} style={{
              width: '100%', padding: '22px', background: '#f0fdf4', border: '3px dashed #00593F', borderRadius: 28,
              fontSize: '1.3em', fontWeight: 'bold', color: '#00593F', cursor: 'pointer'
            }}>
              + Thêm cây mới (Nâng cao)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

PlantSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  currentActivePlant: PropTypes.object,
  zoneId: PropTypes.string.isRequired,
  deviceKey: PropTypes.string,
  zoneData: PropTypes.object.isRequired // BẮT BUỘC TRUYỀN
};

export default PlantSelectionModal;