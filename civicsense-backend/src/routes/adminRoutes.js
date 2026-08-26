import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getAuditLog,
  listDepartments,
  listOfficials,
  listCitizens,
  flagCitizen,
  govPerformance,
  getSystemHealth,
  getSystemDiagnostics,
  seedDemoData,
  resetDatabase,
} from "../controllers/adminController.js";

const router = Router();

router.use(requireAuth);

// Departments/officials are readable by any authenticated role (citizen needs
// them for the file-complaint form; officials/admin need them for assignment).
router.get("/departments", listDepartments);
router.get("/officials", listOfficials);

router.get("/audit-log", requireRole("admin"), getAuditLog);
router.get("/citizens", requireRole("admin"), listCitizens);
router.patch("/citizens/:id/flag", requireRole("admin"), flagCitizen);
router.get("/gov-performance", requireRole("admin", "official"), govPerformance);
router.get("/system-health", requireRole("admin"), getSystemHealth);
router.get("/diagnostics", requireRole("admin"), getSystemDiagnostics);
router.post("/seed-demo-data", requireRole("admin"), seedDemoData);
router.post("/reset-database", requireRole("admin"), resetDatabase);


export default router;

