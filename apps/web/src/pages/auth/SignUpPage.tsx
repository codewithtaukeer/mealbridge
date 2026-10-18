import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type SignUpData } from '@/context/AuthContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROLE_DASHBOARD_PATHS, type UserRole, type OrganizationType } from '@mealbridge/shared';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
  HeartHandshake,
  Bike,
} from 'lucide-react';

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('DONOR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Organization-specific state
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('RESTAURANT');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'DONOR') {
      setOrgType('RESTAURANT');
    } else if (role === 'RECIPIENT') {
      setOrgType('NGO');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !email || !password) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Please agree to the Terms of Service and Food Safety Guidelines.');
      return;
    }

    if (selectedRole !== 'VOLUNTEER' && !orgName) {
      setErrorMessage('Organization name is required for Donors and Recipient NGOs.');
      return;
    }

    setIsLoading(true);

    const payload: SignUpData = {
      name,
      email,
      password,
      role: selectedRole,
      phone: phone || undefined,
      organizationName: selectedRole !== 'VOLUNTEER' ? orgName : undefined,
      organizationType: selectedRole !== 'VOLUNTEER' ? orgType : undefined,
      organizationAddress: address || undefined,
      city: city || undefined,
    };

    const result = await signUp(payload);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
      return;
    }

    // Redirect to relevant dashboard
    const targetPath = ROLE_DASHBOARD_PATHS[selectedRole] || '/';
    navigate(targetPath, { replace: true });
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center min-h-[90vh]">
      <PageContainer size="md" withBloom>
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-pure-white">
            Join the MealBridge Network
          </h1>
          <p className="text-sm text-slate-text max-w-md mx-auto">
            Choose your role to redistribute surplus food, support vulnerable communities, or volunteer for local deliveries.
          </p>
        </div>

        {/* Role Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <button
            type="button"
            onClick={() => handleRoleChange('DONOR')}
            className={`p-4 rounded-card text-left transition-all border ${
              selectedRole === 'DONOR'
                ? 'bg-neon-pulse/10 border-neon-pulse/40 shadow-sm'
                : 'bg-mint-frost/60 hover:bg-mint-frost border-fog-border'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-neon-pulse/15 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-5 h-5 text-neon-pulse" />
            </div>
            <h2 className="font-display font-medium text-obsidian-shell text-sm">Food Donor</h2>
            <p className="text-xs text-slate-text mt-1">
              Restaurants, caterers, hotels, and food businesses.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('RECIPIENT')}
            className={`p-4 rounded-card text-left transition-all border ${
              selectedRole === 'RECIPIENT'
                ? 'bg-neon-pulse/10 border-neon-pulse/40 shadow-sm'
                : 'bg-mint-frost/60 hover:bg-mint-frost border-fog-border'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-neon-pulse/15 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5 text-neon-pulse" />
            </div>
            <h2 className="font-display font-medium text-obsidian-shell text-sm">Recipient Org</h2>
            <p className="text-xs text-slate-text mt-1">
              NGOs, community kitchens, shelters, and food banks.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('VOLUNTEER')}
            className={`p-4 rounded-card text-left transition-all border ${
              selectedRole === 'VOLUNTEER'
                ? 'bg-signal-yellow/10 border-signal-yellow/30 shadow-sm'
                : 'bg-mint-frost/60 hover:bg-mint-frost border-fog-border'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-signal-yellow/15 flex items-center justify-center mb-3">
              <Bike className="w-5 h-5 text-signal-yellow" />
            </div>
            <h2 className="font-display font-medium text-obsidian-shell text-sm">Volunteer</h2>
            <p className="text-xs text-slate-text mt-1">
              Individuals assisting with local pickups &amp; deliveries.
            </p>
          </button>
        </div>

        <GlassCard variant="light" padding="lg" className="shadow-md">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-soft-coral/15 border border-soft-coral/30 text-xs text-soft-coral font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name / Primary Contact"
                required
                autoComplete="name"
                placeholder="e.g. Maya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-text" />}
              />

              <Input
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                placeholder="contact@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-text" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password (min 8 characters)"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-text" />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-text hover:text-obsidian-shell transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-text" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-slate-text" />}
              />

              <Input
                label="City / Region"
                placeholder="e.g. Bangalore, Mumbai, Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-slate-text" />}
              />
            </div>

            {/* Organization Fields for Donors and Recipients */}
            {selectedRole !== 'VOLUNTEER' && (
              <div className="pt-4 border-t border-fog-border space-y-4">
                <h2 className="text-[9px] font-medium uppercase tracking-[0.05em] text-obsidian-shell/70">
                  {selectedRole === 'DONOR' ? 'Donor Business Details' : 'Organisation Details'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organization Name"
                    required
                    placeholder={
                      selectedRole === 'DONOR' ? 'e.g. Royal Orchid Grand' : 'e.g. Hope Food Initiative'
                    }
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    leftIcon={<Building className="w-4 h-4 text-slate-text" />}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-obsidian-shell">
                      Organization Category
                    </label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                      className="w-full px-3.5 py-2.5 rounded-card bg-mint-frost border border-fog-border text-obsidian-shell text-sm focus:outline-none focus:ring-2 focus:ring-neon-pulse/30 focus:border-neon-pulse"
                    >
                      {selectedRole === 'DONOR' ? (
                        <>
                          <option value="RESTAURANT">Restaurant / Café</option>
                          <option value="HOTEL">Hotel / Hospitality</option>
                          <option value="CATERER">Catering Service</option>
                          <option value="CANTEEN">Corporate / College Canteen</option>
                          <option value="EVENT_ORGANIZER">Event / Wedding Organizer</option>
                          <option value="OTHER">Other Food Business</option>
                        </>
                      ) : (
                        <>
                          <option value="NGO">Registered NGO / Trust</option>
                          <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                          <option value="FOOD_BANK">Food Bank</option>
                          <option value="OTHER">Shelter / Welfare Group</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <Input
                  label="Registered Address"
                  placeholder="Street, Landmark, Locality"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4 text-slate-text" />}
                />
              </div>
            )}

            {/* Terms and Guidelines Checkbox */}
            <div className="pt-2 flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-fog-border text-neon-pulse focus:ring-neon-pulse"
              />
              <label htmlFor="terms" className="text-xs text-slate-text leading-relaxed">
                I agree to the MealBridge{' '}
                <Link to="/terms" className="text-neon-pulse font-medium hover:underline">
                  Terms of Service
                </Link>
                ,{' '}
                <Link to="/privacy" className="text-neon-pulse font-medium hover:underline">
                  Privacy Policy
                </Link>
                , and commit to following standard{' '}
                <Link to="/food-safety" className="text-neon-pulse font-medium hover:underline">
                  Food Safety Guidelines
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-4"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4 text-obsidian-shell" />}
            >
              Create {selectedRole === 'DONOR' ? 'Donor' : selectedRole === 'RECIPIENT' ? 'Recipient' : 'Volunteer'} Account
            </Button>
          </form>

          <div className="pt-6 mt-6 border-t border-fog-border text-center text-xs text-slate-text">
            <span>Already registered with MealBridge? </span>
            <Link to="/login" className="font-medium text-neon-pulse hover:underline">
              Sign in to your account
            </Link>
          </div>
        </GlassCard>

        <div className="mt-6 text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
          <span>All donor and recipient accounts undergo administrative verification for safety</span>
        </div>
      </PageContainer>
    </div>
  );
}
