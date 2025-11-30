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
const unsigned long interval = 5000;  // 5 giây chụp 1 lần

// ĐÈN BÁO HOẠT ĐỘNG – DÙNG CHÂN 33 (KHÔNG DÍNH FLASH)
#define LED_STATUS_PIN 33

// === CAMERA PINS (AI-Thinker ESP32-CAM) ===
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      digitalWrite(LED_STATUS_PIN, HIGH);
      Serial.println("BLE Client kết nối thành công!");
    }
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      digitalWrite(LED_STATUS_PIN, LOW);
      Serial.println("BLE Client ngắt kết nối → đang quảng bá lại...");
      pServer->getAdvertising()->start();
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== ESP32-CAM BLE AI STARTING ===");

  pinMode(LED_STATUS_PIN, OUTPUT);
  digitalWrite(LED_STATUS_PIN, LOW);

  // Nháy đèn báo khởi động
  for(int i = 0; i < 5; i++) {
    digitalWrite(LED_STATUS_PIN, HIGH); delay(150);
    digitalWrite(LED_STATUS_PIN, LOW);  delay(150);
  }

  // === CAMERA INIT ===
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;      // 640x480 – đủ nhanh, đủ nét
  config.jpeg_quality = 12;               // 10-63, số nhỏ = chất lượng cao
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_LATEST;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    while(1) {
      digitalWrite(LED_STATUS_PIN, !digitalRead(LED_STATUS_PIN));
      delay(200);
    }
  }
  Serial.println("Camera init OK!");

  // === BLE INIT ===
  BLEDevice::init("VuonRau_BLE_AI");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  digitalWrite(LED_STATUS_PIN, HIGH);
  Serial.println("BLE đang quảng bá – chờ Python kết nối...");
}

void loop() {
  if (!deviceConnected) {
    delay(500);
    return;
  }

  if (millis() - lastSend >= interval) {
    lastSend = millis();
    Serial.println("Đang chụp ảnh...");

    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Chụp ảnh thất bại!");
      return;
    }

    Serial.printf("Ảnh chụp thành công: %d bytes → đang gửi...\n", fb->len);

    size_t sent = 0;
    const size_t chunkSize = 500;  // BLE MTU thường ~512
    while (sent < fb->len) {
      size_t thisChunk = min(chunkSize, fb->len - sent);
      pCharacteristic->setValue(fb->buf + sent, thisChunk);
      pCharacteristic->notify();
      sent += thisChunk;
      delay(5);  // nhỏ để không bị nghẽn
    }

    Serial.println("Đã gửi xong ảnh!");
    esp_camera_fb_return(fb);
  }
  delay(10);
}