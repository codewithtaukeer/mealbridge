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

    // Determine target route using returned role from sign in
    const targetRole = result.role || role || 'DONOR';
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    if (from && !from.includes('/login') && !from.includes('/signup')) {
      navigate(from, { replace: true });
    } else if (targetRole && ROLE_DASHBOARD_PATHS[targetRole]) {
      navigate(ROLE_DASHBOARD_PATHS[targetRole], { replace: true });
    } else {
      navigate('/donor/dashboard', { replace: true });
    }
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center min-h-[80vh]">
      <PageContainer size="sm" withBloom>
        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-neon-pulse/15 border border-neon-pulse/30 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6 text-neon-pulse" />
          </div>
          <h1 className="text-3xl font-display font-medium text-pure-white">
            Welcome Back to MealBridge
          </h1>
          <p className="text-xs sm:text-sm text-slate-text max-w-sm mx-auto">
            Sign in to access your donation management, rescue assignments, or recipient requests.
          </p>
        </div>

        <GlassCard variant="light" padding="lg" className="shadow-md">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-soft-coral/15 border border-soft-coral/30 text-xs text-soft-coral font-medium animate-fade-in">
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
              leftIcon={<Mail className="w-4 h-4 text-slate-text" />}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="············"
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
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-neon-pulse hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4 text-obsidian-shell" />}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-6 mt-6 border-t border-fog-border text-center text-xs text-slate-text">
            <span>Don&apos;t have an account yet? </span>
            <Link to="/signup" className="font-medium text-neon-pulse hover:underline">
              Create an account
            </Link>
          </div>
        </GlassCard>

        {/* Security assurance */}
        <div className="mt-6 text-center text-[11px] text-slate-text flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-pulse" />
          <span>Encrypted authentication powered by Supabase Auth</span>
        </div>
      </PageContainer>
    </div>
  );
}
