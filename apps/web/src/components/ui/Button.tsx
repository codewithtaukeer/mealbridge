import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // 56px pill border-radius as mandated by Sauce Labs style reference
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-pill transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-shell disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      // Primary: Neon Pulse (#3ddc91) filled pill with dark text (#132322)
      primary:
        'bg-neon-pulse text-obsidian-shell hover:bg-[#4ae59c] shadow-sm hover:shadow-neon font-semibold border-none',
      // Secondary: Deep abyss with white text and subtle border
      secondary:
        'bg-deep-abyss text-pure-white hover:bg-black/40 border border-white/10 hover:border-white/20',
      // Glass: Translucent obsidian with fine border
      glass:
        'glass-dark text-pure-white hover:border-neon-pulse/40 border border-white/10 shadow-md',
      // Outline: Ghost pill with hairline white or fog border
      outline:
        'border border-white/20 text-pure-white hover:border-neon-pulse hover:text-neon-pulse hover:bg-neon-pulse/5 active:bg-neon-pulse/10',
      // Ghost: Minimal text button
      ghost:
        'text-pure-white/80 hover:text-pure-white hover:bg-white/5 active:bg-white/10',
      // Danger: Signal red/coral for destructive operations
      danger:
        'bg-soft-coral text-obsidian-shell hover:bg-[#f28571] font-semibold',
    };

    const sizes = {
      sm: 'text-xs px-4 py-2 gap-1.5 min-h-[36px]',
      md: 'text-sm px-6 py-3 gap-2 min-h-[46px]',
      lg: 'text-base px-8 py-4 gap-2.5 min-h-[56px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
