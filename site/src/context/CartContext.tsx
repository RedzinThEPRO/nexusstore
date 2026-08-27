import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, Product, ProductVariant } from '@/types';
import { getCart, saveCart } from '@/lib/api';
import { useAuth } from './AuthContext';

export function cartItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function itemKey(item: CartItem): string {
  return cartItemKey(item.product.id, item.variant_id);
}

export function itemUnitPrice(item: CartItem): number {
  const variant = item.variant_id
    ? item.product.variants?.find(v => v.id === item.variant_id)
    : undefined;
  if (variant) {
    return variant.promo_price && variant.promo_price > 0 && variant.promo_price < variant.price
      ? variant.promo_price : variant.price;
  }
  return item.product.promo_price ?? item.product.price;
}

export function itemStock(item: CartItem): number {
  const variant = item.variant_id
    ? item.product.variants?.find(v => v.id === item.variant_id)
    : undefined;
  return variant ? variant.stock : item.product.stock;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number, freeFireId?: string, variant?: ProductVariant) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  setFreeFireId: (key: string, ffid: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? 'guest';
  const [items, setItems] = useState<CartItem[]>(() => getCart(userId));

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(userId, next);
  }, [userId]);

  const add: CartContextValue['add'] = (product, qty = 1, freeFireId, variant) => {
    const key = cartItemKey(product.id, variant?.id);
    const existing = items.find(i => itemKey(i) === key);
    if (existing) {
      persist(items.map(i => itemKey(i) === key
        ? { ...i, product, quantity: i.quantity + qty, free_fire_id: freeFireId ?? i.free_fire_id } : i));
    } else {
      persist([...items, {
        product, quantity: qty, free_fire_id: freeFireId,
        variant_id: variant?.id, variant_name: variant?.name,
      }]);
    }
  };

  const remove: CartContextValue['remove'] = (key) => {
    persist(items.filter(i => itemKey(i) !== key));
  };

  const setQty: CartContextValue['setQty'] = (key, qty) => {
    if (qty <= 0) return remove(key);
    persist(items.map(i => itemKey(i) === key ? { ...i, quantity: qty } : i));
  };

  const setFreeFireId: CartContextValue['setFreeFireId'] = (key, ffid) => {
    persist(items.map(i => itemKey(i) === key ? { ...i, free_fire_id: ffid } : i));
  };

  const clear = () => persist([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + itemUnitPrice(i) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, add, remove, setQty, setFreeFireId, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
