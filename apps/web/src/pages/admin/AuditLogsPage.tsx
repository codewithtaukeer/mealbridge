import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { FileText } from 'lucide-react';

interface AuditItem {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  createdAt: string;
  actor?: { name: string; email: string };
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        const res = await api.get<AuditItem[]>('/admin/audit-logs');
        if (res.data) setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
          Chronological Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Immutable audit trail recording state modifications, verification changes, and claim transactions.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading audit events...</div>
      ) : logs.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <FileText className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-medium text-obsidian-shell text-base">No audit events logged yet</h3>
          <p className="text-xs text-slate-text">Audit records will populate as transactions occur.</p>
        </GlassCard>
      ) : (
        <GlassCard variant="light" padding="none" className="border-white/70 overflow-hidden shadow-glass-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-obsidian-shell">
              <thead className="bg-black/5 uppercase text-[10px] font-medium text-slate-text tracking-[0.05em]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target Resource</th>
                  <th className="px-4 py-3">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-4 py-3 text-slate-text whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-obsidian-shell font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{log.actor?.name || 'System / User'}</div>
                      <Badge variant="outline" size="sm" className="text-[9px] mt-0.5">
                        {log.actorRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-text">
                      <span className="font-semibold text-obsidian-shell">{log.resourceType}: </span>
                      <span className="font-mono text-[11px]">{log.resourceId.slice(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-text">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
