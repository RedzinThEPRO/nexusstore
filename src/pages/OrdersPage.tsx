import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getOrdersByUser } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { Package, ChevronRight } from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '@/types';

const statusChip: Record<OrderStatus, string> = {
  PENDING: 'chip-warning', PAID: 'chip-success', DELIVERED: 'chip-success',
  EXPIRED: 'chip-muted', REFUSED: 'chip-danger', CANCELLED: 'chip-muted', REFUNDED: 'chip-warning',
};
const payChip: Record<PaymentStatus, string> = {
  PENDING: 'chip-warning', PAID: 'chip-success', EXPIRED: 'chip-muted',
  REFUSED: 'chip-danger', CANCELLED: 'chip-muted', REFUNDED: 'chip-warning',
};

export function OrdersPage() {
  const { user } = useAuth();
  if (!user) return null;
  const orders = getOrdersByUser(user.id).sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <EmptyState icon={<Package className="h-12 w-12" />} title="Nenhum pedido ainda"
          desc="Quando você fizer compras, seus pedidos aparecerão aqui."
          action={<Link to="/loja" className="btn-primary">Ir à loja</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-3xl font-bold text-white mb-6">Meus Pedidos</h1>

      <div className="space-y-3">
        {orders.map(o => (
          <Link key={o.id} to={`/pedido/${o.id}`}
            className="card p-4 flex items-center gap-4 hover:border-neon-500/30 transition group">
            <div className="flex -space-x-2">
              {o.items.slice(0, 3).map((it, i) => (
                <div key={i} className="h-12 w-12 rounded-lg overflow-hidden border-2 border-ink-850 bg-ink-900 shrink-0">
                  {it.product_image ? <img src={it.product_image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-ink-500 m-3" />}
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">#{o.id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-ink-400">{formatDate(o.created_at)} · {o.items.length} item(s)</p>
              <div className="flex gap-1.5 mt-1">
                <span className={statusChip[o.status]}>{o.status}</span>
                <span className={payChip[o.payment_status]}>{o.payment_status}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-neon-300">{formatBRL(o.total)}</p>
              <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-neon-300 ml-auto" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
