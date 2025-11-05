/**
 * Route Consolidation System - Phase 8.5 Day 3
 * World-class implementation for unifying navigation structure
 */

/**
 * Route consolidation mapping following Research Lifecycle phases
 */
export interface RouteMapping {
  source: string;
  destination: string;
  permanent: boolean;
  phase: ResearchPhase;
  description: string;
}

export type ResearchPhase =
  | 'discover'
  | 'design'
  | 'build'
  | 'recruit'
  | 'collect'
  | 'analyze'
  | 'visualize'
  | 'interpret'
  | 'report'
  | 'archive';

/**
 * Phase-based route organization
 * Maps old routes to new lifecycle-based structure
 */
export const ROUTE_CONSOLIDATION_MAP: RouteMapping[] = [
  // ANALYZE Phase Consolidations
  {
    source: '/analysis',
    destination: '/analyze/hub',
    permanent: true,
    phase: 'analyze',
    description: 'Primary analysis entry redirects to hub',
  },
  {
    source: '/analytics',
    destination: '/analyze/metrics',
    permanent: true,
    phase: 'analyze',
    description: 'Rename analytics to metrics under analyze phase',
  },
  {
    source: '/analysis/q-methodology',
    destination: '/analyze/q-methodology',
    permanent: true,
    phase: 'analyze',
    description: 'Q-methodology moves under analyze phase',
  },

  // VISUALIZE Phase Consolidations
  {
    source: '/visualization-demo',
    destination: '/visualize',
    permanent: true,
    phase: 'visualize',
    description: 'Demo visualization becomes main visualize route',
  },
  {
    source: '/visualization-demo/q-methodology',
    destination: '/visualize/q-methodology',
    permanent: true,
    phase: 'visualize',
    description: 'Q-methodology visualization under visualize phase',
  },

  // AI Tools Distribution
  {
    source: '/ai-tools',
    destination: '/build/ai-assistant',
    permanent: false,
    phase: 'build',
    description: 'AI tools distributed - statement generator to BUILD phase',
  },

  // RECRUIT Phase Consolidations
  {
    source: '/participants',
    destination: '/recruit/participants',
    permanent: true,
    phase: 'recruit',
    description: 'Participants management under recruit phase',
  },
  {
    source: '/recruitment',
    destination: '/recruit',
    permanent: true,
    phase: 'recruit',
    description: 'Recruitment center becomes main recruit phase',
  },

  // INTERPRET Phase
  {
    source: '/interpretation/:studyId',
    destination: '/interpret/:studyId',
    permanent: true,
    phase: 'interpret',
    description: 'Interpretation under interpret phase',
  },

  // BUILD Phase
  // PHASE 10 DAY 5.17.5: DISABLED - /studies/create exists and is actively used
  // Q-statements from literature themes navigate here
  // {
  //   source: '/studies/create',
  //   destination: '/build/study',
  //   permanent: false,
  //   phase: 'build',
  //   description: 'Study creation under build phase',
  // },
  {
    source: '/questionnaire/builder-pro',
    destination: '/build/questionnaire',
    permanent: true,
    phase: 'build',
    description: 'Questionnaire builder under build phase',
  },

  // COLLECT Phase (Participant Routes)
  {
    source: '/join',
    destination: '/collect/join',
    permanent: false,
    phase: 'collect',
    description: 'Join study under collect phase',
  },
  {
    source: '/study/:token',
    destination: '/collect/study/:token',
    permanent: false,
    phase: 'collect',
    description: 'Study participation under collect phase',
  },
  {
    source: '/study/pre-screening',
    destination: '/collect/pre-screening',
    permanent: false,
    phase: 'collect',
    description: 'Pre-screening under collect phase',
  },
  {
    source: '/study/post-survey',
    destination: '/collect/post-survey',
    permanent: false,
    phase: 'collect',
    description: 'Post-survey under collect phase',
  },
];

/**
 * Get destination route for a given source
 */
export function getDestinationRoute(source: string): string | null {
  // Handle dynamic routes with parameters
  for (const mapping of ROUTE_CONSOLIDATION_MAP) {
    const sourcePattern = mapping.source.replace(/:\w+/g, '([^/]+)');
    const regex = new RegExp(`^${sourcePattern}$`);
    const match = source.match(regex);

    if (match) {
      let destination = mapping.destination;
      // Replace parameters in destination
      const params = mapping.source.match(/:(\w+)/g);
      if (params && match.length > 1) {
        params.forEach((param, index) => {
          const replacement = match[index + 1];
          if (replacement) {
            destination = destination.replace(param, replacement);
          }
        });
      }
      return destination;
    }
  }

  return null;
}

/**
 * Check if a route needs consolidation
 */
export function needsConsolidation(pathname: string): boolean {
  return ROUTE_CONSOLIDATION_MAP.some(mapping => {
    const sourcePattern = mapping.source.replace(/:\w+/g, '([^/]+)');
    const regex = new RegExp(`^${sourcePattern}$`);
    return regex.test(pathname);
  });
}

/**
 * Get the research phase for a given route
 */
export function getRoutePhase(pathname: string): ResearchPhase | null {
  // First check if it's a source route that needs consolidation
  const mapping = ROUTE_CONSOLIDATION_MAP.find(m => {
    const sourcePattern = m.source.replace(/:\w+/g, '([^/]+)');
    const regex = new RegExp(`^${sourcePattern}$`);
    return regex.test(pathname);
  });

  if (mapping) return mapping.phase;

  // Then check if it's already a phase-based route
  const phaseMatch = pathname.match(/^\/(\w+)/);
  if (phaseMatch && phaseMatch[1]) {
    const phase = phaseMatch[1].toLowerCase() as ResearchPhase;
    const validPhases: ResearchPhase[] = [
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
    if (validPhases.includes(phase)) {
      return phase;
    }
  }

  return null;
}

/**
 * Generate breadcrumbs for phase-based navigation
 */
export function generatePhaseBreadcrumbs(
  pathname: string
): Array<{ label: string; href: string }> {
  const phase = getRoutePhase(pathname);
  const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];

  if (phase) {
    // Add phase breadcrumb
    breadcrumbs.push({
      label: phase.charAt(0).toUpperCase() + phase.slice(1),
      href: `/${phase}`,
    });

    // Add sub-route breadcrumb if exists
    const subRoute = pathname
      .replace(`/${phase}`, '')
      .split('/')
      .filter(Boolean);
    const firstSubRoute = subRoute[0];
    if (
      subRoute.length > 0 &&
      firstSubRoute &&
      !firstSubRoute.match(/^[a-f0-9-]+$/i)
    ) {
      breadcrumbs.push({
        label: firstSubRoute
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        href: pathname,
      });
    }
  }

  return breadcrumbs;
}

/**
 * Validate route access based on study progress
 */
export function validatePhaseAccess(
  phase: ResearchPhase,
  studyProgress: Partial<Record<ResearchPhase, boolean>> = {}
): boolean {
  // Define phase dependencies
  const phaseDependencies: Partial<Record<ResearchPhase, ResearchPhase[]>> = {
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

  // Check if all dependencies are met
  const dependencies = phaseDependencies[phase] || [];
  return dependencies.every(
    dep => studyProgress && studyProgress[dep] === true
  );
}

/**
 * Get available secondary toolbar items for a phase
 */
export function getPhaseSecondaryItems(phase: ResearchPhase): Array<{
  label: string;
  href: string;
  icon: string;
  description: string;
}> {
  const secondaryItems: Record<
    ResearchPhase,
    Array<{ label: string; href: string; icon: string; description: string }>
  > = {
    discover: [
      {
        label: 'Literature Search',
        href: '/discover/literature',
        icon: 'search',
        description: 'AI-powered paper search',
      },
      {
        label: 'Reference Manager',
        href: '/discover/references',
        icon: 'bookmark',
        description: 'Import/organize citations',
      },
      {
        label: 'Knowledge Map',
        href: '/discover/knowledge-map',
        icon: 'map',
        description: 'Visual concept mapping',
      },
      {
        label: 'Research Gaps',
        href: '/discover/gaps',
        icon: 'lightbulb',
        description: 'AI gap analysis tool',
      },
    ],
    design: [
      {
        label: 'Research Questions',
        href: '/design/questions',
        icon: 'help-circle',
        description: 'Question formulation wizard',
      },
      {
        label: 'Hypothesis Builder',
        href: '/design/hypothesis',
        icon: 'beaker',
        description: 'Interactive hypothesis tool',
      },
      {
        label: 'Methodology',
        href: '/design/methodology',
        icon: 'clipboard',
        description: 'Method selection guide',
      },
      {
        label: 'Study Protocol',
        href: '/design/protocol',
        icon: 'file-text',
        description: 'Protocol designer',
      },
    ],
    build: [
      {
        label: 'Study Setup',
        href: '/build/study',
        icon: 'settings',
        description: 'Basic study configuration',
      },
      {
        label: 'Q-Grid Designer',
        href: '/build/grid',
        icon: 'grid',
        description: 'Grid configuration tool',
      },
      {
        label: 'AI Assistant',
        href: '/build/ai-assistant',
        icon: 'sparkles',
        description: 'AI-powered stimuli creation',
      },
      {
        label: 'Questionnaire',
        href: '/build/questionnaire',
        icon: 'list',
        description: 'Advanced questionnaire builder',
      },
    ],
    recruit: [
      {
        label: 'Participant Pool',
        href: '/recruit/participants',
        icon: 'users',
        description: 'Manage participants',
      },
      {
        label: 'Invitations',
        href: '/recruit/invitations',
        icon: 'send',
        description: 'Send study invites',
      },
      {
        label: 'Pre-Screening',
        href: '/recruit/screening',
        icon: 'filter',
        description: 'Qualification screening',
      },
      {
        label: 'Scheduling',
        href: '/recruit/scheduling',
        icon: 'calendar',
        description: 'Session scheduling',
      },
    ],
    collect: [
      {
        label: 'Active Sessions',
        href: '/collect/sessions',
        icon: 'activity',
        description: 'Live data monitor',
      },
      {
        label: 'Q-Sort Interface',
        href: '/collect/qsort',
        icon: 'layers',
        description: 'Participant sorting',
      },
      {
        label: 'Post-Survey',
        href: '/collect/post-survey',
        icon: 'clipboard-check',
        description: 'Supplementary data',
      },
      {
        label: 'Progress Tracker',
        href: '/collect/progress',
        icon: 'trending-up',
        description: 'Completion statistics',
      },
    ],
    analyze: [
      {
        label: 'Analysis Hub',
        href: '/analyze/hub',
        icon: 'hub',
        description: 'Unified analysis center',
      },
      {
        label: 'Q-Analysis',
        href: '/analyze/q-methodology',
        icon: 'bar-chart',
        description: 'Factor analysis suite',
      },
      {
        label: 'Statistical Tests',
        href: '/analyze/statistics',
        icon: 'calculator',
        description: 'Significance testing',
      },
      {
        label: 'Metrics',
        href: '/analyze/metrics',
        icon: 'pie-chart',
        description: 'Performance metrics',
      },
    ],
    visualize: [
      {
        label: 'Dashboard',
        href: '/visualize/dashboard',
        icon: 'layout',
        description: 'Visual overview',
      },
      {
        label: 'Factor Plots',
        href: '/visualize/factors',
        icon: 'scatter-chart',
        description: 'Factor visualizations',
      },
      {
        label: 'Heatmaps',
        href: '/visualize/heatmaps',
        icon: 'grid',
        description: 'Correlation matrices',
      },
      {
        label: 'Interactive',
        href: '/visualize/interactive',
        icon: '3d-cube',
        description: '3D explorations',
      },
    ],
    interpret: [
      {
        label: 'Factor Narratives',
        href: '/interpret/narratives',
        icon: 'message-square',
        description: 'Factor stories',
      },
      {
        label: 'Themes',
        href: '/interpret/themes',
        icon: 'tag',
        description: 'Thematic analysis',
      },
      {
        label: 'Insights',
        href: '/interpret/insights',
        icon: 'zap',
        description: 'Key findings',
      },
      {
        label: 'AI Analysis',
        href: '/interpret/ai',
        icon: 'cpu',
        description: 'AI interpretations',
      },
    ],
    report: [
      {
        label: 'Report Builder',
        href: '/report/builder',
        icon: 'file-plus',
        description: 'Create reports',
      },
      {
        label: 'Templates',
        href: '/report/templates',
        icon: 'layout-template',
        description: 'Report templates',
      },
      {
        label: 'Export',
        href: '/report/export',
        icon: 'download',
        description: 'Export options',
      },
      {
        label: 'Publishing',
        href: '/report/publish',
        icon: 'upload-cloud',
        description: 'Publish reports',
      },
    ],
    archive: [
      {
        label: 'Study Archive',
        href: '/archive/studies',
        icon: 'archive',
        description: 'Completed studies',
      },
      {
        label: 'Data Export',
        href: '/archive/export',
        icon: 'hard-drive',
        description: 'Export datasets',
      },
      {
        label: 'Citations',
        href: '/archive/citations',
        icon: 'quote',
        description: 'Citation formats',
      },
      {
        label: 'DOI Registry',
        href: '/archive/doi',
        icon: 'link',
        description: 'Register DOIs',
      },
    ],
  };

  return secondaryItems[phase] || [];
}

/**
 * Track navigation analytics
 */
export function trackNavigation(
  from: string,
  to: string,
  phase: ResearchPhase | null,
  userId?: string
): void {
  // Implementation for analytics tracking
  if (typeof window !== 'undefined' && window.gtag) {
    (window as any).gtag('event', 'navigation', {
      event_category: 'route_consolidation',
      event_label: phase || 'unknown',
      from_path: from,
      to_path: to,
      user_id: userId,
    });
  }
}

// Global type declarations for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
