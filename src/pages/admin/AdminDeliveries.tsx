import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDeliveries, getProfiles, updateDelivery, addAuditLog, addNotification } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, maskCPF } from '@/lib/format';
import { EmptyState, ConfirmDialog, Toast, Badge } from '@/components/ui';
import { Truck, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import type { DeliveryStatus, Notification } from '@/types';

const statusChip: Record<DeliveryStatus, 'warning' | 'neon' | 'success' | 'muted'> = {
  PENDING: 'warning', IN_PROGRESS: 'neon', COMPLETED: 'success', CANCELLED: 'muted',
};
const statusLabel: Record<DeliveryStatus, string> = {
  PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluída', CANCELLED: 'Cancelada',
};

export function AdminDeliveries() {
  const { user } = useAuth();
  const deliveries = getDeliveries().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [tick, setTick] = useState(0);
  void tick;

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(i);
  }, []);

  const filtered = deliveries.filter(d =>
    tab === 'pending' ? d.status === 'PENDING' || d.status === 'IN_PROGRESS' : d.status === 'COMPLETED');

  const startDelivery = (id: string) => {
    updateDelivery(id, { status: 'IN_PROGRESS', admin_id: user!.id });
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'delivery_start', target: id });
    setToast('Entrega em andamento');
  };

  const completeDelivery = () => {
    if (!confirmId) return;
    const d = deliveries.find(x => x.id === confirmId);
    updateDelivery(confirmId, { status: 'COMPLETED', admin_id: user!.id, completed_at: new Date().toISOString() });
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'delivery_complete', target: confirmId });
    if (d) {
      const notif: Notification = {
        id: `ntf-${Date.now()}`, user_id: d.user_id, type: 'delivery',
        title: 'Entrega concluída!', message: `Sua entrega de ${d.product_name} foi concluída.`,
        order_id: d.order_id, read: false, created_at: new Date().toISOString(),
      };
      addNotification(notif);
    }
    setConfirmId(null);
    setToast('Entrega confirmada!');
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Entregas</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('pending')} className={`chip ${tab === 'pending' ? 'chip-neon' : 'chip-muted'}`}>
          <Clock className="h-3 w-3" /> Pendentes ({deliveries.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS').length})
        </button>
        <button onClick={() => setTab('completed')} className={`chip ${tab === 'completed' ? 'chip-success' : 'chip-muted'}`}>
          <CheckCircle2 className="h-3 w-3" /> Concluídas ({deliveries.filter(d => d.status === 'COMPLETED').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Truck className="h-12 w-12" />} title="Nenhuma entrega" />
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const customer = getProfiles().find(p => p.id === d.user_id);
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-ink-900 shrink-0">
                    {d.product_image ? <img src={d.product_image} alt="" className="h-full w-full object-cover" /> : <Truck className="h-5 w-5 text-ink-500 m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{d.product_name}</p>
                      <Badge variant={statusChip[d.status]}>{statusLabel[d.status]}</Badge>
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {customer?.username ?? '—'} · {customer?.email ?? '—'} · {formatDate(d.created_at)}
                    </p>
                    {d.free_fire_id && <p className="text-xs text-accent-400 mt-0.5">FF ID: {d.free_fire_id}</p>}
                    {customer?.cpf && <p className="text-xs text-ink-400 mt-0.5">CPF: {maskCPF(customer.cpf)}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Link to={`/pedido/${d.order_id}`} className="btn-outline py-1.5 text-xs">
                      <MessageCircle className="h-3.5 w-3.5" /> Chat
                    </Link>
                    {d.status === 'PENDING' && (
                      <button onClick={() => startDelivery(d.id)} className="btn-outline py-1.5 text-xs">
                        <Truck className="h-3.5 w-3.5" /> Iniciar
                      </button>
                    )}
                    {d.status !== 'COMPLETED' && (
                      <button onClick={() => setConfirmId(d.id)} className="btn-primary py-1.5 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={completeDelivery}
        title="Confirmar entrega" message="Tem certeza que deseja marcar esta entrega como concluída?"
        confirmLabel="Sim, confirmar" />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
