import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { BackendUserProfile, getProfile, UserProfile } from '../lib/api';

interface ProfileContextType {
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

type InitialProfile = UserProfile | BackendUserProfile | null | undefined;

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  refreshProfile: async () => {},
});

const normalizeProfile = (profile: InitialProfile): UserProfile | null => {
  if (!profile) return null;

  const role = 'role' in profile && profile.role
    ? profile.role
    : 'user_roles' in profile
      ? profile.user_roles?.[0]?.role ?? ''
      : '';

  return {
    id: profile.id,
    firebase_uid: profile.firebase_uid,
    email: profile.email,
    display_name: profile.display_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    instagram_handle: profile.instagram_handle ?? null,
    status: profile.status,
    role,
    architect_id: profile.architect_id,
    store_id: profile.store_id,
  };
};

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile?: InitialProfile;
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(() => normalizeProfile(initialProfile));

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
    setProfile(normalizeProfile(initialProfile));
  }, [initialProfile]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        return;
      }

      const seededProfile = normalizeProfile(initialProfile);
      const knownUid = profile?.firebase_uid ?? seededProfile?.firebase_uid;

      if (knownUid !== user.uid) {
        void refreshProfile();
      }
    });
    return () => unsubscribe();
  }, [initialProfile, profile?.firebase_uid, refreshProfile]);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
