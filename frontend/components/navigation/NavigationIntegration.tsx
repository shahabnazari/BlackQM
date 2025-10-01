'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import all navigation components from Phase 8.5
import { PrimaryToolbar, type ResearchPhase } from './PrimaryToolbar';
import { SecondaryToolbar } from './SecondaryToolbar';
import { MobileNavigation } from './MobileNavigation';
import { TabletSidebar } from './TabletSidebar';
import { SwipeNavigation } from './SwipeNavigation';
import { PhaseProgressIndicator } from './PhaseProgressIndicator';
import { PhaseAvailability } from './PhaseAvailability';
import { ContextualHelp } from './ContextualHelp';
import { PhaseOnboarding } from './PhaseOnboarding';
import { NavigationPreferences } from './NavigationPreferences';
import { QuickActions } from './QuickActions';
import { PhaseSearch } from './PhaseSearch';
import { OnboardingTour, useOnboardingTour } from './OnboardingTour';
import { ResponsiveLayout } from './ResponsiveLayout';

// Import feature flags and migration helpers
import {
  useMultipleFlags,
  FEATURE_FLAGS,
} from '@/lib/feature-flags';
import {
  useNavigationMigration,
  useRouteMigration,
  getCurrentPhase,
} from '@/lib/navigation/migration-helpers';
// import { useNavigationState } from '@/lib/navigation/use-navigation-state'; // TODO: Use when needed
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from '@/hooks/use-media-query';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

interface NavigationIntegrationProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * NavigationIntegration - Master component that orchestrates all Phase 8.5 navigation features
 * This component intelligently switches between different navigation modes based on:
 * - Device type (mobile, tablet, desktop)
 * - Feature flags
 * - User preferences
 * - Migration status
 */
export function NavigationIntegration({
  children,
  className,
}: NavigationIntegrationProps) {
  // Feature flags
  const flags = useMultipleFlags([
    FEATURE_FLAGS.NEW_NAVIGATION_SYSTEM,
    FEATURE_FLAGS.SWIPE_NAVIGATION,
    FEATURE_FLAGS.MOBILE_BOTTOM_TABS,
    FEATURE_FLAGS.TABLET_SIDEBAR,
    FEATURE_FLAGS.COMMAND_PALETTE,
    FEATURE_FLAGS.PERFORMANCE_DASHBOARD,
  ]) as Record<string, boolean>;

  // Device detection
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Navigation state
  const pathname = usePathname();
  const router = useRouter();
  const currentPhase = getCurrentPhase(pathname);
  // const navState = useNavigationState(); // TODO: Use this when needed

  // Migration and onboarding
  useNavigationMigration();
  useRouteMigration();
  const { showTour, TourComponent } = useOnboardingTour();

  // Performance monitoring
  const { markMetric, measureAsync } = usePerformanceMonitor();

  // Local state
  const [searchOpen, setSearchOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  // const [mobileToolsOpen, setMobileToolsOpen] = useState(false); // TODO: Implement mobile tools panel
  const [secondaryToolbarVisible, setSecondaryToolbarVisible] = useState(true);

  // Track navigation performance
  useEffect(() => {
    markMetric('navigation_load', performance.now());
  }, [markMetric]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickActionsOpen(true);
      }

      // Search (Cmd/Ctrl + /)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Preferences (Cmd/Ctrl + ,)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setPreferencesOpen(true);
      }

      // Phase navigation (Cmd/Ctrl + 1-9, 0 for phase 10)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const phaseNumber = e.key === '0' ? 10 : parseInt(e.key);
        if (phaseNumber >= 1 && phaseNumber <= 10) {
          e.preventDefault();
          navigateToPhase(phaseNumber);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigate to phase by number
  const navigateToPhase = useCallback(
    async (phaseNumber: number) => {
      const phases = [
        '/discover',
        '/design',
        '/studies/create',
        '/recruitment',
        '/collect',
        '/analysis/hub',
        '/visualize',
        '/interpret',
        '/report',
        '/archive',
      ];

      const path = phases[phaseNumber - 1];
      if (path) {
        await measureAsync('phase_navigation', async () => {
          router.push(path);
        });
      }
    },
    [router, measureAsync]
  );

  // If new navigation is disabled, render children directly
  if (!flags[FEATURE_FLAGS.NEW_NAVIGATION_SYSTEM]) {
    return <>{children}</>;
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Desktop Navigation */}
      {isDesktop && (
        <>
          {/* Fixed primary toolbar at top */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
            <PrimaryToolbar />
          </div>

          {/* Secondary toolbar below primary */}
          {secondaryToolbarVisible && currentPhase && (
            <div className="fixed top-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b">
              <SecondaryToolbar
                phase={currentPhase as any}
                onClose={() => setSecondaryToolbarVisible(false)}
              />
            </div>
          )}

          {/* Progress indicator */}
          <div className="fixed top-0 left-0 right-0 z-50">
            <PhaseProgressIndicator />
          </div>

          {/* Main content with padding */}
          <main
            className={cn(
              'transition-all duration-300',
              secondaryToolbarVisible && currentPhase
                ? 'pt-32' // Both toolbars
                : 'pt-16', // Only primary toolbar
              'px-4 pb-8 max-w-7xl mx-auto'
            )}
          >
            {children}
          </main>
        </>
      )}

      {/* Tablet Navigation */}
      {isTablet && flags[FEATURE_FLAGS.TABLET_SIDEBAR] && (
        <>
          <TabletSidebar />
          <main className="min-h-screen">
            <div className="p-4">{children}</div>
          </main>
        </>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <>
          {/* Mobile header */}
          <header className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">VQMethod</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => {/* TODO: setMobileToolsOpen(true) */}}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Tools"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Swipeable content if enabled */}
          {flags[FEATURE_FLAGS.SWIPE_NAVIGATION] ? (
            <SwipeNavigation enabled className="min-h-screen pt-16 pb-20">
              <main className="p-4">{children}</main>
            </SwipeNavigation>
          ) : (
            <main className="min-h-screen pt-16 pb-20 p-4">{children}</main>
          )}

          {/* Mobile bottom navigation */}
          {flags[FEATURE_FLAGS.MOBILE_BOTTOM_TABS] && <MobileNavigation />}
        </>
      )}

      {/* Fallback for SSR */}
      {typeof window === 'undefined' && <main className="p-4">{children}</main>}

      {/* Global Components (all devices) */}
      <AnimatePresence>
        {/* Command Palette */}
        {flags[FEATURE_FLAGS.COMMAND_PALETTE] && quickActionsOpen && (
          <QuickActions />
        )}

        {/* Search Modal */}
        {searchOpen && (
          <PhaseSearch />
        )}

        {/* Preferences Modal */}
        {preferencesOpen && (
          <NavigationPreferences
            isOpen={preferencesOpen}
            onClose={() => setPreferencesOpen(false)}
          />
        )}

        {/* Contextual Help */}
        <ContextualHelp currentPhase={(currentPhase || 'discover') as ResearchPhase} />

        {/* Phase Availability Checker */}
        <PhaseAvailability
          studyId="default"
          currentPhase={(currentPhase || 'discover') as ResearchPhase}
          onPhaseSelect={() => {}}
        />

        {/* Onboarding Components */}
        {showTour && <TourComponent />}
        <PhaseOnboarding
          phase={(currentPhase || 'discover') as ResearchPhase}
          studyId="default"
          userId="default"
        />
      </AnimatePresence>

      {/* Performance monitoring overlay (dev only) */}
      {process.env.NODE_ENV === 'development' &&
        flags[FEATURE_FLAGS.REAL_TIME_METRICS] && (
          <div className="fixed bottom-4 left-4 z-50 bg-background/90 backdrop-blur-sm border rounded-lg p-2 text-xs">
            <div className="font-mono space-y-1">
              <div>Phase: {currentPhase || 'unknown'}</div>
              <div>
                Device: {isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
              </div>
              <div>
                Features: {Object.values(flags).filter(Boolean).length}/6
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// Export hooks for external use
export { useNavigationState } from '@/lib/navigation/use-navigation-state';
export {
  useFeatureFlag,
  useMultipleFlags as useFeatureFlags,
} from '@/lib/feature-flags';
export {
  getCurrentPhase,
  getNextPhase,
} from '@/lib/navigation/migration-helpers';

// Export all navigation components for individual use
export {
  PrimaryToolbar,
  SecondaryToolbar,
  MobileNavigation,
  TabletSidebar,
  SwipeNavigation,
  PhaseProgressIndicator,
  PhaseAvailability,
  ContextualHelp,
  PhaseOnboarding,
  NavigationPreferences,
  QuickActions,
  PhaseSearch,
  OnboardingTour,
  ResponsiveLayout,
};
