import os
import shutil
from ultralytics import YOLO

# 1. Clean test folder setup
test_dir = "test_samples"
if os.path.exists(test_dir):
    shutil.rmtree(test_dir)
os.makedirs(test_dir, exist_ok=True)

# 2. Desktop path resolution (handles trailing spaces automatically)
desktop = os.path.expanduser("~/Desktop")
matching_folders = [f for f in os.listdir(desktop) if f.strip() == "Urban Civic Issues"]

if not matching_folders:
    print("❌ Desktop par 'Urban Civic Issues' folder nahi mila.")
    exit(1)

target_folder_name = matching_folders[0]
src_dir = os.path.join(desktop, target_folder_name, "garbage", "yes")

# 3. Copy Images
copied_count = 0
if os.path.exists(src_dir):
    for file in os.listdir(src_dir):
        if file.lower().endswith(('.png', '.jpg', '.jpeg')):
            shutil.copy(os.path.join(src_dir, file), test_dir)
            copied_count += 1
    print(f"📁 Successfully copied {copied_count} images from '{src_dir}' to '{test_dir}'!")
else:
    print(f"❌ Subfolder path nahi mila: {src_dir}")
    exit(1)

# 4. Run YOLO Batch Inference
if copied_count > 0:
    print("🚀 Running Garbage Model batch detection...")
    model = YOLO("models/garbage_best.pt")
    results = model(test_dir, save=True)
    print("\n✅ Garbage testing successfully complete! Check 'ai-service/runs/detect/predict' for visual bounding boxes.")
else:
    print("⚠️ No images were found to process.")
