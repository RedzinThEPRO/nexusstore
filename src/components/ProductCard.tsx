import { Link } from 'react-router-dom';
import { Package, Tag, TrendingUp, Sparkles, Percent } from 'lucide-react';
import type { Product } from '@/types';
import { formatBRL } from '@/lib/format';
import { Stars } from './ui';
import { getReviewsByProduct } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const reviews = getReviewsByProduct(product.id);
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const price = product.promo_price ?? product.price;
  const hasPromo = product.promo_price != null && product.promo_price < product.price;
  const discount = hasPromo ? Math.round((1 - (product.promo_price! / product.price)) * 100) : 0;

  return (
    <Link to={`/produto/${product.slug}`}
      className="group card overflow-hidden hover:border-neon-500/30 hover:shadow-glow transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full grid place-items-center text-ink-500">
            <Package className="h-12 w-12" />
          </div>
        )}
        {hasPromo && (
          <span className="absolute top-2 left-2 chip-accent">-{discount}%</span>
        )}
        {product.stock <= 0 && (
          <span className="absolute top-2 right-2 chip-danger">Esgotado</span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-2 right-2 chip-warning">Últimas {product.stock}</span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="chip-muted text-[10px]"><Tag className="h-2.5 w-2.5" />{product.game}</span>
        </div>
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-neon-300 transition">
          {product.name}
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Stars value={rating} />
            <span className="text-[10px] text-ink-400">({reviews.length})</span>
          </div>
        )}
        <div className="mt-auto pt-2">
          {hasPromo && (
            <p className="text-xs text-ink-400 line-through">{formatBRL(product.price)}</p>
          )}
          <p className="text-lg font-bold text-neon-300">{formatBRL(price)}</p>
        </div>
      </div>
    </Link>
  );
}

export function ProductSection({ title, icon, products, to }: {
  title: string; icon: React.ReactNode; products: Product[]; to?: string;
}) {
  if (!products.length) return null;
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="text-neon-400">{icon}</div>
          <h2 className="section-title">{title}</h2>
        </div>
        {to && <Link to={to} className="text-sm text-neon-300 hover:text-neon-200">Ver todos →</Link>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export function FeaturedIcon() { return <Sparkles className="h-5 w-5" />; }
export function OffersIcon() { return <Percent className="h-5 w-5" />; }
export function BestSellersIcon() { return <TrendingUp className="h-5 w-5" />; }
