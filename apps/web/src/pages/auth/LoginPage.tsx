import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROLE_DASHBOARD_PATHS } from '@mealbridge/shared';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function LoginPage() {
  const { signIn, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      return;
    }

    // Determine target route
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    if (from && !from.includes('/login') && !from.includes('/signup')) {
      navigate(from, { replace: true });
    } else if (role && ROLE_DASHBOARD_PATHS[role]) {
      navigate(ROLE_DASHBOARD_PATHS[role], { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center min-h-[80vh]">
      <PageContainer size="sm" withBloom>
        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-night flex items-center justify-center mx-auto shadow-md">
            <HeartHandshake className="w-6 h-6 text-fresh-mint" />
          </div>
          <h1 className="text-3xl font-display font-bold text-forest-night">
            Welcome Back to MealBridge
          </h1>
          <p className="text-xs sm:text-sm text-muted-text max-w-sm mx-auto">
            Sign in to access your donation management, rescue assignments, or recipient requests.
          </p>
        </div>

        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-soft-coral/20 border border-soft-coral/40 text-xs text-[#842e1d] font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@organization.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-muted-text" />}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-muted-text" />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-text hover:text-forest-night transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-bridge-green hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-md hover:shadow-glow-mint mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4 text-forest-night" />}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-6 mt-6 border-t border-black/5 text-center text-xs text-muted-text">
            <span>Don&apos;t have an account yet? </span>
            <Link to="/signup" className="font-bold text-bridge-green hover:underline">
              Create an account
            </Link>
          </div>
        </GlassCard>

        {/* Security assurance */}
        <div className="mt-6 text-center text-[11px] text-muted-text/80 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-bridge-green" />
          <span>Encrypted authentication powered by Supabase Auth</span>
        </div>
      </PageContainer>
    </div>
  );
}
