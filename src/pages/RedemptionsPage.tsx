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
import { Check, Edit2, Plus, Trash2, Package, Clock } from 'lucide-react';

interface Redemption {
  id: string;
  architect_id: string;
  prize_id: string;
  architect_name?: string;
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
      console.error('Erro ao carregar resgates:', error);
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
      console.error('Erro ao salvar resgate:', error);
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
    if (!confirm('Tem certeza que deseja deletar este resgate?')) return;
    try {
      await api.delete(`/redemptions/${id}`);
      await loadInitialData();
    } catch (error) {
      console.error('Erro ao deletar resgate:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveRedemption(Number(id));
      await loadInitialData();
    } catch (error) {
      console.error('Erro ao aprovar resgate:', error);
    }
  };

  const handleDeliver = async (id: string) => {
    try {
      await deliverRedemption(Number(id));
      await loadInitialData();
    } catch (error) {
      console.error('Erro ao marcar entrega:', error);
    }
  };

  const statusVariant = (status: Redemption['status']) => {
    if (status === 'approved') return 'success' as const;
    if (status === 'delivered') return 'secondary' as const;
    return 'warning' as const;
  };

  const statusLabel = (status: Redemption['status']) => {
    if (status === 'approved') return 'Aprovado';
    if (status === 'delivered') return 'Entregue';
    return 'Pendente';
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Resgates</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie solicitacoes de resgate</p>
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
            Novo Resgate
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Resgate' : 'Novo Resgate'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Arquiteto</label>
                <select
                  name="architect_id"
                  value={formData.architect_id}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
                  required
                >
                  <option value="">Selecione</option>
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
                  <option value="">Selecione</option>
                  {prizes.map((prize) => (
                    <option key={prize.id} value={prize.id}>
                      {prize.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="delivered">Entregue</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">{editingId ? 'Atualizar' : 'Criar'}</Button>
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
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-warning">{redemptions.filter((r) => r.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Aprovados</p>
            <p className="text-2xl font-bold text-success">{redemptions.filter((r) => r.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Entregues</p>
            <p className="text-2xl font-bold text-secondary">{redemptions.filter((r) => r.status === 'delivered').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Resgates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : redemptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum resgate cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquiteto</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Entregue em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell className="font-medium">{redemption.architect_name || '-'}</TableCell>
                    <TableCell>{redemption.prize_name || '-'}</TableCell>
                    <TableCell>{Number(redemption.points_required || 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(redemption.status)}>{statusLabel(redemption.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {redemption.deadline_at ? (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(redemption.deadline_at).toLocaleDateString('pt-BR')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {redemption.delivered_at ? (
                        <span className="text-xs text-emerald-600">
                          {new Date(redemption.delivered_at).toLocaleDateString('pt-BR')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {redemption.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(redemption.id)}
                            className="inline-flex items-center justify-center rounded-md h-9 w-9 text-success hover:bg-success/10 transition-colors"
                            title="Aprovar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {redemption.status === 'approved' && (
                          <button
                            onClick={() => handleDeliver(redemption.id)}
                            className="inline-flex items-center justify-center rounded-md h-9 w-9 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Marcar como entregue"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(redemption)}
                          className="inline-flex items-center justify-center rounded-md h-9 w-9 text-primary hover:bg-primary/10 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(redemption.id)}
                          className="inline-flex items-center justify-center rounded-md h-9 w-9 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Deletar"
                        >
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
    </div>
  );
}
