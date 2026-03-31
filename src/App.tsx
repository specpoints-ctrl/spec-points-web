import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ArchitectsPage from './pages/ArchitectsPage';
import StoresPage from './pages/StoresPage';
import SalesPage from './pages/SalesPage';
import PrizesPage from './pages/PrizesPage';
import RedemptionsPage from './pages/RedemptionsPage';
import UserApprovalsPage from './pages/UserApprovalsPage';
import { auth } from './lib/firebase';
import { BackendUserProfile, getCurrentUser } from './lib/api';
import { AdminLayout } from './components/layouts/AdminLayout';
import { ArchitectLayout } from './components/layouts/ArchitectLayout';
import { LojistaLayout } from './components/layouts/LojistaLayout';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<BackendUserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (!firebaseUser) {
        setIsAuthenticated(false);
        setProfile(null);
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
    const role = profile?.user_roles?.[0]?.role;
    
    switch (role) {
      case 'admin':
        return AdminLayout;
      case 'architect':
        return ArchitectLayout;
      case 'lojista':
        return LojistaLayout;
      default:
        return AdminLayout;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setProfile(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <DashboardPage profile={profile} onLogout={handleLogout} />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/architects"
          element={
            isAuthenticated ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <ArchitectsPage />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/stores"
          element={
            isAuthenticated ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <StoresPage />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/sales"
          element={
            isAuthenticated ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <SalesPage />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/prizes"
          element={
            isAuthenticated ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <PrizesPage />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/redemptions"
          element={
            isAuthenticated ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <RedemptionsPage />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/approvals"
          element={
            isAuthenticated && profile?.user_roles?.[0]?.role === 'admin' ? (
              (() => {
                const LayoutComponent = getLayout();
                return (
                  <LayoutComponent>
                    <UserApprovalsPage />
                  </LayoutComponent>
                );
              })()
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
