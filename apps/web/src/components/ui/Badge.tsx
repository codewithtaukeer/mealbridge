import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'mint'
    | 'forest';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'neutral',
      size = 'md',
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      // Success / Available / Delivered (Mint green)
      success:
        'bg-fresh-mint/20 text-[#154633] border border-fresh-mint/40',
      // Warning / Reserved / In Rescue (Harvest gold)
      warning:
        'bg-harvest-gold/25 text-[#6c4800] border border-harvest-gold/50',
      // Danger / Cancelled / Expired / Failed (Soft coral)
      danger:
        'bg-soft-coral/25 text-[#732a1a] border border-soft-coral/50',
      // Info / Under Review
      info:
        'bg-sky-50 text-sky-800 border border-sky-200',
      // Neutral / Category tags
      neutral:
        'bg-black/5 text-muted-text border border-black/10',
      // Fresh Mint highlight
      mint:
        'bg-fresh-mint text-forest-night font-semibold border border-transparent shadow-sm',
      // Forest deep green
      forest:
        'bg-forest-night text-warm-ivory border border-white/20',
    };

    const dotColors = {
      success: 'bg-emerald-600',
      warning: 'bg-amber-600',
      danger: 'bg-rose-600',
      info: 'bg-sky-600',
      neutral: 'bg-stone-500',
      mint: 'bg-forest-night',
      forest: 'bg-fresh-mint',
    };

    const sizes = {
      sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
      md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full tracking-wide transition-colors duration-150 select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse-soft', dotColors[variant])}
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
