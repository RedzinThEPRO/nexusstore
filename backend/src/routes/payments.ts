import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { requireUser, type AuthenticatedRequest } from "../middleware/auth.js";
import { EvoPayService, EvoPayError } from "../services/evopay.js";

const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const evoPay = new EvoPayService(env.EVOPAY_API_KEY);
const customerSchema = z.object({ name: z.string().trim().min(2).max(120), document: z.string().trim().min(11).max(20), email: z.string().email().max(254) });
const createSchema = z.object({ orderId: z.string().uuid(), customer: customerSchema });
const idSchema = z.string().min(1).max(200).regex(/^[A-Za-z0-9._:-]+$/);

router.post("/pix", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const { data: order, error: orderError } = await db.from("orders").select("id,user_id,total,status,payment_status").eq("id", input.orderId).eq("user_id", req.userId!).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.status !== "PENDING" || order.payment_status !== "PENDING") return res.status(409).json({ error: "Order is not payable" });
    const { data: existing } = await db.from("payments").select("id,provider_id,pix_code,pix_qr,amount,status").eq("order_id", order.id).in("status", ["PENDING", "PAID"]).maybeSingle();
    if (existing) return res.json({ orderId: order.id, paymentId: existing.id, providerId: existing.provider_id, amount: existing.amount, pixCode: existing.pix_code, pixQr: existing.pix_qr, status: existing.status });

    const charge = await evoPay.createPixCharge({ amount: Number(order.total), callbackUrl: env.BACKEND_PUBLIC_URL + "/webhooks/evopay", payerName: input.customer.name, payerDocument: input.customer.document, payerEmail: input.customer.email, externalReference: order.id });
    if (!charge.id || !charge.status) return res.status(502).json({ error: "Invalid response from payment gateway" });
    const { data: payment, error: paymentError } = await db.from("payments").insert({ order_id: order.id, amount: Number(order.total), status: "PENDING", provider: "evopay", provider_id: charge.id, external_id: order.id, pix_code: charge.qrCodeText ?? null, pix_qr: charge.qrCodeBase64 ?? charge.qrCodeUrl ?? null, provider_status: charge.status }).select("id").single();
    if (paymentError) throw paymentError;
    return res.status(201).json({ orderId: order.id, paymentId: payment.id, providerId: charge.id, amount: Number(order.total), status: charge.status, pixCode: charge.qrCodeText ?? null, pixQr: charge.qrCodeBase64 ?? charge.qrCodeUrl ?? null });
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request" }); if (error instanceof EvoPayError) return res.status(502).json({ error: "Payment gateway unavailable" }); next(error); }
});

router.get("/pix/:id", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try { const id = idSchema.parse(req.params.id); const transaction = await evoPay.getPixTransaction(id); return res.json({ id: transaction.id, status: transaction.status, amount: transaction.amount, taxAmount: transaction.taxAmount, amountWithTax: transaction.amountWithTax, qrCodeText: transaction.qrCodeText, qrCodeBase64: transaction.qrCodeBase64, qrCodeUrl: transaction.qrCodeUrl }); }
  catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid transaction id" }); if (error instanceof EvoPayError) return res.status(502).json({ error: "Payment gateway unavailable" }); next(error); }
});

export const paymentsRouter = router;
