// src/components/CustomizePlantSettingsModal.jsx
import React from 'react';

const THEME = {
  PRIMARY: '#00593F',
  SUCCESS: '#27ae60',
  BG_LIGHT: '#f8fff9'
};

const CustomizePlantSettingsModal = ({
  isOpen,
  onClose,
  onBack,
  onSave,
  plantName,
  plantType,
  thresholds,
  setThresholds,
  warnings,
  setWarnings,
  isSubmitting
}) => {
  if (!isOpen || !plantType) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#fff', borderRadius: 32, width: '94vw', maxWidth: 780,
        maxHeight: '94vh', padding: '44px 56px', boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
        overflowY: 'auto', position: 'relative'
      }}>
        <button onClick={onBack} style={{
          position: 'absolute', top: 20, left: 24, background: 'none', border: 'none',
          fontSize: '2em', cursor: 'pointer', color: '#888'
        }}>←</button>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 24, background: 'none', border: 'none',
          fontSize: '2.2em', cursor: 'pointer', color: '#888'
        }}>×</button>

        <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.3em', fontWeight: 900, margin: '0 0 16px' }}>
          Tùy chỉnh ngưỡng
        </h2>
        <p style={{ textAlign: 'center', fontSize: '1.6em', margin: '0 0 48px', color: '#27ae60', fontWeight: 'bold' }}>
          {plantName || plantType.name}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Nhiệt độ */}
          <div>
            <h3 style={{ color: THEME.PRIMARY, fontWeight: 'bold', marginBottom: 16 }}>Nhiệt độ (°C)</h3>
            <input type="number" placeholder="Tối thiểu" value={thresholds.temp_min || ''}
              onChange={e => setThresholds(prev => ({ ...prev, temp_min: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em' }} />
            <input type="number" placeholder="Tối đa" value={thresholds.temp_max || ''}
              onChange={e => setThresholds(prev => ({ ...prev, temp_max: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em', marginTop: 12 }} />
          </div>

          {/* Độ ẩm không khí */}
          <div>
            <h3 style={{ color: THEME.PRIMARY, fontWeight: 'bold', marginBottom: 16 }}>Độ ẩm không khí (%)</h3>
            <input type="number" placeholder="Tối thiểu" value={thresholds.air_humidity_min || ''}
              onChange={e => setThresholds(prev => ({ ...prev, air_humidity_min: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em' }} />
            <input type="number" placeholder="Tối đa" value={thresholds.air_humidity_max || ''}
              onChange={e => setThresholds(prev => ({ ...prev, air_humidity_max: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em', marginTop: 12 }} />
          </div>

          {/* Độ ẩm đất */}
          <div>
            <h3 style={{ color: THEME.PRIMARY, fontWeight: 'bold', marginBottom: 16 }}>Độ ẩm đất (%)</h3>
            <input type="number" placeholder="Khô → cần tưới" value={thresholds.soil_moisture_min || ''}
              onChange={e => setThresholds(prev => ({ ...prev, soil_moisture_min: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em' }} />
            <input type="number" placeholder="Ướt → ngừng tưới" value={thresholds.soil_moisture_max || ''}
              onChange={e => setThresholds(prev => ({ ...prev, soil_moisture_max: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em', marginTop: 12 }} />
          </div>

          {/* Thời gian tưới */}
          <div>
            <h3 style={{ color: THEME.PRIMARY, fontWeight: 'bold', marginBottom: 16 }}>Tưới tự động (giây)</h3>
            <input type="number" placeholder="8 giây ≈ 1 lít" value={thresholds.auto_water_duration || ''}
              onChange={e => setThresholds(prev => ({ ...prev, auto_water_duration: +e.target.value }))}
              style={{ width: '100%', padding: '16px', borderRadius: 20, border: '2px solid #ddd', fontSize: '1.1em' }} />
          </div>
        </div>

        {/* Cảnh báo tùy chỉnh */}
        <div style={{ marginTop: 40, padding: 28, background: '#f9f9f9', borderRadius: 24, border: '3px dashed #ccc' }}>
          <h3 style={{ color: THEME.PRIMARY, fontWeight: 'bold', margin: '0 0 20px' }}>Cảnh báo tùy chỉnh (tùy chọn)</h3>
          <textarea
            placeholder="Ví dụ: Nhiệt độ quá thấp, cây dễ bị sương muối..."
            value={warnings.low_temp || ''}
            onChange={e => setWarnings(prev => ({ ...prev, low_temp: e.target.value }))}
            style={{ width: '100%', height: 120, padding: 16, borderRadius: 16, border: '2px solid #ddd', fontSize: '1em' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 48 }}>
          <button onClick={onBack}
            style={{ padding: '16px 40px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 30, fontWeight: 'bold', fontSize: '1.1em' }}>
            ← Quay lại
          </button>
          <button onClick={onSave} disabled={isSubmitting}
            style={{ padding: '18px 64px', background: THEME.SUCCESS, color: 'white', border: 'none', borderRadius: 30, fontWeight: 'bold', fontSize: '1.3em', boxShadow: '0 12px 40px rgba(39,174,96,0.4)' }}>
            {isSubmitting ? 'Đang lưu...' : 'Hoàn tất & Kích hoạt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizePlantSettingsModal;