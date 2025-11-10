#ifndef SOIL_H
#define SOIL_H

#include <Arduino.h>

void setupSoil();
int readSoilPercent();     // 0–100%
bool isSoilWet();          // true nếu đủ ẩm
void printSoil(int percent, bool wet);  // ✅ chỉ còn 2 tham số

#endif
