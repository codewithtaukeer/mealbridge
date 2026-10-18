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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Active Missions
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Missions assigned to you. Follow the pickup and delivery sequence to keep all parties updated.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-text text-sm">Loading active missions...</div>
      ) : rescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <PackageCheck className="w-10 h-10 mx-auto text-bridge-green" />
          <h3 className="font-bold text-forest-night text-base">No active missions in progress</h3>
          <p className="text-xs text-muted-text max-w-sm mx-auto">
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
                  <h2 className="font-display font-bold text-lg text-forest-night">
                    {rescue.donation?.title}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-muted-text block">
                    Quantity
                  </span>
                  <span className="text-xl font-display font-bold text-bridge-green">
                    {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Waypoint Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Pickup */}
                <div
                  className={`p-4 rounded-card border transition-all ${
                    rescue.status === 'ASSIGNED'
                      ? 'bg-bridge-green/10 border-bridge-green shadow-sm'
                      : 'bg-white/60 border-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-night flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-bridge-green" />
                      1. Pickup Point
                    </span>
                    {rescue.status === 'PICKED_UP' && (
                      <Badge variant="success" size="sm">
                        Picked Up
                      </Badge>
                    )}
                  </div>
                  <p className="font-bold text-sm text-forest-night">
                    {rescue.donation?.donorOrganization?.name}
                  </p>
                  <p className="text-xs text-muted-text mt-0.5">
                    {rescue.donation?.pickupAddress}, {rescue.donation?.pickupCity}
                  </p>
                  {rescue.donation?.donorOrganization?.phone && (
                    <div className="flex items-center gap-1 text-xs text-bridge-green font-semibold mt-2">
                      <Phone className="w-3 h-3" />
                      <span>{rescue.donation.donorOrganization.phone}</span>
                    </div>
                  )}
                </div>

                {/* Step 2: Dropoff */}
                <div
                  className={`p-4 rounded-card border transition-all ${
                    rescue.status === 'PICKED_UP'
                      ? 'bg-bridge-green/10 border-bridge-green shadow-sm'
                      : 'bg-white/60 border-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-night flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-bridge-green" />
                      2. Destination
                    </span>
                  </div>
                  <p className="font-bold text-sm text-forest-night">
                    {rescue.recipientOrganization?.name}
                  </p>
                  <p className="text-xs text-muted-text mt-0.5">
                    {rescue.recipientOrganization?.address}, {rescue.recipientOrganization?.city}
                  </p>
                  {rescue.recipientOrganization?.phone && (
                    <div className="flex items-center gap-1 text-xs text-bridge-green font-semibold mt-2">
                      <Phone className="w-3 h-3" />
                      <span>{rescue.recipientOrganization.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {rescue.status === 'ASSIGNED' ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-md hover:shadow-glow-mint"
                    isLoading={activeActionId === rescue.id}
                    onClick={() => handleConfirmPickup(rescue.id)}
                    leftIcon={<PackageCheck className="w-5 h-5 text-forest-night" />}
                  >
                    Confirm Food Pickup from Donor
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-md hover:shadow-glow-mint"
                    isLoading={activeActionId === rescue.id}
                    onClick={() => handleConfirmDelivery(rescue.id)}
                    leftIcon={<CheckCircle2 className="w-5 h-5 text-forest-night" />}
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
