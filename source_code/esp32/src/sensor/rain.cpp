#include "rain.h"

#define RAIN_AO 34   // Analog
#define RAIN_DO 35   // Digital

void setupRain() {
  analogSetAttenuation(ADC_11db);  // 0-3.3V
  pinMode(RAIN_DO, INPUT);
}

int readRainPercent() {
  int raw = analogRead(RAIN_AO);
  // raw: ~4095 (khô) → ~0 (mưa mạnh)
  return map(raw, 4095, 0, 0, 100);  // % mưa
}

bool isRaining() {
  return digitalRead(RAIN_DO) == LOW;  // LOW = có mưa
}

void printRain(int percent, bool raining) {
  Serial.print("Muc do mua: ");
  Serial.print(percent);
  Serial.print("% | ");
  Serial.print(raining ? "DANG MUA" : "KHO");
  Serial.println();
}