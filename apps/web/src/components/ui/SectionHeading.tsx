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
              'inline-flex items-center text-[9px] font-medium uppercase tracking-[0.05em] px-2.5 py-0.5 rounded-full mb-3',
              isDark
                ? 'bg-neon-pulse/15 text-neon-pulse border border-neon-pulse/30'
                : 'bg-obsidian-shell/10 text-obsidian-shell border border-obsidian-shell/20'
            )}
          >
            {badge}
          </span>
        )}
        <h2
          className={cn(
            'text-3xl md:text-4xl lg:text-5xl font-display font-medium tracking-tight',
            isDark ? 'text-pure-white' : 'text-obsidian-shell'
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-3 text-base md:text-lg leading-relaxed',
              isDark ? 'text-slate-text' : 'text-slate-text'
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
