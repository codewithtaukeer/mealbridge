import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function PlatformSettingsPage() {
  const [autoExpireHours, setAutoExpireHours] = useState(4);
  const [maxVolunteerRadius, setMaxVolunteerRadius] = useState(30);
  const [requireOrgVerification, setRequireOrgVerification] = useState(true);
  const [enableRealtimeAlerts, setEnableRealtimeAlerts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Platform operational configuration updated');
    }, 400);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Platform Governance & Controls
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          System-wide operational parameters, expiry timers, and food security thresholds.
        </p>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-night">
              Redistribution Timers & Perimeter
            </h2>

            <Input
              label="Automatic Listing Expiry Window (Hours before deadline)"
              type="number"
              min="1"
              max="24"
              value={autoExpireHours}
              onChange={(e) => setAutoExpireHours(Number(e.target.value))}
            />

            <Input
              label="Max Volunteer Matching Perimeter (km)"
              type="number"
              min="5"
              max="100"
              value={maxVolunteerRadius}
              onChange={(e) => setMaxVolunteerRadius(Number(e.target.value))}
            />
          </div>

          <div className="pt-4 border-t border-black/5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-night">
              Compliance Enforcement
            </h2>

            <div className="p-3.5 rounded-card bg-white/60 border border-black/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-forest-night block">
                  Mandatory Organization Verification
                </span>
                <span className="text-[11px] text-muted-text">
                  Require manual administrative approval before allowing direct recipient food allocation.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireOrgVerification}
                onChange={(e) => setRequireOrgVerification(e.target.checked)}
                className="rounded border-black/20 text-bridge-green focus:ring-bridge-green"
              />
            </div>

            <div className="p-3.5 rounded-card bg-white/60 border border-black/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-forest-night block">
                  Socket.IO Real-Time Dispatch Alerts
                </span>
                <span className="text-[11px] text-muted-text">
                  Broadcast instant push updates to eligible recipients and couriers upon listing creation.
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableRealtimeAlerts}
                onChange={(e) => setEnableRealtimeAlerts(e.target.checked)}
                className="rounded border-black/20 text-bridge-green focus:ring-bridge-green"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4 text-forest-night" />}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="text-center text-[11px] text-muted-text flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-bridge-green" />
        <span>Platform settings are cryptographically logged to the immutable audit database</span>
      </div>
    </div>
  );
}
