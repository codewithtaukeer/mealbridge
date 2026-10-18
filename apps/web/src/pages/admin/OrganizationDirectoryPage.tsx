import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { Organization } from '@mealbridge/shared';
import { Building, Search } from 'lucide-react';

export function OrganizationDirectoryPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrgs() {
      try {
        setIsLoading(true);
        const res = await api.get<Organization[]>('/admin/organizations');
        if (res.data) setOrganizations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrgs();
  }, []);

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      o.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
            Organization Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-text mt-1">
            Registered food donors, charities, and distribution centers across the MealBridge network.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, city, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-text" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-text text-sm">Loading directory...</div>
      ) : filtered.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <Building className="w-10 h-10 mx-auto text-slate-text" />
          <h3 className="font-medium text-obsidian-shell text-base">No organizations found</h3>
          <p className="text-xs text-slate-text">Try modifying your search criteria.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((org) => (
            <GlassCard key={org.id} variant="light" padding="md" className="border-white/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-obsidian-shell flex items-center justify-center text-neon-pulse font-bold text-sm">
                    {org.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-obsidian-shell text-sm">{org.name}</span>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {org.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-text">{org.address}, {org.city}</span>
                  </div>
                </div>

                <Badge
                  variant={org.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {org.verificationStatus}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-text pt-1">
                <span>Phone: {org.phone || 'N/A'}</span>
                <span>•</span>
                <span>Email: {org.email}</span>
                <span>•</span>
                <span>Joined: {new Date(org.createdAt).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
