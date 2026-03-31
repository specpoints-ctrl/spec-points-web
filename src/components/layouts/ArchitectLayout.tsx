import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, TrendingUp, FileText, Menu, X } from 'lucide-react';
import { auth } from '../../lib/firebase';

export const ArchitectLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const user = auth.currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: TrendingUp, label: 'Meus Pontos', path: '/points' },
    { icon: FileText, label: 'Relatórios', path: '/reports' },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">SpecPoints</h1>
        <p className="text-sm text-muted-foreground">Arquiteto</p>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-6 py-3 transition min-h-[44px] ${
              isActive(item.path)
                ? 'bg-primary text-primary-foreground border-l-4 border-primary'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-border">
        <div className="text-sm text-muted-foreground mb-4">
          <p className="truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center justify-center bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold py-2 rounded transition min-h-[44px]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <span className="font-semibold text-primary">SpecPoints</span>
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md border border-border h-10 w-10 min-h-[44px] min-w-[44px]"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      <aside className="hidden lg:flex w-56 bg-background border-r border-border shadow-lg flex-col">
        <SidebarContent />
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-background border-r border-border shadow-xl flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="flex-1 overflow-auto bg-background pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
};
