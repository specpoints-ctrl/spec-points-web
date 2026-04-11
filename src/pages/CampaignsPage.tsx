import { useEffect, useState } from 'react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Input, ImageUploader,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui';
import {
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getCampaignRanking, Campaign, CampaignPayload, CampaignPrize,
} from '../lib/api';
import {
  Plus, Edit2, Trash2, Trophy, Target, BarChart2, Calendar,
  Zap, ChevronDown, ChevronUp, X, Medal,
} from 'lucide-react';

const emptyForm = (): CampaignPayload => ({
  title: '',
  subtitle: '',
  focus: 'all',
  points_multiplier: 1,
  start_date: '',
  end_date: '',
  active: true,
  prizes: [],
});

const emptyPrize = (): CampaignPrize => ({
  name: '',
  points_required: 0,
  stock: 0,
  image_url: '',
});

function focusLabel(focus: string) {
  return focus === 'architect' ? 'Arquitetos' : focus === 'lojista' ? 'Lojistas' : 'Todos';
}

function focusBadge(focus: string) {
  const map: Record<string, string> = {
    architect: 'bg-blue-100 text-blue-700',
    lojista: 'bg-purple-100 text-purple-700',
    all: 'bg-emerald-100 text-emerald-700',
  };
  return map[focus] || 'bg-gray-100 text-gray-700';
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ranking modal
  const [rankingOpen, setRankingOpen] = useState(false);
  const [rankingData, setRankingData] = useState<{ campaign: Campaign; ranking: any[] } | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Stats
  const total = campaigns.length;
  const active = campaigns.filter(c => c.active && new Date(c.end_date) >= new Date()).length;
  const ended = campaigns.filter(c => !c.active || new Date(c.end_date) < new Date()).length;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getCampaigns();
      if (res.success) setCampaigns(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm());
    setEditingId(null);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(c: Campaign) {
    setForm({
      title: c.title,
      subtitle: c.subtitle || '',
      focus: c.focus,
      points_multiplier: c.points_multiplier,
      start_date: c.start_date.slice(0, 10),
      end_date: c.end_date.slice(0, 10),
      active: c.active,
      prizes: c.prizes || [],
    });
    setEditingId(c.id);
    setError(null);
    setDialogOpen(true);
  }

  function addPrize() {
    setForm(f => ({ ...f, prizes: [...(f.prizes || []), emptyPrize()] }));
  }

  function updatePrize(idx: number, field: keyof CampaignPrize, value: string | number) {
    setForm(f => {
      const prizes = [...(f.prizes || [])];
      prizes[idx] = { ...prizes[idx], [field]: value };
      return { ...f, prizes };
    });
  }

  function removePrize(idx: number) {
    setForm(f => ({ ...f, prizes: (f.prizes || []).filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      if (editingId) {
        await updateCampaign(editingId, form);
      } else {
        await createCampaign(form);
      }
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Erro ao salvar campanha');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta campanha?')) return;
    try {
      await deleteCampaign(id);
      await load();
    } catch {
      alert('Erro ao excluir campanha');
    }
  }

  async function handleRanking(c: Campaign) {
    setRankingLoading(true); setRankingOpen(true); setRankingData(null);
    try {
      const res = await getCampaignRanking(c.id);
      if (res.success && res.data) setRankingData(res.data);
    } finally {
      setRankingLoading(false);
    }
  }

  const isActive = (c: Campaign) => c.active && new Date(c.end_date) >= new Date();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie campanhas com multiplicadores de pontos e prêmios exclusivos</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, icon: Target, color: '#0b6e78' },
          { label: 'Ativas', value: active, icon: Zap, color: '#10b981' },
          { label: 'Encerradas', value: ended, icon: BarChart2, color: '#6b7280' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Lista de Campanhas</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Carregando...</div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Trophy className="w-8 h-8 opacity-30" />
              <p>Nenhuma campanha cadastrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Foco</TableHead>
                  <TableHead>Multiplicador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prêmios</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{c.title}</p>
                        {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${focusBadge(c.focus)}`}>
                        {focusLabel(c.focus)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                        <Zap className="w-3 h-3" />{c.points_multiplier}x pts/$
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        <p>{new Date(c.start_date).toLocaleDateString('pt-BR')}</p>
                        <p>até {new Date(c.end_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(c) ? 'default' : 'secondary'}>
                        {isActive(c) ? 'Ativa' : 'Encerrada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{c.prize_count ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleRanking(c)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Ver ranking">
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Título *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Campanha Verão 2026" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Subtítulo</label>
                <Input value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Descrição curta da campanha" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Foco</label>
                <select value={form.focus} onChange={e => setForm(f => ({ ...f, focus: e.target.value as any }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-all">
                  <option value="all">Todos</option>
                  <option value="architect">Arquitetos</option>
                  <option value="lojista">Lojistas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Multiplicador (pontos por $)
                </label>
                <Input type="number" min="0.1" step="0.1"
                  value={form.points_multiplier}
                  onChange={e => setForm(f => ({ ...f, points_multiplier: parseFloat(e.target.value) || 1 }))}
                  placeholder="1.0" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Data de Início *</label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Data de Fim *</label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="active-toggle" checked={form.active ?? true}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <label htmlFor="active-toggle" className="text-sm text-foreground cursor-pointer">Campanha ativa</label>
              </div>
            </div>

            {/* Prizes section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-foreground">Prêmios da Campanha</label>
                <button onClick={addPrize}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Adicionar Prêmio
                </button>
              </div>

              {(form.prizes || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhum prêmio adicionado
                </div>
              ) : (
                <div className="space-y-3">
                  {(form.prizes || []).map((prize, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prêmio {idx + 1}</span>
                        <button onClick={() => removePrize(idx)}
                          className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-muted-foreground mb-1">Nome do Produto</label>
                          <Input value={prize.name} onChange={e => updatePrize(idx, 'name', e.target.value)} placeholder="Ex: Cadeira Ergonômica" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Pontos Necessários</label>
                          <Input type="number" min="1" value={prize.points_required || ''}
                            onChange={e => updatePrize(idx, 'points_required', parseInt(e.target.value) || 0)}
                            placeholder="5000" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Estoque</label>
                          <Input type="number" min="0" value={prize.stock || ''}
                            onChange={e => updatePrize(idx, 'stock', parseInt(e.target.value) || 0)}
                            placeholder="10" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-muted-foreground mb-1">Imagem do Produto</label>
                          <ImageUploader
                            folder="prizes"
                            value={prize.image_url}
                            onChange={url => updatePrize(idx, 'image_url', url)}
                            placeholder="Imagem do prêmio"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.start_date || !form.end_date}>
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Campanha'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ranking Dialog */}
      <Dialog open={rankingOpen} onOpenChange={setRankingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Ranking — {rankingData?.campaign.title || '...'}
            </DialogTitle>
          </DialogHeader>
          {rankingLoading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando ranking...</div>
          ) : !rankingData?.ranking.length ? (
            <div className="py-8 text-center text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma venda registrada nesta campanha ainda.</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {rankingData.ranking.map((r, i) => (
                <div key={r.architect_id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground',
                  ].join(' ')}>
                    {i === 0 ? <Medal className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{r.architect_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{Number(r.campaign_points).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
