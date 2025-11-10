#ifndef DHT22_H
#define DHT22_H

#include <Arduino.h>
#include <DHT.h>

extern DHT dht;

bool readDHT22(float &humidity, float &temperature);
void printDHT22(float h, float t);

#endif
