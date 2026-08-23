import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { requireUser, type AuthenticatedRequest } from "../middleware/auth.js";
import { EvoPayService, EvoPayError } from "../services/evopay.js";

const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const evoPay = new EvoPayService(env.EVOPAY_API_KEY);
const customerSchema = z.object({ name: z.string().trim().min(2).max(120), document: z.string().trim().min(11).max(20), email: z.string().email().max(254) }).strict();
const createSchema = z.object({ orderId: z.string().uuid(), customer: customerSchema }).strict();
const idSchema = z.string().min(1).max(200).regex(/^[A-Za-z0-9._:-]+$/);
const cents = (value: unknown) => { const number = typeof value === "number" ? value : Number(value); if (!Number.isFinite(number) || number <= 0) throw new Error("Invalid monetary value"); return Math.round(number * 100); };
const paymentResponse = (orderId: string, payment: Record<string, unknown>) => ({ orderId, paymentId: payment.id, providerId: payment.provider_id, amount: payment.amount, pixCode: payment.pix_code, pixQr: payment.pix_qr, status: payment.status });

router.post("/pix", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const { data: order, error: orderError } = await db.from("orders").select("id,user_id,total,status,payment_status").eq("id", input.orderId).eq("user_id", req.userId!).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.status !== "PENDING" || order.payment_status !== "PENDING") return res.status(409).json({ error: "Order is not payable" });
    const expectedAmount = cents(order.total);

    const { data: existing, error: existingError } = await db.from("payments").select("id,provider_id,pix_code,pix_qr,amount,status").eq("order_id", order.id).in("status", ["PENDING", "PAID"]).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return res.json(paymentResponse(order.id, existing));

    // This reservation must be protected by the partial unique index documented below.
    const { data: reservation, error: reservationError } = await db.from("payments").insert({ order_id: order.id, amount: expectedAmount / 100, status: "PENDING", provider: "evopay", external_id: order.id }).select("id,provider_id,pix_code,pix_qr,amount,status").single();
    if (reservationError) {
      if (reservationError.code === "23505") return res.status(409).json({ error: "Payment creation already in progress" });
      throw reservationError;
    }

    const charge = await evoPay.createPixCharge({ amount: expectedAmount / 100, callbackUrl: env.BACKEND_PUBLIC_URL + "/webhooks/evopay", payerName: input.customer.name, payerDocument: input.customer.document, payerEmail: input.customer.email, externalReference: order.id });
    if (cents(charge.amount) !== expectedAmount) return res.status(502).json({ error: "Payment gateway amount mismatch" });
    const { data: payment, error: paymentError } = await db.from("payments").update({ provider_id: charge.id, pix_code: charge.qrCodeText ?? null, pix_qr: charge.qrCodeBase64 ?? charge.qrCodeUrl ?? null, provider_status: charge.status }).eq("id", reservation.id).eq("status", "PENDING").select("id,provider_id,pix_code,pix_qr,amount,status").single();
    if (paymentError) throw paymentError;
    return res.status(201).json(paymentResponse(order.id, payment));
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request" }); if (error instanceof EvoPayError) return res.status(502).json({ error: "Payment gateway unavailable" }); if (error instanceof Error && error.message === "Invalid monetary value") return res.status(502).json({ error: "Invalid payment amount" }); next(error); }
});

router.get("/pix/:id", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const { data: payment, error: paymentError } = await db.from("payments").select("id,order_id,provider_id").eq("provider_id", id).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    const { data: order, error: orderError } = await db.from("orders").select("id,user_id").eq("id", payment.order_id).eq("user_id", req.userId!).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return res.status(404).json({ error: "Payment not found" });
    const transaction = await evoPay.getPixTransaction(id);
    return res.json({ id: transaction.id, status: transaction.status, amount: transaction.amount, taxAmount: transaction.taxAmount, amountWithTax: transaction.amountWithTax, qrCodeText: transaction.qrCodeText, qrCodeBase64: transaction.qrCodeBase64, qrCodeUrl: transaction.qrCodeUrl });
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid transaction id" }); if (error instanceof EvoPayError) return res.status(502).json({ error: "Payment gateway unavailable" }); next(error); }
});

export const paymentsRouter = router;
