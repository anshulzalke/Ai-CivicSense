from pathlib import Path
import shutil

# ============================================================
# PATHS
# ============================================================

DESKTOP = Path.home() / "Desktop"

SOURCE = DESKTOP / "Potholes and RoadCracks"
OUTPUT = DESKTOP / "AICivicSense_YOLO"

# Class mapping confirmed from your dataset
CLASS_NAMES = {
    0: "road_crack",
    1: "pothole"
}

# Original dataset uses "valid", final YOLO dataset will use "val"
SPLITS = {
    "train": "train",
    "valid": "val",
    "test": "test"
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def polygon_to_bbox(values):
    """
    Convert polygon coordinates:
        class x1 y1 x2 y2 x3 y3 ...
    into YOLO bbox:
        class x_center y_center width height
    """

    class_id = int(values[0])
    coords = list(map(float, values[1:]))

    if len(coords) < 6 or len(coords) % 2 != 0:
        return None

    xs = coords[0::2]
    ys = coords[1::2]

    xmin = min(xs)
    xmax = max(xs)
    ymin = min(ys)
    ymax = max(ys)

    x_center = (xmin + xmax) / 2
    y_center = (ymin + ymax) / 2
    width = xmax - xmin
    height = ymax - ymin

    return (
        f"{class_id} "
        f"{x_center:.6f} "
        f"{y_center:.6f} "
        f"{width:.6f} "
        f"{height:.6f}"
    )


def process_label_file(source_label, output_label):
    """
    Handle both:
    1. Normal YOLO bbox:
       class x_center y_center width height

    2. Polygon/segmentation:
       class x1 y1 x2 y2 x3 y3 ...
    """

    converted_lines = []

    with open(source_label, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line_number, line in enumerate(lines, start=1):

        line = line.strip()

        if not line:
            continue

        parts = line.split()

        try:
            values = list(map(float, parts))
        except ValueError:
            print(f"Skipping invalid line: {source_label} line {line_number}")
            continue

        # ----------------------------------------------------
        # Normal YOLO bounding box
        # class + 4 coordinates = 5 values
        # ----------------------------------------------------
        if len(values) == 5:

            class_id = int(values[0])

            if class_id not in CLASS_NAMES:
                print(
                    f"Unknown class {class_id}: "
                    f"{source_label}"
                )
                continue

            converted_lines.append(
                f"{class_id} "
                f"{values[1]:.6f} "
                f"{values[2]:.6f} "
                f"{values[3]:.6f} "
                f"{values[4]:.6f}"
            )

        # ----------------------------------------------------
        # Polygon / segmentation
        # ----------------------------------------------------
        elif len(values) > 5:

            bbox = polygon_to_bbox(values)

            if bbox is not None:
                converted_lines.append(bbox)

        else:
            print(
                f"Invalid annotation: "
                f"{source_label} line {line_number}"
            )

    output_label.parent.mkdir(parents=True, exist_ok=True)

    with open(output_label, "w", encoding="utf-8") as f:
        f.write("\n".join(converted_lines))


# ============================================================
# MAIN DATASET PREPARATION
# ============================================================

print("\n==========================================")
print(" AICivicSense YOLO Dataset Preparation")
print("==========================================\n")

if not SOURCE.exists():
    print("❌ ERROR: Source dataset not found!")
    print(f"Expected location:\n{SOURCE}")
    raise SystemExit

print(f"Source dataset : {SOURCE}")
print(f"Output dataset : {OUTPUT}\n")

# Create output directories
for final_split in SPLITS.values():

    (OUTPUT / final_split / "images").mkdir(
        parents=True,
        exist_ok=True
    )

    (OUTPUT / final_split / "labels").mkdir(
        parents=True,
        exist_ok=True
    )


# Statistics
total_images = 0
total_labels = 0
converted_polygons = 0


# ============================================================
# PROCESS EACH SPLIT
# ============================================================

for source_split, final_split in SPLITS.items():

    source_images = SOURCE / source_split / "images"
    source_labels = SOURCE / source_split / "labels"

    output_images = OUTPUT / final_split / "images"
    output_labels = OUTPUT / final_split / "labels"

    print(f"\nProcessing: {source_split}")

    if not source_images.exists():
        print(f"⚠️ Images folder missing: {source_images}")
        continue

    if not source_labels.exists():
        print(f"⚠️ Labels folder missing: {source_labels}")
        continue

    image_files = []

    for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
        image_files.extend(source_images.glob(ext))

    split_images = 0
    split_labels = 0

    for image_path in image_files:

        label_path = source_labels / f"{image_path.stem}.txt"

        # Copy image
        destination_image = output_images / image_path.name
        shutil.copy2(image_path, destination_image)

        split_images += 1
        total_images += 1

        # Process label if it exists
        if label_path.exists():

            destination_label = output_labels / label_path.name

            process_label_file(
                label_path,
                destination_label
            )

            split_labels += 1
            total_labels += 1

    print(f"Images copied : {split_images}")
    print(f"Labels copied : {split_labels}")


# ============================================================
# CREATE DATA.YAML
# ============================================================

yaml_content = f"""path: "{OUTPUT.as_posix()}"

train: train/images
val: val/images
test: test/images

names:
  0: road_crack
  1: pothole
"""

yaml_path = OUTPUT / "data.yaml"

with open(yaml_path, "w", encoding="utf-8") as f:
    f.write(yaml_content)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n==========================================")
print(" Dataset preparation completed!")
print("==========================================")

print(f"\nImages processed : {total_images}")
print(f"Labels processed : {total_labels}")

print(f"\nFinal dataset:")
print(OUTPUT)

print(f"\ndata.yaml:")
print(yaml_path)

print("\nClasses:")
print("0 → road_crack")
print("1 → pothole")

print("\n⚠️ Original dataset was NOT modified.")
print("==========================================\n")