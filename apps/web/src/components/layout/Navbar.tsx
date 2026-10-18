import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ROLE_DASHBOARD_PATHS } from '@mealbridge/shared';
import {
  Menu,
  X,
  HeartHandshake,
  UtensilsCrossed,
  Sparkles,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const dashboardPath = (role && ROLE_DASHBOARD_PATHS[role]) || '/donor/dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Find Food', href: '/food' },
    { name: 'Impact', href: '/impact' },
    { name: 'Food Safety', href: '/food-safety' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'py-3 bg-white/80 backdrop-blur-glass border-b border-white/50 shadow-glass-sm'
          : 'py-5 bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group select-none">
            <div className="relative w-10 h-10 rounded-xl bg-forest-night flex items-center justify-center shadow-md overflow-hidden p-1.5 transition-transform duration-200 group-hover:scale-105">
              <img
                src="/mealbridge-logo.png"
                alt="MealBridge Logo"
                className="w-full h-full object-contain filter invert brightness-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <HeartHandshake className="w-5 h-5 text-fresh-mint absolute" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-extrabold tracking-tight text-forest-night group-hover:text-bridge-green transition-colors">
                Meal<span className="text-bridge-green">Bridge</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-text -mt-1 hidden sm:block">
                Good Food · No Waste
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 glass-light px-3 py-1.5 rounded-full border border-white/40 shadow-glass-sm">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    'text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200',
                    active
                      ? 'bg-bridge-green text-white shadow-sm font-semibold'
                      : 'text-primary-text hover:text-bridge-green hover:bg-black/5'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={dashboardPath}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<LayoutDashboard className="w-4 h-4 text-forest-night" />}
                    className="shadow-sm hover:shadow-glow-mint"
                  >
                    Dashboard
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-muted-text hover:text-soft-coral hover:bg-soft-coral/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-forest-night">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup?role=DONOR">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UtensilsCrossed className="w-4 h-4 text-forest-night" />}
                    className="shadow-sm hover:shadow-glow-mint"
                  >
                    Donate Food
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            {user ? (
              <Link to={dashboardPath}>
                <Button variant="primary" size="sm" className="text-xs px-2.5 py-1">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/signup?role=DONOR">
                <Button variant="primary" size="sm" className="text-xs px-2.5 py-1">
                  Donate
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-forest-night bg-white/60 hover:bg-white/90 border border-white/40 shadow-sm transition-colors focus-visible:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden glass-light border-b border-white/50 px-4 pt-4 pb-6 mt-3 shadow-glass animate-fade-in">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  'px-4 py-2.5 rounded-button text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-bridge-green text-white font-semibold'
                    : 'text-primary-text hover:bg-black/5'
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-black/10 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-forest-night bg-black/5 rounded-button">
                    <UserIcon className="w-4 h-4 text-bridge-green" />
                    <span>{user.name} ({role})</span>
                  </div>
                  <Link to={dashboardPath} className="w-full">
                    <Button variant="primary" className="w-full justify-center">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-soft-coral hover:bg-soft-coral/10"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      leftIcon={<Sparkles className="w-4 h-4 text-forest-night" />}
                    >
                      Join MealBridge
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
