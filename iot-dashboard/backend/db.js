const mongoose = require('mongoose');

// KẾT NỐI ĐẾN DATABASE CHÍNH XÁC
const uri = "mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/sensor_db?retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected: sensor_db"))
  .catch(err => console.log("Lỗi kết nối:", err));

// CHỈNH COLLECTION CHÍNH XÁC
const sensorSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'readings'  // ← TÊN COLLECTION ĐÚNG
});

const Sensor = mongoose.model('Sensor', sensorSchema);

module.exports = Sensor;