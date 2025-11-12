'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStudyHub } from '@/lib/stores/study-hub.store';
import { HubOverview } from '@/components/hub/sections/HubOverview';
import { DataExplorer } from '@/components/hub/sections/DataExplorer';
import { AnalysisTools } from '@/components/hub/sections/AnalysisTools';
import { VisualizationCenter } from '@/components/hub/sections/VisualizationCenter';
import { AIInsights } from '@/components/hub/sections/AIInsights';
import { ReportBuilder } from '@/components/hub/sections/ReportBuilder';
import { ExportManager } from '@/components/hub/sections/ExportManager';
import { InterpretationSection } from '@/components/hub/sections/InterpretationSection';
import { Alert } from '@/components/ui/alert';
import { HubLoadingSkeleton } from '@/components/hub/LoadingSkeleton';

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
  const studyId = params['id'] as string;

  const { studyData, isLoading, error, loadStudy, currentSection } =
    useStudyHub();

  // Load study data on mount
  useEffect(() => {
    if (studyId) {
      loadStudy(studyId);
    }
  }, [studyId, loadStudy]);

  // Handle loading state
  if (isLoading) {
    return <HubLoadingSkeleton />;
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
        return <DataExplorer studyId={studyId} />;
      case 'analyze':
        return <AnalysisTools studyId={studyId} />;
      case 'visualize':
        return <VisualizationCenter studyId={studyId} />;
      case 'interpret':
        return <InterpretationSection studyId={studyId} />;
      case 'insights':
        return <AIInsights studyId={studyId} />;
      case 'report':
        return <ReportBuilder studyId={studyId} />;
      case 'export':
        return <ExportManager studyId={studyId} />;
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
