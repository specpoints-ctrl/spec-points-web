import { useEffect, useState } from 'react';
import { api, getMyActiveCampaigns, getMyRedemptions, requestRedemption, MyCampaign } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '../components/ui';
import {
  Gift, Star, ShoppingBag, Zap, Clock, CheckCircle2,
  Package, AlertCircle, Loader2, Calendar, Trophy, Sparkles, Phone,
} from 'lucide-react';

interface Prize {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  points_required: number;
  stock: number;
  active: boolean;
}

interface Redemption {
  id: number;
  prize_name: string;
  prize_image?: string;
  points_required: number;
  status: 'pending' | 'approved' | 'delivered';
  deadline_at?: string;
  delivered_at?: string;
  created_at: string;
}

interface ArchitectProfile {
  points_total: number;
  points_redeemed: number;
}

const statusMap = {
  pending: { label: 'En espera', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', icon: Package },
};

export default function PointsStorePage() {
  const [archProfile, setArchProfile] = useState<ArchitectProfile | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [campaigns, setCampaigns] = useState<MyCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const [celebrationPrize, setCelebrationPrize] = useState<Prize | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [archRes, prizesRes, redemptionsRes, campaignsRes] = await Promise.all([
        api.get('/architects/me'),
        api.get('/prizes/active'),
        getMyRedemptions(),
        getMyActiveCampaigns(),
      ]);

      if (archRes.data?.success) setArchProfile(archRes.data.data);
      if (prizesRes.data?.success) setPrizes(prizesRes.data.data || []);
      if (redemptionsRes.success) setRedemptions(redemptionsRes.data || []);
      if (campaignsRes.success) setCampaigns(campaignsRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const availablePoints = (archProfile?.points_total || 0) - (archProfile?.points_redeemed || 0);

  async function handleRequestRedemption() {
    if (!selectedPrize) return;
    setRequesting(true); setReqError(null);
    try {
      const res = await requestRedemption(selectedPrize.id);
      if (res.success) {
        const prize = selectedPrize;
        setSelectedPrize(null);
        await loadAll();
        setCelebrationPrize(prize);
      } else {
        setReqError(res.error || 'Error al solicitar canje');
      }
    } catch (e: any) {
      setReqError(e?.response?.data?.error || e.message || 'Error al solicitar canje');
    } finally {
      setRequesting(false);
    }
  }

  const canRedeem = (prize: Prize) => availablePoints >= prize.points_required && prize.stock > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Tienda de Puntos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Canjee sus puntos por premios exclusivos</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-6 flex items-center gap-5"
            style={{ background: 'linear-gradient(135deg,#071519 0%,#0b2228 60%,#134e56 100%)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(196,181,160,0.15)' }}>
              <Star className="w-8 h-8" style={{ color: '#c4b5a0' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'rgba(196,181,160,0.6)' }}>Puntos disponibles</p>
              <p className="text-4xl font-extrabold text-white tracking-tight">
                {availablePoints.toLocaleString('es-PY')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(196,181,160,0.5)' }}>
                {(archProfile?.points_total || 0).toLocaleString('es-PY')} ganados · {(archProfile?.points_redeemed || 0).toLocaleString('es-PY')} canjeados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {campaigns.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Campañas Activas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campaigns.map(c => (
              <Card key={c.id} className="border-amber-200/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 shrink-0">
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
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                      <Zap className="w-3 h-3" />{c.points_multiplier}x pts/$
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" /> Premios Disponibles
        </h2>
        {prizes.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-muted-foreground gap-2">
              <Gift className="w-8 h-8 opacity-30" />
              <p>Ningún premio disponible por el momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map(prize => {
              const can = canRedeem(prize);
              return (
                <Card key={prize.id} className={`overflow-hidden transition-all ${can ? 'hover:shadow-md' : 'opacity-70'}`}>
                  {prize.image_url ? (
                    <div className="h-40 overflow-hidden bg-muted">
                      <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Gift className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground text-sm">{prize.name}</h3>
                    {prize.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prize.description}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-lg font-extrabold text-primary">{Number(prize.points_required).toLocaleString('es-PY')}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Stock: {prize.stock}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedPrize(prize); setReqError(null); setReqSuccess(null); }}
                      disabled={!can}
                      className="w-full mt-3 h-9 rounded-xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                      style={can ? {
                        background: 'linear-gradient(135deg,#0b6e78,#134e56)',
                        color: 'white',
                      } : {
                        background: 'rgba(0,0,0,0.05)',
                        color: '#9ca3af',
                      }}
                    >
                      {!can && availablePoints < prize.points_required
                        ? `Faltan ${(prize.points_required - availablePoints).toLocaleString('es-PY')} pts`
                        : !can && prize.stock <= 0
                        ? 'Sin stock'
                        : 'Canjear'}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" /> Mis Canjes
        </h2>
        {redemptions.length === 0 ? (
          <Card>
            <CardContent className="py-8 flex flex-col items-center text-muted-foreground gap-2">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <p>Ningún canje solicitado aún</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {redemptions.map(r => {
                  const s = statusMap[r.status] || statusMap.pending;
                  const Icon = s.icon;
                  return (
                    <div key={r.id} className="flex items-center gap-4 p-4">
                      {r.prize_image ? (
                        <img src={r.prize_image} alt={r.prize_name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Gift className="w-6 h-6 text-primary/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{r.prize_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(r.points_required).toLocaleString('es-PY')} puntos · {new Date(r.created_at).toLocaleDateString('es-PY')}
                        </p>
                        {r.deadline_at && r.status !== 'delivered' && (
                          <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />Plazo: {new Date(r.deadline_at).toLocaleDateString('es-PY')}
                          </p>
                        )}
                        {r.delivered_at && (
                          <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />Entregado el: {new Date(r.delivered_at).toLocaleDateString('es-PY')}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                        <Icon className="w-3.5 h-3.5" />{s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedPrize} onOpenChange={open => !open && setSelectedPrize(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" /> Confirmar Canje
            </DialogTitle>
          </DialogHeader>
          {selectedPrize && (
            <div className="space-y-4 pt-2">
              {selectedPrize.image_url && (
                <img src={selectedPrize.image_url} alt={selectedPrize.name}
                  className="w-full h-40 object-cover rounded-xl" />
              )}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                <p className="font-bold text-foreground text-lg">{selectedPrize.name}</p>
                <p className="text-2xl font-extrabold text-primary mt-1">
                  {Number(selectedPrize.points_required).toLocaleString('es-PY')} pts
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tras el canje: {(availablePoints - selectedPrize.points_required).toLocaleString('es-PY')} pts restantes
                </p>
              </div>

              {reqError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{reqError}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                El administrador aprobará y entregará el premio. Plazo de 30 días para retiro.
              </p>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setSelectedPrize(null)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleRequestRedemption} disabled={requesting}>
                  {requesting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Enviando...</> : 'Confirmar Canje'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Celebration dialog */}
      <Dialog open={!!celebrationPrize} onOpenChange={open => !open && setCelebrationPrize(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0">
          {celebrationPrize && (
            <div className="relative">
              {/* Gold gradient header */}
              <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
                style={{ background: 'linear-gradient(135deg,#071519 0%,#0e2e35 50%,#1a4a4f 100%)' }}>
                {/* Sparkle dots */}
                <span className="absolute top-4 left-8 text-[#f0c060] text-xl animate-bounce" style={{animationDelay:'0s'}}>✦</span>
                <span className="absolute top-6 right-10 text-[#d4a574] text-sm animate-bounce" style={{animationDelay:'0.3s'}}>✦</span>
                <span className="absolute bottom-4 left-12 text-[#f0c060] text-xs animate-bounce" style={{animationDelay:'0.6s'}}>✦</span>
                <span className="absolute bottom-6 right-8 text-[#d4a574] text-base animate-bounce" style={{animationDelay:'0.15s'}}>✦</span>
                <span className="absolute top-10 left-1/4 text-[#f7b871] text-xs animate-bounce" style={{animationDelay:'0.45s'}}>✦</span>

                {/* Trophy icon */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 mx-auto"
                  style={{ background: 'linear-gradient(135deg,#f0c060,#c8902a)', boxShadow: '0 0 32px rgba(240,192,96,0.4)' }}>
                  <Trophy className="w-10 h-10 text-[#071519]" />
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-1">¡Felicitaciones!</h2>
                <p className="text-sm font-medium" style={{color:'rgba(240,192,96,0.85)'}}>
                  Tu solicitud de canje fue enviada
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4 bg-white">
                {/* Prize card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#f0c060,#c8902a)' }}>
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{celebrationPrize.name}</p>
                    <p className="text-xs text-amber-700 font-semibold">
                      {Number(celebrationPrize.points_required).toLocaleString('es-PY')} puntos canjeados
                    </p>
                  </div>
                </div>

                {/* What happens next */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">¿Qué sigue?</p>
                  <div className="space-y-2">
                    {[
                      { icon: CheckCircle2, color: 'text-emerald-500', text: 'Tu solicitud fue registrada con éxito' },
                      { icon: Phone, color: 'text-blue-500', text: 'El administrador se pondrá en contacto contigo' },
                      { icon: Package, color: 'text-amber-500', text: 'Tienes 30 días para retirar tu premio' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <step.icon className={`w-4 h-4 shrink-0 mt-0.5 ${step.color}`} />
                        <p className="text-sm text-muted-foreground">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setCelebrationPrize(null)}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#0b6e78,#134e56)' }}
                >
                  <Sparkles className="w-4 h-4 inline mr-1.5" />
                  ¡Entendido!
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
