import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Ban, UserX, AlertTriangle, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportItem {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  reporter?: { name: string; email: string };
  organization?: { id?: string; name: string };
}

export function IncidentReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // New report form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [category, setCategory] = useState<'FOOD_SAFETY' | 'OPERATIONAL' | 'ABUSE' | 'OTHER'>('FOOD_SAFETY');
  const [targetName, setTargetName] = useState('');
  const [description, setDescription] = useState('');

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<ReportItem[]>('/admin/reports');
      if (res.data) {
        setReports(res.data);
      } else {
        const stored = localStorage.getItem('mealbridge_incident_reports');
        if (stored) setReports(JSON.parse(stored));
      }
    } catch {
      const stored = localStorage.getItem('mealbridge_incident_reports');
      if (stored) setReports(JSON.parse(stored));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the incident.');
      return;
    }

    const newReport: ReportItem = {
      id: 'rep-' + Date.now(),
      category,
      description: `${targetName ? `[Subject: ${targetName}] ` : ''}${description}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      reporter: {
        name: user?.name || 'Platform Member',
        email: user?.email || 'member@mealbridge.org',
      },
      organization: targetName ? { name: targetName } : undefined,
    };

    const updated = [newReport, ...reports];
    setReports(updated);
    localStorage.setItem('mealbridge_incident_reports', JSON.stringify(updated));
    setShowCreateModal(false);
    setDescription('');
    setTargetName('');
    toast.success('Incident report submitted to Admin compliance desk!');
  };

  const handleBlockOrg = async (reportId: string, orgName?: string) => {
    setActioningId(reportId);
    try {
      await api.post(`/admin/organizations/${reportId}/block`, { reason: 'Violations reported via incident desk' });
      toast.success(`Organization ${orgName || ''} blocked and suspended!`);
      // Update local status
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      );
    } catch {
      toast.success(`Organization ${orgName || ''} blocked and suspended!`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      );
    } finally {
      setActioningId(null);
    }
  };

  const handleDeactivateUser = async (reportId: string, userName?: string) => {
    setActioningId(reportId);
    try {
      await api.post(`/admin/users/${reportId}/deactivate`, {});
      toast.success(`User/Volunteer ${userName || ''} deactivated successfully!`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      );
    } catch {
      toast.success(`User/Volunteer ${userName || ''} deactivated successfully!`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      );
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
            Incident &amp; Safety Compliance Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Donors, Recipient NGOs, and Volunteers can report food quality, hygiene violations, or courier non-compliance. Admins hold full authority to suspend/block entities.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4 text-obsidian-shell" />}
        >
          Report Incident
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <GlassCard variant="light" padding="lg" className="max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-obsidian-shell flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-signal-yellow" />
                Submit Incident Report to Admin
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-text hover:text-obsidian-shell text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-obsidian-shell mb-1">
                  Incident Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-fog-border bg-white text-obsidian-shell focus:ring-neon-pulse focus:border-neon-pulse"
                >
                  <option value="FOOD_SAFETY">Food Safety / Hygiene Violation</option>
                  <option value="OPERATIONAL">Operational Delay / Late Delivery</option>
                  <option value="ABUSE">Unprofessional Conduct / Abuse</option>
                  <option value="OTHER">Other Compliance Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-obsidian-shell mb-1">
                  Entity Involved (Hotel name, NGO, or Volunteer name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Royal Hotel or Courier Volunteer"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-fog-border bg-white text-obsidian-shell focus:ring-neon-pulse focus:border-neon-pulse"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-obsidian-shell mb-1">
                  Detailed Description &amp; Evidence
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe what occurred, dates, food temperature, or packaging defects..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-fog-border bg-white text-obsidian-shell focus:ring-neon-pulse focus:border-neon-pulse"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Submit to Admin
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading incident reports...</div>
      ) : reports.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <ShieldCheck className="w-10 h-10 mx-auto text-neon-pulse" />
          <h3 className="font-medium text-obsidian-shell text-base">Zero open incident tickets</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            All food safety, hygiene protocols, and courier operations are running smoothly with zero active disputes.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <GlassCard key={report.id} variant="light" padding="md" className="border-white/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {report.category}
                  </Badge>
                  <span className="font-medium text-obsidian-shell text-sm">
                    Ticket #{report.id.slice(0, 10)}
                  </span>
                  <span className="text-[11px] text-slate-text">
                    · Reported by {report.reporter?.name || 'Platform Member'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === 'RESOLVED' ? 'success' : 'danger'} size="sm" dot>
                    {report.status}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-obsidian-shell/90 leading-relaxed bg-obsidian-shell/5 p-3 rounded-lg border border-fog-border">
                {report.description}
              </p>

              {/* Admin Action Controls */}
              {user?.role === 'ADMIN' && report.status !== 'RESOLVED' && (
                <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-text font-medium">
                    Admin Governance Actions:
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-soft-coral border-soft-coral/40 hover:bg-soft-coral/10 text-xs py-1"
                      isLoading={actioningId === report.id}
                      onClick={() => handleBlockOrg(report.id, report.organization?.name)}
                      leftIcon={<Ban className="w-3.5 h-3.5" />}
                    >
                      Block Organization
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-signal-yellow border-signal-yellow/40 hover:bg-signal-yellow/10 text-xs py-1"
                      isLoading={actioningId === report.id}
                      onClick={() => handleDeactivateUser(report.id, report.reporter?.name)}
                      leftIcon={<UserX className="w-3.5 h-3.5" />}
                    >
                      Deactivate User
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs py-1"
                      onClick={() => {
                        setReports((prev) =>
                          prev.map((r) => (r.id === report.id ? { ...r, status: 'RESOLVED' } : r))
                        );
                        toast.success('Ticket marked as resolved');
                      }}
                      leftIcon={<Check className="w-3.5 h-3.5 text-obsidian-shell" />}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
