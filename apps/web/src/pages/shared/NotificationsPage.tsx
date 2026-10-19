import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Welcome to MealBridge',
      message: 'Your account has been configured with authenticated credentials.',
      time: 'Just now',
      isRead: false,
      type: 'SYSTEM',
    },
    {
      id: '2',
      title: 'Food Redistribution Alerts Enabled',
      message: 'You will receive real-time push events when matching food or rescues occur.',
      time: '10m ago',
      isRead: true,
      type: 'DISPATCH',
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
            Notifications &amp; Dispatch Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Real-time status changes and domain events delivered via Socket.IO.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <GlassCard
            key={n.id}
            variant="light"
            padding="md"
            className={`border-white/70 flex items-start gap-3 transition-colors ${
              !n.isRead ? 'bg-neon-pulse/10 border-neon-pulse/30' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-obsidian-shell">{n.title}</span>
                <span className="text-[10px] text-slate-text flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {n.time}
                </span>
              </div>
              <p className="text-xs text-slate-text">{n.message}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
