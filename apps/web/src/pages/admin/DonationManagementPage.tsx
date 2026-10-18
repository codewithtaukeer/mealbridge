import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { Donation } from '@mealbridge/shared';
import { UtensilsCrossed, Search } from 'lucide-react';

export function DonationManagementPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDonations() {
      try {
        setIsLoading(true);
        const res = await api.get<Donation[]>('/donations?limit=100');
        if (res.data) setDonations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDonations();
  }, []);

  const filtered = donations.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      d.pickupCity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
            Global Donations Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Audit and inspect all surplus food batches published across all jurisdictions.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search donations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-text" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading global listings...</div>
      ) : filtered.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-medium text-obsidian-shell text-base">No donations recorded</h3>
          <p className="text-xs text-slate-text">No active or completed listings match your query.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <GlassCard key={d.id} variant="light" padding="md" className="border-white/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-obsidian-shell text-sm">{d.title}</span>
                    <Badge variant="outline" size="sm" className="text-[10px]">
                      {d.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-text">
                    Donor: {d.donorOrganization?.name || 'Local Kitchen'} • {d.pickupCity}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-medium text-neon-pulse text-sm">
                    {d.quantity} {d.unit.toLowerCase()}
                  </span>
                  <Badge
                    variant={
                      d.status === 'AVAILABLE'
                        ? 'success'
                        : d.status === 'DELIVERED'
                        ? 'neutral'
                        : 'warning'
                    }
                    size="sm"
                    dot
                  >
                    {d.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-text pt-1">
                <span>Deadline: {new Date(d.pickupDeadline).toLocaleDateString()}</span>
                <span>•</span>
                <span>Created: {new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
