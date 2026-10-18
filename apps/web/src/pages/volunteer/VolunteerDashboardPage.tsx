import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Rescue } from '@mealbridge/shared';
import {
  Bike,
  HeartHandshake,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function VolunteerDashboardPage() {
  const { user } = useAuth();
  const [openRescues, setOpenRescues] = useState<Rescue[]>([]);
  const [myRescues, setMyRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [openRes, myRes] = await Promise.all([
        api.get<Rescue[]>('/rescues?filter=open'),
        api.get<Rescue[]>('/rescues'),
      ]);

      if (openRes.data) setOpenRescues(openRes.data);
      if (myRes.data) setMyRescues(myRes.data);
    } catch {
      toast.error('Failed to load volunteer dispatch board');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaim = async (rescueId: string) => {
    setClaimingId(rescueId);
    try {
      const res = await api.post(`/rescues/${rescueId}/claim`);
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Mission assigned to you! Safe travels.');
        await loadData();
      }
    } catch {
      toast.error('Failed to claim mission');
    } finally {
      setClaimingId(null);
    }
  };

  const activeMission = myRescues.find(
    (r) => r.volunteerId === user?.id && (r.status === 'ASSIGNED' || r.status === 'PICKED_UP')
  );
  const completedMissions = myRescues.filter(
    (r) => r.volunteerId === user?.id && r.status === 'DELIVERED'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Pick up surplus food from donors and transport it to community kitchens and shelters.
          </p>
        </div>

        <Link to="/volunteer/tasks">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Bike className="w-4 h-4 text-obsidian-shell" />}
            className="shadow-md hover:shadow-glow-mint whitespace-nowrap"
          >
            Find Open Missions
          </Button>
        </Link>
      </div>

      {/* Active Mission Alert Banner */}
      {activeMission && (
        <div className="p-4 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-soft">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse shrink-0 mt-0.5">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <Badge variant="warning" size="sm" className="mb-1" dot>
                {activeMission.status === 'ASSIGNED' ? 'Ready for Pickup' : 'In Transit'}
              </Badge>
              <h2 className="font-display font-medium text-base text-obsidian-shell">
                Active Mission: {activeMission.donation?.title}
              </h2>
              <p className="text-xs text-obsidian-shell/80 mt-0.5">
                Pickup from {activeMission.donation?.donorOrganization?.name} ({activeMission.donation?.pickupAddress})
              </p>
            </div>
          </div>

          <Link to="/volunteer/my-tasks">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              Manage Mission <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Open Missions</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/30 flex items-center justify-center">
              <Bike className="w-4 h-4 text-obsidian-shell" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-medium text-obsidian-shell">
              {openRescues.length}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Missions needing transport</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Completed Deliveries</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-medium text-obsidian-shell">
              {completedMissions.length}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Successful community drops</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Community Impact</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-gold/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-signal-yellow" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-medium text-obsidian-shell">
              {completedMissions.reduce((acc, curr) => acc + (curr.donation?.quantity || 0), 0)}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Meals delivered safely</span>
          </div>
        </GlassCard>
      </div>

      {/* Open Missions Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-medium text-obsidian-shell">
              Open Rescue Missions
            </h2>
            <p className="text-xs text-slate-text">Claim a surplus food batch and coordinate transport.</p>
          </div>
          <Link
            to="/volunteer/tasks"
            className="text-xs font-semibold text-neon-pulse hover:underline flex items-center gap-1"
          >
            View all missions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-text text-sm">Searching for open missions...</div>
        ) : openRescues.length === 0 ? (
          <GlassCard variant="light" padding="lg" className="text-center py-12 space-y-3 border-dashed">
            <HeartHandshake className="w-8 h-8 mx-auto text-slate-text" />
            <h3 className="font-medium text-obsidian-shell text-sm">No open rescue missions at the moment</h3>
            <p className="text-xs text-slate-text max-w-sm mx-auto">
              All currently reserved surplus food has been assigned to volunteer couriers. Check back shortly!
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openRescues.slice(0, 4).map((rescue) => (
              <GlassCard
                key={rescue.id}
                variant="light"
                padding="md"
                className="border-white/70 space-y-3 hover:shadow-glass-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-slate-text">
                      {rescue.donation?.category.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-display font-medium text-obsidian-shell text-base line-clamp-1">
                      {rescue.donation?.title}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-neon-pulse bg-neon-pulse/30 px-2.5 py-0.5 rounded-full">
                    {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-text pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    <span className="truncate">
                      Pickup: {rescue.donation?.donorOrganization?.name} ({rescue.donation?.pickupCity})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    <span className="truncate">
                      Dropoff: {rescue.recipientOrganization?.name} ({rescue.recipientOrganization?.city})
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs text-slate-text">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Deadline:{' '}
                    {rescue.donation?.pickupDeadline
                      ? new Date(rescue.donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'ASAP'}
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={claimingId === rescue.id}
                    onClick={() => handleClaim(rescue.id)}
                  >
                    Claim Mission
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
