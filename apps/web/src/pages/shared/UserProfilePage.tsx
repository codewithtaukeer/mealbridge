import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Phone, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function UserProfilePage() {
  const { user, role, organization } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Personal profile details saved');
    }, 400);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-night">
          User Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Personal contact details, authenticated role privileges, and security settings.
        </p>
      </div>

      <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-black/5">
          <div className="w-14 h-14 rounded-2xl bg-forest-night flex items-center justify-center text-fresh-mint font-display font-bold text-xl shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="space-y-0.5">
            <h2 className="font-display font-bold text-lg text-forest-night">{user?.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="font-semibold text-[10px]">
                {role}
              </Badge>
              {organization && (
                <span className="text-xs text-muted-text">• {organization.name}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-muted-text" />}
          />

          <Input
            label="Email Address"
            type="email"
            disabled
            value={user?.email || ''}
            leftIcon={<Mail className="w-4 h-4 text-muted-text" />}
          />

          <Input
            label="Contact Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-muted-text" />}
          />

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4 text-forest-night" />}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="text-center text-[11px] text-muted-text flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-bridge-green" />
        <span>Authentication managed with Supabase security tokens</span>
      </div>
    </div>
  );
}
