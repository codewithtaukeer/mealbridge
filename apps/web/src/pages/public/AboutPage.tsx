import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Target,
  ArrowRight,
  Code2,
  Users,
  Compass,
} from 'lucide-react';

export function AboutPage() {
  const principles = [
    {
      title: 'Make Rescues Traceable & Safe',
      description:
        'Safety and reliability take priority over speed. Every handover requires digital verification, explicit allergen disclosures, and tamper-resistant audit logs.',
      icon: ShieldCheck,
    },
    {
      title: 'Deterministic, Explainable Matching',
      description:
        'No opaque black-box AI guessing where food goes. MealBridge matches offers based on documented hard constraints (capacity, receiving hours, travel distance) before scoring preferences.',
      icon: Compass,
    },
    {
      title: 'Single-Winner Concurrency Correctness',
      description:
        'When multiple NGOs accept a listing or volunteers claim a task, transactional database locks guarantee exactly one winner. Nobody arrives at a donor for food that was already picked up.',
      icon: Target,
    },
    {
      title: 'Privacy & Discretion by Default',
      description:
        'Sensitive private pickup addresses, gate access notes, and personal phone numbers are withheld from public view and revealed strictly to confirmed participants.',
      icon: Users,
    },
  ];

  return (
    <div className="py-12">
      <PageContainer size="lg" withBloom>
        <SectionHeading
          badge="Our Mission"
          title="Good food deserves a second destination."
          description="MealBridge is an open, production-grade surplus-food rescue and redistribution platform designed to bridge the gap between commercial surplus and local community hunger."
        />

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
              The Disconnect in Surplus Food Coordination
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              Every day, university messes, hostel canteens, corporate cafeterias, and banquet halls
              prepare nutritious meals that go unconsumed. Concurrently, local shelters, orphanages, and community
              kitchens struggle with volatile food budgets.
            </p>
            <p className="text-sm text-muted-text leading-relaxed">
              The obstacle isn&apos;t a lack of generosity—it is time-sensitive coordination. Cooked food must be matched,
              claimed, transported, and inspected within narrow temperature and freshness windows. Informal WhatsApp groups
              and phone calls break down under pressure, causing duplicate claims, missed deadlines, and food spoilage.
            </p>
            <p className="text-sm font-semibold text-bridge-green">
              MealBridge provides an auditable, real-time operating system to make food rescue predictable, safe, and verifiable.
            </p>
          </div>

          <div className="lg:col-span-5">
            <GlassCard variant="dark" padding="lg" className="space-y-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-fresh-mint" />
                <span className="text-xs font-bold uppercase tracking-wider text-fresh-mint">
                  Engineering Standards
                </span>
              </div>
              <h4 className="text-lg font-bold text-warm-ivory">
                Portfolio-Grade Architecture
              </h4>
              <p className="text-xs text-warm-ivory/70 leading-relaxed">
                Engineered with React, TypeScript, Vite, Tailwind CSS, Node.js Express, PostgreSQL, Prisma, Supabase Auth,
                and Socket.IO for real-time updates without polling.
              </p>
              <div className="pt-2 border-t border-white/10 text-xs text-warm-ivory/80 space-y-1">
                <p>• Strict server-enforced role-based access control (RBAC)</p>
                <p>• Transactional race-condition prevention</p>
                <p>• Liquid-glass design system with accessible contrast</p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Core Principles */}
        <div className="mb-16">
          <h3 className="text-2xl font-display font-bold text-forest-night mb-8 text-center">
            Our Core Operating Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <GlassCard key={idx} variant="light" padding="lg" className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-bridge-green/10 flex items-center justify-center text-bridge-green">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-forest-night">{p.title}</h4>
                  <p className="text-xs text-muted-text leading-relaxed">{p.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Project Background */}
        <GlassCard variant="mint" padding="lg" className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="mint" size="sm">
              Community Pilot
            </Badge>
            <h4 className="text-lg font-bold text-forest-night">
              Developed by Taukeer Akbar (MNNIT Allahabad)
            </h4>
            <p className="text-xs text-primary-text/80 max-w-xl leading-relaxed">
              Created as a production-quality food redistribution platform designed for university campuses,
              hostel clusters, and local municipality rescue networks.
            </p>
          </div>
          <Link to="/signup">
            <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Involved
            </Button>
          </Link>
        </GlassCard>
      </PageContainer>
    </div>
  );
}
