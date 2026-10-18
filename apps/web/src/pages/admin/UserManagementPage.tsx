import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { User } from '@mealbridge/shared';
import { Users, Search } from 'lucide-react';

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        const res = await api.get<User[]>('/admin/users');
        if (res.data) setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
            User Accounts & Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted-text mt-1">
            Global view of registered donors, recipient administrators, volunteer couriers, and staff.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search users by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted-text" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-text text-sm">Loading users...</div>
      ) : filtered.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center py-16 space-y-3 border-dashed">
          <Users className="w-10 h-10 mx-auto text-muted-text" />
          <h3 className="font-bold text-forest-night text-base">No user accounts found</h3>
          <p className="text-xs text-muted-text">Try adjusting your search query.</p>
        </GlassCard>
      ) : (
        <GlassCard variant="light" padding="none" className="border-white/70 overflow-hidden shadow-glass-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-primary-text">
              <thead className="bg-black/5 uppercase text-[10px] font-bold text-muted-text tracking-wider">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-forest-night">{u.name}</div>
                      <div className="text-[11px] text-muted-text">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" size="sm" className="font-semibold text-[10px]">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-text">
                      {new Date(u.createdAt).toLocaleDateString()}
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
