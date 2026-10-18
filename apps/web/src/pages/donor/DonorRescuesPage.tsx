import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { Rescue, RescueStatus } from '@mealbridge/shared';
import { HeartHandshake, Bike, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export function DonorRescuesPage() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRescues() {
      try {
        const res = await api.get<Rescue[]>('/rescues');
        if (res.data) {
          setRescues(res.data);
        }
      } catch {
        toast.error('Failed to load rescue missions');
      } finally {
        setIsLoading(false);
      }
    }
    loadRescues();
  }, []);

  const getStatusBadge = (status: RescueStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning" size="sm" dot>Open for Volunteer</Badge>;
      case 'ASSIGNED':
        return <Badge variant="warning" size="sm" dot>Volunteer Assigned</Badge>;
      case 'PICKED_UP':
        return <Badge variant="warning" size="sm" dot>In Transit</Badge>;
      case 'DELIVERED':
        return <Badge variant="success" size="sm" dot>Successfully Delivered</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Rescues & Transit Tracking
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Monitor real-time pickup status, volunteer assignments, and delivery confirmations for your donations.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-text text-sm">Loading rescue records...</div>
      ) : rescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mx-auto text-muted-text">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-forest-night text-base">No active rescues yet</h3>
          <p className="text-xs text-muted-text max-w-sm mx-auto">
            When a verified recipient organization claims your surplus food, the live rescue mission will appear here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {rescues.map((rescue) => (
            <GlassCard key={rescue.id} variant="light" padding="md" className="border-white/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forest-night text-sm">
                      {rescue.donation?.title || 'Food Donation'}
                    </span>
                    {getStatusBadge(rescue.status)}
                  </div>
                  <p className="text-xs text-muted-text">
                    Beneficiary: <span className="font-semibold text-forest-night">{rescue.recipientOrganization?.name || 'Partner NGO'}</span>
                  </p>
                </div>

                <div className="text-xs text-muted-text">
                  Mission ID: <span className="font-mono text-[11px]">{rescue.id.slice(0, 8)}...</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-bridge-green shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-text block">Volunteer</span>
                    <span className="font-semibold text-forest-night">
                      {rescue.volunteer?.name || 'Awaiting Claim'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-bridge-green shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-text block">Pickup Window</span>
                    <span className="font-semibold text-forest-night">
                      {rescue.donation?.pickupDeadline
                        ? new Date(rescue.donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Immediate'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-bridge-green shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-text block">Destination</span>
                    <span className="font-semibold text-forest-night truncate max-w-[140px] block">
                      {rescue.recipientOrganization?.city || 'Local Hub'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
