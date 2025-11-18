// seed.js
const mongoose = require('mongoose');
const PlantType = require('./PlantType'); // Thay đổi đường dẫn nếu cần
require('dotenv').config();
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_garden_db_fallback';

const seedPlantTypes = [
    {
        name: "Hoa Hồng",
        thresholds: {
            temp_max: 28, 
            temp_min: 15,
            soil_moisture_min: 35, 
            soil_moisture_max: 65,
        },
        description: "Thích hợp với khí hậu mát mẻ, cần đất thoát nước tốt."
    },
    {
        name: "Rau Xà Lách",
        thresholds: {
            temp_max: 25, 
            temp_min: 12,
            soil_moisture_min: 40, 
            soil_moisture_max: 80,
        },
        description: "Cần độ ẩm cao, ưa bóng râm nhẹ."
    },
    // Thêm các loại cây khác tại đây
];

async function seedDatabase() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công!');

    try {
        console.log('Đang xóa dữ liệu PlantType cũ...');
        await PlantType.deleteMany({}); // Xóa tất cả dữ liệu cũ để tránh trùng lặp

        console.log('Đang chèn dữ liệu PlantType mới...');
        await PlantType.insertMany(seedPlantTypes);
        console.log(`✅ Đã chèn thành công ${seedPlantTypes.length} loại cây.`);

    } catch (error) {
        console.error('❌ Lỗi trong quá trình seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Đã đóng kết nối DB.');
    }
}

seedDatabase();