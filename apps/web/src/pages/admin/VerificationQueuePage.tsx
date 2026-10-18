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
      const res = await api.get<Organization[]>('/admin/verifications');
      if (res.data) setOrganizations(res.data);
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
      const res = await api.post(`/admin/verifications/${orgId}/approve`);
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Organization approved and verified!');
        await fetchQueue();
      }
    } catch {
      toast.error('Failed to approve organization');
    } finally {
      setActiveOrgId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalOrg) return;
    setActiveOrgId(rejectModalOrg.id);
    try {
      const res = await api.post(`/admin/verifications/${rejectModalOrg.id}/reject`, {
        reason: rejectReason || 'Incomplete registration documents',
      });
      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Organization verification rejected');
        setRejectModalOrg(null);
        setRejectReason('');
        await fetchQueue();
      }
    } catch {
      toast.error('Failed to reject organization');
    } finally {
      setActiveOrgId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Organization Verification Queue
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Review commercial food donors and non-profit recipient applications before approving live redistribution clearance.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-text text-sm">Loading verification applications...</div>
      ) : organizations.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <ShieldCheck className="w-10 h-10 mx-auto text-bridge-green" />
          <h3 className="font-bold text-forest-night text-base">Verification queue is clear</h3>
          <p className="text-xs text-muted-text max-w-sm mx-auto">
            All submitted food donor and recipient organizations have been verified.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => (
            <GlassCard key={org.id} variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-night flex items-center justify-center text-fresh-mint font-bold text-base">
                    {org.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-base text-forest-night">
                        {org.name}
                      </h2>
                      <Badge variant="outline" size="sm">
                        {org.type}
                      </Badge>
                      <Badge variant="warning" size="sm" dot>
                        {org.verificationStatus}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-text">
                      Registered on {new Date(org.createdAt).toLocaleDateString()}
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
                    leftIcon={<CheckCircle2 className="w-4 h-4 text-forest-night" />}
                  >
                    Approve & Verify
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-bridge-green shrink-0" />
                  <span className="truncate">{org.address}, {org.city}</span>
                </div>
                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-bridge-green shrink-0" />
                  <span>{org.phone || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-card bg-white/60 border border-black/5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-bridge-green shrink-0" />
                  <span className="truncate">{org.email}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard variant="light" padding="lg" className="max-w-md w-full border-white/80 space-y-4">
            <h3 className="font-display font-bold text-lg text-forest-night">
              Reject Verification: {rejectModalOrg.name}
            </h3>
            <p className="text-xs text-muted-text">
              Provide a clear compliance reason to the organization applicant.
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-forest-night">Rejection Reason</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Unverified FSSAI license number, missing trade license document..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-card bg-white/80 border border-black/10 text-xs text-primary-text focus:outline-none focus:ring-2 focus:ring-bridge-green/30"
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
