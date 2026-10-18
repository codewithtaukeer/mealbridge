import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Save, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export function UserSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [urgentSmsAlerts, setUrgentSmsAlerts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Preferences saved successfully');
    }, 400);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
          Notification &amp; Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Control how and when you receive real-time surplus food dispatch alerts.
        </p>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.05em] text-obsidian-shell flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-neon-pulse" />
              Dispatch Notification Preferences
            </h2>

            <div className="p-3.5 rounded-card bg-obsidian-shell/5 border border-fog-border flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-obsidian-shell block">
                  Email Notifications
                </span>
                <span className="text-[11px] text-slate-text">
                  Receive daily summaries and donation reservation receipts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-black/20 text-neon-pulse focus:ring-neon-pulse"
              />
            </div>

            <div className="p-3.5 rounded-card bg-obsidian-shell/5 border border-fog-border flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-obsidian-shell block">
                  Real-Time Browser Push Alerts
                </span>
                <span className="text-[11px] text-slate-text">
                  Instant popup when fresh surplus food or rescue pickups are ready.
                </span>
              </div>
              <input
                type="checkbox"
                checked={browserNotifications}
                onChange={(e) => setBrowserNotifications(e.target.checked)}
                className="rounded border-black/20 text-neon-pulse focus:ring-neon-pulse"
              />
            </div>

            <div className="p-3.5 rounded-card bg-obsidian-shell/5 border border-fog-border flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-obsidian-shell block">
                  SMS Emergency Expiry Alerts
                </span>
                <span className="text-[11px] text-slate-text">
                  Urgent SMS when food deadline is within 60 minutes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={urgentSmsAlerts}
                onChange={(e) => setUrgentSmsAlerts(e.target.checked)}
                className="rounded border-black/20 text-neon-pulse focus:ring-neon-pulse"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4 text-obsidian-shell" />}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
