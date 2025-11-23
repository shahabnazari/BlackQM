/**
 * Mobile Optimization Wrapper
 * Phase 10.8 Day 1: Enterprise-grade mobile responsiveness
 * 
 * Features:
 * - Responsive container with optimal padding for all devices
 * - Touch-friendly spacing and sizing
 * - Viewport-aware layout adjustments
 * - Performance-optimized rendering
 * 
 * Breakpoints:
 * - xs: < 375px (iPhone SE, small phones)
 * - sm: 375px - 640px (phones)
 * - md: 640px - 768px (large phones, small tablets)
 * - lg: 768px - 1024px (tablets)
 * - xl: 1024px+ (desktops)
 */

'use client';

import React, { useEffect, useState } from 'react';

interface MobileOptimizationWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOptimizationWrapper({
  children,
  className = '',
}: MobileOptimizationWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <div
      className={`
        w-full
        ${isMobile ? 'mobile-optimized' : ''}
        ${isTablet ? 'tablet-optimized' : ''}
        ${className}
      `}
      style={{
        // Prevent horizontal scroll on mobile
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized Card wrapper
 * Adds touch-friendly padding and spacing
 */
export function MobileCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-lg border bg-card text-card-foreground shadow-sm
        p-3 sm:p-4 md:p-6
        mb-3 sm:mb-4 md:mb-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized Button wrapper
 * Ensures minimum touch target size (44x44px)
 */
export function MobileButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-md font-medium
        transition-colors
        focus-visible:outline-none focus-visible:ring-2
        disabled:pointer-events-none disabled:opacity-50
        min-h-[44px] min-w-[44px]
        px-4 py-2
        text-sm sm:text-base
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Mobile-optimized Grid
 * Responsive columns that adapt to viewport
 */
export function MobileGrid({
  children,
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 3 },
  gap = 4,
  className = '',
}: {
  children: React.ReactNode;
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
}) {
  const gridClass = `
    grid
    grid-cols-${cols.xs || 1}
    sm:grid-cols-${cols.sm || 2}
    md:grid-cols-${cols.md || 2}
    lg:grid-cols-${cols.lg || 3}
    xl:grid-cols-${cols.xl || 3}
    gap-${gap}
    ${className}
  `;

  return <div className={gridClass}>{children}</div>;
}

/**
 * Mobile-optimized Stack
 * Vertical layout with responsive spacing
 */
export function MobileStack({
  children,
  spacing = 4,
  className = '',
}: {
  children: React.ReactNode;
  spacing?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col space-y-${spacing} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Mobile-optimized Text
 * Responsive font sizes and line heights
 */
export function MobileText({
  children,
  variant = 'body',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';
  className?: string;
}) {
  const variants = {
    h1: 'text-2xl sm:text-3xl md:text-4xl font-bold leading-tight',
    h2: 'text-xl sm:text-2xl md:text-3xl font-semibold leading-snug',
    h3: 'text-lg sm:text-xl md:text-2xl font-semibold leading-snug',
    h4: 'text-base sm:text-lg md:text-xl font-medium leading-normal',
    body: 'text-sm sm:text-base leading-relaxed',
    caption: 'text-xs sm:text-sm text-muted-foreground leading-normal',
  };

  return <div className={`${variants[variant]} ${className}`}>{children}</div>;
}



