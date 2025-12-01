# gateway.py – PHIÊN BẢN CUỐI CÙNG, ĐẸP NHẤT VIỆT NAM
import serial
import json
import threading
import time
import paho.mqtt.client as mqtt

# ==================== CẤU HÌNH ====================
COM_PORT   = 'COM5'                    # SỬA THEO CỔNG CỦA BẠN
BAUD_RATE  = 115200
DEVICE_KEY = 'esp32_vuonrau'

MQTT_BROKER = "127.0.0.1"
MQTT_PORT   = 1883

TOPIC_DATA = f"smartgarden/{DEVICE_KEY}/data"  # pub
TOPIC_CMD  = f"smartgarden/{DEVICE_KEY}/cmd"  # sub

# ==================== KẾT NỐI BLUETOOTH ====================
try:
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
    print(f"Bluetooth kết nối thành công: {COM_PORT}")
except Exception as e:
    print(f"Lỗi kết nối Bluetooth {COM_PORT}: {e}")
    exit()

# ==================== MQTT CLIENT ====================
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("ĐÃ KẾT NỐI MQTT → Mosquitto local")
        client.subscribe(TOPIC_CMD)
        print(f"Đang nghe lệnh tại: {TOPIC_CMD}")
    else:
        print(f"MQTT lỗi: {rc}")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"[MQTT ← WEB] Nhận lệnh: {payload}")
    if payload.startswith("PUMP:"):
        ser.write((payload + "\n").encode())
        print(f"ĐÃ GỬI XUỐNG ESP32: {payload}")

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message
client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
client.loop_start()

# ==================== ĐỌC DỮ LIỆU TỪ ESP32 ====================
def bluetooth_reader():
    print("Bắt đầu đọc dữ liệu từ ESP32...")
    buffer = ""
    while True:
        try:
            if ser.in_waiting:
                raw = ser.readline().decode('utf-8', errors='ignore')
                line = raw.strip()
                if not line: continue
                buffer += line

                if buffer.startswith('{') and '}' in buffer:
                    json_str = buffer[:buffer.rfind('}')+1]
                    buffer = buffer[len(json_str):]

                    try:
                        data = json.loads(json_str)
                        data['device_key'] = DEVICE_KEY
                        data['timestamp'] = int(time.time())

                        # LOG ĐỈNH CAO NHẤT VIỆT NAM
                        temp = data.get('temp', 'N/A')
                        hum  = data.get('hum', 'N/A')
                        soil = data.get('soil_percent', 'N/A')
                        rain = data.get('rain_percent', 'N/A')
                        is_raining = "Đang mưa" if data.get('is_raining') else "Không mưa"
                        is_wet     = "Ướt" if data.get('is_soil_wet') else "Khô"
                        is_bright  = "Sáng" if data.get('is_bright') else "Tối"
                        pump       = data.get('pump', 'OFF')

                        print(f"   [OK] [{DEVICE_KEY}] → "
                              f"T={temp:.1f}°C | H={hum:.1f}% | "
                              f"Đất={soil}% ({is_wet}) | Mưa={rain}% ({is_raining}) | "
                              f"Ánh sáng={is_bright} | Bơm={pump}")

                        client.publish(TOPIC_DATA, json.dumps(data))

                    except json.JSONDecodeError:
                        pass
            time.sleep(0.01)
        except Exception as e:
            print(f"Lỗi đọc Serial: {e}")
            time.sleep(1)

# ==================== KHỞI ĐỘNG ====================
if __name__ == "__main__":
    print("\n" + "="*70)
    print("        SMART GARDEN GATEWAY – PHIÊN BẢN THẦN THÁNH 2025")
    print("="*70)
    print(f"   Node          : {DEVICE_KEY}")
    print(f"   Bluetooth     : {COM_PORT}")
    print(f"   MQTT Broker   : {MQTT_BROKER}:{MQTT_PORT}")
    print(f"   Topic Data    : {TOPIC_DATA}")
    print(f"   Topic Lệnh    : {TOPIC_CMD}")
    print("="*70 + "\n")

    threading.Thread(target=bluetooth_reader, daemon=True).start()
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        print("\nDừng gateway. Tạm biệt!")
        ser.close()