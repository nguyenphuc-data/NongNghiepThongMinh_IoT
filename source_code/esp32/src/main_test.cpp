// #include <Arduino.h>

// // === SENSOR INCLUDES (GIỮ NGUYÊN) ===
// #include "sensor/dht22.h"
// #include "sensor/rain.h"
// #include "sensor/soil.h"
// #include "sensor/light.h"

// // === PUMP INCLUDE (MỚI) ===
// #include "sensor/pump.h" 

// // === CẤU HÌNH (Đã loại bỏ WiFi/MQTT) ===
// // Khong can setup WiFi/MQTT cho che do kiem tra nay

// // === KHAI BÁO HÀM (Đã loại bỏ WiFi/MQTT) ===
// // void setupWiFi();
// // void reconnectMQTT();
// // void publishData(...); 

// void setup() {
//     Serial.begin(115200);
//     delay(1000);
//     Serial.println("=== ESP32 → KIEM TRA SENSOR VA CHU KY BOM (5s ON/2s OFF) ===");
    
//     // Khởi tạo tất cả module
//     dht.begin();
//     setupRain();
//     setupSoil();
//     setupLight();
//     setupPump(); // <--- KHỞI TẠO BƠM
// }

// void loop() {
    
//     // --- 1. ĐỌC VÀ HIỂN THỊ DỮ LIỆU CẢM BIẾN ---
//     float h, t;
//     if (!readDHT22(h, t)) { h = t = -999; }

//     int rainP = readRainPercent();
//     bool raining = isRaining();
//     int soilP = readSoilPercent();
//     bool soilWet = isSoilWet();
//     bool bright = isBright();

//     Serial.println("------------------------------------");
//     printDHT22(h, t);
//     printRain(rainP, raining);
//     printSoil(soilP, soilWet);
//     printLight(bright);
    
//     // --- 2. LOGIC CHẠY BƠM LUÂN PHIÊN (NON-BLOCKING) ---
//     // Hàm này sẽ tự kiểm tra thời gian và chuyển trạng thái Bật/Tắt
//     runPumpCycle(); 
    
//     Serial.println("------------------------------------");

//     // Chỉ đọc cảm biến và hiển thị mỗi 500ms để không quá tải Serial
//     delay(500); 
// }