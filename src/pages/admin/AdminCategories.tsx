import { useState } from 'react';
import { getCategories, createCategory, deleteCategory, addAuditLog } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Modal, ConfirmDialog, Toast, EmptyState } from '@/components/ui';
import { Tag, Plus, Trash2, Gamepad2 } from 'lucide-react';

export function AdminCategories() {
  const { user } = useAuth();
  const categories = getCategories();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const create = () => {
    if (!name.trim()) return;
    createCategory(name.trim(), desc.trim() || undefined);
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'category_create', target: name });
    setShowForm(false); setName(''); setDesc('');
    setToast('Categoria criada!');
  };

  const remove = () => {
    if (!deleteId) return;
    deleteCategory(deleteId);
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'category_delete', target: deleteId });
    setDeleteId(null);
    setToast('Categoria excluída');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Categorias</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nova Categoria</button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={<Tag className="h-12 w-12" />} title="Nenhuma categoria"
          desc="Crie categorias para organizar seus produtos."
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> Criar categoria</button>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map(c => (
            <div key={c.id} className="card p-4 group">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-500/10 border border-neon-500/20">
                  <Gamepad2 className="h-5 w-5 text-neon-400" />
                </div>
                <button onClick={() => setDeleteId(c.id)} className="text-ink-400 hover:text-danger-400 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-white mt-2">{c.name}</h3>
              {c.description && <p className="text-xs text-ink-400 line-clamp-2 mt-0.5">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova categoria">
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Ex: Free Fire" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="input resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            <button onClick={create} className="btn-primary">Criar</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove}
        title="Excluir categoria" message="Tem certeza?" confirmLabel="Excluir" danger />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
