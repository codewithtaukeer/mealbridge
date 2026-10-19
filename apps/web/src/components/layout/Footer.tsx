import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-obsidian-shell text-pure-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-t from-neon-pulse/10 to-transparent rounded-full blur-[140px] opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 select-none group">
              <img
                src="/mealbridge-symbol.png"
                alt="MealBridge Logo"
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-2xl font-display font-medium tracking-tight text-pure-white">
                Meal<span className="text-neon-pulse">Bridge</span>
              </span>
            </Link>
            <p className="text-neon-pulse font-medium text-xs tracking-wide">
              Good Food. No Waste. Together.
            </p>
            <p className="text-slate-text text-xs leading-relaxed max-w-sm">
              A production-quality surplus-food rescue network connecting restaurants, canteens,
              verified NGOs, and volunteers to redistribute fresh food safely and efficiently.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-white/5 border border-white/10 text-xs text-slate-text">
              <span className="w-2 h-2 rounded-full bg-neon-pulse shadow-[0_0_8px_#3ddc91] animate-pulse" />
              <span className="text-[11px] text-pure-white/80">Platform Active · Traceable Rescue Network</span>
            </div>
          </div>

          {/* Column 1: Roles */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-medium uppercase tracking-[0.05em] text-neon-pulse">
              Participants
            </h4>
            <ul className="space-y-2 text-xs text-slate-text">
              <li>
                <Link to="/signup?role=DONOR" className="hover:text-neon-pulse transition-colors flex items-center gap-1">
                  Food Donors <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/signup?role=RECIPIENT" className="hover:text-neon-pulse transition-colors flex items-center gap-1">
                  Recipient NGOs <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/signup?role=VOLUNTEER" className="hover:text-neon-pulse transition-colors flex items-center gap-1">
                  Volunteers <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-neon-pulse transition-colors">
                  How Coordination Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-medium uppercase tracking-[0.05em] text-neon-pulse">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-text">
              <li>
                <Link to="/food" className="hover:text-neon-pulse transition-colors">
                  Available Surplus Food
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-neon-pulse transition-colors">
                  Impact & Analytics
                </Link>
              </li>
              <li>
                <Link to="/food-safety" className="hover:text-neon-pulse transition-colors">
                  Food Safety Guidelines
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-neon-pulse transition-colors">
                  About the Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Governance & Help */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-medium uppercase tracking-[0.05em] text-neon-pulse">
              Trust & Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-text">
              <li>
                <Link to="/privacy" className="hover:text-neon-pulse transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-neon-pulse transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-neon-pulse transition-colors">
                  Help & Incident Report
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-neon-pulse transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Legal Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-text">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neon-pulse shrink-0" />
            <p>
              MealBridge coordinates food redistribution. Platform verification does not certify food safety;
              donors and recipients remain responsible for food handling and applicable compliance.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <span>© {currentYear} MealBridge. Built for</span>
            <span className="text-neon-pulse font-medium">zero food waste.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
