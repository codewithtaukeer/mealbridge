import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Donation } from '@mealbridge/shared';
import {
  UtensilsCrossed,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Leaf,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export function DonorDashboardPage() {
  const { user, organization } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDonorDonations() {
      try {
        const res = await api.get<Donation[]>('/donations?mine=true&limit=6');
        if (res.data) {
          setDonations(res.data);
        }
      } catch (err) {
        console.error('Failed to load donor donations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDonorDonations();
  }, []);

  // Compute metrics from actual data
  const totalPortions = donations.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const activeDonationsCount = donations.filter(
    (d) => d.status === 'AVAILABLE' || d.status === 'RESERVED' || d.status === 'IN_RESCUE'
  ).length;
  const deliveredCount = donations.filter((d) => d.status === 'DELIVERED').length;
  const co2AvoidedKg = Math.round(totalPortions * 0.4 * 2.5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-pure-white">
            Welcome back, {organization?.name || user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Track surplus food redistribution, manage rescue coordination, and monitor your environmental diversion.
          </p>
        </div>

        <Link to={organization?.verificationStatus === 'VERIFIED' ? "/donor/donations/create" : "/verify-account"}>
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4 text-obsidian-shell" />}
            className="shadow-md hover:shadow-glow-mint whitespace-nowrap"
          >
            {organization?.verificationStatus === 'VERIFIED' ? 'Donate Surplus Food' : 'Complete Verification to Donate'}
          </Button>
        </Link>
      </div>

      {/* Verification Notice Banner if not yet verified */}
      {organization?.verificationStatus !== 'VERIFIED' && (
        <div className="p-4 rounded-card bg-soft-coral/15 border border-soft-coral/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-soft-coral shrink-0 mt-0.5" />
            <div className="text-xs text-pure-white space-y-1">
              <p className="font-semibold text-soft-coral text-sm">
                Action Required: Organization Not Verified ({organization?.verificationStatus || 'PENDING'})
              </p>
              <p className="text-slate-text">
                You are <strong className="text-pure-white">not allowed</strong> to publish surplus food listings until your organization is verified and approved by a MealBridge administrator.
              </p>
            </div>
          </div>
          <Link to="/verify-account" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs text-pure-white border-white/20 hover:bg-white/10 whitespace-nowrap">
              Submit Verification Documents &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Top Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Active Listings</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/15 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {activeDonationsCount}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Ready for pickup or in transit</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Portions Diverted</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-obsidian-shell" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {totalPortions}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Meals shared to vulnerable groups</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Completed Rescues</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-gold/25 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-signal-yellow" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {deliveredCount}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Delivered to verified NGOs</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">CO₂ Emissions Avoided</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-display font-bold text-obsidian-shell">
              {co2AvoidedKg} kg
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">GHG landfill reduction</span>
          </div>
        </GlassCard>
      </div>

      {/* Recent Surplus Food Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-obsidian-shell">
            Recent Donations
          </h2>
          <Link
            to="/donor/donations"
            className="text-xs font-semibold text-neon-pulse hover:underline flex items-center gap-1"
          >
            View all listings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-text text-sm">Loading listings...</div>
        ) : donations.length === 0 ? (
          <GlassCard variant="light" padding="lg" className="text-center py-12 space-y-4 border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mx-auto text-slate-text">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-obsidian-shell text-base">
                No active food donations yet
              </h3>
              <p className="text-xs text-slate-text max-w-sm mx-auto mt-1">
                Post surplus food from today's service, prep, or catering to connect with local charities.
              </p>
            </div>
            <Link to="/donor/donations/create">
              <Button variant="primary" size="sm">
                Create First Donation
              </Button>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donations.map((donation) => (
              <GlassCard
                key={donation.id}
                variant="light"
                padding="md"
                className="border-white/70 flex flex-col justify-between hover:shadow-glass-md transition-shadow"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" size="sm" className="text-[10px]">
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
                      size="sm"
                      dot
                    >
                      {donation.status}
                    </Badge>
                  </div>

                  <h3 className="font-display font-bold text-obsidian-shell text-sm line-clamp-1">
                    {donation.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-semibold text-obsidian-shell">
                    <span>
                      {donation.quantity} {donation.unit.toLowerCase()}
                    </span>
                    <span>•</span>
                    <span className="text-slate-text text-[11px] font-normal truncate">
                      {donation.pickupCity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-text">
                    <Clock className="w-3.5 h-3.5 text-slate-text" />
                    <span>
                      Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-black/5 flex items-center justify-between text-xs">
                  <Link
                    to={`/donor/donations/${donation.id}`}
                    className="font-bold text-neon-pulse hover:underline flex items-center gap-1"
                  >
                    Manage & Matches <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-[10px] text-slate-text">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
