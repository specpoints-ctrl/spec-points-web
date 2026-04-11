import { useEffect, useState, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// ── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-background">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-lg font-bold text-red-700 mb-2">Algo deu errado</p>
            <p className="text-sm text-red-600 font-mono break-all">{(this.state.error as Error).message}</p>
            <button onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// ──────────────────────────────────────────────────────────────────────────
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ArchitectsPage from './pages/ArchitectsPage';
import StoresPage from './pages/StoresPage';
import SalesPage from './pages/SalesPage';
import PrizesPage from './pages/PrizesPage';
import RedemptionsPage from './pages/RedemptionsPage';
import UserApprovalsPage from './pages/UserApprovalsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import CampaignsPage from './pages/CampaignsPage';
import PointsStorePage from './pages/PointsStorePage';
import { auth } from './lib/firebase';
import { BackendUserProfile, getCurrentUser, checkTermsAcceptance, Terms } from './lib/api';
import { AdminLayout } from './components/layouts/AdminLayout';
import { ArchitectLayout } from './components/layouts/ArchitectLayout';
import { LojistaLayout } from './components/layouts/LojistaLayout';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ProfileProvider } from './contexts/ProfileContext';
import TermsAcceptanceModal from './components/TermsAcceptanceModal';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<BackendUserProfile | null>(null);
  const [termsRequired, setTermsRequired] = useState(false);
  const [pendingTerms, setPendingTerms] = useState<Terms | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (!firebaseUser) {
        setIsAuthenticated(false);
        setProfile(null);
        setTermsRequired(false);
        setPendingTerms(null);
        setIsLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const response = await getCurrentUser(token);

        if (!response.success) {
          await signOut(auth);
          setIsAuthenticated(false);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setProfile(response.data || null);

        // Check terms acceptance (skip for admin)
        const userRole = response.data?.role ?? response.data?.user_roles?.[0]?.role;
        if (userRole !== 'admin') {
          try {
            const termsRes = await checkTermsAcceptance();
            if (termsRes.success && termsRes.data && !termsRes.data.accepted && termsRes.data.terms) {
              setTermsRequired(true);
              setPendingTerms(termsRes.data.terms);
            }
          } catch {
            // Terms check failure is non-fatal — allow login to proceed
          }
        }
      } catch {
        await signOut(auth);
        setIsAuthenticated(false);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getLayout = () => {
    const role = profile?.role ?? profile?.user_roles?.[0]?.role;
    switch (role) {
      case 'admin': return AdminLayout;
      case 'architect': return ArchitectLayout;
      case 'lojista': return LojistaLayout;
      default: return null;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setProfile(null);
    setTermsRequired(false);
    setPendingTerms(null);
  };

  const role = profile?.role ?? profile?.user_roles?.[0]?.role;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const withLayout = (children: React.ReactNode) => {
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    const LayoutComponent = getLayout();
    if (!LayoutComponent) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      );
    }
    return <LayoutComponent>{children}</LayoutComponent>;
  };

  return (
    <ErrorBoundary>
      <ProfileProvider>
        <NotificationsProvider>
          {/* Terms acceptance modal — blocks UI until accepted */}
          {isAuthenticated && termsRequired && pendingTerms && (
            <TermsAcceptanceModal
              terms={pendingTerms}
              onAccepted={() => { setTermsRequired(false); setPendingTerms(null); }}
            />
          )}

          <Router>
            <Routes>
              <Route
                path="/auth"
                element={
                  isAuthenticated ? <Navigate to="/" replace /> : <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
                }
              />

              <Route path="/" element={withLayout(<DashboardPage profile={profile} onLogout={handleLogout} />)} />
              <Route path="/architects" element={withLayout(<ArchitectsPage />)} />
              <Route path="/stores" element={withLayout(<StoresPage />)} />
              <Route path="/sales" element={withLayout(<SalesPage />)} />
              <Route path="/prizes" element={withLayout(<PrizesPage />)} />
              <Route path="/redemptions" element={withLayout(<RedemptionsPage />)} />
              <Route path="/settings" element={withLayout(<SettingsPage />)} />
              <Route path="/notifications" element={withLayout(<NotificationsPage />)} />

              {/* Architect only */}
              <Route
                path="/store"
                element={
                  isAuthenticated && role === 'architect'
                    ? withLayout(<PointsStorePage />)
                    : <Navigate to="/" replace />
                }
              />

              {/* Admin only */}
              <Route
                path="/campaigns"
                element={
                  isAuthenticated && role === 'admin'
                    ? withLayout(<CampaignsPage />)
                    : <Navigate to="/" replace />
                }
              />
              <Route
                path="/approvals"
                element={
                  isAuthenticated && role === 'admin'
                    ? withLayout(<UserApprovalsPage />)
                    : <Navigate to="/" replace />
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  isAuthenticated && role === 'admin'
                    ? withLayout(<AdminNotificationsPage />)
                    : <Navigate to="/" replace />
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificationsProvider>
      </ProfileProvider>
    </ErrorBoundary>
  );
}

export default App;
