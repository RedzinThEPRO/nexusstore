import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { getProductBySlug, getReviewsByProduct, getCategories, addReview } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatBRL } from '@/lib/format';
import { Stars, Badge, EmptyState, Toast } from '@/components/ui';
import { ShoppingCart, Package, Tag, Shield, Zap, Minus, Plus, ChevronLeft, MessageCircle } from 'lucide-react';
import { uid } from '@/lib/store';
import type { ProductVariant } from '@/types';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const product = getProductBySlug(slug ?? '');
  const categories = getCategories();
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [ffid, setFfid] = useState('');
  const [toast, setToast] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  if (!product) {
    return <EmptyState icon={<Package className="h-12 w-12" />} title="Produto não encontrado"
      action={<Link to="/loja" className="btn-primary">Voltar à loja</Link>} />;
  }

  const reviews = getReviewsByProduct(product.id);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const category = categories.find(c => c.id === product.category_id);
  const isMultiple = product.inventory_mode === 'MULTIPLE';
  const availableVariants = (product.variants ?? []).filter(v => v.active !== false);
  const selectedVariant = availableVariants.find(v => v.id === selectedVariantId);
  const variantPrice = (v: ProductVariant) =>
    v.promo_price && v.promo_price > 0 && v.promo_price < v.price ? v.promo_price : v.price;
  const price = selectedVariant ? variantPrice(selectedVariant) : (product.promo_price ?? product.price);
  const displayStock = isMultiple
    ? (selectedVariant ? selectedVariant.stock : availableVariants.reduce((s, v) => s + v.stock, 0))
    : product.stock;
  const hasPromo = selectedVariant
    ? selectedVariant.promo_price != null && selectedVariant.promo_price > 0 && selectedVariant.promo_price < selectedVariant.price
    : !isMultiple && product.promo_price != null && product.promo_price < product.price;
  const needsFF = product.requires_free_fire_id;
  const allowQty = product.allow_quantity_selection !== false;
  const maxQty = Math.max(1, selectedVariant ? selectedVariant.stock : (isMultiple ? 1 : product.stock));

  const handleAdd = () => {
    if (isMultiple && !selectedVariant) {
      setToast('Selecione uma opção do produto para continuar.');
      return;
    }
    if (needsFF && !ffid.trim()) {
      setToast('Informe seu ID do Free Fire para continuar.');
      return;
    }
    if (displayStock <= 0) {
      setToast('Esta opção está sem estoque no momento.');
      return;
    }
    add(product, qty, needsFF ? ffid.trim() : undefined, selectedVariant);
    navigate('/carrinho');
  };

  const submitReview = () => {
    if (!user) { setToast('Faça login para avaliar.'); return; }
    if (!reviewComment.trim() && reviewRating === 0) return;
    addReview({
      id: uid('rev'), product_id: product.id, user_id: user.id, username: user.username,
      rating: reviewRating, comment: reviewComment.trim() || undefined,
      created_at: new Date().toISOString(),
    });
    setShowReview(false);
    setReviewComment('');
    setReviewRating(5);
    setToast('Avaliação enviada!');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/loja" className="inline-flex items-center gap-1 text-sm text-ink-300 hover:text-neon-300 mb-6">
        <ChevronLeft className="h-4 w-4" /> Voltar à loja
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="card overflow-hidden rounded-2xl aspect-square bg-ink-900">
            {(selectedVariant?.images?.[0] ?? product.images[0]) ? (
              <img src={selectedVariant?.images?.[0] ?? product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-ink-500">
                <Package className="h-20 w-20" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <div key={i} className="card overflow-hidden rounded-lg h-20 w-20 shrink-0 bg-ink-900">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {category && <Badge variant="neon"><Tag className="h-3 w-3" />{category.name}</Badge>}
            <Badge variant="muted">{product.game}</Badge>
            {product.type === 'DIGITAL' && <Badge variant="accent">Digital</Badge>}
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <Stars value={avg} size={18} />
            <span className="text-sm text-ink-300">{reviews.length} avaliação(ões)</span>
          </div>
          <p className="text-ink-200 mb-6 whitespace-pre-wrap">{product.description}</p>

          {isMultiple && (
            <div className="card p-5 mb-6 border-neon-500/20">
              <p className="label mb-3">Escolha uma opção *</p>
              {availableVariants.length === 0 ? (
                <p className="text-sm text-ink-400">Nenhuma opção disponível no momento.</p>
              ) : (
                <div className="space-y-2">
                  {availableVariants.map(variant => {
                    const soldOut = variant.stock <= 0;
                    const selected = variant.id === selectedVariantId;
                    return (
                      <button key={variant.id} type="button" disabled={soldOut}
                        onClick={() => { setSelectedVariantId(variant.id); setQty(1); }}
                        className={`w-full text-left rounded-xl border p-3 transition flex items-start gap-3 ${
                          selected ? 'border-neon-500 bg-neon-500/10' : 'border-white/10 hover:border-white/25'
                        } ${soldOut ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? 'border-neon-400' : 'border-ink-500'}`}>
                          {selected && <span className="h-2 w-2 rounded-full bg-neon-400" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-white">{variant.name}</span>
                          {variant.description && <span className="block text-xs text-ink-300 mt-0.5 whitespace-pre-wrap">{variant.description}</span>}
                          <span className="block text-xs text-ink-400 mt-1">{soldOut ? 'Esgotado' : `Estoque: ${variant.stock}`}</span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block text-sm font-bold text-neon-300">{formatBRL(variantPrice(variant))}</span>
                          {variant.promo_price != null && variant.promo_price > 0 && variant.promo_price < variant.price && (
                            <span className="block text-xs text-ink-400 line-through">{formatBRL(variant.price)}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedVariant?.delivery_info && <p className="text-xs text-ink-400 mt-3">Entrega manual: {selectedVariant.delivery_info}</p>}
            </div>
          )}

          {/* Price */}
          <div className="card p-5 mb-6">
            {hasPromo && (
              <p className="text-sm text-ink-400 line-through">{formatBRL(selectedVariant ? selectedVariant.price : product.price)}</p>
            )}
            {isMultiple && !selectedVariant ? (
              <p className="text-3xl font-bold text-neon-300 mb-1">
                {availableVariants.length > 0
                  ? `A partir de ${formatBRL(Math.min(...availableVariants.map(variantPrice)))}`
                  : 'Indisponível'}
              </p>
            ) : (
              <p className="text-3xl font-bold text-neon-300 mb-1">{formatBRL(price)}</p>
            )}
            <p className="text-xs text-ink-400">SKU: {selectedVariant?.sku ?? product.sku}</p>
            <div className="mt-3 flex items-center gap-2">
              {displayStock > 0 ? (
                <Badge variant="success">Em estoque: {displayStock}</Badge>
              ) : (
                <Badge variant="danger">Esgotado</Badge>
              )}
            </div>
          </div>

          {/* Free Fire ID */}
          {needsFF && (
            <div className="mb-4">
              <label className="label">ID do Free Fire *</label>
              <input value={ffid} onChange={e => setFfid(e.target.value)}
                placeholder="Digite seu ID do Free Fire"
                className="input" />
              <p className="text-xs text-ink-400 mt-1">Será enviado no chat de entrega para o administrador.</p>
            </div>
          )}

          {/* Quantity + Add */}
          <div className="flex items-center gap-3 mb-2">
            {allowQty && (
              <div className="flex items-center gap-1 card rounded-xl p-1">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 text-ink-200">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-white font-semibold">{qty}</span>
                <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 text-ink-200">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            <button onClick={handleAdd} disabled={displayStock <= 0}
              className="btn-primary flex-1 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
            </button>
          </div>
          <p className="text-xs text-accent-400 mb-6 min-h-4">
            {isMultiple && !selectedVariant ? 'Selecione uma opção para continuar.' : ''}
          </p>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="card p-3"><Shield className="h-5 w-5 text-neon-400 mx-auto mb-1" /><p className="text-xs text-ink-300">Compra segura</p></div>
            <div className="card p-3"><Zap className="h-5 w-5 text-accent-400 mx-auto mb-1" /><p className="text-xs text-ink-300">Entrega rápida</p></div>
            <div className="card p-3"><MessageCircle className="h-5 w-5 text-neon-400 mx-auto mb-1" /><p className="text-xs text-ink-300">Chat de entrega</p></div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Avaliações ({reviews.length})</h2>
          {user && (
            <button onClick={() => setShowReview(o => !o)} className="btn-outline">
              {showReview ? 'Cancelar' : 'Avaliar produto'}
            </button>
          )}
        </div>

        {showReview && (
          <div className="card p-5 mb-6 animate-fade-in">
            <div className="mb-3">
              <label className="label">Nota</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)}
                    className={`text-3xl transition ${n <= reviewRating ? 'text-accent-400' : 'text-ink-600'}`}>★</button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="label">Comentário (opcional)</label>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                rows={3} className="input resize-none" placeholder="Conte sua experiência..." />
            </div>
            <button onClick={submitReview} className="btn-primary">Enviar avaliação</button>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-ink-400 text-sm">Ainda não há avaliações. Seja o primeiro!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-neon-500/15 text-neon-300 text-sm font-bold">
                      {r.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-white">{r.username}</span>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-ink-200">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
