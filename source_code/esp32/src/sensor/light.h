#ifndef LIGHT_H
#define LIGHT_H

#include <Arduino.h>

void setupLight();
bool isBright();       // true nếu SÁNG
void printLight(bool bright);

#endif