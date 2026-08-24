import { Link } from 'react-router-dom';
import { Sparkles, Percent, TrendingUp, Zap, Shield, Headphones, ArrowRight, Gamepad2 } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/api';
import { ProductSection, FeaturedIcon, OffersIcon, BestSellersIcon } from '@/components/ProductCard';
import { formatBRL } from '@/lib/format';

export function HomePage() {
  const products = getProducts();
  const categories = getCategories();

  const featured = products.filter(p => p.status === 'ACTIVE').slice(0, 8);
  const offers = products.filter(p => p.promo_price != null && p.promo_price < p.price).slice(0, 8);
  const bestSellers = [...products].sort((a, b) => b.stock - a.stock).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass border border-white/10 mb-12">
        <div className="absolute inset-0 bg-grid-dark bg-[size:40px_40px] opacity-40" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative px-6 py-16 sm:px-12 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 chip-neon mb-6 animate-fade-in">
            <Zap className="h-3.5 w-3.5" /> Entrega em até 12 horas
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 text-balance">
            Sua loja gamer<br /><span className="text-neon-400">definitiva</span>
          </h1>
          <p className="text-lg text-ink-200 max-w-2xl mx-auto mb-8 text-balance">
            Recargas, contas, skins e muito mais. Pagamento via PIX, entrega rápida e suporte 24/7.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/loja" className="btn-primary text-base px-7 py-3">
              Explorar Loja <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/categorias" className="btn-outline text-base px-7 py-3">
              Categorias
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-ink-300">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-neon-400" /> Pagamento Seguro</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent-400" /> Entrega Rápida</span>
            <span className="flex items-center gap-2"><Headphones className="h-4 w-4 text-neon-400" /> Suporte 24/7</span>
          </div>
        </div>
      </section>

      {/* Categories strip */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="section-title mb-5">Categorias</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map(c => (
              <Link key={c.id} to={`/loja?cat=${c.slug}`}
                className="card px-5 py-4 min-w-40 hover:border-neon-500/30 hover:shadow-glow transition group">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-500/10 border border-neon-500/20 mb-2 group-hover:scale-110 transition">
                  <Gamepad2 className="h-5 w-5 text-neon-400" />
                </div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                {c.description && <p className="text-xs text-ink-400 line-clamp-1">{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sections */}
      <ProductSection title="Destaques" icon={<FeaturedIcon />} products={featured} to="/loja?sort=destaques" />
      <ProductSection title="Ofertas" icon={<OffersIcon />} products={offers} to="/loja?sort=ofertas" />
      <ProductSection title="Mais Vendidos" icon={<BestSellersIcon />} products={bestSellers} to="/loja?sort=mais-vendidos" />

      {/* Promo banner */}
      <section className="my-12 relative overflow-hidden rounded-3xl bg-gradient-to-r from-neon-500/10 via-accent-500/10 to-neon-500/10 border border-white/10 p-8 sm:p-12 text-center">
        <Percent className="h-10 w-10 text-accent-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          Cupom <span className="text-accent-400">BEMVINDO10</span>
        </h2>
        <p className="text-ink-200 mb-4">Use no checkout e ganhe 10% OFF na sua primeira compra.</p>
        <Link to="/loja" className="btn-accent">Aproveitar agora</Link>
      </section>

      {products.length === 0 && (
        <div className="text-center py-20">
          <Gamepad2 className="h-16 w-16 text-ink-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Bem-vindo à NexusStore!</h2>
          <p className="text-ink-300 max-w-md mx-auto">
            A loja está pronta. O administrador pode adicionar produtos e categorias pelo painel admin.
          </p>
        </div>
      )}
    </div>
  );
}
