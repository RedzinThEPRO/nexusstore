import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Truck, Users,
  MessageSquare, Star, Ticket, BarChart3, ScrollText, Settings,
  Menu, X, Gamepad2, Shield, ChevronRight, Home, FileText,
} from 'lucide-react';

interface MenuItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Visão Geral',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Vendas',
    items: [
      { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
      { to: '/admin/entregas', label: 'Entregas', icon: Truck },
      { to: '/admin/cupons', label: 'Cupons', icon: Ticket },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { to: '/admin/produtos', label: 'Produtos', icon: Package },
      { to: '/admin/categorias', label: 'Categorias', icon: Tag },
      { to: '/admin/avaliacoes', label: 'Avaliações', icon: Star },
    ],
  },
  {
    title: 'Atendimento',
    items: [
      { to: '/admin/mensagens', label: 'Mensagens', icon: MessageSquare },
      { to: '/admin/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/admin/termos', label: 'Termos', icon: FileText },
      { to: '/admin/logs', label: 'Logs', icon: ScrollText },
      { to: '/admin/config', label: 'Configurações', icon: Settings },
    ],
  },
];

export function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !user || !isAdmin) navigate('/');
  }, [user, isAdmin, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!isSupabaseConfigured || !user || !isAdmin) return null;

  const currentTitle = menuGroups
    .flatMap(g => g.items)
    .find(m => m.end ? location.pathname === m.to : location.pathname.startsWith(m.to))?.label ?? 'Admin';

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col bg-ink-900/95 backdrop-blur-2xl border-r border-white/10">
          {/* Logo header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30 shadow-glow">
                <Gamepad2 className="h-5 w-5 text-neon-400" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white tracking-tight">
                  Nexus<span className="text-neon-400">Store</span>
                </p>
                <p className="text-[10px] text-ink-400 uppercase tracking-widest">Painel Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-300 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
            {menuGroups.map((group, gi) => (
              <div key={gi} className="mb-5">
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-500">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-neon-500/20 to-neon-500/5 text-neon-300 border border-neon-500/25 shadow-glow'
                            : 'text-ink-200 hover:bg-white/5 hover:text-white border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-neon-400" />
                          )}
                          <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-neon-400' : 'text-ink-400 group-hover:text-ink-200'}`} />
                          <span className="flex-1">{item.label}</span>
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-neon-400/60" />}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User card at bottom */}
          <div className="border-t border-white/10 p-3 shrink-0">
            <div className="flex items-center gap-3 rounded-xl bg-ink-850/80 p-3 border border-white/5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-neon-500/15 border border-neon-500/30 text-neon-300 font-bold text-sm shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-ink-400 truncate">{user.email}</p>
              </div>
              <span className="chip-neon shrink-0">
                <Shield className="h-2.5 w-2.5" /> Admin
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 glass-strong border-b border-white/10 flex items-center gap-3 px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-200 hover:bg-white/5 hover:text-white transition lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-lg font-bold text-white truncate">{currentTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/"
              className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-300 hover:bg-white/5 hover:text-white transition"
            >
              <Home className="h-4 w-4" /> Ver Loja
            </NavLink>
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-ink-850/80 border border-white/5 px-3 py-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-neon-500/15 border border-neon-500/30 text-neon-300 font-bold text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white font-medium">{user.username}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
