import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment if connecting to a managed Postgres that requires SSL:
  // ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

export async function query(text, params) {
  return pool.query(text, params);
}
