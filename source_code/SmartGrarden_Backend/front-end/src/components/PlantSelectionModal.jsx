// src/components/PlantSelectionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const THEME = { PRIMARY_COLOR: '#00593F' };
const API_BASE_URL = 'http://localhost:3000/api/plants';

const PlantSelectionModal = ({ isOpen, onClose, onSelect, currentActivePlant, deviceKey }) => {
  // ========== STATE ==========
  const [plants, setPlants] = useState([]);
  const [plantTypes, setPlantTypes] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [newPlantData, setNewPlantData] = useState({
    name: '',
    location: 'Vườn chính',
    plant_type_id: '',
  });

  // ========== FETCH ==========
  const fetchPlants = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // fetch plants and types in parallel
      const [plantsRes, typesRes] = await Promise.all([
        axios.get(API_BASE_URL),
        axios.get(`${API_BASE_URL}/types`),
      ]);
      setPlants(plantsRes.data || []);
      setPlantTypes(typesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMessage('Lỗi khi tải danh sách cây. Đảm bảo server đang chạy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return; // only fetch when modal opens
    fetchPlants();
  }, [isOpen, fetchPlants]);

  // ========== DERIVED STATE (no setState in effects) ==========
  const selectedPlantType = plantTypes.find(t => t._id === newPlantData.plant_type_id) || null;

  // ========== HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlantData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPlant = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPlantData.name || !newPlantData.plant_type_id) {
      setErrorMessage('Vui lòng điền đầy đủ Tên Cây và Loại Cây.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(API_BASE_URL, {
        ...newPlantData,
        device_key: deviceKey,
      });

      const created = response.data;
      // append new plant to list
      setPlants(prev => [...prev, created]);

      // select the newly created plant (parent callback)
      if (onSelect) onSelect(created);

      // reset form
      setIsAddingNew(false);
      setNewPlantData({ name: '', location: 'Vườn chính', plant_type_id: '' });
      setErrorMessage('');
    } catch (err) {
      console.error('Error adding plant:', err);
      setErrorMessage(`Lỗi: ${err.response?.data?.message || 'Không thể thêm cây.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelect = (plant) => {
    if (onSelect) onSelect(plant);
  };

  // ========== STYLES ==========
  const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  };
  const contentStyle = {
    backgroundColor: 'white', padding: '30px', borderRadius: '10px',
    width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  };
  const listStyle = {
    listStyle: 'none', padding: 0, margin: '10px 0 0 0', border: '1px solid #EEE', borderRadius: '5px',
  };
  const activeItemStyle = {
    backgroundColor: '#E3FCF7', borderLeft: `5px solid ${THEME.PRIMARY_COLOR}`,
  };

  // ========== RENDER EARLY EXIT ==========
  if (!isOpen) return null;

  // ========== ADD NEW UI ==========
  if (isAddingNew) {
    return (
      <div style={modalStyle}>
        <div style={contentStyle}>
          <h2 style={{ color: THEME.PRIMARY_COLOR, borderBottom: '2px solid #EEE', paddingBottom: '10px' }}>
            ➕ Thêm Cây Mới
          </h2>

          {errorMessage && (
            <p style={{ color: 'red', backgroundColor: '#FEE', padding: '10px', borderRadius: '4px' }}>
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleAddPlant} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', margin: '10px 0 5px', fontWeight: 'bold' }}>Tên Cây</label>
              <input
                name="name"
                value={newPlantData.name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px' }}
                required
                placeholder="Ví dụ: Hoa Hồng Ban Công"
              />

              <label style={{ display: 'block', margin: '10px 0 5px', fontWeight: 'bold' }}>Vị trí</label>
              <input
                name="location"
                value={newPlantData.location}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px' }}
                placeholder="Vườn chính"
              />

              <label style={{ display: 'block', margin: '10px 0 5px', fontWeight: 'bold' }}>Loại Cây</label>
              <select
                name="plant_type_id"
                value={newPlantData.plant_type_id}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px' }}
                required
              >
                <option value="">--- Chọn loại cây ---</option>
                {plantTypes.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ backgroundColor: '#F9FBFA', padding: '15px', borderRadius: '6px', border: '1px dashed #CCC' }}>
              <h4 style={{ marginTop: 0, color: THEME.PRIMARY_COLOR }}>
                Tiêu chuẩn: {selectedPlantType ? selectedPlantType.name : 'Vui lòng chọn Loại Cây'}
              </h4>

              {selectedPlantType ? (
                <div>
                  <p style={{ fontSize: '0.9em', color: '#555' }}>{selectedPlantType.description}</p>
                  <p>🌡️ Nhiệt độ: {selectedPlantType.thresholds?.temp_min}°C - {selectedPlantType.thresholds?.temp_max}°C</p>
                  <p>💧 Độ ẩm Đất: {selectedPlantType.thresholds?.soil_moisture_min}% - {selectedPlantType.thresholds?.soil_moisture_max}%</p>
                </div>
              ) : (
                <p style={{ color: '#888' }}>Chọn loại cây để xem thông tin tiêu chuẩn.</p>
              )}
            </div>
          </form>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setErrorMessage('');
                setNewPlantData({ name: '', location: 'Vườn chính', plant_type_id: '' });
              }}
              style={{ padding: '10px 15px', border: '1px solid #CCC', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleAddPlant}
              disabled={submitting}
              style={{
                padding: '10px 15px', border: 'none', borderRadius: '4px',
                backgroundColor: THEME.PRIMARY_COLOR, color: 'white', cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Đang gửi...' : '✅ Xác Nhận & Kích Hoạt'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== SELECT LIST UI ==========
  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <h2 style={{ color: THEME.PRIMARY_COLOR, borderBottom: '2px solid #EEE', paddingBottom: '10px' }}>
          Chọn Cây Đang Theo Dõi
        </h2>

        {loading && <p style={{ color: '#666' }}>Đang tải dữ liệu...</p>}
        {errorMessage && !loading && <p style={{ color: 'red' }}>{errorMessage}</p>}

        <ul style={listStyle}>
          {plants.length === 0 && !loading && (
            <li style={{ padding: '15px', color: '#888' }}>Chưa có cây nào được thêm.</li>
          )}

          {plants.map(plant => {
            const isActive = currentActivePlant && currentActivePlant._id === plant._id;
            return (
              <li
                key={plant._id}
                onClick={() => handleSelect(plant)}
                style={{
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  borderBottom: '1px solid #EEE',
                  ...(isActive ? activeItemStyle : { backgroundColor: 'white' })
                }}
              >
                <h4 style={{ margin: 0, color: isActive ? THEME.PRIMARY_COLOR : '#333' }}>
                  {plant.name} {isActive && '(ACTIVE)'}
                </h4>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#888' }}>
                  Loại: {plant.plant_type_id?.name || 'Đang tải...'} | Vị trí: {plant.location}
                </p>
              </li>
            );
          })}

          <li
            onClick={() => {
              setIsAddingNew(true);
              setErrorMessage('');
            }}
            style={{
              padding: '15px',
              cursor: 'pointer',
              backgroundColor: '#F0F0F0',
              fontWeight: 'bold',
              textAlign: 'center',
              borderRadius: '0 0 5px 5px'
            }}
          >
            + Thêm Cây Mới
          </li>
        </ul>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 15px', border: '1px solid #CCC', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
          >
            Đóng
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
  deviceKey: PropTypes.string,
};

export default PlantSelectionModal;
