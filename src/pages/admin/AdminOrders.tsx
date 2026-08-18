import { useState } from 'react';
import { getOrders, getProfiles, updateOrder, addAuditLog } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatBRL, formatDate, maskCPF } from '@/lib/format';
import { EmptyState, Badge } from '@/components/ui';
import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import type { OrderStatus } from '@/types';

const statusChip: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  PENDING: 'warning', PAID: 'success', DELIVERED: 'success',
  EXPIRED: 'muted', REFUSED: 'danger', CANCELLED: 'muted', REFUNDED: 'warning',
};

export function AdminOrders() {
  const { user } = useAuth();
  const orders = getOrders().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Pedidos</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {['all', 'PENDING', 'PAID', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`chip ${filter === f ? 'chip-neon' : 'chip-muted'}`}>
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="Nenhum pedido" />
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const customer = getProfiles().find(p => p.id === o.user_id);
            return (
              <Link key={o.id} to={`/pedido/${o.id}`} className="card p-4 flex items-center gap-4 hover:border-neon-500/30 transition group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">#{o.id.slice(-8).toUpperCase()}</p>
                    <Badge variant={statusChip[o.status]}>{o.status}</Badge>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {customer?.username ?? '—'} · {formatDate(o.created_at)} · {o.items.length} item(s)
                  </p>
                  {o.items.some(i => i.free_fire_id) && (
                    <p className="text-xs text-accent-400 mt-0.5">FF ID: {o.items.find(i => i.free_fire_id)?.free_fire_id}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-300">{formatBRL(o.total)}</p>
                  <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-neon-300 ml-auto" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
