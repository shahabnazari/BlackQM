/**
 * Phase Route Mapper Component - Phase 8.5 Day 3
 * World-class implementation for unified phase-based routing
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getDestinationRoute,
  needsConsolidation,
  trackNavigation,
  getRoutePhase,
} from '@/lib/navigation/route-consolidation';
import { useNavigationState } from '@/hooks/useNavigationState';

/**
 * Component that handles automatic route consolidation
 * Ensures users are always on the correct phase-based routes
 */
export function PhaseRouteMapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentPhase } = useNavigationState();

  useEffect(() => {
    // Check if current route needs consolidation
    if (needsConsolidation(pathname)) {
      const destination = getDestinationRoute(pathname);
      if (destination && destination !== pathname) {
        // Perform client-side redirect
        router.replace(destination);

        // Track navigation
        const phase = getRoutePhase(destination);
        trackNavigation(pathname, destination, phase);

        // Update navigation state
        if (phase) {
          setCurrentPhase(phase);
        }

        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[PhaseRouteMapper] Redirecting: ${pathname} → ${destination}`
          );
        }
      }
    } else {
      // Update current phase based on route
      const phase = getRoutePhase(pathname);
      if (phase) {
        setCurrentPhase(phase);
      }
    }
  }, [pathname, router, setCurrentPhase]);

  return <>{children}</>;
}

/**
 * Hook to get the current research phase from the route
 */
export function useCurrentPhase() {
  const pathname = usePathname();
  return getRoutePhase(pathname);
}

/**
 * Hook to check if a phase is accessible based on study progress
 */
export function usePhaseAccess(_studyId?: string) {
  const { phaseProgress, completedPhases } = useNavigationState();

  const checkPhaseAccess = (phase: string): boolean => {
    // Convert completed phases array to object
    const progress: Record<string, boolean> = {};
    completedPhases.forEach(p => {
      progress[p] = true;
    });

    // Check dependencies
    const dependencies: Record<string, string[]> = {
      design: ['discover'],
      build: ['design'],
      recruit: ['build'],
      collect: ['recruit'],
      analyze: ['collect'],
      visualize: ['analyze'],
      interpret: ['visualize'],
      report: ['interpret'],
      archive: ['report'],
    };

    const phaseDeps = dependencies[phase] || [];
    return phaseDeps.every(dep => progress[dep] === true);
  };

  return { checkPhaseAccess, phaseProgress };
}
