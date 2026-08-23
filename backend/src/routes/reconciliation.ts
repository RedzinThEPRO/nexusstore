import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { requireAdmin, type AuthenticatedRequest } from "../middleware/auth.js";
import { EvoPayService } from "../services/evopay.js";
import { canReconcile, validateCompletedTransaction, RECONCILIATION_MAX_ATTEMPTS, RECONCILIATION_MIN_INTERVAL_MS } from "../services/reconciliation.js";
const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const evoPay = new EvoPayService(env.EVOPAY_API_KEY);
router.post("/api/payments/reconcile", requireAdmin, async (_req: AuthenticatedRequest, res) => {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: payments, error } = await db.from("payments").select("id,order_id,provider_id,amount,status,created_at").eq("status", "PENDING").not("provider_id", "is", null).lt("created_at", cutoff).limit(20);
  if (error) { console.error("Payment reconciliation lookup failed"); return res.status(202).json({ processed: 0 }); }
  let processed = 0;
  for (const payment of payments ?? []) {
    // Atomic claim in PostgreSQL prevents duplicate provider queries across workers.
    const { data: claimed, error: claimError } = await db.rpc("claim_payment_reconciliation", { p_payment_id: payment.id, p_min_interval: RECONCILIATION_MIN_INTERVAL_MS + " milliseconds", p_max_attempts: RECONCILIATION_MAX_ATTEMPTS });
    if (claimError || claimed !== true) continue;
    try {
      // Reconciliation only reads the provider; it never creates a new charge.
      const provider = await evoPay.getPixTransaction(payment.provider_id);
      const check = validateCompletedTransaction(payment, provider);
      if (!check.ok) {
        await db.from("payment_events").insert({ payment_id: payment.id, event_type: "RECONCILIATION_REJECTED", provider_event_id: "reconcile-result:" + payment.id + ":" + Date.now(), payload: { source: "reconciliation", reason: check.reason, provider_status: provider.status, provider_type: provider.type ?? null }, signature_valid: false });
        continue;
      }
      const { data: confirmed, error: rpcError } = await db.rpc("mark_payment_paid_secure", { p_payment_id: payment.id, p_order_id: payment.order_id, p_paid_at: new Date().toISOString() });
      if (!rpcError && confirmed === true) processed++;
    } catch {
      console.error("Payment reconciliation provider request failed");
    }
  }
  return res.status(200).json({ processed });
});
export const reconciliationRouter = router;
