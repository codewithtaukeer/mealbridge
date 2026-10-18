import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@mealbridge/shared';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, session, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-shell flex flex-col items-center justify-center p-4">
        <div className="p-8 rounded-card bg-deep-abyss border border-white/10 shadow-lg flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-neon-pulse animate-spin" />
          <p className="text-sm font-medium text-slate-text">
            Verifying MealBridge credentials...
          </p>
        </div>
      </div>
    );
  }

  // Check if authenticated
  if (!session && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
