import React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'full';
  withBloom?: boolean;
}

export function PageContainer({
  size = 'lg',
  withBloom = false,
  className,
  children,
  ...props
}: PageContainerProps) {
  // Sauce Labs specifies 1200px page max-width
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-[1200px]',
    full: 'max-w-full',
  };

  return (
    <div className="relative w-full overflow-hidden bg-obsidian-shell text-pure-white">
      {withBloom && (
        <>
          {/* Subtle neon green pulse bloom in dark void */}
          <div className="pointer-events-none absolute -top-40 right-10 w-[450px] h-[450px] bg-gradient-to-b from-neon-pulse/10 to-transparent rounded-full blur-[120px] opacity-60 -z-10" />
          <div className="pointer-events-none absolute top-1/2 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-mint-whisper/5 to-transparent rounded-full blur-[140px] opacity-40 -z-10" />
        </>
      )}
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16',
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
