# model/predict_direct.py – PHIÊN BẢN SẠCH NHẤT, CHẠY NGON 100%
import sys
import json
import numpy as np
import tensorflow as tf
import joblib
import os

# Đường dẫn tuyệt đối để chắc chắn
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, 'best_garden_lstm.h5')
scaler_path = os.path.join(base_dir, 'scaler_X.pkl')

model = tf.keras.models.load_model(model_path)
scaler = joblib.load(scaler_path)

def predict(history):
    arr = np.array(history, dtype=np.float32)
    arr_scaled = scaler.transform(arr)
    arr_input = arr_scaled.reshape(1, 60, 7)
    prob = float(model.predict(arr_input, verbose=0)[0][0])
    return {"need_pump": prob >= 0.5, "probability": round(prob, 4)}

if __name__ == "__main__":
    try:
        data = json.loads(sys.stdin.read().strip())
        result = predict(data["history"])
        print(json.dumps(result))  # CHỈ IN 1 DÒNG DUY NHẤT!
    except Exception as e:
        print(json.dumps({"need_pump": False, "probability": 0.0}))