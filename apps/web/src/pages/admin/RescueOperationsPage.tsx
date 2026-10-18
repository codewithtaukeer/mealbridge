import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { Rescue } from '@mealbridge/shared';
import { HeartHandshake } from 'lucide-react';

export function RescueOperationsPage() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRescues() {
      try {
        setIsLoading(true);
        const res = await api.get<Rescue[]>('/rescues');
        if (res.data) setRescues(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRescues();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
          Rescue Missions Operations Board
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Monitor active, in-transit, and completed surplus food courier missions across the entire platform.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading operations board...</div>
      ) : rescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <HeartHandshake className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-medium text-obsidian-shell text-base">No active rescue operations</h3>
          <p className="text-xs text-slate-text">Missions will appear as recipient NGOs claim donations.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {rescues.map((r) => (
            <GlassCard key={r.id} variant="light" padding="md" className="border-white/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-obsidian-shell text-sm">
                      {r.donation?.title}
                    </span>
                    <Badge variant={r.status === 'DELIVERED' ? 'success' : 'warning'} size="sm" dot>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-text">
                    Mission ID: <span className="font-mono">{r.id.slice(0, 8)}...</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-medium text-neon-pulse text-sm block">
                    {r.donation?.quantity} {r.donation?.unit.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-slate-text">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-text pt-1">
                <div>Donor: {r.donation?.donorOrganization?.name}</div>
                <div>Recipient: {r.recipientOrganization?.name}</div>
                <div>Volunteer: {r.volunteer?.name || 'Awaiting Claim'}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
