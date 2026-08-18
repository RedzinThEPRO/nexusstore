import { getOrders, getDeliveries, getProducts, getProfiles, getReviews } from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { BarChart3, TrendingUp, Package, Truck, Star, Users } from 'lucide-react';

export function AdminAnalytics() {
  const orders = getOrders();
  const deliveries = getDeliveries();
  const products = getProducts();
  const customers = getProfiles().filter(p => p.role === 'USER');
  const reviews = getReviews();

  const paidOrders = orders.filter(o => o.payment_status === 'PAID');
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const avgTicket = paidOrders.length ? revenue / paidOrders.length : 0;
  const completedDeliveries = deliveries.filter(d => d.status === 'COMPLETED');

  const avgDeliveryTime = completedDeliveries.length
    ? completedDeliveries.reduce((s, d) => {
        const start = new Date(d.created_at).getTime();
        const end = d.completed_at ? new Date(d.completed_at).getTime() : Date.now();
        return s + (end - start);
      }, 0) / completedDeliveries.length / 3600000
    : 0;

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const conversion = customers.length ? (paidOrders.length / customers.length) * 100 : 0;

  // Top products by order count
  const productSales: Record<string, number> = {};
  paidOrders.forEach(o => o.items.forEach(i => {
    productSales[i.product_name] = (productSales[i.product_name] ?? 0) + i.quantity;
  }));
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Monthly revenue (last 6 months)
  const monthly: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
    const start = d.getTime();
    d.setMonth(d.getMonth() + 1);
    const end = d.getTime();
    const rev = paidOrders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= start && t < end;
    }).reduce((s, o) => s + o.total, 0);
    monthly.push({ label: new Date(start).toLocaleDateString('pt-BR', { month: 'short' }), value: rev });
  }
  const maxMonthly = Math.max(...monthly.map(m => m.value), 1);

  const hasData = orders.length > 0 || products.length > 0;

  if (!hasData) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Analytics</h1>
        <EmptyState icon={<BarChart3 className="h-12 w-12" />} title="Sem dados suficientes"
          desc="Adicione produtos e faça vendas para ver analytics reais." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Faturamento total" value={formatBRL(revenue)} />
        <Kpi icon={<Package className="h-5 w-5" />} label="Vendas" value={String(paidOrders.length)} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Ticket médio" value={formatBRL(avgTicket)} />
        <Kpi icon={<Truck className="h-5 w-5" />} label="Tempo médio entrega" value={`${avgDeliveryTime.toFixed(1)}h`} />
        <Kpi icon={<Star className="h-5 w-5" />} label="Avaliação média" value={avgRating.toFixed(1)} />
        <Kpi icon={<Users className="h-5 w-5" />} label="Conversão" value={`${conversion.toFixed(0)}%`} />
      </div>

      {/* Monthly chart */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Faturamento mensal (6 meses)</h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {monthly.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-ink-400">{m.value > 0 ? formatBRL(m.value) : ''}</span>
              <div className="w-full bg-ink-800 rounded-t-lg flex-1 flex items-end overflow-hidden">
                <div className="w-full bg-gradient-to-t from-neon-600 to-neon-400 rounded-t-lg transition-all"
                  style={{ height: `${(m.value / maxMonthly) * 100}%`, minHeight: m.value > 0 ? '4px' : '0' }} />
              </div>
              <span className="text-[10px] text-ink-400 capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top products */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Produtos mais vendidos</h3>
        {topProducts.length === 0 ? (
          <p className="text-sm text-ink-400 py-4 text-center">Sem vendas ainda.</p>
        ) : (
          <div className="space-y-2">
            {topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-neon-500/15 text-neon-300 text-xs font-bold">{i + 1}</span>
                <span className="flex-1 text-sm text-white truncate">{name}</span>
                <span className="text-sm font-bold text-neon-300">{qty}x</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-neon-400 mb-2">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}
