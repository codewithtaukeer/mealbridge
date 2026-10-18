import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Rescue } from '@mealbridge/shared';
import { HeartHandshake, Sparkles, Leaf, Users, Building } from 'lucide-react';

export function RecipientImpactPage() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadImpact() {
      try {
        const res = await api.get<Rescue[]>('/rescues?status=DELIVERED');
        if (res.data) setRescues(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadImpact();
  }, []);

  const totalPortions = rescues.reduce((acc, curr) => acc + (curr.donation?.quantity || 0), 0);
  const familiesSupported = Math.round(totalPortions / 4);
  const kgDiverted = Math.round(totalPortions * 0.4);
  const co2OffsetKg = Math.round(kgDiverted * 2.5);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-text text-sm">
        Calculating community distribution impact...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Community Distribution Impact
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Measure the community nourishment and social value delivered through your rescued food programs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Meals Distributed</span>
            <div className="w-8 h-8 rounded-xl bg-fresh-mint/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-forest-night" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-forest-night">{totalPortions}</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Portions served</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Families Reached</span>
            <div className="w-8 h-8 rounded-xl bg-bridge-green/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-bridge-green" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-forest-night">{familiesSupported}</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Household food security</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">Food Rescued</span>
            <div className="w-8 h-8 rounded-xl bg-fresh-mint/20 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-forest-night" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-forest-night">{kgDiverted} kg</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Edible surplus redistributed</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-text">CO₂ Emissions Saved</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-gold/25 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#8a5d1b]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-bold text-bridge-green">{co2OffsetKg} kg</span>
            <span className="text-[11px] text-muted-text block mt-0.5">Environmental footprint</span>
          </div>
        </GlassCard>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-forest-night flex items-center gap-1.5">
          <Building className="w-4 h-4 text-bridge-green" />
          Completed Food Rescues Summary
        </h2>

        {rescues.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-text">
            No completed food rescue deliveries recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {rescues.map((rescue) => (
              <div key={rescue.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-forest-night block">
                    {rescue.donation?.title}
                  </span>
                  <span className="text-muted-text text-[11px]">
                    From {rescue.donation?.donorOrganization?.name} ({rescue.donation?.pickupCity})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-bridge-green block">
                    {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-muted-text">
                    {rescue.deliveredAt ? new Date(rescue.deliveredAt).toLocaleDateString() : 'Delivered'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
