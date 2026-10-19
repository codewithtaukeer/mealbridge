import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FOOD_CATEGORIES, QUANTITY_UNITS, COMMON_ALLERGENS } from '@mealbridge/shared';
import type { FoodCategory, QuantityUnit } from '@mealbridge/shared';
import { useGeolocation } from '@/hooks/useGeolocation';
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Tag,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function CreateDonationPage() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { detectLocation, isDetecting } = useGeolocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('VEGETARIAN_MEALS');
  const [quantity, setQuantity] = useState<number>(20);
  const [unit, setUnit] = useState<QuantityUnit>('PORTIONS');

  // Timestamps
  const now = new Date();
  const defaultDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [pickupDeadline, setPickupDeadline] = useState(defaultDeadline);

  // Location
  const [pickupAddress, setPickupAddress] = useState(organization?.address || '');
  const [pickupCity, setPickupCity] = useState(organization?.city || '');
  const [pickupLatitude, setPickupLatitude] = useState<number | undefined>(organization?.latitude);
  const [pickupLongitude, setPickupLongitude] = useState<number | undefined>(organization?.longitude);
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [storageRequirements, setStorageRequirements] = useState('Maintain between 0°C and 4°C or consume within 2 hours');

  const handleDetectLocation = async () => {
    const loc = await detectLocation();
    if (loc) {
      if (loc.address) setPickupAddress(loc.address);
      if (loc.city) setPickupCity(loc.city);
      setPickupLatitude(loc.latitude);
      setPickupLongitude(loc.longitude);
    }
  };

  // Allergens & Handling
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [handlingNotes, setHandlingNotes] = useState('');
  const [safetyCertified, setSafetyCertified] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const isVerified = organization?.verificationStatus === 'VERIFIED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isVerified) {
      setErrorMessage(
        `Your organization is currently ${organization?.verificationStatus || 'PENDING'}. You are not allowed to publish food listings until verified by an administrator.`
      );
      return;
    }

    if (!title || !pickupDeadline || !pickupAddress || !pickupCity) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than 0.');
      return;
    }

    if (new Date(pickupDeadline) <= new Date()) {
      setErrorMessage('Pickup deadline must be set to a future time.');
      return;
    }

    if (!safetyCertified) {
      setErrorMessage('Please certify that the food has been handled according to food safety standards.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/donations', {
        title,
        description: description || undefined,
        category,
        quantity: Number(quantity),
        unit,
        pickupDeadline: new Date(pickupDeadline).toISOString(),
        pickupAddress,
        pickupCity,
        pickupLatitude: pickupLatitude || undefined,
        pickupLongitude: pickupLongitude || undefined,
        pickupInstructions: pickupInstructions || undefined,
        storageRequirements: storageRequirements || undefined,
        allergens: selectedAllergens,
        handlingNotes: handlingNotes || undefined,
      });

      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        toast.success('Surplus food donation listed successfully!');
        navigate('/donor/donations');
      }
    } catch {
      setErrorMessage('Failed to publish food donation. Please verify inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          to="/donor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-pulse hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <span className="text-xs text-slate-text font-medium">New Listing</span>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
            Post Surplus Food Donation
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Provide transparent details so nearby recipient NGOs and volunteer dispatchers can claim and transport safely.
          </p>
        </div>

        {!isVerified && (
          <div className="p-4 rounded-xl bg-soft-coral/15 border border-soft-coral/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-soft-coral shrink-0 mt-0.5" />
              <div className="text-xs text-pure-white space-y-1">
                <p className="font-semibold text-soft-coral text-sm">
                  Donation Publishing Restricted: Organization Not Verified
                </p>
                <p className="text-slate-text">
                  Your organization status is <strong className="text-pure-white">{organization?.verificationStatus || 'PENDING'}</strong>. You are <strong className="text-pure-white">not allowed</strong> to post surplus food donations until verified by a MealBridge administrator.
                </p>
              </div>
            </div>
            <Link to="/verify-account" className="shrink-0">
              <Button variant="outline" size="sm" className="text-xs text-pure-white border-white/20 hover:bg-white/10 whitespace-nowrap">
                Submit Documents &rarr;
              </Button>
            </Link>
          </div>
        )}

        <GlassCard variant="dark" padding="lg" className="border-white/10 shadow-lg">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-soft-coral/15 border border-soft-coral/30 text-xs text-soft-coral font-medium animate-fade-in flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Item Specifics */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.05em] text-neon-pulse flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-neon-pulse" />
                1. Food Details
              </h2>

              <Input
                label="Food Title"
                required
                placeholder="e.g. 40 Portions Fresh Veg Pulao & Dal Tadka"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-text">Item Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cooked today at 1:00 PM in commercial kitchen. Packaged in sealed food-grade containers."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-deep-abyss/90 border border-white/15 text-pure-white placeholder:text-slate-text text-sm focus:outline-none focus:ring-1 focus:ring-neon-pulse focus:border-neon-pulse transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-text">Food Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FoodCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-deep-abyss/90 border border-white/15 text-pure-white text-sm focus:outline-none focus:ring-1 focus:ring-neon-pulse focus:border-neon-pulse transition-all"
                  >
                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-deep-abyss text-pure-white">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-text">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-deep-abyss/90 border border-white/15 text-pure-white text-sm focus:outline-none focus:ring-1 focus:ring-neon-pulse focus:border-neon-pulse transition-all"
                  >
                    {QUANTITY_UNITS.map((u) => (
                      <option key={u.value} value={u.value} className="bg-deep-abyss text-pure-white">
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Pickup Window & Deadline */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.05em] text-neon-pulse flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neon-pulse" />
                2. Pickup Schedule & Expiry
              </h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-text">
                  Must Be Picked Up Before (Deadline) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-deep-abyss/90 border border-white/15 text-pure-white text-sm [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-neon-pulse focus:border-neon-pulse transition-all"
                />
                <span className="text-[11px] text-slate-text">
                  Set realistic deadlines considering safe consumption limits.
                </span>
              </div>
            </div>

            {/* 3. Pickup Location */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.05em] text-neon-pulse flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neon-pulse" />
                  3. Pickup Location
                </h2>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="px-3 py-1.5 rounded-pill bg-neon-pulse/15 border border-neon-pulse/40 text-xs font-semibold text-neon-pulse hover:bg-neon-pulse/25 flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className={`w-3.5 h-3.5 text-neon-pulse ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>{isDetecting ? 'Acquiring GPS...' : 'Detect Pickup Location'}</span>
                </button>
              </div>

              {pickupLatitude && pickupLongitude && (
                <div className="p-2.5 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 flex items-center justify-between">
                  <span className="text-xs text-pure-white font-medium">
                    Pickup Geolocation: {pickupLatitude.toFixed(4)}° N, {pickupLongitude.toFixed(4)}° E
                  </span>
                  <span className="text-[10px] text-neon-pulse font-bold uppercase tracking-wider bg-neon-pulse/20 px-2 py-0.5 rounded">
                    GPS Locked
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Pickup Street Address"
                  required
                  placeholder="e.g. 14 Richmond Road, Ground Floor Kitchen"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />

                <Input
                  label="City"
                  required
                  placeholder="e.g. Prayagraj"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                />
              </div>

              <Input
                label="Pickup Access Instructions"
                placeholder="e.g. Service gate at rear, ask for chef Suresh"
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
              />
            </div>

            {/* 4. Safety & Allergen Information */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.05em] text-neon-pulse flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neon-pulse" />
                4. Safety & Allergens
              </h2>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-text">
                  Select Contained Allergens (if any)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGENS.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen);
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergen(allergen)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-neon-pulse text-obsidian-shell border-neon-pulse font-semibold shadow-sm'
                            : 'bg-white/5 text-slate-text border-white/10 hover:border-white/25 hover:text-pure-white'
                        }`}
                      >
                        {allergen}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Storage & Temperature Requirements"
                placeholder="e.g. Keep chilled under 4°C, hot insulated containers"
                value={storageRequirements}
                onChange={(e) => setStorageRequirements(e.target.value)}
              />

              <Input
                label="Special Handling Notes (Optional)"
                placeholder="e.g. Fragile bakery trays, keep upright"
                value={handlingNotes}
                onChange={(e) => setHandlingNotes(e.target.value)}
              />
            </div>

            {/* Food Safety Guarantee Checkbox */}
            <div className="pt-4 border-t border-white/10 p-4 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 flex items-start gap-3">
              <input
                id="safety"
                type="checkbox"
                required
                checked={safetyCertified}
                onChange={(e) => setSafetyCertified(e.target.checked)}
                className="mt-0.5 rounded border-white/30 text-neon-pulse focus:ring-neon-pulse accent-neon-pulse"
              />
              <label htmlFor="safety" className="text-xs text-pure-white leading-relaxed select-none">
                <span className="font-semibold text-neon-pulse">Food Safety &amp; Hygiene Declaration:</span> I hereby certify that this surplus food was prepared under sanitary conditions, stored within safe temperature ranges, and is wholesome and fit for human redistribution.
              </label>
            </div>

            <Button
              type="submit"
              variant={isVerified ? "primary" : "secondary"}
              size="lg"
              className={`w-full justify-center shadow-md mt-4 ${!isVerified ? 'opacity-60 cursor-not-allowed bg-white/10 text-white/50 border border-white/10' : 'hover:shadow-glow-mint'}`}
              isLoading={isLoading}
              disabled={!isVerified}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isVerified ? 'Publish Food Listing' : 'Organization Verification Required to Publish'}
            </Button>
          </form>
        </GlassCard>

        <div className="text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
          <span>Instant notification will be dispatched to nearby verified recipient NGOs &amp; volunteers</span>
        </div>
      </div>
    </div>
  );
}
