import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck } from 'lucide-react';

interface ReportItem {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  reporter?: { name: string; email: string };
  organization?: { name: string };
}

export function IncidentReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setIsLoading(true);
        const res = await api.get<ReportItem[]>('/admin/reports');
        if (res.data) setReports(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          Incident & Food Safety Tickets
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Review operational disputes, hygiene concerns, or delivery exceptions reported by platform members.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-text text-sm">Loading incident reports...</div>
      ) : reports.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <ShieldCheck className="w-10 h-10 mx-auto text-bridge-green" />
          <h3 className="font-bold text-forest-night text-base">Zero open incident tickets</h3>
          <p className="text-xs text-muted-text max-w-sm mx-auto">
            All food safety and courier operations are running smoothly with zero active disputes.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <GlassCard key={report.id} variant="light" padding="md" className="border-white/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {report.category}
                  </Badge>
                  <span className="font-bold text-forest-night text-sm">
                    Report #{report.id.slice(0, 8)}
                  </span>
                </div>
                <Badge variant={report.status === 'RESOLVED' ? 'success' : 'danger'} size="sm" dot>
                  {report.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-text">{report.description}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
