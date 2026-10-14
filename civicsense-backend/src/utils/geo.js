export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const CATEGORY_SLA_HOURS = {
  drainage: 24,
  Drainage: 24,
  streetlights: 48,
  streetlight: 48,
  Streetlight: 48,
  Streetlights: 48,
  potholes: 48,
  Potholes: 48,
  garbage: 72,
  Garbage: 72,
};

export function getCategorySLAHours(category) {
  if (!category) return 48;
  const c = String(category).toLowerCase();
  if (c.includes("drain") || c.includes("manhole") || c.includes("waterlog") || c.includes("sewer")) return 24;
  if (c.includes("light") || c.includes("lamp") || c.includes("electric")) return 48;
  if (c.includes("garb") || c.includes("waste") || c.includes("trash") || c.includes("sanitation")) return 72;
  if (c.includes("pothole") || c.includes("crack") || c.includes("road")) return 48;
  return 48;
}

export function getDefaultSeverity(category) {
  if (!category) return 3;
  const c = String(category).toLowerCase();
  if (c.includes("drain") || c.includes("manhole") || c.includes("waterlog")) return 5;
  if (c.includes("pothole") || c.includes("road")) return 4;
  if (c.includes("light") || c.includes("lamp") || c.includes("electric")) return 3;
  if (c.includes("garb") || c.includes("waste") || c.includes("trash")) return 2;
  return 3;
}

const TERMINAL_STATUSES = ["resolved_pending_validation", "closed", "reopened"];

// Derives the *effective* status/escalation purely from timestamps & category SLA:
// - Drainage: 24 hours (Level 5 Emergency)
// - Streetlight: 48 hours (Level 3)
// - Potholes: 48 hours (Level 4)
// - Garbage: 72 hours (Level 2)
export function deriveEscalation(complaint) {
  if (!complaint) return { effectiveStatus: "submitted", effectiveLevel: 0, hoursSinceAction: 0 };
  if (TERMINAL_STATUSES.includes(complaint.status)) {
    return { effectiveStatus: complaint.status, effectiveLevel: complaint.escalation_level, hoursSinceAction: 0 };
  }
  const lastAction = complaint.last_action_at || complaint.lastActionAt || complaint.created_at || complaint.createdAt || new Date();
  const hoursSinceAction = Math.max(0, (Date.now() - new Date(lastAction).getTime()) / 3600000);
  const slaHours = getCategorySLAHours(complaint.category);
  const extraEscalations = Math.floor(hoursSinceAction / slaHours);
  const effectiveLevel = Math.min(3, (complaint.escalation_level ?? complaint.escalationLevel ?? 0) + extraEscalations);
  const effectiveStatus = effectiveLevel > (complaint.escalation_level ?? complaint.escalationLevel ?? 0) ? "escalated" : complaint.status;
  return { effectiveStatus, effectiveLevel, hoursSinceAction };
}

export function priorityScore(complaint, nearestPoiDistance) {
  if (!complaint) return 0;
  const { effectiveLevel } = deriveEscalation(complaint);
  const proximityBonus =
    nearestPoiDistance != null && nearestPoiDistance < 800 ? Math.round((800 - nearestPoiDistance) / 40) : 0;
  const baseSeverity = Number(complaint.severity) || getDefaultSeverity(complaint.category);
  return baseSeverity * 10 + effectiveLevel * 8 + proximityBonus;
}

export function nearestPOIDistance(lat, lng, pois) {
  let best = Infinity;
  for (const poi of pois) {
    const d = distanceMeters(lat, lng, poi.lat, poi.lng);
    if (d < best) best = d;
  }
  return best === Infinity ? null : best;
}
