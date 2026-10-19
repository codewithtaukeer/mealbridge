import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Donation, DonationStatus } from '@mealbridge/shared';
import {
  UtensilsCrossed,
  PlusCircle,
  Search,
  Clock,
  ArrowRight,
  Calendar,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function DonationsListPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingDonation, setCancellingDonation] = useState<Donation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelDonation = async () => {
    if (!cancellingDonation) return;
    try {
      setIsCancelling(true);
      const res = await api.post(`/donations/${cancellingDonation.id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by donor before NGO claim',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success(`Listing "${cancellingDonation.title}" cancelled successfully`);
        setCancellingDonation(null);
        setCancelReason('');
        await fetchDonations();
      }
    } catch {
      toast.error('Failed to cancel donation');
    } finally {
      setIsCancelling(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Donation[]>('/donations?mine=true&limit=50');
      if (res.data) {
        setDonations(res.data);
        setFilteredDonations(res.data);
      }
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...donations];

    if (selectedStatus !== 'ALL') {
      result = result.filter((d) => d.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.pickupCity.toLowerCase().includes(q)
      );
    }

    setFilteredDonations(result);
  }, [donations, selectedStatus, searchQuery]);

  const statusFilters = [
    { label: 'All Listings', value: 'ALL' },
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Reserved', value: 'RESERVED' },
    { label: 'In Transit', value: 'IN_RESCUE' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-pure-white">
            My Food Donations
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Manage your surplus food donations, inspect recipient claims, and track volunteer pickups.
          </p>
        </div>

        <Link to="/donor/donations/create">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4 text-obsidian-shell" />}
            className="shadow-md hover:shadow-glow-mint whitespace-nowrap"
          >
            Create Food Listing
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
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

        {/* Search */}
        <div className="w-full lg:w-72">
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-text" />}
          />
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading your donations...</div>
      ) : filteredDonations.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-4 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mx-auto text-slate-text">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-obsidian-shell text-base">
              No matching listings found
            </h3>
            <p className="text-xs text-slate-text max-w-sm mx-auto mt-1">
              {searchQuery || selectedStatus !== 'ALL'
                ? 'Try resetting your status or search filters.'
                : "Post today's surplus food to feed local communities."}
            </p>
          </div>
          <Link to="/donor/donations/create">
            <Button variant="primary" size="sm">
              Create New Listing
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonations.map((donation) => {
            const getStatusVariant = (status: DonationStatus) => {
              switch (status) {
                case 'AVAILABLE':
                  return 'success';
                case 'RESERVED':
                case 'IN_RESCUE':
                  return 'warning';
                case 'DELIVERED':
                  return 'neutral';
                case 'CANCELLED':
                case 'EXPIRED':
                  return 'danger';
                default:
                  return 'neutral';
              }
            };

            return (
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
                    <Badge variant={getStatusVariant(donation.status)} size="sm" dot>
                      {donation.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-obsidian-shell text-base line-clamp-1">
                      {donation.title}
                    </h3>
                    <p className="text-xs font-semibold text-neon-pulse mt-1">
                      {donation.quantity} {donation.unit.toLowerCase()}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-text pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-text" />
                      <span>
                        Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.pickupDeadline).toLocaleDateString()})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-text" />
                      <span>Listed: {new Date(donation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between gap-2">
                  <Link
                    to={`/donor/donations/${donation.id}`}
                    className="text-xs font-bold text-neon-pulse hover:underline flex items-center gap-1"
                  >
                    View Details & Matches <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {donation.status === 'AVAILABLE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2.5 text-soft-coral border-soft-coral/30 hover:bg-soft-coral/10 hover:border-soft-coral"
                      onClick={() => setCancellingDonation(donation)}
                    >
                      Cancel Listing
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingDonation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <GlassCard variant="light" padding="lg" className="max-w-md w-full border-white/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-soft-coral/20 flex items-center justify-center text-soft-coral">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-obsidian-shell">
                  Cancel Food Listing
                </h3>
                <span className="text-xs text-slate-text">Permitted only before an NGO claims</span>
              </div>
            </div>

            <p className="text-xs text-obsidian-shell leading-relaxed">
              Are you sure you want to cancel the listing for <span className="font-bold">{cancellingDonation.title}</span> ({cancellingDonation.quantity} {cancellingDonation.unit.toLowerCase()})? This will immediately remove it from all NGO discovery feeds.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-text uppercase tracking-[0.05em]">
                Cancellation Reason (Optional)
              </label>
              <Input
                placeholder="e.g. Accidental entry, inventory change, food quality issue"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCancellingDonation(null);
                  setCancelReason('');
                }}
                disabled={isCancelling}
              >
                Keep Listing
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-soft-coral border-soft-coral hover:bg-soft-coral/10"
                isLoading={isCancelling}
                onClick={handleCancelDonation}
              >
                Confirm Cancellation
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
