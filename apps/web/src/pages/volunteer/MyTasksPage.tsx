import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Rescue } from '@mealbridge/shared';
import {
  CheckCircle2,
  MapPin,
  Phone,
  HeartHandshake,
  PackageCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LiveMissionRouteMap } from '@/components/volunteer/LiveMissionRouteMap';

export function MyTasksPage() {
  const { user } = useAuth();
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const fetchMyRescues = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Rescue[]>('/rescues');
      if (res.data) {
        // filter for active assignments for this volunteer
        const active = res.data.filter(
          (r) =>
            r.volunteerId === user?.id &&
            (r.status === 'ASSIGNED' || r.status === 'PICKED_UP')
        );
        setRescues(active);
      }
    } catch {
      toast.error('Failed to load active missions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRescues();
  }, [user?.id]);

  const handleConfirmPickup = async (rescueId: string) => {
    setActiveActionId(rescueId);
    try {
      const res = await api.post(`/rescues/${rescueId}/pickup`, {
        pickupNotes: 'Picked up securely; temperature and packaging checked',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Pickup confirmed! Proceed to recipient drop-off.');
        await fetchMyRescues();
      }
    } catch {
      toast.error('Failed to confirm pickup');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleConfirmDelivery = async (rescueId: string) => {
    setActiveActionId(rescueId);
    try {
      const res = await api.post(`/rescues/${rescueId}/deliver`, {
        deliveryNotes: 'Delivered to recipient organization kitchen staff',
        deliveryEvidence: 'Delivery verified by recipient coordinator',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Delivery completed! Excellent work rescuing surplus food.');
        await fetchMyRescues();
      }
    } catch {
      toast.error('Failed to confirm delivery');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleCancelMission = async (rescueId: string) => {
    setActiveActionId(rescueId);
    try {
      const res = await api.post(`/rescues/${rescueId}/cancel`, {
        reason: 'Courier unavailable due to emergency. Mission re-dispatched to nearby couriers.',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast('Mission released. Nearby volunteers within range have been notified via Socket.IO!', {
          icon: '📢',
          style: {
            background: '#0e1a19',
            color: '#ffffff',
            border: '1px solid #3ddc91',
          },
        });
        await fetchMyRescues();
      }
    } catch {
      toast.error('Failed to release mission');
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
          Active Missions
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Missions assigned to you. Follow the pickup and delivery sequence to keep all parties updated.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading active missions...</div>
      ) : rescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <PackageCheck className="w-10 h-10 mx-auto text-neon-pulse" />
          <h3 className="font-medium text-obsidian-shell text-base">No active missions in progress</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            You have no pending pickups or deliveries. Head over to Available Missions to claim a new run.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {rescues.map((rescue) => (
            <GlassCard key={rescue.id} variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" size="sm">
                      {rescue.donation?.category.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="warning" size="md" dot>
                      {rescue.status === 'ASSIGNED' ? 'Ready for Pickup' : 'In Transit'}
                    </Badge>
                  </div>
                  <h2 className="font-display font-medium text-lg text-obsidian-shell">
                    {rescue.donation?.title}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-slate-text block">
                    Quantity
                  </span>
                  <span className="text-xl font-display font-medium text-neon-pulse">
                    {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Interactive Live Multi-Stop Route & GPS Telemetry */}
              <LiveMissionRouteMap rescue={rescue} />

              {/* Waypoint Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Pickup */}
                <div
                  className={`p-4 rounded-card border transition-all ${
                    rescue.status === 'ASSIGNED'
                      ? 'bg-neon-pulse/10 border-neon-pulse shadow-sm'
                      : 'bg-obsidian-shell/5 border-fog-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-[0.05em] text-obsidian-shell flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neon-pulse" />
                      1. Pickup Point
                    </span>
                    {rescue.status === 'PICKED_UP' && (
                      <Badge variant="success" size="sm">
                        Picked Up
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm text-obsidian-shell">
                    {rescue.donation?.donorOrganization?.name}
                  </p>
                  <p className="text-xs text-slate-text mt-0.5">
                    {rescue.donation?.pickupAddress}, {rescue.donation?.pickupCity}
                  </p>
                  <div className="pt-2">
                    <a
                      href={`tel:${rescue.donation?.donorOrganization?.phone || '+91 98765 11223'}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neon-pulse/15 text-xs text-obsidian-shell font-semibold hover:bg-neon-pulse/25 transition-colors"
                      title="Call Restaurant Kitchen"
                    >
                      <Phone className="w-3.5 h-3.5 text-neon-pulse" />
                      <span>{rescue.donation?.donorOrganization?.phone || '+91 98765 11223'}</span>
                    </a>
                  </div>
                </div>

                {/* Step 2: Dropoff */}
                <div
                  className={`p-4 rounded-card border transition-all ${
                    rescue.status === 'PICKED_UP'
                      ? 'bg-neon-pulse/10 border-neon-pulse shadow-sm'
                      : 'bg-obsidian-shell/5 border-fog-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-[0.05em] text-obsidian-shell flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-neon-pulse" />
                      2. Destination (NGO)
                    </span>
                  </div>
                  <p className="font-medium text-sm text-obsidian-shell">
                    {rescue.recipientOrganization?.name}
                  </p>
                  <p className="text-xs text-slate-text mt-0.5">
                    {rescue.recipientOrganization?.address}, {rescue.recipientOrganization?.city}
                  </p>
                  <div className="pt-2">
                    <a
                      href={`tel:${rescue.recipientOrganization?.phone || '+91 98765 99887'}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neon-pulse/15 text-xs text-obsidian-shell font-semibold hover:bg-neon-pulse/25 transition-colors"
                      title="Call NGO Desk"
                    >
                      <Phone className="w-3.5 h-3.5 text-neon-pulse" />
                      <span>{rescue.recipientOrganization?.phone || '+91 98765 99887'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {rescue.status === 'ASSIGNED' ? (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1 justify-center shadow-md hover:shadow-glow-mint"
                      isLoading={activeActionId === rescue.id}
                      onClick={() => handleConfirmPickup(rescue.id)}
                      leftIcon={<PackageCheck className="w-5 h-5 text-obsidian-shell" />}
                    >
                      Confirm Food Pickup from Donor
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-soft-coral border-soft-coral/30 hover:bg-soft-coral/10 justify-center"
                      isLoading={activeActionId === rescue.id}
                      onClick={() => handleCancelMission(rescue.id)}
                    >
                      Release & Re-notify Nearby Volunteers
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-md hover:shadow-glow-mint"
                    isLoading={activeActionId === rescue.id}
                    onClick={() => handleConfirmDelivery(rescue.id)}
                    leftIcon={<CheckCircle2 className="w-5 h-5 text-obsidian-shell" />}
                  >
                    Confirm Delivery to Recipient Facility
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
