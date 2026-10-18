import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Donation, MatchResult, DonationStatus } from '@mealbridge/shared';
import {
  Clock,
  MapPin,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Building,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function DonationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [donationRes, matchesRes] = await Promise.all([
        api.get<Donation>(`/donations/${id}`),
        api.get<MatchResult[]>(`/donations/${id}/matches`),
      ]);

      if (donationRes.data) {
        setDonation(donationRes.data);
      }
      if (matchesRes.data) {
        setMatches(matchesRes.data);
      }
    } catch {
      toast.error('Failed to load donation details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      const res = await api.post(`/donations/${id}/cancel`, {
        reason: cancelReason || 'Cancelled by donor',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Donation cancelled successfully');
        setShowCancelModal(false);
        navigate('/donor/donations');
      }
    } catch {
      toast.error('Failed to cancel donation');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-text text-sm">Loading donation details...</div>;
  }

  if (!donation) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-forest-night">Donation listing not found</h2>
        <Link to="/donor/donations">
          <Button variant="outline" size="sm">
            Back to Listings
          </Button>
        </Link>
      </div>
    );
  }

  const steps: { label: string; status: DonationStatus }[] = [
    { label: 'Listed Available', status: 'AVAILABLE' },
    { label: 'NGO Reserved', status: 'RESERVED' },
    { label: 'In Transit', status: 'IN_RESCUE' },
    { label: 'Delivered', status: 'DELIVERED' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.status === donation.status);

  return (
    <PageContainer size="lg" withBloom>
      {/* Top back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/donor/donations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-bridge-green hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Donations
        </Link>

        {donation.status !== 'DELIVERED' && donation.status !== 'CANCELLED' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            className="text-soft-coral hover:bg-soft-coral/10 text-xs border-soft-coral/30"
          >
            Cancel Listing
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {/* Header & Status Card */}
        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" size="sm">
                  {donation.category.replace(/_/g, ' ')}
                </Badge>
                <Badge
                  variant={
                    donation.status === 'AVAILABLE'
                      ? 'success'
                      : donation.status === 'DELIVERED'
                      ? 'neutral'
                      : 'warning'
                  }
                  size="md"
                  dot
                >
                  {donation.status}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
                {donation.title}
              </h1>
              <p className="text-xs text-muted-text mt-1">
                Listed on {new Date(donation.createdAt).toLocaleString()} • ID: {donation.id}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-black/10 sm:pl-6">
              <span className="text-xs font-bold text-muted-text uppercase tracking-wider block">
                Quantity
              </span>
              <span className="text-3xl font-display font-bold text-bridge-green">
                {donation.quantity}{' '}
                <span className="text-sm font-semibold text-forest-night">
                  {donation.unit.toLowerCase()}
                </span>
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {donation.status !== 'CANCELLED' ? (
            <div className="pt-4 border-t border-black/5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {steps.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div
                      key={step.label}
                      className={`p-3 rounded-card text-center border transition-all ${
                        isCurrent
                          ? 'bg-bridge-green text-white border-bridge-green shadow-sm'
                          : isDone
                          ? 'bg-fresh-mint/20 border-fresh-mint/40 text-forest-night'
                          : 'bg-black/5 border-black/5 text-muted-text'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                        Step {idx + 1}
                      </span>
                      <span className="text-xs font-bold mt-0.5 block">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-soft-coral/15 border border-soft-coral/30 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-soft-coral shrink-0" />
              <div className="text-xs text-forest-night">
                <span className="font-bold">This listing was cancelled.</span>
                <p className="text-muted-text mt-0.5">
                  Reason: {donation.cancellationReason || 'No specific reason provided'}
                </p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Logistics & Safety */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard variant="light" padding="lg" className="border-white/70 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest-night">
                Logistics & Pickup Schedule
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-card bg-white/60 border border-black/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-forest-night">
                    <Clock className="w-4 h-4 text-bridge-green" />
                    <span>Pickup Deadline</span>
                  </div>
                  <p className="text-muted-text">
                    {new Date(donation.pickupDeadline).toLocaleString()}
                  </p>
                </div>

                <div className="p-3.5 rounded-card bg-white/60 border border-black/5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-forest-night">
                    <MapPin className="w-4 h-4 text-bridge-green" />
                    <span>Pickup Location</span>
                  </div>
                  <p className="text-muted-text">
                    {donation.pickupAddress}, {donation.pickupCity}
                  </p>
                </div>
              </div>

              {donation.pickupInstructions && (
                <div className="p-3 rounded-card bg-black/5 text-xs text-forest-night">
                  <span className="font-bold block mb-0.5">Pickup Instructions:</span>
                  <span className="text-muted-text">{donation.pickupInstructions}</span>
                </div>
              )}

              {donation.storageRequirements && (
                <div className="p-3 rounded-card bg-fresh-mint/15 text-xs text-forest-night">
                  <span className="font-bold block mb-0.5">Storage Requirements:</span>
                  <span className="text-forest-night/80">{donation.storageRequirements}</span>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Column: Algorithmic Match Suggestions */}
          <div className="space-y-6">
            <GlassCard variant="light" padding="lg" className="border-white/70 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest-night flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-forest-night" />
                  Matching Beneficiaries
                </h2>
                <Badge variant="outline" size="sm">
                  {matches.length} Matched
                </Badge>
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-text">
                  No verified NGOs currently matching this specific food type and radius.
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 3).map((match) => (
                    <div
                      key={match.organizationId}
                      className="p-3 rounded-card bg-white/60 border border-black/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-forest-night truncate max-w-[150px]">
                          {match.organization.name}
                        </span>
                        <span className="font-extrabold text-bridge-green px-2 py-0.5 rounded-full bg-fresh-mint/30 text-[10px]">
                          {match.score}% Match
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-text flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        <span>{match.organization.city}</span>
                        {match.distance != null && <span>• {match.distance} km</span>}
                      </div>

                      <ul className="text-[10px] text-forest-night/80 space-y-0.5 pt-1">
                        {match.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-bridge-green shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard variant="light" padding="lg" className="max-w-md w-full border-white/80 space-y-4">
            <div className="flex items-center gap-3 text-soft-coral">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-display font-bold text-lg text-forest-night">
                Cancel Food Donation
              </h3>
            </div>
            <p className="text-xs text-muted-text leading-relaxed">
              Are you sure you want to cancel this donation? If an NGO has reserved this food, they will be notified immediately.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-forest-night">
                Cancellation Reason (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Storage temperature deviation, unexpected staff shortage..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-card bg-white/80 border border-black/10 text-xs text-primary-text focus:outline-none focus:ring-2 focus:ring-bridge-green/30"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Go Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-soft-coral/15 text-soft-coral border-soft-coral/30 hover:bg-soft-coral/25"
                isLoading={isCancelling}
                onClick={handleCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </PageContainer>
  );
}
