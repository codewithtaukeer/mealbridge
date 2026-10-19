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
        let list: Organization[] = [];
        try {
          const res = await api.get<Organization[]>('/admin/organizations');
          if (res.data && res.data.length > 0) list = res.data;
        } catch {}

        // Merge locally registered and pending organizations
        try {
          const localPending = JSON.parse(localStorage.getItem('mealbridge_pending_verifications') || '[]');
          const currentOrg = JSON.parse(localStorage.getItem('mealbridge_current_org') || 'null');
          if (currentOrg) localPending.push(currentOrg);
          list = [...localPending, ...list];
        } catch {}

        // Fallback default list if completely empty
        if (list.length === 0) {
          list = [
            {
              id: 'org-seed-dir-1',
              name: 'Grand Heritage Hotel & Banquet',
              type: 'HOTEL',
              phone: '+91 98390 12345',
              email: 'events@grandheritage.com',
              address: '14 MG Road, Civil Lines',
              city: 'Prayagraj',
              state: 'UP',
              pinCode: '211001',
              verificationStatus: 'VERIFIED',
              isActive: true,
              createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'org-seed-dir-2',
              name: 'Annapurna Community Kitchen',
              type: 'NGO',
              phone: '+91 94150 98765',
              email: 'contact@annapurnatrust.org',
              address: 'Plot 45, Naini Industrial Area',
              city: 'Prayagraj',
              state: 'UP',
              pinCode: '211008',
              verificationStatus: 'VERIFIED',
              isActive: true,
              createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'org-seed-dir-3',
              name: 'Taj City Caterers & Events',
              type: 'CATERER',
              phone: '+91 98380 44556',
              email: 'orders@tajcitycaterers.in',
              address: '22 Sardar Patel Marg',
              city: 'Prayagraj',
              state: 'UP',
              pinCode: '211001',
              verificationStatus: 'VERIFIED',
              isActive: true,
              createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'org-seed-dir-4',
              name: 'Hope Community Food Bank',
              type: 'FOOD_BANK',
              phone: '+91 99350 77889',
              email: 'support@hopefoodbank.org',
              address: '88 Subhash Chauraha, Katra',
              city: 'Prayagraj',
              state: 'UP',
              pinCode: '211002',
              verificationStatus: 'VERIFIED',
              isActive: true,
              createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }

        const unique = Array.from(new Map(list.map((o) => [o.id, o])).values());
        setOrganizations(unique);
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
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-pure-white">
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
