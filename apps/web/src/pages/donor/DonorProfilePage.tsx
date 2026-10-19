import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building, Phone, MapPin, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function DonorProfilePage() {
  const { organization, refreshProfile } = useAuth();

  const [name, setName] = useState(organization?.name || '');
  const [phone, setPhone] = useState(organization?.phone || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [city, setCity] = useState(organization?.city || '');
  const [state, setState] = useState(organization?.state || '');
  const [description, setDescription] = useState(organization?.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.patch('/organizations/me', {
        name,
        phone,
        address,
        city,
        state,
        description,
      });

      if (res.error) {
        toast.error(res.error.message);
      } else {
        toast.success('Organization profile updated');
        await refreshProfile();
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-pure-white">
          Donor Organization Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-text mt-1">
          Manage your commercial entity credentials, physical pickup address, and compliance verification status.
        </p>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-obsidian-shell flex items-center justify-center text-neon-pulse font-display font-bold text-lg">
              {organization?.name?.[0] || 'D'}
            </div>
            <div>
              <h2 className="font-display font-bold text-obsidian-shell text-lg">
                {organization?.name || 'Registered Food Donor'}
              </h2>
              <span className="text-xs text-slate-text">{organization?.type || 'RESTAURANT'}</span>
            </div>
          </div>

          <Badge
            variant={organization?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
            size="md"
            dot
          >
            {organization?.verificationStatus || 'PENDING'}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Organization / Business Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Building className="w-4 h-4 text-slate-text" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-slate-text" />}
            />

            <Input
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-text" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State / Province"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <Input
              label="Street Address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-text" />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-obsidian-shell">
              Business Description / Kitchen Details
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Fine dining restaurant specializing in continental and Indian cuisine. Kitchen closes daily at 10:30 PM."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-card bg-white/70 border border-black/10 text-obsidian-shell text-sm focus:outline-none focus:ring-2 focus:ring-neon-pulse/30"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4 text-obsidian-shell" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
        <span>Verified profile information is shared only with assigned rescue dispatchers</span>
      </div>
    </div>
  );
}
