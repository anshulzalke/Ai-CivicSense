import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { pool } from "./db/pool.js";
import { startEscalationJob } from "./jobs/escalation.js";

const PORT = process.env.PORT || 4000;

async function autoMigrate() {
  try {
    await pool.query("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_image_url TEXT;");
    await pool.query("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rating SMALLINT;");
    await pool.query("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;");
    await pool.query("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reopened_reason TEXT;");
    await pool.query("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS flagged_by TEXT;");
  } catch (err) {
    console.warn("Auto-migration note:", err.message);
  }
}


// Graceful process error protection
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const server = app.listen(PORT, async () => {
  console.log(`CivicSense backend listening on http://localhost:${PORT}`);
  await autoMigrate();
  try {
    startEscalationJob();
  } catch (err) {
    console.warn("Escalation cron note:", err.message);
  }
});

export default server;


