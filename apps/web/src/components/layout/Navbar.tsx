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
          ? 'py-3 bg-obsidian-shell/90 backdrop-blur-md border-b border-white/10 shadow-md'
          : 'py-5 bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group select-none">
            <div className="relative w-10 h-10 rounded-xl bg-deep-abyss border border-neon-pulse/30 flex items-center justify-center shadow-md overflow-hidden p-1.5 transition-transform duration-200 group-hover:scale-105">
              <img
                src="/mealbridge-logo.png"
                alt="MealBridge Logo"
                className="w-full h-full object-contain filter invert brightness-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <HeartHandshake className="w-5 h-5 text-neon-pulse absolute" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-medium tracking-tight text-pure-white group-hover:text-neon-pulse transition-colors">
                Meal<span className="text-neon-pulse">Bridge</span>
              </span>
              <span className="text-[9px] uppercase font-medium tracking-[0.05em] text-slate-text -mt-0.5 hidden sm:block">
                Good Food · No Waste
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-deep-abyss/90 px-3 py-1.5 rounded-pill border border-white/10 shadow-md">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    'text-xs font-medium px-4 py-1.5 rounded-pill transition-all duration-200',
                    active
                      ? 'bg-neon-pulse text-obsidian-shell font-semibold shadow-neon'
                      : 'text-slate-text hover:text-pure-white hover:bg-white/5'
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
                    leftIcon={<LayoutDashboard className="w-4 h-4 text-obsidian-shell" />}
                  >
                    Console
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-text hover:text-soft-coral hover:bg-soft-coral/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-pure-white hover:text-neon-pulse">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup?role=DONOR">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UtensilsCrossed className="w-4 h-4 text-obsidian-shell" />}
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
                  Console
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
              className="p-2 rounded-xl text-pure-white bg-deep-abyss/80 hover:bg-deep-abyss border border-white/10 shadow-sm transition-colors focus-visible:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-deep-abyss border-b border-white/10 px-4 pt-4 pb-6 mt-3 shadow-lg animate-fade-in">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  'px-4 py-2.5 rounded-pill text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-neon-pulse text-obsidian-shell font-semibold'
                    : 'text-slate-text hover:text-pure-white hover:bg-white/5'
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-pure-white bg-white/5 rounded-pill border border-white/10">
                    <UserIcon className="w-4 h-4 text-neon-pulse" />
                    <span>{user.name} ({role})</span>
                  </div>
                  <Link to={dashboardPath} className="w-full">
                    <Button variant="primary" className="w-full justify-center">
                      Open Console
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
                      leftIcon={<Sparkles className="w-4 h-4 text-obsidian-shell" />}
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
