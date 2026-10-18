import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  theme?: 'light' | 'dark';
  action?: React.ReactNode;
}

export function SectionHeading({
  badge,
  title,
  description,
  align = 'left',
  theme = 'light',
  action,
  className,
  ...props
}: SectionHeadingProps) {
  const aligns = {
    left: 'text-left items-start',
    center: 'text-center items-center justify-center',
    right: 'text-right items-end',
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10',
        align === 'center' && 'md:flex-col md:items-center',
        className
      )}
      {...props}
    >
      <div className={cn('flex flex-col', aligns[align], 'max-w-3xl')}>
        {badge && (
          <span
            className={cn(
              'inline-flex items-center text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3',
              isDark
                ? 'bg-fresh-mint/15 text-fresh-mint border border-fresh-mint/30'
                : 'bg-bridge-green/10 text-bridge-green border border-bridge-green/20'
            )}
          >
            {badge}
          </span>
        )}
        <h2
          className={cn(
            'text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight',
            isDark ? 'text-warm-ivory' : 'text-forest-night'
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-3 text-base md:text-lg leading-relaxed',
              isDark ? 'text-warm-ivory/70' : 'text-muted-text'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 self-start md:self-end">{action}</div>}
    </div>
  );
}
