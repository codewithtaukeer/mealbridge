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
            className="block text-xs font-semibold uppercase tracking-wider text-primary-text"
          >
            {label}
            {props.required && <span className="text-soft-coral ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-muted-text pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-button bg-white/80 border border-black/15 text-primary-text placeholder:text-muted-text/60 text-sm py-2.5 transition-all duration-200',
              'focus:bg-white focus:border-bridge-green focus:outline-none focus:ring-2 focus:ring-fresh-mint/60',
              'disabled:bg-black/5 disabled:opacity-60 disabled:cursor-not-allowed',
              error && 'border-soft-coral focus:border-soft-coral focus:ring-soft-coral/30',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-muted-text flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#b83820] font-medium animate-fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-text">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
