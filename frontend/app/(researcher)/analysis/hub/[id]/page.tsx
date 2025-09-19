'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStudyHub } from '@/lib/stores/study-hub.store';
import { HubOverview } from '@/components/hub/sections/HubOverview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert } from '@/components/ui/alert';

/**
 * Analysis Hub Main Page - Phase 7 Day 1 Implementation
 * 
 * Aligned with Phase 8.5 Research Lifecycle Navigation System
 * This hub is integrated into the ANALYZE phase of the lifecycle
 * 
 * @world-class Features:
 * - Unified data loading (load once, use everywhere)
 * - Context-aware navigation
 * - Real-time collaboration ready
 * - Performance optimized with caching
 */
export default function AnalysisHubPage() {
  const params = useParams();
  const studyId = params.id as string;
  
  const {
    studyData,
    isLoading,
    error,
    loadStudy,
    currentSection,
  } = useStudyHub();

  // Load study data on mount
  useEffect(() => {
    if (studyId) {
      loadStudy(studyId);
    }
  }, [studyId, loadStudy]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading analysis hub...
        </span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <h3 className="font-semibold">Failed to load study</h3>
        <p className="text-sm mt-1">{error.message}</p>
        <button
          onClick={() => loadStudy(studyId)}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </Alert>
    );
  }

  // Handle missing data
  if (!studyData) {
    return (
      <Alert className="m-6">
        <p>No study data available</p>
      </Alert>
    );
  }

  // Render section based on current navigation
  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return <HubOverview studyData={studyData} />;
      case 'data':
        return <div>Data Explorer (Coming soon)</div>;
      case 'analyze':
        return <div>Analysis Tools (Coming soon)</div>;
      case 'visualize':
        return <div>Visualization Center (Coming soon)</div>;
      case 'insights':
        return <div>AI Insights (Coming soon)</div>;
      case 'report':
        return <div>Report Builder (Coming soon)</div>;
      case 'export':
        return <div>Export Manager (Coming soon)</div>;
      default:
        return <HubOverview studyData={studyData} />;
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {studyData.study?.title || 'Untitled Study'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Analysis Hub - Part of the Research Lifecycle ANALYZE Phase
        </p>
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {renderSection()}
      </div>
    </div>
  );
}