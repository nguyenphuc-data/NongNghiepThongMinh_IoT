#include <Arduino.h>
#include <BluetoothSerial.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Preferences.h>   
#include <esp_task_wdt.h>  
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
//  ĐỊNH NGHĨA CHÂN  ---
#define DHT_PIN     21
#define DHT_TYPE    DHT22
#define LIGHT_DO    18
#define RAIN_AO     34
#define RAIN_DO     35
#define SOIL_AO     32
#define SOIL_DO     33
#define PUMP_PIN    25

#define DEVICE_KEY "esp32_vuonrau"
#define WDT_TIMEOUT 20  
#define FIRMWARE_VERSION "v1.2.0-FINAL-RTOS"

// Bộ nhớ đệm tĩnh
char logBuf[128];
char jsonBuf[512];

// Biến điều khiển & Trạng thái
volatile bool rain_flag = false;
bool pump_status = false;

struct SensorData {
    float t, h;
    int rain_p, soil_p;
    bool is_raining, is_soil_wet, is_bright;
};

BluetoothSerial SerialBT;
DHT dht(DHT_PIN, DHT_TYPE);
Preferences prefs; 
QueueHandle_t sensorQueue;

// ---HÀM HỖ TRỢ (LOGGING & INFO) ---
void getUptimeStr(char* target) {
    unsigned long s = millis() / 1000;
    snprintf(target, 15, "%02lu:%02lu:%02lu", (s/3600), (s%3600)/60, s%60);
}

void sendLog(const char* msg, bool isError = false) {
    char tStr[15]; getUptimeStr(tStr);
    snprintf(logBuf, sizeof(logBuf), "[%s] %s %s", tStr, isError ? "[ERR]" : "[INFO]", msg);
    Serial.println(logBuf);
    if (SerialBT.hasClient()) SerialBT.println(logBuf);
}

void IRAM_ATTR rainISR() { 
    rain_flag = true; 
}

void setPump(bool turnOn) {
    pump_status = turnOn;
    prefs.putBool("last_p_state", pump_status);
    digitalWrite(PUMP_PIN, turnOn ? LOW : HIGH); // Active Low
}

// ================== NHÂN 0: THU THẬP DỮ LIỆU (DATA LAYER) ==================
void TaskSensor(void *pv) {
    esp_task_wdt_add(NULL);
    for (;;) {
        esp_task_wdt_reset();
        SensorData data;
        
        // DHT22
        float temp = dht.readTemperature();
        float humi = dht.readHumidity();
        data.t = isnan(temp) ? -1.0 : round(temp * 10) / 10.0;
        data.h = isnan(humi) ? -1.0 : round(humi * 10) / 10.0;

        //cảm biến Analog với dải 11db
        data.rain_p = constrain(map(analogRead(RAIN_AO), 4095, 1351, 0, 100), 0, 100);
        data.soil_p = constrain(map(analogRead(SOIL_AO), 4095, 1300, 0, 100), 0, 100);

        //cảm biến Digital (vẫn lấy mẫu cơ bản để hiển thị)
        data.is_raining = (digitalRead(RAIN_DO) == LOW);
        data.is_soil_wet = (digitalRead(SOIL_DO) == LOW);
        data.is_bright = (digitalRead(LIGHT_DO) == LOW);

        if (sensorQueue != NULL) {
            xQueueOverwrite(sensorQueue, &data);
        }
        vTaskDelay(pdMS_TO_TICKS(2000)); 
    }
}

// ================== NHÂN 1: LOGIC & ĐIỀU KHIỂN (LOGIC LAYER) ==================
void TaskLogic(void *pv) {
    esp_task_wdt_add(NULL);
    SensorData rx;
    for (;;) {
        esp_task_wdt_reset();
        
        //lệnh Bluetooth / Serial
        if (SerialBT.available() || Serial.available()) {
            String cmd = SerialBT.available() ? SerialBT.readStringUntil('\n') : Serial.readStringUntil('\n');
            cmd.trim();
            if (cmd.length() > 0) {
                if (cmd.indexOf("PUMP:ON") >= 0 || cmd.indexOf("PUMP_ON") >= 0) {
                    // Chỉ cho phép bật nếu trời KHÔNG mưa
                    if (digitalRead(RAIN_DO) == HIGH) setPump(true);
                    else sendLog("Khóa bơm: Đang có mưa!", true);
                }
                else if (cmd.indexOf("PUMP:OFF") >= 0 || cmd.indexOf("PUMP_OFF") >= 0) {
                    setPump(false);
                }
            }
        }

        // Kiểm tra an toàn từ dữ liệu cảm biến & ngắt
        if (sensorQueue != NULL && xQueuePeek(sensorQueue, &rx, pdMS_TO_TICKS(500))) {
            // Tôn trọng ngắt phần cứng đã được kích
            if (rain_flag || rx.is_raining) {
                //Debounce
                vTaskDelay(pdMS_TO_TICKS(30));
                if (digitalRead(RAIN_DO) == LOW) { // Chỉ ngắt khi LOW sau 30ms
                    if (pump_status) {
                        setPump(false);
                        sendLog("Quản lý Ngắt: Tự động tắt bơm do mưa!", true);
                    }
                }
                rain_flag = false; // Xóa cờ ngắt
            }
        }
        vTaskDelay(pdMS_TO_TICKS(200)); 
    }
}

// ================== NHÂN 1: TRUYỀN THÔNG JSON (COMM LAYER) ==================
void TaskComm(void *pv) {
    esp_task_wdt_add(NULL);
    SensorData rx;
    for (;;) {
        esp_task_wdt_reset();
        if (sensorQueue != NULL && xQueuePeek(sensorQueue, &rx, pdMS_TO_TICKS(1000))) {
            StaticJsonDocument<512> doc;
            char tStr[15]; getUptimeStr(tStr);
            
            doc["uptime"] = tStr;
            doc["temp"] = rx.t;
            doc["hum"] = rx.h;
            doc["rain_percent"] = rx.rain_p;
            doc["is_raining"] = rx.is_raining;
            doc["soil_percent"] = rx.soil_p;
            doc["is_soil_wet"] = rx.is_soil_wet;
            doc["is_bright"] = rx.is_bright;
            doc["pump"] = pump_status ? "ON" : "OFF";
            doc["device"] = DEVICE_KEY;

            serializeJson(doc, jsonBuf);
            Serial.println(jsonBuf);
            SerialBT.println(jsonBuf);
        }
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

// ---SETUP: KHỞI TẠO HỆ THỐNG ---
void setup() {
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
    Serial.begin(115200);
    SerialBT.begin("ESP32_VUON_RAU_RTOS");

    sensorQueue = xQueueCreate(1, sizeof(SensorData));

    analogSetAttenuation(ADC_11db);
    dht.begin();
    pinMode(LIGHT_DO, INPUT_PULLUP);
    pinMode(RAIN_DO, INPUT_PULLUP);
    pinMode(SOIL_DO, INPUT_PULLUP);
    pinMode(PUMP_PIN, OUTPUT);

    // Khôi phục trạng thái NVS
    prefs.begin("garden", false);
    pump_status = prefs.getBool("last_p_state", false);
    setPump(pump_status);

    // Watchdog & Cài đặt Ngắt ngoài (Hardware Interrupt)
    esp_task_wdt_init(WDT_TIMEOUT, true);
    attachInterrupt(digitalPinToInterrupt(RAIN_DO), rainISR, FALLING);

    // Tạo các Task chạy song song trên 2 nhân
    xTaskCreatePinnedToCore(TaskSensor, "Sns", 4096, NULL, 1, NULL, 0); // Core 0
    xTaskCreatePinnedToCore(TaskLogic,  "Lgc", 4096, NULL, 2, NULL, 1); // Core 1
    xTaskCreatePinnedToCore(TaskComm,   "Com", 4096, NULL, 1, NULL, 1); // Core 1
    
    sendLog("Hệ thống RTOS đã sẵn sàng.");
}

void loop() { 
    vTaskDelete(NULL); 
}