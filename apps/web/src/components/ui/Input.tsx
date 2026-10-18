import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block eyebrow text-slate-text"
          >
            {label}
            {props.required && <span className="text-neon-pulse ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-text pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl bg-deep-abyss/90 border border-white/15 text-pure-white placeholder:text-slate-text text-sm py-2.5 transition-all duration-200',
              'focus:border-neon-pulse focus:outline-none focus:ring-1 focus:ring-neon-pulse focus:bg-[#070f0f]',
              'disabled:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed',
              error && 'border-soft-coral focus:border-soft-coral focus:ring-soft-coral/30',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-text flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-soft-coral font-medium animate-fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-text">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
