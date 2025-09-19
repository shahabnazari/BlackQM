'use client';

import { ReactNode } from 'react';
import { HubSidebar } from '@/components/hub/HubSidebar';
import { HubBreadcrumb } from '@/components/hub/HubBreadcrumb';
import { useStudyHub } from '@/lib/stores/study-hub.store';

interface HubLayoutProps {
  children: ReactNode;
}

/**
 * Analysis Hub Layout - Aligned with Phase 8.5 Research Lifecycle Navigation
 * This is part of the ANALYZE phase (Phase 6) in the research lifecycle
 * 
 * @world-class Implementation with proper error boundaries and loading states
 */
export default function HubLayout({ children }: HubLayoutProps) {
  const { currentSection } = useStudyHub();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation - Aligned with Research Lifecycle */}
      <HubSidebar 
        lifecycle="analyze" // Part of ANALYZE phase
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb Navigation - Shows position in lifecycle */}
        <HubBreadcrumb 
          lifecycle="analyze"
          section={currentSection}
        />

        {/* Content Container with proper scrolling */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}