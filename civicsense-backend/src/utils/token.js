export function generateToken() {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `CVX-2026-${n}`;
}
