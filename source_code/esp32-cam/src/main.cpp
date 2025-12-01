#include <Arduino.h>
#include "esp_camera.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

#define SERVICE_UUID        "0000ff01-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000ff02-0000-1000-8000-00805f9b34fb"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;
unsigned long lastSend = 0;
const unsigned long interval = 5000;  // 5 giây

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    BLEDevice::setMTU(517);    // 🚀 Tăng MTU
    Serial.println("Client connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    pServer->startAdvertising();
  }
};

void setup() {
  Serial.begin(115200);

  // ==== CAMERA SETUP ====
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 20;       // 🚀 Giảm chất lượng → nhẹ & nhanh hơn
  config.fb_count = 1;

  esp_camera_init(&config);

  // ==== BLE SETUP ====
  BLEDevice::init("VuonRau_BLE_AI");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new MyServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);

  pCharacteristic = service->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());

  service->start();
  server->getAdvertising()->start();
}

void loop() {
  if (!deviceConnected) {
    delay(200);
    return;
  }

  if (millis() - lastSend >= interval) {
    lastSend = millis();

    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) return;

    size_t sent = 0;
    while (sent < fb->len) {
      size_t chunk = min(200, fb->len - sent);  // 🚀 chunk tối ưu BLE

      pCharacteristic->setValue(fb->buf + sent, chunk);
      pCharacteristic->notify();

      sent += chunk;

      delayMicroseconds(300); // 🚀 nhanh hơn nhiều so với delay(1)
    }

    esp_camera_fb_return(fb);
  }
}
