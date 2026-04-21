import { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, CardContent, CardHeader, CardTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea,
} from '../components/ui';
import { api, getActiveCampaigns, getActiveCompleteArchitects, Campaign } from '../lib/api';
import { useProfile } from '../contexts/ProfileContext';
import { Edit2, Plus, Trash2, Zap, AlertCircle } from 'lucide-react';

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
  product_name?: string;
  quantity?: number;
  campaign_title?: string;
  points_multiplier?: number;
  description?: string;
  created_at: string;
}

interface ArchitectOption {
  id: string | number;
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
  product_name: string;
  quantity: string;
  amount_usd: string;
  description: string;
}

const emptyForm: SaleForm = {
  architect_id: '',
  store_id: '',
  client_name: '',
  client_phone: '',
  product_name: '',
  quantity: '1',
  amount_usd: '',
  description: '',
};

const selectCls = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]';

export default function SalesPage() {
  const { profile } = useProfile();
  const isLojista = profile?.role === 'lojista';

  const [sales, setSales] = useState<Sale[]>([]);
  const [architects, setArchitects] = useState<ArchitectOption[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SaleForm>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLojista]);

  const multiplier = activeCampaign ? Number(activeCampaign.points_multiplier) : 1;

  const predictedPoints = useMemo(() => {
    const amount = Number(formData.amount_usd || 0);
    if (Number.isNaN(amount) || amount < 0) return 0;
    return Math.floor(amount * multiplier);
  }, [formData.amount_usd, multiplier]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const salesEndpoint = isLojista ? '/sales/lojista' : '/sales';
      const [salesResponse, architectsResponse, campaignsResponse] = await Promise.all([
        api.get(salesEndpoint),
        getActiveCompleteArchitects(),
        getActiveCampaigns(),
      ]);

      setSales(salesResponse.data.data || []);
      setArchitects(architectsResponse.data || []);

      if (!isLojista) {
        const storesResponse = await api.get('/stores');
        setStores(storesResponse.data.data || []);
      }

      const camps: Campaign[] = campaignsResponse.data || [];
      setActiveCampaign(camps.length > 0 ? camps[0] : null);
    } catch (error) {
      console.error('Error al cargar datos de ventas:', error);
      setSales([]); setArchitects([]); setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setFormData(emptyForm); setEditingId(null); setSubmitError(null); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload = {
      architect_id: Number(formData.architect_id),
      store_id: isLojista ? undefined : Number(formData.store_id),
      client_name: formData.client_name || null,
      client_phone: formData.client_phone || null,
      product_name: formData.product_name || null,
      quantity: Number(formData.quantity) || 1,
      amount_usd: Number(formData.amount_usd),
      description: formData.description || null,
    };

    const postEndpoint = isLojista ? '/sales/lojista' : '/sales';

    try {
      if (editingId && !isLojista) {
        await api.put(`/sales/${editingId}`, payload);
      } else {
        await api.post(postEndpoint, payload);
      }
      setOpenDialog(false);
      resetForm();
      await loadInitialData();
    } catch (error: any) {
      setSubmitError(error?.response?.data?.error || 'Error al guardar venta');
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setFormData({
      architect_id: String(sale.architect_id),
      store_id: String(sale.store_id),
      client_name: sale.client_name || '',
      client_phone: sale.client_phone || '',
      product_name: sale.product_name || '',
      quantity: String(sale.quantity || 1),
      amount_usd: String(sale.amount_usd),
      description: sale.description || '',
    });
    setSubmitError(null);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta venta?')) return;
    try {
      await api.delete(`/sales/${id}`);
      await loadInitialData();
    } catch (error) {
      console.error('Error al eliminar venta:', error);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ventas</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre y haga seguimiento de ventas puntuadas</p>
        </div>

        {activeCampaign && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
            <Zap className="w-4 h-4 text-amber-600" />
            Campaña activa: <span className="font-extrabold">{activeCampaign.title}</span> — {activeCampaign.points_multiplier}x pts/$
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <Button className="w-full sm:w-auto" onClick={() => { resetForm(); setOpenDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Venta
          </Button>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Venta' : 'Nueva Venta'}</DialogTitle>
            </DialogHeader>

            {activeCampaign && !editingId && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Campaña activa: <strong>{activeCampaign.title}</strong> — {activeCampaign.points_multiplier}x puntos por dólar</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Arquitecto *</label>
                  <select name="architect_id" value={formData.architect_id} onChange={handleInputChange}
                    className={selectCls} required>
                    <option value="">Seleccione el arquitecto</option>
                    {architects.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                  {architects.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Ningún arquitecto con perfil completo y activo</p>
                  )}
                </div>

                {!isLojista && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tienda *</label>
                    <select name="store_id" value={formData.store_id} onChange={handleInputChange}
                      className={selectCls} required>
                      <option value="">Seleccione la tienda</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Input label="Nombre del Cliente" name="client_name" value={formData.client_name} onChange={handleInputChange} placeholder="Nombre del cliente" />
                <Input label="Teléfono del Cliente" name="client_phone" value={formData.client_phone} onChange={handleInputChange} placeholder="+595..." />

                <Input label="Producto *" name="product_name" value={formData.product_name} onChange={handleInputChange}
                  placeholder="Nombre del producto" required />
                <Input label="Cantidad *" type="number" min="1" name="quantity" value={formData.quantity}
                  onChange={handleInputChange} required />

                <Input label="Valor Total (USD) *" type="number" step="0.01" min="0" name="amount_usd"
                  value={formData.amount_usd} onChange={handleInputChange} required />

                <div className="rounded-xl border border-border/60 p-3 flex items-center justify-between min-h-[44px]"
                  style={activeCampaign && !editingId ? { background: '#fffbeb', borderColor: '#fcd34d' } : {}}>
                  <div>
                    <span className="text-sm text-muted-foreground">Puntos generados</span>
                    {activeCampaign && !editingId && (
                      <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />{activeCampaign.points_multiplier}x multiplicador
                      </p>
                    )}
                  </div>
                  <span className="text-xl font-extrabold text-primary">{predictedPoints.toLocaleString('es-PY')}</span>
                </div>
              </div>

              <Textarea label="Descripción" name="description" value={formData.description}
                onChange={handleInputChange} rows={2} />

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto">{editingId ? 'Actualizar' : 'Registrar Venta'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total de Ventas</p>
            <p className="text-2xl font-bold text-primary">{sales.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Valor Total (USD)</p>
            <p className="text-2xl font-bold text-success">
              {sales.reduce((sum, s) => sum + Number(s.amount_usd || 0), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Puntos Distribuidos</p>
            <p className="text-2xl font-bold text-warning">
              {sales.reduce((sum, s) => sum + Number(s.points_generated || 0), 0).toLocaleString('es-PY')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Ventas</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Ninguna venta registrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquitecto</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Campaña</TableHead>
                  {!isLojista && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.architect_name || '-'}</TableCell>
                    <TableCell>{sale.store_name || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{sale.product_name || '-'}</p>
                        {sale.quantity && sale.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">Cant: {sale.quantity}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{sale.client_name || '-'}</TableCell>
                    <TableCell>US$ {Number(sale.amount_usd || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-primary font-semibold">{Number(sale.points_generated || 0).toLocaleString('es-PY')}</span>
                        {sale.campaign_title && sale.points_multiplier && sale.points_multiplier > 1 && (
                          <span className="inline-flex items-center gap-0.5 text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                            <Zap className="w-2.5 h-2.5" />{sale.points_multiplier}x
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sale.campaign_title ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[100px] block">{sale.campaign_title}</span>
                      ) : '-'}
                    </TableCell>
                    {!isLojista && (
                      <TableCell>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(sale)}
                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-primary hover:bg-primary/10 transition-colors" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(sale.id)}
                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
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
