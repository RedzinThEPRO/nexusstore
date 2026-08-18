import { getAuditLogs } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { ScrollText, LogIn, LogOut, Package, ShoppingCart, Truck, Ticket, MessageSquare, User } from 'lucide-react';

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4 text-neon-400" />,
  logout: <LogOut className="h-4 w-4 text-ink-400" />,
  register: <User className="h-4 w-4 text-success-400" />,
  product_create: <Package className="h-4 w-4 text-accent-400" />,
  product_update: <Package className="h-4 w-4 text-neon-400" />,
  product_delete: <Package className="h-4 w-4 text-danger-400" />,
  product_status: <Package className="h-4 w-4 text-warning-400" />,
  category_create: <Ticket className="h-4 w-4 text-accent-400" />,
  category_delete: <Ticket className="h-4 w-4 text-danger-400" />,
  order_update: <ShoppingCart className="h-4 w-4 text-neon-400" />,
  delivery_start: <Truck className="h-4 w-4 text-warning-400" />,
  delivery_complete: <Truck className="h-4 w-4 text-success-400" />,
  review_delete: <MessageSquare className="h-4 w-4 text-danger-400" />,
  coupon_create: <Ticket className="h-4 w-4 text-accent-400" />,
  coupon_delete: <Ticket className="h-4 w-4 text-danger-400" />,
};

export function AdminLogs() {
  const logs = getAuditLogs();

  if (logs.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Logs</h1>
        <EmptyState icon={<ScrollText className="h-12 w-12" />} title="Nenhum log ainda"
          desc="Ações administrativas e de usuários serão registradas aqui." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Logs de Auditoria</h1>
      <div className="space-y-1">
        {logs.map(l => (
          <div key={l.id} className="card p-3 flex items-center gap-3">
            <div className="shrink-0">{actionIcons[l.action] ?? <ScrollText className="h-4 w-4 text-ink-400" />}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <span className="font-semibold">{l.actor_role === 'SUPER_ADMIN' ? 'Admin' : 'Usuário'}</span> — {l.action.replace(/_/g, ' ')}
              </p>
              {l.target && <p className="text-xs text-ink-400 truncate">Alvo: {l.target}</p>}
            </div>
            <span className="text-xs text-ink-400 shrink-0">{formatDate(l.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
