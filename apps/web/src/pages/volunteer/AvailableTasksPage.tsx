import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Rescue } from '@mealbridge/shared';
import { Bike, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function AvailableTasksPage() {
  const [openRescues, setOpenRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchOpenRescues = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Rescue[]>('/rescues?filter=open');
      if (res.data) setOpenRescues(res.data);
    } catch {
      toast.error('Failed to load open rescue missions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenRescues();
  }, []);

  const handleClaim = async (rescueId: string) => {
    setClaimingId(rescueId);
    try {
      const res = await api.post(`/rescues/${rescueId}/claim`);
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Mission assigned to you! Please proceed to pickup.');
        await fetchOpenRescues();
      }
    } catch {
      toast.error('Failed to claim mission');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
          Available Rescue Missions
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Open missions claimed by recipient NGOs requiring transport from donor kitchens.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Searching for open missions...</div>
      ) : openRescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <Bike className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-medium text-obsidian-shell text-base">No open missions available</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            All current surplus food claims have been assigned to couriers. We will notify you when a new mission is listed.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openRescues.map((rescue) => (
            <GlassCard
              key={rescue.id}
              variant="light"
              padding="md"
              className="border-white/70 flex flex-col justify-between hover:shadow-glass-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {rescue.donation?.category.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs font-medium text-neon-pulse bg-neon-pulse/30 px-2 py-0.5 rounded-full">
                    {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-medium text-obsidian-shell text-base line-clamp-1">
                    {rescue.donation?.title}
                  </h3>
                  <span className="text-xs text-slate-text">
                    Mission #{rescue.id.slice(0, 8)}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-text pt-1">
                  <div className="p-2 rounded-card bg-obsidian-shell/5 border border-fog-border space-y-1">
                    <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-obsidian-shell block">
                      Pickup From:
                    </span>
                    <p className="font-semibold text-obsidian-shell">
                      {rescue.donation?.donorOrganization?.name}
                    </p>
                    <p className="text-slate-text truncate">
                      {rescue.donation?.pickupAddress}, {rescue.donation?.pickupCity}
                    </p>
                  </div>

                  <div className="p-2 rounded-card bg-obsidian-shell/5 border border-fog-border space-y-1">
                    <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-obsidian-shell block">
                      Deliver To:
                    </span>
                    <p className="font-semibold text-obsidian-shell">
                      {rescue.recipientOrganization?.name}
                    </p>
                    <p className="text-slate-text truncate">
                      {rescue.recipientOrganization?.address}, {rescue.recipientOrganization?.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-soft-coral font-medium pt-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Deadline:{' '}
                    {rescue.donation?.pickupDeadline
                      ? new Date(rescue.donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Immediate'}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/5">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={claimingId === rescue.id}
                  onClick={() => handleClaim(rescue.id)}
                >
                  Claim &amp; Start Mission
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
