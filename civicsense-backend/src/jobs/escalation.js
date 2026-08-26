import cron from "node-cron";
import { pool } from "../db/pool.js";
import { logAudit } from "../controllers/adminController.js";

const TERMINAL_STATUSES = ["resolved_pending_validation", "closed", "reopened"];
const HOURS_PER_ESCALATION = 48;

async function runEscalationSweep() {
  const { rows } = await pool.query(
    `SELECT token, escalation_level, last_action_at, status
     FROM complaints
     WHERE status NOT IN ('resolved_pending_validation', 'closed', 'reopened')`
  );

  for (const c of rows) {
    if (TERMINAL_STATUSES.includes(c.status)) continue;
    const hoursSinceAction = (Date.now() - new Date(c.last_action_at).getTime()) / 3600000;
    if (hoursSinceAction < HOURS_PER_ESCALATION * (c.escalation_level + 1)) continue;

    const nextLevel = Math.min(3, c.escalation_level + 1);
    await pool.query(
      `UPDATE complaints SET escalation_level = $1, status = 'escalated' WHERE token = $2`,
      [nextLevel, c.token]
    );
    await logAudit("system", `Auto-escalated ${c.token} to Level ${nextLevel} (no action in 48h)`);
    // TODO: trigger Firebase FCM / Twilio SMS notification to the next-level authority here.
  }
}

export function startEscalationJob() {
  // Runs every 15 minutes. Tune via CRON schedule below if your SLA needs differ.
  cron.schedule("*/15 * * * *", () => {
    runEscalationSweep().catch((err) => console.error("Escalation sweep failed:", err));
  });
  console.log("Escalation cron job scheduled (every 15 min, 48h SLA).");
}

// Exported for manual/test runs
export { runEscalationSweep };
