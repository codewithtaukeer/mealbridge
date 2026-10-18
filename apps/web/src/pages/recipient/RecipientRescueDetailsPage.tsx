import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Rescue } from '@mealbridge/shared';
import {
  Bike,
  Clock,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function RecipientRescueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [rescue, setRescue] = useState<Rescue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const loadRescue = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await api.get<Rescue>(`/rescues/${id}`);
      if (res.data) setRescue(res.data);
    } catch {
      toast.error('Failed to load rescue details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRescue();
  }, [id]);

  const handleConfirmDelivery = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      const res = await api.post(`/rescues/${id}/deliver`, {
        deliveryNotes: deliveryNotes || 'Confirmed received by recipient organization staff',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Food delivery confirmed! Thank you.');
        await loadRescue();
      }
    } catch {
      toast.error('Failed to confirm delivery');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-text text-sm">Loading rescue mission details...</div>;
  }

  if (!rescue) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-obsidian-shell">Rescue mission not found</h2>
        <Link to="/recipient/rescues">
          <Button variant="outline" size="sm">
            Back to Rescues
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PageContainer size="md" withBloom>
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/recipient/rescues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-pulse hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Rescues
        </Link>
        <Badge
          variant={
            rescue.status === 'DELIVERED'
              ? 'success'
              : rescue.status === 'PICKED_UP' || rescue.status === 'ASSIGNED'
              ? 'warning'
              : 'neutral'
          }
          size="md"
          dot
        >
          {rescue.status}
        </Badge>
      </div>

      <div className="space-y-6">
        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
          <div>
            <span className="text-[9px] uppercase font-medium text-slate-text tracking-[0.05em]">
              Rescue Mission #{rescue.id.slice(0, 8)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-obsidian-shell mt-1">
              {rescue.donation?.title}
            </h1>
            <p className="text-xs text-slate-text mt-1">
              From {rescue.donation?.donorOrganization?.name} ({rescue.donation?.pickupCity})
            </p>
          </div>

          {/* Volunteer Status Section */}
          <div className="p-4 rounded-xl bg-white/60 border border-black/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-pulse/15 flex items-center justify-center">
                <Bike className="w-5 h-5 text-neon-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-text">
                  Transport Volunteer
                </span>
                <p className="font-bold text-sm text-obsidian-shell">
                  {rescue.volunteer?.name || 'Awaiting volunteer claim'}
                </p>
                {rescue.volunteer?.phone && (
                  <p className="text-xs text-slate-text">{rescue.volunteer.phone}</p>
                )}
              </div>
            </div>

            <Badge variant={rescue.volunteerId ? 'success' : 'warning'} size="sm">
              {rescue.volunteerId ? 'Assigned' : 'Open'}
            </Badge>
          </div>

          {/* Action to confirm intake if picked up */}
          {rescue.status === 'PICKED_UP' && (
            <div className="p-4 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-neon-pulse shrink-0" />
                <h3 className="font-bold text-obsidian-shell text-sm">
                  Food Has Been Picked Up & Is In Transit
                </h3>
              </div>
              <p className="text-xs text-obsidian-shell/80">
                The volunteer has picked up the food from the donor. Once the shipment arrives at your facility, click below to confirm receipt.
              </p>

              <div className="pt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Optional delivery notes (e.g., received in cold storage)..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white/60 border border-black/10 focus:outline-none focus:border-neon-pulse"
                />
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isConfirming}
                  onClick={handleConfirmDelivery}
                >
                  Confirm Delivery Received
                </Button>
              </div>
            </div>
          )}

          {/* Completed State */}
          {rescue.status === 'DELIVERED' && (
            <div className="p-4 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-neon-pulse shrink-0" />
              <div className="text-xs text-obsidian-shell">
                <span className="font-bold text-sm block">Delivered & Verified</span>
                <p className="text-slate-text">
                  Delivered on {rescue.deliveredAt ? new Date(rescue.deliveredAt).toLocaleString() : 'Recently'}.
                </p>
              </div>
            </div>
          )}

          {/* Event History Stepper */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.05em] text-obsidian-shell">
              Mission Event Log
            </h2>
            <div className="space-y-2">
              {rescue.events && rescue.events.length > 0 ? (
                rescue.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-card bg-white/40 border border-black/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neon-pulse" />
                      <span className="font-bold text-obsidian-shell">
                        {evt.eventType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-text">
                      {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-text">No recorded events yet.</div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
