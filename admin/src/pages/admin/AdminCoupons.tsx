import { useState } from 'react';
import { getCoupons, saveCoupons, addAuditLog } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { uid } from '@/lib/store';
import { Modal, ConfirmDialog, Toast, EmptyState } from '@/components/ui';
import { formatBRL, formatDate } from '@/lib/format';
import type { Coupon } from '@/types';
import { Ticket, Plus, Pencil, Trash2, Power } from 'lucide-react';

export function AdminCoupons() {
  const { user } = useAuth();
  const coupons = getCoupons();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const toggle = (c: Coupon) => {
    saveCoupons(coupons.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
    setToast(`Cupom ${c.active ? 'desativado' : 'ativado'}`);
  };

  const remove = () => {
    if (!deleteId) return;
    saveCoupons(coupons.filter(c => c.id !== deleteId));
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'coupon_delete', target: deleteId });
    setDeleteId(null);
    setToast('Cupom excluído');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Cupons</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> Novo Cupom</button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={<Ticket className="h-12 w-12" />} title="Nenhum cupom"
          action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary"><Plus className="h-4 w-4" /> Criar cupom</button>} />
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <div key={c.id} className="card p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-500/10 border border-accent-500/20">
                <Ticket className="h-5 w-5 text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white font-mono">{c.code}</p>
                  <span className={`chip ${c.active ? 'chip-success' : 'chip-muted'}`}>{c.active ? 'Ativo' : 'Inativo'}</span>
                </div>
                <p className="text-xs text-ink-400">
                  {c.type === 'PERCENT' ? `${c.value}% de desconto` : `${formatBRL(c.value)} de desconto`}
                  {c.min_order ? ` · Mínimo: ${formatBRL(c.min_order)}` : ''}
                  {c.expires_at ? ` · Expira: ${formatDate(c.expires_at)}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggle(c)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-white"><Power className="h-4 w-4" /></button>
                <button onClick={() => { setEditing(c); setShowForm(true); }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-neon-300"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteId(c.id)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-danger-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <CouponForm coupon={editing} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setToast(editing ? 'Cupom atualizado!' : 'Cupom criado!'); }} />}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove}
        title="Excluir cupom" message="Tem certeza?" confirmLabel="Excluir" danger />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

function CouponForm({ coupon, onClose, onSave }: { coupon: Coupon | null; onClose: () => void; onSave: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    code: coupon?.code ?? '',
    type: coupon?.type ?? 'PERCENT' as const,
    value: coupon?.value ?? 10,
    min_order: coupon?.min_order ?? 0,
    active: coupon?.active ?? true,
    expires_at: coupon?.expires_at ?? '',
  });
  const [error, setError] = useState('');

  const save = () => {
    if (!form.code.trim()) { setError('Código obrigatório.'); return; }
    if (form.value <= 0) { setError('Valor inválido.'); return; }
    const data: Coupon = {
      id: coupon?.id ?? uid('cpn'),
      code: form.code.toUpperCase().trim(),
      type: form.type, value: form.value,
      min_order: form.min_order > 0 ? form.min_order : undefined,
      active: form.active,
      expires_at: form.expires_at || undefined,
      created_at: coupon?.created_at ?? new Date().toISOString(),
    };
    const list = getCoupons();
    if (coupon) {
      saveCoupons(list.map(c => c.id === coupon.id ? data : c));
      addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'coupon_update', target: data.code });
    } else {
      list.push(data); saveCoupons(list);
      addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'coupon_create', target: data.code });
    }
    onSave();
  };

  return (
    <Modal open onClose={onClose} title={coupon ? 'Editar cupom' : 'Novo cupom'}>
      <div className="space-y-4">
        <div>
          <label className="label">Código *</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="input font-mono" placeholder="DESCONTO10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Coupon['type'] }))} className="input">
              <option value="PERCENT">Percentual (%)</option>
              <option value="FIXED">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <label className="label">Valor</label>
            <input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Pedido mínimo (R$)</label>
            <input type="number" step="0.01" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: +e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Expira em</label>
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="input" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-200">
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-neon-500" />
          Cupom ativo
        </label>
        {error && <p className="text-sm text-danger-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-primary">{coupon ? 'Salvar' : 'Criar'}</button>
        </div>
      </div>
    </Modal>
  );
}
