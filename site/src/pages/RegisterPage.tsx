import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Toast } from '@/components/ui';
import { Gamepad2, Mail, Lock, User, ArrowRight, Info } from 'lucide-react';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) { setError('Nome de usuário muito curto.'); return; }
    if (password.length < 12) { setError('Senha deve ter ao menos 12 caracteres.'); return; }
    const res = await register({ email, password, username });
    if (res.ok) { setToast('Conta criada!'); setTimeout(() => navigate('/'), 500); }
    else setError(res.error ?? 'Erro ao criar conta.');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30">
            <Gamepad2 className="h-6 w-6 text-neon-400" />
          </div>
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">Criar Conta</h1>
        <p className="text-sm text-ink-300 mt-1">Junte-se à NexusStore</p>
      </div>

      <div className="card p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nome de usuário *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="seu_usuario" className="input pl-10" required />
            </div>
          </div>
          <div>
            <label className="label">E-mail *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" className="input pl-10" required />
            </div>
          </div>
          <div>
            <label className="label">Senha *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="input pl-10" required />
            </div>
          </div>
          {error && <p className="text-sm text-danger-400">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3">
            Criar Conta <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-4 flex items-start gap-2 text-xs text-ink-400 bg-ink-900/50 rounded-lg p-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>O ID do Free Fire será solicitado apenas no checkout de produtos da categoria Free Fire. Dados como nome, CPF e data de nascimento são preenchidos no checkout.</p>
        </div>
      </div>

      <p className="text-center text-sm text-ink-300 mt-6">
        Já tem conta? <Link to="/login" className="text-neon-300 hover:text-neon-200">Entrar</Link>
      </p>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
