# CivicSense — Frontend Prototype

A frontend-only prototype of the CivicSense public grievance platform for
Pune District (PMC / PCMC / PMRDA), covering all three dashboards from the
project spec:

- **Citizen Dashboard** — file a complaint (camera capture + location +
  simulated AI classification), track by token, validate resolutions,
  coin rewards, SOS page, live map.
- **Government Official Dashboard** — department-filtered priority queue
  (severity + escalation + proximity to hospitals/schools/colleges),
  assign officers, resolve complaints, analytics.
- **Admin Dashboard** — platform overview, citizen monitoring (flagging),
  government monitoring (resolution rates), audit log, platform settings
  (departments, AI config, notifications, permissions).

## What's real vs. mocked

This is **UI + client-side logic only** — there is no backend yet.

Real, working client-side logic:
- 48-hour SLA auto-escalation, computed live from timestamps
- Priority scoring (severity + escalation + proximity to key sites)
- Naive duplicate-complaint detection (same category, within 150m, last 14 days)
- Coin rewards on citizen-validated closure
- Camera capture via `getUserMedia`, with permission-denied → file-upload fallback
- Geolocation capture, with permission-denied → manual-area fallback
- Data persists in the browser via `localStorage` (per-browser, not shared)

Mocked / placeholder, ready to swap for real integrations:
- **AI image analysis (YOLOv8)** — simulated with a timeout; swap in a
  real call to your FastAPI/Flask inference service
- **Live map** — a normalized lat/lng grid, not real tiles; swap in the
  Google Maps JavaScript API (the data model is already lat/lng based)
- **Auth** — any input signs you in as the seeded demo account; swap in
  real government-ID verification / Supabase or custom auth
- **Notifications, coin redemption** — UI only, no delivery/backend

## Stack

React + Vite, Tailwind CSS, React Router, Lucide icons, Recharts.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. Use the role cards on the landing page
to enter any of the three dashboards (any login value works).

To reset the seeded demo data at any time, go to
**Admin → Platform Settings → Reset demo data**.
