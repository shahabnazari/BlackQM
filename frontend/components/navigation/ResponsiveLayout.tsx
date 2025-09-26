'use client';

import React, { useState, useEffect } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { TabletSidebar } from './TabletSidebar';
import { SwipeNavigation } from './SwipeNavigation';
import { MobileSecondaryToolbar } from './MobileSecondaryToolbar';
import { PrimaryToolbar } from './PrimaryToolbar';
import { SecondaryToolbar } from './SecondaryToolbar';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Menu } from 'lucide-react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveLayout({
  children,
  className,
}: ResponsiveLayoutProps) {
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [currentPhase] = useState<any>('discover'); // TODO: Get from context
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Detect iOS for safe area handling
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
  }, []);

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Desktop Layout */}
      {isDesktop && (
        <>
          {/* Primary toolbar at top */}
          <div className="fixed top-0 left-0 right-0 z-30">
            <PrimaryToolbar />
          </div>

          {/* Secondary toolbar below primary */}
          <div className="fixed top-16 left-0 right-0 z-20">
            <SecondaryToolbar phase={currentPhase} onClose={() => {}} />
          </div>

          {/* Main content with padding for toolbars */}
          <main className="pt-32 px-4 pb-8 max-w-7xl mx-auto">{children}</main>
        </>
      )}

      {/* Tablet Layout */}
      {isTablet && (
        <>
          <TabletSidebar />

          {/* Main content with sidebar offset */}
          <main className="min-h-screen">
            <div className="p-4">{children}</div>
          </main>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <>
          {/* Mobile header */}
          <header
            className={cn(
              'fixed top-0 left-0 right-0 z-30',
              'bg-background/95 backdrop-blur-sm',
              'border-b border-border',
              'px-4 py-3',
              isIOS && 'pt-safe-area-top'
            )}
          >
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">VQMethod</h1>
              <button
                onClick={() => setMobileToolsOpen(true)}
                className={cn(
                  'p-2 rounded-lg',
                  'bg-accent hover:bg-accent/80',
                  'transition-colors',
                  'touch-manipulation'
                )}
                aria-label="Open tools"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Swipeable main content */}
          <SwipeNavigation
            enabled
            className={cn(
              'min-h-screen',
              'pt-16', // Header height
              'pb-20', // Bottom nav height
              isIOS && 'pt-safe-area-top pb-safe-area-bottom'
            )}
          >
            <main className="p-4">{children}</main>
          </SwipeNavigation>

          {/* Mobile bottom navigation */}
          <MobileNavigation />

          {/* Mobile secondary toolbar modal */}
          <MobileSecondaryToolbar
            isOpen={mobileToolsOpen}
            onClose={() => setMobileToolsOpen(false)}
          />
        </>
      )}

      {/* Fallback for SSR */}
      {!isMobile && !isTablet && !isDesktop && (
        <main className="p-4">{children}</main>
      )}
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveGrid({ children, className }: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-1', // Mobile: 1 column
        'sm:grid-cols-2', // Tablet: 2 columns
        'lg:grid-cols-3', // Desktop: 3 columns
        'xl:grid-cols-4', // Large desktop: 4 columns
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive container with max-width constraints
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveContainer({
  children,
  className,
  size = 'lg',
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small';
}

export function ResponsiveText({
  children,
  className,
  variant = 'body',
}: ResponsiveTextProps) {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
    h3: 'text-lg sm:text-xl lg:text-2xl font-medium',
    body: 'text-base sm:text-lg',
    small: 'text-sm sm:text-base',
  };

  return (
    <div className={cn(variantClasses[variant], className)}>{children}</div>
  );
}

// Export all responsive components
export * from './MobileNavigation';
export * from './TabletSidebar';
export * from './SwipeNavigation';
export * from './MobileSecondaryToolbar';
export * from './TouchOptimized';
