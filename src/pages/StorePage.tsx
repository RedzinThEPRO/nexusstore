import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getProducts, getCategories } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui';
import { Package, SlidersHorizontal } from 'lucide-react';

export function StorePage() {
  const [params, setParams] = useSearchParams();
  const products = getProducts();
  const categories = getCategories();

  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const sort = params.get('sort') ?? '';

  const [search, setSearch] = useState(q);

  const filtered = useMemo(() => {
    let list = products.filter(p => p.status === 'ACTIVE');
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.game.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase()));
    if (cat) {
      const c = categories.find(c => c.slug === cat);
      if (c) list = list.filter(p => p.category_id === c.id);
    }
    switch (sort) {
      case 'ofertas': list = list.filter(p => p.promo_price != null); break;
      case 'destaques': break;
      case 'mais-vendidos': list = [...list].sort((a, b) => b.stock - a.stock); break;
      case 'preco-asc': list = [...list].sort((a, b) => (a.promo_price ?? a.price) - (b.promo_price ?? b.price)); break;
      case 'preco-desc': list = [...list].sort((a, b) => (b.promo_price ?? b.price) - (a.promo_price ?? a.price)); break;
      case 'novidades': list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
    }
    return list;
  }, [products, categories, q, cat, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Loja</h1>
        <p className="text-ink-300">{filtered.length} produto(s) encontrado(s)</p>
      </div>

      {/* Search + filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={e => { e.preventDefault(); setParam('q', search); }} className="flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtos..."
            className="input" />
        </form>
        <select value={sort} onChange={e => setParam('sort', e.target.value)} className="input sm:w-48">
          <option value="">Ordenar por</option>
          <option value="destaques">Destaques</option>
          <option value="ofertas">Ofertas</option>
          <option value="mais-vendidos">Mais vendidos</option>
          <option value="novidades">Novidades</option>
          <option value="preco-asc">Menor preço</option>
          <option value="preco-desc">Maior preço</option>
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setParam('cat', '')}
            className={`chip ${!cat ? 'chip-neon' : 'chip-muted'}`}>Todas</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setParam('cat', c.slug)}
              className={`chip ${cat === c.slug ? 'chip-neon' : 'chip-muted'}`}>{c.name}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="Nenhum produto encontrado"
          desc="Tente ajustar a busca ou os filtros. Se você é admin, adicione produtos no painel." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
