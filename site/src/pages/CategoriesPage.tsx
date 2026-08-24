import { Link } from 'react-router-dom';
import { getCategories } from '@/lib/api';
import { EmptyState } from '@/components/ui';
import { Gamepad2, ChevronRight } from 'lucide-react';

export function CategoriesPage() {
  const categories = getCategories();

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <EmptyState icon={<Gamepad2 className="h-12 w-12" />} title="Nenhuma categoria ainda"
          desc="O administrador pode criar categorias no painel admin." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-display text-3xl font-bold text-white mb-6">Categorias</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(c => (
          <Link key={c.id} to={`/loja?cat=${c.slug}`}
            className="card p-5 hover:border-neon-500/30 hover:shadow-glow transition group">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-neon-500/10 border border-neon-500/20 mb-3 group-hover:scale-110 transition">
              <Gamepad2 className="h-6 w-6 text-neon-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{c.name}</h3>
            {c.description && <p className="text-xs text-ink-400 line-clamp-2">{c.description}</p>}
            <span className="text-xs text-neon-300 mt-2 inline-flex items-center gap-1">Ver produtos <ChevronRight className="h-3 w-3" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
