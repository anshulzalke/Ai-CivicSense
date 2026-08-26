import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/pool.js";
import { generateToken } from "../utils/token.js";
import { deriveEscalation, priorityScore, nearestPOIDistance, distanceMeters } from "../utils/geo.js";
import { logAudit } from "./adminController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


async function getPOIs() {
  const { rows } = await pool.query("SELECT name, type, lat, lng FROM points_of_interest");
  return rows;
}

function decorate(complaint, pois) {
  const { effectiveStatus, effectiveLevel, hoursSinceAction } = deriveEscalation(complaint);
  const poiDistance = nearestPOIDistance(complaint.lat, complaint.lng, pois);
  return {
    ...complaint,
    effectiveStatus,
    effectiveLevel,
    hoursSinceAction,
    priorityScore: priorityScore(complaint, poiDistance),
  };
}

export function getDepartmentCategories(dept) {
  const map = {
    potholes: ["potholes", "road_damage", "infrastructure"],
    garbage: ["garbage", "sanitation", "solid_waste"],
    drainage: ["drainage", "water", "sewage"],
    streetlights: ["streetlights", "electrical", "lighting"],
  };
  return map[dept] || [dept];
}

// GET /api/complaints — role-scoped listing with RBAC privacy
export async function listComplaints(req, res, next) {
  try {
    const { category, status } = req.query;
    const params = [];
    const clauses = [];

    // 1. Citizen Role: STRICT Isolation to only their own complaints
    if (req.user.role === "citizen") {
      params.push(String(req.user.sub));
      clauses.push(`(citizen_id::text = $${params.length} OR citizen_id IN (SELECT id FROM users WHERE id::text = $${params.length} OR gov_id = $${params.length}))`);
    } 
    // 2. Official Role: Department-scoped filtering
    else if (req.user.role === "official") {
      let dept = req.user.department;
      if (!dept && req.user.officialId) {
        const off = await pool.query("SELECT department FROM officials WHERE id::text = $1", [String(req.user.officialId)]);
        dept = off.rows[0]?.department;
      }
      if (dept && dept !== "all") {
        const deptCats = getDepartmentCategories(dept);
        params.push(deptCats);
        clauses.push(`category = ANY($${params.length})`);
      }
    }
    // 3. Admin Role: Can see all district complaints, or filter dynamically

    if (category && category !== "all") {
      const targetCats = getDepartmentCategories(category);
      params.push(targetCats);
      clauses.push(`category = ANY($${params.length})`);
    }
    if (status && status !== "all") {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await pool.query(`SELECT * FROM complaints ${where} ORDER BY created_at DESC`, params);

    const pois = await getPOIs();
    res.json({ complaints: rows.map((c) => decorate(c, pois)) });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/:token — token lookup with role-based access validation
export async function getComplaint(req, res, next) {
  try {
    const { rows } = await pool.query("SELECT * FROM complaints WHERE token = $1", [req.params.token]);
    const complaint = rows[0];
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    // Citizen Privacy Verification
    if (req.user.role === "citizen") {
      const userRes = await pool.query("SELECT id, gov_id FROM users WHERE id::text = $1 OR gov_id = $1", [String(req.user.sub)]);
      const userGovId = userRes.rows[0]?.gov_id;
      const isOwner = complaint.citizen_id === String(req.user.sub) || (userGovId && complaint.citizen_id === userGovId);
      if (!isOwner) {
        return res.status(403).json({ error: "Access Denied: You are only permitted to view your own complaints." });
      }
    }

    const pois = await getPOIs();
    res.json({ complaint: decorate(complaint, pois) });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/check-duplicate — naive proximity + category + time-window check
export async function checkDuplicate(req, res, next) {
  try {
    const { category, lat, lng } = req.body;
    if (!category || lat == null || lng == null) {
      return res.status(400).json({ error: "category, lat, and lng are required" });
    }
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const { rows } = await pool.query(
      `SELECT * FROM complaints WHERE category = $1 AND created_at > $2 AND status != 'closed'`,
      [category, twoWeeksAgo]
    );
    const match = rows.find((c) => distanceMeters(lat, lng, c.lat, c.lng) < 150);
    res.json({ duplicate: match || null });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints — file a new complaint (citizen only)
// Image arrives as multipart/form-data (see routes) and is stored under /uploads;
// swap the storage step for S3 / Supabase Storage / GCS for production.
export async function fileComplaint(req, res, next) {
  try {
    const { category, title, description, severity, lat, lng, audio_url, audio_base64, audio } = req.body;
    if (!category || !lat || !lng) {
      return res.status(400).json({ error: "category, lat, and lng are required" });
    }

    const token = generateToken();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const audioUrl = audio_url || audio_base64 || audio || null;

    // Route to the department's most junior available officer for the demo;
    // a real system would balance load or use officer availability/schedule.
    const officerRes = await pool.query(
      "SELECT id FROM officials WHERE department = $1 ORDER BY level ASC LIMIT 1",
      [category]
    );
    const officerId = officerRes.rows[0]?.id || null;

    let rows;
    try {
      const result = await pool.query(
        `INSERT INTO complaints (token, category, title, description, severity, lat, lng, image_url, audio_url, citizen_id, assigned_officer_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          token,
          category,
          title || `${category} issue`,
          description || null,
          Number(severity) || 3,
          Number(lat),
          Number(lng),
          imageUrl,
          audioUrl,
          req.user.sub,
          officerId,
        ]
      );
      rows = result.rows;
    } catch (schemaErr) {
      // Fallback if audio_url column doesn't exist yet in live postgres instance
      const result = await pool.query(
        `INSERT INTO complaints (token, category, title, description, severity, lat, lng, image_url, citizen_id, assigned_officer_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          token,
          category,
          title || `${category} issue`,
          description || null,
          Number(severity) || 3,
          Number(lat),
          Number(lng),
          imageUrl,
          req.user.sub,
          officerId,
        ]
      );
      rows = result.rows;
      if (rows[0] && audioUrl) {
        rows[0].audio_url = audioUrl;
      }
    }

    await logAudit(req.user.name || "citizen", `Filed new complaint ${token}`);

    const pois = await getPOIs();
    res.status(201).json({ complaint: decorate(rows[0], pois) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/complaints/:token/assign — official reassigns to a different officer in their department
export async function assignOfficer(req, res, next) {
  try {
    const { officerId } = req.body;
    const { rows } = await pool.query(
      `UPDATE complaints SET assigned_officer_id = $1, last_action_at = now() WHERE token = $2 RETURNING *`,
      [officerId, req.params.token]
    );
    if (!rows[0]) return res.status(404).json({ error: "Complaint not found" });
    await logAudit(req.user.name, `Reassigned ${req.params.token}`);
    res.json({ complaint: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PATCH or POST /api/complaints/:token/resolve — official marks resolved, sends back to citizen for validation with proof photo
export async function resolveComplaint(req, res, next) {
  try {
    const { note } = req.body;
    let resolutionImageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.resolution_image_url || req.body.resolutionImageUrl || req.body.resolution_image || req.body.image || null);

    // If base64 data URL is provided in json body, persist to /uploads
    if (resolutionImageUrl && typeof resolutionImageUrl === "string" && resolutionImageUrl.startsWith("data:image/")) {
      try {
        const match = resolutionImageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          const ext = match[1] === "jpeg" ? "jpg" : match[1].replace("+xml", "");
          const buffer = Buffer.from(match[2], "base64");
          const filename = `resolution-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
          const filePath = path.join(__dirname, "..", "uploads", filename);
          fs.writeFileSync(filePath, buffer);
          resolutionImageUrl = `/uploads/${filename}`;
        }
      } catch (e) {
        console.warn("Failed to decode base64 resolution image:", e.message);
      }
    }

    const { rows } = await pool.query(
      `UPDATE complaints
       SET status = 'resolved_pending_validation', 
           resolution_note = $1, 
           resolution_image_url = COALESCE($2, resolution_image_url),
           last_action_at = now()
       WHERE token = $3 RETURNING *`,
      [note || "Issue addressed by municipal field team.", resolutionImageUrl, req.params.token]
    );
    if (!rows[0]) return res.status(404).json({ error: "Complaint not found" });
    await logAudit(req.user.name, `Marked ${req.params.token} as resolved with proof photo`);
    res.json({ complaint: rows[0] });
  } catch (err) {
    next(err);
  }
}


// PATCH or POST /api/complaints/:token/validate or /api/complaints/:token/feedback
export async function validateResolution(req, res, next) {
  try {
    const { satisfied, rating, feedback, reason } = req.body;
    const { rows: existing } = await pool.query("SELECT * FROM complaints WHERE token = $1", [req.params.token]);
    const complaint = existing[0];
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (complaint.citizen_id !== req.user.sub && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only validate your own complaints" });
    }

    if (satisfied) {
      const starRating = rating ? Number(rating) : 5;
      const citizenFeedback = feedback || "Satisfied with resolution";
      const { rows } = await pool.query(
        `UPDATE complaints 
         SET status = 'closed', citizen_satisfied = true, rating = $1, citizen_feedback = $2, last_action_at = now()
         WHERE token = $3 RETURNING *`,
        [starRating, citizenFeedback, req.params.token]
      );
      await pool.query("UPDATE users SET coins = coins + 25 WHERE id = $1", [complaint.citizen_id]);
      await logAudit(req.user.name, `Citizen validated ${req.params.token} (${starRating}★) (+25 coins)`);
      res.json({ complaint: rows[0] });
    } else {
      const rejectionReason = reason || feedback || "Citizen indicated issue not resolved properly";
      const starRating = rating ? Number(rating) : 1;

      // Automatically re-assign to higher level officer if available
      const { rows: higherOfficers } = await pool.query(
        `SELECT id, level FROM officials WHERE department = $1 AND level >= 2 ORDER BY level DESC LIMIT 1`,
        [complaint.category]
      );
      const higherOfficerId = higherOfficers[0]?.id || complaint.assigned_officer_id;
      const newLevel = Math.min((complaint.escalation_level || 0) + 1, 3);

      const { rows } = await pool.query(
        `UPDATE complaints
         SET status = 'escalated', 
             escalation_level = $1, 
             citizen_satisfied = false,
             rating = $2,
             citizen_feedback = $3,
             reopened_reason = $4,
             assigned_officer_id = $5,
             last_action_at = now()
         WHERE token = $6 RETURNING *`,
        [newLevel, starRating, rejectionReason, rejectionReason, higherOfficerId, req.params.token]
      );
      await logAudit(req.user.name, `Citizen rejected resolution for ${req.params.token} (Reason: ${rejectionReason}) — Escalated to Level ${newLevel}`);
      res.json({ complaint: rows[0] });
    }
  } catch (err) {
    next(err);
  }
}

// Alias for feedback route
export const submitFeedback = validateResolution;

// POST or PATCH /api/complaints/:token/flag — Admin flags fake/incomplete resolution and penalizes/escalates
export async function flagResolution(req, res, next) {
  try {
    const { reason = "Resolution flagged as incomplete/mismatched proof by Admin" } = req.body;
    const { rows: existing } = await pool.query("SELECT * FROM complaints WHERE token = $1", [req.params.token]);
    const complaint = existing[0];
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    // Escalated status and assign higher level official
    const { rows: higherOfficers } = await pool.query(
      `SELECT id, level FROM officials WHERE department = $1 AND level >= 2 ORDER BY level DESC LIMIT 1`,
      [complaint.category]
    );
    const higherOfficerId = higherOfficers[0]?.id || complaint.assigned_officer_id;
    const newLevel = Math.min((complaint.escalation_level || 0) + 1, 3);

    const { rows } = await pool.query(
      `UPDATE complaints
       SET status = 'escalated',
           escalation_level = $1,
           flagged_by = $2,
           reopened_reason = $3,
           assigned_officer_id = $4,
           last_action_at = now()
       WHERE token = $5 RETURNING *`,
      [newLevel, req.user.name || "Admin", reason, higherOfficerId, req.params.token]
    );

    await logAudit(req.user.name || "Admin", `Resolution Flagged by Admin for ${req.params.token} (Reason: ${reason}) — Escalated to Level ${newLevel}`);
    res.json({ complaint: rows[0], message: "Resolution flagged and escalated for field rework." });
  } catch (err) {
    next(err);
  }
}


