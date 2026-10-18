import { Link } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest-night text-warm-ivory pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-t from-bridge-green/20 to-transparent rounded-full blur-[140px] opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-xl bg-bridge-green flex items-center justify-center p-1.5 shadow-md">
                <HeartHandshake className="w-5 h-5 text-fresh-mint" />
              </div>
              <span className="text-2xl font-display font-extrabold tracking-tight text-warm-ivory">
                Meal<span className="text-fresh-mint">Bridge</span>
              </span>
            </Link>
            <p className="text-fresh-mint font-medium text-sm tracking-wide">
              Good Food. No Waste. Together.
            </p>
            <p className="text-warm-ivory/70 text-sm leading-relaxed max-w-sm">
              A production-quality surplus-food rescue network connecting restaurants, canteens,
              verified NGOs, and volunteers to redistribute fresh food safely and efficiently.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-warm-ivory/80">
              <span className="w-2 h-2 rounded-full bg-fresh-mint animate-pulse" />
              <span>Platform Active · Traceable Rescue Network</span>
            </div>
          </div>

          {/* Column 1: Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-fresh-mint">
              Participants
            </h4>
            <ul className="space-y-2 text-sm text-warm-ivory/75">
              <li>
                <Link to="/signup?role=DONOR" className="hover:text-fresh-mint transition-colors flex items-center gap-1">
                  Food Donors <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/signup?role=RECIPIENT" className="hover:text-fresh-mint transition-colors flex items-center gap-1">
                  Recipient NGOs <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/signup?role=VOLUNTEER" className="hover:text-fresh-mint transition-colors flex items-center gap-1">
                  Volunteers <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-fresh-mint transition-colors">
                  How Coordination Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-fresh-mint">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-warm-ivory/75">
              <li>
                <Link to="/food" className="hover:text-fresh-mint transition-colors">
                  Available Surplus Food
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-fresh-mint transition-colors">
                  Impact & Analytics
                </Link>
              </li>
              <li>
                <Link to="/food-safety" className="hover:text-fresh-mint transition-colors">
                  Food Safety Guidelines
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-fresh-mint transition-colors">
                  About the Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Governance & Help */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-fresh-mint">
              Trust & Support
            </h4>
            <ul className="space-y-2 text-sm text-warm-ivory/75">
              <li>
                <Link to="/privacy" className="hover:text-fresh-mint transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-fresh-mint transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-fresh-mint transition-colors">
                  Help & Incident Report
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-fresh-mint transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Legal Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-warm-ivory/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-fresh-mint shrink-0" />
            <p>
              MealBridge coordinates food redistribution. Platform verification does not certify food safety;
              donors and recipients remain responsible for food handling and applicable compliance.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <span>© {currentYear} MealBridge. Built with</span>
            <Heart className="w-3.5 h-3.5 text-soft-coral fill-soft-coral inline" />
            <span>for zero food waste.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
