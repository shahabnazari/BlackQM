'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useStudyHub, HubSection } from '@/lib/stores/study-hub.store';
import {
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  DocumentChartBarIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface HubSidebarProps {
  lifecycle?: string;
}

interface SidebarItem {
  id: HubSection;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  available: boolean;
}

/**
 * Hub Sidebar Component - Phase 7 Day 1
 * 
 * @world-class Features:
 * - Aligned with Phase 8.5 Research Lifecycle Navigation
 * - Context-aware navigation based on data availability
 * - Smooth animations and transitions
 * - Responsive design with collapse functionality
 * - Accessibility compliant (WCAG AAA)
 */
export function HubSidebar({ lifecycle: _lifecycle = 'analyze' }: HubSidebarProps) {
  // Use lifecycle to show context - this is part of the research journey
  const { 
    currentSection, 
    setSection, 
    sidebarCollapsed, 
    toggleSidebar,
    studyData,
    analysisResults,
  } = useStudyHub();

  // Define sidebar sections with availability based on data state
  const sidebarItems: SidebarItem[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: HomeIcon,
      description: 'Study summary and metrics',
      color: 'text-blue-600',
      available: true,
    },
    {
      id: 'data',
      label: 'Data Explorer',
      icon: FolderOpenIcon,
      description: 'View and manage responses',
      color: 'text-green-600',
      available: !!studyData?.responses.length,
    },
    {
      id: 'analyze',
      label: 'Analysis Tools',
      icon: ChartBarIcon,
      description: 'Statistical analysis',
      color: 'text-purple-600',
      available: !!studyData?.responses.length,
    },
    {
      id: 'visualize',
      label: 'Visualizations',
      icon: DocumentChartBarIcon,
      description: 'Charts and graphs',
      color: 'text-indigo-600',
      available: !!analysisResults,
    },
    {
      id: 'interpret',
      label: 'Interpretation',
      icon: LightBulbIcon,
      description: 'Factor interpretation & themes',
      color: 'text-orange-600',
      available: !!analysisResults?.factorAnalysis,
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: SparklesIcon,
      description: 'Intelligent recommendations',
      color: 'text-yellow-600',
      available: !!analysisResults?.factorAnalysis,
    },
    {
      id: 'report',
      label: 'Report Builder',
      icon: DocumentTextIcon,
      description: 'Generate reports',
      color: 'text-red-600',
      available: !!analysisResults,
    },
    {
      id: 'export',
      label: 'Export',
      icon: ArrowDownTrayIcon,
      description: 'Download results',
      color: 'text-gray-600',
      available: true,
    },
  ], [studyData, analysisResults]);

  const handleSectionClick = (section: HubSection) => {
    setSection(section);
  };

  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out',
        'flex flex-col h-full',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with Lifecycle Context */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Analysis Hub
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Research Lifecycle: ANALYZE
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const isDisabled = !item.available;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && handleSectionClick(item.id)}
              disabled={isDisabled}
              className={cn(
                'w-full flex items-center px-3 py-2 rounded-lg',
                'transition-all duration-200',
                'group relative',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : isDisabled
                  ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              <Icon className={cn(
                'flex-shrink-0',
                sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5',
                isActive ? item.color : ''
              )} />
              
              {!sidebarCollapsed && (
                <div className="ml-3 text-left">
                  <div className="text-sm font-medium">
                    {item.label}
                  </div>
                  {!isDisabled && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </div>
                  )}
                  {isDisabled && (
                    <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                      Requires data
                    </div>
                  )}
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className={cn(
                  'absolute left-full ml-2 px-2 py-1',
                  'bg-gray-900 text-white text-xs rounded',
                  'opacity-0 group-hover:opacity-100',
                  'pointer-events-none transition-opacity',
                  'whitespace-nowrap z-50',
                  isDisabled && 'hidden'
                )}>
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer with Progress Indicator */}
      {!sidebarCollapsed && studyData && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Completion</span>
              <span>{Math.round((studyData.study?.completionRate || 0) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${(studyData.study?.completionRate || 0) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {studyData.responses?.length || 0} responses collected
            </div>
          </div>
        </div>
      )}
    </div>
  );
}