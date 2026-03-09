import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../components/ui';
import { api } from '../lib/api';
import { Edit2, Plus, Trash2 } from 'lucide-react';

interface Sale {
  id: string;
  architect_id: string;
  store_id: string;
  architect_name?: string;
  store_name?: string;
  client_name?: string;
  client_phone?: string;
  amount_usd: number;
  points_generated: number;
  description?: string;
  created_at: string;
}

interface ArchitectOption {
  id: string;
  nome: string;
}

interface StoreOption {
  id: string;
  nome: string;
}

interface SaleForm {
  architect_id: string;
  store_id: string;
  client_name: string;
  client_phone: string;
  amount_usd: string;
  description: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

const emptyForm: SaleForm = {
  architect_id: '',
  store_id: '',
  client_name: '',
  client_phone: '',
  amount_usd: '',
  description: '',
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [architects, setArchitects] = useState<ArchitectOption[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SaleForm>(emptyForm);

  useEffect(() => {
    void loadInitialData();
  }, []);

  const predictedPoints = useMemo(() => {
    const amount = Number(formData.amount_usd || 0);
    if (Number.isNaN(amount) || amount < 0) return 0;
    return Math.floor(amount);
  }, [formData.amount_usd]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [salesResponse, architectsResponse, storesResponse] = await Promise.all([
        api.get<ApiListResponse<Sale>>('/sales'),
        api.get<ApiListResponse<ArchitectOption>>('/architects'),
        api.get<ApiListResponse<StoreOption>>('/stores'),
      ]);

      setSales(salesResponse.data.data || []);
      setArchitects(architectsResponse.data.data || []);
      setStores(storesResponse.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
      setSales([]);
      setArchitects([]);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      architect_id: Number(formData.architect_id),
      store_id: Number(formData.store_id),
      client_name: formData.client_name || null,
      client_phone: formData.client_phone || null,
      amount_usd: Number(formData.amount_usd),
      description: formData.description || null,
    };

    try {
      if (editingId) {
        await api.put(`/sales/${editingId}`, payload);
      } else {
        await api.post('/sales', payload);
      }

      setOpenDialog(false);
      resetForm();
      await loadInitialData();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setFormData({
      architect_id: String(sale.architect_id),
      store_id: String(sale.store_id),
      client_name: sale.client_name || '',
      client_phone: sale.client_phone || '',
      amount_usd: String(sale.amount_usd),
      description: sale.description || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta venda?')) return;

    try {
      await api.delete(`/sales/${id}`);
      await loadInitialData();
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre e acompanhe vendas pontuadas</p>
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
            Nova Venda
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-foreground mb-2">Loja</label>
                  <select
                    name="store_id"
                    value={formData.store_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
                    required
                  >
                    <option value="">Selecione</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Cliente"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleInputChange}
                />
                <Input
                  label="Telefone do Cliente"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleInputChange}
                />
                <Input
                  label="Valor (USD)"
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount_usd"
                  value={formData.amount_usd}
                  onChange={handleInputChange}
                  required
                />
                <div className="rounded-md border border-border p-3 flex items-center justify-between min-h-[44px]">
                  <span className="text-sm text-muted-foreground">Pontos gerados</span>
                  <span className="text-lg font-semibold text-primary">{predictedPoints}</span>
                </div>
              </div>

              <Textarea
                label="Descricao"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
              />

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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total de Vendas</p>
            <p className="text-2xl font-bold text-primary">{sales.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Valor Total (USD)</p>
            <p className="text-2xl font-bold text-success">
              {sales.reduce((sum, sale) => sum + Number(sale.amount_usd || 0), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Pontos Distribuidos</p>
            <p className="text-2xl font-bold text-warning">
              {sales.reduce((sum, sale) => sum + Number(sale.points_generated || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma venda registrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquiteto</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.architect_name || '-'}</TableCell>
                    <TableCell>{sale.store_name || '-'}</TableCell>
                    <TableCell>{sale.client_name || '-'}</TableCell>
                    <TableCell>US$ {Number(sale.amount_usd || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-primary font-semibold">{sale.points_generated}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-primary hover:bg-primary/10 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10 transition-colors"
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
