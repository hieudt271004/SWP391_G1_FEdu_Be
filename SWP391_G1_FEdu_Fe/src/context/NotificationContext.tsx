import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (title: string, message?: string, type?: 'success' | 'info' | 'error') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'fedu_notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const addNotificationRef = useRef<(title: string, message?: string, type?: 'success' | 'info' | 'error') => void>(null);

  
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load notifications from localStorage:', e);
    }
  }, []);

  const addNotification = useCallback((
    title: string,
    message?: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    const newItem: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => {
      const updated = [newItem, ...prev].slice(0, 50); 
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save notifications to localStorage:', e);
      }
      return updated;
    });
  }, []);

  
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  
  useEffect(() => {
    const originalSuccess = toast.success;
    const originalError = toast.error;

    toast.success = (message, data) => {
      const msgStr = typeof message === 'string' ? message : String(message);
      const descStr = data?.description ? String(data.description) : undefined;
      
      if (addNotificationRef.current) {
        addNotificationRef.current(msgStr, descStr, 'success');
      }
      
      return originalSuccess(message, data);
    };

    toast.error = (message, data) => {
      const msgStr = typeof message === 'string' ? message : String(message);
      const descStr = data?.description ? String(data.description) : undefined;
      
      if (addNotificationRef.current) {
        addNotificationRef.current(msgStr, descStr, 'error');
      }
      
      return originalError(message, data);
    };

    return () => {
      toast.success = originalSuccess;
      toast.error = originalError;
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save notifications to localStorage:', e);
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save notifications to localStorage:', e);
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear notifications in localStorage:', e);
    }
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
