import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { Profile } from '@/types';
import {
  getProfileById, verifyCred, addCred, getProfiles, saveProfiles,
  getSession, setSession, updateProfile, addAuditLog,
} from '@/lib/api';
import { uid } from '@/lib/store';
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

  const login: AuthContextValue['login'] = (email, password) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Autenticação indisponível: configure o Supabase antes de entrar.' };
    const cred = verifyCred(email, password);
    if (!cred) return { ok: false, error: 'E-mail ou senha incorretos.' };
    const profile = getProfileById(cred.id);
    if (!profile) return { ok: false, error: 'Perfil não encontrado.' };
    setSession(profile.id);
    setUser(profile);
    addAuditLog({ actor_id: profile.id, actor_role: profile.role, action: 'login' });
    return { ok: true };
  };

  const register: AuthContextValue['register'] = ({ email, password, username }) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Cadastro indisponível: configure o Supabase antes de criar uma conta.' };
    const existing = getProfiles().find(p => p.email.toLowerCase() === email.toLowerCase());
    if (existing) return { ok: false, error: 'Já existe uma conta com este e-mail.' };
    const now = new Date().toISOString();
    const profile: Profile = {
      id: uid('usr'), username, email, role: 'USER', created_at: now, updated_at: now,
    };
    const list = getProfiles(); list.push(profile); saveProfiles(list);
    addCred(profile.id, email, password);
    setSession(profile.id);
    setUser(profile);
    addAuditLog({ actor_id: profile.id, actor_role: 'USER', action: 'register' });
    return { ok: true };
  };

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
