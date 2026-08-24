import { useState } from 'react';
import { getTerms, saveTerms, addAuditLog } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Toast } from '@/components/ui';
import { Save, FileText, Shield } from 'lucide-react';

export function AdminTerms() {
  const { user } = useAuth();
  const current = getTerms();
  const [title, setTitle] = useState(current.title);
  const [content, setContent] = useState(current.content);
  const [toast, setToast] = useState('');

  const save = () => {
    if (!title.trim() || !content.trim()) { setToast('Preencha título e conteúdo.'); return; }
    saveTerms(title.trim(), content.trim());
    addAuditLog({ actor_id: user!.id, actor_role: 'SUPER_ADMIN', action: 'terms_update' });
    setToast('Termos atualizados! A página pública foi atualizada automaticamente.');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Termos de Privacidade</h2>
          <p className="text-sm text-ink-400 mt-0.5">Edite os termos exibidos na página pública</p>
        </div>
        <button onClick={save} className="btn-primary">
          <Save className="h-4 w-4" /> Salvar
        </button>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-neon-400" />
          <h3 className="text-sm font-semibold text-white">Conteúdo dos Termos</h3>
        </div>

        <div className="mb-4">
          <label className="label">Título da página</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Termos de Privacidade e Segurança" />
        </div>

        <div>
          <label className="label">Texto dos termos</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={20}
            className="input resize-none font-mono text-xs leading-relaxed" placeholder="Digite os termos aqui..." />
          <p className="text-xs text-ink-400 mt-1.5">
            Use quebras de linha (Enter) para separar parágrafos. Cada linha vira um parágrafo na página pública.
          </p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3">
        <FileText className="h-5 w-5 text-ink-400 shrink-0" />
        <p className="text-sm text-ink-300">
          A página pública pode ser acessada em <code className="text-neon-300">/termos</code> e também é vinculada no rodapé do site e no checkout.
        </p>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
