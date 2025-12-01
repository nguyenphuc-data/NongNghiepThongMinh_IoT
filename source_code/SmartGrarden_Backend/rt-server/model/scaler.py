# scaler.py - TẠO VÀ LƯU SCALER HOÀN CHỈNH (CHẠY ĐƯỢC NGAY)
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib

# ================================
# 1. KẾT NỐI VÀ TẢI DỮ LIỆU
# ================================
uri = "mongodb+srv://pewpewls09_db_user:koFKZBj6jCrQ9mba@iot-sensors.jing9nf.mongodb.net/?appName=IoT-Sensors"
client = MongoClient(uri)
db = client['sensor_db']           # thay tên DB của bạn
collection = db['readings']        # thay tên collection của bạn

print("Đang tải dữ liệu từ MongoDB...")
raw = list(collection.find().sort("timestamp", 1))
df = pd.json_normalize(raw)
print(f"Đã tải {len(df)} bản ghi")

# ================================
# 2. CHỌN CỘT VÀ TIỀN XỬ LÝ
# ================================
df = df[['temp', 'hum', 'rain_percent', 'is_raining',
         'soil_percent', 'is_soil_wet', 'is_bright',
         'pump_status', 'timestamp']].copy()

# Chuyển boolean → int
for col in ['is_raining', 'is_soil_wet', 'is_bright', 'pump_status']:
    if col in df.columns:
        df[col] = df[col].astype(int)

# ================================
# 3. TẠO VÀ LƯU SCALER
# ================================
features = ['temp', 'hum', 'soil_percent', 'rain_percent',
            'is_raining', 'is_soil_wet', 'is_bright']

X_raw = df[features].values

scaler_X = MinMaxScaler()
scaler_X.fit(X_raw)

# LƯU FILE
joblib.dump(scaler_X, 'scaler_X.pkl')
np.save('features_order.npy', features)

print("HOÀN TẤT! ĐÃ TẠO 2 FILE:")
print("   → scaler_X.pkl")
print("   → features_order.npy")
print("Bạn có thể dùng ngay trong AI server!")