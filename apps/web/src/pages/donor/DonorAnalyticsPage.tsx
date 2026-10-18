import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Donation } from '@mealbridge/shared';
import {
  BarChart3,
  Leaf,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Award,
} from 'lucide-react';

export function DonorAnalyticsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get<Donation[]>('/donations?mine=true&limit=100');
        if (res.data) setDonations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalPortions = donations.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalKgDiverted = Math.round(totalPortions * 0.4);
  const co2AvoidedKg = Math.round(totalKgDiverted * 2.5);
  const deliveredCount = donations.filter((d) => d.status === 'DELIVERED').length;

  // Category distribution
  const categoryCounts = donations.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + d.quantity;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-text text-sm">
        Calculating environmental impact metrics...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Impact & Sustainability Analytics
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Detailed metrics evaluating food waste diversion, greenhouse gas reduction, and community contributions.
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Total Weight Diverted</span>
            <div className="w-8 h-8 rounded-xl bg-fresh-mint/30 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-forest-night" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-forest-night">{totalKgDiverted} kg</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Surplus saved from landfills</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Emissions Mitigated</span>
            <div className="w-8 h-8 rounded-xl bg-bridge-green/15 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-bridge-green" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-bridge-green">{co2AvoidedKg} kg CO₂e</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Greenhouse gas equivalent</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Meals Provided</span>
            <div className="w-8 h-8 rounded-xl bg-fresh-mint/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-forest-night" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-forest-night">{totalPortions}</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Nutritious community portions</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Redistribution Rate</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-gold/25 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#8a5d1b]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-forest-night">
              {donations.length > 0 ? Math.round((deliveredCount / donations.length) * 100) : 100}%
            </span>
            <span className="text-[11px] text-muted-text block mt-0.5">Successful rescue fulfillment</span>
          </div>
        </GlassCard>
      </div>

      {/* Category Breakdown & Impact Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variant="light" padding="lg" className="border-white/70 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-forest-night flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-bridge-green" />
            Top Rescued Categories
          </h2>

          {Object.keys(categoryCounts).length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-text">
              No redistribution data recorded yet.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {Object.entries(categoryCounts).map(([cat, qty]) => {
                const percentage = totalPortions > 0 ? Math.round((qty / totalPortions) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-forest-night">
                      <span>{cat.replace(/_/g, ' ')}</span>
                      <span>
                        {qty} portions ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full bg-bridge-green rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard variant="light" padding="lg" className="border-white/70 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-forest-night flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-bridge-green" />
            Impact Methodology & Standards
          </h2>

          <div className="text-xs text-muted-text space-y-3 leading-relaxed">
            <p>
              MealBridge applies certified carbon-accounting benchmarks aligned with the{' '}
              <span className="font-semibold text-forest-night">Food and Agriculture Organization (FAO)</span> and WRAP protocols:
            </p>
            <div className="p-3 rounded-card bg-white/60 border border-black/5 space-y-1.5">
              <span className="font-bold text-forest-night block">CO₂ Calculation Standard</span>
              <p className="text-[11px]">
                1 portion is standardized to 0.40 kg. Each kilogram of prepared food diverted from organic landfill prevents approximately 2.50 kg CO₂ equivalent emissions.
              </p>
            </div>
            <div className="p-3 rounded-card bg-fresh-mint/15 border border-fresh-mint/30 space-y-1.5">
              <span className="font-bold text-forest-night block">Corporate ESG Certificate</span>
              <p className="text-[11px] text-forest-night">
                Your quarterly impact metrics are exportable as verified corporate social responsibility and sustainability audit reports.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
