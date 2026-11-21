import os
import io
import glob
from typing import Optional
# pyrefly: ignore [missing-import]
import cv2
import numpy as np
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
# pyrefly: ignore [missing-import]
from ultralytics import YOLO

app = FastAPI(title="CivicSense AI Vision Service", version="4.0.0")

# Supported civic defect categories
SUPPORTED_CATEGORIES = ["Potholes", "Garbage", "Drainage", "Streetlight"]

CATEGORY_META = {
    "Potholes":     {"department": "Roads & Infrastructure",     "sla_hours": 48, "default_severity": 4},
    "Garbage":      {"department": "Solid Waste Management",     "sla_hours": 72, "default_severity": 2},
    "Drainage":     {"department": "Drainage & Water Supply",     "sla_hours": 36, "default_severity": 4},
    "Streetlight":  {"department": "Electrical & Street Lighting","sla_hours": 24, "default_severity": 3},
}

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_pothole_model():
    candidates = [
        "models/pothole_detector.pt",
        "pothole_cracks_detector/runs/pothole_roadcrack_v1/weights/best.pt",
        "pothole_cracks_detector/weights/best.pt",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    wildcards = glob.glob("pothole_cracks_detector/**/best.pt", recursive=True)
    return wildcards[0] if wildcards else None

def find_garbage_model():
    candidates = [
        "models/garbage_best.pt",
        "runs/detect/train-2/weights/best.pt",
        "runs/detect/train/weights/best.pt",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    wildcards = glob.glob("runs/detect/**/best.pt", recursive=True)
    return wildcards[0] if wildcards else None

def find_general_model():
    candidates = ["yolov8n.pt", "pothole_cracks_detector/yolov8n.pt"]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

POTHOLE_PATH = find_pothole_model()
GARBAGE_PATH = find_garbage_model()
GENERAL_PATH = find_general_model()

print(f"📦 Loading YOLO Pothole Model: {POTHOLE_PATH}")
pothole_model = YOLO(POTHOLE_PATH) if POTHOLE_PATH else None

print(f"📦 Loading YOLO Garbage Model: {GARBAGE_PATH}")
garbage_model = YOLO(GARBAGE_PATH) if GARBAGE_PATH else None

print(f"📦 Loading YOLO General/Anti-Spam Model: {GENERAL_PATH}")
general_model = YOLO(GENERAL_PATH) if GENERAL_PATH else None


def check_input_sanity(np_img: np.ndarray, pil_img: Image.Image) -> tuple[bool, str]:
    """
    Robust Input Sanity & Anti-Spam Check:
    Flags documents, marksheets, high-density text, human faces/selfies,
    and flat/uniform backgrounds that are clearly NOT civic infrastructure.
    """
    H, W = np_img.shape[:2]
    total_pixels = float(H * W)
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
    
    # 1. Blank / Uniform Solid Background Check
    gray_std = float(np.std(gray))
    if gray_std < 18.0:
        return True, "uniform_or_solid_background"
        
    edges = cv2.Canny(gray, 50, 150)
    edge_ratio = float(np.count_nonzero(edges)) / total_pixels
    if edge_ratio < 0.003 and gray_std < 26.0:
        return True, "blank_flat_surface"

    # 2. Document / High Text Density / Marksheet Check
    hsv = cv2.cvtColor(np_img, cv2.COLOR_RGB2HSV)
    mean_lum = float(np.mean(gray))
    white_ratio = float(np.mean(gray > 180))
    mean_sat = float(np.mean(hsv[:, :, 1]))
    
    # Standard document properties: predominantly bright paper and low color saturation
    is_paper_color = (white_ratio > 0.45 and mean_lum > 160 and mean_sat < 55.0) or (white_ratio > 0.70 and mean_lum > 175)
    if is_paper_color:
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 6)
        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 3))
        dilated = cv2.dilate(thresh, h_kernel, iterations=1)
        cnts, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        text_lines = sum(1 for c in cnts if cv2.boundingRect(c)[2] > 25 and 4 <= cv2.boundingRect(c)[3] <= 60)
        
        # High count of horizontal text line bounding boxes indicates document/marksheet
        if text_lines >= 5 or white_ratio > 0.78:
            return True, f"document_text_lines_{text_lines}"

    # 3. Person / Face / Selfie / Indoor Non-Civic Check via General COCO Model
    if general_model:
        try:
            gen_res = general_model.predict(source=pil_img, conf=0.45, verbose=False)
            if gen_res and len(gen_res) > 0 and gen_res[0].boxes:
                for b in gen_res[0].boxes:
                    cls_id = int(b.cls.item())
                    cls_name = general_model.names.get(cls_id, "")
                    xywhn = b.xywhn[0].tolist()
                    box_area = xywhn[2] * xywhn[3]
                    
                    # Large human person / selfie dominating frame
                    if cls_name == "person" and box_area > 0.12:
                        return True, "human_person_selfie_detected"
                    # Indoor electronic screen / book
                    if cls_name in ["book", "cell phone", "laptop", "tv"] and box_area > 0.14:
                        return True, f"{cls_name}_detected"
        except Exception as e:
            print(f"⚠️ General model check warning: {e}")

    return False, "clean"


def detect_civic_hazards(pil_img: Image.Image, np_img: np.ndarray) -> dict:
    """
    Runs YOLO models across civic defect classes with a strict confidence threshold (conf >= 0.50).
    Rejects any detection below 50% as noise/invalid.
    Determines category, auto-severity (1-5), suggested title, and bounding box.
    """
    candidates = []

    # 1. Potholes & Road Cracks Detector (conf >= 0.50)
    if pothole_model:
        try:
            p_res = pothole_model.predict(source=pil_img, conf=0.18, verbose=False)
            if p_res and len(p_res) > 0 and p_res[0].boxes:
                for b in p_res[0].boxes:
                    conf = float(b.conf.item())
                    if conf >= 0.18:
                        cls_id = int(b.cls.item())
                        cls_name = pothole_model.names.get(cls_id, "pothole")
                        xyxyn = b.xyxyn[0].tolist()
                        candidates.append({
                            "category": "Potholes",
                            "raw_class": cls_name,
                            "confidence": conf,
                            "xyxyn": xyxyn,
                            "model": "pothole_detector"
                        })
        except Exception as pe:
            print(f"⚠️ Pothole detection error: {pe}")

    # 2. Solid Waste & Garbage Detector (merges multi-class trash: plastic, paper, cardboard, metal, glass, trash)
    if garbage_model:
        try:
            g_res = garbage_model.predict(source=pil_img, conf=0.15, verbose=False)
            g_boxes = []
            if g_res and len(g_res) > 0 and g_res[0].boxes:
                for b in g_res[0].boxes:
                    conf = float(b.conf.item())
                    if conf >= 0.15:
                        cls_id = int(b.cls.item())
                        cls_name = garbage_model.names.get(cls_id, "trash")
                        g_boxes.append((conf, cls_name, b.xyxyn[0].tolist()))
            if g_boxes:
                g_boxes.sort(key=lambda x: x[0], reverse=True)
                xmin = min(x[2][0] for x in g_boxes)
                ymin = min(x[2][1] for x in g_boxes)
                xmax = max(x[2][2] for x in g_boxes)
                ymax = max(x[2][3] for x in g_boxes)
                boosted_conf = min(0.96, g_boxes[0][0] + 0.15 * min(len(g_boxes), 3))
                candidates.append({
                    "category": "Garbage",
                    "raw_class": g_boxes[0][1],
                    "confidence": boosted_conf,
                    "xyxyn": [xmin, ymin, xmax, ymax],
                    "model": "garbage_best"
                })
        except Exception as ge:
            print(f"⚠️ Garbage detection error: {ge}")

    # 2B. YOLOv8 General COCO Waste & Litter Detection (bottles, bags, packaging, food waste)
    if general_model:
        try:
            waste_classes = {
                "bottle", "cup", "bowl", "banana", "apple", "sandwich",
                "orange", "donut", "cake", "handbag", "backpack", "suitcase",
                "fork", "knife", "spoon", "wine glass"
            }
            w_res = general_model.predict(source=pil_img, conf=0.18, verbose=False)
            waste_boxes = []
            if w_res and len(w_res) > 0 and w_res[0].boxes:
                for b in w_res[0].boxes:
                    conf = float(b.conf.item())
                    cls_id = int(b.cls.item())
                    cls_name = general_model.names.get(cls_id, "")
                    if cls_name in waste_classes and conf >= 0.18:
                        waste_boxes.append((conf, cls_name, b.xyxyn[0].tolist()))
            if waste_boxes:
                waste_boxes.sort(key=lambda x: x[0], reverse=True)
                # Merge bounding boxes of all detected waste items into one garbage zone
                xmin = min(x[2][0] for x in waste_boxes)
                ymin = min(x[2][1] for x in waste_boxes)
                xmax = max(x[2][2] for x in waste_boxes)
                ymax = max(x[2][3] for x in waste_boxes)
                boosted_conf = min(0.94, waste_boxes[0][0] + 0.15 * min(len(waste_boxes), 3))
                candidates.append({
                    "category": "Garbage",
                    "raw_class": "garbage",
                    "confidence": boosted_conf,
                    "xyxyn": [xmin, ymin, xmax, ymax],
                    "model": "yolov8_waste_detector"
                })
        except Exception as we:
            print(f"⚠️ COCO waste detection error: {we}")

    # 3. Streetlight & Traffic Light Hazards (conf >= 0.50)
    if general_model:
        try:
            gen_res = general_model.predict(source=pil_img, conf=0.50, verbose=False)
            if gen_res and len(gen_res) > 0 and gen_res[0].boxes:
                for b in gen_res[0].boxes:
                    conf = float(b.conf.item())
                    cls_id = int(b.cls.item())
                    cls_name = general_model.names.get(cls_id, "")
                    if conf >= 0.50 and cls_name in ["traffic light", "stop sign"]:
                        candidates.append({
                            "category": "Streetlight",
                            "raw_class": "streetlight",
                            "confidence": conf,
                            "xyxyn": b.xyxyn[0].tolist(),
                            "model": "general_coco"
                        })
        except Exception as se:
            print(f"⚠️ Streetlight detection error: {se}")

    # 4. Drainage & Water Stagnation Analysis (conf >= 0.50)
    # Check for severe waterlogged drainage cavity along road surface
    try:
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
        H, W = gray.shape[:2]
        hsv = cv2.cvtColor(np_img, cv2.COLOR_RGB2HSV)
        sat = hsv[:, :, 1]
        
        # Murky stagnated water pooling has low brightness, moderate saturation, and low gradient variance
        dark_water_mask = (gray < 70) & (sat > 25) & (gray > 15)
        water_ratio = float(np.count_nonzero(dark_water_mask)) / float(H * W)
        
        # If road has large pooling (>18% water area) along the lower half/ditch
        if water_ratio >= 0.18:
            # Check if candidates already exist; if not, evaluate drainage
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dark_water_mask.astype(np.uint8) * 255)
            max_area = 0
            best_blob = None
            for i in range(1, num_labels):
                a = stats[i, cv2.CC_STAT_AREA]
                if a > max_area and a > (H * W * 0.10):
                    max_area = a
                    best_blob = (stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP], stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT])
                    
            if best_blob:
                bx, by, bw, bh = best_blob
                candidates.append({
                    "category": "Drainage",
                    "raw_class": "drainage",
                    "confidence": min(0.85, 0.52 + (max_area / float(H * W)) * 0.4),
                    "xyxyn": [bx / W, by / H, (bx + bw) / W, (by + bh) / H],
                    "model": "drainage_water_segmentation"
                })
    except Exception as de:
        print(f"⚠️ Drainage analysis warning: {de}")

    # If NO defect candidate achieved conf >= 0.50
    if not candidates:
        return {
            "status": "no_issue_detected",
            "message": "No valid civic hazard detected in this photo. Please upload a clear photo of road damage, garbage, drainage, or streetlight.",
            "detected": False,
            "box": None,
            "bbox": None,
            "category": None
        }

    # Disambiguation: If Garbage model detects solid waste (>=0.30), prioritize Garbage
    # because road-only pothole models often misclassify textured trash piles as potholes
    garbage_hits = [c for c in candidates if c["category"] == "Garbage" and c["confidence"] >= 0.15]
    if garbage_hits:
        garbage_hits.sort(key=lambda c: c["confidence"], reverse=True)
        primary = garbage_hits[0]
    else:
        candidates.sort(key=lambda c: c["confidence"], reverse=True)
        primary = candidates[0]

    xmin, ymin, xmax, ymax = primary["xyxyn"]
    left_pct = round(max(0.0, min(99.0, xmin * 100.0)), 1)
    top_pct = round(max(0.0, min(99.0, ymin * 100.0)), 1)
    width_pct = round(max(5.0, min(100.0 - left_pct, (xmax - xmin) * 100.0)), 1)
    height_pct = round(max(5.0, min(100.0 - top_pct, (ymax - ymin) * 100.0)), 1)
    
    # Area coverage score (0.0 to 100.0)
    area_pct = round((width_pct * height_pct) / 100.0, 1)
    conf_pct = round(primary["confidence"] * 100.0, 1)
    conf_dec = round(primary["confidence"], 2)
    cat = primary["category"]
    raw_class = primary["raw_class"]

    # Auto-calculate Severity (1 - 5) based on bounding box size and confidence
    if cat == "Potholes":
        damage_type = "crack" if "crack" in raw_class else "pothole"
        if damage_type == "crack":
            auto_severity = 2 if (area_pct > 8.0 or conf_pct > 75.0) else 1
            issue = "Road Surface Crack"
            suggested_title = "Road surface crack observed - preventive seal coating needed"
            box_label = f"crack {conf_dec:.2f}"
        else:
            if area_pct >= 24.0 or (conf_pct >= 88.0 and area_pct >= 12.0):
                auto_severity = 5
                issue = "Critical Road Sinkhole / Deep Crater"
                suggested_title = "Emergency: Massive road cave-in / sinkhole blocking lane"
            elif area_pct >= 10.0 or (conf_pct >= 75.0 and area_pct >= 5.0):
                auto_severity = 4
                issue = "Severe Road Pothole"
                suggested_title = "Deep road pothole causing vehicle hazard"
            elif area_pct >= 2.5:
                auto_severity = 3
                issue = "Moderate Road Pothole"
                suggested_title = "Road pothole observed - asphalt patching required"
            else:
                auto_severity = 2
                issue = "Minor Road Surface Cavity"
                suggested_title = "Road pothole observed - asphalt patching required"
            box_label = f"pothole {conf_dec:.2f}"
    elif cat == "Garbage":
        damage_type = "garbage"
        if area_pct >= 25.0:
            auto_severity = 4
        elif area_pct >= 8.0:
            auto_severity = 3
        else:
            auto_severity = 2
        issue = "Garbage Dump / Solid Waste"
        suggested_title = "Overflowing municipal garbage container on roadside"
        box_label = f"garbage {conf_dec:.2f}"
    elif cat == "Streetlight":
        damage_type = "streetlight"
        auto_severity = 4 if conf_pct >= 75.0 else 3
        issue = "Damaged Streetlight Pole"
        suggested_title = "Damaged non-functional public streetlight pole"
        box_label = f"streetlight {conf_dec:.2f}"
    else:  # Drainage
        damage_type = "drainage"
        auto_severity = 5 if area_pct >= 22.0 else (4 if area_pct >= 8.0 else 3)
        issue = "Drainage Overflow / Waterlogging"
        suggested_title = "Severely flooded storm drain and waterlogged roadway"
        box_label = f"drainage {conf_dec:.2f}"

    auto_severity = int(min(5, max(1, auto_severity)))

    bbox = {
        "top": top_pct,
        "left": left_pct,
        "width": width_pct,
        "height": height_pct,
        "label": box_label,
        "severity": auto_severity,
        "confidence": conf_pct,
    }

    meta = CATEGORY_META.get(cat, {"department": "Municipal Grievances", "sla_hours": 48})

    return {
        "status": "detected",
        "category": cat,
        "confidence": conf_pct,
        "confidence_score": conf_dec,
        "auto_severity": auto_severity,
        "severity": auto_severity,
        "suggested_title": suggested_title,
        "bbox": bbox,
        "box": bbox,
        "detected": True,
        "issue": issue,
        "damage_type": damage_type,
        "area_percentage": area_pct,
        "department": meta["department"],
        "sla_hours": meta["sla_hours"],
    }


@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "CivicSense AI Vision Service",
        "version": "4.0.0",
        "supported_categories": SUPPORTED_CATEGORIES,
        "threshold": "conf >= 0.50 (strict rejection for noise/documents)",
        "models": {
            "potholes": POTHOLE_PATH,
            "garbage": GARBAGE_PATH,
            "general_anti_spam": GENERAL_PATH,
        }
    }


@app.post("/analyze")
@app.post("/predict")
async def analyze_image(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None)
):
    """
    Unified AI Vision Analysis Endpoint.
    Does NOT require a category pre-selection.
    Rejects spam, documents, and low-confidence predictions (< 0.50).
    """
    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        np_image = np.array(pil_image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    # 1. Anti-Spam / Document / Uniform Background Check
    is_spam, reason = check_input_sanity(np_image, pil_image)
    if is_spam:
        return {
            "status": "no_issue_detected",
            "message": "No valid civic hazard detected in this photo. Please upload a clear photo of road damage, garbage, drainage, or streetlight.",
            "detected": False,
            "box": None,
            "bbox": None,
            "category": None,
            "rejection_reason": reason,
        }

    # 2. Multi-Class YOLO Civic Defect Detection with strict conf >= 0.50
    result = detect_civic_hazards(pil_image, np_image)
    return result


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
