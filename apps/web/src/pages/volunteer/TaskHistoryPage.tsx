import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { Rescue } from '@mealbridge/shared';
import { History, Sparkles } from 'lucide-react';

export function TaskHistoryPage() {
  const { user } = useAuth();
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get<Rescue[]>('/rescues');
        if (res.data) {
          const completed = res.data.filter(
            (r) => r.volunteerId === user?.id && r.status === 'DELIVERED'
          );
          setRescues(completed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [user?.id]);

  const totalPortions = rescues.reduce((acc, curr) => acc + (curr.donation?.quantity || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
          Mission History
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Log of completed surplus food deliveries and community meals rescued.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-neon-pulse/10 border border-neon-pulse/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-text">Your Cumulative Impact</span>
            <p className="font-display font-medium text-lg text-obsidian-shell">
              {rescues.length} Completed Missions • {totalPortions} Meals Rescued
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading mission history...</div>
      ) : rescues.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <History className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-medium text-obsidian-shell text-base">No completed deliveries yet</h3>
          <p className="text-xs text-slate-text max-w-sm mx-auto">
            Your fulfilled missions and delivery confirmation certificates will appear here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {rescues.map((rescue) => (
            <GlassCard key={rescue.id} variant="light" padding="md" className="border-white/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-obsidian-shell text-sm">
                      {rescue.donation?.title}
                    </span>
                    <Badge variant="success" size="sm" dot>
                      Delivered
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-text">
                    From {rescue.donation?.donorOrganization?.name} to {rescue.recipientOrganization?.name}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-medium text-neon-pulse text-sm block">
                    {rescue.donation?.quantity} {rescue.donation?.unit.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-slate-text">
                    {rescue.deliveredAt ? new Date(rescue.deliveredAt).toLocaleDateString() : 'Completed'}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
