import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { ROLE_LABELS, type UserRole } from '@mealbridge/shared';
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  HeartHandshake,
  Bike,
  Building,
  ShieldCheck,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  History,
  Sliders,
  BarChart3,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export function AppLayout() {
  const { user, role, organization, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getNavItems = (currentRole: UserRole | null): NavItem[] => {
    switch (currentRole) {
      case 'DONOR':
        return [
          { label: 'Overview', path: '/donor/dashboard', icon: LayoutDashboard },
          { label: 'My Donations', path: '/donor/donations', icon: UtensilsCrossed },
          { label: 'Create Donation', path: '/donor/donations/create', icon: PlusCircle },
          { label: 'Rescues & Transit', path: '/donor/rescues', icon: HeartHandshake },
          { label: 'Impact Analytics', path: '/donor/analytics', icon: BarChart3 },
          { label: 'Donor Profile', path: '/donor/profile', icon: Building },
        ];
      case 'RECIPIENT':
        return [
          { label: 'Dashboard', path: '/recipient/dashboard', icon: LayoutDashboard },
          { label: 'Available Food', path: '/recipient/food', icon: UtensilsCrossed },
          { label: 'Incoming Rescues', path: '/recipient/rescues', icon: HeartHandshake },
          { label: 'Intake Preferences', path: '/recipient/needs', icon: Sliders },
          { label: 'Community Impact', path: '/recipient/impact', icon: BarChart3 },
          { label: 'NGO Profile', path: '/recipient/profile', icon: Building },
        ];
      case 'VOLUNTEER':
        return [
          { label: 'Dashboard', path: '/volunteer/dashboard', icon: LayoutDashboard },
          { label: 'Available Missions', path: '/volunteer/tasks', icon: Bike },
          { label: 'Active Missions', path: '/volunteer/my-tasks', icon: HeartHandshake },
          { label: 'Mission History', path: '/volunteer/history', icon: History },
          { label: 'Radius & Schedule', path: '/volunteer/profile', icon: MapPin },
        ];
      case 'ADMIN':
        return [
          { label: 'Ops Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Verification Queue', path: '/admin/verification', icon: ShieldCheck },
          { label: 'Organizations', path: '/admin/organizations', icon: Building },
          { label: 'Users & Roles', path: '/admin/users', icon: Users },
          { label: 'All Donations', path: '/admin/donations', icon: UtensilsCrossed },
          { label: 'Live Operations', path: '/admin/rescues', icon: HeartHandshake },
          { label: 'Incident Reports', path: '/admin/reports', icon: AlertTriangle },
          { label: 'Audit Trail', path: '/admin/audit', icon: FileText },
          { label: 'Platform Settings', path: '/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(role);

  // Unread notifications and pending verifications count from API
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingVerifCount, setPendingVerifCount] = useState(0);

  const fetchBadgeCounts = async () => {
    try {
      if (role === 'ADMIN') {
        const [verifRes, notifRes] = await Promise.all([
          api.get<any[]>('/admin/verifications'),
          api.get<any[]>('/notifications'),
        ]);

        if (verifRes.data) {
          setPendingVerifCount(verifRes.data.length);
        }

        if (notifRes.data) {
          setUnreadCount(notifRes.data.filter((n) => !n.isRead).length);
        }
      } else {
        setPendingVerifCount(0);
        const notifRes = await api.get<any[]>('/notifications');
        if (notifRes.data) {
          setUnreadCount(notifRes.data.filter((n) => !n.isRead).length);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const handleUpdate = () => fetchBadgeCounts();
    window.addEventListener('mealbridge_notifications_updated', handleUpdate);
    window.addEventListener('mealbridge_queue_updated', handleUpdate);
    return () => {
      window.removeEventListener('mealbridge_notifications_updated', handleUpdate);
      window.removeEventListener('mealbridge_queue_updated', handleUpdate);
    };
  }, [role, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-obsidian-shell flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-deep-abyss px-4 py-3 flex items-center justify-between text-white border-b border-white/10 z-40 sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-pulse/20 flex items-center justify-center p-1">
            <HeartHandshake className="w-4 h-4 text-neon-pulse" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white">
            Meal<span className="text-neon-pulse">Bridge</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-pulse text-obsidian-shell text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-xl text-white bg-white/10 hover:bg-white/20"
            aria-label="Toggle Navigation"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Deep-Green Obsidian Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-deep-abyss text-white flex flex-col justify-between p-5 transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0 border-r border-white/10 shadow-2xl overflow-y-auto custom-scrollbar',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center justify-between px-1 pt-1">
            <Link to="/" className="flex items-center gap-2.5 group select-none">
              <div className="w-9 h-9 rounded-xl bg-neon-pulse/15 border border-neon-pulse/30 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5 text-neon-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-display font-medium tracking-tight text-pure-white leading-tight">
                  Meal<span className="text-neon-pulse">Bridge</span>
                </span>
                <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-neon-pulse/70">
                  {role ? ROLE_LABELS[role] : 'Platform'}
                </span>
              </div>
            </Link>
          </div>

          {/* User & Organization Pill */}
          <div className="p-3 rounded-card bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white truncate max-w-[140px]">
                {organization?.name || user?.name || 'My Account'}
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.05em] px-2 py-0.5 rounded-full bg-neon-pulse text-obsidian-shell">
                {role}
              </span>
            </div>
            <p className="text-[11px] text-white/50 truncate">{user?.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-button text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'bg-neon-pulse text-obsidian-shell font-semibold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-obsidian-shell' : 'text-neon-pulse/60')} />
                  <span>{item.label}</span>
                  {item.path === '/admin/verification' && pendingVerifCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-signal-yellow text-obsidian-shell shadow-sm">
                      {pendingVerifCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-white/10 space-y-0.5">
          <Link
            to="/notifications"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center justify-between px-3.5 py-2 rounded-button text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-neon-pulse/60" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-neon-pulse text-obsidian-shell">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-button text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Settings className="w-4 h-4 text-neon-pulse/60" />
            <span>Settings</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-button text-xs text-soft-coral hover:bg-soft-coral/15 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 min-w-0 min-h-screen bg-obsidian-shell flex flex-col">
        {/* Top Header (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-deep-abyss border-b border-white/8 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-text">
            <span>MealBridge</span>
            <span>/</span>
            <span className="font-medium text-pure-white capitalize">
              {location.pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-pulse text-obsidian-shell text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neon-pulse/15 border border-neon-pulse/30 flex items-center justify-center font-bold text-xs text-neon-pulse">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-pure-white leading-tight">{user?.name}</span>
                <span className="text-[10px] text-slate-text">{organization?.name || role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
