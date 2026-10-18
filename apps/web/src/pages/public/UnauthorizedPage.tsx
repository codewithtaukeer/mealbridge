import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Home } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="py-20 flex items-center justify-center min-h-[70vh]">
      <PageContainer size="sm" withBloom>
        <GlassCard variant="light" padding="xl" className="text-center space-y-4 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-soft-coral/15 border border-soft-coral/30 flex items-center justify-center mx-auto text-soft-coral">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-medium text-obsidian-shell">
            Access Restricted
          </h1>

          <p className="text-xs sm:text-sm text-slate-text max-w-sm mx-auto leading-relaxed">
            You do not possess the required role permissions to view or perform operations on this page.
            If you represent a different organization or hold another role, please sign in with appropriate credentials.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link to="/">
              <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
                Return Home
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">
                Sign In with Other Account
              </Button>
            </Link>
          </div>
        </GlassCard>
      </PageContainer>
    </div>
  );
}
