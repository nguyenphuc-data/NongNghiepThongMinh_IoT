// src/components/PlantSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const THEME = {
    PRIMARY_COLOR: '#00593F',
};
const API_BASE_URL = 'http://localhost:3000/api/plants';

const PlantSelectionModal = ({ isOpen, onClose, onSelect, currentActivePlant, deviceKey }) => {
    if (!isOpen) return null;

    const [plants, setPlants] = useState([]);
    const [plantTypes, setPlantTypes] = useState([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newPlantData, setNewPlantData] = useState({
        name: '',
        location: 'Vườn chính',
        plant_type_id: '',
    });

    const [selectedPlantType, setSelectedPlantType] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // --- LOGIC FETCH DỮ LIỆU ---
    const fetchPlants = async () => {
        try {
            const [plantsRes, typesRes] = await Promise.all([
                axios.get(API_BASE_URL),
                axios.get(`${API_BASE_URL}/types`)
            ]);
            setPlants(plantsRes.data);
            setPlantTypes(typesRes.data);
            setErrorMessage('');
        } catch (err) {
            console.error('Error fetching data:', err);
            setErrorMessage('Lỗi khi tải danh sách cây. Đảm bảo server đang chạy.');
        }
    };

    useEffect(() => {
        fetchPlants();
    }, []);

    // Cập nhật thông tin loại cây khi người dùng chọn trong form thêm mới
    useEffect(() => {
        if (newPlantData.plant_type_id) {
            const type = plantTypes.find(t => t._id === newPlantData.plant_type_id);
            setSelectedPlantType(type);
        } else {
            setSelectedPlantType(null);
        }
    }, [newPlantData.plant_type_id, plantTypes]);

    // --- LOGIC XỬ LÝ FORM THÊM MỚI ---
    const handleInputChange = (e) => {
        setNewPlantData({ ...newPlantData, [e.target.name]: e.target.value });
    };

    const handleAddPlant = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!newPlantData.name || !newPlantData.plant_type_id) {
            setErrorMessage('Vui lòng điền đầy đủ Tên Cây và Loại Cây.');
            return;
        }

        try {
            // Gửi dữ liệu cây mới lên Server (kèm device_key cố định)
            const response = await axios.post(API_BASE_URL, {
                ...newPlantData,
                device_key: deviceKey // 'esp32_vuonrau'
            });
            
            const newPlant = response.data;
            
            // 1. Cập nhật danh sách cây trên FE
            setPlants(prevPlants => [...prevPlants, newPlant]);
            
            // 2. Kích hoạt cây vừa tạo (và gửi lệnh Socket.IO)
            onSelect(newPlant);
            
            // 3. Reset form
            setIsAddingNew(false);
            setNewPlantData({ name: '', location: 'Vườn chính', plant_type_id: '' });

        } catch (err) {
             console.error('Error adding plant:', err);
             setErrorMessage(`Lỗi: ${err.response?.data?.message || 'Không thể thêm cây. Có thể tên đã tồn tại.'}`);
        }
    };

    // --- GIAO DIỆN CHUNG ---
    const modalStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    };
    const contentStyle = {
        backgroundColor: 'white', padding: '30px', borderRadius: '10px', 
        width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
    };
    const listStyle = { 
        listStyle: 'none', padding: 0, margin: 0, border: '1px solid #EEE', borderRadius: '5px' 
    };
    const activeItemStyle = {
        backgroundColor: '#E3FCF7', borderLeft: `5px solid ${THEME.PRIMARY_COLOR}`
    }

    // Giao diện Thêm Cây Mới
    if (isAddingNew) {
        return (
            <div style={modalStyle}>
                <div style={contentStyle}>
                    <h2 style={{ color: THEME.PRIMARY_COLOR, borderBottom: '2px solid #EEE', paddingBottom: '10px' }}>
                        ➕ Thêm Cây Mới
                    </h2>
                    {errorMessage && <p style={{ color: 'red', backgroundColor: '#FEE', padding: '10px', borderRadius: '4px' }}>{errorMessage}</p>}
                    <form onSubmit={handleAddPlant} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* Cột 1: Form Input */}
                        <div>
                            <label style={{ display: 'block', margin: '10px 0 5px', fontWeight: 'bold' }}>Tên Cây (Ví dụ: Hoa Hồng Ban Công)</label>
                            <input
                                name="name"
                                value={newPlantData.name}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px' }}
                                required
                            />
                             <label style={{ display: 'block', margin: '10px 0 5px', fontWeight: 'bold' }}>Vị trí</label>
                            <input
                                name="location"
                                value={newPlantData.location}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px' }}
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

                        {/* Cột 2: Tiêu chuẩn của Loại Cây */}
                        <div style={{ backgroundColor: '#F9FBFA', padding: '15px', borderRadius: '6px', border: '1px dashed #CCC' }}>
                            <h4 style={{ marginTop: 0, color: THEME.PRIMARY_COLOR }}>
                                Tiêu chuẩn: {selectedPlantType ? selectedPlantType.name : 'Vui lòng chọn Loại Cây'}
                            </h4>
                            {selectedPlantType ? (
                                <div>
                                    <p style={{ fontSize: '0.9em', color: '#555' }}>
                                        {selectedPlantType.description}
                                    </p>
                                    <p>🌡️ Nhiệt độ: {selectedPlantType.thresholds.temp_min}°C - {selectedPlantType.thresholds.temp_max}°C</p>
                                    <p>💧 Độ ẩm Đất: {selectedPlantType.thresholds.soil_moisture_min}% - {selectedPlantType.thresholds.soil_moisture_max}%</p>
                                </div>
                            ) : (
                                <p style={{ color: '#888' }}>Chọn loại cây để xem thông tin tiêu chuẩn.</p>
                            )}
                        </div>
                    </form>
                    
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setIsAddingNew(false)} style={{ padding: '10px 15px', border: '1px solid #CCC', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>
                            Hủy
                        </button>
                        <button type="submit" onClick={handleAddPlant} style={{ padding: '10px 15px', border: 'none', borderRadius: '4px', backgroundColor: THEME.PRIMARY_COLOR, color: 'white', cursor: 'pointer' }}>
                            ✅ Xác Nhận & Kích Hoạt
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Giao diện Chọn Cây
    return (
        <div style={modalStyle}>
            <div style={contentStyle}>
                <h2 style={{ color: THEME.PRIMARY_COLOR, borderBottom: '2px solid #EEE', paddingBottom: '10px' }}>
                    Chọn Cây Đang Theo Dõi
                </h2>
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                
                <ul style={listStyle}>
                    {plants.length === 0 && <li style={{ padding: '15px', color: '#888' }}>Chưa có cây nào được thêm.</li>}
                    {plants.map(plant => (
                        <li 
                            key={plant._id} 
                            onClick={() => onSelect(plant)}
                            style={{ 
                                padding: '15px', 
                                cursor: 'pointer', 
                                transition: 'background-color 0.2s',
                                borderBottom: '1px solid #EEE',
                                ...(currentActivePlant && currentActivePlant._id === plant._id ? activeItemStyle : { backgroundColor: 'white', ':hover': { backgroundColor: '#F9F9F9' } })
                            }}
                        >
                            <h4 style={{ margin: 0, color: currentActivePlant && currentActivePlant._id === plant._id ? THEME.PRIMARY_COLOR : '#333' }}>
                                {plant.name}
                                {currentActivePlant && currentActivePlant._id === plant._id && " (ACTIVE)"}
                            </h4>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#888' }}>
                                Loại: {plant.plant_type_id?.name || 'Đang tải...'} | Vị trí: {plant.location}
                            </p>
                        </li>
                    ))}
                    
                    {/* Nút Thêm Cây Mới (luôn nằm dưới cùng) */}
                    <li 
                        onClick={() => setIsAddingNew(true)}
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
                    <button onClick={onClose} style={{ padding: '10px 15px', border: '1px solid #CCC', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlantSelectionModal;