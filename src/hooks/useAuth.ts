import { useContext, createContext } from 'react';

interface AuthContextType {
  profile: any;
  role: string | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  profile: null,
  role: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
