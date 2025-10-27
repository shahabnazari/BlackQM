import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

// Old to new route mappings
const ROUTE_MIGRATIONS: Record<string, string> = {
  // Old routes -> New lifecycle-based routes
  '/analysis': '/analysis/hub',
  '/analytics': '/analysis/metrics',
  '/ai-tools': '/discover/literature', // AI tools redistributed across phases
  '/visualization-demo': '/visualize',
  '/participants': '/recruitment',
  '/study/new': '/studies/create',
  '/study/edit': '/studies/create',

  // Consolidation of duplicate features
  '/export': '/report/export',
  '/results': '/analysis/hub',
  '/data': '/collect',
  '/survey': '/collect/survey',
  '/q-sort': '/collect/qsort',
};

// Phase-based route groupings
const PHASE_ROUTES = {
  discover: [
    '/discover',
    '/literature',
    '/references',
    '/knowledge-map',
    '/gaps',
  ],
  design: ['/design', '/questions', '/hypothesis', '/methodology'],
  build: ['/studies/create', '/statements', '/stimuli', '/questionnaire'],
  recruit: ['/recruitment', '/participants', '/scheduling', '/invitations'],
  collect: ['/collect', '/study/', '/qsort', '/survey'],
  analyze: ['/analysis', '/hub', '/factor', '/correlation', '/cluster'],
  visualize: ['/visualize', '/charts', '/graphs', '/heatmaps'],
  interpret: ['/interpret', '/insights', '/ai-interpretation', '/narratives'],
  report: ['/report', '/export', '/publish', '/manuscript'],
  archive: ['/archive', '/versions', '/doi', '/repository'],
};

// Navigation preferences migration
interface OldNavigationPrefs {
  sidebarCollapsed?: boolean;
  favoriteRoutes?: string[];
  recentRoutes?: string[];
  theme?: 'light' | 'dark';
}

interface NewNavigationPrefs {
  primaryToolbarMode: 'phases' | 'compact' | 'hidden';
  secondaryToolbarVisible: boolean;
  mobileBottomTabs: boolean;
  tabletSidebarCollapsed: boolean;
  swipeNavigationEnabled: boolean;
  commandPaletteEnabled: boolean;
  favoritePhases: string[];
  recentPhases: string[];
  phaseColors: boolean;
  tooltipsEnabled: boolean;
  onboardingCompleted: boolean;
}

// Migrate user preferences from old navigation to new
export function migrateNavigationPreferences(): NewNavigationPrefs {
  const oldPrefsRaw = localStorage.getItem('navigation-preferences');
  const oldPrefs: OldNavigationPrefs = oldPrefsRaw
    ? JSON.parse(oldPrefsRaw)
    : {};

  // Map old preferences to new structure
  const newPrefs: NewNavigationPrefs = {
    primaryToolbarMode: 'phases',
    secondaryToolbarVisible: true,
    mobileBottomTabs: true,
    tabletSidebarCollapsed: oldPrefs.sidebarCollapsed ?? false,
    swipeNavigationEnabled: true,
    commandPaletteEnabled: true,
    favoritePhases: mapRoutesToPhases(oldPrefs.favoriteRoutes || []),
    recentPhases: mapRoutesToPhases(oldPrefs.recentRoutes || []),
    phaseColors: true,
    tooltipsEnabled: true,
    onboardingCompleted: false, // Force onboarding for new navigation
  };

  // Save new preferences
  localStorage.setItem('new-navigation-preferences', JSON.stringify(newPrefs));

  // Mark migration as complete
  localStorage.setItem('navigation-migrated', 'true');

  return newPrefs;
}

// Map old routes to research phases
function mapRoutesToPhases(routes: string[]): string[] {
  const phases = new Set<string>();

  routes.forEach(route => {
    // Check each phase's routes
    Object.entries(PHASE_ROUTES).forEach(([phase, phaseRoutes]) => {
      if (phaseRoutes.some(pr => route.includes(pr))) {
        phases.add(phase);
      }
    });
  });

  return Array.from(phases);
}

// Hook to handle route migration
export function useRouteMigration() {
  const router = useRouter();
  const pathname = usePathname();
  const isNewNavEnabled = useFeatureFlag(FEATURE_FLAGS.NEW_NAVIGATION_SYSTEM);

  useEffect(() => {
    if (!isNewNavEnabled) return;

    // Check if current route needs migration
    const migrationTarget = ROUTE_MIGRATIONS[pathname];
    if (migrationTarget) {
      console.log(`Migrating route: ${pathname} -> ${migrationTarget}`);
      router.replace(migrationTarget);
    }
  }, [pathname, router, isNewNavEnabled]);
}

// Hook to migrate user data on first load
export function useNavigationMigration() {
  const isNewNavEnabled = useFeatureFlag(FEATURE_FLAGS.NEW_NAVIGATION_SYSTEM);

  useEffect(() => {
    if (!isNewNavEnabled) return;

    const migrated = localStorage.getItem('navigation-migrated');
    if (!migrated) {
      console.log('Migrating navigation preferences...');
      const newPrefs = migrateNavigationPreferences();
      console.log('Migration complete:', newPrefs);

      // Trigger onboarding if not completed
      if (!newPrefs.onboardingCompleted) {
        window.dispatchEvent(new CustomEvent('start-navigation-onboarding'));
      }
    }
  }, [isNewNavEnabled]);
}

// Utility to get the current research phase from pathname
export function getCurrentPhase(pathname: string): string | null {
  for (const [phase, routes] of Object.entries(PHASE_ROUTES)) {
    if (routes.some(route => pathname.includes(route))) {
      return phase;
    }
  }
  return null;
}

// Utility to get recommended next phase
export function getNextPhase(currentPhase: string): string | null {
  const phaseOrder = [
    'discover',
    'design',
    'build',
    'recruit',
    'collect',
    'analyze',
    'visualize',
    'interpret',
    'report',
    'archive',
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return null;
  }

  return phaseOrder[currentIndex + 1] || null;
}

// Breadcrumb generator for new navigation
export interface Breadcrumb {
  label: string;
  href: string;
  isPhase?: boolean;
}

export function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [{ label: 'Home', href: '/dashboard' }];

  // Get current phase
  const phase = getCurrentPhase(pathname);
  if (phase) {
    breadcrumbs.push({
      label: phase.charAt(0).toUpperCase() + phase.slice(1),
      href: `/${phase}`,
      isPhase: true,
    });
  }

  // Parse additional path segments
  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip if this is the phase segment
    if (index === 0 && phase && segment === phase) {
      return;
    }

    // Format segment label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Don't duplicate if it's already in breadcrumbs
    if (!breadcrumbs.some(bc => bc.href === currentPath)) {
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }
  });

  return breadcrumbs;
}

// Migration status checker
export interface MigrationStatus {
  isComplete: boolean;
  oldRoutesFound: string[];
  newRoutesAvailable: string[];
  preferencesMigrated: boolean;
  onboardingNeeded: boolean;
}

export function checkMigrationStatus(): MigrationStatus {
  const migrated = localStorage.getItem('navigation-migrated') === 'true';
  // const oldPrefs = localStorage.getItem('navigation-preferences'); // Not used yet
  const newPrefs = localStorage.getItem('new-navigation-preferences');

  // Check for old routes in history
  const recentRoutes = JSON.parse(
    localStorage.getItem('recent-routes') || '[]'
  );
  const oldRoutesFound = recentRoutes.filter(
    (route: string) => route in ROUTE_MIGRATIONS
  );
  const newRoutesAvailable = oldRoutesFound.map(
    (route: string) => ROUTE_MIGRATIONS[route]
  );

  return {
    isComplete: migrated,
    oldRoutesFound,
    newRoutesAvailable,
    preferencesMigrated: !!newPrefs,
    onboardingNeeded:
      !migrated || !JSON.parse(newPrefs || '{}').onboardingCompleted,
  };
}

// Hook for showing migration notifications
export function useMigrationNotifications() {
  const status = checkMigrationStatus();

  const showNotification = useCallback(() => {
    if (!status.isComplete && status.oldRoutesFound.length > 0) {
      // In production, use your notification system
      console.log('Navigation Update Available', {
        message: `We've improved navigation! ${status.oldRoutesFound.length} of your frequently used pages have been moved to better locations.`,
        action: 'View Changes',
        onAction: () => {
          window.dispatchEvent(new CustomEvent('show-migration-guide'));
        },
      });
    }
  }, [status]);

  useEffect(() => {
    // Show notification after a short delay
    const timer = setTimeout(showNotification, 2000);
    return () => clearTimeout(timer);
  }, [showNotification]);
}

// Export all migration utilities
export const NavigationMigration = {
  migratePreferences: migrateNavigationPreferences,
  checkStatus: checkMigrationStatus,
  getCurrentPhase,
  getNextPhase,
  generateBreadcrumbs,
  ROUTE_MIGRATIONS,
  PHASE_ROUTES,
};
