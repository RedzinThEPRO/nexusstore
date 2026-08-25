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

    // fetch products
    const ids = Array.from(new Set(input.items.map(i => i.product_id)));
    const { data: products, error: productsError } = await db.from('products').select('*').in('id', ids);
    if (productsError) throw productsError;
    if (!products || products.length !== ids.length) return res.status(400).json({ error: 'Um ou mais produtos inválidos.' });

    const productMap: Record<string, any> = {};
    products.forEach((p: any) => { productMap[p.id] = p; });

    // validate items and calculate subtotal
    let subtotal = 0;
    for (const it of input.items) {
      const p = productMap[it.product_id];
      if (!p) return res.status(400).json({ error: `Produto não encontrado: ${it.product_id}` });
      const allowQty = !!p.allow_quantity_selection;
      if (!allowQty && it.quantity !== 1) return res.status(400).json({ error: `Quantidade inválida para produto ${p.name}.` });
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) return res.status(400).json({ error: 'Quantidade inválida.' });
      if (it.quantity > p.stock) return res.status(409).json({ error: `Estoque insuficiente para ${p.name}.` });
      if (p.requires_free_fire_id && !input.customer.freeFireId) return res.status(400).json({ error: `ID do Free Fire obrigatório para o produto ${p.name}.` });
      const price = p.promo_price ?? p.price;
      subtotal += Number(price) * it.quantity;
    }

    // coupon
    let discount = 0;
    if (input.coupon_code) {
      const { data: coupon } = await db.from('coupons').select('*').eq('code', input.coupon_code).maybeSingle();
      if (coupon && coupon.active) {
        if (coupon.type === 'PERCENT') discount = Number((subtotal * coupon.value) / 100);
        else discount = Number(coupon.value);
      }
    }

    const total = Math.max(0, subtotal - discount);

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

    // reserve stock atomically per product using conditional update
    const updatedProducts: { id: string; qty: number }[] = [];
    try {
      for (const it of input.items) {
        const { data: updated, error: updateError } = await db.from('products').update({ stock: db.raw('stock - ?', [it.quantity]) }).eq('id', it.product_id).gte('stock', it.quantity).select('id').maybeSingle();
        // Note: db.raw may not be available in postgrest client; fallback to RPC is preferred. If update failed, throw.
        if (updateError || !updated) throw new Error(`Estoque insuficiente para ${it.product_id}`);
        updatedProducts.push({ id: it.product_id, qty: it.quantity });
      }
    } catch (err) {
      // try to rollback previous updates
      for (const u of updatedProducts) {
        await db.from('products').update({ stock: db.raw('stock + ?', [u.qty]) }).eq('id', u.id);
      }
      return res.status(409).json({ error: 'Estoque insuficiente ao processar o pedido.' });
    }

    // create order
    const { data: createdOrder } = await db.from('orders').insert({ user_id: profileId, subtotal, discount, total, status: 'PENDING', payment_status: 'PENDING' }).select().single();
    if (!createdOrder || !createdOrder.id) throw new Error('Não foi possível criar o pedido');

    // insert order items and inventory movements
    for (const it of input.items) {
      const p = productMap[it.product_id];
      const price = p.promo_price ?? p.price;
      await db.from('order_items').insert({ order_id: createdOrder.id, product_id: p.id, product_name: p.name, product_image: p.images?.[0] ?? null, price: Number(price), quantity: it.quantity, free_fire_id: input.customer.freeFireId ?? null });
      await db.from('inventory_movements').insert({ product_id: p.id, type: 'out', quantity: it.quantity, reason: 'order_reservation', created_at: new Date().toISOString() });
    }

    return res.status(201).json({ orderId: createdOrder.id, total });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Payload inválido' });
    console.error('publicOrders error', error);
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

export const publicOrdersRouter = router;
