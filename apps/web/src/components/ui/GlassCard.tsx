import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'mint' | 'gold';
  hoverEffect?: boolean;
  blurLevel?: 'normal' | 'heavy';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'light',
      hoverEffect = false,
      blurLevel = 'normal',
      padding = 'md',
      glow = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      // Light frosted glass for warm-ivory background
      light:
        'bg-white/70 border border-white/50 text-primary-text shadow-glass',
      // Deep forest translucent glass for dark sections
      dark:
        'bg-[#102D25]/85 border border-white/15 text-warm-ivory shadow-glass-lg',
      // Mint tinted glass for highlights & active items
      mint:
        'bg-fresh-mint/15 border border-fresh-mint/30 text-forest-night shadow-glass-sm',
      // Harvest gold tinted glass for warnings/urgent cards
      gold:
        'bg-harvest-gold/15 border border-harvest-gold/30 text-forest-night shadow-glass-sm',
    };

    const blurs = {
      normal: 'backdrop-blur-glass backdrop-saturate-150',
      heavy: 'backdrop-blur-glass-heavy backdrop-saturate-180',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-card transition-all duration-300',
          variants[variant],
          blurs[blurLevel],
          paddings[padding],
          glow && 'shadow-glow-mint',
          hoverEffect &&
            'hover:-translate-y-1 hover:shadow-glass-lg hover:border-white/70 cursor-pointer',
          className
        )}
        {...props}
      >
        {/* Subtle top specular highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none rounded-t-card" />
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
