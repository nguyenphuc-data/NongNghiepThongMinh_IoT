#include "dht22.h"

#define DHT_PIN 21
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

bool readDHT22(float &humidity, float &temperature) {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Loi doc DHT22! Kiem tra ket noi / nguon dien");
    return false;
  }
  return true;
}

void printDHT22(float h, float t) {
  Serial.printf("Do am: %.1f%% | Nhiet do: %.1f°C\n", h, t);
}
