# CivicSense — Backend

Node.js + Express + PostgreSQL backend for the CivicSense public grievance
platform. Matches the data model used by the frontend prototype
(`civicsense-prototype`), so the two are ready to wire together.

This has been built and tested end-to-end against a real local PostgreSQL 16
instance — schema, seed, login, file/resolve/validate flow, coin rewards, and
audit logging all verified working before packaging.

## Setup

1. **Install PostgreSQL** locally (or point at a managed instance — Supabase's
   Postgres works fine too, just use its connection string).

2. **Create the database:**
   ```bash
   createdb civicsense
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # edit .env — set DATABASE_URL and a real JWT_SECRET
   ```

4. **Install dependencies and initialize the schema + seed data:**
   ```bash
   npm install
   npm run db:setup
   ```
   This creates all tables, seeds departments/POIs, a demo citizen
   (`gov_id: GOV-XXXX-1187`), 5 seeded staff accounts, and 3 sample
   complaints. **Seeded staff password: `civicsense123`** for all of:
   - r.kulkarni@civicsense.gov.in (Potholes, L1)
   - s.deshmukh@civicsense.gov.in (Garbage, L1)
   - a.bhosale@civicsense.gov.in (Drainage, L1)
   - zonal.east@civicsense.gov.in (Potholes, L2)
   - commissioner@civicsense.gov.in (Potholes, L3)
   - admin@civicsense.gov.in (Admin)

5. **Run it:**
   ```bash
   npm run dev      # nodemon, auto-restart
   npm start        # plain node
   ```
   Server listens on `http://localhost:4000` by default.

## API overview

All routes except the two login endpoints require `Authorization: Bearer <token>`.

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/citizen-login` | — | `{ govId, name?, ward? }` → JWT (auto-registers new gov IDs) |
| POST | `/api/auth/staff-login` | — | `{ email, password }` → JWT |
| GET | `/api/auth/me` | any | current user profile |
| GET | `/api/complaints` | any | role-scoped list (`?category=`, `?status=`) |
| GET | `/api/complaints/:token` | any | single complaint, with derived escalation + priority score |
| POST | `/api/complaints/check-duplicate` | any | `{ category, lat, lng }` → possible duplicate match |
| POST | `/api/complaints` | citizen | multipart form: `category, title, description, severity, lat, lng, image` |
| PATCH | `/api/complaints/:token/assign` | official/admin | `{ officerId }` |
| PATCH | `/api/complaints/:token/resolve` | official/admin | `{ note }` → status → `resolved_pending_validation` |
| PATCH | `/api/complaints/:token/validate` | citizen | `{ satisfied }` → closes (+25 coins) or re-raises |
| GET | `/api/admin/departments` | any | department list |
| GET | `/api/admin/officials` | any | official list |
| GET | `/api/admin/citizens` | admin | citizen activity + flag status |
| PATCH | `/api/admin/citizens/:id/flag` | admin | `{ flagged, reason }` |
| GET | `/api/admin/gov-performance` | admin/official | resolution rate per official |
| GET | `/api/admin/audit-log` | admin | last 200 actions |

## What's real vs. still a stub

**Real and working:**
- JWT auth (citizen gov-ID + staff email/password, bcrypt-hashed)
- Full file → assign → resolve → validate → close/re-raise lifecycle
- 48-hour SLA auto-escalation — both computed live on read (`deriveEscalation`)
  and swept by a `node-cron` job every 15 minutes so status is correct even
  without a request
- Naive duplicate detection (same category, <150m via Haversine, last 14 days)
- Priority scoring (severity + escalation + proximity to seeded hospitals/schools)
- Coin rewards on citizen-confirmed closure
- Audit logging on every state-changing action
- Image upload via multipart/form-data (stored to local disk)

**Stubbed, marked in code for swap-in:**
- **Image storage** — currently local disk (`src/uploads/`); swap the
  `multer.diskStorage` in `src/routes/complaintRoutes.js` for S3 / Supabase
  Storage / GCS before deploying anywhere with more than one instance.
- **YOLOv8 AI classification** — not called yet. The frontend's simulated
  step should be replaced by a call from `fileComplaint()` in
  `complaintController.js` to your Python/FastAPI inference service before
  the row is inserted (or as an async follow-up that patches `severity`/
  category once classification completes).
- **Notifications** — escalation events are logged to `audit_log` and have a
  `// TODO` in `src/jobs/escalation.js` for wiring Firebase FCM / Twilio SMS.
- **Government-ID verification** — `citizenLogin` currently auto-registers
  any gov ID on first use; swap in real eKYC/government verification before
  production.

## Connecting the frontend prototype

The frontend prototype currently runs entirely on mock data + `localStorage`.
To wire it to this backend: replace the functions in
`civicsense-prototype/src/lib/store.js` and `src/context/AppContext.jsx` with
`fetch` calls to these endpoints, store the JWT (e.g. in memory + an
httpOnly-cookie-backed refresh if you add one), and send it as a Bearer
token. The data shapes already line up closely — complaint fields, status
enum values, and department/severity conventions match on both sides.
