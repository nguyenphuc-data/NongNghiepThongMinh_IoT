#include <Arduino.h>
#include <BluetoothSerial.h>
#include <ArduinoJson.h>

// === CẢM BIẾN ===
#define DHT_PIN     21
#define DHT_TYPE    DHT22
#define LIGHT_DO    18
#define RAIN_AO    34
#define RAIN_DO     35
#define SOIL_AO     32
#define SOIL_DO     33
#define PUMP_PIN    25

#include <DHT.h>
DHT dht(DHT_PIN, DHT_TYPE);
BluetoothSerial SerialBT;

void setup() {
  Serial.begin(115200);
  SerialBT.begin("ESP32_VUON_RAU");  // Tên Bluetooth hiện trên máy tính/điện thoại
  Serial.println("\n=== ESP32 BLUETOOTH SAN SANG ===");
  Serial.println("Pair voi: ESP32_VUON_RAU");

  dht.begin();
  pinMode(LIGHT_DO, INPUT_PULLUP);
  pinMode(RAIN_DO, INPUT);
  pinMode(SOIL_DO, INPUT);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, HIGH);  // Bật bơm thử
  delay(2000);
  digitalWrite(PUMP_PIN, LOW);   // Tắt lại
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last < 5000) return;
  last = millis();

  // Đọc cảm biến
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) { h = -1; t = -1; }

  int rain_percent = map(analogRead(RAIN_AO), 4095, 1351, 0, 100);
  rain_percent = constrain(rain_percent, 0, 100);

  int soil_percent = map(analogRead(SOIL_AO), 4095, 2600, 0, 100);
  soil_percent = constrain(soil_percent, 0, 100);

  bool is_raining = digitalRead(RAIN_DO) == LOW;
  bool is_wet     = digitalRead(SOIL_DO) == LOW;
  bool is_bright  = digitalRead(LIGHT_DO) == LOW;

  // Tạo JSON
  DynamicJsonDocument doc(300);
  doc["temp"]         = round(t * 10) / 10.0;
  doc["hum"]          = round(h * 10) / 10.0;
  doc["rain_percent"] = rain_percent;
  doc["is_raining"]   = is_raining;
  doc["soil_percent"] = soil_percent;
  doc["is_soil_wet"]  = is_wet;
  doc["is_bright"]    = is_bright;
  doc["pump"]         = digitalRead(PUMP_PIN) ? "ON" : "OFF";
  doc["device"]       = "esp32_vuonrau";

  String json;
  serializeJson(doc, json);

  // Gửi qua Bluetooth
  SerialBT.println(json);
  Serial.println("Gửi BT: " + json);
}