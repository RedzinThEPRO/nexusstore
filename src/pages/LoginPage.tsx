import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Toast } from '@/components/ui';
import { Gamepad2, Mail, Lock, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.ok && res.requiresMfa) {
      setMfaRequired(true);
    } else if (res.ok) {
      setToast('Login realizado!');
      setTimeout(() => navigate(redirect), 500);
    } else {
      setError(res.error ?? 'Erro ao entrar.');
    }
  };

  const submitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await verifyMfa(mfaCode);
    if (res.ok) navigate(redirect);
    else setError(res.error ?? 'Código MFA inválido.');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30">
            <Gamepad2 className="h-6 w-6 text-neon-400" />
          </div>
        </Link>
        <h1 className="font-display text-2xl font-bold text-white">Entrar</h1>
        <p className="text-sm text-ink-300 mt-1">Acesse sua conta para continuar</p>
      </div>

      <div className="card p-6">
        {mfaRequired ? <form onSubmit={submitMfa} className="space-y-4">
          <div><label className="label">Código do autenticador</label>
            <input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={e => setMfaCode(e.target.value)} className="input" minLength={6} maxLength={8} required />
          </div>
          {error && <p className="text-sm text-danger-400">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3">Verificar MFA <ArrowRight className="h-4 w-4" /></button>
        </form> : <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" className="input pl-10" required />
            </div>
          </div>
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="input pl-10" required />
            </div>
          </div>
          {error && <p className="text-sm text-danger-400">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3">
            Entrar <ArrowRight className="h-4 w-4" />
          </button>
        </form>}
      </div>

      <p className="text-center text-sm text-ink-300 mt-6">
        Não tem conta? <Link to="/cadastro" className="text-neon-300 hover:text-neon-200">Criar conta</Link>
      </p>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
