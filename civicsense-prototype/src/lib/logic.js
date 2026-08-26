import { POIS, PUNE_BOUNDS } from "./mockData";

// Haversine distance in meters
export function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const numLat1 = Number(lat1);
  const numLng1 = Number(lng1);
  const numLat2 = Number(lat2);
  const numLng2 = Number(lng2);
  if (isNaN(numLat1) || isNaN(numLng1) || isNaN(numLat2) || isNaN(numLng2)) return Infinity;

  const R = 6371000;
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLng = ((numLng2 - numLng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Normalize a lat/lng into 0-100 percentage box coordinates for the placeholder map
export function toBoxPercent(lat, lng) {
  if (lat == null || lng == null) return { x: 50, y: 50 };
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return { x: 50, y: 50 };

  const minLng = PUNE_BOUNDS?.minLng ?? 73.75;
  const maxLng = PUNE_BOUNDS?.maxLng ?? 74.00;
  const minLat = PUNE_BOUNDS?.minLat ?? 18.45;
  const maxLat = PUNE_BOUNDS?.maxLat ?? 18.65;

  const x = ((numLng - minLng) / (maxLng - minLng)) * 100;
  const y = 100 - ((numLat - minLat) / (maxLat - minLat)) * 100;
  return {
    x: Math.min(98, Math.max(2, isNaN(x) ? 50 : x)),
    y: Math.min(98, Math.max(2, isNaN(y) ? 50 : y)),
  };
}

export function nearestPOI(lat, lng) {
  if (lat == null || lng == null) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return null;

  let best = null;
  const safePOIS = Array.isArray(POIS) ? POIS : [];
  for (const poi of safePOIS) {
    if (!poi || poi.lat == null || poi.lng == null) continue;
    const d = distanceMeters(numLat, numLng, poi.lat, poi.lng);
    if (!isNaN(d) && d !== Infinity && (!best || d < best.distance)) {
      best = { ...poi, distance: d };
    }
  }
  return best;
}

const HOURS_PER_ESCALATION = 48;

// Derives the *effective* status/escalation purely from timestamps, so the
// 48-hour SLA escalation behaves automatically without a real cron backend.
export function deriveEscalation(complaint) {
  if (!complaint) return { effectiveStatus: "submitted", effectiveLevel: 0, hoursSinceAction: 0 };
  const terminal = ["resolved_pending_validation", "closed", "reopened"];
  const status = complaint?.status || "submitted";
  const escLevel = Number(complaint?.escalationLevel || complaint?.escalation_level) || 0;
  if (terminal.includes(status)) {
    return { effectiveStatus: status, effectiveLevel: escLevel, hoursSinceAction: 0 };
  }
  const lastAction =
    complaint?.lastActionAt ||
    complaint?.last_action_at ||
    complaint?.createdAt ||
    complaint?.created_at ||
    new Date().toISOString();
  const hoursSinceAction = Math.max(0, (Date.now() - new Date(lastAction).getTime()) / 3600000);
  const extraEscalations = Math.floor(hoursSinceAction / HOURS_PER_ESCALATION);
  const effectiveLevel = Math.min(3, escLevel + extraEscalations);
  const effectiveStatus = effectiveLevel > escLevel ? "escalated" : status;
  return { effectiveStatus, effectiveLevel, hoursSinceAction: isNaN(hoursSinceAction) ? 0 : hoursSinceAction };
}

export function priorityScore(complaint) {
  if (!complaint) return 0;
  const { effectiveLevel } = deriveEscalation(complaint);
  const poi = nearestPOI(complaint?.lat, complaint?.lng);
  const proximityBonus = poi && poi.distance < 800 ? Math.round((800 - poi.distance) / 40) : 0;
  return (Number(complaint?.severity) || 3) * 10 + effectiveLevel * 8 + (isNaN(proximityBonus) ? 0 : proximityBonus);
}


export function severityLabel(sev) {
  return ["", "Lowest", "Low", "Medium", "High", "Highest"][sev] || "Medium";
}

export function severityColor(sev) {
  if (sev >= 5) return "#C1443A";
  if (sev >= 4) return "#D45F53";
  if (sev >= 3) return "#E8A33D";
  if (sev >= 2) return "#C77F1F";
  return "#4C7A5E";
}

// Naive duplicate check: same category, within 150m, filed in the last 14 days
export function findPossibleDuplicate(newComplaint, existing) {
  const twoWeeksMs = 14 * 24 * 3600 * 1000;
  return existing.find((c) => {
    if (c.category !== newComplaint.category) return false;
    const cTime = new Date(c.createdAt || c.created_at || 0).getTime();
    if (Date.now() - cTime > twoWeeksMs) return false;
    const d = distanceMeters(newComplaint.lat, newComplaint.lng, c.lat, c.lng);
    return d < 150;
  }) || null;
}

export function generateToken() {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `CVX-2026-${n}`;
}

export function timeAgo(iso) {
  if (!iso) return "just now";
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return "just now";
  const diffMs = Date.now() - ts;
  const mins = diffMs / 60000;
  if (mins < 1) return "just now";
  const hours = diffMs / 3600000;
  if (hours < 1) return `${Math.floor(mins)}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const STATUS_LABELS = {
  submitted: "Submitted",
  in_progress: "In Progress",
  escalated: "Escalated",
  resolved_pending_validation: "Awaiting Your Validation",
  closed: "Closed",
  reopened: "Re-raised",
};
