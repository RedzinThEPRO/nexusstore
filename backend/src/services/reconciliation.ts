export const RECONCILIATION_MAX_ATTEMPTS = 3;
export const RECONCILIATION_MIN_INTERVAL_MS = 5 * 60 * 1000;
export const RECONCILIATION_MIN_AGE_MS = 5 * 60 * 1000;
export function canReconcile(createdAt: string, attemptTimes: string[], now = Date.now()) { if (now - Date.parse(createdAt) < RECONCILIATION_MIN_AGE_MS) return false; if (attemptTimes.length >= RECONCILIATION_MAX_ATTEMPTS) return false; const latest = attemptTimes.map(Date.parse).filter(Number.isFinite).sort((a,b)=>b-a)[0]; return latest === undefined || now - latest >= RECONCILIATION_MIN_INTERVAL_MS; }
