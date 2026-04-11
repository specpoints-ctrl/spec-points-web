import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getUnreadCount } from '../lib/api';

interface NotificationsContextType {
  unreadCount: number;
  refreshCount: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  refreshCount: () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res.success && res.data) setUnreadCount(res.data.count);
    } catch {
      // silently fail — user might not be logged in yet
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 60_000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};
