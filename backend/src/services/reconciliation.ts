export const RECONCILIATION_MAX_ATTEMPTS = 3;
export const RECONCILIATION_MIN_INTERVAL_MS = 5 * 60 * 1000;
export const RECONCILIATION_MIN_AGE_MS = 5 * 60 * 1000;
export type ReconciliationPayment = { provider_id: string; amount: number | string };
export type ProviderTransaction = { id: string; amount: number; status: string; type?: string };
export type ConfirmationCheck = { ok: true } | { ok: false; reason: "NOT_FOUND" | "TRANSACTION_MISMATCH" | "AMOUNT_MISMATCH" | "TYPE_MISMATCH" | "STATUS_NOT_COMPLETED" };
export function canReconcile(createdAt: string, attemptTimes: string[], now = Date.now()) {
  if (now - Date.parse(createdAt) < RECONCILIATION_MIN_AGE_MS) return false;
  if (attemptTimes.length >= RECONCILIATION_MAX_ATTEMPTS) return false;
  const latest = attemptTimes.map(Date.parse).filter(Number.isFinite).sort((a, b) => b - a)[0];
  return latest === undefined || now - latest >= RECONCILIATION_MIN_INTERVAL_MS;
}
export function validateCompletedTransaction(payment: ReconciliationPayment | null, provider: ProviderTransaction | null): ConfirmationCheck {
  if (!payment || !provider) return { ok: false, reason: "NOT_FOUND" };
  if (provider.id !== payment.provider_id) return { ok: false, reason: "TRANSACTION_MISMATCH" };
  if (Math.round(provider.amount * 100) !== Math.round(Number(payment.amount) * 100)) return { ok: false, reason: "AMOUNT_MISMATCH" };
  if (provider.type && provider.type !== "DEPOSIT") return { ok: false, reason: "TYPE_MISMATCH" };
  if (provider.status !== "COMPLETED") return { ok: false, reason: "STATUS_NOT_COMPLETED" };
  return { ok: true };
}
