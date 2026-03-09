import { useEffect, useState } from 'react';
import { Users, Store, ShoppingCart, TrendingUp } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '../lib/api';
import { auth } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const response = await getDashboardStats(token);
          if (response.success && response.data) {
            setStats(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>;
  }

  const cards = [
    { icon: Users, label: 'Arquitetos Cadastrados', value: stats?.architects || 0, color: 'text-primary' },
    { icon: Store, label: 'Lojas Parceiras', value: stats?.stores || 0, color: 'text-secondary' },
    { icon: ShoppingCart, label: 'Total de Vendas', value: stats?.sales || 0, color: 'text-warning' },
    { icon: TrendingUp, label: 'Pontos Distribuídos', value: stats?.totalPoints || 0, color: 'text-success' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-2">Bem-vindo ao painel de controle</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{card.label}</p>
                    <p className="text-xl sm:text-3xl font-bold text-foreground mt-2">{card.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${card.color}`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Architects */}
        <Card>
          <CardHeader>
            <CardTitle>Top Arquitetos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topArchitects && stats.topArchitects.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topArchitects.map((arch, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{arch.name}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{arch.total_points.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum arquiteto cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentSales && stats.recentSales.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.recentSales.map((sale, idx) => (
                  <div key={idx} className="p-3 border border-border rounded-md hover:bg-muted transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{sale.architect_name}</p>
                        <p className="text-sm text-muted-foreground">{sale.store_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">+{sale.points_generated.toLocaleString()} pts</p>
                        <p className="text-sm text-muted-foreground">US${sale.value.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma venda registrada</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
