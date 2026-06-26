import React from 'react';
import { Bell, BellOff, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { EmptyState } from '@/components/common/UIComponents';
import { useAppStore } from '@/stores/appStore';
import { formatTime } from '@/lib/mockData';
import { toast } from 'sonner';

const TYPE_ICON: Record<string, string> = {
  alert: '🔔', system: 'ℹ️', whale: '🐳', liquidation: '⚡'
};

const TYPE_COLORS: Record<string, string> = {
  alert: 'border-l-cyan',
  system: 'border-l-muted-foreground',
  whale: 'border-l-yellow-400',
  liquidation: 'border-l-negative',
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, deleteNotification, clearAll } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-balance">Notification Center</h1>
            <p className="text-xs text-muted-foreground text-pretty">
              {unreadCount} unread · {notifications.length} total
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { markAllRead(); toast.success('All marked as read'); }}>
                <CheckCheck className="w-3.5 h-3.5 mr-1" />Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" className="h-7 text-xs text-negative hover:text-negative" onClick={() => { clearAll(); toast.info('Cleared all notifications'); }}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="terminal-panel divide-y divide-border/30">
          {notifications.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No notifications yet. Set up alerts to receive notifications here." />
            </div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              className={`flex gap-3 p-4 border-l-2 transition-colors hover:bg-accent/20 cursor-pointer ${TYPE_COLORS[n.type] || 'border-l-border'} ${n.read ? 'opacity-60' : 'bg-accent/5'}`}
              onClick={() => markRead(n.id)}
            >
              <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center shrink-0 text-sm">
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{n.title}</span>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.timestamp)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{n.message}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                className="text-muted-foreground hover:text-negative shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
