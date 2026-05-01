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
import { api, buildInstagramUrl } from '../lib/api';
import { Check, Edit2, Plus, Trash2, X, Phone, Mail, Instagram, User, MapPin, CreditCard } from 'lucide-react';

interface Store {
  id: string;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  office_phone?: string;
  ramo?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  logo_url?: string;
  owner_name?: string;
  owner_ci?: string;
  ruc?: string;
  owner_birthday?: string;
  profile_complete?: boolean;
  account_email?: string;
  account_status?: string;
  instagram_handle?: string | null;
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
      console.error('Error al cargar socios exclusivos:', error);
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
      console.error('Error al guardar socio exclusivo:', error);
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
    if (!confirm('¿Está seguro de que desea eliminar este socio exclusivo?')) return;

    try {
      await api.delete(`/stores/${id}`);
      await loadStores();
    } catch (error) {
      console.error('Error al eliminar socio exclusivo:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive') => {
    try {
      await api.patch(`/stores/${id}/status`, { status });
      await loadStores();
    } catch (error) {
      console.error('Error al actualizar estado del socio exclusivo:', error);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Socios Exclusivos</h1>
          <p className="text-sm text-muted-foreground mt-1">Administre las socios exclusivos asociados</p>
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
            Nuevo Socio Exclusivo
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Socio Exclusivo' : 'Nuevo Socio Exclusivo'}</DialogTitle>
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
                  Logo del Socio Exclusivo
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
          <CardTitle>Lista de Socios Exclusivos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : stores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Ningún socio exclusivo registrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Contacto / Cuenta</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="font-medium">{store.nome}</div>
                      {store.owner_name && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {store.owner_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{store.cnpj || '-'}</div>
                      {store.ruc && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3" />
                          RUC: {store.ruc}
                        </div>
                      )}
                      {store.owner_ci && (
                        <div className="text-xs text-muted-foreground mt-0.5">CI Responsable: {store.owner_ci}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {(store.email || store.account_email) && (
                        <a
                          href={`mailto:${store.email || store.account_email}`}
                          className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          {store.email || store.account_email}
                        </a>
                      )}
                      {store.telefone && (
                        <a
                          href={`https://wa.me/${store.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-emerald-500 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {store.telefone}
                        </a>
                      )}
                      {store.office_phone && (
                        <a
                          href={`https://wa.me/${store.office_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-emerald-500 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          Oficina: {store.office_phone}
                        </a>
                      )}
                      {buildInstagramUrl(store.instagram_handle) && (
                        <a
                          href={buildInstagramUrl(store.instagram_handle)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-pink-600 hover:text-pink-700 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Instagram className="w-3 h-3" />@{store.instagram_handle}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{store.cidade || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{store.estado || '-'}</div>
                      {store.endereco && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[220px] inline-block align-bottom">{store.endereco}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.status === 'active' ? 'success' : 'destructive'}>
                        {store.status === 'active' ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {store.profile_complete ? 'Perfil completo' : 'Perfil incompleto'}
                      </div>
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
