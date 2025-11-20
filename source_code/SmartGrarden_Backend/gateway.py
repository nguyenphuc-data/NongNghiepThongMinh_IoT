# gateway.py - PHIÊN BẢN HOÀN CHỈNH (có cả đọc dữ liệu + điều khiển bơm)
import serial
import json
import requests
import threading
import time
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

# =============================================
# 1. CẤU HÌNH CHUNG
# =============================================
COM_PORT = 'COM7'           # Thay bằng COM của bạn (COM7, COM8...)
BAUD_RATE = 115200
API_URL = 'http://localhost:3000/api/sensor-data'
DEVICE_KEY = 'esp32_vuonrau'

# Kết nối Bluetooth
try:
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
    print(f"Bluetooth kết nối thành công: {COM_PORT}")
except Exception as e:
    print(f"Lỗi kết nối Bluetooth {COM_PORT}: {e}")
    exit()

# =============================================
# 2. FASTAPI SERVER - NHẬN LỆNH ĐIỀU KHIỂN BƠM
# =============================================
app = FastAPI(title="Gateway ESP32 - Control Server")

class PumpCommand(BaseModel):
    state: str  # "ON" hoặc "OFF"

@app.post("/control-pump")
async def control_pump(cmd: PumpCommand):
    if cmd.state not in ["ON", "OFF"]:
        return {"error": "state must be ON or OFF"}
    
    command = f"PUMP:{cmd.state}\n"
    try:
        ser.write(command.encode('utf-8'))
        print(f"ĐÃ GỬI LỆNH QUA BLUETOOTH: {command.strip()}")
        return {"success": True, "sent": command.strip()}
    except Exception as e:
        print(f"Lỗi gửi lệnh bơm: {e}")
        return {"error": str(e)}

# =============================================
# 3. HÀM ĐỌC DỮ LIỆU TỪ ESP32 → GỬI LÊN SERVER
# =============================================
def bluetooth_reader():
    print("Bắt đầu đọc dữ liệu từ ESP32...")
    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line and line.startswith('{'):
                    print(f"[BT ← ESP32] {line}")
                    
                    try:
                        data = json.loads(line)
                        data['device_key'] = DEVICE_KEY
                        
                        # Gửi lên Node.js server
                        response = requests.post(API_URL, json=data, timeout=5)
                        if response.status_code == 201:
                            print(f"   [OK] Đã lưu + broadcast: T={data.get('temp')}°C | Bơm={data.get('pump')}")
                        elif response.status_code == 202:
                            print("   [INFO] Không có cây active → dữ liệu bị bỏ qua")
                        else:
                            print(f"   [WARNING] Server trả về {response.status_code}")
                            
                    except json.JSONDecodeError:
                        print(f"   [ERROR] JSON lỗi: {line}")
                    except requests.exceptions.RequestException as e:
                        print(f"   [ERROR] Không kết nối được Node.js: {e}")
                        
            time.sleep(0.05)  # CPU nhẹ
        except Exception as e:
            print(f"Lỗi đọc Bluetooth: {e}")
            time.sleep(1)

# =============================================
# 4. CHẠY CẢ 2 CHỨC NĂNG CÙNG LÚC
# =============================================
if __name__ == "__main__":
    # Thread 1: Đọc dữ liệu từ ESP32
    reader_thread = threading.Thread(target=bluetooth_reader, daemon=True)
    reader_thread.start()

    # Thread 2: FastAPI server nhận lệnh từ Web
    print("\nGateway Control Server đang chạy tại: http://127.0.0.1:8000")
    print("   → Dùng để nhận lệnh BẬT/TẮT bơm từ Node.js")
    print("   → Không cần mở terminal thứ 2!\n")

    # Chạy FastAPI trên cổng 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)