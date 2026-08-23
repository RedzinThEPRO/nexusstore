import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Bell, User, Menu, X, Gamepad2, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Notification } from '@/types';

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) setNotifs(getNotifications(user.id));
  }, [user, location.pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/loja?q=${encodeURIComponent(search.trim())}`);
    setMenuOpen(false);
  };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || (to === '/' && location.pathname === '/');
    return (
      <Link to={to} onClick={() => setMenuOpen(false)}
        className={`text-sm font-medium transition-colors ${active ? 'text-neon-300' : 'text-ink-200 hover:text-white'}`}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30">
              <Gamepad2 className="h-5 w-5 text-neon-400" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white hidden sm:block">
              Nexus<span className="text-neon-400">Store</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLink('/', 'Início')}
            {navLink('/loja', 'Loja')}
            {navLink('/categorias', 'Categorias')}
          </nav>

          {/* Search */}
          <form onSubmit={submitSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produtos..."
                className="input pl-10 py-2.5 text-sm" />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(o => !o)}
                  className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-white/5 text-ink-200 hover:text-white transition">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 text-[10px] font-bold text-white px-1">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-card overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <span className="text-sm font-semibold text-white">Notificações</span>
                      {unread > 0 && (
                        <button onClick={() => { markAllNotificationsRead(user.id); setNotifs(getNotifications(user.id)); }}
                          className="text-xs text-neon-300 hover:text-neon-200">Marcar todas como lidas</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-ink-400">Nenhuma notificação</p>
                      ) : notifs.map(n => (
                        <button key={n.id} onClick={() => { markNotificationRead(n.id); setNotifs(getNotifications(user.id)); if (n.order_id) navigate(`/pedido/${n.order_id}`); }}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${n.read ? 'opacity-60' : ''}`}>
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-neon-400 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{n.title}</p>
                              <p className="text-xs text-ink-300 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-ink-400 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <Link to="/carrinho" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-white/5 text-ink-200 hover:text-white transition">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-neon-500 text-[10px] font-bold text-ink-950 px-1">
                  {count}
                </span>
              )}
            </Link>

            {/* Profile / Auth */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 transition">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-neon-500/15 border border-neon-500/30 text-neon-300 text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="h-4 w-4 text-ink-300 hidden sm:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl shadow-card overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                      <p className="text-xs text-ink-300 truncate">{user.email}</p>
                      {isAdmin && <span className="chip-neon mt-1.5"><Shield className="h-3 w-3" /> Admin</span>}
                    </div>
                    <div className="py-1">
                      <Link to="/perfil" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white">
                        <User className="h-4 w-4" /> Meu Perfil
                      </Link>
                      <Link to="/pedidos" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white">
                        <ShoppingCart className="h-4 w-4" /> Meus Pedidos
                      </Link>
                      <button onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-400 hover:bg-danger-500/10">
                        <LogOut className="h-4 w-4" /> Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-ghost">Entrar</Link>
                <Link to="/cadastro" className="btn-primary">Criar Conta</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(o => !o)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/5 text-ink-200 md:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <form onSubmit={submitSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-10" />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg text-ink-200 hover:bg-white/5">Início</Link>
              <Link to="/loja" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg text-ink-200 hover:bg-white/5">Loja</Link>
              <Link to="/categorias" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg text-ink-200 hover:bg-white/5">Categorias</Link>
              {!user && (
                <div className="flex gap-2 mt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1">Entrar</Link>
                  <Link to="/cadastro" onClick={() => setMenuOpen(false)} className="btn-primary flex-1">Criar Conta</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
