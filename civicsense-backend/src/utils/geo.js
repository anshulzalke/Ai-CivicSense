export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const HOURS_PER_ESCALATION = 48;
const TERMINAL_STATUSES = ["resolved_pending_validation", "closed", "reopened"];

// Derives the *effective* status/escalation purely from timestamps, so the
// 48-hour SLA behaves consistently whether read via API or recomputed by the cron job.
export function deriveEscalation(complaint) {
  if (TERMINAL_STATUSES.includes(complaint.status)) {
    return { effectiveStatus: complaint.status, effectiveLevel: complaint.escalation_level, hoursSinceAction: 0 };
  }
  const hoursSinceAction = (Date.now() - new Date(complaint.last_action_at).getTime()) / 3600000;
  const extraEscalations = Math.floor(hoursSinceAction / HOURS_PER_ESCALATION);
  const effectiveLevel = Math.min(3, complaint.escalation_level + extraEscalations);
  const effectiveStatus = effectiveLevel > complaint.escalation_level ? "escalated" : complaint.status;
  return { effectiveStatus, effectiveLevel, hoursSinceAction };
}

export function priorityScore(complaint, nearestPoiDistance) {
  const { effectiveLevel } = deriveEscalation(complaint);
  const proximityBonus =
    nearestPoiDistance != null && nearestPoiDistance < 800 ? Math.round((800 - nearestPoiDistance) / 40) : 0;
  return complaint.severity * 10 + effectiveLevel * 8 + proximityBonus;
}

export function nearestPOIDistance(lat, lng, pois) {
  let best = Infinity;
  for (const poi of pois) {
    const d = distanceMeters(lat, lng, poi.lat, poi.lng);
    if (d < best) best = d;
  }
  return best === Infinity ? null : best;
}
