import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { getPendingUsers, approveUser, rejectUser, PendingUser } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Check, X, Loader } from 'lucide-react';

const formatDateSafe = (value?: string) => {
  if (!value) return 'Sin fecha';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-PY');
};

export default function UserApprovalsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectReason, setShowRejectReason] = useState<string | null>(null);

  useEffect(() => {
    const getTokenAndLoad = async () => {
      try {
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          setToken(idToken);
          await loadPendingUsers(idToken);
        }
      } catch (err) {
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
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
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
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setRejectReason(prev => ({ ...prev, [userId]: '' }));
      setShowRejectReason(null);
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
        {/* Header */}
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
            <p className="text-gray-500 text-lg">¡Todas las cuentas han sido revisadas!</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map(user => (
              <Card key={user.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.architect_name || user.email}
                        </h3>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'architect' ? 'Arquitecto' : user.role === 'lojista' ? 'Comerciante' : user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Estado</p>
                          <p className="font-medium text-gray-900">{user.status}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Solicitado</p>
                          <p className="font-medium text-gray-900">
                            {formatDateSafe(user.created_at)}
                          </p>
                        </div>
                        {user.architect_id && (
                          <div>
                            <p className="text-gray-500">ID Arquitecto</p>
                            <p className="font-medium text-gray-900">{user.architect_id}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={approvingId === user.id}
                        className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 transition"
                        title="Aprobar"
                      >
                        {approvingId === user.id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowRejectReason(user.id === showRejectReason ? null : user.id)}
                        disabled={rejectingId === user.id}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 transition"
                        title="Rechazar"
                      >
                        {rejectingId === user.id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Reject reason form */}
                  {showRejectReason === user.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo del rechazo (opcional)
                      </label>
                      <textarea
                        value={rejectReason[user.id] || ''}
                        onChange={(e) => setRejectReason({ ...rejectReason, [user.id]: e.target.value })}
                        placeholder="Ej: Verificación de documentos fallida"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
