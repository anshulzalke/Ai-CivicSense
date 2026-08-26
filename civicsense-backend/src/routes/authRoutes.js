import { Router } from "express";
import { citizenLogin, staffLogin, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/citizen-login", citizenLogin);
router.post("/staff-login", staffLogin);
router.get("/me", requireAuth, me);

export default router;
