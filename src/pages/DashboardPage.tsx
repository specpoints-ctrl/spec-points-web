import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Award, Star, ArrowUpRight, Zap, Store, MapPin, Phone } from 'lucide-react';
import { BackendUserProfile, getMyArchitectProfile, getMySales, getMyActiveCampaigns, getActiveStoresList, ArchitectProfile, MyCampaign, ActiveStore } from '../lib/api';
import { AdminDashboard } from '../components/AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';

interface DashboardPageProps {
  profile: BackendUserProfile | null;
  onLogout: () => Promise<void>;
}

function ArchitectDashboard() {
  const [architect, setArchitect] = useState<ArchitectProfile | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<MyCampaign[]>([]);
  const [stores, setStores] = useState<ActiveStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getMyArchitectProfile(), getMySales(), getMyActiveCampaigns(), getActiveStoresList()])
      .then(([archResult, salesResult, campResult, storesResult]) => {
        if (archResult.status === 'fulfilled' && archResult.value.success && archResult.value.data)
          setArchitect(archResult.value.data);
        if (salesResult.status === 'fulfilled' && salesResult.value.success && salesResult.value.data)
          setSales(salesResult.value.data);
        if (campResult.status === 'fulfilled' && campResult.value.success && campResult.value.data)
          setCampaigns(campResult.value.data);
        if (storesResult.status === 'fulfilled' && storesResult.value.success && storesResult.value.data)
          setStores(storesResult.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const available = (architect?.points_total ?? 0) - (architect?.points_redeemed ?? 0);
  const totalSalesValue = sales.reduce((acc, s) => acc + parseFloat(s.amount_usd ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2024] via-[#0e3a40] to-[#1a4a4f] p-6 sm:p-8 shadow-[0_24px_56px_rgba(7,24,27,0.38)]">
        <div className="dot-pattern absolute inset-0 opacity-30" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[hsl(var(--sidebar-accent)/0.10)] blur-3xl" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Mi Panel</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            ¡Hola, {architect?.name?.split(' ')[0] ?? 'Arquitecto'}!
          </h1>
          <p className="text-white/50 text-sm mt-1">Siga sus puntos y ventas en tiempo real.</p>

          <div className="mt-6 inline-flex items-center gap-4 bg-white/10 border border-white/15 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--sidebar-accent))] to-[#c4956a] flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Puntos disponibles</p>
              <p className="text-3xl font-extrabold text-white tabular-nums leading-none mt-0.5">
                {available.toLocaleString('es-PY')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total de puntos',
            value: (architect?.points_total ?? 0).toLocaleString('es-PY'),
            icon: TrendingUp,
            bg: 'bg-gradient-to-br from-teal-500 to-emerald-400',
            shadow: 'shadow-[0_8px_24px_rgba(20,184,166,0.25)]',
          },
          {
            label: 'Puntos canjeados',
            value: (architect?.points_redeemed ?? 0).toLocaleString('es-PY'),
            icon: Award,
            bg: 'bg-gradient-to-br from-violet-500 to-indigo-400',
            shadow: 'shadow-[0_8px_24px_rgba(139,92,246,0.25)]',
          },
          {
            label: 'Ventas registradas',
            value: sales.length.toLocaleString('es-PY'),
            icon: ShoppingCart,
            bg: 'bg-gradient-to-br from-orange-500 to-amber-400',
            shadow: 'shadow-[0_8px_24px_rgba(249,115,22,0.25)]',
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl bg-white/72 border border-white/55 backdrop-blur-md p-5 shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.shadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-extrabold text-foreground mt-1 tabular-nums">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {campaigns.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Campañas Activas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl border border-amber-200/50 bg-amber-50/60">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{c.title}</p>
                  {c.subtitle && <p className="text-xs text-muted-foreground truncate">{c.subtitle}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hasta {new Date(c.end_date).toLocaleDateString('es-PY')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-extrabold text-amber-600">{Number(c.points_earned || 0).toLocaleString('es-PY')}</p>
                  <p className="text-xs text-muted-foreground">pts ganados</p>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                    <Zap className="w-3 h-3" />{c.points_multiplier}x pts/$
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stores.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-teal-500" /> Tiendas Asociadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stores.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-white/50 hover:bg-white/80 transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {s.logo_url
                    ? <img src={s.logo_url} alt="" className="w-full h-full object-cover" />
                    : <Store className="w-5 h-5 text-teal-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                  {s.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{s.city}
                    </p>
                  )}
                  {s.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />{s.phone}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mis Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
              <ShoppingCart className="w-8 h-8 opacity-30" />
              <p className="text-sm">Ninguna venta registrada aún</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sales.slice(0, 8).map((sale, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-white/50 hover:bg-white/80 transition-all">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{sale.store_name ?? 'Tienda'}</p>
                    <p className="text-xs text-muted-foreground">{sale.client_name ?? 'Cliente'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">+{parseInt(sale.points_generated ?? 0).toLocaleString('es-PY')} pts</p>
                    <p className="text-[11px] text-muted-foreground">US${parseFloat(sale.amount_usd ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sales.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Total en ventas</p>
              <p className="text-sm font-bold text-foreground tabular-nums">US${totalSalesValue.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LojistaDashboard({ profile }: { profile: BackendUserProfile | null }) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2024] via-[#0e3a40] to-[#1a4a4f] p-6 sm:p-8 shadow-[0_24px_56px_rgba(7,24,27,0.38)]">
        <div className="dot-pattern absolute inset-0 opacity-30" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[hsl(var(--sidebar-accent)/0.10)] blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
              <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live" />
              Activo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">¡Bienvenido, Comerciante!</h1>
          <p className="text-white/50 text-sm mt-1 max-w-md">
            Su panel de control CONNECTUS. Siga las ventas y especificaciones de los arquitectos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Correo', value: profile?.email ?? '—' },
              { label: 'Estado', value: 'Activo' },
              { label: 'Perfil', value: 'Comerciante' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/[0.04]">
        <div className="p-3 rounded-xl bg-primary/10">
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Registre ventas</p>
          <p className="text-xs text-muted-foreground">Cada venta genera puntos para los arquitectos asociados</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ profile }: DashboardPageProps) {
  const userRole = profile?.role ?? profile?.user_roles?.[0]?.role ?? 'architect';

  if (userRole === 'admin') return <AdminDashboard />;
  if (userRole === 'architect') return <ArchitectDashboard />;
  if (userRole === 'lojista') return <LojistaDashboard profile={profile} />;

  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <p className="text-muted-foreground text-sm">Cargando perfil...</p>
    </div>
  );
}
