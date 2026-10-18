import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

export function FoodDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Demonstration details
  const item = {
    id: id || 'demo-1',
    title: 'Vegetarian Thali & Steamed Rice',
    description:
      'Nutritious freshly cooked vegetarian lunch surplus consisting of dal tadka, jeera rice, seasonal mixed vegetables, and handmade chapatis. Prepared in a commercial hygienic canteen facility.',
    category: 'Vegetarian Meals',
    quantity: 45,
    unit: 'Portions',
    preparedAt: 'Today, 12:30 PM',
    pickupDeadline: 'Today, 4:00 PM',
    pickupWindow: '2:30 PM – 4:00 PM',
    donorOrg: {
      name: 'Edesiea Community Mess & Catering',
      type: 'Institutional Canteen',
      verified: true,
      city: 'Prayagraj, UP',
      locality: 'Temple Road Area',
      completedDonations: 28,
    },
    allergens: ['Dairy (ghee in dal)'],
    storageRequirements: 'Store in insulated thermal containers at >60°C or refrigerate immediately upon collection.',
    handlingNotes: 'Packed in 3 heavy-duty food-grade insulated dispensers. Containers must be washed and returned or swapped.',
    status: 'AVAILABLE',
  };

  const handleAcceptDonation = () => {
    setIsAccepting(true);
    setTimeout(() => {
      setIsAccepting(false);
      setAcceptedSuccess(true);
    }, 1200);
  };

  return (
    <div className="py-10">
      <PageContainer size="md" withBloom>
        {/* Back Link */}
        <Link
          to="/food"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-bridge-green hover:text-forest-night mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Available Food
        </Link>

        <div className="space-y-6">
          {/* Header Card */}
          <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/5">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{item.category}</Badge>
                <Badge variant="success" dot>
                  {item.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-text">Listing ID: #{item.id}</span>
            </div>

            <div className="py-4 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
                {item.title}
              </h1>
              <p className="text-sm text-muted-text leading-relaxed">
                {item.description}
              </p>

              {/* Quantity Highlight */}
              <div className="p-4 rounded-xl bg-fresh-mint/15 border border-fresh-mint/30 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-forest-night">
                    Available Quantity
                  </span>
                  <div className="text-2xl font-extrabold text-forest-night mt-0.5">
                    {item.quantity} {item.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-muted-text">
                    Estimated Coverage
                  </span>
                  <div className="text-sm font-semibold text-bridge-green mt-0.5">
                    Feeds ~45 people
                  </div>
                </div>
              </div>
            </div>

            {/* Time Constraints Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/60 border border-white/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-text block">
                  Preparation Timestamp
                </span>
                <span className="text-sm font-bold text-forest-night flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-bridge-green" />
                  {item.preparedAt}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/60 border border-white/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-text block">
                  Strict Pickup Deadline
                </span>
                <span className="text-sm font-bold text-forest-night flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-harvest-gold" />
                  {item.pickupDeadline}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Safety & Handling Card */}
          <GlassCard variant="light" padding="lg">
            <h3 className="text-base font-bold text-forest-night mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-bridge-green" />
              Food Safety & Allergen Information
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-primary-text block mb-1">
                  Declared Allergens
                </span>
                {item.allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.allergens.map((alg) => (
                      <span
                        key={alg}
                        className="px-2.5 py-1 rounded-full bg-soft-coral/20 text-[#7a2e20] border border-soft-coral/30 font-semibold"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-text">None explicitly reported by donor.</p>
                )}
                <p className="text-[11px] text-muted-text/80 mt-1 italic">
                  Note: Absence of allergen declarations does not guarantee allergen-free preparation.
                </p>
              </div>

              <div className="pt-2 border-t border-black/5 space-y-1">
                <span className="font-semibold text-primary-text block">
                  Storage & Handling Specifications
                </span>
                <p className="text-muted-text leading-relaxed">{item.storageRequirements}</p>
              </div>

              <div className="pt-2 border-t border-black/5 space-y-1">
                <span className="font-semibold text-primary-text block">
                  Packaging & Handover Instructions
                </span>
                <p className="text-muted-text leading-relaxed">{item.handlingNotes}</p>
              </div>
            </div>
          </GlassCard>

          {/* Donor Organisation Card */}
          <GlassCard variant="light" padding="md">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-text">
                  Donor Organisation
                </span>
                <h4 className="text-base font-bold text-forest-night flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-bridge-green" />
                  {item.donorOrg.name}
                  {item.donorOrg.verified && (
                    <Badge variant="success" size="sm">
                      Verified Donor
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-text flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.donorOrg.locality}, {item.donorOrg.city}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-text block">Completed Rescues</span>
                <span className="text-sm font-bold text-forest-night">
                  {item.donorOrg.completedDonations}
                </span>
              </div>
            </div>

            {/* Privacy Protection Note */}
            <div className="mt-4 p-3 rounded-xl bg-black/[0.03] text-xs text-muted-text flex items-start gap-2">
              <Lock className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
              <span>
                Exact gate entrance instructions and contact phone number will be revealed exclusively to the verified recipient organization upon claim confirmation.
              </span>
            </div>
          </GlassCard>

          {/* Action Callout */}
          {acceptedSuccess ? (
            <GlassCard variant="mint" padding="lg" className="text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-fresh-mint flex items-center justify-center mx-auto text-forest-night">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-forest-night">
                Donation Successfully Reserved!
              </h3>
              <p className="text-xs text-primary-text/80 max-w-sm mx-auto">
                A volunteer rescue task has been generated for pickup. You can monitor the active delivery
                timeline in your Recipient Dashboard.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/recipient/rescues">
                  <Button size="sm" variant="secondary">
                    View in Dashboard
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <GlassCard variant="light" padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-base font-bold text-forest-night">
                  Are you an authorized Recipient NGO?
                </h4>
                <p className="text-xs text-muted-text">
                  Accepting commits your organization to receive this food before the deadline.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link to="/login" className="flex-1 sm:flex-initial">
                  <Button variant="outline" size="md" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 sm:flex-initial justify-center shadow-md hover:shadow-glow-mint"
                  isLoading={isAccepting}
                  onClick={handleAcceptDonation}
                >
                  Accept Donation
                </Button>
              </div>
            </GlassCard>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
