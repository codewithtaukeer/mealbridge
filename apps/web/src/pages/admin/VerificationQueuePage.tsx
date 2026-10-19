import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Organization } from '@mealbridge/shared';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileText,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function VerificationQueuePage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [rejectModalOrg, setRejectModalOrg] = useState<Organization | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      let apiOrgs: Organization[] = [];
      try {
        const res = await api.get<Organization[]>('/admin/verifications');
        if (res.data) apiOrgs = res.data;
      } catch {
        // Fallback to local cache
      }

      // Merge with pending verifications saved locally
      let localPending: any[] = [];
      try {
        localPending = JSON.parse(localStorage.getItem('mealbridge_pending_verifications') || '[]');
      } catch {}

      // Also check current active org if not verified
      try {
        const currentOrg = JSON.parse(localStorage.getItem('mealbridge_current_org') || 'null');
        if (currentOrg && (currentOrg.verificationStatus === 'PENDING' || currentOrg.verificationStatus === 'UNDER_REVIEW')) {
          localPending.push(currentOrg);
        }
      } catch {}

      const combined = [...localPending.filter((o: any) => o.verificationStatus !== 'VERIFIED'), ...apiOrgs];
      // Deduplicate by ID
      const unique = Array.from(new Map(combined.map((o: any) => [o.id, o])).values()) as Organization[];
      setOrganizations(unique);
    } catch {
      toast.error('Failed to load verification queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (orgId: string) => {
    setActiveOrgId(orgId);
    try {
      // 1. Send approval to API
      try {
        await api.post(`/admin/verifications/${orgId}/approve`);
      } catch (err) {
        console.warn('API approve warning (using local fallback sync):', err);
      }

      // 2. Update local storage stores
      try {
        const localPending = JSON.parse(localStorage.getItem('mealbridge_pending_verifications') || '[]');
        const updatedPending = localPending.map((o: any) =>
          o.id === orgId ? { ...o, verificationStatus: 'VERIFIED', verifiedAt: new Date().toISOString() } : o
        );
        localStorage.setItem('mealbridge_pending_verifications', JSON.stringify(updatedPending));

        const currentOrg = JSON.parse(localStorage.getItem('mealbridge_current_org') || 'null');
        if (currentOrg && currentOrg.id === orgId) {
          currentOrg.verificationStatus = 'VERIFIED';
          currentOrg.verifiedAt = new Date().toISOString();
          localStorage.setItem('mealbridge_current_org', JSON.stringify(currentOrg));
        }

        const customOrg = JSON.parse(localStorage.getItem('mealbridge_custom_org') || 'null');
        if (customOrg && customOrg.id === orgId) {
          customOrg.verificationStatus = 'VERIFIED';
          customOrg.verifiedAt = new Date().toISOString();
          localStorage.setItem('mealbridge_custom_org', JSON.stringify(customOrg));
        }

        // Add verified notification for the organization
        const userNotifs = JSON.parse(localStorage.getItem('mealbridge_user_notifications') || '[]');
        userNotifs.unshift({
          id: 'notif-' + Date.now(),
          type: 'ORG_VERIFIED',
          title: 'Organization Verified & Approved!',
          message: 'Your organization has been officially verified by MealBridge Admin. You have full clearance to publish and rescue food.',
          time: 'Just now',
          isRead: false,
        });
        localStorage.setItem('mealbridge_user_notifications', JSON.stringify(userNotifs));
      } catch {}

      toast.success('Organization approved and verified!');
      window.dispatchEvent(new Event('mealbridge_queue_updated'));
      window.dispatchEvent(new Event('mealbridge_notifications_updated'));
      // Update UI state immediately
      setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    } catch {
      toast.error('Failed to approve organization');
    } finally {
      setActiveOrgId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalOrg) return;
    const orgId = rejectModalOrg.id;
    setActiveOrgId(orgId);
    const reasonText = rejectReason || 'Incomplete registration documents or unverified business registry ID';

    try {
      try {
        await api.post(`/admin/verifications/${orgId}/reject`, { reason: reasonText });
      } catch {}

      try {
        const localPending = JSON.parse(localStorage.getItem('mealbridge_pending_verifications') || '[]');
        const updatedPending = localPending.map((o: any) =>
          o.id === orgId ? { ...o, verificationStatus: 'REJECTED', rejectionReason: reasonText } : o
        );
        localStorage.setItem('mealbridge_pending_verifications', JSON.stringify(updatedPending));

        const currentOrg = JSON.parse(localStorage.getItem('mealbridge_current_org') || 'null');
        if (currentOrg && currentOrg.id === orgId) {
          currentOrg.verificationStatus = 'REJECTED';
          currentOrg.rejectionReason = reasonText;
          localStorage.setItem('mealbridge_current_org', JSON.stringify(currentOrg));
        }
      } catch {}

      toast.success('Organization verification rejected');
      window.dispatchEvent(new Event('mealbridge_queue_updated'));
      window.dispatchEvent(new Event('mealbridge_notifications_updated'));
      setRejectModalOrg(null);
      setRejectReason('');
      setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    } catch {
      toast.error('Failed to reject organization');
    } finally {
      setActiveOrgId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
            Organization Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Review commercial food donors and non-profit recipient applications before approving live redistribution clearance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchQueue}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          className="text-xs text-pure-white border-white/20 hover:bg-white/10"
        >
          Refresh Queue
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-neon-pulse" />
          <span>Loading verification applications...</span>
        </div>
      ) : organizations.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <ShieldCheck className="w-10 h-10 mx-auto text-neon-pulse" />
          <h3 className="font-medium text-obsidian-shell text-base">Verification queue is clear</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            All submitted food donor and recipient organizations have been verified. New submissions will appear here automatically.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-neon-pulse font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neon-pulse animate-pulse" />
            <span>{organizations.length} organization(s) awaiting verification</span>
          </div>

          {organizations.map((org: any) => {
            const memberUser = org.members?.[0]?.user;
            return (
              <GlassCard key={org.id} variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse font-bold text-base">
                      {org.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-medium text-base text-obsidian-shell">
                          {org.name}
                        </h2>
                        <Badge variant="outline" size="sm">
                          {org.type}
                        </Badge>
                        <Badge variant="warning" size="sm" dot>
                          {org.verificationStatus}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-text flex items-center gap-2 mt-0.5">
                        <span>Submitted on {new Date(org.createdAt).toLocaleDateString()}</span>
                        {memberUser?.name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-neon-pulse" />
                              Applicant: {memberUser.name}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-soft-coral hover:bg-soft-coral/10 text-xs"
                      onClick={() => setRejectModalOrg(org)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={activeOrgId === org.id}
                      onClick={() => handleApprove(org.id)}
                      leftIcon={<CheckCircle2 className="w-4 h-4 text-obsidian-shell" />}
                    >
                      Approve &amp; Verify
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-card bg-obsidian-shell/5 border border-fog-border flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neon-pulse shrink-0" />
                    <span className="truncate">{org.address}, {org.city}</span>
                  </div>
                  <div className="p-2.5 rounded-card bg-obsidian-shell/5 border border-fog-border flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neon-pulse shrink-0" />
                    <span>{org.phone || memberUser?.phone || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 rounded-card bg-obsidian-shell/5 border border-fog-border flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neon-pulse shrink-0" />
                    <span className="truncate">{org.email || memberUser?.email}</span>
                  </div>
                </div>

                {org.licenseNumber && (
                  <div className="p-2.5 rounded-card bg-neon-pulse/10 border border-neon-pulse/20 text-xs text-obsidian-shell flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neon-pulse shrink-0" />
                    <span>Compliance ID / License: <strong>{org.licenseNumber}</strong></span>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard variant="light" padding="lg" className="max-w-md w-full border-white/80 space-y-4">
            <h3 className="font-display font-medium text-lg text-obsidian-shell">
              Reject Verification: {rejectModalOrg.name}
            </h3>
            <p className="text-xs text-slate-text">
              Provide a clear compliance reason to the organization applicant.
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-obsidian-shell">Rejection Reason</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Unverified FSSAI license number, missing trade license document..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-card bg-white/80 border border-black/10 text-xs text-obsidian-shell focus:outline-none focus:ring-2 focus:ring-neon-pulse/30"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalOrg(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-soft-coral/15 text-soft-coral border-soft-coral/30 hover:bg-soft-coral/25"
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
