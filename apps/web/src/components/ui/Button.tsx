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
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-button transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh-mint focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      // Primary: Fresh Mint action button with dark forest text
      primary:
        'bg-fresh-mint text-forest-night hover:bg-[#a6e676] shadow-sm hover:shadow-glow-mint active:bg-[#96d764] font-semibold',
      // Secondary: Solid Bridge Green with white text
      secondary:
        'bg-bridge-green text-white hover:bg-forest-night shadow-sm hover:shadow-md',
      // Glass: Liquid glass translucency with subtle border & highlight
      glass:
        'glass-light text-forest-night hover:bg-white/80 border border-white/40 shadow-glass-sm hover:shadow-glass hover:border-white/60',
      // Outline: Forest green border
      outline:
        'border border-bridge-green/30 text-bridge-green hover:bg-bridge-green/10 active:bg-bridge-green/15',
      // Ghost: Subdued hover
      ghost:
        'text-primary-text hover:bg-black/5 active:bg-black/10',
      // Danger: Coral red for destructive actions
      danger:
        'bg-soft-coral text-forest-night hover:bg-[#df9179] font-medium shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
      md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
      lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
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
