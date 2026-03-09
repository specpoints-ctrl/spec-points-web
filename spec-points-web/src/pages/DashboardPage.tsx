import { BackendUserProfile } from '../lib/api';
import { AdminDashboard } from '../components/AdminDashboard';

interface DashboardPageProps {
  profile: BackendUserProfile | null;
  onLogout: () => Promise<void>;
}

export default function DashboardPage({ profile, onLogout }: DashboardPageProps) {
  const userRole = profile?.user_roles?.[0]?.role || 'architect';

  // Render admin dashboard
  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  // Render architect dashboard
  if (userRole === 'architect') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Meu Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bem-vindo, Arquiteto!</h2>
          <p className="text-gray-600">Funcionalidades em desenvolvimento...</p>
        </div>
      </div>
    );
  }

  // Render lojista dashboard
  if (userRole === 'lojista') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard da Loja</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bem-vindo, Lojista!</h2>
          <p className="text-gray-600">Funcionalidades em desenvolvimento...</p>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sessão ativa</h2>

          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900 font-medium">{profile?.email || '-'}</dd>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-gray-500">Status</dt>
              <dd className="text-gray-900 font-medium">{profile?.status || '-'}</dd>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-gray-500">Papel</dt>
              <dd className="text-gray-900 font-medium">{userRole || '-'}</dd>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-gray-500">Firebase UID</dt>
              <dd className="text-gray-900 font-medium break-all">{profile?.firebase_uid || '-'}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
