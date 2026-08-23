import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { getProductBySlug, getReviewsByProduct, getCategories, addReview } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatBRL } from '@/lib/format';
import { Stars, Badge, EmptyState, Toast } from '@/components/ui';
import { ShoppingCart, Package, Tag, Shield, Zap, Minus, Plus, ChevronLeft, MessageCircle, ListPlus } from 'lucide-react';
import { uid } from '@/lib/store';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const product = getProductBySlug(slug ?? '');
  const categories = getCategories();
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(product?.variants?.[0]?.id ?? '');
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
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? (product.promo_price ?? product.price);
  const displayStock = selectedVariant?.stock ?? product.stock;
  const price = displayPrice;
  const hasPromo = product.promo_price != null && product.promo_price < product.price;
  const needsFF = product.requires_free_fire_id;

  const handleAdd = () => {
    if (needsFF && !ffid.trim()) {
      setToast('Informe seu ID do Free Fire para continuar.');
      return;
    }
    const cartProduct = selectedVariant ? { ...product, name: product.name + ' — ' + selectedVariant.name, price: selectedVariant.price, promo_price: undefined, stock: selectedVariant.stock, sku: selectedVariant.sku ?? product.sku } : product;
    add(cartProduct, qty, needsFF ? ffid.trim() : undefined);
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
            {product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
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

          {/* Price */}
          <div className="card p-5 mb-6">
            {hasPromo && (
              <p className="text-sm text-ink-400 line-through">{formatBRL(product.price)}</p>
            )}
            <p className="text-3xl font-bold text-neon-300 mb-1">{formatBRL(price)}</p>
            <p className="text-xs text-ink-400">SKU: {product.sku}</p>
            <div className="mt-3 flex items-center gap-2">
              {product.stock > 0 ? (
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
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1 card rounded-xl p-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 text-ink-200">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-white font-semibold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(displayStock, q + 1))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 text-ink-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAdd} disabled={displayStock <= 0 || (product.inventory_mode === 'MULTIPLE' && !selectedVariant)}
              className="btn-primary flex-1 py-3 text-base">
              <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
            </button>
          </div>

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
