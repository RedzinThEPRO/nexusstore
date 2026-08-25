import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

const router = Router();
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const limiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

const cpfDigits = (raw: string) => raw.replace(/\D/g, '');
function validateCPF(raw: string): boolean {
  const cpf = cpfDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = 11 - (sum % 11); if (d1 >= 10) d1 = 0; if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = 11 - (sum % 11); if (d2 >= 10) d2 = 0; return d2 === parseInt(cpf[10]);
}

const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  cpf: z.string().trim().min(11).max(11),
  birthDate: z.string().refine((v) => !isNaN(Date.parse(v)) && new Date(v) <= new Date(), { message: 'Invalid birth date' }),
  email: z.string().email().max(254),
  phone: z.string().trim().min(8).max(15),
  freeFireId: z.string().trim().optional(),
}).strict();

const itemSchema = z.object({ product_id: z.string().min(1), quantity: z.number().int().min(1) }).strict();
const createOrderSchema = z.object({ customer: customerSchema, items: z.array(itemSchema).min(1), coupon_code: z.string().trim().optional().nullable() }).strict();

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

    // Prepare items for RPC: only product_id and quantity (+ free_fire_id if present)
    const rpcItems = input.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, free_fire_id: (input.customer.freeFireId ?? null) }));

    // Call the RPC to create the order atomically
    const { data: rpcResult, error: rpcError } = await db.rpc('create_order_public', { p_user_id: profileId, p_items: JSON.stringify(rpcItems), p_coupon_code: input.coupon_code ?? null });
    if (rpcError) {
      console.error('RPC create_order_public error', rpcError);
      return res.status(400).json({ error: rpcError.message || 'Não foi possível criar o pedido.' });
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
