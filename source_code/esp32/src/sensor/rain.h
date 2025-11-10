#ifndef RAIN_H
#define RAIN_H

#include <Arduino.h>

void setupRain();
int readRainPercent();     // 0-100%
bool isRaining();          // true nếu có mưa
void printRain(int percent, bool raining);

#endif