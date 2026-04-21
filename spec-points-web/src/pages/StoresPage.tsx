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

interface Store {
  id: string;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  ramo?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface StoresResponse {
  success: boolean;
  data: Store[];
}

interface StoreFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  ramo: string;
  endereco: string;
  cidade: string;
  estado: string;
  pais: string;
  logo_url: string;
}

const emptyForm: StoreFormData = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  ramo: '',
  endereco: '',
  cidade: '',
  estado: '',
  pais: 'Paraguay',
  logo_url: '',
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoreFormData>(emptyForm);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await api.get<StoresResponse>('/stores');
      setStores(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/stores/${editingId}`, formData);
      } else {
        await api.post('/stores', formData);
      }

      setOpenDialog(false);
      resetForm();
      await loadStores();
    } catch (error) {
      console.error('Error al guardar tienda:', error);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingId(store.id);
    setFormData({
      nome: store.nome || '',
      cnpj: store.cnpj || '',
      email: store.email || '',
      telefone: store.telefone || '',
      ramo: store.ramo || '',
      endereco: store.endereco || '',
      cidade: store.cidade || '',
      estado: store.estado || '',
      pais: store.pais || 'Paraguay',
      logo_url: store.logo_url || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta tienda?')) return;

    try {
      await api.delete(`/stores/${id}`);
      await loadStores();
    } catch (error) {
      console.error('Error al eliminar tienda:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive') => {
    try {
      await api.patch(`/stores/${id}/status`, { status });
      await loadStores();
    } catch (error) {
      console.error('Error al actualizar estado de la tienda:', error);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tiendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Administre las tiendas asociadas</p>
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
            Nueva Tienda
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Tienda' : 'Nueva Tienda'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre" name="nome" value={formData.nome} onChange={handleInputChange} required />
                <Input label="RUC" name="cnpj" value={formData.cnpj} onChange={handleInputChange} required />
                <Input label="Correo" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                <Input label="Teléfono" name="telefone" value={formData.telefone} onChange={handleInputChange} />
                <Input label="Rubro" name="ramo" value={formData.ramo} onChange={handleInputChange} />
                <Input label="Ciudad" name="cidade" value={formData.cidade} onChange={handleInputChange} />
                <Input label="Departamento" name="estado" value={formData.estado} onChange={handleInputChange} />
                <Input label="País" name="pais" value={formData.pais} onChange={handleInputChange} />
              </div>

              <Textarea
                label="Dirección"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                rows={2}
              />

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Logo de la Tienda
                </label>
                <ImageUploader
                  currentUrl={formData.logo_url}
                  folder="stores"
                  onUploaded={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                  label="Subir logo"
                  shape="square"
                />
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">{stores.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-success">{stores.filter((s) => s.status === 'active').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Inactivas</p>
            <p className="text-2xl font-bold text-destructive">{stores.filter((s) => s.status === 'inactive').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tiendas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : stores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Ninguna tienda registrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.nome}</TableCell>
                    <TableCell>{store.cnpj}</TableCell>
                    <TableCell>{store.cidade || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={store.status === 'active' ? 'success' : 'destructive'}>
                        {store.status === 'active' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {store.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(store.id, 'inactive')}
                            className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10 transition-colors"
                            title="Desactivar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(store.id, 'active')}
                            className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-success hover:bg-success/10 transition-colors"
                            title="Activar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(store)}
                          className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-primary hover:bg-primary/10 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(store.id)}
                          className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10 transition-colors"
                          title="Eliminar"
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
