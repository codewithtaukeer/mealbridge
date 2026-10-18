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
    | 'forest'
    | 'outline';
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
      // Success / Available / Delivered (Neon Pulse)
      success:
        'bg-neon-pulse/15 text-neon-pulse border border-neon-pulse/30',
      // Warning / Reserved / In Rescue (Signal Yellow)
      warning:
        'bg-signal-yellow/15 text-signal-yellow border border-signal-yellow/30',
      // Danger / Cancelled / Expired / Failed (Soft coral)
      danger:
        'bg-soft-coral/20 text-soft-coral border border-soft-coral/40',
      // Info / Under Review
      info:
        'bg-neon-pulse/10 text-mint-whisper border border-neon-pulse/20',
      // Neutral / Category tags
      neutral:
        'bg-white/5 text-slate-text border border-white/10',
      // Neon highlight
      mint:
        'bg-neon-pulse text-obsidian-shell font-semibold border border-transparent shadow-sm',
      // Forest / Obsidian deep
      forest:
        'bg-obsidian-shell text-pure-white border border-white/20',
      // Outline
      outline:
        'bg-transparent text-pure-white border border-white/20',
    };

    const dotColors = {
      success: 'bg-neon-pulse shadow-[0_0_8px_#3ddc91]',
      warning: 'bg-signal-yellow shadow-[0_0_6px_#ffcd48]',
      danger: 'bg-soft-coral shadow-[0_0_6px_#e9705a]',
      info: 'bg-mint-whisper',
      neutral: 'bg-slate-text',
      mint: 'bg-obsidian-shell',
      forest: 'bg-neon-pulse',
      outline: 'bg-slate-text',
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
