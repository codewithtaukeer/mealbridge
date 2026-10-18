import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Rescue, RescueStatus } from '@mealbridge/shared';
import {
  HeartHandshake,
  MapPin,
  Bike,
  Building,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AcceptedRescuesPage() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [filteredRescues, setFilteredRescues] = useState<Rescue[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRescues = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Rescue[]>('/rescues');
      if (res.data) {
        setRescues(res.data);
        setFilteredRescues(res.data);
      }
    } catch {
      toast.error('Failed to load rescues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRescues();
  }, []);

  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredRescues(rescues);
    } else {
      setFilteredRescues(rescues.filter((r) => r.status === selectedStatus));
    }
  }, [rescues, selectedStatus]);

  const getStatusBadge = (status: RescueStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning" size="sm" dot>Open for Volunteer</Badge>;
      case 'ASSIGNED':
        return <Badge variant="warning" size="sm" dot>Volunteer Assigned</Badge>;
      case 'PICKED_UP':
        return <Badge variant="warning" size="sm" dot>In Transit</Badge>;
      case 'DELIVERED':
        return <Badge variant="success" size="sm" dot>Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const statusFilters = [
    { label: 'All Rescues', value: 'ALL' },
    { label: 'Awaiting Volunteer', value: 'OPEN' },
    { label: 'In Progress', value: 'ASSIGNED' },
    { label: 'In Transit', value: 'PICKED_UP' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-obsidian-shell">
            Incoming Rescues & Deliveries
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Track volunteer assignments, vehicle transit status, and confirm intake upon arrival.
          </p>
        </div>

        <Link to="/recipient/food">
          <Button variant="primary" size="md">
            Claim More Food
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
        {statusFilters.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setSelectedStatus(sf.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === sf.value
                ? 'bg-neon-pulse text-white shadow-sm'
                : 'bg-white/60 text-slate-text hover:bg-white/90 border border-black/5'
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading rescue missions...</div>
      ) : filteredRescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <HeartHandshake className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-bold text-obsidian-shell text-base">No rescue records found</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            Reserve surplus food from the available listings to create and dispatch a new rescue mission.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredRescues.map((rescue) => (
            <GlassCard key={rescue.id} variant="light" padding="md" className="border-white/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-obsidian-shell text-base">
                      {rescue.donation?.title || 'Claimed Food Listing'}
                    </span>
                    {getStatusBadge(rescue.status)}
                  </div>
                  <p className="text-xs text-slate-text flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-neon-pulse" />
                    <span>Donor: {rescue.donation?.donorOrganization?.name || 'Local Donor'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/recipient/rescues/${rescue.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Live Mission Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-neon-pulse shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-text block">Volunteer Assigned</span>
                    <span className="font-semibold text-obsidian-shell">
                      {rescue.volunteer?.name || 'Awaiting volunteer claim'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-neon-pulse shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-text block">Total Portions</span>
                    <span className="font-semibold text-obsidian-shell">
                      {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neon-pulse shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-text block">Pickup City</span>
                    <span className="font-semibold text-obsidian-shell">
                      {rescue.donation?.pickupCity}
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
