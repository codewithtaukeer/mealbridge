import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  Clock,
  Thermometer,
  FileCheck2,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export function FoodSafetyPage() {
  return (
    <div className="py-12">
      <PageContainer size="lg" withBloom>
        <SectionHeading
          badge="Safety & Accountability"
          title="Food Safety & Handling Guidelines"
          description="Surplus food redistribution must always prioritize health and dignity. Review the core operational protocols followed by donors, recipients, and couriers on MealBridge."
        />

        {/* Regulatory & Platform Disclaimer */}
        <div className="mb-10 p-5 rounded-2xl bg-harvest-gold/15 border border-harvest-gold/40 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-harvest-gold shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-forest-night leading-relaxed">
            <strong className="block text-sm font-bold mb-1">
              Important Safety & Regulatory Notice
            </strong>
            MealBridge serves as an operational coordination platform. Platform verification verifies
            an organisation&apos;s identity and registration; it does not constitute certification of individual
            food batches. Donors and recipient organisations remain responsible for adhering to applicable
            food safety standards (such as FSSAI surplus food regulations in India). When in doubt about freshness
            or storage conditions, participants are encouraged to decline or report the food rather than proceed with redistribution.
          </div>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Donors */}
          <GlassCard variant="light" padding="lg" className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-bridge-green/15 flex items-center justify-center text-bridge-green">
              <Thermometer className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-forest-night">
              1. Donor Standards
            </h3>
            <ul className="space-y-2 text-xs text-muted-text">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Prepare in licensed, clean food-grade kitchens.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Record accurate preparation timestamps. Do not donate food older than recommended shelf limits.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Declare all known allergens explicitly (peanuts, dairy, wheat, gluten, shellfish).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Maintain hot holding (&gt;60°C) or rapid chilling (&lt;4°C) prior to volunteer collection.</span>
              </li>
            </ul>
          </GlassCard>

          {/* Card 2: Transport & Volunteer */}
          <GlassCard variant="light" padding="lg" className="space-y-4 border-fresh-mint/40">
            <div className="w-10 h-10 rounded-xl bg-fresh-mint/30 flex items-center justify-center text-forest-night">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-forest-night">
              2. Transit & Handover
            </h3>
            <ul className="space-y-2 text-xs text-muted-text">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Volunteers collect strictly within the posted pickup window.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Food must be sealed in clean, spill-proof, insulated food containers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Keep delivery transit times under 60 minutes for cooked meals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Direct transit from donor to recipient with no intermediate stops or repacking.</span>
              </li>
            </ul>
          </GlassCard>

          {/* Card 3: Recipient Inspection */}
          <GlassCard variant="light" padding="lg" className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-harvest-gold/25 flex items-center justify-center text-[#735100]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-forest-night">
              3. Recipient Inspection
            </h3>
            <ul className="space-y-2 text-xs text-muted-text">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Visually inspect packaging integrity upon volunteer arrival.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Perform sensory smell and temperature checks before serving.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Serve hot food immediately or reheat to a minimum core temperature of 74°C.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-bridge-green shrink-0 mt-0.5" />
                <span>Reject any food item showing signs of spoilage or compromised packaging.</span>
              </li>
            </ul>
          </GlassCard>
        </div>

        {/* Acceptable vs Unacceptable Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Acceptable Food */}
          <GlassCard variant="light" padding="lg" className="space-y-3 border-fresh-mint/40">
            <h4 className="text-base font-bold text-forest-night flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-bridge-green" />
              Eligible for Redistribution
            </h4>
            <ul className="text-xs text-muted-text space-y-2 leading-relaxed">
              <li>• Excess banquet or mess hall food that has been stored covered under temperature control.</li>
              <li>• Unserved, unconsumed prepared dishes kept away from public self-service buffets.</li>
              <li>• Surplus baked goods, breads, buns, and sealed pastry items from registered bakeries.</li>
              <li>• Uncut fresh produce, whole fruits, raw vegetables, and intact agricultural surplus.</li>
              <li>• Pre-packaged groceries and dairy with undamaged seals within declared expiration dates.</li>
            </ul>
          </GlassCard>

          {/* Unacceptable Food */}
          <GlassCard variant="light" padding="lg" className="space-y-3 border-soft-coral/40">
            <h4 className="text-base font-bold text-forest-night flex items-center gap-2">
              <XCircle className="w-5 h-5 text-soft-coral" />
              Strictly Prohibited
            </h4>
            <ul className="text-xs text-muted-text space-y-2 leading-relaxed">
              <li>• Partially consumed food from customer dining tables or open self-serve buffet plates.</li>
              <li>• Cooked food held in the danger zone (5°C to 60°C) for more than 2 hours.</li>
              <li>• Food with unsealed, punctured, or swollen commercial packaging.</li>
              <li>• Items with noticeable off-odors, discoloration, mould, or unfamiliar contaminants.</li>
              <li>• Home-cooked dishes prepared in unregulated or non-commercial premises.</li>
            </ul>
          </GlassCard>
        </div>

        {/* Reporting an Incident */}
        <GlassCard variant="light" padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-forest-night">
              Encountered an issue with food condition or handover?
            </h4>
            <p className="text-xs text-muted-text">
              Our safety review team inspects all flagged reports. You can file an incident report referencing any active or past rescue.
            </p>
          </div>
          <Link to="/help">
            <Button variant="danger" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Report Safety Concern
            </Button>
          </Link>
        </GlassCard>
      </PageContainer>
    </div>
  );
}
