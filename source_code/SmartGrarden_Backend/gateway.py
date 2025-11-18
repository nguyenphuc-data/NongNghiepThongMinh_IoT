import serial
import json
import requests
import time

# **********************************************
# 1. THIẾT LẬP KẾT NỐI & CẤU HÌNH
# **********************************************
# THAY THẾ CHÍNH XÁC VỚI CỔNG COM BLUETOOTH CỦA BẠN
COM_PORT = 'COM7' 
BAUD_RATE = 115200 
API_URL = 'http://localhost:3000/api/sensor-data' # API của Node.js Server

# KHÓA THIẾT BỊ CỐ ĐỊNH (PHẢI KHỚP VỚI SERVER.JS)
DEVICE_KEY = 'esp32_vuonrau' 

try:
    # Mở cổng COM Bluetooth
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
    print(f"✅ Connected to Bluetooth Serial Port {COM_PORT}")
except serial.SerialException as e:
    print(f"❌ Error connecting to {COM_PORT}: {e}")
    print("Please check if the port is correct and not being used by another program.")
    exit()

# **********************************************
# 2. HÀM CHÍNH ĐỌC VÀ GỬI DỮ LIỆU
# **********************************************
def run_gateway():
    while True:
        try:
            # Đọc một dòng dữ liệu (kết thúc bằng \n) từ ESP32
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                
                if line:
                    print(f"[BT READ] Raw: {line}")
                    
                    # 1. Parse JSON
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        print(f"  [PARSE ERROR] Invalid JSON: {line}")
                        continue
                        
                    # 2. BỔ SUNG DEVICE_KEY TRƯỚC KHI GỬI
                    data['device_key'] = DEVICE_KEY 
                    
                    print(f"  [PAYLOAD] Sending: {data}")
                        
                    # 3. Gửi HTTP POST lên Node.js Server
                    try:
                        response = requests.post(API_URL, json=data, timeout=5)
                        
                        if response.status_code == 201:
                            print(f"  [API SUCCESS] Logged and broadcasted: T={data.get('temp')}")
                        elif response.status_code == 202:
                             # Server trả về 202 nếu cây không Active (Inactive Plant)
                            print(f"  [API WARNING] Plant is INACTIVE. Data ignored by Server. Response: {response.text.strip()}")
                        elif response.status_code == 403:
                             # Server trả về 403 nếu device_key không khớp
                            print(f"  [API ERROR] Invalid DEVICE_KEY. Check server.js config.")
                        else:
                            print(f"  [API WARNING] Server responded with status: {response.status_code}. Response: {response.text.strip()}")
                            
                    except requests.exceptions.RequestException as req_err:
                        print(f"  [API ERROR] Could not reach Node.js Server: {req_err}")
                        
            time.sleep(0.1) # Độ trễ ngắn để tránh chiếm dụng CPU quá mức

        except KeyboardInterrupt:
            print("\nGateway stopped by user.")
            break
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            time.sleep(1) # Chờ 1 giây trước khi thử lại

    ser.close()

if __name__ == "__main__":
    run_gateway()