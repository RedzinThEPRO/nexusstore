import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { EvoPayError, EvoPayService } from "../services/evopay.js";
import { evoPayWebhookSchema, eventKey, mapPaymentStatus } from "../services/evopay-webhook.js";
const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const evoPay = new EvoPayService(env.EVOPAY_API_KEY);
const cents = (value: unknown) => { const number = typeof value === "number" ? value : Number(value); if (!Number.isFinite(number) || number <= 0) throw new Error("Invalid monetary value"); return Math.round(number * 100); };
router.post("/webhooks/evopay", async (req, res) => {
  const parsed = evoPayWebhookSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Invalid EvoPay webhook payload" });
  const event = parsed.data; const key = eventKey(event);
  const { data: payment, error: paymentError } = await db.from("payments").select("id,order_id,provider_id,amount,status").eq("provider_id", event.id).maybeSingle();
  if (paymentError) { console.error("EvoPay webhook payment lookup failed", { transactionId: event.id, status: event.status }); return res.status(202).json({ received: true, processed: false }); }
  let eventType = event.status; if (payment && cents(payment.amount) !== cents(event.amount)) eventType = "AMOUNT_MISMATCH";
  const { error: eventError } = await db.from("payment_events").insert({ payment_id: payment?.id ?? null, event_type: eventType, provider_event_id: key, payload: event });
  if (eventError?.code === "23505") return res.status(200).json({ received: true, duplicate: true });
  if (eventError) { console.error("EvoPay webhook event persistence failed", { transactionId: event.id, status: event.status }); return res.status(202).json({ received: true, processed: false }); }
  if (!payment) return res.status(200).json({ received: true, matched: false });
  if (eventType === "AMOUNT_MISMATCH") { console.error("EvoPay reconciliation error: amount mismatch", { transactionId: event.id, orderId: payment.order_id }); return res.status(200).json({ received: true, matched: true, processed: false }); }
  if (payment.status === "PAID") return res.status(200).json({ received: true, duplicate: true, alreadyPaid: true });
  if (event.status === "COMPLETED") {
    let confirmed; try { confirmed = await evoPay.getPixTransaction(event.id); } catch (error) { console.error("EvoPay confirmation unavailable", { transactionId: event.id, error: error instanceof EvoPayError ? error.status : "unknown" }); return res.status(202).json({ received: true, matched: true, processed: false }); }
    if (confirmed.id !== event.id || (confirmed.type && confirmed.type !== "DEPOSIT") || confirmed.status !== "COMPLETED" || cents(confirmed.amount) !== cents(payment.amount)) { console.error("EvoPay reconciliation error: confirmation mismatch", { transactionId: event.id, orderId: payment.order_id, confirmedStatus: confirmed.status }); return res.status(200).json({ received: true, matched: true, processed: false }); }
    const { data: confirmedPayment, error: rpcError } = await db.rpc("mark_payment_paid_secure", { p_payment_id: payment.id, p_order_id: payment.order_id, p_paid_at: new Date().toISOString() });
    if (rpcError || confirmedPayment !== true) { console.error("EvoPay atomic payment confirmation failed", { transactionId: event.id, orderId: payment.order_id }); return res.status(202).json({ received: true, matched: true, processed: false }); }
  } else {
    const { error } = await db.from("payments").update({ status: mapPaymentStatus(event.status), provider_status: event.status }).eq("id", payment.id).eq("status", "PENDING");
    if (error) { console.error("EvoPay status update failed", { transactionId: event.id, orderId: payment.order_id }); return res.status(202).json({ received: true, matched: true, processed: false }); }
  }
  return res.status(200).json({ received: true, matched: true, processed: true });
});
export const webhooksRouter = router;
