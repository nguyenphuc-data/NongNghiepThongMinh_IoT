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
  deviceKey = 'esp32_vuonrau'
}) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newPlant, setNewPlant] = useState({
    name: '',
    plantTypeId: '',
    datePlanted: new Date().toISOString().split('T')[0],
  });

  const availablePlantTypes = [
    { id: 'rau_muong', name: 'Rau muống' },
    { id: 'ca_chua', name: 'Cà chua' },
    { id: 'ot', name: 'Ớt' },
    { id: 'bi_do', name: 'Bí đỏ' },
    { id: 'dua_leo', name: 'Dưa leo' },
    { id: 'xa_lach', name: 'Xà lách' },
    { id: 'hanh_la', name: 'Hành lá' }
  ];

  const isAdmin = localStorage.getItem('role') === 'admin';

  const fetchPlants = useCallback(async () => {
    if (!zoneId || !isOpen) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/plants-zone/by-zone/${zoneId}`);
      setPlants(res.data || []);
    } catch (err) {
      console.error('Lỗi tải cây:', err);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [zoneId, isOpen]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // === HÀM XÓA CÂY ===
  const handleDeletePlant = async (plantId, plantName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cây "${plantName}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`)) {
      return;
    }

    try {
      await axiosClient.delete(`/plants/${plantId}`);
      alert('Đã xóa cây thành công!');
      fetchPlants(); // Tải lại danh sách
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa cây';
      alert(`Lỗi: ${msg}`);
    }
  };

  // === HÀM THÊM CÂY ===
  const handleAddPlant = async () => {
    if (!newPlant.name.trim()) return alert('Nhập tên cây đi bạn ơi!');
    if (!newPlant.plantTypeId) return alert('Chọn loại cây đi nào!');

    try {
      const payload = {
        name: newPlant.name.trim(),
        plantTypeId: newPlant.plantTypeId,
        zoneId: zoneId,
        deviceId: deviceKey,
        datePlanted: newPlant.datePlanted
      };

      const res = await axiosClient.post('/plants', payload);
      setPlants(prev => [...prev, res.data]);
      setShowAddForm(false);
      setNewPlant({ name: '', plantTypeId: '', datePlanted: new Date().toISOString().split('T')[0] });
      alert('Thêm cây thành công!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thêm cây';
      alert(`Lỗi: ${msg}`);
    }
  };

  if (!isOpen) return null;

  // === FORM THÊM CÂY ===
  if (showAddForm && isAdmin) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <div style={{ background: 'white', borderRadius: 32, width: '92vw', maxWidth: 580, padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', position: 'relative' }}>
          <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: 16, right: 16, width: 48, height: 48, borderRadius: '50%', background: '#ddd', border: 'none', fontSize: '1.8em', cursor: 'pointer' }}>×</button>

          <h2 style={{ textAlign: 'center', color: THEME.PRIMARY, fontSize: '2.2em', fontWeight: 900, marginBottom: 32 }}>
            Thêm Cây Mới
          </h2>

          <div style={{ display: 'grid', gap: 24 }}>
            <div>
              <label style={{ fontWeight: 'bold', color: THEME.PRIMARY, marginBottom: 8, display: 'block' }}>Tên cây</label>
              <input
                type="text"
                placeholder="VD: Cà chua bi Cherry"
                value={newPlant.name}
                onChange={e => setNewPlant(p => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 20, border: '3px solid #86efac', background: '#fff', fontSize: '1.1em' }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', color: THEME.PRIMARY, marginBottom: 8, display: 'block' }}>Loại cây</label>
              <select
                value={newPlant.plantTypeId}
                onChange={e => setNewPlant(p => ({ ...p, plantTypeId: e.target.value }))}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 20, border: '3px solid #86efac', background: '#fff', fontSize: '1.1em' }}
              >
                <option value="">-- Chọn loại cây --</option>
                {availablePlantTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', color: THEME.PRIMARY, marginBottom: 8, display: 'block' }}>Ngày trồng</label>
              <input
                type="date"
                value={newPlant.datePlanted}
                onChange={e => setNewPlant(p => ({ ...p, datePlanted: e.target.value }))}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 20, border: '3px solid #86efac', background: '#fff', fontSize: '1.1em' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '16px', background: '#ddd', border: 'none', borderRadius: 20, fontWeight: 'bold' }}>Hủy</button>
              <button onClick={handleAddPlant} style={{ flex: 2, padding: '16px', background: THEME.SUCCESS, color: 'white', border: 'none', borderRadius: 20, fontWeight: 'bold' }}>Thêm cây ngay</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === DANH SÁCH CÂY + NÚT XÓA ===
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
            <div
              key={plant._id}
              style={{
                padding: '20px',
                marginBottom: 16,
                background: '#fff',
                border: '3px solid #86efac',
                borderRadius: 24,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              onClick={() => { onSelect(plant); onClose(); }}
            >
              {/* NÚT XÓA – CHỈ ADMIN THẤY */}
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
                    boxShadow: '0 4px 12px rgba(231,76,60,0.4)',
                    zIndex: 5
                  }}
                  title="Xóa cây này"
                >
                  ×
                </button>
              )}

              <h3 style={{ margin: 0, fontWeight: 'bold', paddingRight: isAdmin ? 50 : 0 }}>
                {plant.name}
              </h3>
              <p style={{ margin: '8px 0 0', color: '#166534', fontSize: '0.95em' }}>
                {plant.typeInfo?.name || plant.plantTypeId || 'Chưa xác định'} • {plant.location || 'Vườn chính'}
              </p>
            </div>
          ))}
        </div>

        {/* NÚT THÊM CÂY – CHỈ ADMIN */}
        {isAdmin && (
          <div style={{ padding: '20px 36px 40px' }}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                padding: '22px',
                background: '#f0fdf4',
                border: '3px dashed #00593F',
                borderRadius: 28,
                fontSize: '1.3em',
                fontWeight: 'bold',
                color: '#00593F',
                cursor: 'pointer'
              }}
            >
              + Thêm cây mới (Quản trị viên)
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
  deviceKey: PropTypes.string
};

export default PlantSelectionModal;