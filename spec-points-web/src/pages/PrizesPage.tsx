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
  ImageUploader,
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
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';

interface Prize {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  points_required: number;
  stock: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
}

interface PrizeForm {
  name: string;
  description: string;
  image_url: string;
  points_required: string;
  stock: string;
  expires_at: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

const emptyForm: PrizeForm = {
  name: '',
  description: '',
  image_url: '',
  points_required: '',
  stock: '',
  expires_at: '',
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrizeForm>(emptyForm);

  useEffect(() => {
    void loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiListResponse<Prize>>('/prizes');
      setPrizes(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar premios:', error);
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || null,
      image_url: formData.image_url || null,
      points_required: Number(formData.points_required),
      stock: Number(formData.stock),
      expires_at: formData.expires_at || null,
    };

    try {
      if (editingId) {
        await api.put(`/prizes/${editingId}`, payload);
      } else {
        await api.post('/prizes', payload);
      }

      setOpenDialog(false);
      resetForm();
      await loadPrizes();
    } catch (error) {
      console.error('Erro ao salvar premio:', error);
    }
  };

  const handleEdit = (prize: Prize) => {
    setEditingId(prize.id);
    setFormData({
      name: prize.name,
      description: prize.description || '',
      image_url: prize.image_url || '',
      points_required: String(prize.points_required),
      stock: String(prize.stock),
      expires_at: prize.expires_at ? String(prize.expires_at).slice(0, 10) : '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este premio?')) return;

    try {
      await api.delete(`/prizes/${id}`);
      await loadPrizes();
    } catch (error) {
      console.error('Erro ao deletar premio:', error);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await api.patch(`/prizes/${id}/active`, { active });
      await loadPrizes();
    } catch (error) {
      console.error('Erro ao atualizar status do premio:', error);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Premios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie o catalogo de premios</p>
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
            Novo Premio
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Premio' : 'Novo Premio'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome" name="name" value={formData.name} onChange={handleInputChange} required />
                <Input
                  label="Pontos Necessarios"
                  name="points_required"
                  type="number"
                  min="1"
                  value={formData.points_required}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Estoque"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Validade"
                  name="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                />
              </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Imagem do Prêmio
              </label>
              <ImageUploader
                currentUrl={formData.image_url}
                folder="prizes"
                onUploaded={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                label="Enviar imagem"
                shape="square"
              />
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
            <p className="text-2xl font-bold text-primary">{prizes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-success">{prizes.filter((p) => p.active).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Inativos</p>
            <p className="text-2xl font-bold text-destructive">{prizes.filter((p) => !p.active).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Estoque Total</p>
            <p className="text-2xl font-bold text-warning">{prizes.reduce((sum, p) => sum + Number(p.stock || 0), 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Premios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : prizes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum premio cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prizes.map((prize) => (
                  <TableRow key={prize.id}>
                    <TableCell className="font-medium">{prize.name}</TableCell>
                    <TableCell>{prize.points_required}</TableCell>
                    <TableCell>{prize.stock}</TableCell>
                    <TableCell>
                      <Badge variant={prize.active ? 'success' : 'destructive'}>
                        {prize.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {prize.active ? (
                          <button
                            onClick={() => handleToggleActive(prize.id, false)}
                            className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10 transition-colors"
                            title="Desativar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(prize.id, true)}
                            className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-success hover:bg-success/10 transition-colors"
                            title="Ativar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(prize)}
                          className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-primary hover:bg-primary/10 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prize.id)}
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
