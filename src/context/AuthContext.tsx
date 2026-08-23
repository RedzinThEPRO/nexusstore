import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { Profile } from '@/types';
import { getSession, setSession, updateProfile, addAuditLog } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (data: { email: string; password: string; username: string }) => { ok: boolean; error?: string };
  logout: () => void;
  refresh: () => void;
  updateMyProfile: (patch: Partial<Profile>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured) { setSession(null); setUser(null); return; }
    const sid = getSession();
    if (!sid) { setUser(null); return; }
    const p = getProfileById(sid);
    setUser(p ?? null);
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const login: AuthContextValue['login'] = () => ({
    ok: false,
    error: 'Login bloqueado: conecte este fluxo ao Supabase Auth antes de aceitar credenciais.',
  });

  const register: AuthContextValue['register'] = () => ({
    ok: false,
    error: 'Cadastro bloqueado: conecte este fluxo ao Supabase Auth antes de aceitar credenciais.',
  });

  const logout = () => {
    if (user) addAuditLog({ actor_id: user.id, actor_role: user.role, action: 'logout' });
    setSession(null);
    setUser(null);
  };

  const updateMyProfile = (patch: Partial<Profile>) => {
    if (!user) return;
    const updated = updateProfile(user.id, patch);
    if (updated) setUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refresh, updateMyProfile,
      isAdmin: user?.role === 'SUPER_ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
