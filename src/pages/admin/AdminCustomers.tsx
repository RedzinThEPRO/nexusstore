import { getProfiles, getOrders, getDeliveries } from '@/lib/api';
import { formatBRL, formatDate, maskCPF } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { Users, Package, Truck, DollarSign } from 'lucide-react';

export function AdminCustomers() {
  const customers = getProfiles().filter(p => p.role === 'USER');
  const orders = getOrders();
  const deliveries = getDeliveries();

  if (customers.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Clientes</h1>
        <EmptyState icon={<Users className="h-12 w-12" />} title="Nenhum cliente" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Clientes</h1>
      <div className="space-y-2">
        {customers.map(c => {
          const cOrders = orders.filter(o => o.user_id === c.id);
          const cDeliveries = deliveries.filter(d => d.user_id === c.id);
          const totalSpent = cOrders.filter(o => o.payment_status === 'PAID').reduce((s, o) => s + o.total, 0);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30 text-neon-300 font-bold">
                  {c.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{c.username}</p>
                  <p className="text-xs text-ink-400">{c.email}</p>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <Stat icon={<Package className="h-4 w-4" />} value={String(cOrders.length)} label="Pedidos" />
                  <Stat icon={<Truck className="h-4 w-4" />} value={String(cDeliveries.length)} label="Entregas" />
                  <Stat icon={<DollarSign className="h-4 w-4" />} value={formatBRL(totalSpent)} label="Gasto" />
                  <div className="text-left">
                    {c.free_fire_id && <p className="text-xs text-accent-400">FF: {c.free_fire_id}</p>}
                    {c.cpf && <p className="text-xs text-ink-400">CPF: {maskCPF(c.cpf)}</p>}
                    <p className="text-xs text-ink-400">Desde {formatDate(c.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="text-ink-400 flex justify-center">{icon}</div>
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-ink-400">{label}</p>
    </div>
  );
}
