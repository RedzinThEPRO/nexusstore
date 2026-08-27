import { z } from "zod";

export const cpfDigits = (raw: string) => raw.replace(/\D/g, '');

export function validateCPF(raw: string): boolean {
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

export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  cpf: z.string().trim().min(11).max(11),
  birthDate: z.string().refine((v) => !isNaN(Date.parse(v)) && new Date(v) <= new Date(), { message: 'Invalid birth date' }),
  email: z.string().email().max(254),
  phone: z.string().trim().min(8).max(15),
  freeFireId: z.string().trim().optional(),
}).strict();

/**
 * Only identifiers and quantity are accepted from the browser. Price, stock and
 * variant validity are resolved server-side by the database RPC.
 */
export const itemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().trim().min(1).max(100).optional().nullable(),
  quantity: z.number().int().min(1).max(100),
}).strict();

export const createOrderSchema = z.object({
  customer: customerSchema,
  items: z.array(itemSchema).min(1).max(50),
  coupon_code: z.string().trim().max(50).optional().nullable(),
}).strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export function toRpcItems(input: CreateOrderInput) {
  return input.items.map(i => ({
    product_id: i.product_id,
    variant_id: i.variant_id ?? null,
    quantity: i.quantity,
    free_fire_id: input.customer.freeFireId ?? null,
  }));
}

const RPC_ERROR_MESSAGES: Record<string, string> = {
  'invalid checkout': 'Pedido inválido.',
  'invalid quantity': 'Quantidade inválida.',
  'product unavailable': 'Produto indisponível ou sem estoque suficiente.',
  'variant required': 'Selecione uma opção do produto antes de continuar.',
  'variant unavailable': 'Opção indisponível ou sem estoque suficiente.',
  'variant not allowed': 'Este produto não possui opções selecionáveis.',
  'free fire id required': 'Informe o ID do Free Fire para este produto.',
  'invalid coupon': 'Cupom inválido.',
  'stock changed, retry checkout': 'O estoque mudou durante a compra. Tente novamente.',
};

export function translateRpcError(message?: string): string {
  if (!message) return 'Não foi possível criar o pedido.';
  const key = Object.keys(RPC_ERROR_MESSAGES).find(k => message.includes(k));
  return key ? RPC_ERROR_MESSAGES[key] : 'Não foi possível criar o pedido.';
}
