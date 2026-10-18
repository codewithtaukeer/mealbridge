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
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    full: 'max-w-[1500px]',
  };

  return (
    <div className="relative w-full overflow-hidden">
      {withBloom && (
        <>
          {/* Subtle nature green bloom top-right */}
          <div className="pointer-events-none absolute -top-40 right-0 w-[500px] h-[500px] bg-gradient-to-b from-fresh-mint/15 to-transparent rounded-full blur-[100px] opacity-70 -z-10" />
          {/* Soft forest glow bottom-left */}
          <div className="pointer-events-none absolute top-1/2 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-bridge-green/10 to-transparent rounded-full blur-[120px] opacity-50 -z-10" />
        </>
      )}
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
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
