import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Toast } from '@/components/ui';
import { formatBRL, formatDate, maskCPF } from '@/lib/format';
import { getOrdersByUser, getDeliveriesByUser } from '@/lib/api';
import { User, Mail, Gamepad2, Shield, Save, Package, Truck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const { user, updateMyProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    username: user?.username ?? '',
    free_fire_id: user?.free_fire_id ?? '',
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    cpf: user?.cpf ?? '',
    birth_date: user?.birth_date ?? '',
  });

  if (!user) return null;

  const orders = getOrdersByUser(user.id);
  const deliveries = getDeliveriesByUser(user.id);
  const totalSpent = orders.filter(o => o.payment_status === 'PAID').reduce((s, o) => s + o.total, 0);

  const save = () => {
    updateMyProfile(form);
    setEditing(false);
    setToast('Perfil atualizado!');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-3xl font-bold text-white mb-6">Meu Perfil</h1>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-neon-500/15 border border-neon-500/30 text-neon-300 text-2xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.username}</h2>
            <p className="text-sm text-ink-300">{user.email}</p>
            {user.role === 'SUPER_ADMIN' && <span className="chip-neon mt-1"><Shield className="h-3 w-3" /> Admin</span>}
          </div>
          <button onClick={() => setEditing(o => !o)} className="btn-outline ml-auto">
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Usuário</label><input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="input" /></div>
            <div><label className="label">Free Fire ID</label><input value={form.free_fire_id} onChange={e => setForm(f => ({ ...f, free_fire_id: e.target.value }))} className="input" placeholder="Opcional" /></div>
            <div><label className="label">Nome</label><input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="input" /></div>
            <div><label className="label">Sobrenome</label><input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="input" /></div>
            <div><label className="label">CPF</label><input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} className="input" placeholder="000.000.000-00" /></div>
            <div><label className="label">Data de nascimento</label><input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} className="input" /></div>
            <div className="col-span-2"><button onClick={save} className="btn-primary"><Save className="h-4 w-4" /> Salvar</button></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Info icon={<User className="h-4 w-4" />} label="Usuário" value={user.username} />
            <Info icon={<Mail className="h-4 w-4" />} label="E-mail" value={user.email} />
            <Info icon={<Gamepad2 className="h-4 w-4" />} label="Free Fire ID" value={user.free_fire_id ?? '—'} />
            <Info icon={<User className="h-4 w-4" />} label="Nome" value={user.first_name ? `${user.first_name} ${user.last_name ?? ''}` : '—'} />
            <Info icon={<CreditCard className="h-4 w-4" />} label="CPF" value={maskCPF(user.cpf)} />
            <Info icon={<Package className="h-4 w-4" />} label="Cadastro" value={formatDate(user.created_at)} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Pedidos" value={String(orders.length)} icon={<Package className="h-5 w-5" />} />
        <Stat label="Entregas" value={String(deliveries.length)} icon={<Truck className="h-5 w-5" />} />
        <Stat label="Total gasto" value={formatBRL(totalSpent)} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Histórico de pedidos</h3>
          <Link to="/pedidos" className="text-sm text-neon-300 hover:text-neon-200">Ver todos →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-6">Nenhum pedido ainda.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(o => (
              <Link key={o.id} to={`/pedido/${o.id}`} className="flex items-center justify-between rounded-xl p-3 hover:bg-white/5 transition">
                <div>
                  <p className="text-sm font-semibold text-white">#{o.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-ink-400">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-300">{formatBRL(o.total)}</p>
                  <span className={`chip ${o.status === 'PAID' ? 'chip-success' : 'chip-warning'}`}>{o.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-ink-400 mb-1">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <p className="text-white">{value}</p>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-neon-400 mx-auto mb-1 grid place-items-center">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}
