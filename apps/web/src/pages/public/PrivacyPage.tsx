import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';

export function PrivacyPage() {
  return (
    <div className="py-12">
      <PageContainer size="md">
        <SectionHeading
          badge="Data Governance"
          title="Privacy Policy"
          description="How MealBridge collects, stores, protects, and discloses information to facilitate safe food redistribution."
        />

        <GlassCard variant="light" padding="lg" className="space-y-6 text-sm text-primary-text leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-forest-night">1. Information We Collect</h3>
            <p className="text-xs text-muted-text">
              We collect information provided directly by users during registration and donation coordination:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-text space-y-1">
              <li>Contact Details: Name, email address, phone number, and account credentials managed securely via Supabase Auth.</li>
              <li>Organisation Metadata: Organization legal name, commercial category, registered address, operating hours, and verification documentation.</li>
              <li>Donation Data: Surplus food descriptions, category, quantity, preparation timestamp, pickup deadline, and handling notes.</li>
              <li>Operational Telemetry: Handover timestamps, delivery confirmations, audit event history, and incident reports.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-forest-night">2. How Information is Used & Shared</h3>
            <p className="text-xs text-muted-text">
              We apply strict least-privilege principles to all operational data:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-text space-y-1">
              <li>Public Visibility: General food category, portion volume, pickup deadline, and approximate municipal locality are publicly discoverable.</li>
              <li>Confidential Operational Data: Exact gate numbers, personal telephone numbers, and donor contact individuals are disclosed exclusively to the verified recipient NGO and assigned volunteer courier once a rescue is officially committed.</li>
              <li>No Commercial Monetization: We never sell user data, donation histories, or contact directories to third-party commercial marketing entities.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-forest-night">3. Data Retention & Security</h3>
            <p className="text-xs text-muted-text">
              Audit logs of rescue state changes are retained for traceability and food safety accountability. Authentication passwords are never stored in plain text. Session tokens are signed cryptographically and sent over encrypted HTTPS connections.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-forest-night">4. Contact & Inquiries</h3>
            <p className="text-xs text-muted-text">
              For inquiries regarding data deletion or privacy concerns, contact our privacy officer at{' '}
              <a href="mailto:privacy@mealbridge.org" className="text-bridge-green font-semibold underline">
                privacy@mealbridge.org
              </a>.
            </p>
          </section>
        </GlassCard>
      </PageContainer>
    </div>
  );
}
