import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';

export function TermsPage() {
  return (
    <div className="py-12">
      <PageContainer size="md">
        <SectionHeading
          theme="dark"
          badge="Terms of Service"
          title="Platform Terms &amp; Conditions"
          description="Rules and obligations governing participation on the MealBridge redistribution network."
        />

        <GlassCard variant="light" padding="lg" className="space-y-6 text-sm text-obsidian-shell leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-medium text-obsidian-shell">1. Acceptance of Terms</h3>
            <p className="text-xs text-slate-text">
              By registering an account or participating in food redistribution on MealBridge, you agree to comply
              with these terms and our published Food Safety Guidelines.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-medium text-obsidian-shell">2. Participant Responsibilities</h3>
            <div className="space-y-2 text-xs text-slate-text">
              <p>
                <strong className="text-obsidian-shell">Donors:</strong> Donors warrant that all offered food has been stored hygienically and adheres
                to applicable food safety regulations. Donors must provide truthful preparation timestamps and disclose known allergens.
              </p>
              <p>
                <strong className="text-obsidian-shell">Recipients:</strong> Recipient organizations are responsible for inspecting food upon collection
                and maintaining safe holding conditions until community distribution.
              </p>
              <p>
                <strong className="text-obsidian-shell">Volunteers:</strong> Volunteers commit to direct, safe transit without intermediate detours or tampering.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-medium text-obsidian-shell">3. Prohibited Activities</h3>
            <ul className="list-disc pl-5 text-xs text-slate-text space-y-1">
              <li>Listing plate-scrapings, partially consumed buffet plates, or spoiled food.</li>
              <li>Commercial resale or monetization of surplus food acquired via the platform.</li>
              <li>Intentional duplicate booking or claiming food without intent or capacity to receive it.</li>
              <li>Harassment, discrimination, or abusive conduct during handover.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-medium text-obsidian-shell">4. Limitation of Liability</h3>
            <p className="text-xs text-slate-text">
              MealBridge provides the software infrastructure for communication and coordination. To the maximum
              extent permitted by law, MealBridge disclaims liability for damages arising from food quality, storage failures,
              or transit delays executed by participating autonomous parties.
            </p>
          </section>
        </GlassCard>
      </PageContainer>
    </div>
  );
}
