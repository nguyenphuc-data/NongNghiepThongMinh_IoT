#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// === SENSOR INCLUDES ===
#include "sensor/dht22.h"
#include "sensor/rain.h"
#include "sensor/soil.h"
#include "sensor/light.h"

// === CẤU HÌNH ===
const char* ssid = "ONG HUNG_Plus";
const char* password = "onghung135";
const char* mqtt_server = "192.168.1.113";  // IP MÁY TÍNH
const char* mqtt_topic = "esp32/sensors";

WiFiClient espClient;
PubSubClient client(espClient);

// === KHAI BÁO HÀM (CÓ THAM SỐ) ===
void setupWiFi();
void reconnectMQTT();
void publishData(float temp, float hum, int rainP, bool raining, int soilP, bool soilWet, bool bright); 

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== ESP32 → MQTT → MongoDB (PlatformIO) ===");

  dht.begin();
  setupRain();
  setupSoil();
  setupLight();

  setupWiFi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  float h, t;
  if (!readDHT22(h, t)) { h = t = -999; }

  int rainP = readRainPercent();
  bool raining = isRaining();
  int soilP = readSoilPercent();
  bool soilWet = isSoilWet();
  bool bright = isBright();

  printDHT22(h, t);
  printRain(rainP, raining);
  printSoil(soilP, soilWet);
  printLight(bright);

  // GỌI HÀM ĐÚNG 7 THAM SỐ
  publishData(t, h, rainP, raining, soilP, soilWet, bright);

  Serial.println("---");
  delay(5000);
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
}

void reconnectMQTT() {
  while (!client.connected()) {
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("MQTT Connected");
    } else {
      Serial.print("MQTT failed, rc="); Serial.println(client.state());
      delay(5000);
    }
  }
}

// === ĐỊNH NGHĨA HÀM (CÓ 7 THAM SỐ) ===
void publishData(float temp, float hum, int rainP, bool raining, int soilP, bool soilWet, bool bright) {
  DynamicJsonDocument doc(256);
  doc["temp"] = temp;
  doc["hum"] = hum;
  doc["rain_percent"] = rainP;
  doc["is_raining"] = raining;
  doc["soil_percent"] = soilP;
  doc["is_soil_wet"] = soilWet;
  doc["is_bright"] = bright;
  doc["device"] = "esp32_garden";
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  if (client.publish(mqtt_topic, payload.c_str())) {
    Serial.println("Published: " + payload);
  } else {
    Serial.println("Publish failed!");
  }
}