// main.ino – BẢN CUỐI CÙNG + LOG FIRMWARE THẬT 100% (2025)
#include <Arduino.h>
#include <BluetoothSerial.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <esp_ota_ops.h>      // ← THÊM DÒNG NÀY
#include <esp_app_format.h>   // ← THÊM DÒNG NÀY

#define DHT_PIN     21
#define DHT_TYPE    DHT22
#define LIGHT_DO    18
#define RAIN_AO     34
#define RAIN_DO     35
#define SOIL_AO     32
#define SOIL_DO     33
#define PUMP_PIN    25

DHT dht(DHT_PIN, DHT_TYPE);
BluetoothSerial SerialBT;

// === BIẾN TOÀN CỤC ===
char jsonBuffer[400];
String btCmd = "";
bool pumpState = false;
bool lastPumpState = false;
unsigned long lastSend = 0;
unsigned long lastCommandTime = 0;

float currentTemp = -1;
float currentHum = -1;
unsigned long lastDHTRead = 0;
#define FIRMWARE_VERSION "v1.0.0 23112025"    
// === HÀM IN LOG FIRMWARE THẬT – SIÊU ĐẸP ===
void printRealFirmwareInfo() {
  const esp_app_desc_t *app = esp_ota_get_app_description();

  Serial.println("\n╔══════════════════════════════════════════════════╗");
  Serial.println("║             SMART GARDEN ESP32 - 2025            ║");
  Serial.println("╠══════════════════════════════════════════════════╣");
  Serial.printf("║ Project Name    : %s\n", app->project_name);
  Serial.printf("║ Version      : %s\n", FIRMWARE_VERSION);
  Serial.printf("║ Firmware Version: %s\n", app->version);        // ← THẬT 100%
  Serial.printf("║ Compile Time    : %s %s\n", app->date, app->time);
  Serial.printf("║ IDF Version     : %s\n", app->idf_ver);
  Serial.printf("║ Chip            : %s Rev %d\n", 
                ESP.getChipModel(), ESP.getChipRevision());
  Serial.printf("║ Flash Size      : %d MB\n", ESP.getFlashChipSize() / 1024 / 1024);
  
  const esp_partition_t *running = esp_ota_get_running_partition();
  Serial.printf("║ Running Partition: %s (0x%x)\n", running->label, running->address);
  Serial.println("╚══════════════════════════════════════════════════╝\n");
}

// === HÀM TASK ĐỌC DHT ===
void dhtTask(void *pvParameters) {
  for (;;) {
    if (millis() - lastDHTRead >= 3000) {
      float t = dht.readTemperature();
      float h = dht.readHumidity();
      if (!isnan(t)) currentTemp = round(t * 10) / 10.0;
      if (!isnan(h)) currentHum = round(h * 10) / 10.0;
      lastDHTRead = millis();
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

// === SETUP ===
void setup() {
  Serial.begin(115200);
  SerialBT.begin("ESP32_VUON_RAU");

  // ← IN FIRMWARE THẬT NGAY TỪ ĐẦU!
  printRealFirmwareInfo();

  Serial.println("=== ESP32 VUON RAU - BẢN HOÀN HẢO NHẤT 2025 ===");

  analogSetAttenuation(ADC_11db);
  dht.begin();
  pinMode(LIGHT_DO, INPUT_PULLUP);
  pinMode(RAIN_DO, INPUT);
  pinMode(SOIL_DO, INPUT);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, HIGH);

  xTaskCreatePinnedToCore(
    dhtTask, "DHT_Task", 4096, NULL, 1, NULL, 0
  );
}

// === HÀM GỬI DỮ LIỆU ===
void sendData() {
  StaticJsonDocument<400> doc;
  doc["temp"] = currentTemp;
  doc["hum"]  = currentHum;
  doc["rain_percent"] = constrain(map(analogRead(RAIN_AO), 4095, 1351, 0, 100), 0, 100);
  doc["is_raining"]   = digitalRead(RAIN_DO) == LOW;
  doc["soil_percent"] = constrain(map(analogRead(SOIL_AO), 4095, 2600, 0, 100), 0, 100);
  doc["is_soil_wet"]  = digitalRead(SOIL_DO) == LOW;
  doc["is_bright"]    = digitalRead(LIGHT_DO) == LOW;
  doc["pump"]         = pumpState ? "ON" : "OFF";
  doc["device"]       = "esp32_vuonrau";

  int len = serializeJson(doc, jsonBuffer, sizeof(jsonBuffer) - 2);
  jsonBuffer[len] = '\n';
  jsonBuffer[len + 1] = '\0';

  SerialBT.write((uint8_t*)jsonBuffer, len + 1);
  Serial.printf("Gửi BT: %s", jsonBuffer);
}

// === HÀM ĐIỀU KHIỂN BƠM ===
void controlPump(bool on) {
  digitalWrite(PUMP_PIN, on ? LOW : HIGH);
  pumpState = on;
  Serial.println(on ? "BƠM: BẬT" : "BƠM: TẮT");
}

// === LOOP CHÍNH ===
void loop() {
  while (SerialBT.available()) {
    char c = SerialBT.read();
    if (c == '\n' || c == '\r') {
      if (btCmd.length() > 0) {
        btCmd.trim();
        if (btCmd == "PUMP:ON" && millis() - lastCommandTime > 800) {
          controlPump(true);
          lastCommandTime = millis();
        }
        if (btCmd == "PUMP:OFF" && millis() - lastCommandTime > 800) {
          controlPump(false);
          lastCommandTime = millis();
        }
        btCmd = "";
      }
    } else if (c >= ' ' && c <= '~') {
      btCmd += c;
    }
    yield();
  }

  if (pumpState != lastPumpState || millis() - lastSend >= 5000) {
    sendData();
    lastPumpState = pumpState;
    lastSend = millis();
  }

  yield();
}