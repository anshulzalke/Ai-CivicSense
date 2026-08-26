import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { getSystemDiagnostics } from "./controllers/adminController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "civicsense-backend" }));
app.get("/api/system/diagnostics", requireAuth, requireRole("admin"), getSystemDiagnostics);

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);


app.use(notFound);
app.use(errorHandler);
