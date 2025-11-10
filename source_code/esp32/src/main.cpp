#include <Arduino.h>
#include "sensor/dht22.h"
#include "sensor/rain.h"
#include "sensor/soil.h"
#include "sensor/light.h"   // ← DÙNG TÊN MỚI: light

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== ESP32 - DHT22 + RAIN + SOIL + LIGHT ===");

  dht.begin();
  setupRain();
  setupSoil();
  setupLight();    

  delay(1000);
}

void loop() {
  float h, t;
  if (readDHT22(h, t)) {
    printDHT22(h, t);
  } else {
    Serial.println("DHT22: Loi!");
  }

  // Rain
  int rainPercent = readRainPercent();
  bool raining = isRaining();
  printRain(rainPercent, raining);

  // Soil
  int soilPercent = readSoilPercent();
  bool soilWet = isSoilWet();
  printSoil(soilPercent, soilWet);

  // Light (DO only)
  bool bright = isBright();
  printLight(bright);

  Serial.println("---");
  delay(2000);
}