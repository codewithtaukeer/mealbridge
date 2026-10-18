import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FOOD_CATEGORIES } from '@mealbridge/shared';
import type { Donation } from '@mealbridge/shared';
import {
  UtensilsCrossed,
  Search,
  Clock,
  MapPin,
  Building,
  HeartHandshake,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AvailableFoodPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const [confirmModalDonation, setConfirmModalDonation] = useState<Donation | null>(null);

  const fetchAvailableFood = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Donation[]>('/donations?status=AVAILABLE&limit=50');
      if (res.data) {
        setDonations(res.data);
      }
    } catch {
      toast.error('Failed to load available food listings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableFood();
  }, []);

  const handleClaim = async (donation: Donation) => {
    setReservingId(donation.id);
    try {
      const res = await api.post(`/donations/${donation.id}/reserve`);
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success(`Reserved ${donation.quantity} ${donation.unit.toLowerCase()} of ${donation.title}!`);
        setConfirmModalDonation(null);
        await fetchAvailableFood();
      }
    } catch {
      toast.error('Failed to reserve food listing');
    } finally {
      setReservingId(null);
    }
  };

  const filtered = donations.filter((d) => {
    const matchCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorOrganization?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-obsidian-shell">
          Available Surplus Food
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Real-time food listings posted by verified donor restaurants, caterers, and hotels.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-neon-pulse text-white shadow-sm'
                : 'bg-white/60 text-slate-text hover:bg-white/90 border border-black/5'
            }`}
          >
            All Categories
          </button>
          {FOOD_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-neon-pulse text-white shadow-sm'
                  : 'bg-white/60 text-slate-text hover:bg-white/90 border border-black/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full lg:w-72">
          <Input
            placeholder="Search food or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-text" />}
          />
        </div>
      </div>

      {/* Food Listings Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Searching for surplus food...</div>
      ) : filtered.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-bold text-obsidian-shell text-base">No matching food listings available</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            Try adjusting your search criteria. New food donations are posted throughout the day.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((donation) => (
            <GlassCard
              key={donation.id}
              variant="light"
              padding="md"
              className="border-white/70 flex flex-col justify-between hover:shadow-glass-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {donation.category.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs font-medium text-neon-pulse bg-neon-pulse/30 px-2.5 py-0.5 rounded-full">
                    {donation.quantity} {donation.unit.toLowerCase()}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-obsidian-shell text-base line-clamp-1">
                    {donation.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-text mt-1">
                    <Building className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    <span className="truncate">{donation.donorOrganization?.name || 'Local Kitchen'}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-text">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-text shrink-0" />
                    <span className="truncate">{donation.pickupAddress}, {donation.pickupCity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-soft-coral font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.pickupDeadline).toLocaleDateString()})
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between gap-2">
                <Link
                  to={`/recipient/food/${donation.id}`}
                  className="text-xs font-semibold text-neon-pulse hover:underline"
                >
                  Full Safety Specs
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmModalDonation(donation)}
                >
                  Claim Food
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalDonation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <GlassCard variant="light" padding="lg" className="max-w-md w-full border-white/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-pulse/30 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-obsidian-shell" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-obsidian-shell">
                  Confirm Food Reservation
                </h3>
                <span className="text-xs text-slate-text">Single-winner atomic transaction</span>
              </div>
            </div>

            <p className="text-xs text-obsidian-shell leading-relaxed">
              You are claiming{' '}
              <span className="font-bold">
                {confirmModalDonation.quantity} {confirmModalDonation.unit.toLowerCase()}
              </span>{' '}
              of <span className="font-bold">{confirmModalDonation.title}</span> from{' '}
              <span className="font-bold">{confirmModalDonation.donorOrganization?.name}</span>.
            </p>

            <div className="p-3 rounded-card bg-neon-pulse/10 text-xs text-obsidian-shell space-y-1">
              <span className="font-bold block">Next steps upon reservation:</span>
              <p className="text-[11px] text-obsidian-shell/80">
                1. A rescue mission is automatically published to local transport volunteers.
                <br />
                2. You receive live updates as soon as a volunteer accepts pickup.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmModalDonation(null)}
                disabled={reservingId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={reservingId === confirmModalDonation.id}
                onClick={() => handleClaim(confirmModalDonation)}
              >
                Confirm & Reserve
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
