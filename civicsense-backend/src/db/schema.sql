-- CivicSense schema — matches the data model used by the frontend prototype

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('citizen', 'official', 'admin');
CREATE TYPE complaint_status AS ENUM (
  'submitted',
  'in_progress',
  'escalated',
  'resolved_pending_validation',
  'closed',
  'reopened'
);

CREATE TABLE departments (
  id           TEXT PRIMARY KEY,           -- 'potholes' | 'garbage' | 'drainage'
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#3D4C6B'
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  name          TEXT NOT NULL,
  -- citizens authenticate with a government ID; officials/admins with email+password
  gov_id        TEXT UNIQUE,
  email         TEXT UNIQUE,
  password_hash TEXT,
  ward          TEXT,
  coins         INTEGER NOT NULL DEFAULT 0,
  flagged       BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE officials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department  TEXT NOT NULL REFERENCES departments(id),
  level       SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3)
);

CREATE TABLE complaints (
  token                TEXT PRIMARY KEY,   -- e.g. CVX-2026-000123
  category             TEXT NOT NULL REFERENCES departments(id),
  title                TEXT NOT NULL,
  description          TEXT,
  severity             SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
  lat                  DOUBLE PRECISION NOT NULL,
  lng                  DOUBLE PRECISION NOT NULL,
  image_url            TEXT,
  resolution_note      TEXT,
  resolution_image_url TEXT,
  rating               SMALLINT CHECK (rating BETWEEN 1 AND 5),
  citizen_feedback     TEXT,
  reopened_reason      TEXT,
  flagged_by           TEXT,
  citizen_satisfied    BOOLEAN,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_action_at       TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);
-- Speeds up the duplicate-detection window query (same category, recent)
CREATE INDEX idx_complaints_category_created ON complaints(category, created_at);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT NOT NULL,        -- user id, 'system', or role label
  action     TEXT NOT NULL,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE points_of_interest (
  name  TEXT PRIMARY KEY,
  type  TEXT NOT NULL,             -- 'hospital' | 'school' | 'college'
  lat   DOUBLE PRECISION NOT NULL,
  lng   DOUBLE PRECISION NOT NULL
);
