import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { getCart, saveCart } from '@/lib/api';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number, freeFireId?: string) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  setFreeFireId: (productId: string, ffid: string) => void;
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

  const add: CartContextValue['add'] = (product, qty = 1, freeFireId) => {
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      persist(items.map(i => i.product.id === product.id
        ? { ...i, quantity: i.quantity + qty, free_fire_id: freeFireId ?? i.free_fire_id } : i));
    } else {
      persist([...items, { product, quantity: qty, free_fire_id: freeFireId }]);
    }
  };

  const remove: CartContextValue['remove'] = (productId) => {
    persist(items.filter(i => i.product.id !== productId));
  };

  const setQty: CartContextValue['setQty'] = (productId, qty) => {
    if (qty <= 0) return remove(productId);
    persist(items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const setFreeFireId: CartContextValue['setFreeFireId'] = (productId, ffid) => {
    persist(items.map(i => i.product.id === productId ? { ...i, free_fire_id: ffid } : i));
  };

  const clear = () => persist([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (i.product.promo_price ?? i.product.price) * i.quantity, 0);

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
