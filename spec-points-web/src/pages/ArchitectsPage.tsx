import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, Textarea } from '../components/ui';
import { Plus, Edit2, Trash2, Check, X, Phone, Instagram, Building2, CreditCard } from 'lucide-react';
import { api, buildInstagramUrl } from '../lib/api';

interface Architect {
  id: string;
  email: string;
  nome: string;
  empresa: string;
  telefone: string;
  office_phone?: string;
  document_ci?: string;
  ruc?: string;
  birthday?: string;
  profile_complete?: boolean;
  instagram_handle?: string | null;
  status: 'pending' | 'active' | 'inactive';
  cidade: string;
  estado: string;
  created_at: string;
}

interface FormData {
  email: string;
  nome: string;
  empresa: string;
  telefone: string;
  ruc: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export default function ArchitectsPage() {
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    nome: '',
    empresa: '',
    telefone: '',
    ruc: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  useEffect(() => {
    loadArchitects();
  }, []);

  const loadArchitects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/architects');
      setArchitects(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar arquitectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/architects/${editingId}`, formData);
      } else {
        await api.post('/architects', formData);
      }
      setOpenDialog(false);
      setEditingId(null);
      setFormData({ email: '', nome: '', empresa: '', telefone: '', ruc: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
      loadArchitects();
    } catch (error) {
      console.error('Error al guardar arquitecto:', error);
    }
  };

  const handleEdit = (architect: Architect) => {
    setEditingId(architect.id);
    setFormData({ email: architect.email, nome: architect.nome, empresa: architect.empresa, telefone: architect.telefone, ruc: architect.ruc || '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: architect.cidade, estado: architect.estado });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este arquitecto?')) {
      try {
        await api.delete(`/architects/${id}`);
        loadArchitects();
      } catch (error) {
        console.error('Error al eliminar arquitecto:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      await api.patch(`/architects/${id}/status`, { status: newStatus });
      loadArchitects();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendiente', variant: 'warning' as const },
      active: { label: 'Activo', variant: 'success' as const },
      inactive: { label: 'Inactivo', variant: 'destructive' as const },
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Arquitectos</h1>
          <p className="text-sm text-muted-foreground mt-1">Administre los arquitectos registrados</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <Button
            onClick={() => { setEditingId(null); setFormData({ email: '', nome: '', empresa: '', telefone: '', ruc: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); setOpenDialog(true); }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Arquitecto
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Arquitecto' : 'Nuevo Arquitecto'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Correo electrónico" name="email" type="email" value={formData.email} onChange={handleInputChange} required disabled={!!editingId} />
                <Input label="Nombre" name="nome" value={formData.nome} onChange={handleInputChange} required />
                <Input label="Empresa" name="empresa" value={formData.empresa} onChange={handleInputChange} required />
                <Input label="RUC" name="ruc" value={formData.ruc} onChange={handleInputChange} required />
                <Input label="Teléfono" name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} required />
                <Input label="Código postal" name="cep" value={formData.cep} onChange={handleInputChange} />
                <Input label="Barrio" name="bairro" value={formData.bairro} onChange={handleInputChange} />
                <Input label="Ciudad" name="cidade" value={formData.cidade} onChange={handleInputChange} required />
                <Input label="Departamento" name="estado" value={formData.estado} onChange={handleInputChange} required />
              </div>

              <Textarea label="Dirección" name="endereco" value={formData.endereco} onChange={handleInputChange} rows={2} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Número" name="numero" value={formData.numero} onChange={handleInputChange} />
                <Input label="Complemento" name="complemento" value={formData.complemento} onChange={handleInputChange} />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setOpenDialog(false)} className="w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto">{editingId ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{architects.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-sm text-muted-foreground">Activos</p><p className="text-2xl font-bold text-success">{architects.filter(a => a.status === 'active').length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-warning">{architects.filter(a => a.status === 'pending').length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-sm text-muted-foreground">Inactivos</p><p className="text-2xl font-bold text-destructive">{architects.filter(a => a.status === 'inactive').length}</p></div></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Lista de Arquitectos</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><p className="text-muted-foreground">Cargando...</p></div>
          ) : architects.length === 0 ? (
            <div className="text-center py-8"><p className="text-muted-foreground">Ningún arquitecto registrado</p></div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID / Nombre</TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {architects.map((architect) => (
                    <TableRow key={architect.id}>
                      <TableCell>
                        <div className="font-medium">{architect.nome}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">ID: {architect.id}</div>
                        {architect.document_ci && (
                          <div className="text-[10px] text-muted-foreground">CI: {architect.document_ci}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{architect.ruc || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">{architect.email}</div>
                        {architect.telefone && (
                          <a href={`https://wa.me/${architect.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-emerald-500 hover:underline mt-0.5 transition-colors">
                            <Phone className="w-3 h-3" />{architect.telefone}
                          </a>
                        )}
                        {architect.office_phone && (
                          <a href={`https://wa.me/${architect.office_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-emerald-500 hover:underline mt-0.5 transition-colors">
                            <Phone className="w-3 h-3" />Oficina: {architect.office_phone}
                          </a>
                        )}
                        {buildInstagramUrl(architect.instagram_handle) && (
                          <a
                            href={buildInstagramUrl(architect.instagram_handle)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 hover:underline mt-0.5 transition-colors"
                          >
                            <Instagram className="w-3 h-3" />@{architect.instagram_handle}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{architect.empresa || '-'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{architect.profile_complete ? 'Perfil completo' : 'Perfil incompleto'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{architect.cidade}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(architect.status).variant}>
                          {getStatusBadge(architect.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {architect.status === 'pending' ? (
                            <>
                              <button onClick={() => handleStatusChange(architect.id, 'active')}
                                className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-sm text-green-600 hover:bg-green-50 transition-colors" title="Aprobar">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleStatusChange(architect.id, 'inactive')}
                                className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-sm text-red-600 hover:bg-red-50 transition-colors" title="Rechazar">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(architect)}
                                className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-sm text-primary hover:bg-primary/10 transition-colors" title="Editar">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(architect.id)}
                                className="inline-flex items-center justify-center rounded-md h-11 w-11 min-h-[44px] min-w-[44px] text-sm text-destructive hover:bg-destructive/10 transition-colors" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
