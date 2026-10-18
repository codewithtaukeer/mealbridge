import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'mint' | 'gold';
  hoverEffect?: boolean;
  blurLevel?: 'normal' | 'heavy';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  size?: 'normal' | 'large';
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'dark',
      hoverEffect = false,
      padding = 'md',
      glow = false,
      size = 'normal',
      children,
      ...props
    },
    ref
  ) => {
    // Luminance contrast surfaces per Sauce Labs engineering console specs
    const variants = {
      // Dark surface (Deep Abyss #0e1a19 on Obsidian Canvas)
      dark:
        'bg-deep-abyss/90 border border-white/10 text-pure-white shadow-md',
      // Light content card (Mint Frost #edf7f5)
      light:
        'bg-mint-frost text-obsidian-shell border border-fog-border shadow-md',
      // Mint Whisper wash for highlights
      mint:
        'bg-mint-frost border border-neon-pulse/50 text-obsidian-shell shadow-md',
      // Signal yellow accent card
      gold:
        'bg-[#232014] border border-signal-yellow/40 text-pure-white shadow-md',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
    };

    const radii = {
      normal: 'rounded-card', // 20px
      large: 'rounded-large-card', // 60px
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative transition-all duration-200',
          radii[size],
          variants[variant],
          paddings[padding],
          glow && 'shadow-neon border-neon-pulse/60',
          hoverEffect &&
            'hover:-translate-y-0.5 hover:border-neon-pulse/40 transition-all cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
