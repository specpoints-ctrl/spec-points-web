import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { getPendingUsers, approveUser, rejectUser, PendingUser, buildInstagramUrl } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Check, X, Loader, Phone, Mail, Instagram, ChevronDown, ChevronUp, Building2, CreditCard, MapPin } from 'lucide-react';

const parseDateSafe = (value?: string | number | Date | null): Date | null => {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const parsedFromNumber = new Date(value);
    return Number.isNaN(parsedFromNumber.getTime()) ? null : parsedFromNumber;
  }

  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDateSafe = (value?: string | number | Date | null) => {
  const date = parseDateSafe(value);
  if (!date) return 'Sin fecha';
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-PY');
};

const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '');

export default function UserApprovalsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectReason, setShowRejectReason] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const getTokenAndLoad = async () => {
      try {
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          setToken(idToken);
          await loadPendingUsers(idToken);
        }
      } catch {
        setError('Error al autenticar');
      }
    };

    getTokenAndLoad();
  }, []);

  const loadPendingUsers = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPendingUsers(idToken);
      setPendingUsers(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!token) return;

    try {
      setApprovingId(userId);
      await approveUser(token, userId);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      if (expandedId === userId) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar usuario');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!token) return;

    try {
      setRejectingId(userId);
      const reason = rejectReason[userId] || 'Sin motivo especificado';
      await rejectUser(token, userId, reason);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setRejectReason((prev) => ({ ...prev, [userId]: '' }));
      setShowRejectReason(null);
      if (expandedId === userId) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar usuario');
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Aprobaciones de Cuentas</h1>
          <p className="text-gray-600">
            {pendingUsers.length === 0
              ? 'Sin cuentas pendientes'
              : `${pendingUsers.length} cuenta${pendingUsers.length !== 1 ? 's' : ''} pendiente${pendingUsers.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="text-red-800">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}

        {pendingUsers.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">Todas las cuentas han sido revisadas.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map((user) => {
              const displayName = user.role === 'lojista'
                ? (user.store_name || user.display_name || user.email)
                : (user.architect_name || user.display_name || user.email);
              const roleLabel = user.role === 'architect' ? 'Arquitecto' : user.role === 'lojista' ? 'Comerciante' : user.role;
              const instagramUrl = buildInstagramUrl(user.instagram_handle);
              const primaryPhone = user.role === 'lojista' ? user.store_phone : user.architect_phone;
              const secondaryPhone = user.role === 'lojista' ? user.store_office_phone : user.architect_office_phone;

              return (
                <Card key={user.id} className="overflow-hidden hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{roleLabel}</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                          <a href={`mailto:${user.email}`} className="text-sm text-gray-600 hover:text-primary hover:underline inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                          </a>
                          {instagramUrl && (
                            <a
                              href={instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-pink-600 hover:text-pink-700 hover:underline inline-flex items-center gap-1"
                            >
                              <Instagram className="w-3.5 h-3.5" />
                              @{user.instagram_handle}
                            </a>
                          )}
                          {primaryPhone && normalizePhone(primaryPhone) && (
                            <a
                              href={`https://wa.me/${normalizePhone(primaryPhone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {primaryPhone}
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Estado</p>
                            <p className="font-medium text-gray-900">{user.status}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Solicitado</p>
                            <p className="font-medium text-gray-900">{formatDateSafe(user.created_at)}</p>
                          </div>
                          {user.architect_id && (
                            <div>
                              <p className="text-gray-500">ID Arquitecto</p>
                              <p className="font-medium text-gray-900">{user.architect_id}</p>
                            </div>
                          )}
                          {user.store_id && (
                            <div>
                              <p className="text-gray-500">ID Socio</p>
                              <p className="font-medium text-gray-900">{user.store_id}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={approvingId === user.id}
                          className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 transition"
                          title="Aprobar"
                        >
                          {approvingId === user.id ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setShowRejectReason(user.id === showRejectReason ? null : user.id)}
                          disabled={rejectingId === user.id}
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 transition"
                          title="Rechazar"
                        >
                          {rejectingId === user.id ? <Loader className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      {expandedId === user.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {expandedId === user.id ? 'Ocultar detalles' : 'Ver detalles completos'}
                    </button>

                    {expandedId === user.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {user.role === 'architect' ? (
                          <>
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Perfil arquitecto</p>
                              <p className="font-medium text-gray-900 inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-gray-500" />{user.architect_company || '-'}</p>
                              <p className="text-gray-600 mt-1 inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-gray-500" />CI: {user.architect_document_ci || '-'}</p>
                              <p className="text-gray-600 mt-1">RUC: {user.architect_ruc || '-'}</p>
                              <p className="text-gray-600 mt-1">Perfil completo: {user.architect_profile_complete ? 'Sí' : 'No'}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contacto / ubicación</p>
                              <p className="text-gray-600">{user.architect_city || '-'} {user.architect_state ? `- ${user.architect_state}` : ''}</p>
                              {user.architect_address && (
                                <p className="text-gray-600 mt-1 inline-flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-500" />{user.architect_address}</p>
                              )}
                              {secondaryPhone && normalizePhone(secondaryPhone) && (
                                <a href={`https://wa.me/${normalizePhone(secondaryPhone)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-emerald-600 hover:underline mt-1 inline-flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />Oficina: {secondaryPhone}
                                </a>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Empresa / socio exclusivo</p>
                              <p className="font-medium text-gray-900">{user.store_name || '-'}</p>
                              <p className="text-gray-600 mt-1">CNPJ: {user.store_cnpj || '-'}</p>
                              <p className="text-gray-600 mt-1">RUC: {user.store_ruc || '-'}</p>
                              <p className="text-gray-600 mt-1">Perfil completo: {user.store_profile_complete ? 'Sí' : 'No'}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Responsable / contacto</p>
                              <p className="text-gray-900">{user.store_owner_name || '-'}</p>
                              <p className="text-gray-600 mt-1">CI Responsable: {user.store_owner_ci || '-'}</p>
                              <p className="text-gray-600 mt-1">{user.store_city || '-'} {user.store_state ? `- ${user.store_state}` : ''}</p>
                              {user.store_address && (
                                <p className="text-gray-600 mt-1 inline-flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-500" />{user.store_address}</p>
                              )}
                              {user.store_email && (
                                <a href={`mailto:${user.store_email}`} className="text-gray-600 hover:text-primary hover:underline mt-1 inline-flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5" />{user.store_email}
                                </a>
                              )}
                              {secondaryPhone && normalizePhone(secondaryPhone) && (
                                <a href={`https://wa.me/${normalizePhone(secondaryPhone)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-emerald-600 hover:underline mt-1 inline-flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />Oficina: {secondaryPhone}
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {showRejectReason === user.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motivo del rechazo (opcional)
                        </label>
                        <textarea
                          value={rejectReason[user.id] || ''}
                          onChange={(e) => setRejectReason({ ...rejectReason, [user.id]: e.target.value })}
                          placeholder="Ej: Verificacion de documentos fallida"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleReject(user.id)}
                            disabled={rejectingId === user.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {rejectingId === user.id ? 'Rechazando...' : 'Confirmar Rechazo'}
                          </Button>
                          <Button
                            onClick={() => setShowRejectReason(null)}
                            variant="secondary"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
