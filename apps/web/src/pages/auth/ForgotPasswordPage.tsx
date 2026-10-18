import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center min-h-[80vh]">
      <PageContainer size="sm" withBloom>
        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-night flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="w-6 h-6 text-fresh-mint" />
          </div>
          <h1 className="text-3xl font-display font-bold text-forest-night">
            Reset Your Password
          </h1>
          <p className="text-xs sm:text-sm text-muted-text max-w-sm mx-auto">
            Enter your registered MealBridge email address and we will send you a secure link to reset your credentials.
          </p>
        </div>

        <GlassCard variant="light" padding="lg" className="border-white/70 shadow-glass-md">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-fresh-mint/30 flex items-center justify-center mx-auto text-forest-night">
                <CheckCircle2 className="w-7 h-7 text-bridge-green" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-forest-night">
                  Check Your Inbox
                </h2>
                <p className="text-xs text-muted-text mt-1 max-w-xs mx-auto">
                  A password reset email has been dispatched to{' '}
                  <span className="font-semibold text-forest-night">{email}</span>. Click the link inside to set a new password.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" size="md" className="w-full justify-center">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-soft-coral/20 border border-soft-coral/40 text-xs text-[#842e1d] font-medium animate-fade-in">
                  {errorMessage}
                </div>
              )}

              <Input
                label="Registered Email Address"
                type="email"
                required
                autoComplete="email"
                placeholder="you@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-muted-text" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-md hover:shadow-glow-mint mt-2"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="pt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-bridge-green hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </GlassCard>
      </PageContainer>
    </div>
  );
}
