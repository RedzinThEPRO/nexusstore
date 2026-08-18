import { useState } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, addAuditLog } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Modal, ConfirmDialog, Toast, EmptyState } from '@/components/ui';
import { formatBRL } from '@/lib/format';
import type { Product } from '@/types';
import { Package, Plus, Pencil, Trash2, Power, X } from 'lucide-react';

const GAMES = ['Free Fire', 'League of Legends', 'Valorant', 'CS2', 'Fortnite', 'Roblox', 'Minecraft', 'Outro'];

export function AdminProducts() {
  const { user } = useAuth();
  const products = getProducts();
  const categories = getCategories();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setShowForm(true); };

  const toggleStatus = (p: Product) => {
    updateProduct(p.id, { status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'product_status', target: p.id });
    setToast(`Produto ${p.status === 'ACTIVE' ? 'desativado' : 'ativado'}`);
  };

  const remove = () => {
    if (!deleteId) return;
    deleteProduct(deleteId);
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'product_delete', target: deleteId });
    setDeleteId(null);
    setToast('Produto excluído');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Produtos</h1>
        <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Novo Produto</button>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="Nenhum produto"
          desc="Crie seu primeiro produto para vender na loja."
          action={<button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Criar produto</button>} />
      ) : (
        <div className="space-y-2">
          {products.map(p => {
            const cat = categories.find(c => c.id === p.category_id);
            return (
              <div key={p.id} className="card p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-ink-900 shrink-0">
                  {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-ink-500 m-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-xs text-ink-400">{cat?.name ?? 'Sem categoria'} · {p.game} · Estoque: {p.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-300">{formatBRL(p.promo_price ?? p.price)}</p>
                  {p.promo_price && <p className="text-xs text-ink-400 line-through">{formatBRL(p.price)}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleStatus(p)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-white" title="Ativar/Desativar">
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-neon-300">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-danger-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProductForm product={editing} categories={categories}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); setToast(editing ? 'Produto atualizado!' : 'Produto criado!'); }}
        />
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove}
        title="Excluir produto" message="Tem certeza? Esta ação não pode ser desfeita."
        confirmLabel="Excluir" danger />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSave }: {
  product: Product | null; categories: ReturnType<typeof getCategories>;
  onClose: () => void; onSave: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    promo_price: product?.promo_price ?? 0,
    category_id: product?.category_id ?? (categories[0]?.id ?? ''),
    game: product?.game ?? 'Free Fire',
    stock: product?.stock ?? 0,
    sku: product?.sku ?? '',
    status: product?.status ?? 'ACTIVE' as const,
    type: product?.type ?? 'DIGITAL' as const,
    images: product?.images ?? [] as string[],
  });
  const [imageInput, setImageInput] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (!form.name.trim()) { setError('Nome obrigatório.'); return; }
    if (form.price <= 0) { setError('Preço inválido.'); return; }
    if (!form.category_id && categories.length > 0) { setError('Selecione uma categoria.'); return; }
    if (!form.category_id) { setError('Crie uma categoria primeiro.'); return; }

    const requiresFF = form.game === 'Free Fire' || categories.find(c => c.id === form.category_id)?.name.toLowerCase().includes('free fire') || false;

    if (product) {
      updateProduct(product.id, {
        ...form,
        promo_price: form.promo_price > 0 ? form.promo_price : undefined,
        requires_free_fire_id: requiresFF,
      });
      addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'product_update', target: product.id });
    } else {
      createProduct({
        ...form,
        promo_price: form.promo_price > 0 ? form.promo_price : undefined,
        requires_free_fire_id: requiresFF,
      });
      addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'product_create' });
    }
    onSave();
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setForm(f => ({ ...f, images: [...f.images, imageInput.trim()] }));
      setImageInput('');
    }
  };

  return (
    <Modal open onClose={onClose} title={product ? 'Editar produto' : 'Novo produto'} wide>
      <div className="space-y-4">
        <div>
          <label className="label">Nome *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Preço (R$) *</label>
            <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Preço promocional</label>
            <input type="number" step="0.01" value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: +e.target.value }))} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categoria *</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input">
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categories.length === 0 && <p className="text-xs text-accent-400 mt-1">Crie categorias primeiro.</p>}
          </div>
          <div>
            <label className="label">Jogo</label>
            <select value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))} className="input">
              {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Estoque</label>
            <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">SKU</label>
            <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Product['type'] }))} className="input">
              <option value="DIGITAL">Digital</option>
              <option value="PHYSICAL">Físico</option>
              <option value="SERVICE">Serviço</option>
            </select>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="label">Imagens (URLs)</label>
          <div className="flex gap-2">
            <input value={imageInput} onChange={e => setImageInput(e.target.value)}
              placeholder="https://..." className="input" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} />
            <button onClick={addImage} className="btn-outline">Adicionar</button>
          </div>
          {form.images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {form.images.map((img, i) => (
                <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden bg-ink-900 group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                    className="absolute inset-0 grid place-items-center bg-black/70 opacity-0 group-hover:opacity-100 transition">
                    <X className="h-4 w-4 text-danger-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-primary">{product ? 'Salvar' : 'Criar'}</button>
        </div>
      </div>
    </Modal>
  );
}
