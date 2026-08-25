import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { EvoPayService, EvoPayError } from "../services/evopay.js";

const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const evoPay = new EvoPayService(env.EVOPAY_API_KEY);

const limiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

const idSchema = z.string().min(1).max(200).regex(/^[A-Za-z0-9._:-]+$/);
const customerSchema = z.object({ name: z.string().trim().min(2).max(120), document: z.string().trim().min(11).max(20), email: z.string().email().max(254) }).strict();
const createSchema = z.object({ orderId: z.string().uuid(), customer: customerSchema }).strict();

function cents(value: unknown) { const number = typeof value === 'number' ? value : Number(value); if (!Number.isFinite(number) || number <= 0) throw new Error('Invalid monetary value'); return Math.round(number * 100); }

const paymentResponse = (orderId: string, payment: Record<string, any>) => ({ orderId, paymentId: payment.id, providerId: payment.provider_id, amount: payment.amount, pixCode: payment.pix_code ?? null, pixQr: payment.pix_qr ?? null, status: payment.status });

// Public endpoint to create a PIX payment for a guest order. Uses service role.
router.post('/pix', limiter, async (req, res) => {
  try {
    const input = createSchema.parse(req.body);

    // fetch order
    const { data: order, error: orderError } = await db.from('orders').select('id,user_id,total,status,payment_status').eq('id', input.orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.status !== 'PENDING' || order.payment_status !== 'PENDING') return res.status(409).json({ error: 'Order is not payable' });

    // ensure we don't create duplicate payments
    const { data: existing, error: existingError } = await db.from('payments').select('id,provider_id,pix_code,pix_qr,amount,status').eq('order_id', order.id).in('status', ['PENDING', 'PAID']).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return res.json(paymentResponse(order.id, existing));

    // create reservation
    const { data: reservation, error: reservationError } = await db.from('payments').insert({ order_id: order.id, amount: Math.round(order.total * 100) / 100, status: 'PENDING', provider: 'evopay', external_id: null }).select().single();
    if (reservationError) throw reservationError;

    // call evoPay
    const charge = await evoPay.createPixCharge({ amount: order.total, callbackUrl: env.BACKEND_PUBLIC_URL + '/webhooks/evopay', payerName: input.customer.name, payerDocument: input.customer.document, payerEmail: input.customer.email, externalReference: reservation.id });
    if (cents(charge.amount) !== cents(order.total)) return res.status(502).json({ error: 'Payment gateway amount mismatch' });

    const { data: payment, error: paymentError } = await db.from('payments').update({ provider_id: charge.id, pix_code: charge.qrCodeText ?? null, pix_qr: charge.qrCodeBase64 ?? charge.qrCodeUrl ?? null }).eq('id', reservation.id).select().single();
    if (paymentError) throw paymentError;

    return res.status(201).json(paymentResponse(order.id, payment));
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid request' });
    if (error instanceof EvoPayError) return res.status(502).json({ error: 'Payment gateway error' });
    console.error('publicPayments error', error);
    return res.status(500).json({ error: 'Unable to create payment' });
  }
});

// Public GET for payment status (guest polling) - uses provider id
router.get('/pix/:id', limiter, async (req, res) => {
  try {
    const id = idSchema.parse(req.params.id);
    const { data: payment, error: paymentError } = await db.from('payments').select('id,order_id,provider_id,amount,status,pix_code,pix_qr').eq('provider_id', id).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const transaction = await evoPay.getPixTransaction(id);
    return res.json({ id: transaction.id, status: transaction.status, amount: transaction.amount, qrCodeText: transaction.qrCodeText ?? null, qrCodeBase64: transaction.qrCodeBase64 ?? null });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid provider id' });
    if (error instanceof EvoPayError) return res.status(502).json({ error: 'Payment gateway error' });
    console.error('publicPayments GET error', error);
    return res.status(500).json({ error: 'Unable to fetch payment status' });
  }
});

export const publicPaymentsRouter = router;
