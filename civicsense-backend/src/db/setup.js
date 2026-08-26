import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { generateToken } from "../utils/token.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const client = await pool.connect();
  try {
    console.log("Running schema.sql ...");
    await client.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

    console.log("Running seed.sql ...");
    await client.query(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));

    console.log("Creating seeded staff accounts ...");
    const staffPasswordHash = await bcrypt.hash("civicsense123", 10);

    const staff = [
      { name: "R. Kulkarni", email: "r.kulkarni@civicsense.gov.in", dept: "potholes", level: 1 },
      { name: "S. Deshmukh", email: "s.deshmukh@civicsense.gov.in", dept: "garbage", level: 1 },
      { name: "A. Bhosale", email: "a.bhosale@civicsense.gov.in", dept: "drainage", level: 1 },
      { name: "Zonal Officer — East", email: "zonal.east@civicsense.gov.in", dept: "potholes", level: 2 },
      { name: "Divisional Commissioner", email: "commissioner@civicsense.gov.in", dept: "potholes", level: 3 },
    ];

    const officialIds = {};
    for (const s of staff) {
      const { rows } = await client.query(
        `INSERT INTO users (role, name, email, password_hash) VALUES ('official', $1, $2, $3) RETURNING id`,
        [s.name, s.email, staffPasswordHash]
      );
      const userId = rows[0].id;
      const { rows: offRows } = await client.query(
        `INSERT INTO officials (user_id, department, level) VALUES ($1, $2, $3) RETURNING id`,
        [userId, s.dept, s.level]
      );
      officialIds[s.name] = offRows[0].id;
    }

    await client.query(
      `INSERT INTO users (role, name, email, password_hash) VALUES ('admin', 'District Admin', 'admin@civicsense.gov.in', $1)`,
      [staffPasswordHash]
    );

    console.log("Filing sample complaints ...");
    const citizenId = "00000000-0000-0000-0000-000000000001";
    const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

    const complaints = [
      {
        category: "potholes",
        title: "Deep pothole near Wagholi bus stop",
        description: "Large pothole, water-logged, causing two-wheelers to swerve into traffic.",
        severity: 4,
        lat: 18.5793,
        lng: 73.9812,
        status: "in_progress",
        createdAt: hoursAgo(50),
        lastActionAt: hoursAgo(30),
        officer: "R. Kulkarni",
      },
      {
        category: "garbage",
        title: "Overflowing garbage bin, Kharadi lane 4",
        description: "Bin uncollected for over a week, attracting stray animals.",
        severity: 3,
        lat: 18.5515,
        lng: 73.9345,
        status: "submitted",
        createdAt: hoursAgo(60),
        lastActionAt: hoursAgo(60),
        officer: "S. Deshmukh",
      },
      {
        category: "drainage",
        title: "Blocked drain flooding main road",
        description: "Storm drain blocked with debris, road floods after every rain.",
        severity: 5,
        lat: 18.5227,
        lng: 73.8636,
        status: "escalated",
        escalationLevel: 1,
        createdAt: hoursAgo(120),
        lastActionAt: hoursAgo(70),
        officer: "A. Bhosale",
      },
    ];

    for (const c of complaints) {
      await client.query(
        `INSERT INTO complaints
          (token, category, title, description, severity, lat, lng, status, citizen_id, assigned_officer_id, escalation_level, created_at, last_action_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          generateToken(),
          c.category,
          c.title,
          c.description,
          c.severity,
          c.lat,
          c.lng,
          c.status,
          citizenId,
          officialIds[c.officer],
          c.escalationLevel || 0,
          c.createdAt,
          c.lastActionAt,
        ]
      );
    }

    console.log("Done. Seeded staff login password: civicsense123");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
