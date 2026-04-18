#include <Arduino.h>

// Định nghĩa chân Relay theo sơ đồ bạn đã đấu nối
#define RELAY_PIN 25 

void setup() {
    // Khởi tạo Serial để theo dõi trên máy tính
    Serial.begin(115200);
    delay(1000); 

    Serial.println("========================================");
    Serial.println("   KIEM TRA QUY TRINH HOAT DONG RELAY   ");
    Serial.println("========================================");

    // Cấu hình chân D25 là đầu ra
    pinMode(RELAY_PIN, OUTPUT);

    // Trạng thái ban đầu: Tắt
    digitalWrite(RELAY_PIN, HIGH); 
    Serial.println("Setup xong: Mac dinh Relay TAT (HIGH)");
}

void loop() {
    // --- THU NGHIEM MUC THAP (LOW) ---
    Serial.println("Dang kich muc: LOW...");
    digitalWrite(RELAY_PIN, LOW); 
    Serial.println("-> Kiem tra den LED va tieng 'Tach'");
    delay(5000); // Giữ trong 5 giây

    // --- THU NGHIEM MUC CAO (HIGH) ---
    Serial.println("Dang kich muc: HIGH...");
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("-> Kiem tra den LED va tieng 'Tach'");
    delay(5000); // Giữ trong 5 giây

    Serial.println("----------------------------------------");
}