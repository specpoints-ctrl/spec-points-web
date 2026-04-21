import { useEffect, useState } from 'react';
import { Send, Trash2, Loader2, Megaphone, Tag, Info, Users, Store, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  createNotification,
  deleteNotification,
  getAdminNotifications,
  Notification,
} from '../lib/api';
import { Badge, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

const TYPE_OPTIONS = [
  { value: 'general', label: 'General', icon: Info },
  { value: 'offer', label: 'Oferta', icon: Tag },
  { value: 'campaign', label: 'Campaña', icon: Megaphone },
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'Todos', icon: Globe },
  { value: 'architect', label: 'Arquitectos', icon: Users },
  { value: 'lojista', label: 'Comerciantes', icon: Store },
];

const TYPE_BADGE: Record<string, 'default' | 'warning' | 'secondary'> = {
  offer: 'warning',
  campaign: 'default',
  general: 'secondary',
};

const TARGET_BADGE: Record<string, 'success' | 'default' | 'secondary'> = {
  all: 'success',
  architect: 'default',
  lojista: 'secondary',
};

type Tab = 'send' | 'history';

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<Tab>('send');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [targetRole, setTargetRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getAdminNotifications();
      if (res.success && res.data) setHistory(res.data);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await createNotification({ title: title.trim(), message: message.trim(), type, target_role: targetRole });
      if (res.success) {
        setSuccess('¡Notificación enviada con éxito!');
        setTitle('');
        setMessage('');
        setType('general');
        setTargetRole('all');
      } else {
        setError(res.error ?? 'Error al enviar notificación');
      }
    } catch {
      setError('Error al enviar notificación');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    await deleteNotification(id);
    setHistory((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Notificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">Envíe ofertas y campañas a arquitectos y comerciantes</p>
      </div>

      <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/30 w-fit">
        {(['send', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
              tab === t
                ? 'bg-white shadow-sm text-foreground border border-border/40'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t === 'send' ? 'Enviar' : 'Historial'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Nueva Notificación</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm mb-4 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</label>
                <div className="flex gap-2 flex-wrap">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={[
                          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200',
                          type === opt.value
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'border-border/50 bg-white/60 text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Destinatarios</label>
                <div className="flex gap-2 flex-wrap">
                  {TARGET_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTargetRole(opt.value)}
                        className={[
                          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200',
                          targetRole === opt.value
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'border-border/50 bg-white/60 text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="Ej: Promoción de abril"
                  className="w-full px-4 py-3 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Mensaje</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Escriba el mensaje de la notificación..."
                  className="w-full px-4 py-3 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-[hsl(var(--primary)/0.82)] text-primary-foreground text-sm font-bold shadow-btn-primary hover:shadow-btn-hover hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none border-t border-white/15"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando...' : 'Enviar notificación'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
              <Megaphone className="w-8 h-8 opacity-30" />
              <p className="text-sm">Ninguna notificación enviada aún</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-semibold max-w-xs">
                      <p className="truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_BADGE[n.type] ?? 'secondary'}>
                        {TYPE_OPTIONS.find((t) => t.value === n.type)?.label ?? n.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TARGET_BADGE[n.target_role] ?? 'default'}>
                        {TARGET_OPTIONS.find((t) => t.value === n.target_role)?.label ?? n.target_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{relativeTime(n.created_at)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
