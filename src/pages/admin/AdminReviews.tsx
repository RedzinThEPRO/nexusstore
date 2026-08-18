import { useState } from 'react';
import { getReviews, deleteReview, getProducts, addAuditLog } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Stars, EmptyState, ConfirmDialog, Toast } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { Star, Trash2, Package } from 'lucide-react';

export function AdminReviews() {
  const { user } = useAuth();
  const reviews = getReviews().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const products = getProducts();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('all');

  const filtered = filterProduct === 'all' ? reviews : reviews.filter(r => r.product_id === filterProduct);

  const remove = () => {
    if (!deleteId) return;
    deleteReview(deleteId);
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'review_delete', target: deleteId });
    setDeleteId(null);
    setToast('Avaliação removida');
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Avaliações</h1>

      {products.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setFilterProduct('all')} className={`chip ${filterProduct === 'all' ? 'chip-neon' : 'chip-muted'}`}>Todos</button>
          {products.map(p => (
            <button key={p.id} onClick={() => setFilterProduct(p.id)} className={`chip ${filterProduct === p.id ? 'chip-neon' : 'chip-muted'}`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<Star className="h-12 w-12" />} title="Nenhuma avaliação" />
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const product = products.find(p => p.id === r.product_id);
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-neon-500/15 text-neon-300 font-bold shrink-0">
                    {r.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{r.username}</p>
                      <Stars value={r.rating} />
                      <span className="text-xs text-ink-400">{formatDate(r.created_at)}</span>
                    </div>
                    {product && (
                      <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1">
                        <Package className="h-3 w-3" /> {product.name}
                      </p>
                    )}
                    {r.comment && <p className="text-sm text-ink-200 mt-1.5">{r.comment}</p>}
                  </div>
                  <button onClick={() => setDeleteId(r.id)} className="text-ink-400 hover:text-danger-400 transition" title="Remover avaliação">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove}
        title="Remover avaliação" message="Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita."
        confirmLabel="Remover" danger />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
