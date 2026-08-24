import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatBRL } from '@/lib/format';
import { EmptyState, Toast } from '@/components/ui';
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { useState } from 'react';

export function CartPage() {
  const { items, subtotal, remove, setQty, setFreeFireId } = useCart();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const needsFF = items.some(i => i.product.requires_free_fire_id);
  const missingFF = items.filter(i => i.product.requires_free_fire_id && !i.free_fire_id?.trim());

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="Seu carrinho está vazio"
          desc="Explore a loja e adicione produtos para continuar."
          action={<Link to="/loja" className="btn-primary">Ir à loja</Link>} />
      </div>
    );
  }

  const goCheckout = () => {
    if (missingFF.length) {
      setToast('Preencha o ID do Free Fire nos produtos que precisam.');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-3xl font-bold text-white mb-6">Carrinho</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map(item => {
            const price = item.product.promo_price ?? item.product.price;
            return (
              <div key={item.product.id} className="card p-4 flex gap-4">
                <Link to={`/produto/${item.product.slug}`} className="shrink-0">
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-ink-900">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center"><Package className="h-8 w-8 text-ink-500" /></div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/produto/${item.product.slug}`} className="text-sm font-semibold text-white hover:text-neon-300 line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-ink-400 mt-0.5">{item.product.game}</p>
                  <p className="text-neon-300 font-bold text-sm mt-1">{formatBRL(price)}</p>

                  {item.product.requires_free_fire_id && (
                    <div className="mt-2">
                      <input value={item.free_fire_id ?? ''} onChange={e => setFreeFireId(item.product.id, e.target.value)}
                        placeholder="ID do Free Fire" className="input py-1.5 text-xs" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setQty(item.product.id, item.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/5 text-ink-200">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-white text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => setQty(item.product.id, item.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/5 text-ink-200">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => remove(item.product.id)} className="text-danger-400 hover:text-danger-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="text-sm font-semibold text-white mb-4">Resumo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-200">
              <span>Subtotal</span><span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-400">
              <span>Cupom</span><span>Aplicado no checkout</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold">
              <span>Total</span><span>{formatBRL(subtotal)}</span>
            </div>
          </div>
          <button onClick={goCheckout} className="btn-primary w-full mt-5">
            Finalizar Compra <ArrowRight className="h-4 w-4" />
          </button>
          {!user && <p className="text-xs text-ink-400 mt-2 text-center">Você precisa entrar para comprar.</p>}
          {needsFF && <p className="text-xs text-accent-400 mt-2 text-center">ID do Free Fire obrigatório para alguns itens.</p>}
        </div>
      </div>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
