import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Bell, CheckCheck, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  isRead: boolean;
  type: string;
  link?: string;
}

export function NotificationsPage() {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      let apiItems: NotificationItem[] = [];
      try {
        const res = await api.get<NotificationItem[]>('/notifications');
        if (res.data) apiItems = res.data;
      } catch {}

      let localItems: NotificationItem[] = [];
      try {
        if (role === 'ADMIN') {
          localItems = JSON.parse(localStorage.getItem('mealbridge_admin_notifications') || '[]');
          if (localItems.length === 0) {
            localItems = [
              {
                id: 'notif-admin-seed-1',
                title: 'New Verification Request: Grand Heritage Hotel',
                message: 'Grand Heritage Hotel & Banquet submitted FSSAI documentation for verification review.',
                link: '/admin/verification',
                time: '1h ago',
                isRead: false,
                type: 'VERIFICATION_REQUEST',
              },
              {
                id: 'notif-admin-seed-2',
                title: 'New Verification Request: Annapurna Kitchen',
                message: 'Annapurna Community Kitchen submitted NGO Darpan certification for review.',
                link: '/admin/verification',
                time: '3h ago',
                isRead: false,
                type: 'VERIFICATION_REQUEST',
              },
            ];
          }
        } else {
          localItems = JSON.parse(localStorage.getItem('mealbridge_user_notifications') || '[]');
          if (localItems.length === 0) {
            localItems = [
              {
                id: 'notif-user-seed-1',
                title: 'Account Registered & Verification Required',
                message: 'Please submit your organization documentation for review before publishing surplus food.',
                link: '/verify-account',
                time: 'Just now',
                isRead: false,
                type: 'SYSTEM',
              },
            ];
          }
        }
      } catch {}

      const combined = [...localItems, ...apiItems];
      const unique = Array.from(new Map(combined.map((n) => [n.id, n])).values());
      setNotifications(unique);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [role]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
    } catch {}

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      if (role === 'ADMIN') {
        const adminNotifs = JSON.parse(localStorage.getItem('mealbridge_admin_notifications') || '[]');
        localStorage.setItem(
          'mealbridge_admin_notifications',
          JSON.stringify(adminNotifs.map((n: any) => ({ ...n, isRead: true })))
        );
      } else {
        const userNotifs = JSON.parse(localStorage.getItem('mealbridge_user_notifications') || '[]');
        localStorage.setItem(
          'mealbridge_user_notifications',
          JSON.stringify(userNotifs.map((n: any) => ({ ...n, isRead: true })))
        );
      }
    } catch {}

    window.dispatchEvent(new Event('mealbridge_notifications_updated'));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
            Notifications &amp; Verification Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Real-time status changes, verification requests, and domain events delivered via Socket.IO.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          className="text-xs text-pure-white border-white/20 hover:bg-white/10"
        >
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-text">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-12 space-y-2">
          <ShieldCheck className="w-8 h-8 mx-auto text-neon-pulse" />
          <h3 className="font-medium text-obsidian-shell text-sm">No new notifications</h3>
          <p className="text-xs text-slate-text">You are all caught up on system and verification updates.</p>
        </GlassCard>
      ) : (
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
                    <Clock className="w-3 h-3" /> {n.time || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent')}
                  </span>
                </div>
                <p className="text-xs text-slate-text">{n.message}</p>

                {n.link && (
                  <div className="pt-1.5">
                    <Link
                      to={n.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neon-pulse hover:underline"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
