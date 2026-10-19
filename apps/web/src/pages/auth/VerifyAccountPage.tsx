import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Upload,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function VerifyAccountPage() {
  const { user, organization, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState('FSSAI');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [fileName, setFileName] = useState('');

  const status = organization?.verificationStatus || 'PENDING';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleRequestVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/organizations/me/verify', {
        documentType,
        licenseNumber: licenseNumber || 'DOC-' + Math.floor(100000 + Math.random() * 900000),
      });

      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Verification request submitted for administrative review!');

        // Update local context immediately
        const updatedOrg = {
          ...(organization || {}),
          id: organization?.id || user?.organizationId || 'org-' + Date.now(),
          name: organization?.name || user?.name + "'s Organization",
          type: organization?.type || (user?.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
          verificationStatus: 'UNDER_REVIEW' as const,
          phone: organization?.phone || user?.phone || '+91 98765 00000',
          email: organization?.email || user?.email || '',
          address: organization?.address || 'Commercial District',
          city: organization?.city || 'Prayagraj',
          state: organization?.state || 'UP',
          pinCode: organization?.pinCode || '211001',
          isActive: true,
          createdAt: organization?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Persist to local storage
        localStorage.setItem('mealbridge_current_org', JSON.stringify(updatedOrg));
        localStorage.setItem('mealbridge_custom_org', JSON.stringify(updatedOrg));

        // Save into pending verifications queue so admin sees it immediately
        try {
          const pendingList = JSON.parse(localStorage.getItem('mealbridge_pending_verifications') || '[]');
          const queueEntry = {
            ...updatedOrg,
            members: [{ user: { id: user?.id, name: user?.name, email: user?.email, phone: user?.phone } }],
          };
          const existingIdx = pendingList.findIndex((p: any) => p.id === updatedOrg.id);
          if (existingIdx >= 0) {
            pendingList[existingIdx] = queueEntry;
          } else {
            pendingList.unshift(queueEntry);
          }
          localStorage.setItem('mealbridge_pending_verifications', JSON.stringify(pendingList));
        } catch {}

        // Add admin notification
        try {
          const adminNotifs = JSON.parse(localStorage.getItem('mealbridge_admin_notifications') || '[]');
          adminNotifs.unshift({
            id: 'notif-' + Date.now(),
            type: 'ORG_VERIFICATION_REQUESTED',
            title: `Verification Request: ${updatedOrg.name}`,
            message: `${updatedOrg.name} (${updatedOrg.type}) submitted ${documentType} credentials (${licenseNumber || 'Verified File'}) for review.`,
            link: '/admin/verification',
            time: 'Just now',
            isRead: false,
          });
          localStorage.setItem('mealbridge_admin_notifications', JSON.stringify(adminNotifs));
        } catch {}

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
          <div className="w-12 h-12 rounded-2xl bg-neon-pulse/15 border border-neon-pulse/30 flex items-center justify-center mx-auto shadow-md text-neon-pulse">
            <FileCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-display font-medium text-pure-white">
            Organization Verification
          </h1>
          <p className="text-sm text-slate-text max-w-md mx-auto">
            MealBridge enforces trusted identity verification to ensure public health safety, audit readiness, and food compliance.
          </p>
        </div>

        {/* Verification Mandatory Warning Banner */}
        {status !== 'VERIFIED' && (
          <div className="mb-6 p-4 rounded-xl bg-soft-coral/15 border border-soft-coral/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-soft-coral shrink-0 mt-0.5" />
            <div className="text-xs text-pure-white space-y-1">
              <p className="font-semibold text-soft-coral text-sm">
                Operational Clearance Restricted
              </p>
              <p className="text-slate-text">
                Your organization is currently <span className="font-medium text-pure-white">{status}</span>. You are <strong className="text-pure-white">not allowed</strong> to publish surplus food listings or claim rescues until your organization is verified and approved by a MealBridge administrator.
              </p>
            </div>
          </div>
        )}

        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-obsidian-shell/5 border border-fog-border">
            <div>
              <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-slate-text">
                Verification Status
              </span>
              <h2 className="text-lg font-display font-medium text-obsidian-shell">
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
            <div className="p-4 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon-pulse shrink-0 mt-0.5" />
              <div className="text-xs text-obsidian-shell space-y-1">
                <p className="font-medium">Your organization is fully verified!</p>
                <p>
                  You have full clearance to publish surplus food donations, accept rescues, and coordinate with verified transport volunteers.
                </p>
              </div>
            </div>
          ) : status === 'UNDER_REVIEW' ? (
            <div className="p-4 rounded-xl bg-signal-yellow/10 border border-signal-yellow/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-signal-yellow shrink-0 mt-0.5" />
              <div className="text-xs text-obsidian-shell space-y-1">
                <p className="font-medium">Application is being evaluated</p>
                <p>
                  Our administrators review submitted documentation within 24–48 business hours. You will receive an immediate notification once approved.
                </p>
              </div>
            </div>
          ) : status === 'REJECTED' ? (
            <div className="p-4 rounded-xl bg-soft-coral/15 border border-soft-coral/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-soft-coral shrink-0 mt-0.5" />
              <div className="text-xs text-obsidian-shell space-y-1">
                <p className="font-medium">Verification could not be approved</p>
                <p>
                  {organization?.rejectionReason ||
                    'Incomplete documentation or unverified business registry ID. Please update your details and resubmit below.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black/5 border border-black/5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-text shrink-0 mt-0.5" />
              <div className="text-xs text-slate-text space-y-1">
                <p className="font-medium text-obsidian-shell">Verification Pending</p>
                <p>
                  Submit your organization profile for administrative review to unlock live surplus redistribution features.
                </p>
              </div>
            </div>
          )}

          {/* Submission Form */}
          {status !== 'VERIFIED' && (
            <form onSubmit={handleRequestVerification} className="space-y-4 pt-2 border-t border-black/5">
              <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-obsidian-shell">
                Submit Compliance Documents
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-obsidian-shell">
                    Document / Certification Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-card bg-white/80 border border-black/10 text-xs text-obsidian-shell focus:outline-none focus:ring-2 focus:ring-neon-pulse/30"
                  >
                    <option value="FSSAI">FSSAI Food License / Registration</option>
                    <option value="GSTIN">GSTIN Certificate</option>
                    <option value="TRADE_LICENSE">Municipal Business Trade License</option>
                    <option value="NGO_DARPAN">NGO DARPAN Registration Certificate</option>
                    <option value="TRUST_DEED">Trust / Society Registration Deed</option>
                    <option value="12A_80G">12A / 80G Tax Exemption Certificate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-obsidian-shell">
                    Registration / License Number
                  </label>
                  <Input
                    placeholder="e.g. 12224027000189"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="bg-white/80 border-black/10 text-xs text-obsidian-shell"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-obsidian-shell">
                  Upload Scanned Certificate (PDF / JPG / PNG)
                </label>
                <div className="border border-dashed border-black/20 rounded-card p-4 text-center bg-obsidian-shell/5 hover:bg-obsidian-shell/10 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 mx-auto text-neon-pulse mb-1" />
                  <p className="text-xs font-medium text-obsidian-shell">
                    {fileName ? fileName : 'Click to select or drag and drop certification document'}
                  </p>
                  <p className="text-[10px] text-slate-text">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>

              {/* Action CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to="/help"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-pulse hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Verification Guidelines &amp; FAQ
                </Link>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4 text-obsidian-shell" />}
                >
                  {status === 'UNDER_REVIEW' ? 'Update & Resubmit' : 'Submit for Verification'}
                </Button>
              </div>
            </form>
          )}

          {/* Required Verification Documents Explanation */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-obsidian-shell/80">
              Required Documentation Standards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-card bg-obsidian-shell/5 border border-fog-border space-y-1">
                <span className="font-medium text-obsidian-shell">Food Donors (Commercial)</span>
                <p className="text-slate-text">
                  FSSAI Food License / Registration Certificate, GSTIN or Municipal Business Trade License.
                </p>
              </div>

              <div className="p-3 rounded-card bg-obsidian-shell/5 border border-fog-border space-y-1">
                <span className="font-medium text-obsidian-shell">Recipient Organizations (NGOs)</span>
                <p className="text-slate-text">
                  Society / Trust Registration Deed, NGO DARPAN Unique ID, or 80G / 12A Certificate.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="mt-6 text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
          <span>Food safety and compliance standards adhere to national surplus food recovery protocols</span>
        </div>
      </PageContainer>
    </div>
  );
}
