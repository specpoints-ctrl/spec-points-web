import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Store, ShoppingCart, Gift, RotateCcw, Settings, Menu, X, CheckCircle } from 'lucide-react';
import { auth } from '../../lib/firebase';

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const user = auth.currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Arquitetos', path: '/architects' },
    { icon: Store, label: 'Lojas', path: '/stores' },
    { icon: ShoppingCart, label: 'Vendas', path: '/sales' },
    { icon: Gift, label: 'Prêmios', path: '/prizes' },
    { icon: RotateCcw, label: 'Resgates', path: '/redemptions' },
    { icon: CheckCircle, label: 'Aprovações', path: '/approvals' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10 bg-white/5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/70">Painel</p>
        <h1 className="text-2xl font-extrabold text-sidebar-foreground">SpecPoints</h1>
        <p className="text-sm text-sidebar-foreground/70">Administrativo</p>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mx-3 mb-1.5 flex items-center rounded-xl px-4 py-3 transition-all min-h-[44px] ${
              isActive(item.path)
                ? 'bg-sidebar-accent text-slate-900 shadow-[0_8px_20px_rgba(247,184,113,0.35)]'
                : 'text-sidebar-foreground/85 hover:bg-white/10 hover:text-sidebar-foreground'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10 bg-white/5">
        <div className="text-sm text-sidebar-foreground/80 mb-4">
          <p className="truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center justify-center bg-white/10 text-sidebar-foreground hover:bg-white/20 font-semibold py-2.5 rounded-xl transition min-h-[44px]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/90 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <span className="font-bold text-foreground">SpecPoints</span>
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-xl border border-border h-10 w-10 min-h-[44px] min-w-[44px] bg-background"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/60" onClick={() => setMobileOpen(false)} />}

      <aside className="hidden lg:flex w-72 bg-sidebar-background border-r border-white/10 shadow-[10px_0_30px_rgba(7,24,27,0.28)] flex-col">
        <SidebarContent />
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-sidebar-background border-r border-white/10 shadow-xl flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="flex-1 overflow-auto bg-transparent pt-14 lg:pt-0">
        <div className="min-h-full p-3 sm:p-4 lg:p-6">
          <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md shadow-[0_20px_50px_rgba(30,63,69,0.1)] min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
