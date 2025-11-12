'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert } from '@/components/ui/alert';
import { useInterpretationStore } from '@/lib/stores/interpretation.store';
import { InterpretationWorkspace } from '@/components/interpretation/InterpretationWorkspace';
import {
  DocumentTextIcon,
  SparklesIcon,
  ChartBarIcon,
  LightBulbIcon,
  BeakerIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowsPointingOutIcon,
  BoltIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

/**
 * Interpretation Workspace Page - Phase 8 Day 1 Implementation
 * 
 * Maps to Research Lifecycle INTERPRET phase (Phase 8)
 * Purpose: Extract meaning & insights from analysis results
 * Coverage: Expanding from 60% to target 80%
 * 
 * @world-class Features:
 * - AI-powered narrative generation for all factors
 * - Theme extraction from qualitative data
 * - Consensus statement analyzer
 * - Factor characterization tools
 * - Cross-study comparative interpretation
 * - Interactive interpretation tools
 * - Collaborative interpretation features
 */
export default function InterpretationPage() {
  const params = useParams();
  const studyId = params['studyId'] as string;
  
  const {
    studyData,
    analysisResults,
    narratives,
    themes,
    isLoading,
    error,
    loadInterpretationData,
    generateNarratives,
    extractThemes
  } = useInterpretationStore();

  const [activeTab, setActiveTab] = useState<'narratives' | 'themes' | 'consensus' | 'synthesis' | 'bias' | 'perspectives' | 'alternatives' | 'mining' | 'patterns' | 'distinguishing' | 'interactions' | 'explainability' | 'corpus'>('narratives');
  const [generating, setGenerating] = useState(false);

  // Load interpretation data on mount
  useEffect(() => {
    if (studyId) {
      loadInterpretationData(studyId);
    }
  }, [studyId, loadInterpretationData]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-secondary-label">Loading interpretation workspace...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error loading interpretation data">
          {error}
        </Alert>
      </div>
    );
  }

  // Handle no analysis data
  if (!analysisResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="default" title="No analysis results">
          Please complete the analysis phase before interpretation.
        </Alert>
      </div>
    );
  }

  const handleGenerateNarratives = async () => {
    setGenerating(true);
    try {
      await generateNarratives(studyId);
    } catch (error) {
      console.error('Failed to generate narratives:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExtractThemes = async () => {
    setGenerating(true);
    try {
      await extractThemes(studyId);
    } catch (error) {
      console.error('Failed to extract themes:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-system-background">
      {/* Header */}
      <div className="border-b border-separator-opaque bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-label flex items-center gap-2">
                <DocumentTextIcon className="w-7 h-7 text-orange-500" />
                Interpretation Workspace
              </h1>
              <p className="text-sm text-secondary-label mt-1">
                Study: {studyData?.title || 'Loading...'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="info">
                {analysisResults?.factors?.length || 0} Factors
              </Badge>
              <Badge variant="success">
                {analysisResults?.participants?.length || 0} Participants
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-4">
            <Button
              size="sm"
              variant={activeTab === 'narratives' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('narratives')}
              className="flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              Factor Narratives
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'themes' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('themes')}
              className="flex items-center gap-2"
            >
              <LightBulbIcon className="w-4 h-4" />
              Theme Extraction
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'consensus' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('consensus')}
              className="flex items-center gap-2"
            >
              <ChartBarIcon className="w-4 h-4" />
              Consensus Analysis
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'synthesis' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('synthesis')}
              className="flex items-center gap-2"
            >
              <BeakerIcon className="w-4 h-4" />
              Cross-Factor Synthesis
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'bias' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('bias')}
              className="flex items-center gap-2"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              Bias Detection
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'perspectives' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('perspectives')}
              className="flex items-center gap-2"
            >
              <UserGroupIcon className="w-4 h-4" />
              Perspectives
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'alternatives' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('alternatives')}
              className="flex items-center gap-2"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
              Alternatives
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'mining' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('mining')}
              className="flex items-center gap-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Quote Mining
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'patterns' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('patterns')}
              className="flex items-center gap-2"
            >
              <ChartBarIcon className="w-4 h-4" />
              Patterns
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'distinguishing' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('distinguishing')}
              className="flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              Distinguishing
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'interactions' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('interactions')}
              className="flex items-center gap-2"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
              Interactions
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'explainability' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('explainability')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
            >
              <BoltIcon className="w-4 h-4" />
              🌟 Explainability
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'corpus' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('corpus')}
              className="flex items-center gap-2"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              Research Corpus
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <InterpretationWorkspace
          studyId={studyId}
          studyData={studyData}
          analysisResults={analysisResults}
          narratives={narratives}
          themes={themes}
          activeTab={activeTab}
          onGenerateNarratives={handleGenerateNarratives}
          onExtractThemes={handleExtractThemes}
          generating={generating}
        />
      </div>

      {/* AI Assistant Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="p-4 shadow-xl max-w-sm">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-5 h-5 text-system-blue mt-1" />
            <div>
              <h4 className="font-medium text-sm mb-1">AI Interpretation Assistant</h4>
              <p className="text-xs text-secondary-label mb-3">
                Get AI-powered help understanding your factors
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="primary"
                  onClick={handleGenerateNarratives}
                  loading={generating}
                  disabled={generating}
                >
                  Generate Narratives
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleExtractThemes}
                  loading={generating}
                  disabled={generating}
                >
                  Extract Themes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}