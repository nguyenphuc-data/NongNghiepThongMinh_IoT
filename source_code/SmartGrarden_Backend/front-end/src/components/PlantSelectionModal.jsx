// src/components/PlantSelectionModal.jsx
// PHIÊN BẢN HOÀN CHỈNH CUỐI CÙNG – ĐẸP + MẠNH + CÓ WARNINGS + THEO ZONE

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [step, setStep] = useState('list'); // 'list' | 'add' | 'customize'

  const [newPlantData, setNewPlantData] = useState({
    name: '',
    useAI: false,
    plantTypeId: ''
  });

  const [thresholds, setThresholds] = useState({});
  const [warnings, setWarnings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const resetForm = () => {
    setNewPlantData({
      name: '',
      useAI: false,
      plantTypeId: ''
    });
    setThresholds({});
    setWarnings({});
    setStep('list');
    setShowAdvancedAdd(false);
  };

  const isAdmin = localStorage.getItem('role') === 'admin';

  // ====== LẤY DANH SÁCH LOẠI CÂY ĐƯỢC PHÉP TRONG ZONE ======
  // Ngay sau useMemo của allowedPlantTypes
const allowedPlantTypes = useMemo(() => {
  if (!zoneData?.plantTypes || !Array.isArray(zoneData.plantTypes)) return [];

  const result = zoneData.plantTypes.map(item => {
    if (typeof item === 'string') {
      return {
        _id: item,
        displayName: item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      };
    }

    const id = item._id || item.code || item.id;
    const name = item.name || (item.code ? item.code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Không tên');
    return { _id: id, displayName: name };
  }).filter(Boolean);

  console.log('=== ALLOWED PLANT TYPES (sau xử lý) ===');
  console.log(result.map(t => ({ _id: t._id, displayName: t.displayName })));

  return result;
}, [zoneData?.plantTypes]);

  // AI gợi ý trong danh sách cho phép
  const getSuggestedTypeId = () => {
    if (!latestAI?.predictedName) return '';
    const predicted = latestAI.predictedName.toLowerCase().trim();

    const match = allowedPlantTypes.find(t => {
      const name = t.displayName.toLowerCase();
      const code = t._id.toLowerCase();
      return name.includes(predicted) || predicted.includes(name) || code.includes(predicted.replace(/\s+/g, '_'));
    });

    return match?._id || allowedPlantTypes[0]?._id || '';
  };

  // ====== TẢI CHI TIẾT PLANTTYPE ĐỂ LẤY THRESHOLDS + WARNINGS ======
  const loadPlantTypeDetails = async (typeId) => {
    if (!typeId) return;
    try {
      // Route mới: hỗ trợ cả _id và code (ca_chua, bi_do, rau_muong, ...)
      const res = await axiosClient.get(`/plants/types/${typeId}`);
      const t = res.data;

      setThresholds({
        temp_min: t.thresholds?.temp_min ?? 20,
        temp_max: t.thresholds?.temp_max ?? 32,
        air_humidity_min: t.thresholds?.air_humidity_min ?? 45,
        air_humidity_max: t.thresholds?.air_humidity_max ?? 85,
        soil_moisture_min: t.thresholds?.soil_moisture_min ?? 40,
        soil_moisture_max: t.thresholds?.soil_moisture_max ?? 75,
        auto_water_duration: t.thresholds?.auto_water_duration ?? 10
      });

      setWarnings({
        temp_min: t.warnings?.temp_min || "Nhiệt độ quá thấp, cây dễ bị sốc lạnh.",
        temp_max: t.warnings?.temp_max || "Nhiệt độ quá cao, lá dễ bị cháy!",
        air_humidity_min: t.warnings?.air_humidity_min || "Độ ẩm không khí thấp, cây mất nước nhanh.",
        air_humidity_max: t.warnings?.air_humidity_max || "Độ ẩm không khí quá cao, dễ bị nấm mốc.",
        soil_moisture_min: t.warnings?.soil_moisture_min || "Đất khô quá! Cần tưới ngay.",
        soil_moisture_max: t.warnings?.soil_moisture_max || "Đất quá ẩm, dễ thối rễ."
      });
    } catch (err) {
      console.error("Lỗi tải loại cây:", err.response || err);
      alert("Không thể tải thông tin loại cây!");
    }
  };

  // Khi chuyển sang bước customize → load dữ liệu
  useEffect(() => {
  if (step === 'customize' && newPlantData.plantTypeId) {
    // CHỈ GỌI API NẾU thresholds CHƯA CÓ DỮ LIỆU (nghĩa là lần đầu vào customize)
    if (Object.keys(thresholds).length === 0) {
      loadPlantTypeDetails(newPlantData.plantTypeId);
    }
  }
}, [step, newPlantData.plantTypeId, thresholds]); // thêm thresholds vào dependency

  // ====== FETCH DATA ======
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

  // ====== XÓA CÂY (ADMIN) ======
  const handleDeletePlant = async (plantId, plantName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cây "${plantName}"?\n\nHành động này không thể hoàn tác!`)) return;
    try {
      await axiosClient.delete(`/plants/${plantId}`);
      setPlants(prev => prev.filter(p => p._id !== plantId));
      if (currentActivePlant?._id === plantId) onSelect(null);
      alert(`Đã xóa cây "${plantName}" thành công!`);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi xóa cây");
    }
  };

  // ====== LƯU CÂY MỚI ======
  const savePlant = async () => {
  if (!newPlantData.name.trim()) return alert("Vui lòng nhập tên cây!");
  if (!newPlantData.plantTypeId) return alert("Vui lòng chọn loại cây!");

  // KHÔNG cần kiểm tra thresholds ở đây nữa
  // Vì useEffect đã đảm bảo: khi vào customize là có dữ liệu rồi

  setSubmitting(true);
  try {
    const payload = {
      name: newPlantData.name.trim(),
      plantTypeId: newPlantData.plantTypeId,
      zoneId,
      deviceId: deviceKey,
      thresholds,     // ← đúng cái người dùng đã chỉnh sửa (hoặc mặc định nếu không sửa)
      warnings        // ← đúng cái người dùng đã chỉnh sửa
    };

    const res = await axiosClient.post('/plants', payload);
    setPlants(prev => [...prev, res.data]);
    onSelect(res.data);
    resetForm();
    onClose();
  } catch (err) {
    alert(err.response?.data?.message || "Không thể thêm cây!");
  } finally {
    setSubmitting(false);
  }
};

  if (!isOpen) return null;

  // ====================== BƯỚC 3: TÙY CHỈNH NGƯỠNG (ĐẸP NHƯ CŨ) ======================
  if (showAdvancedAdd && step === 'customize') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: 'white', borderRadius: 28, width: '94vw', maxWidth: 780, maxHeight: '94vh', padding: '40px 44px', overflowY: 'auto', boxShadow: '0 40px 120px rgba(0,0,0,0.5)', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
          <button onClick={() => setStep('add')} style={{ position: 'absolute', top: 18, left: 20, background: 'none', border: 'none', fontSize: '2em', color: '#27ae60', fontWeight: 'bold', cursor: 'pointer' }}>Back</button>
          <button onClick={()=>{resetForm(); onClose();}} style={{ position: 'absolute', top: 18, right: 20, background: '#f1f1f1', border: 'none', width: 44, height: 44, borderRadius: '50%', fontSize: '1.5em', color: '#999', cursor: 'pointer' }}>Close</button>

          <h2 style={{ textAlign: 'center', color: '#00593F', fontSize: '2.1em', fontWeight: 900, margin: '0 0 6px' }}>
            Tùy chỉnh ngưỡng
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.6em', margin: '0 0 36px', color: '#27ae60', fontWeight: 'bold' }}>
            {newPlantData.name}
          </p>

          <div style={{ display: 'grid', gap: 26 }}>

            {/* Nhiệt độ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {[
                { label: 'Nhiệt độ thấp', key: 'temp_min', unit: '°C', warn: 'temp_min' },
                { label: 'Nhiệt độ cao', key: 'temp_max', unit: '°C', warn: 'temp_max' }
              ].map(item => (
                <div key={item.key} style={{ background: '#f8fff9', border: '2.5px solid #86efac', borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#00593F', fontSize: '0.98em' }}>{item.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="number" value={thresholds[item.key] || ''} onChange={e => setThresholds(p => ({ ...p, [item.key]: +e.target.value }))}
                      style={{ width: 78, padding: '9px 6px', borderRadius: 16, border: 'none', background: 'white', fontSize: '1.22em', fontWeight: 'bold', textAlign: 'center', color: '#000', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)', outline: 'none' }} />
                    <span style={{ fontSize: '1.28em', color: '#27ae60', fontWeight: 'bold' }}>{item.unit}</span>
                  </div>
                  <input type="text" value={warnings[item.warn] || ''} onChange={e => setWarnings(p => ({ ...p, [item.warn]: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: 16, border: '2px solid #d0f8e0', background: 'white', fontSize: '0.92em', color: '#000' }}
                    placeholder="Cảnh báo khi quá thấp..." />
                </div>
              ))}
            </div>

            {/* Độ ẩm không khí + Đất */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {[
                { label: 'Độ ẩm không khí thấp', key: 'air_humidity_min', unit: '%', warn: 'air_humidity_min' },
                { label: 'Độ ẩm không khí cao', key: 'air_humidity_max', unit: '%', warn: 'air_humidity_max' },
                { label: 'Độ ẩm đất khô', key: 'soil_moisture_min', unit: '%', warn: 'soil_moisture_min' },
                { label: 'Độ ẩm đất ướt', key: 'soil_moisture_max', unit: '%', warn: 'soil_moisture_max' }
              ].map(item => (
                <div key={item.key} style={{ background: '#f8fff9', border: '2.5px solid #86efac', borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#00593F', fontSize: '0.98em' }}>{item.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="number" value={thresholds[item.key] || ''} onChange={e => setThresholds(p => ({ ...p, [item.key]: +e.target.value }))}
                      style={{ width: 78, padding: '9px 6px', borderRadius: 16, border: 'none', background: 'white', fontSize: '1.22em', fontWeight: 'bold', textAlign: 'center', color: '#000', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)', outline: 'none' }} />
                    <span style={{ fontSize: '1.28em', color: '#27ae60', fontWeight: 'bold' }}>{item.unit}</span>
                  </div>
                  <input type="text" value={warnings[item.warn] || ''} onChange={e => setWarnings(p => ({ ...p, [item.warn]: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: 16, border: '2px solid #d0f8e0', background: 'white', fontSize: '0.92em', color: '#000' }}
                    placeholder="Cảnh báo tùy chỉnh..." />
                </div>
              ))}
            </div>

            {/* Thời gian tưới tự động */}
            <div style={{ background: '#f0fdf4', border: '3px solid #86efac', borderRadius: 28, padding: 28, textAlign: 'center', marginTop: 12 }}>
              <p style={{ margin: '0 0 18px', fontWeight: 'bold', color: '#00593F', fontSize: '1.18em' }}>Thời gian tưới tự động</p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
                <input type="number" value={thresholds.auto_water_duration || ''} onChange={e => setThresholds(p => ({ ...p, auto_water_duration: +e.target.value }))}
                  style={{ width: 126, padding: '15px 10px', borderRadius: 26, border: 'none', background: 'white', fontSize: '2em', fontWeight: 'bold', textAlign: 'center', color: '#000', boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.12)', outline: 'none' }}
                  placeholder="10" />
                <div>
                  <span style={{ fontSize: '1.45em', fontWeight: 'bold', color: '#27ae60' }}>giây</span><br />
                  <span style={{ fontSize: '0.96em', color: '#555' }}>(8 giây ≈ 1 lít)</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 38 }}>
            <button onClick={() => setStep('add')} style={{ padding: '14px 42px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: 28, fontWeight: 'bold', fontSize: '1.05em' }}>
              ← Quay lại
            </button>
            <button onClick={savePlant} disabled={submitting}
              style={{ padding: '16px 58px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 30, fontWeight: 'bold', fontSize: '1.15em', boxShadow: '0 12px 35px rgba(39,174,96,0.4)' }}>
              {submitting ? 'Đang lưu...' : 'Hoàn tất & Kích hoạt'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================== BƯỚC 2: FORM THÊM CÂY ======================
  if (showAdvancedAdd && step === 'add') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: 'white', borderRadius: 36, width: '92vw', maxWidth: 660, padding: '48px 56px', boxShadow: '0 50px 140px rgba(prenominal 0,0,0,0.5)', position: 'relative' }}>
          <button
  onClick={() => {
    resetForm();
    onClose();
  }}
  aria-label="Đóng"
  style={{
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(0, 0, 0, 0.09)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    padding: 0,
    margin: 0,

    // BÍ KÍP CĂN GIỮA HOÀN HẢO 100%
    display: 'grid',
    placeItems: 'center',

    // Font + chữ × chuẩn như Apple
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '800',
    fontSize: '22px',        // Chính xác 22px cho × nằm tâm tuyệt đối
    lineHeight: 1,
    color: '#666',
    textAlign: 'center',
    leadingTrim: 'both',     // Fix nhỏ cho một số trình duyệt
    textEdge: 'cap',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(254, 226, 226, 0.95)';
    e.currentTarget.style.color = '#dc2626';
    e.currentTarget.style.transform = 'scale(1.1)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
    e.currentTarget.style.color = '#666';
    e.currentTarget.style.transform = 'scale(1)';
  }}
  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
>
  ×
</button>

          <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.4em', fontWeight: 900, marginBottom: 40 }}>Thêm Cây Mới</h2>

          <input
            type="text"
            placeholder="Tên cây (VD: Cà chua vườn chính)"
            value={newPlantData.name}
            onChange={e => setNewPlantData(p => ({ ...p, name: e.target.value }))}
            style={{ width: '100%', padding: '18px 24px', fontSize: '1.2em', borderRadius: 24, border: '3px solid #86efac', marginBottom: 32, background: '#ffffff', color: '#000000', fontWeight: 600 }}
          />

          <h3 style={{ margin: '10px 0 20px', fontSize: '1.5em', fontWeight: 'bold', color: THEME.PRIMARY }}>Chọn loại cây</h3>

          {allowedPlantTypes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold', fontSize: '1.3em' }}>
              Khu vực này chưa cấu hình loại cây nào!
            </p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <label style={{ padding: 28, background: newPlantData.useAI ? '#f9f9f9' : '#e8f7f3', border: `4px solid ${newPlantData.useAI ? '#ccc' : THEME.PRIMARY}`, borderRadius: 28, cursor: 'pointer', textAlign: 'center', color: '#000000' }}
                  onClick={() => setNewPlantData(p => ({ ...p, useAI: false }))}>
                  <div style={{ fontSize: '1.3em', marginBottom: 12, fontWeight: 'bold' }}>Chọn thủ công</div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: newPlantData.useAI ? '#ccc' : 'white', border: `6px solid ${newPlantData.useAI ? '#ccc' : THEME.PRIMARY}`, margin: '0 auto' }} />
                </label>

                <label style={{ padding: 28, background: newPlantData.useAI ? '#e8f7f3' : '#f9f9f9', border: `4px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ccc'}`, borderRadius: 28, cursor: latestAI ? 'pointer' : 'not-allowed', opacity: latestAI ? 1 : 0.5, color: '#000000' }}
                  onClick={() => latestAI && setNewPlantData(p => ({ ...p, useAI: true, plantTypeId: getSuggestedTypeId() }))}>
                  <div style={{ fontSize: '1.3em', marginBottom: 12, fontWeight: 'bold' }}>Dùng AI</div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: newPlantData.useAI ? 'white' : '#ccc', border: `6px solid ${newPlantData.useAI ? THEME.PRIMARY : '#ccc'}`, margin: '0 auto' }} />
                </label>
              </div>

              {!newPlantData.useAI ? (
                <select
                  value={newPlantData.plantTypeId}
                  onChange={e => setNewPlantData(p => ({ ...p, plantTypeId: e.target.value }))}
                  style={{ width: '100%', padding: '18px', fontSize: '1.2em', borderRadius: 24, border: '3px solid #86efac', background: '#ffffff', color: '#000000', fontWeight: 600 }}
                >
                  <option value="">-- Chọn loại cây --</option>
                  {allowedPlantTypes.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.displayName}   {/* ← hiển thị tên đẹp */}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: 28, background: '#ecfdf5', border: '4px solid #10b981', borderRadius: 28, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.6em', fontWeight: 'bold', color: THEME.PRIMARY }}>
                    {allowedPlantTypes.find(t => t._id === newPlantData.plantTypeId)?.name || latestAI?.predictedName || 'Đang chọn...'}
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#059669' }}>Đã chọn tự động từ AI</p>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 20, marginTop: 40, justifyContent: 'center' }}>
            <button onClick={() => { setShowAdvancedAdd(false); setStep('list'); }} style={{ padding: '16px 40px', background: '#f0f0f0', borderRadius: 30, fontWeight: 'bold', color: '#333', border: 'none' }}>Hủy</button>
            <button
              onClick={() => {
                if (!newPlantData.name.trim()) return alert('Nhập tên cây!');
                if (!newPlantData.plantTypeId) return alert('Chọn loại cây!');
                setStep('customize');
              }}
              style={{ padding: '16px 48px', background: THEME.PRIMARY, color: 'white', borderRadius: 30, fontWeight: 'bold', fontSize: '1.1em', border: 'none' }}
              disabled={allowedPlantTypes.length === 0}
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================== BƯỚC 1: DANH SÁCH CÂY ======================
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 36, width: '90vw', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.48)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <button
  onClick={onClose}
  style={{
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    transition: 'all 0.25s ease',
    outline: 'none'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
    e.currentTarget.style.color = '#ef4444';
    e.currentTarget.style.transform = 'scale(1.1)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
    e.currentTarget.style.color = '#666';
    e.currentTarget.style.transform = 'scale(1)';
  }}
>
  ×
</button>

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
  onClick={onClose}
  aria-label="Đóng"
  style={{
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.16)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', // Fix cho Safari
    zIndex: 1000,
    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    userSelect: 'none'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(254, 226, 226, 0.9)';
    e.currentTarget.style.color = '#dc2626';
    e.currentTarget.style.transform = 'scale(1.08)';
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.25)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.92)';
    e.currentTarget.style.color = '#666';
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.16)';
  }}
  onMouseDown={(e) => {
    e.currentTarget.style.transform = 'scale(0.95)';
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = 'scale(1.08)';
  }}
>
  ×
</button>
              )}
              <h3 style={{ margin: 0, fontWeight: 'bold' }}>{plant.name}</h3>
              <p style={{ margin: '8px 0 0', color: '#166534', fontSize: '0.95em' }}>
                {plant.typeInfo?.name || plant.plant_type_id.name || 'Chưa xác định'}
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
              + Thêm cây mới
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
  zoneData: PropTypes.object.isRequired
};

export default PlantSelectionModal;