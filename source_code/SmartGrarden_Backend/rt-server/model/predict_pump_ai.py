# predict_pump_ai.py - PHIÊN BẢN CHẠY ĐƯỢC 100% VỚI DỮ LIỆU CỦA BẠN
from pymongo import MongoClient
import pandas as pd
import numpy as np
import tensorflow as tf
import joblib
from datetime import datetime

# ================================
# 1. CẤU HÌNH CHÍNH XÁC THEO DỮ LIỆU CỦA BẠN
# ================================
URI = "mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/"
DB_NAME = "smartgarden_db"           # đúng tên DB
COLLECTION_NAME = "sensordatas"      # đúng tên collection

client = MongoClient(URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# ================================
# 2. LOAD MODEL + SCALER
# ================================
print("Đang tải model AI và scaler...")
model = tf.keras.models.load_model('model_tuoi_cay.h5')
scaler = joblib.load('scaler_X.pkl')

features = ['temp', 'hum', 'soil_percent', 'rain_percent',
            'is_raining', 'is_soil_wet', 'is_bright']

# ================================
# 3. LẤY 60 BẢN GHI MỚI NHẤT (KHÔNG LỌC plant_id NỮA – ĐỂ CHẮC CHẮN CÓ DỮ LIỆU)
# ================================
print("Đang lấy 60 bản ghi mới nhất từ toàn bộ hệ thống...")
raw_data = list(collection.find().sort("timestamp", -1).limit(100))

if len(raw_data) < 60:
    print(f"CHỈ CÓ {len(raw_data)} BẢN GHI TRONG DB → CHƯA ĐỦ 60!")
    print("HÃY ĐỢI ESP32 GỬI DỮ LIỆU THÊM HOẶC KIỂM TRA KẾT NỐI!")
    exit()

# Lấy đúng 60 bản ghi mới nhất → đảo ngược để cũ → mới
data_60 = raw_data[:60][::-1]  # 60 bản ghi gần nhất, đúng thứ tự thời gian

print(f"Đã lấy thành công {len(data_60)} bản ghi (từ {data_60[0]['timestamp']} đến {data_60[-1]['timestamp']})")

# ================================
# 4. CHUẨN BỊ DỮ LIỆU CHO AI
# ================================
records = []
for doc in data_60:
    records.append([
        float(doc.get('temp', 25)),
        float(doc.get('hum', 50)),
        float(doc.get('soil_percent', 50)),
        float(doc.get('rain_percent', 0)),
        1 if doc.get('is_raining') in [True, 'true', 1] else 0,
        1 if doc.get('is_soil_wet') in [True, 'true', 1] or doc.get('soil_percent',0) > 60 else 0,
        1 if doc.get('is_bright') in [True, 'true', 1] else 0,
    ])

X = np.array(records, dtype=np.float32)
X_scaled = scaler.transform(X)
X_input = X_scaled.reshape(1, 60, 7)

# ================================
# 5. DỰ ĐOÁN BẰNG AI
# ================================
print("AI đang suy nghĩ...")
pred = model.predict(X_input, verbose=0)[0][0]
probability = float(pred)
need_pump = probability >= 0.5

# ================================
# 6. KẾT QUẢ SIÊU ĐẸP
# ================================
status = "CẦN BẬT BƠM TƯỚI NGAY!" if need_pump else "KHÔNG CẦN TƯỚI – TIẾT KIỆM NƯỚC"
color = "31m" if need_pump else "32m"  # đỏ / xanh trong terminal

print("\n" + "="*70)
print("             KẾT QUẢ DỰ ĐOÁN TỪ TRÍ TUỆ NHÂN TẠO (LSTM)")
print("="*70)
print(f"   Thời gian       : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
print(f"   Nhiệt độ        : {X[-1,0]:.1f}°C")
print(f"   Độ ẩm không khí : {X[-1,1]:.1f}%")
print(f"   Độ ẩm đất       : {X[-1,2]:.1f}%")
print(f"   Mưa             : {'Có' if X[-1,3]>10 else 'Không'}")
print(f"   Xác suất cần tưới: \033[1;{color}{probability*100:6.2f}%\033[0m")
print(f"   → KẾT LUẬN AI    : \033[1;{color}{status}\033[0m")
print("="*70)