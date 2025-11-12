import paho.mqtt.client as mqtt
import json
from pymongo import MongoClient
from datetime import datetime

# === CẤU HÌNH ===
MQTT_BROKER = "localhost"
MQTT_TOPIC = "esp32/sensors"
MONGO_URI = "mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/?appName=IoT-Sensors"
DB_NAME = "sensor_db"
COLLECTION_NAME = "readings"

# Kết nối MongoDB
mongo = MongoClient(MONGO_URI)
db = mongo[DB_NAME]
collection = db[COLLECTION_NAME]

def on_connect(client, userdata, flags, rc):
    print(f"Connected! Subscribing to {MQTT_TOPIC}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        data["received_at"] = datetime.utcnow()
        collection.insert_one(data)
        print(f"Saved: {data['temp']}°C, {data['hum']}%")
    except Exception as e:
        print("Error:", e)

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.loop_forever()