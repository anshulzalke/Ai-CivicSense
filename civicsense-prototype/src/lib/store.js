import { SEED_COMPLAINTS, SEED_CITIZEN, SEED_CITIZEN_FLAGS, SEED_AUDIT_LOG } from "./mockData";

const KEYS = {
  complaints: "civicsense.complaints",
  citizen: "civicsense.citizen",
  flags: "civicsense.flags",
  audit: "civicsense.audit",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — prototype still works for the current session via React state
  }
}

export function seedIfNeeded() {
  if (!localStorage.getItem(KEYS.complaints)) write(KEYS.complaints, SEED_COMPLAINTS);
  if (!localStorage.getItem(KEYS.citizen)) write(KEYS.citizen, SEED_CITIZEN);
  if (!localStorage.getItem(KEYS.flags)) write(KEYS.flags, SEED_CITIZEN_FLAGS);
  if (!localStorage.getItem(KEYS.audit)) write(KEYS.audit, SEED_AUDIT_LOG);
}

export function getComplaints() {
  return read(KEYS.complaints, SEED_COMPLAINTS);
}
export function saveComplaints(list) {
  write(KEYS.complaints, list);
}

export function getCitizen() {
  return read(KEYS.citizen, SEED_CITIZEN);
}
export function saveCitizen(c) {
  write(KEYS.citizen, c);
}

export function getFlags() {
  return read(KEYS.flags, SEED_CITIZEN_FLAGS);
}

export function getAudit() {
  return read(KEYS.audit, SEED_AUDIT_LOG);
}
export function pushAudit(entry) {
  const log = getAudit();
  const next = [{ id: Date.now(), at: new Date().toISOString(), ...entry }, ...log];
  write(KEYS.audit, next);
  return next;
}

export function resetAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  seedIfNeeded();
}
