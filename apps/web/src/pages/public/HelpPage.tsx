import { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Send,
  CheckCircle2,
  Phone,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export function HelpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'FOOD_SAFETY',
    rescueId: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-12">
      <PageContainer size="md" withBloom>
        <SectionHeading
          theme="dark"
          badge="Support &amp; Trust"
          title="Help &amp; Incident Reporting"
          description="Have an operational question or need to report a safety concern? Our team investigates every submission."
        />

        <div className="space-y-8">
          {/* Direct Support Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard variant="light" padding="md" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-pulse/10 flex items-center justify-center text-neon-pulse">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-slate-text">Email Support</span>
                <p className="text-sm font-medium text-obsidian-shell">support@mealbridge.org</p>
              </div>
            </GlassCard>

            <GlassCard variant="light" padding="md" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-signal-yellow/15 flex items-center justify-center text-signal-yellow">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-slate-text">Emergency Safety Line</span>
                <p className="text-sm font-medium text-obsidian-shell">+91 (800) MEAL-SAFE</p>
              </div>
            </GlassCard>
          </div>

          {/* Incident Report Form */}
          <GlassCard variant="light" padding="lg">
            <h3 className="text-lg font-medium text-obsidian-shell mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-soft-coral" />
              Submit Incident Report or Operational Inquiry
            </h3>
            <p className="text-xs text-slate-text mb-6">
              Use this form to flag suspicious listings, uncollected food, temperature concerns, or logistics disputes.
            </p>

            {submitted ? (
              <div className="p-6 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-neon-pulse/20 border border-neon-pulse/40 flex items-center justify-center mx-auto text-neon-pulse">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-medium text-obsidian-shell">
                  Report Received Successfully
                </h4>
                <p className="text-xs text-slate-text max-w-sm mx-auto">
                  Incident ID #REP-{Math.floor(1000 + Math.random() * 9000)} has been queued for administrator review. We will contact you at {formData.email}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', category: 'FOOD_SAFETY', rescueId: '', description: '' });
                  }}
                >
                  Submit Another Report
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    required
                    placeholder="E.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Your Email"
                    type="email"
                    required
                    placeholder="name@organization.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-medium uppercase tracking-[0.05em] text-obsidian-shell">
                      Report Category <span className="text-soft-coral">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-button bg-mint-frost border border-fog-border text-obsidian-shell text-sm py-2.5 px-3 focus:border-neon-pulse focus:outline-none focus:ring-2 focus:ring-neon-pulse/30"
                    >
                      <option value="FOOD_SAFETY">Food Safety / Freshness Issue</option>
                      <option value="OPERATIONAL">Unclaimed / Overdue Pickup</option>
                      <option value="ABUSE">Suspicious / Inaccurate Listing</option>
                      <option value="OTHER">General Feedback or Technical Problem</option>
                    </select>
                  </div>

                  <Input
                    label="Related Rescue / Donation ID (Optional)"
                    placeholder="E.g. MB-8204"
                    value={formData.rescueId}
                    onChange={(e) => setFormData({ ...formData, rescueId: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-medium uppercase tracking-[0.05em] text-obsidian-shell">
                    Detailed Description <span className="text-soft-coral">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what occurred, including times, parties involved, and any observations..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-button bg-mint-frost border border-fog-border text-obsidian-shell text-sm p-3 focus:border-neon-pulse focus:outline-none focus:ring-2 focus:ring-neon-pulse/30 placeholder:text-slate-text/60"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<Send className="w-4 h-4 text-obsidian-shell" />}
                >
                  Submit Incident Report
                </Button>
              </form>
            )}
          </GlassCard>
        </div>
      </PageContainer>
    </div>
  );
}
