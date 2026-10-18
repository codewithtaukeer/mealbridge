import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function VerifyAccountPage() {
  const { user, organization, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = organization?.verificationStatus || 'PENDING';

  const handleRequestVerification = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/organizations/me/verify');
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Verification request submitted for administrative review!');
        await refreshProfile();
      }
    } catch {
      toast.error('Failed to submit verification request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center min-h-[85vh]">
      <PageContainer size="md" withBloom>
        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-night flex items-center justify-center mx-auto shadow-md">
            <FileCheck className="w-6 h-6 text-fresh-mint" />
          </div>
          <h1 className="text-3xl font-display font-bold text-forest-night">
            Organization Verification
          </h1>
          <p className="text-sm text-muted-text max-w-md mx-auto">
            MealBridge enforces trusted identity verification to ensure public health safety, audit readiness, and food compliance.
          </p>
        </div>

        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/60 border border-black/5">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-text font-bold">
                Verification Status
              </span>
              <h2 className="text-lg font-display font-bold text-forest-night">
                {organization?.name || user?.name || 'Your Account'}
              </h2>
            </div>
            <div>
              {status === 'VERIFIED' && (
                <Badge variant="success" size="md" dot>
                  Verified Active
                </Badge>
              )}
              {status === 'UNDER_REVIEW' && (
                <Badge variant="warning" size="md" dot>
                  Under Review
                </Badge>
              )}
              {status === 'PENDING' && (
                <Badge variant="warning" size="md" dot>
                  Pending Submission
                </Badge>
              )}
              {status === 'REJECTED' && (
                <Badge variant="danger" size="md" dot>
                  Verification Rejected
                </Badge>
              )}
            </div>
          </div>

          {/* Status Context & Guidance */}
          {status === 'VERIFIED' ? (
            <div className="p-4 rounded-xl bg-fresh-mint/20 border border-fresh-mint/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-bridge-green shrink-0 mt-0.5" />
              <div className="text-xs text-forest-night space-y-1">
                <p className="font-bold">Your organization is fully verified!</p>
                <p>
                  You have full clearance to publish food donations, accept rescues, and coordinate with verified transport volunteers.
                </p>
              </div>
            </div>
          ) : status === 'UNDER_REVIEW' ? (
            <div className="p-4 rounded-xl bg-harvest-gold/20 border border-harvest-gold/40 flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#8a5d1b] shrink-0 mt-0.5" />
              <div className="text-xs text-forest-night space-y-1">
                <p className="font-bold">Application is being evaluated</p>
                <p>
                  Our compliance officers verify documents within 24–48 business hours. You will receive an email confirmation once verified.
                </p>
              </div>
            </div>
          ) : status === 'REJECTED' ? (
            <div className="p-4 rounded-xl bg-soft-coral/20 border border-soft-coral/40 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#842e1d] shrink-0 mt-0.5" />
              <div className="text-xs text-forest-night space-y-1">
                <p className="font-bold">Verification could not be approved</p>
                <p>
                  {organization?.rejectionReason ||
                    'Incomplete documentation or unverified business registry ID. Please update your details and resubmit.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black/5 border border-black/5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-text shrink-0 mt-0.5" />
              <div className="text-xs text-muted-text space-y-1">
                <p className="font-bold text-forest-night">Verification Pending</p>
                <p>
                  Submit your organization profile for administrative review to unlock live surplus redistribution features.
                </p>
              </div>
            </div>
          )}

          {/* Required Verification Documents */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-night/80">
              Required Documentation by Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-card bg-white/50 border border-black/5 space-y-1">
                <span className="font-bold text-forest-night">Food Donors (Commercial)</span>
                <p className="text-muted-text">
                  FSSAI Food License / Registration Certificate, GSTIN or Municipal Business Trade License.
                </p>
              </div>

              <div className="p-3 rounded-card bg-white/50 border border-black/5 space-y-1">
                <span className="font-bold text-forest-night">Recipient Organizations (NGOs)</span>
                <p className="text-muted-text">
                  Society / Trust Registration Deed, NGO DARPAN Unique ID, or 80G / 12A Certificate.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-bridge-green hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Verification Guidelines & FAQ
            </Link>

            {status !== 'VERIFIED' && status !== 'UNDER_REVIEW' && (
              <Button
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                onClick={handleRequestVerification}
                rightIcon={<ArrowRight className="w-4 h-4 text-forest-night" />}
              >
                Submit for Verification
              </Button>
            )}
          </div>
        </GlassCard>

        <div className="mt-6 text-center text-[11px] text-muted-text/80 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-bridge-green" />
          <span>Food safety and compliance standards adhere to national surplus food recovery protocols</span>
        </div>
      </PageContainer>
    </div>
  );
}
