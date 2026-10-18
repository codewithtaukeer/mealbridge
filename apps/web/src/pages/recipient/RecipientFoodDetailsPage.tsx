import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Donation } from '@mealbridge/shared';
import {
  Clock,
  MapPin,
  Building,
  ArrowLeft,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function RecipientFoodDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    async function loadDonation() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await api.get<Donation>(`/donations/${id}`);
        if (res.data) setDonation(res.data);
      } catch {
        toast.error('Failed to load food details');
      } finally {
        setIsLoading(false);
      }
    }
    loadDonation();
  }, [id]);

  const handleReserve = async () => {
    if (!id || !donation) return;
    setIsReserving(true);
    try {
      const res = await api.post(`/donations/${id}/reserve`);
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Food reserved! Rescue mission initiated.');
        navigate('/recipient/rescues');
      }
    } catch {
      toast.error('Failed to reserve food');
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-text text-sm">Loading food details...</div>;
  }

  if (!donation) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-obsidian-shell">Food listing not found</h2>
        <Link to="/recipient/food">
          <Button variant="outline" size="sm">
            Back to Available Food
          </Button>
        </Link>
      </div>
    );
  }

  let allergens: string[] = [];
  try {
    allergens = JSON.parse((donation as unknown as { allergensJson?: string }).allergensJson || '[]');
  } catch {
    allergens = donation.allergens || [];
  }

  return (
    <PageContainer size="md" withBloom>
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/recipient/food"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-pulse hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Available Food
        </Link>
        <Badge variant={donation.status === 'AVAILABLE' ? 'success' : 'neutral'} size="sm" dot>
          {donation.status}
        </Badge>
      </div>

      <div className="space-y-6">
        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <Badge variant="outline" size="sm" className="mb-2">
                {donation.category.replace(/_/g, ' ')}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-obsidian-shell">
                {donation.title}
              </h1>
              <p className="text-xs text-slate-text mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neon-pulse" />
                <span>{donation.donorOrganization?.name} • {donation.pickupCity}</span>
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-black/10 sm:pl-6">
              <span className="text-xs font-bold text-slate-text uppercase tracking-[0.05em] block">
                Quantity
              </span>
              <span className="text-3xl font-display font-bold text-neon-pulse">
                {donation.quantity}{' '}
                <span className="text-sm font-semibold text-obsidian-shell">
                  {donation.unit.toLowerCase()}
                </span>
              </span>
            </div>
          </div>

          {/* Description */}
          {donation.description && (
            <p className="text-xs text-slate-text leading-relaxed p-3 rounded-card bg-white/60 border border-black/5">
              {donation.description}
            </p>
          )}

          {/* Pickup & Expiry Alert */}
          <div className="p-3.5 rounded-card bg-signal-yellow/10 border border-signal-yellow/30 flex items-start gap-3">
            <Clock className="w-5 h-5 text-signal-yellow shrink-0 mt-0.5" />
            <div className="text-xs text-obsidian-shell space-y-0.5">
              <span className="font-bold">Must Be Collected Before:</span>
              <p className="font-semibold text-sm">
                {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                {new Date(donation.pickupDeadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Location & Access */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.05em] text-obsidian-shell">
              Pickup Location & Instructions
            </h2>
            <div className="p-3.5 rounded-card bg-white/60 border border-black/5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-obsidian-shell">
                <MapPin className="w-4 h-4 text-neon-pulse" />
                <span>{donation.pickupAddress}, {donation.pickupCity}</span>
              </div>
              {donation.pickupInstructions && (
                <p className="text-slate-text">
                  <span className="font-semibold text-obsidian-shell">Access Note: </span>
                  {donation.pickupInstructions}
                </p>
              )}
            </div>
          </div>

          {/* Allergens & Storage */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.05em] text-obsidian-shell">
              Allergen & Storage Specifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-card bg-white/60 border border-black/5 space-y-1">
                <span className="font-bold text-obsidian-shell block">Contained Allergens:</span>
                {allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allergens.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 rounded-full bg-soft-coral/20 text-soft-coral font-semibold text-[10px]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-text">None declared by donor</span>
                )}
              </div>

              <div className="p-3 rounded-card bg-white/60 border border-black/5 space-y-1">
                <span className="font-bold text-obsidian-shell block">Storage Temperature:</span>
                <span className="text-slate-text">{donation.storageRequirements || 'Standard ambient / chilled'}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {donation.status === 'AVAILABLE' ? (
            <div className="pt-4 border-t border-black/5">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-md hover:shadow-glow-mint"
                isLoading={isReserving}
                onClick={handleReserve}
                leftIcon={<HeartHandshake className="w-5 h-5 text-obsidian-shell" />}
              >
                Claim This Food Listing Now
              </Button>
            </div>
          ) : (
            <div className="p-3 rounded-card bg-black/5 text-center text-xs text-slate-text">
              This listing has already been reserved or distributed.
            </div>
          )}
        </GlassCard>

        <div className="text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
          <span>MealBridge guarantees audit logs for all claimed and redistributed batches</span>
        </div>
      </div>
    </PageContainer>
  );
}
