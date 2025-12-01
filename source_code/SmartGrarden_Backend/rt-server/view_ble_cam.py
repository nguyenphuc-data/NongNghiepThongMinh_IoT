# view_ble_cam.py – CHẠY LIÊN TỤC, CỨ 5S CHỤP 1 LẦN → LƯU KẾT QUẢ MỚI NHẤT CHO FRONTEND!
import asyncio
import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
from datetime import datetime
import json
import os
from bleak import BleakClient, BleakScanner

# ================= CẤU HÌNH =================
DEVICE_NAME = "VuonRau_BLE_AI"
CHAR_UUID = "0000ff02-0000-1000-8000-00805f9b34fb"
MODEL_PATH = "model/plant_best_FINAL.keras"  # Đảm bảo đúng đường dẫn
CLASS_NAMES = ["Bí đỏ", "Cà chua", "Dưa leo", "Ớt", "Rau muống"]

# File lưu kết quả mới nhất cho frontend
LATEST_RESULT_FILE = "public/latest_ai_result.json"
PHOTO_FOLDER = "public/photos"
os.makedirs(PHOTO_FOLDER, exist_ok=True)

# Load model
print("Đang tải model AI...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model đã sẵn sàng! Bắt đầu nhận ảnh từ ESP32-CAM mỗi ~5 giây...\n")

async def discover_and_connect():
    print(f"Đang tìm thiết bị: {DEVICE_NAME}...")
    devices = await BleakScanner.discover(timeout=10)
    for d in devices:
        if d.name and DEVICE_NAME in d.name:
            print(f"ĐÃ KẾT NỐI → {d.name} [{d.address}]")
            return d.address
    print("Không tìm thấy ESP32-CAM!")
    return None

async def main():
    address = await discover_and_connect()
    if not address:
        return

    buffer = bytearray()

    async with BleakClient(address) as client:
        print("Kết nối thành công! Nhận ảnh liên tục...\n")

        def callback(_, data):
            nonlocal buffer
            buffer.extend(data)

            if len(buffer) > 8000 and buffer[:2] == b'\xff\xd8' and b'\xff\xd9' in buffer:
                try:
                    frame = cv2.imdecode(np.frombuffer(buffer, np.uint8), cv2.IMREAD_COLOR)
                    if frame is None:
                        buffer.clear()
                        return

                    # Dự đoán AI
                    pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    img_224 = pil_img.resize((224, 224))
                    arr = np.array(img_224) / 255.0
                    arr = np.expand_dims(arr, axis=0)
                    input_data = tf.keras.applications.mobilenet_v3.preprocess_input(arr.copy() * 255)

                    pred = model.predict(input_data, verbose=0)[0]
                    idx = np.argmax(pred)
                    confidence = float(pred[idx])
                    plant = CLASS_NAMES[idx]

                    # Lưu ảnh
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    photo_path = f"{PHOTO_FOLDER}/{timestamp}.jpg"
                    cv2.imwrite(photo_path, frame)

                    # Lưu kết quả mới nhất cho frontend
                    result = {
                        "plant": plant,
                        "confidence": confidence,
                        "photo": f"/photos/{timestamp}.jpg",
                        "timestamp": datetime.now().isoformat()
                    }

                    with open(LATEST_RESULT_FILE, "w", encoding="utf-8") as f:
                        json.dump(result, f, ensure_ascii=False)

                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {plant} ({confidence:.1%}) → {photo_path}")

                    buffer.clear()

                except Exception as e:
                    print("Lỗi xử lý:", e)
                    buffer.clear()

        await client.start_notify(CHAR_UUID, callback)
        print("Đang nhận ảnh liên tục... (Python chạy nền, không cần bấm gì!)\n")

        # Chạy mãi mãi
        while True:
            await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nĐã dừng AI server.")