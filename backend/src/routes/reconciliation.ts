import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { requireAdmin, type AuthenticatedRequest } from "../middleware/auth.js";
import { EvoPayService } from "../services/evopay.js";
import { canReconcile } from "../services/reconciliation.js";
const router = Router(); const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }); const evoPay = new EvoPayService(env.EVOPAY_API_KEY);
router.post("/api/payments/reconcile", requireAdmin, async (_req: AuthenticatedRequest, res) => {
  const { data: payments, error } = await db.from("payments").select("id,order_id,provider_id,amount,status,created_at").eq("status", "PENDING").not("provider_id", "is", null).lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()).limit(20);
  if (error) { console.error("Payment reconciliation lookup failed"); return res.status(202).json({ processed: 0 }); }
  let processed = 0;
  for (const payment of payments ?? []) {
    const { data: attempts } = await db.from("payment_events").select("created_at").eq("payment_id", payment.id).like("provider_event_id", "reconcile:" + payment.id + ":%").order("created_at", { ascending: false }).limit(3);
    if (!canReconcile(payment.created_at, (attempts ?? []).map((a) => a.created_at))) continue;
    const attemptId = "reconcile:" + payment.id + ":" + Date.now();
    const { error: attemptError } = await db.from("payment_events").insert({ payment_id: payment.id, event_type: "RECONCILIATION_ATTEMPT", provider_event_id: attemptId, payload: { source: "reconciliation", transactionId: payment.provider_id } });
    if (attemptError) continue;
    try {
      const confirmed = await evoPay.getPixTransaction(payment.provider_id);
      const sameAmount = Math.round(confirmed.amount * 100) === Math.round(Number(payment.amount) * 100);
      if (confirmed.id !== payment.provider_id || (confirmed.type && confirmed.type !== "DEPOSIT") || confirmed.status !== "COMPLETED" || !sameAmount) continue;
      const { error: rpcError } = await db.rpc("mark_payment_paid_secure", { p_payment_id: payment.id, p_order_id: payment.order_id, p_paid_at: new Date().toISOString() });
      if (!rpcError) processed++;
    } catch { console.error("Payment reconciliation provider request failed", { transactionId: payment.provider_id, orderId: payment.order_id }); }
  }
  return res.status(200).json({ processed });
});
export const reconciliationRouter = router;
