import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FOOD_CATEGORIES, QUANTITY_UNITS } from '@mealbridge/shared';
import type { FoodCategory, QuantityUnit } from '@mealbridge/shared';
import { Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function RecipientNeedsPage() {
  const [selectedCategories, setSelectedCategories] = useState<FoodCategory[]>([
    'VEGETARIAN_MEALS',
    'BAKED_GOODS',
    'PACKAGED_FOOD',
  ]);
  const [maxQuantity, setMaxQuantity] = useState<number>(100);
  const [maxUnit, setMaxUnit] = useState<QuantityUnit>('PORTIONS');
  const [serviceRadius, setServiceRadius] = useState<number>(15);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadNeeds() {
      try {
        const res = await api.get<{
          categoriesJson?: string;
          maxQuantity?: number;
          maxQuantityUnit?: QuantityUnit;
          serviceRadius?: number;
          dietaryNotes?: string;
        }>('/needs/me');
        if (res.data) {
          if (res.data.categoriesJson) {
            try {
              setSelectedCategories(JSON.parse(res.data.categoriesJson));
            } catch {
              // use default
            }
          }
          if (res.data.maxQuantity) setMaxQuantity(res.data.maxQuantity);
          if (res.data.maxQuantityUnit) setMaxUnit(res.data.maxQuantityUnit);
          if (res.data.serviceRadius) setServiceRadius(res.data.serviceRadius);
          if (res.data.dietaryNotes) setDietaryNotes(res.data.dietaryNotes);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadNeeds();
  }, []);

  const toggleCategory = (cat: FoodCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.put('/needs/me', {
        categoriesAccepted: selectedCategories,
        maxQuantity: Number(maxQuantity),
        maxQuantityUnit: maxUnit,
        serviceRadius: Number(serviceRadius),
        dietaryNotes: dietaryNotes || undefined,
      });

      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Recipient food intake criteria updated!');
      }
    } catch {
      toast.error('Failed to save intake criteria');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer size="md" withBloom>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
            Food Intake Criteria & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Configure your organization’s capacity and dietary preferences to improve automated matching.
          </p>
        </div>

        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Accepted Categories */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-forest-night">
                Food Categories Accepted
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FOOD_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.value);
                  return (
                    <button
                      type="button"
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`p-3 rounded-card text-left text-xs transition-all border flex items-center justify-between ${
                        isChecked
                          ? 'bg-bridge-green/10 border-bridge-green font-semibold text-forest-night shadow-sm'
                          : 'bg-white/50 border-black/5 text-muted-text hover:bg-white/80'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Batch Capacity */}
            <div className="pt-4 border-t border-black/5 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-forest-night">
                Maximum Intake Capacity Per Batch
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Max Quantity"
                  type="number"
                  min="1"
                  required
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(Number(e.target.value))}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-forest-night">Unit</label>
                  <select
                    value={maxUnit}
                    onChange={(e) => setMaxUnit(e.target.value as QuantityUnit)}
                    className="w-full px-3.5 py-2.5 rounded-card bg-white/70 border border-black/10 text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-bridge-green/30"
                  >
                    {QUANTITY_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Service Radius */}
            <div className="pt-4 border-t border-black/5 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-forest-night">
                Acceptable Distance / Service Radius: {serviceRadius} km
              </label>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={serviceRadius}
                onChange={(e) => setServiceRadius(Number(e.target.value))}
                className="w-full accent-bridge-green"
              />
              <span className="text-[11px] text-muted-text block">
                Food listings within {serviceRadius} km of your facility will be prioritized in matching feeds.
              </span>
            </div>

            {/* Dietary Constraints */}
            <div className="pt-4 border-t border-black/5 space-y-2">
              <label className="block text-xs font-medium text-forest-night">
                Community Dietary Constraints or Special Requirements
              </label>
              <textarea
                rows={3}
                placeholder="e.g. We exclusively serve vegetarian hot meals to an elderly shelter. No raw poultry or expired baked goods."
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-card bg-white/70 border border-black/10 text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-bridge-green/30"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                leftIcon={<Save className="w-4 h-4 text-forest-night" />}
              >
                Save Preferences
              </Button>
            </div>
          </form>
        </GlassCard>

        <div className="text-center text-[11px] text-muted-text flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-bridge-green" />
          <span>Accurate capacity criteria avoids food waste from unclaimed surplus batches</span>
        </div>
      </div>
    </PageContainer>
  );
}
