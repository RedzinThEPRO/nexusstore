import { read, write, uid, slugify, STORE_KEYS } from './store';
import type {
  Profile, Category, Product, Order, Delivery, ChatMessage,
  Review, Notification, Coupon, CartItem, AuditLog,
} from '@/types';

// ---- Profiles ----
export function getProfiles(): Profile[] { return read(STORE_KEYS.profiles, []); }
export function saveProfiles(p: Profile[]): void { write(STORE_KEYS.profiles, p); }
export function getProfileByEmail(email: string): Profile | undefined {
  return getProfiles().find(p => p.email.toLowerCase() === email.toLowerCase());
}
export function getProfileById(id: string): Profile | undefined {
  return getProfiles().find(p => p.id === id);
}
export function updateProfile(id: string, patch: Partial<Profile>): Profile | undefined {
  const list = getProfiles();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return undefined;
  list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
  saveProfiles(list);
  return list[idx];
}

// ---- Credentials (demo only) ----
interface Cred { id: string; email: string; password: string; }
export function getCreds(): Cred[] { return read('nx_creds', []); }
export function saveCreds(c: Cred[]): void { write('nx_creds', c); }
export function verifyCred(email: string, password: string): Cred | undefined {
  return getCreds().find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
}
export function addCred(id: string, email: string, password: string): void {
  const creds = getCreds();
  creds.push({ id, email, password });
  saveCreds(creds);
}

// ---- Session ----
export function getSession(): string | null { return read<string | null>(STORE_KEYS.session, null); }
export function setSession(id: string | null): void { write(STORE_KEYS.session, id); }

// ---- Categories ----
export function getCategories(): Category[] { return read(STORE_KEYS.categories, []); }
export function saveCategories(c: Category[]): void { write(STORE_KEYS.categories, c); }
export function createCategory(name: string, description?: string): Category {
  const cats = getCategories();
  const cat: Category = {
    id: uid('cat'), name, slug: slugify(name), description,
    created_at: new Date().toISOString(),
  };
  cats.push(cat); saveCategories(cats);
  return cat;
}
export function deleteCategory(id: string): void {
  saveCategories(getCategories().filter(c => c.id !== id));
}

// ---- Products ----
export function getProducts(): Product[] { return read(STORE_KEYS.products, []); }
export function saveProducts(p: Product[]): void { write(STORE_KEYS.products, p); }
export function getProductById(id: string): Product | undefined {
  return getProducts().find(p => p.id === id);
}
export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find(p => p.slug === slug);
}
export function createProduct(data: Omit<Product, 'id' | 'slug' | 'created_at' | 'updated_at'>): Product {
  const list = getProducts();
  const now = new Date().toISOString();
  const prod: Product = {
    ...data, id: uid('prod'), slug: slugify(data.name) + '-' + Math.random().toString(36).slice(2, 5),
    created_at: now, updated_at: now,
  };
  list.push(prod); saveProducts(list);
  return prod;
}
export function updateProduct(id: string, patch: Partial<Product>): Product | undefined {
  const list = getProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return undefined;
  list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
  saveProducts(list);
  return list[idx];
}
export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter(p => p.id !== id));
}

// ---- Cart ----
export function getCart(userId: string): CartItem[] {
  const carts = read<Record<string, CartItem[]>>(STORE_KEYS.carts, {});
  return carts[userId] ?? [];
}
export function saveCart(userId: string, items: CartItem[]): void {
  const carts = read<Record<string, CartItem[]>>(STORE_KEYS.carts, {});
  carts[userId] = items;
  write(STORE_KEYS.carts, carts);
}

// ---- Orders ----
export function getOrders(): Order[] { return read(STORE_KEYS.orders, []); }
export function saveOrders(o: Order[]): void { write(STORE_KEYS.orders, o); }
export function getOrderById(id: string): Order | undefined {
  return getOrders().find(o => o.id === id);
}
export function getOrdersByUser(userId: string): Order[] {
  return getOrders().filter(o => o.user_id === userId);
}
export function createOrder(o: Order): void {
  const list = getOrders(); list.push(o); saveOrders(list);
}
export function updateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const list = getOrders();
  const idx = list.findIndex(o => o.id === id);
  if (idx < 0) return undefined;
  list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
  saveOrders(list);
  return list[idx];
}

// ---- Deliveries ----
export function getDeliveries(): Delivery[] { return read(STORE_KEYS.deliveries, []); }
export function saveDeliveries(d: Delivery[]): void { write(STORE_KEYS.deliveries, d); }
export function getDeliveryById(id: string): Delivery | undefined {
  return getDeliveries().find(d => d.id === id);
}
export function getDeliveryByOrder(orderId: string): Delivery | undefined {
  return getDeliveries().find(d => d.order_id === orderId);
}
export function getDeliveriesByUser(userId: string): Delivery[] {
  return getDeliveries().filter(d => d.user_id === userId);
}
export function createDelivery(d: Delivery): void {
  const list = getDeliveries(); list.push(d); saveDeliveries(list);
}
export function updateDelivery(id: string, patch: Partial<Delivery>): Delivery | undefined {
  const list = getDeliveries();
  const idx = list.findIndex(d => d.id === id);
  if (idx < 0) return undefined;
  list[idx] = { ...list[idx], ...patch };
  saveDeliveries(list);
  return list[idx];
}

// ---- Chat messages ----
export function getMessages(): ChatMessage[] { return read(STORE_KEYS.messages, []); }
export function saveMessages(m: ChatMessage[]): void { write(STORE_KEYS.messages, m); }
export function getMessagesByDelivery(deliveryId: string): ChatMessage[] {
  return getMessages().filter(m => m.delivery_id === deliveryId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
export function addMessage(m: ChatMessage): void {
  const list = getMessages(); list.push(m); saveMessages(list);
}
export function markMessagesRead(deliveryId: string, role: 'customer' | 'admin'): void {
  const list = getMessages();
  list.forEach(m => {
    if (m.delivery_id === deliveryId && m.sender_role !== role) m.read = true;
  });
  saveMessages(list);
}

// ---- Reviews ----
export function getReviews(): Review[] { return read(STORE_KEYS.reviews, []); }
export function saveReviews(r: Review[]): void { write(STORE_KEYS.reviews, r); }
export function getReviewsByProduct(productId: string): Review[] {
  return getReviews().filter(r => r.product_id === productId);
}
export function addReview(r: Review): void {
  const list = getReviews(); list.push(r); saveReviews(list);
}
export function deleteReview(id: string): void {
  saveReviews(getReviews().filter(r => r.id !== id));
}

// ---- Notifications ----
export function getNotifications(userId: string): Notification[] {
  return read<Notification[]>(STORE_KEYS.notifications, []).filter(n => n.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export function saveNotifications(n: Notification[]): void { write(STORE_KEYS.notifications, n); }
export function addNotification(n: Notification): void {
  const list = read<Notification[]>(STORE_KEYS.notifications, []);
  list.push(n); saveNotifications(list);
}
export function markNotificationRead(id: string): void {
  const list = read<Notification[]>(STORE_KEYS.notifications, []);
  const item = list.find(n => n.id === id);
  if (item) item.read = true;
  saveNotifications(list);
}
export function markAllNotificationsRead(userId: string): void {
  const list = read<Notification[]>(STORE_KEYS.notifications, []);
  list.forEach(n => { if (n.user_id === userId) n.read = true; });
  saveNotifications(list);
}

// ---- Coupons ----
export function getCoupons(): Coupon[] { return read(STORE_KEYS.coupons, []); }
export function saveCoupons(c: Coupon[]): void { write(STORE_KEYS.coupons, c); }
export function getCouponByCode(code: string): Coupon | undefined {
  return getCoupons().find(c => c.code.toLowerCase() === code.toLowerCase() && c.active);
}

// ---- Audit logs ----
export function getAuditLogs(): AuditLog[] {
  return read<AuditLog[]>(STORE_KEYS.audit, []).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export function addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
  const list = read<AuditLog[]>(STORE_KEYS.audit, []);
  list.push({ ...log, id: uid('log'), created_at: new Date().toISOString() });
  write(STORE_KEYS.audit, list);
}

// ---- Terms ----
export interface Terms {
  title: string;
  content: string;
  updated_at: string;
}
export function getTerms(): Terms {
  return read<Terms>(STORE_KEYS.terms, {
    title: 'Termos de Privacidade e Segurança',
    content: 'Termos ainda não definidos.',
    updated_at: new Date().toISOString(),
  });
}
export function saveTerms(title: string, content: string): Terms {
  const terms: Terms = { title, content, updated_at: new Date().toISOString() };
  write(STORE_KEYS.terms, terms);
  return terms;
}
