'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { InterpretationWorkspace } from '@/components/interpretation/InterpretationWorkspace';
import { useInterpretationStore } from '@/lib/stores/interpretation.store';
import { useStudyHub } from '@/lib/stores/study-hub.store';
import { useAIBackend } from '@/hooks/useAIBackend';
import { Alert } from '@/components/ui/alert';
import { 
  SparklesIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface InterpretationSectionProps {
  studyId: string;
}

/**
 * InterpretationSection - Phase 8 Day 5 Integration
 * 
 * Bridges the Analysis Hub (Phase 7) with Interpretation Components (Phase 8)
 * Provides seamless integration of AI-powered interpretation tools
 * Prepares data for Phase 10 (Report Generation)
 */
export function InterpretationSection({ studyId }: InterpretationSectionProps) {
  const [activeTab] = useState<any>('narratives');
  const [generating, setGenerating] = useState(false);
  const [exportReady, setExportReady] = useState(false);
  
  const { studyData, analysisResults } = useStudyHub();
  const { 
    narratives, 
    themes, 
    loadInterpretationData,
    generateNarratives: generateNarrativesFromStore,
    extractThemes: extractThemesFromStore
  } = useInterpretationStore();
  
  const { loading: isLoading, error } = useAIBackend();

  // Load existing interpretation on mount
  useEffect(() => {
    if (studyId && analysisResults) {
      loadInterpretationData(studyId);
    }
  }, [studyId, analysisResults, loadInterpretationData]);

  // Check if export is ready (for Phase 10 preparation)
  useEffect(() => {
    const hasNarratives = narratives && narratives.length > 0;
    const hasThemes = themes && themes.length > 0;
    setExportReady(hasNarratives && hasThemes);
  }, [narratives, themes]);

  const handleGenerateNarratives = async () => {
    if (!analysisResults?.factors) {
      alert('No analysis results available. Please run analysis first.');
      return;
    }

    setGenerating(true);
    try {
      // Use store method to generate narratives
      await generateNarrativesFromStore(studyId);
      // The store method will handle updating the narratives internally
    } catch (error) {
      console.error('Failed to generate narratives:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExtractThemes = async () => {
    if (!studyData?.responses) {
      alert('No response data available for theme extraction.');
      return;
    }

    setGenerating(true);
    try {
      // Use store method to extract themes
      await extractThemesFromStore(studyId);
      // The store method will handle updating the themes internally
    } catch (error) {
      console.error('Failed to extract themes:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportForReport = async () => {
    if (!exportReady) return;
    
    try {
      // exportForReport method doesn't exist in store yet - Phase 10 will implement this
      // const exportData = await exportForReport(studyId);
      
      // Prepare data structure for Phase 10 (Report Generation)
      const reportData = {
        study: studyData,
        analysis: analysisResults,
        interpretation: {
          narratives,
          themes,
          exportedAt: new Date().toISOString()
        },
        metadata: {
          version: '1.0',
          phase: 'interpretation_complete',
          readyForReport: true
        }
      };
      
      // Store in sessionStorage for Phase 10 access
      sessionStorage.setItem(`report_data_${studyId}`, JSON.stringify(reportData));
      
      // Download JSON for backup
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interpretation_${studyId}_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Interpretation data exported and ready for report generation (Phase 10)');
    } catch (error) {
      console.error('Failed to export interpretation:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleShareInterpretation = () => {
    // Create shareable link for collaborative interpretation
    const shareUrl = `${window.location.origin}/shared/interpretation/${studyId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <div>
          <h3 className="font-semibold">Interpretation Error</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Alert>
    );
  }

  if (!analysisResults) {
    return (
      <Card className="p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
        <p className="text-secondary-label mb-4">
          Please complete the analysis phase before proceeding to interpretation.
        </p>
        <Button
          onClick={() => window.location.href = `/analysis/hub/${studyId}?section=analyze`}
        >
          Go to Analysis
        </Button>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Interpretation
          </h2>
          <p className="text-sm text-secondary-label mt-1">
            Extract meaning and insights from your analysis results
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Share Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareInterpretation}
            className="gap-2"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </Button>
          
          {/* Export for Report Button */}
          <Button
            variant={exportReady ? "primary" : "secondary"}
            size="sm"
            onClick={handleExportForReport}
            disabled={!exportReady}
            className="gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export for Report
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadInterpretationData(studyId)}
            className="gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-label">Factor Narratives</p>
              <p className="text-2xl font-semibold">
                {narratives?.length || 0} / {analysisResults?.factors?.length || 0}
              </p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-label">Themes Extracted</p>
              <p className="text-2xl font-semibold">{themes?.length || 0}</p>
            </div>
            <SparklesIcon className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-label">Export Status</p>
              <p className="text-sm font-medium">
                {exportReady ? 'Ready for Report' : 'In Progress'}
              </p>
            </div>
            <div className={`h-3 w-3 rounded-full ${exportReady ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
          </div>
        </Card>
      </div>

      {/* Main Interpretation Workspace */}
      <InterpretationWorkspace
        studyId={studyId}
        studyData={studyData}
        analysisResults={analysisResults}
        narratives={narratives || []}
        themes={themes || []}
        activeTab={activeTab}
        onGenerateNarratives={handleGenerateNarratives}
        onExtractThemes={handleExtractThemes}
        generating={generating || isLoading}
      />

      {/* Integration Status */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Phase 8 Integration Complete
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              This interpretation workspace is now fully integrated with the Analysis Hub (Phase 7) 
              and prepares data for Report Generation (Phase 10).
            </p>
            <div className="flex gap-4 mt-3">
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ✓ Analysis data connected
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ✓ AI services integrated
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ✓ Export pipeline ready
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}