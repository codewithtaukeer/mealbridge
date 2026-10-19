import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Building,
  Users,
  UtensilsCrossed,
  HeartHandshake,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  pendingVerifications: number;
  totalDonations: number;
  totalRescues: number;
  auditEventsCount: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const res = await api.get<AdminStats>('/admin/stats');
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="py-20 text-center text-slate-text text-sm">
        Loading platform operations metrics...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
          Platform Operations &amp; Compliance
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          High-level oversight across verified donor businesses, recipient charities, volunteer dispatchers, and audit logs.
        </p>
      </div>

      {/* Verification Alert Banner */}
      {stats && stats.pendingVerifications > 0 && (
        <div className="p-4 rounded-xl bg-signal-yellow/10 border border-signal-yellow/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-signal-yellow shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-medium text-sm text-obsidian-shell">
                {stats.pendingVerifications} Organization(s) Awaiting Compliance Verification
              </span>
              <p className="text-xs text-obsidian-shell/80 mt-0.5">
                Review FSSAI certificates, NGO registration deeds, and authorization documents.
              </p>
            </div>
          </div>
          <Link to="/admin/verification">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              Review Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Verified Organizations</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/30 flex items-center justify-center">
              <Building className="w-4 h-4 text-obsidian-shell" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-medium text-obsidian-shell">
              {stats?.totalOrganizations || 0}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Donors and recipient NGOs</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Total Platform Users</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-medium text-obsidian-shell">
              {stats?.totalUsers || 0}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Active across all roles</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Food Donations Logged</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/20 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-medium text-obsidian-shell">
              {stats?.totalDonations || 0}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Surplus food batches</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Dispatched Rescues</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-gold/25 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-signal-yellow" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-medium text-obsidian-shell">
              {stats?.totalRescues || 0}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Coordinated redistribution runs</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Immutable Audit Events</span>
            <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
              <FileText className="w-4 h-4 text-obsidian-shell" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-display font-medium text-obsidian-shell">
              {stats?.auditEventsCount || 0}
            </span>
            <span className="text-[11px] text-slate-text block mt-0.5">Traceable system transactions</span>
          </div>
        </GlassCard>

        <GlassCard variant="light" padding="md" className="border-white/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-text">Compliance Status</span>
            <div className="w-8 h-8 rounded-xl bg-neon-pulse/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-neon-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-display font-medium text-neon-pulse">Operational</span>
            <span className="text-[11px] text-slate-text block mt-0.5">FSSAI protocol compliant</span>
          </div>
        </GlassCard>
      </div>

      {/* Quick Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/verification" className="block">
          <GlassCard variant="light" padding="md" className="border-white/70 hover:shadow-glass-md transition-shadow">
            <ShieldCheck className="w-6 h-6 text-neon-pulse mb-2" />
            <h3 className="font-medium text-sm text-obsidian-shell">Verification Queue</h3>
            <p className="text-xs text-slate-text mt-1">Review pending organizations</p>
          </GlassCard>
        </Link>

        <Link to="/admin/organizations" className="block">
          <GlassCard variant="light" padding="md" className="border-white/70 hover:shadow-glass-md transition-shadow">
            <Building className="w-6 h-6 text-neon-pulse mb-2" />
            <h3 className="font-medium text-sm text-obsidian-shell">Organizations</h3>
            <p className="text-xs text-slate-text mt-1">Directory of donors and NGOs</p>
          </GlassCard>
        </Link>

        <Link to="/admin/users" className="block">
          <GlassCard variant="light" padding="md" className="border-white/70 hover:shadow-glass-md transition-shadow">
            <Users className="w-6 h-6 text-neon-pulse mb-2" />
            <h3 className="font-medium text-sm text-obsidian-shell">User Accounts</h3>
            <p className="text-xs text-slate-text mt-1">Role assignments and access</p>
          </GlassCard>
        </Link>

        <Link to="/admin/audit" className="block">
          <GlassCard variant="light" padding="md" className="border-white/70 hover:shadow-glass-md transition-shadow">
            <FileText className="w-6 h-6 text-neon-pulse mb-2" />
            <h3 className="font-medium text-sm text-obsidian-shell">Audit Logs</h3>
            <p className="text-xs text-slate-text mt-1">Chronological transaction logs</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
