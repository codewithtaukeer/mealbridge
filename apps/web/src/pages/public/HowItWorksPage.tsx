import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN'>('DONOR');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Can any individual or restaurant donate food on MealBridge?',
      a: 'Any commercial food business, mess canteen, restaurant, hostel, or institutional caterer can register as a donor. All donor organisations submit basic operating verification before posting publicly accessible surplus listings.',
    },
    {
      q: 'How does MealBridge prevent multiple recipients from claiming the same food?',
      a: 'MealBridge uses database-level transactional concurrency control. When a recipient accepts a donation, the record is locked atomically. If two recipients click Accept simultaneously, exactly one claim succeeds and the other receives an immediate conflict notice with alternative suggestions.',
    },
    {
      q: 'What if a volunteer is unable to complete a pickup after claiming?',
      a: 'Volunteers have a controlled cancellation mechanism in their active rescue console. Releasing a task promptly returns it to the open volunteer pool with audit logging, ensuring meals are not delayed.',
    },
    {
      q: 'Does MealBridge guarantee that all donated food is safe?',
      a: 'MealBridge is a coordination platform and does not certify individual food batches. Donors are legally and operationally responsible for accurate preparation timestamps, safe storage, and allergen disclosures. Recipient organizations inspect food at handover in line with safety guidelines.',
    },
  ];

  return (
    <div className="py-12">
      <PageContainer size="lg" withBloom>
        <SectionHeading
          badge="End-to-End Coordination"
          title="How MealBridge Works"
          description="A clear, auditable operational workflow designed to eliminate waste, maintain safety, and ensure timely community redistribution."
        />

        {/* Role Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-light border border-white/60 max-w-2xl mb-12 shadow-glass-sm">
          <button
            onClick={() => setActiveTab('DONOR')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'DONOR'
                ? 'bg-bridge-green text-white shadow-sm'
                : 'text-primary-text hover:bg-black/5'
            }`}
          >
            For Food Donors
          </button>
          <button
            onClick={() => setActiveTab('RECIPIENT')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'RECIPIENT'
                ? 'bg-bridge-green text-white shadow-sm'
                : 'text-primary-text hover:bg-black/5'
            }`}
          >
            For Recipient NGOs
          </button>
          <button
            onClick={() => setActiveTab('VOLUNTEER')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'VOLUNTEER'
                ? 'bg-bridge-green text-white shadow-sm'
                : 'text-primary-text hover:bg-black/5'
            }`}
          >
            For Volunteers
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'ADMIN'
                ? 'bg-bridge-green text-white shadow-sm'
                : 'text-primary-text hover:bg-black/5'
            }`}
          >
            Admin Governance
          </button>
        </div>

        {/* Tab 1: Donors */}
        {activeTab === 'DONOR' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-bridge-green/10 flex items-center justify-center text-bridge-green font-bold text-sm">
                  1
                </span>
                <h4 className="text-base font-bold text-forest-night">Post Surplus Food</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Specify category, quantity, portion units, preparation time, and strict pickup window.
                </p>
                <Badge variant="neutral" size="sm">
                  Status: Available
                </Badge>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-bridge-green/10 flex items-center justify-center text-bridge-green font-bold text-sm">
                  2
                </span>
                <h4 className="text-base font-bold text-forest-night">Recipient Matches</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Verified NGOs discover the listing. When accepted, the food moves to Reserved status.
                </p>
                <Badge variant="warning" size="sm">
                  Status: Reserved
                </Badge>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-bridge-green/10 flex items-center justify-center text-bridge-green font-bold text-sm">
                  3
                </span>
                <h4 className="text-base font-bold text-forest-night">Handover to Volunteer</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Assigned volunteer arrives before deadline. Confirm collection in one click.
                </p>
                <Badge variant="info" size="sm">
                  Status: In Rescue
                </Badge>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-bridge-green/10 flex items-center justify-center text-bridge-green font-bold text-sm">
                  4
                </span>
                <h4 className="text-base font-bold text-forest-night">Delivery & Impact</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Delivery is confirmed by recipient. Your organization impact dashboard updates live.
                </p>
                <Badge variant="success" size="sm">
                  Status: Delivered
                </Badge>
              </GlassCard>
            </div>

            <GlassCard variant="mint" padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-forest-night">
                  Ready to turn surplus food into community meals?
                </h3>
                <p className="text-xs text-primary-text/80 mt-1">
                  Registration is quick. Connect with verified local charitable organisations today.
                </p>
              </div>
              <Link to="/signup?role=DONOR">
                <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register as Food Donor
                </Button>
              </Link>
            </GlassCard>
          </div>
        )}

        {/* Tab 2: Recipients */}
        {activeTab === 'RECIPIENT' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-fresh-mint/30 flex items-center justify-center text-forest-night font-bold text-sm">
                  1
                </span>
                <h4 className="text-base font-bold text-forest-night">Set Capacity & Needs</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Define food categories accepted, maximum portion capacity, and daily receiving hours.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-fresh-mint/30 flex items-center justify-center text-forest-night font-bold text-sm">
                  2
                </span>
                <h4 className="text-base font-bold text-forest-night">Discover Available Food</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Browse real-time listings filtered by proximity, dietary preference, and deadline.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-fresh-mint/30 flex items-center justify-center text-forest-night font-bold text-sm">
                  3
                </span>
                <h4 className="text-base font-bold text-forest-night">Atomic Acceptance</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Lock the donation in a single click. A rescue task is automatically generated for volunteers.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-fresh-mint/30 flex items-center justify-center text-forest-night font-bold text-sm">
                  4
                </span>
                <h4 className="text-base font-bold text-forest-night">Inspect & Confirm</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Receive the food from the volunteer, verify freshness, and record delivery confirmation.
                </p>
              </GlassCard>
            </div>

            <GlassCard variant="mint" padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-forest-night">
                  Are you an NGO, shelter, or community kitchen?
                </h3>
                <p className="text-xs text-primary-text/80 mt-1">
                  Access regular surplus donations and streamline your community food intake.
                </p>
              </div>
              <Link to="/signup?role=RECIPIENT">
                <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register as Recipient
                </Button>
              </Link>
            </GlassCard>
          </div>
        )}

        {/* Tab 3: Volunteers */}
        {activeTab === 'VOLUNTEER' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-harvest-gold/25 flex items-center justify-center text-[#735100] font-bold text-sm">
                  1
                </span>
                <h4 className="text-base font-bold text-forest-night">Claim Open Task</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Review open rescue opportunities near you. Claiming gives you exclusive assignment.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-harvest-gold/25 flex items-center justify-center text-[#735100] font-bold text-sm">
                  2
                </span>
                <h4 className="text-base font-bold text-forest-night">Navigate to Pickup</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Access pickup instructions, donor contact, and navigation coordinates in your active rescue view.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-harvest-gold/25 flex items-center justify-center text-[#735100] font-bold text-sm">
                  3
                </span>
                <h4 className="text-base font-bold text-forest-night">Confirm Collection</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Verify packaging and mark pickup completed. Real-time updates notify donor and recipient.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <span className="w-8 h-8 rounded-lg bg-harvest-gold/25 flex items-center justify-center text-[#735100] font-bold text-sm">
                  4
                </span>
                <h4 className="text-base font-bold text-forest-night">Complete Handover</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Deliver to recipient address, record handover notes or photo evidence, and complete rescue.
                </p>
              </GlassCard>
            </div>

            <GlassCard variant="mint" padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-forest-night">
                  Have an hour to help feed someone in need?
                </h3>
                <p className="text-xs text-primary-text/80 mt-1">
                  Join our volunteer courier network and complete safe, flexible local pickups.
                </p>
              </div>
              <Link to="/signup?role=VOLUNTEER">
                <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Join as Volunteer
                </Button>
              </Link>
            </GlassCard>
          </div>
        )}

        {/* Tab 4: Admins */}
        {activeTab === 'ADMIN' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard variant="light" padding="md" className="space-y-3">
                <ShieldAlert className="w-8 h-8 text-bridge-green" />
                <h4 className="text-base font-bold text-forest-night">Verification Queue</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Review applicant registration documents, verify NGO legitimacy, and audit operating licenses.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <Clock className="w-8 h-8 text-harvest-gold" />
                <h4 className="text-base font-bold text-forest-night">Exceptions & Overdue Rescue</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Automated background detectors surface approaching deadlines, unclaimed tasks, and stalled operations.
                </p>
              </GlassCard>

              <GlassCard variant="light" padding="md" className="space-y-3">
                <CheckCircle2 className="w-8 h-8 text-bridge-green" />
                <h4 className="text-base font-bold text-forest-night">Incident Reports & Auditing</h4>
                <p className="text-xs text-muted-text leading-relaxed">
                  Every state transition and report is preserved in tamper-resistant audit logs for full compliance.
                </p>
              </GlassCard>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="pt-16 max-w-4xl mx-auto space-y-6">
          <SectionHeading
            align="center"
            badge="Common Questions"
            title="Frequently Asked Questions"
            description="Clear answers regarding safety, logistics, and accountability on MealBridge."
          />

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <GlassCard
                  key={idx}
                  variant="light"
                  padding="none"
                  className="overflow-hidden border-white/60"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-forest-night hover:text-bridge-green transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-bridge-green shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-text shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-text leading-relaxed border-t border-black/5 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
