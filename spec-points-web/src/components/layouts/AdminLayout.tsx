import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LogOut, Home, Users, Store, ShoppingCart, Gift,
  RotateCcw, Settings, Menu, X, CheckCircle, Megaphone, Target,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useProfile } from '../../contexts/ProfileContext';

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
    <polygon
      points="14,2 26,8 26,20 14,26 2,20 2,8"
      fill="none"
      stroke="url(#lg)"
      strokeWidth="1.5"
    />
    <polygon
      points="14,7 21,11 21,17 14,21 7,17 7,11"
      fill="url(#lg)"
      opacity="0.25"
    />
    <circle cx="14" cy="14" r="2.5" fill="url(#lg)" />
    <defs>
      <linearGradient id="lg" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f7b871" />
        <stop offset="1" stopColor="#d4a574" />
      </linearGradient>
    </defs>
  </svg>
);

const menuItems = [
  { icon: Home,        label: 'Dashboard',          path: '/' },
  { icon: Users,       label: 'Arquitectos',         path: '/architects' },
  { icon: Store,       label: 'Tiendas',             path: '/stores' },
  { icon: ShoppingCart,label: 'Ventas',              path: '/sales' },
  { icon: Gift,        label: 'Premios',             path: '/prizes' },
  { icon: RotateCcw,   label: 'Canjes',              path: '/redemptions' },
  { icon: Target,      label: 'Campañas',            path: '/campaigns' },
  { icon: CheckCircle, label: 'Aprobaciones',        path: '/approvals' },
  { icon: Megaphone,   label: 'Notificaciones',      path: '/admin/notifications' },
  { icon: Settings,    label: 'Configuraciones',     path: '/settings' },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const user = auth.currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useProfile();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const initial = ((profile?.display_name || user?.email || 'A')[0] ?? 'A').toUpperCase();

  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55 leading-none mb-0.5">Panel</p>
            <h1 className="text-xl font-extrabold text-gradient-gold leading-none">CONNECTUS</h1>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live" />
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">Administrativo</p>

        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={[
              'flex items-center rounded-xl px-3.5 py-2.5 mb-0.5 gap-3 text-sm font-medium transition-all duration-200 min-h-[44px]',
              isActive(item.path)
                ? 'bg-sidebar-accent text-slate-900 shadow-sidebar-item border-l-2 border-sidebar-accent'
                : 'text-sidebar-foreground/75 hover:bg-white/8 hover:text-sidebar-foreground',
            ].join(' ')}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-sidebar-accent to-[#c4956a] flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-slate-900">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {profile?.display_name && (
              <p className="text-xs font-semibold text-sidebar-foreground/90 truncate">{profile.display_name}</p>
            )}
            <p className={`truncate ${profile?.display_name ? 'text-[10px] text-sidebar-foreground/45' : 'text-xs text-sidebar-foreground/65'}`}>{user?.email}</p>
          </div>
        </div>
        {/* Moducasa partner logo */}
        <div className="mb-3 flex items-center justify-center">
          <img src="/moducasa-logo.png" alt="Grupo Moducasa" className="h-10 w-auto object-contain" style={{filter: 'invert(1) brightness(0.85)'}} />
        </div>
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 text-sidebar-foreground/85 hover:text-sidebar-foreground text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-white/30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-bold text-foreground text-sm">CONNECTUS</span>
        </div>
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="inline-flex items-center justify-center rounded-xl border border-border/60 h-10 w-10 min-h-[44px] min-w-[44px] bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all"
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-[#0b2024] to-[#152d32] border-r border-white/8 shadow-[8px_0_32px_rgba(7,24,27,0.32)]">
        {renderSidebar()}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] flex flex-col bg-gradient-to-b from-[#0b2024] to-[#152d32] border-r border-white/8 shadow-[8px_0_32px_rgba(7,24,27,0.4)] transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebar()}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="min-h-full p-3 sm:p-4 lg:p-6">
            <div className="rounded-2xl border border-white/50 bg-white/60 shadow-[0_8px_40px_rgba(20,44,50,0.08)] min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
