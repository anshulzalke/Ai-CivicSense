from pathlib import Path
import random
from PIL import Image, ImageDraw, ImageFont

DATASET = Path.home() / "Desktop" / "AICivicSense_YOLO"

CLASSES = {
    0: "road_crack",
    1: "pothole"
}

OUTPUT = DATASET / "annotation_check"
OUTPUT.mkdir(exist_ok=True)

random.seed(42)

# Take images from train set
image_dir = DATASET / "train" / "images"
label_dir = DATASET / "train" / "labels"

images = []

for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
    images.extend(image_dir.glob(ext))

# Select 10 random images
selected = random.sample(images, min(10, len(images)))

print(f"Checking {len(selected)} images...\n")

for image_path in selected:

    label_path = label_dir / f"{image_path.stem}.txt"

    if not label_path.exists():
        print(f"⚠️ Label missing: {image_path.name}")
        continue

    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    width, height = image.size

    with open(label_path, "r") as f:
        lines = f.readlines()

    for line in lines:

        parts = line.strip().split()

        if len(parts) != 5:
            print(f"⚠️ Unusual label in: {image_path.name}")
            continue

        class_id = int(float(parts[0]))

        x_center = float(parts[1])
        y_center = float(parts[2])
        box_width = float(parts[3])
        box_height = float(parts[4])

        # Convert normalized YOLO coordinates to pixels
        x_center *= width
        y_center *= height
        box_width *= width
        box_height *= height

        x1 = x_center - box_width / 2
        y1 = y_center - box_height / 2
        x2 = x_center + box_width / 2
        y2 = y_center + box_height / 2

        class_name = CLASSES.get(
            class_id,
            f"class_{class_id}"
        )

        draw.rectangle(
            [x1, y1, x2, y2],
            outline="red",
            width=3
        )

        draw.text(
            (x1, max(0, y1 - 20)),
            class_name,
            fill="red"
        )

    output_path = OUTPUT / image_path.name
    image.save(output_path)

    print(f"✓ {image_path.name}")

print("\n================================")
print("Annotation check completed!")
print(f"Open this folder:")
print(OUTPUT)
print("================================")