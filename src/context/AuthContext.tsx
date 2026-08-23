import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthResult { ok: boolean; error?: string; requiresMfa?: boolean }
interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: { email: string; password: string; username: string }) => Promise<AuthResult>;
  logout: () => void;
  refresh: () => void;
  updateMyProfile: (patch: Partial<Profile>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const profileFields = ['username', 'free_fire_id', 'first_name', 'last_name', 'cpf', 'birth_date'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) { setUser(null); return null; }
    setUser(data as Profile);
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setMfaVerified(data.role !== 'SUPER_ADMIN' || aal?.currentLevel === 'aal2');
    return data as Profile;
  }, []);

  const refresh = useCallback(() => {
    if (!supabase) { setUser(null); setMfaVerified(false); setLoading(false); return; }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void loadProfile(data.session.user.id);
      else { setUser(null); setMfaVerified(false); }
      setLoading(false);
    });
  }, [loadProfile]);

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadProfile(session.user.id);
      else { setUser(null); setMfaVerified(false); }
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, [refresh, loadProfile]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Autenticação não configurada.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) return { ok: false, error: 'E-mail ou senha inválidos.' };
    const profile = await loadProfile(data.user.id);
    if (!profile) { await supabase.auth.signOut(); return { ok: false, error: 'Perfil da conta não encontrado.' }; }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return { ok: true, requiresMfa: profile.role === 'SUPER_ADMIN' && aal?.currentLevel !== 'aal2' };
  };

  const register = async ({ email, password, username }: { email: string; password: string; username: string }): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Autenticação não configurada.' };
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 32) return { ok: false, error: 'Nome de usuário inválido.' };
    if (password.length < 12) return { ok: false, error: 'A senha deve ter pelo menos 12 caracteres.' };
    const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { username: cleanUsername } } });
    if (error || !data.user) return { ok: false, error: error?.message || 'Não foi possível criar a conta.' };
    return { ok: true };
  };

  const logout = () => { if (supabase) void supabase.auth.signOut(); setUser(null); setMfaVerified(false); };

  const updateMyProfile = (patch: Partial<Profile>) => {
    if (!supabase || !user) return;
    const safePatch = Object.fromEntries(profileFields.filter((key) => patch[key] !== undefined).map((key) => [key, patch[key]]));
    void supabase.from('profiles').update(safePatch).eq('id', user.id).select().single().then(({ data }) => { if (data) setUser(data as Profile); });
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateMyProfile, isAdmin: user?.role === 'SUPER_ADMIN' && mfaVerified }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
