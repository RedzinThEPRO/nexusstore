import { Link } from 'react-router-dom';
import { getTerms } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Shield, ChevronLeft, FileText } from 'lucide-react';

export function TermsPage() {
  const terms = getTerms();
  const paragraphs = terms.content.split('\n').filter(p => p.trim());

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-300 hover:text-neon-300 mb-6">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30">
            <Shield className="h-6 w-6 text-neon-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{terms.title}</h1>
            <p className="text-xs text-ink-400 mt-0.5">Última atualização: {formatDate(terms.updated_at)}</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-ink-200 leading-relaxed mb-4 whitespace-pre-wrap">{p}</p>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-xs text-ink-400">
          <FileText className="h-3.5 w-3.5" />
          <span>Este documento é gerenciado pelo administrador e pode ser atualizado a qualquer momento.</span>
        </div>
      </div>
    </div>
  );
}
