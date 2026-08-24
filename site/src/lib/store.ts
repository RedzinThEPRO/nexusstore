import type {
  Profile, Category, Product, Order, Delivery, ChatMessage,
  Review, Notification, Coupon, AuditLog, CartItem,
} from '@/types';

// ---- Local persistent store (demo mode) ----
// Uses localStorage so data survives reloads without a live database.
// Swap with Supabase later by replacing the functions in /lib/api.ts.

const KEYS = {
  profiles: 'nx_profiles',
  session: 'nx_session',
  categories: 'nx_categories',
  products: 'nx_products',
  carts: 'nx_carts',
  orders: 'nx_orders',
  deliveries: 'nx_deliveries',
  messages: 'nx_messages',
  reviews: 'nx_reviews',
  notifications: 'nx_notifications',
  coupons: 'nx_coupons',
  audit: 'nx_audit',
  terms: 'nx_terms',
  seeded: 'nx_seeded_v1',
};

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export const STORE_KEYS = KEYS;

// ---- Seed data ----
export function seedIfEmpty(): void {
  if (read(KEYS.seeded, false)) return;

  const now = new Date().toISOString();

  // Never seed users or credentials in the browser. Authentication is owned by Supabase Auth.
  write(KEYS.profiles, [] as Profile[]);
  write('nx_creds', []);

  // Categories (empty by default per user request — they create their own)
  write(KEYS.categories, [] as Category[]);

  // No products by default per user request
  write(KEYS.products, [] as Product[]);

  write(KEYS.carts, {} as Record<string, CartItem[]>);
  write(KEYS.orders, [] as Order[]);
  write(KEYS.deliveries, [] as Delivery[]);
  write(KEYS.messages, [] as ChatMessage[]);
  write(KEYS.reviews, [] as Review[]);
  write(KEYS.notifications, [] as Notification[]);

  // Coupons are server-managed and must never be seeded into public browser storage.
  write(KEYS.coupons, [] as Coupon[]);

  write(KEYS.audit, [] as AuditLog[]);

  // Default terms content
  write(KEYS.terms, {
    title: 'Termos de Privacidade e Segurança',
    content: 'Bem-vindo aos Termos de Privacidade e Segurança da NexusStore.\n\nEste documento será atualizado pelo administrador do sistema. Ao realizar uma compra em nossa loja, você concorda com os termos descritos abaixo.\n\n1. Coleta de Dados\nColetamos apenas os dados necessários para processar seu pedido: nome, e-mail, CPF, data de nascimento e ID do Free Fire (quando aplicável).\n\n2. Uso dos Dados\nSeus dados são utilizados exclusivamente para processamento de pedidos, entregas e comunicação relacionada à compra.\n\n3. Segurança\nUtilizamos criptografia e protocolos seguros para proteger suas informações. Não compartilhamos seus dados com terceiros sem consentimento.\n\n4. Pagamentos\nOs pagamentos são processados via PIX com confirmação automática. Não armazenamos dados bancários.\n\n5. Entregas\nAs entregas são realizadas em até 12 horas após a confirmação do pagamento, através do chat privado de cada pedido.\n\n6. Idade Mínima\nApenas usuários com 16 anos ou mais podem realizar compras.\n\n7. Contato\nPara dúvidas sobre estes termos, utilize o chat de suporte.',
    updated_at: now,
  });

  write(KEYS.seeded, true);
}

// ---- Helpers ----
export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
