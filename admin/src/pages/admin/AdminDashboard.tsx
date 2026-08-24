import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, getDeliveries, getProducts, getProfiles } from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/format';
import { Package, ShoppingCart, Truck, Users, DollarSign, TrendingUp, Clock, AlertTriangle, ArrowUpRight, ArrowRight } from 'lucide-react';

export function AdminDashboard() {
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');

  const orders = getOrders();
  const deliveries = getDeliveries();
  const products = getProducts();
  const customers = getProfiles().filter(p => p.role === 'USER');

  const now = Date.now();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 9999;
  const cutoff = now - days * 86400000;

  const filteredOrders = useMemo(() =>
    orders.filter(o => new Date(o.created_at).getTime() >= cutoff),
    [orders, cutoff]);

  const paidOrders = filteredOrders.filter(o => o.payment_status === 'PAID');
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const avgTicket = paidOrders.length ? revenue / paidOrders.length : 0;
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);
  const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS').length;

  // Chart data: last 7 days revenue
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = now - (6 - i) * 86400000;
    const dayEnd = dayStart + 86400000;
    const dayRev = orders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= dayStart && t < dayEnd && o.payment_status === 'PAID';
    }).reduce((s, o) => s + o.total, 0);
    return { label: new Date(dayStart).toLocaleDateString('pt-BR', { weekday: 'short' }), value: dayRev };
  });
  const maxChart = Math.max(...chartData.map(d => d.value), 1);

  const rangeOptions: { value: typeof range; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'all', label: 'Tudo' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-ink-400 mt-0.5">Visão geral do desempenho da loja</p>
        </div>
        <div className="flex gap-1.5 card rounded-xl p-1">
          {rangeOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === o.value
                  ? 'bg-neon-500/20 text-neon-300 border border-neon-500/25'
                  : 'text-ink-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={<DollarSign className="h-5 w-5" />} label="Faturamento" value={formatBRL(revenue)} color="neon" trend="+12%" />
        <Kpi icon={<ShoppingCart className="h-5 w-5" />} label="Vendas" value={String(paidOrders.length)} color="success" trend="+8%" />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Ticket médio" value={formatBRL(avgTicket)} color="accent" />
        <Kpi icon={<Users className="h-5 w-5" />} label="Clientes" value={String(customers.length)} color="neon" />
        <Kpi icon={<Clock className="h-5 w-5" />} label="Pedidos pendentes" value={String(pending)} color="warning" />
        <Kpi icon={<Truck className="h-5 w-5" />} label="Entregas ativas" value={String(pendingDeliveries)} color="neon" />
        <Kpi icon={<Package className="h-5 w-5" />} label="Produtos" value={String(products.length)} color="accent" />
        <Kpi icon={<AlertTriangle className="h-5 w-5" />} label="Estoque baixo" value={String(lowStock.length)} color="danger" />
      </div>

      {/* Chart + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px] mb-6">
        {/* Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Faturamento (7 dias)</h3>
            <span className="chip-neon">
              <TrendingUp className="h-3 w-3" /> {formatBRL(chartData.reduce((s, d) => s + d.value, 0))}
            </span>
          </div>
          <div className="flex items-end justify-between gap-2 h-44">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full bg-ink-800/80 rounded-t-lg flex-1 flex items-end overflow-hidden relative">
                  <div
                    className="w-full bg-gradient-to-t from-neon-600 via-neon-500 to-neon-400 rounded-t-lg transition-all duration-500 group-hover:from-neon-500 group-hover:to-neon-300"
                    style={{ height: `${(d.value / maxChart) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
                  />
                  {d.value > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-neon-300 font-semibold opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatBRL(d.value)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-ink-400 capitalize">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Ações rápidas</h3>
          <div className="space-y-2">
            <QuickLink to="/admin/produtos" icon={<Package className="h-4 w-4" />} label="Adicionar produto" />
            <QuickLink to="/admin/categorias" icon={<Package className="h-4 w-4" />} label="Criar categoria" />
            <QuickLink to="/admin/cupons" icon={<TrendingUp className="h-4 w-4" />} label="Criar cupom" />
            <QuickLink to="/admin/entregas" icon={<Truck className="h-4 w-4" />} label="Ver entregas" />
            <QuickLink to="/admin/mensagens" icon={<ShoppingCart className="h-4 w-4" />} label="Ver mensagens" />
          </div>
        </div>
      </div>

      {/* Low stock + recent orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Estoque baixo</h3>
            <Link to="/admin/produtos" className="text-xs text-neon-300 hover:text-neon-200 flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-ink-500 mx-auto mb-2" />
              <p className="text-sm text-ink-400">Tudo certo!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-850/50 px-3 py-2">
                  <span className="text-white truncate">{p.name}</span>
                  <span className="chip-warning">{p.stock} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Pedidos recentes</h3>
            <Link to="/admin/pedidos" className="text-xs text-neon-300 hover:text-neon-200 flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-8 w-8 text-ink-500 mx-auto mb-2" />
              <p className="text-sm text-ink-400">Nenhum pedido.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.slice(0, 5).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(o => (
                <Link key={o.id} to={`/pedido/${o.id}`} className="flex items-center justify-between text-sm rounded-lg bg-ink-850/50 px-3 py-2 hover:bg-ink-800/50 transition">
                  <div>
                    <p className="text-white font-medium">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-ink-400">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neon-300 font-semibold">{formatBRL(o.total)}</p>
                    <span className={`chip ${o.status === 'PAID' ? 'chip-success' : 'chip-warning'}`}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, color, trend }: { icon: React.ReactNode; label: string; value: string; color: 'neon' | 'success' | 'accent' | 'warning' | 'danger'; trend?: string }) {
  const colors = {
    neon: 'text-neon-400 bg-neon-500/10 border-neon-500/20',
    success: 'text-success-400 bg-success-500/10 border-success-500/20',
    accent: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
    warning: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
    danger: 'text-danger-400 bg-danger-500/10 border-danger-500/20',
  };
  return (
    <div className="card p-4 hover:border-white/15 transition group">
      <div className="flex items-start justify-between mb-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border ${colors[color]} group-hover:scale-110 transition`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-semibold text-success-400 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" /> {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-ink-400 mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl bg-ink-850/50 border border-white/5 px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800/50 hover:text-white hover:border-neon-500/20 transition group">
      <span className="text-neon-400 group-hover:scale-110 transition">{icon}</span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-ink-500 group-hover:text-neon-300 transition" />
    </Link>
  );
}
