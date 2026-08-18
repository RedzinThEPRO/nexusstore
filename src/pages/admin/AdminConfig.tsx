import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Toast } from '@/components/ui';
import { Database, Shield, Zap, Server, Key } from 'lucide-react';

export function AdminConfig() {
  const { user } = useAuth();
  void user;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Configurações</h1>

      <div className="space-y-4">
        {/* Status */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Status do Sistema</h3>
          <div className="space-y-2 text-sm">
            <Row icon={<Database className="h-4 w-4" />} label="Banco de dados (Supabase)"
              value={isSupabaseConfigured ? <span className="text-success-400">Configurado</span> : <span className="text-warning-400">Modo demo (local)</span>} />
            <Row icon={<Shield className="h-4 w-4" />} label="Autenticação"
              value={<span className="text-success-400">Ativa</span>} />
            <Row icon={<Zap className="h-4 w-4" />} label="Realtime"
              value={isSupabaseConfigured ? <span className="text-success-400">Disponível</span> : <span className="text-ink-400">Polling (demo)</span>} />
          </div>
        </div>

        {/* Environment */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Variáveis de Ambiente</h3>
          <p className="text-xs text-ink-400 mb-3">Configure no arquivo <code className="text-neon-300">.env</code> para ativar Supabase, pagamentos e IA.</p>
          <div className="space-y-2 font-mono text-xs">
            <EnvVar name="VITE_SUPABASE_URL" desc="URL do projeto Supabase" />
            <EnvVar name="VITE_SUPABASE_ANON_KEY" desc="Chave anônima do Supabase" />
            <EnvVar name="PAYMENT_API_KEY" desc="Chave do gateway de pagamento (PIX)" />
            <EnvVar name="PAYMENT_WEBHOOK_SECRET" desc="Segredo do webhook" />
            <EnvVar name="AI_API_KEY" desc="Chave da API de IA" />
            <EnvVar name="RESEND_API_KEY" desc="Chave do Resend (e-mails)" />
          </div>
        </div>

        {/* Admin info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Conta Admin</h3>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30 text-neon-300 font-bold">
              {(user?.username ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.username}</p>
              <p className="text-xs text-ink-400">{user?.email}</p>
            </div>
            <span className="chip-neon ml-auto"><Shield className="h-3 w-3" /> SUPER_ADMIN</span>
          </div>
        </div>

        {/* Demo info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Server className="h-4 w-4" /> Modo Demo</h3>
          <p className="text-sm text-ink-300">
            O sistema funciona em modo demo com armazenamento local (localStorage). Para produção, configure as variáveis de ambiente
            com credenciais reais do Supabase. O arquivo <code className="text-neon-300">SUPABASE_SETUP.sql</code> contém todo o schema do banco.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-ink-300">{icon} {label}</span>
      {value}
    </div>
  );
}

function EnvVar({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <Key className="h-3 w-3 text-ink-400 shrink-0" />
      <code className="text-neon-300">{name}</code>
      <span className="text-ink-400">— {desc}</span>
    </div>
  );
}
