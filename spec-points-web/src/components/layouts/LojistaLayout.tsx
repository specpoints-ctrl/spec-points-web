import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, BarChart3, Bell, Settings, Menu, X } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useProfile } from '../../contexts/ProfileContext';
import { resolveAssetUrl } from '../../lib/api';

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
    <defs>
      <linearGradient id="lg-c" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff3cc" />
        <stop offset="28%" stopColor="#f0c060" />
        <stop offset="65%" stopColor="#c8902a" />
        <stop offset="100%" stopColor="#8b5e1a" />
      </linearGradient>
      <radialGradient id="lg-glow-c" cx="42%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#ffe8a0" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#c8902a" stopOpacity="0" />
      </radialGradient>
      <filter id="lg-drop-c" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#d4a020" floodOpacity="0.55" />
      </filter>
    </defs>
    <circle cx="16" cy="16" r="14" fill="url(#lg-glow-c)" />
    <polygon points="16,3 27,9.5 27,22.5 16,29 5,22.5 5,9.5"
      fill="none" stroke="url(#lg-c)" strokeWidth="1.1" filter="url(#lg-drop-c)" />
    <polygon points="16,8.5 22,12 22,20 16,23.5 10,20 10,12"
      fill="url(#lg-c)" opacity="0.16" />
    <circle cx="16" cy="16" r="3" fill="url(#lg-c)" filter="url(#lg-drop-c)" />
    <circle cx="15.1" cy="15.1" r="1.1" fill="#fff8e0" opacity="0.75" />
  </svg>
);

const menuItems = [
  { icon: Home,     label: 'Dashboard',      path: '/' },
  { icon: BarChart3,label: 'Ventas',         path: '/sales' },
  { icon: Bell,     label: 'Notificaciones', path: '/notifications' },
  { icon: Settings, label: 'Configuraciones',path: '/settings' },
];

export const LojistaLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const user = auth.currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const initial = ((profile?.display_name || user?.email || 'L')[0] ?? 'L').toUpperCase();

  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-xl font-extrabold text-gradient-gold leading-none tracking-widest">CONNECTUS</h1>
            <p className="text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/45 mt-1 font-medium">Comerciante</p>
          </div>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#d4a574]/25 to-transparent" />
      </div>

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
            <span className="flex-1">{item.label}</span>
            {item.path === '/notifications' && unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-sidebar-accent to-[#c4956a] flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img src={resolveAssetUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
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
          Salir
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-white/30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-bold text-sm">CONNECTUS</span>
        </div>
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="inline-flex items-center justify-center rounded-xl border border-border/60 h-10 w-10 min-h-[44px] min-w-[44px] bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-[#0b2024] to-[#152d32] border-r border-white/8 shadow-[8px_0_32px_rgba(7,24,27,0.32)]">
        {renderSidebar()}
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] flex flex-col bg-gradient-to-b from-[#0b2024] to-[#152d32] border-r border-white/8 shadow-xl transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebar()}
      </aside>

      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="min-h-full p-3 sm:p-4 lg:p-6">
          <div className="rounded-2xl border border-white/50 bg-white/40  shadow-[0_8px_40px_rgba(20,44,50,0.08)] min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
