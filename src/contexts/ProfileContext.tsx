import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getProfile, UserProfile } from '../lib/api';

interface ProfileContextType {
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  refreshProfile: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;
      const res = await getProfile();
      if (res.success && res.data) setProfile(res.data);
    } catch {
      // silently fail — user might not be authenticated yet
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        refreshProfile();
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, [refreshProfile]);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
