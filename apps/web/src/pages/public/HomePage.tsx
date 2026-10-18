import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  UtensilsCrossed,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  HeartHandshake,
  Truck,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export function HomePage() {
  // Sample demonstration listings for landing page preview
  const featuredDonations = [
    {
      id: 'demo-1',
      title: 'Vegetarian Thali & Fresh Rice',
      category: 'VEGETARIAN_MEALS',
      categoryLabel: 'Vegetarian Meals',
      quantity: 45,
      unit: 'Portions',
      donorName: 'Edesiea Community Mess',
      city: 'Prayagraj, UP',
      deadline: 'Today, 4:00 PM',
      preparedAt: '12:30 PM today',
      allergens: ['Dairy'],
      status: 'AVAILABLE',
    },
    {
      id: 'demo-2',
      title: 'Assorted Bakery Loaves & Buns',
      category: 'BAKED_GOODS',
      categoryLabel: 'Baked Goods',
      quantity: 30,
      unit: 'Boxes',
      donorName: 'Harvest Artisanal Bakery',
      city: 'Civil Lines',
      deadline: 'Today, 6:30 PM',
      preparedAt: '09:00 AM today',
      allergens: ['Wheat', 'Gluten'],
      status: 'AVAILABLE',
    },
    {
      id: 'demo-3',
      title: 'Fresh Seasonal Greens & Veggies',
      category: 'FRUITS_VEGETABLES',
      categoryLabel: 'Produce',
      quantity: 25,
      unit: 'Kilograms',
      donorName: 'Green Market Cooperative',
      city: 'Katra Market',
      deadline: 'Tomorrow, 10:00 AM',
      preparedAt: 'Harvested yesterday',
      allergens: [],
      status: 'AVAILABLE',
    },
  ];

  return (
    <div className="relative">
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Soft radial background gradient blooms */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] -z-10">
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-fresh-mint/20 rounded-full blur-[120px] mix-blend-multiply" />
          <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-bridge-green/15 rounded-full blur-[140px] mix-blend-multiply" />
        </div>

        <PageContainer size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-neon-pulse/15 border border-neon-pulse/30 text-[9px] uppercase tracking-[0.05em] font-medium text-neon-pulse">
                <Sparkles className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                <span>Deterministic surplus food routing & redistribution console</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-pure-white tracking-tight leading-[1.12]">
                Good food deserves a{' '}
                <span className="text-neon-pulse">
                  second destination.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-text font-normal max-w-2xl leading-relaxed">
                Connect surplus food with communities that need it. Every meal matters.
                MealBridge coordinates restaurants, caterers, verified NGOs, and volunteers
                with verified timestamps and transparent accountability.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link to="/signup?role=DONOR">
                  <Button
                    size="lg"
                    variant="primary"
                    leftIcon={<UtensilsCrossed className="w-5 h-5 text-obsidian-shell" />}
                  >
                    Donate Food
                  </Button>
                </Link>
                <Link to="/food">
                  <Button
                    size="lg"
                    variant="outline"
                    leftIcon={<Search className="w-5 h-5 text-pure-white" />}
                  >
                    Find Food
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-text">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-neon-pulse" />
                  <span>Verified NGO Directory</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-neon-pulse" />
                  <span>Mandatory Allergen Disclosures</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-neon-pulse" />
                  <span>Atomic Volunteer Claiming</span>
                </div>
              </div>
            </div>

            {/* Right Visual / Hero Card Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Glass Highlight Card */}
                <GlassCard
                  variant="light"
                  blurLevel="heavy"
                  padding="lg"
                  className="border border-fog-border shadow-md relative z-10"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-fog-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-obsidian-shell flex items-center justify-center shadow-sm">
                        <UtensilsCrossed className="w-4 h-4 text-neon-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-obsidian-shell leading-none">
                          Active Surplus Rescue
                        </h4>
                        <span className="text-[11px] text-slate-text">Live Telemetry · ID #MB-8204</span>
                      </div>
                    </div>
                    <Badge variant="success" dot size="sm">
                      Available Now
                    </Badge>
                  </div>

                  <div className="py-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-medium text-obsidian-shell">
                          40 Fresh Hot Meals (Dal + Roti + Sabzi)
                        </h3>
                        <p className="text-xs text-slate-text flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-obsidian-shell/70" />
                          Annapurna Campus Mess
                        </p>
                      </div>
                      <span className="text-lg font-bold text-obsidian-shell">
                        40 <span className="text-xs font-normal text-slate-text">portions</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <div className="bg-white/80 p-2.5 rounded-card border border-fog-border">
                        <span className="text-[9px] uppercase font-medium tracking-[0.05em] text-slate-text block">
                          Pickup Deadline
                        </span>
                        <span className="font-semibold text-obsidian-shell flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-signal-yellow" />
                          Today, 3:30 PM
                        </span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-card border border-fog-border">
                        <span className="text-[9px] uppercase font-medium tracking-[0.05em] text-slate-text block">
                          Service Area
                        </span>
                        <span className="font-semibold text-obsidian-shell flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-neon-pulse" />
                          Within 4.2 km
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-card bg-neon-pulse/15 border border-neon-pulse/30 flex items-center justify-between text-xs">
                      <span className="text-obsidian-shell font-medium">Eligible Recipient Matches</span>
                      <span className="font-semibold text-obsidian-shell bg-neon-pulse px-2 py-0.5 rounded-pill text-[11px] shadow-sm">
                        3 NGOs Waiting
                      </span>
                    </div>
                  </div>

                  {/* Flow Simulation Progress */}
                  <div className="pt-3 border-t border-fog-border">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-obsidian-shell mb-2">
                      <span>Rescue Lifecycle Status</span>
                      <span className="text-neon-pulse font-medium">Awaiting Recipient Claim</span>
                    </div>
                    <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-neon-pulse h-full rounded-full w-2/5 shadow-[0_0_8px_#3ddc91]" />
                    </div>
                  </div>
                </GlassCard>

                {/* Floating Badge 1: Instant Matching */}
                <div className="absolute -bottom-6 -left-6 z-20 hidden sm:block">
                  <GlassCard
                    variant="light"
                    padding="sm"
                    className="border border-fog-border shadow-md flex items-center gap-3 animate-fade-up"
                  >
                    <div className="w-8 h-8 rounded-full bg-neon-pulse/20 flex items-center justify-center text-neon-pulse">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div className="text-left pr-2">
                      <span className="text-xs font-semibold text-obsidian-shell block">
                        Deterministic Match
                      </span>
                      <span className="text-[10px] text-slate-text">
                        Zero guesswork · Strict rules
                      </span>
                    </div>
                  </GlassCard>
                </div>

                {/* Floating Badge 2: Traceability */}
                <div className="absolute -top-6 -right-4 z-20 hidden sm:block">
                  <GlassCard
                    variant="dark"
                    padding="sm"
                    className="shadow-md flex items-center gap-2.5 border border-white/10"
                  >
                    <Truck className="w-4 h-4 text-neon-pulse" />
                    <span className="text-xs font-medium text-pure-white">
                      Volunteer Handover
                    </span>
                  </GlassCard>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ======================================================== */}
      {/* 2. TRUST & IMPACT STRIP                                  */}
      {/* ======================================================== */}
      <section className="py-12 bg-obsidian-shell text-pure-white border-y border-white/10 relative overflow-hidden">
        <PageContainer size="lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-neon-pulse">
                Platform Accountability
              </span>
              <h3 className="text-lg font-medium text-pure-white mt-0.5">
                Transparent milestones backed by immutable audit history
              </h3>
            </div>
            <span className="text-[11px] font-medium bg-white/5 px-3 py-1.5 rounded-pill text-slate-text border border-white/10 self-start md:self-auto">
              Command Stage: Live tracking active
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-display font-medium text-neon-pulse">
                100%
              </span>
              <p className="text-xs sm:text-sm font-medium text-pure-white/90">
                Traceable Handover
              </p>
              <p className="text-[11px] text-slate-text">
                Confirmed via digital timestamps
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-display font-medium text-pure-white">
                0
              </span>
              <p className="text-xs sm:text-sm font-medium text-pure-white/90">
                Double Claim Races
              </p>
              <p className="text-[11px] text-slate-text">
                Atomic database transactions
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-display font-medium text-signal-yellow">
                &lt; 500ms
              </span>
              <p className="text-xs sm:text-sm font-medium text-pure-white/90">
                P95 API Response
              </p>
              <p className="text-[11px] text-slate-text">
                Optimized matching queries
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-display font-medium text-neon-pulse">
                100%
              </span>
              <p className="text-xs sm:text-sm font-medium text-pure-white/90">
                Verified Organisations
              </p>
              <p className="text-[11px] text-slate-text">
                Admin vetting required
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ======================================================== */}
      {/* 3. HOW IT WORKS SECTION                                  */}
      {/* ======================================================== */}
      <section className="py-20 md:py-28 relative">
        <PageContainer size="lg" withBloom>
          <SectionHeading
            theme="dark"
            align="center"
            badge="Simple 3-Step Coordination"
            title="How food rescue works on MealBridge"
            description="From surplus preparation to recipient distribution, every step is coordinated with unambiguous statuses and real-time updates."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-12">
            {/* Step 1: Donor */}
            <GlassCard
              variant="light"
              padding="lg"
              className="relative flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-obsidian-shell flex items-center justify-center text-neon-pulse font-semibold text-lg shadow-sm">
                  1
                </div>
                <h3 className="text-xl font-medium text-obsidian-shell">
                  Donor Lists Surplus
                </h3>
                <p className="text-sm text-slate-text leading-relaxed">
                  Mess canteens, restaurants, and caterers post excess food with exact quantities,
                  preparation time, pickup deadline, and known allergens.
                </p>
                <ul className="text-xs text-obsidian-shell/80 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    Standardized units (portions / kg / boxes)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    Explicit storage and handling notes
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-4 border-t border-fog-border">
                <Link to="/signup?role=DONOR" className="text-xs font-semibold text-obsidian-shell hover:text-neon-pulse flex items-center gap-1 transition-colors">
                  Register as Donor <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>

            {/* Step 2: Recipient */}
            <GlassCard
              variant="light"
              padding="lg"
              className="relative flex flex-col justify-between border-neon-pulse/40"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neon-pulse flex items-center justify-center text-obsidian-shell font-bold text-lg shadow-sm">
                  2
                </div>
                <h3 className="text-xl font-medium text-obsidian-shell">
                  Eligible Recipient Accepts
                </h3>
                <p className="text-sm text-slate-text leading-relaxed">
                  Verified NGOs and community kitchens review matching offers that meet their capacity
                  and dietary parameters. Acceptance reserves the food atomically.
                </p>
                <ul className="text-xs text-obsidian-shell/80 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    Capacity & receiving window validation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    Single-winner concurrency protection
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-4 border-t border-fog-border">
                <Link to="/signup?role=RECIPIENT" className="text-xs font-semibold text-obsidian-shell hover:text-neon-pulse flex items-center gap-1 transition-colors">
                  Register as Recipient NGO <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>

            {/* Step 3: Volunteer */}
            <GlassCard
              variant="light"
              padding="lg"
              className="relative flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-signal-yellow/20 flex items-center justify-center text-[#876000] font-bold text-lg shadow-sm">
                  3
                </div>
                <h3 className="text-xl font-medium text-obsidian-shell">
                  Volunteer Delivers
                </h3>
                <p className="text-sm text-slate-text leading-relaxed">
                  Vetted volunteers claim the rescue task, navigate to pickup, confirm collection, and
                  record verified delivery to the recipient organization.
                </p>
                <ul className="text-xs text-obsidian-shell/80 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    Step-by-step active rescue workflow
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-pulse shrink-0" />
                    Audit timestamps at pickup & delivery
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-4 border-t border-fog-border">
                <Link to="/signup?role=VOLUNTEER" className="text-xs font-semibold text-obsidian-shell hover:text-neon-pulse flex items-center gap-1 transition-colors">
                  Join as Volunteer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </PageContainer>
      </section>

      {/* ======================================================== */}
      {/* 4. FEATURED AVAILABLE FOOD PREVIEW                       */}
      {/* ======================================================== */}
      <section className="py-20 bg-deep-abyss border-y border-white/10">
        <PageContainer size="lg">
          <SectionHeading
            theme="dark"
            badge="Live Surplus Network"
            title="Available Food Listings"
            description="Explore surplus offers ready for immediate redistribution. Exact operational contact and pickup addresses are revealed to verified participants upon acceptance."
            action={
              <Link to="/food">
                <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore All Listings
                </Button>
              </Link>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDonations.map((donation) => (
              <GlassCard
                key={donation.id}
                variant="light"
                padding="md"
                hoverEffect
                className="flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral" size="sm">
                      {donation.categoryLabel}
                    </Badge>
                    <Badge variant="success" dot size="sm">
                      Available
                    </Badge>
                  </div>

                  <h3 className="text-lg font-medium text-obsidian-shell leading-snug">
                    {donation.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-text">
                    <p className="flex items-center gap-1.5 font-medium text-obsidian-shell">
                      <Building2 className="w-3.5 h-3.5 text-obsidian-shell/70" />
                      {donation.donorName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-text" />
                      {donation.city}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-signal-yellow" />
                      Pickup Deadline: <span className="font-semibold text-obsidian-shell">{donation.deadline}</span>
                    </p>
                  </div>

                  {donation.allergens.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] uppercase font-medium tracking-[0.05em] text-slate-text mr-1">
                        Allergens:
                      </span>
                      {donation.allergens.map((alg) => (
                        <span
                          key={alg}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-soft-coral/20 text-soft-coral border border-soft-coral/30 font-medium"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-fog-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-text block">Quantity</span>
                    <span className="text-base font-bold text-obsidian-shell">
                      {donation.quantity} {donation.unit}
                    </span>
                  </div>
                  <Link to={`/food/${donation.id}`}>
                    <Button size="sm" variant="secondary">
                      View Details
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ======================================================== */}
      {/* 5. FOOD SAFETY & TRANSPARENCY NOTICE                     */}
      {/* ======================================================== */}
      <section className="py-16">
        <PageContainer size="lg">
          <GlassCard
            variant="light"
            padding="lg"
            className="border-neon-pulse/40 bg-mint-frost"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-neon-pulse" />
                  <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-obsidian-shell/80">
                    Food Safety Standards & Accountability
                  </span>
                </div>
                <h3 className="text-2xl font-medium text-obsidian-shell">
                  Clear guidelines for safe, responsible surplus redistribution
                </h3>
                <p className="text-sm text-slate-text leading-relaxed">
                  MealBridge coordinates food rescue logistics. Donors provide accurate preparation
                  timestamps and allergen declarations, while recipient organizations inspect food prior
                  to community distribution in accordance with applicable food safety standards.
                </p>
              </div>
              <Link to="/food-safety" className="shrink-0">
                <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Read Safety Protocol
                </Button>
              </Link>
            </div>
          </GlassCard>
        </PageContainer>
      </section>

      {/* ======================================================== */}
      {/* 6. AUDIENCE CARDS (DONORS / RECIPIENTS / VOLUNTEERS)      */}
      {/* ======================================================== */}
      <section className="py-20 bg-obsidian-shell border-t border-white/10">
        <PageContainer size="lg">
          <SectionHeading
            theme="dark"
            badge="Join the Mission"
            title="A tailored console for every participant"
            description="Whether you have surplus to share, represent a community kitchen, or have time to deliver, MealBridge equips you with dedicated tools."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Donors Card */}
            <GlassCard variant="light" padding="lg" className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-obsidian-shell">Food Donors</h3>
              <p className="text-sm text-slate-text leading-relaxed">
                Restaurants, caterers, mess halls, and event hosts can eliminate disposal costs,
                track verified social impact, and connect directly with local charities.
              </p>
              <Link to="/signup?role=DONOR">
                <Button variant="secondary" size="sm" className="w-full justify-center mt-2">
                  Start Donating Food
                </Button>
              </Link>
            </GlassCard>

            {/* Recipient NGOs Card */}
            <GlassCard variant="light" padding="lg" className="space-y-4 border-neon-pulse/40">
              <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-obsidian-shell">Recipient NGOs</h3>
              <p className="text-sm text-slate-text leading-relaxed">
                Shelters, food banks, and soup kitchens set capacity requirements, filter by dietary
                preferences, and accept food with real-time volunteer delivery tracking.
              </p>
              <Link to="/signup?role=RECIPIENT">
                <Button variant="secondary" size="sm" className="w-full justify-center mt-2">
                  Register Your Organization
                </Button>
              </Link>
            </GlassCard>

            {/* Volunteers Card */}
            <GlassCard variant="light" padding="lg" className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-signal-yellow shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-obsidian-shell">Volunteers</h3>
              <p className="text-sm text-slate-text leading-relaxed">
                Local drivers and helpers claim single-route rescue tasks with clear instructions,
                direct navigation, and digital proof-of-handover recording.
              </p>
              <Link to="/signup?role=VOLUNTEER">
                <Button variant="secondary" size="sm" className="w-full justify-center mt-2">
                  Sign Up as Volunteer
                </Button>
              </Link>
            </GlassCard>
          </div>
        </PageContainer>
      </section>

      {/* ======================================================== */}
      {/* 7. FINAL CALL TO ACTION                                  */}
      {/* ======================================================== */}
      <section className="py-24 bg-deep-abyss text-pure-white relative overflow-hidden border-t border-white/10">
        <div className="pointer-events-none absolute -top-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-b from-neon-pulse/15 to-transparent rounded-full blur-[120px]" />

        <PageContainer size="md" className="text-center relative z-10 space-y-6">
          <Badge variant="mint" size="md">
            Every Meal Counts
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-pure-white tracking-tight">
            Turn surplus into something meaningful.
          </h2>

          <p className="text-slate-text text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join the verified platform that ensures quality surplus food never goes to waste.
            Together, we bridge the gap between abundance and need.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup?role=DONOR">
              <Button size="lg" variant="primary">
                Donate Food
              </Button>
            </Link>
            <Link to="/signup?role=RECIPIENT">
              <Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-pure-white border border-white/20">
                Join as a Recipient
              </Button>
            </Link>
            <Link to="/signup?role=VOLUNTEER">
              <Button size="lg" variant="ghost" className="text-pure-white hover:text-neon-pulse hover:bg-white/10">
                Become a Volunteer
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
