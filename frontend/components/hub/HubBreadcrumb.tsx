'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { HubSection } from '@/lib/stores/study-hub.store';

interface HubBreadcrumbProps {
  lifecycle: string;
  section: HubSection;
}

/**
 * Hub Breadcrumb Component - Phase 7 Day 1
 * 
 * Shows position within Research Lifecycle Navigation (Phase 8.5)
 * Provides context-aware navigation breadcrumbs
 * 
 * @world-class Features:
 * - Research Lifecycle integration
 * - Semantic navigation structure
 * - Responsive design
 * - Accessibility compliant
 */
export function HubBreadcrumb({ lifecycle, section }: HubBreadcrumbProps) {
  const sectionLabels: Record<HubSection, string> = {
    overview: 'Overview',
    data: 'Data Explorer',
    analyze: 'Analysis Tools',
    visualize: 'Visualizations',
    interpret: 'Interpretation',
    insights: 'AI Insights',
    report: 'Report Builder',
    export: 'Export',
  };

  const lifecyclePhases = {
    discover: 'Discover',
    design: 'Design',
    build: 'Build',
    recruit: 'Recruit',
    collect: 'Collect',
    analyze: 'Analyze',
    visualize: 'Visualize',
    interpret: 'Interpret',
    report: 'Report',
    archive: 'Archive',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          {/* Home */}
          <Link 
            href="/dashboard"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                     dark:hover:text-gray-200 transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
          </Link>

          <ChevronRightIcon className="w-4 h-4 text-gray-400" />

          {/* Research Lifecycle Phase */}
          <span className="text-gray-500 dark:text-gray-400">
            Research Lifecycle
          </span>

          <ChevronRightIcon className="w-4 h-4 text-gray-400" />

          {/* Current Lifecycle Phase (ANALYZE) */}
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {lifecyclePhases[lifecycle as keyof typeof lifecyclePhases]}
          </span>

          <ChevronRightIcon className="w-4 h-4 text-gray-400" />

          {/* Current Hub Section */}
          <span className="text-gray-900 dark:text-white font-medium">
            {sectionLabels[section]}
          </span>
        </nav>

        {/* Contextual Help */}
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          You are in the {lifecyclePhases[lifecycle as keyof typeof lifecyclePhases]} phase 
          of the research lifecycle, viewing {sectionLabels[section].toLowerCase()}
        </div>
      </div>
    </div>
  );
}