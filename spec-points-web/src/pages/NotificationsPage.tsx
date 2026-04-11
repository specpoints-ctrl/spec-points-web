import { useEffect, useState } from 'react';
import { Bell, BellOff, Megaphone, Tag, Info, CheckCheck } from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from '../lib/api';
import { useNotifications } from '../contexts/NotificationsContext';
import { Badge } from '../components/ui';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

const TYPE_CONFIG = {
  offer: { label: 'Oferta', icon: Tag, variant: 'warning' as const },
  campaign: { label: 'Campanha', icon: Megaphone, variant: 'default' as const },
  general: { label: 'Geral', icon: Info, variant: 'secondary' as const },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCount } = useNotifications();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success && res.data) setNotifications(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    refreshCount();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshCount();
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread > 0 ? `${unread} não ${unread === 1 ? 'lida' : 'lidas'}` : 'Tudo em dia'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-white/70 backdrop-blur-sm text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/90 transition-all duration-200"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <BellOff className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium">Nenhuma notificação</p>
          <p className="text-xs">Você receberá ofertas e campanhas aqui</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.general;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={[
                  'group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200',
                  n.is_read
                    ? 'border-border/40 bg-white/50 backdrop-blur-sm'
                    : 'border-primary/30 bg-primary/[0.04] cursor-pointer hover:bg-primary/[0.07]',
                ].join(' ')}
              >
                {/* Icon */}
                <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${n.is_read ? 'bg-muted/60' : 'bg-primary/10'}`}>
                  <Icon className={`w-4 h-4 ${n.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${n.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className="text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</span>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 leading-relaxed ${n.is_read ? 'text-muted-foreground' : 'text-foreground/80'}`}>
                    {n.message}
                  </p>
                  {!n.is_read && (
                    <p className="text-[11px] text-primary/70 mt-2 font-medium">Clique para marcar como lida</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
