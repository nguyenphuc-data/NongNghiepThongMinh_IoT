#include "soil.h"

#define SOIL_AO 32
#define SOIL_DO 33

void setupSoil() {
  analogSetAttenuation(ADC_11db);
  pinMode(SOIL_DO, INPUT);
}

int readSoilPercent() {
  int raw = analogRead(SOIL_AO);
  int percent = map(raw, 4095, 1700, 0, 100);  // có thể hiệu chỉnh
  percent = constrain(percent, 0, 100);
  return percent;
}

bool isSoilWet() {
  int raw = analogRead(SOIL_AO);
  return raw < 2500;  // dưới 2500 = đủ ẩm
}

void printSoil(int percent, bool wet) {
  int raw = analogRead(SOIL_AO);  // tự đọc lại giá trị raw
  Serial.print("Raw: ");
  Serial.print(raw);
  Serial.print(" | Độ ẩm đất: ");
  Serial.print(percent);
  Serial.print("% | ");
  Serial.println(wet ? "ĐỦ ẨM" : "CẦN TƯỚI");
}
