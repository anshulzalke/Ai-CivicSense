import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listComplaints,
  getComplaint,
  fileComplaint,
  checkDuplicate,
  assignOfficer,
  resolveComplaint,
  validateResolution,
  submitFeedback,
  flagResolution,
} from "../controllers/complaintController.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local disk storage for the prototype — swap for S3 / Supabase Storage /
// GCS in production so uploads survive redeploys and scale horizontally.
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image uploads are allowed"));
    cb(null, true);
  },
});

const router = Router();

router.use(requireAuth);

router.get("/", listComplaints);
router.get("/:token", getComplaint);
router.post("/check-duplicate", checkDuplicate);
router.post("/", requireRole("citizen"), upload.single("image"), fileComplaint);
router.patch("/:token/assign", requireRole("official", "admin"), assignOfficer);
router.patch("/:token/resolve", requireRole("official", "admin"), upload.single("resolution_image"), resolveComplaint);
router.post("/:token/resolve", requireRole("official", "admin"), upload.single("resolution_image"), resolveComplaint);
router.patch("/:token/validate", requireRole("citizen", "admin"), validateResolution);
router.post("/:token/validate", requireRole("citizen", "admin"), validateResolution);
router.post("/:token/feedback", requireRole("citizen", "admin"), validateResolution);
router.post("/:token/flag", requireRole("official", "admin"), flagResolution);
router.patch("/:token/flag", requireRole("official", "admin"), flagResolution);




export default router;
