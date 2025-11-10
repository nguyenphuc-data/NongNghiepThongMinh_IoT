#include "light.h"

#define LIGHT_DO 18  // ← D18 (GPIO18)

void setupLight() {
  pinMode(LIGHT_DO, INPUT_PULLUP);  // Kéo lên HIGH nếu không nối
}

bool isBright() {
  return digitalRead(LIGHT_DO) == LOW;  // LOW = SÁNG (chuẩn module)
}

void printLight(bool bright) {
  Serial.print("Anh sang: ");
  Serial.println(bright ? "SANG" : "TOI");
}