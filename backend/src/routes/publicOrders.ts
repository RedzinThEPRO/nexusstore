import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { cpfDigits, createOrderSchema, toRpcItems, translateRpcError, validateCPF } from "../services/checkout-validation.js";

const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const limiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post('/orders', limiter, async (req, res) => {
  try {
    const input = createOrderSchema.parse(req.body);

    // normalize
    input.customer.email = input.customer.email.trim().toLowerCase();
    input.customer.cpf = cpfDigits(input.customer.cpf);
    input.customer.phone = input.customer.phone.replace(/\D/g, '');

    if (!validateCPF(input.customer.cpf)) return res.status(400).json({ error: 'CPF inválido.' });

    // upsert profile (guest) by email
    const { data: existingProfile } = await db.from('profiles').select('*').eq('email', input.customer.email).maybeSingle();
    let profileId = existingProfile?.id;
    if (!profileId) {
      const newProfileId = crypto?.randomUUID?.() ?? (Math.random().toString(36).slice(2, 10) + Date.now().toString(36));
      const { data: inserted } = await db.from('profiles').insert({ id: newProfileId, username: input.customer.email.split('@')[0], email: input.customer.email, first_name: input.customer.fullName, cpf: input.customer.cpf, birth_date: input.customer.birthDate }).select().single();
      profileId = inserted?.id;
    } else {
      await db.from('profiles').update({ first_name: input.customer.fullName, cpf: input.customer.cpf, birth_date: input.customer.birthDate }).eq('id', profileId);
    }

    // Prepare items for RPC: only identifiers and quantity. Price, stock, variant validity
    // and Free Fire ID requirements are resolved and enforced inside the RPC (database).

    const rpcItems = toRpcItems(input);

    // Call the RPC to create the order atomically
    const { data: rpcResult, error: rpcError } = await db.rpc('create_order_public', { p_user_id: profileId, p_items: JSON.stringify(rpcItems), p_coupon_code: input.coupon_code ?? null });
    if (rpcError) {
      console.error('RPC create_order_public error', rpcError);
      return res.status(400).json({ error: translateRpcError(rpcError.message) });
    }

    const orderId = rpcResult?.order_id ?? rpcResult?.orderId ?? null;
    const total = rpcResult?.total ?? null;
    if (!orderId) return res.status(500).json({ error: 'Pedido criado, mas sem ID retornado.' });

    return res.status(201).json({ orderId, total });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Payload inválido' });
    console.error('publicOrders error', error);
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

export const publicOrdersRouter = router;
