import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert, Notification, WatchlistItem } from '@/types';

interface AppStore {
  // Theme
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // Watchlist
  watchlist: WatchlistItem[];
  addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => void;
  removeFromWatchlist: (id: string) => void;
  isWatchlisted: (address: string) => boolean;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'triggered'>) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;

  // Search history
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // WS status
  wsStatus: string;
  setWsStatus: (s: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      watchlist: [],
      addToWatchlist: (item) => {
        const existing = get().watchlist;
        if (existing.length >= 100) return;
        if (existing.some(w => w.address === item.address)) return;
        set({
          watchlist: [...existing, {
            ...item,
            id: Math.random().toString(36).slice(2),
            addedAt: Date.now() / 1000,
          }]
        });
      },
      removeFromWatchlist: (id) =>
        set({ watchlist: get().watchlist.filter(w => w.id !== id) }),
      isWatchlisted: (address) =>
        get().watchlist.some(w => w.address === address),

      alerts: [],
      addAlert: (alert) =>
        set({
          alerts: [...get().alerts, {
            ...alert,
            id: Math.random().toString(36).slice(2),
            createdAt: Date.now() / 1000,
            triggered: false,
          }]
        }),
      updateAlert: (id, updates) =>
        set({ alerts: get().alerts.map(a => a.id === id ? { ...a, ...updates } : a) }),
      deleteAlert: (id) =>
        set({ alerts: get().alerts.filter(a => a.id !== id) }),
      toggleAlert: (id) =>
        set({ alerts: get().alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a) }),

      notifications: [],
      addNotification: (n) =>
        set({
          notifications: [{
            ...n,
            id: Math.random().toString(36).slice(2),
            timestamp: Date.now() / 1000,
            read: false,
          }, ...get().notifications].slice(0, 100)
        }),
      markRead: (id) =>
        set({ notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n) }),
      markAllRead: () =>
        set({ notifications: get().notifications.map(n => ({ ...n, read: true })) }),
      deleteNotification: (id) =>
        set({ notifications: get().notifications.filter(n => n.id !== id) }),
      clearAll: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter(n => !n.read).length,

      searchHistory: [],
      addSearchHistory: (query) => {
        const hist = get().searchHistory.filter(h => h !== query);
        set({ searchHistory: [query, ...hist].slice(0, 10) });
      },
      clearSearchHistory: () => set({ searchHistory: [] }),

      wsStatus: 'disconnected',
      setWsStatus: (wsStatus) => set({ wsStatus }),
    }),
    {
      name: 'hypurrscan-store',
      partialize: (state) => ({
        theme: state.theme,
        watchlist: state.watchlist,
        alerts: state.alerts,
        notifications: state.notifications,
        searchHistory: state.searchHistory,
      }),
    }
  )
);
  
