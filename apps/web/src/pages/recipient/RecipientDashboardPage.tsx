import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Donation, Rescue } from '@mealbridge/shared';
import {
  UtensilsCrossed,
  HeartHandshake,
  Clock,
  Sparkles,
  ArrowRight,
  MapPin,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function RecipientDashboardPage() {
  const { user, organization } = useAuth();
  const [availableFood, setAvailableFood] = useState<Donation[]>([]);
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [foodRes, rescuesRes] = await Promise.all([
        api.get<Donation[]>('/donations?status=AVAILABLE&limit=4'),
        api.get<Rescue[]>('/rescues'),
      ]);

      if (foodRes.data) setAvailableFood(foodRes.data);
      if (rescuesRes.data) setRescues(rescuesRes.data);
    } catch {
      toast.error('Failed to load dashboard feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickReserve = async (donationId: string) => {
    setReservingId(donationId);
    try {
      const res = await api.post(`/donations/${donationId}/reserve`);
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Food donation reserved! Rescue mission initiated.');
        await loadData();
      }
    } catch {
      toast.error('Failed to reserve food');
    } finally {
      setReservingId(null);
    }
  };

  const activeRescues = rescues.filter(
    (r) => r.status === 'OPEN' || r.status === 'ASSIGNED' || r.status === 'PICKED_UP'
  );
  const deliveredRescues = rescues.filter((r) => r.status === 'DELIVERED');
  const totalPortionsReceived = deliveredRescues.reduce(
    (acc, curr) => acc + (curr.donation?.quantity || 0),
    0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-pure-white">
            Welcome, {organization?.name || user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Claim available surplus meals in your region and track volunteer deliveries in real time.
          </p>
        </div>

        <Link to="/recipient/food">
          <Button
            variant="primary"
            size="md"
            leftIcon={<UtensilsCrossed className="w-4 h-4 text-obsidian-shell" />}
            className="shadow-md hover:shadow-glow-mint whitespace-nowrap"
          >
            Browse Available Food
          </Button>
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Incoming Deliveries</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/30 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-obsidian-shell" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {activeRescues.length}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Active transit missions</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Portions Received</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {totalPortionsReceived}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Meals served to community</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Available Surplus</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-gold/25 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-signal-yellow" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {availableFood.length} Listings
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Ready for immediate claim</span>
          </div>
        </GlassCard>
      </div>

      {/* Available Food Feed Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-obsidian-shell">
              Surplus Food Ready for Claim
            </h2>
            <p className="text-xs text-slate-text">Recently posted by verified local restaurants and kitchens.</p>
          </div>
          <Link
            to="/recipient/food"
            className="text-xs font-semibold text-neon-pulse hover:underline flex items-center gap-1"
          >
            View all available <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-text text-sm">Searching for surplus food...</div>
        ) : availableFood.length === 0 ? (
          <GlassCard variant="light" padding="lg" className="text-center py-12 space-y-3 border-dashed">
            <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-text" />
            <h3 className="font-bold text-obsidian-shell text-sm">No unclaimed surplus food right now</h3>
            <p className="text-xs text-slate-text max-w-sm mx-auto">
              You will be alerted automatically via Socket.IO real-time notification as soon as fresh food is posted in your area.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableFood.map((donation) => (
              <GlassCard
                key={donation.id}
                variant="light"
                padding="md"
                className="border-white/70 space-y-3 hover:shadow-glass-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" size="sm" className="text-[10px]">
                      {donation.category.replace(/_/g, ' ')}
                    </Badge>
                    <h3 className="font-display font-bold text-obsidian-shell text-base line-clamp-1">
                      {donation.title}
                    </h3>
                  </div>

                  <span className="text-xs font-medium text-neon-pulse bg-neon-pulse/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {donation.quantity} {donation.unit.toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-text pt-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    <span className="truncate">{donation.donorOrganization?.name || 'Local Kitchen'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    <span className="truncate">{donation.pickupCity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-soft-coral font-medium bg-soft-coral/10 p-2 rounded-lg">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Pickup Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-3">
                  <Link
                    to={`/recipient/food/${donation.id}`}
                    className="text-xs font-semibold text-neon-pulse hover:underline"
                  >
                    View Details
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={reservingId === donation.id}
                    onClick={() => handleQuickReserve(donation.id)}
                  >
                    Claim Food
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Incoming Rescues Tracking */}
      {activeRescues.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-obsidian-shell">
              Active Incoming Deliveries
            </h2>
            <Link
              to="/recipient/rescues"
              className="text-xs font-semibold text-neon-pulse hover:underline flex items-center gap-1"
            >
              All rescues <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeRescues.map((rescue) => (
              <GlassCard key={rescue.id} variant="light" padding="md" className="border-white/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-obsidian-shell text-sm">
                      {rescue.donation?.title || 'Claimed Food'}
                    </span>
                    <Badge variant="warning" size="sm" dot>
                      {rescue.status}
                    </Badge>
                  </div>
                  <Link to={`/recipient/rescues/${rescue.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Track Live
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-text">
                  <span>Donor: {rescue.donation?.donorOrganization?.name}</span>
                  <span>•</span>
                  <span>Volunteer: {rescue.volunteer?.name || 'Awaiting assignment'}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
