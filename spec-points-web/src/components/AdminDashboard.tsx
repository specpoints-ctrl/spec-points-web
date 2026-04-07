import { useEffect, useState } from 'react';
import { Users, Store, ShoppingCart, TrendingUp, Award, ArrowUpRight } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '../lib/api';
import { auth } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui';

const MEDAL_COLORS = [
  { ring: 'ring-[#FFD700]', bg: 'bg-gradient-to-br from-[#FFF3B0] to-[#FFD700]/40', text: 'text-[#B8860B]', label: '🥇' },
  { ring: 'ring-slate-400',  bg: 'bg-gradient-to-br from-slate-100 to-slate-300/50',  text: 'text-slate-600',  label: '🥈' },
  { ring: 'ring-amber-600',  bg: 'bg-gradient-to-br from-amber-50 to-amber-200/50',   text: 'text-amber-700',  label: '🥉' },
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

function getInitial(name: string) {
  return (name ?? '?')[0].toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-teal-500 to-emerald-400',
  'from-violet-500 to-indigo-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
  'from-sky-500 to-cyan-400',
];

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const response = await getDashboardStats(token);
          if (response.success && response.data) setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Carregando dados...</p>
      </div>
    );
  }

  const kpiCards = [
    {
      icon: Users,
      label: 'Arquitetos',
      value: stats?.architects ?? 0,
      iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-400',
      shadow: 'shadow-[0_8px_24px_rgba(20,184,166,0.25)]',
      trend: '+12%',
    },
    {
      icon: Store,
      label: 'Lojas Parceiras',
      value: stats?.stores ?? 0,
      iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-400',
      shadow: 'shadow-[0_8px_24px_rgba(139,92,246,0.25)]',
      trend: '+5%',
    },
    {
      icon: ShoppingCart,
      label: 'Total de Vendas',
      value: stats?.sales ?? 0,
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-400',
      shadow: 'shadow-[0_8px_24px_rgba(249,115,22,0.25)]',
      trend: '+24%',
    },
    {
      icon: TrendingUp,
      label: 'Pontos Emitidos',
      value: stats?.totalPoints ?? 0,
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-400',
      shadow: 'shadow-[0_8px_24px_rgba(244,63,94,0.25)]',
      trend: '+18%',
    },
  ];

  const topArchitects = stats?.topArchitects ?? [];
  const maxPoints = topArchitects[0]?.total_points ?? 1;

  const recentSales = stats?.recentSales ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2024] via-[#0e3a40] to-[#1a4a4f] p-6 sm:p-8 shadow-[0_24px_56px_rgba(7,24,27,0.38)]">
        {/* dot pattern */}
        <div className="dot-pattern absolute inset-0 opacity-30" />
        {/* glow orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[hsl(var(--sidebar-accent)/0.12)] blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live" />
                Live
              </span>
              <span className="text-white/40 text-[11px] uppercase tracking-widest">Visão Geral</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Dashboard Administrativo
            </h1>
            <p className="mt-2 text-white/55 text-sm max-w-md">
              Indicadores em tempo real, performance comercial e evolução do programa de pontos.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-white/8 border border-white/12 rounded-xl px-4 py-3">
            <Award className="w-5 h-5 text-[hsl(var(--sidebar-accent))]" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Total de Pontos</p>
              <p className="text-lg font-extrabold text-white tabular-nums">
                {(stats?.totalPoints ?? 0).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl bg-white/72 border border-white/55 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover shadow-card"
            >
              {/* subtle top-right gradient accent */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-xl" />
              <div className="relative flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.shadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  {card.trend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tabular-nums">
                  {card.value.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Architects — Ranking Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Top Arquitetos</CardTitle>
          </CardHeader>
          <CardContent>
            {topArchitects.length > 0 ? (
              <div className="space-y-3">
                {topArchitects.map((arch, idx) => {
                  const pct = Math.round((arch.total_points / maxPoints) * 100);
                  const medal = MEDAL_COLORS[idx] ?? null;
                  return (
                    <div key={idx} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all duration-200">
                      {/* rank badge */}
                      <div className={`w-8 h-8 rounded-full ring-1 flex items-center justify-center shrink-0 text-sm ${medal ? `${medal.ring} ${medal.bg}` : 'bg-muted ring-border'}`}>
                        {medal ? (
                          <span className="text-sm leading-none">{medal.label}</span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{arch.name}</p>
                          <p className="text-sm font-bold text-primary tabular-nums shrink-0 ml-2">
                            {arch.total_points.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--sidebar-accent))] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">Nenhum arquiteto cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {recentSales.map((sale, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:border-border/70 transition-all duration-200"
                  >
                    {/* architect avatar */}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-bold text-white">{getInitial(sale.architect_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{sale.architect_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{sale.store_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-600 tabular-nums">+{sale.points_generated.toLocaleString('pt-BR')} pts</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {sale.created_at ? relativeTime(sale.created_at) : `US$${Number(sale.value).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 opacity-30" />
                <p className="text-sm">Nenhuma venda registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
