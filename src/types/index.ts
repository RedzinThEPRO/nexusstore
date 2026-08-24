// Core domain types for the gamer store

export type UserRole = 'USER' | 'SUPER_ADMIN';

export interface Profile {
  id: string;
  username: string;
  email: string;
  free_fire_id?: string;
  first_name?: string;
  last_name?: string;
  cpf?: string;
  birth_date?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  description?: string;
  price: number;
  promo_price?: number;
  stock: number;
  images?: string[];
  delivery_info?: string;
  active: boolean;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  promo_price?: number;
  category_id: string;
  game: string;
  stock: number;
  sku: string;
  inventory_mode?: 'SINGLE' | 'MULTIPLE';
  variants?: ProductVariant[];
  status: 'ACTIVE' | 'INACTIVE';
  type: 'DIGITAL' | 'PHYSICAL' | 'SERVICE';
  requires_free_fire_id: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  free_fire_id?: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUSED' | 'CANCELLED' | 'REFUNDED' | 'DELIVERED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUSED' | 'CANCELLED' | 'REFUNDED';
export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  free_fire_id?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupon_code?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  delivery_id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  content: string;
  created_at: string;
  read: boolean;
}

export interface Delivery {
  id: string;
  order_id: string;
  user_id: string;
  product_name: string;
  product_image: string;
  status: DeliveryStatus;
  admin_id?: string;
  free_fire_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  username: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'message' | 'delivery' | 'system';
  title: string;
  message: string;
  order_id?: string;
  chat_id?: string;
  read: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  min_order?: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: UserRole;
  action: string;
  target?: string;
  details?: string;
  created_at: string;
}
