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
      <div className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center p-4">
        <div className="glass-light p-8 rounded-card border border-white/60 shadow-glass flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-bridge-green animate-spin" />
          <p className="text-sm font-semibold text-forest-night">
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
