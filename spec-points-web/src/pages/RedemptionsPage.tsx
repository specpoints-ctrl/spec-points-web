import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui';
import { api, approveRedemption, deliverRedemption } from '../lib/api';
import { Check, Edit2, Plus, Trash2, Package, Clock, Phone, Mail, PackageCheck } from 'lucide-react';

interface Redemption {
  id: string;
  architect_id: string;
  prize_id: string;
  architect_name?: string;
  architect_email?: string;
  architect_phone?: string;
  prize_name?: string;
  points_required?: number;
  status: 'pending' | 'approved' | 'delivered';
  deadline_at?: string;
  delivered_at?: string;
  created_at: string;
}

interface ArchitectOption {
  id: string;
  nome: string;
}

interface PrizeOption {
  id: string;
  name: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

interface RedemptionForm {
  architect_id: string;
  prize_id: string;
  status: 'pending' | 'approved' | 'delivered';
}

const emptyForm: RedemptionForm = {
  architect_id: '',
  prize_id: '',
  status: 'pending',
};

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [architects, setArchitects] = useState<ArchitectOption[]>([]);
  const [prizes, setPrizes] = useState<PrizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RedemptionForm>(emptyForm);

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [redemptionsResponse, architectsResponse, prizesResponse] = await Promise.all([
        api.get<ApiListResponse<Redemption>>('/redemptions'),
        api.get<ApiListResponse<ArchitectOption>>('/architects'),
        api.get<ApiListResponse<PrizeOption>>('/prizes'),
      ]);

      setRedemptions(redemptionsResponse.data.data || []);
      setArchitects(architectsResponse.data.data || []);
      setPrizes(prizesResponse.data.data || []);
    } catch (error) {
      console.error('Error al cargar canjes:', error);
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      architect_id: Number(formData.architect_id),
      prize_id: Number(formData.prize_id),
      status: formData.status,
    };

    try {
      if (editingId) {
        await api.put(`/redemptions/${editingId}`, payload);
      } else {
        await api.post('/redemptions', payload);
      }

      setOpenDialog(false);
      resetForm();
      await loadInitialData();
    } catch (error) {
      console.error('Error al guardar canje:', error);
    }
  };

  const handleEdit = (redemption: Redemption) => {
    setEditingId(redemption.id);
    setFormData({
      architect_id: String(redemption.architect_id),
      prize_id: String(redemption.prize_id),
      status: redemption.status,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este canje?')) return;
    try {
      await api.delete(`/redemptions/${id}`);
      await loadInitialData();
    } catch (error) {
      console.error('Error al eliminar canje:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveRedemption(Number(id));
      await loadInitialData();
    } catch (error) {
      console.error('Error al aprobar canje:', error);
    }
  };

  const handleDeliver = async (id: string) => {
    try {
      await deliverRedemption(Number(id));
      await loadInitialData();
    } catch (error) {
      console.error('Error al marcar entrega:', error);
    }
  };

  const statusVariant = (status: Redemption['status']) => {
    if (status === 'approved') return 'success' as const;
    if (status === 'delivered') return 'secondary' as const;
    return 'warning' as const;
  };

  const statusLabel = (status: Redemption['status']) => {
    if (status === 'approved') return 'Aprobado';
    if (status === 'delivered') return 'Entregado';
    return 'Pendiente';
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Canjes</h1>
          <p className="text-sm text-muted-foreground mt-1">Administre solicitudes de canje</p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Canje
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Canje' : 'Nuevo Canje'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Arquitecto</label>
                <select
                  name="architect_id"
                  value={formData.architect_id}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
                  required
                >
                  <option value="">Seleccione</option>
                  {architects.map((architect) => (
                    <option key={architect.id} value={architect.id}>
                      {architect.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Premio</label>
                <select
                  name="prize_id"
                  value={formData.prize_id}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
                  required
                >
                  <option value="">Seleccione</option>
                  {prizes.map((prize) => (
                    <option key={prize.id} value={prize.id}>
                      {prize.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="delivered">Entregado</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">{editingId ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">{redemptions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-warning">{redemptions.filter((r) => r.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Aprobados</p>
            <p className="text-2xl font-bold text-success">{redemptions.filter((r) => r.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Entregados</p>
            <p className="text-2xl font-bold text-secondary">{redemptions.filter((r) => r.status === 'delivered').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Canjes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : redemptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Ningún canje registrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquitecto</TableHead>
                  <TableHead>Premio</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{redemption.architect_name || '-'}</p>
                      {redemption.architect_phone && (
                        <a href={`https://wa.me/${redemption.architect_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-emerald-500 hover:underline mt-0.5 transition-colors">
                          <Phone className="w-3 h-3" />{redemption.architect_phone}
                        </a>
                      )}
                      {redemption.architect_email && (
                        <a href={`mailto:${redemption.architect_email}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:underline mt-0.5">
                          <Mail className="w-3 h-3" />{redemption.architect_email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{redemption.prize_name || '-'}</TableCell>
                    <TableCell>{Number(redemption.points_required || 0).toLocaleString('es-PY')}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(redemption.status)}>{statusLabel(redemption.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {redemption.deadline_at ? (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(redemption.deadline_at).toLocaleDateString('es-PY')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 items-center">
                        {redemption.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(redemption.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Aprobar
                          </button>
                        )}
                        {redemption.status === 'approved' && (
                          <button
                            onClick={() => handleDeliver(redemption.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#0b6e78] to-[#134e56] text-white hover:opacity-90 shadow-sm transition-all hover:-translate-y-0.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> ¡Premio Entregado!
                          </button>
                        )}
                        {redemption.status === 'delivered' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <PackageCheck className="w-3.5 h-3.5" />
                            {redemption.delivered_at ? new Date(redemption.delivered_at).toLocaleDateString('es-PY') : 'Entregado'}
                          </span>
                        )}
                        <button
                          onClick={() => handleEdit(redemption)}
                          className="inline-flex items-center justify-center rounded-lg h-7 w-7 text-muted-foreground hover:bg-muted transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(redemption.id)}
                          className="inline-flex items-center justify-center rounded-lg h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
