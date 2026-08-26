import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { signToken } from "../middleware/auth.js";

// Citizens authenticate with a government ID. First-time IDs are
// auto-registered — swap this for a real government ID verification
// service (e.g. Aadhaar-based eKYC) before production use.
export async function citizenLogin(req, res, next) {
  try {
    const { govId, name, ward } = req.body;
    if (!govId) return res.status(400).json({ error: "govId is required" });

    const existing = await pool.query("SELECT * FROM users WHERE gov_id = $1", [govId]);
    let user = existing.rows[0];

    if (!user) {
      const inserted = await pool.query(
        `INSERT INTO users (role, name, gov_id, ward) VALUES ('citizen', $1, $2, $3) RETURNING *`,
        [name || "Citizen", govId, ward || null]
      );
      user = inserted.rows[0];
    }

    const token = signToken({ sub: user.id, role: "citizen", name: user.name });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Officials and admins authenticate with email + password (seeded via db:setup).
export async function staffLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    let officialId = null;
    let department = null;
    if (user.role === "official") {
      const off = await pool.query("SELECT id, department FROM officials WHERE user_id = $1", [user.id]);
      officialId = off.rows[0]?.id || null;
      department = off.rows[0]?.department || null;
    }

    const token = signToken({ sub: user.id, role: user.role, name: user.name, officialId, department });
    res.json({ token, user: { ...publicUser(user), officialId, department }, officialId, department });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    let officialId = null;
    let department = null;
    if (user.role === "official") {
      const off = await pool.query("SELECT id, department FROM officials WHERE user_id = $1", [user.id]);
      officialId = off.rows[0]?.id || null;
      department = off.rows[0]?.department || null;
    }

    res.json({ user: { ...publicUser(user), officialId, department } });
  } catch (err) {
    next(err);
  }
}

function publicUser(u) {
  return {
    id: u.id,
    role: u.role,
    name: u.name,
    govId: u.gov_id,
    email: u.email,
    ward: u.ward,
    coins: u.coins,
    flagged: u.flagged,
  };
}
