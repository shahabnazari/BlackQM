import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { FactorNarrativePanel } from './FactorNarrativePanel';
import { ConsensusAnalysisPanel } from './ConsensusAnalysisPanel';
import { BiasAnalysisPanel } from './BiasAnalysisPanel';
import { PerspectiveValidator } from './PerspectiveValidator';
import { AlternativeViewpointGenerator } from './AlternativeViewpointGenerator';
import { QuoteMiner } from './QuoteMiner';
import { QualitativePatternDetector } from './QualitativePatternDetector';
import { ThemeExtractionEngine } from './ThemeExtractionEngine';
import { DistinguishingViewAnalyzer } from './DistinguishingViewAnalyzer';
import { CrossFactorSynthesisTool } from './CrossFactorSynthesisTool';
import { FactorInteractionMapper } from './FactorInteractionMapper';
import { InsightAggregator } from './InsightAggregator';
import { RecommendationEngine } from './RecommendationEngine';
import { ComparativeInsights } from './ComparativeInsights';
import { TrendIdentifier } from './TrendIdentifier';
import { ActionableInsightsGenerator } from './ActionableInsightsGenerator';
import { ExplainabilityDashboard } from '../explainability/ExplainabilityDashboard';
import { ResearchCorpusPanel } from '../repository/ResearchCorpusPanel';
import {
  SparklesIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { FactorNarrative, Theme } from '@/lib/stores/interpretation.store';

interface InterpretationWorkspaceProps {
  studyId: string;
  studyData: any;
  analysisResults: any;
  narratives: FactorNarrative[];
  themes: Theme[];
  activeTab: 'narratives' | 'themes' | 'consensus' | 'synthesis' | 'bias' | 'perspectives' | 'alternatives' | 'mining' | 'patterns' | 'distinguishing' | 'interactions' | 'insights' | 'recommendations' | 'comparison' | 'trends' | 'actionable' | 'explainability' | 'corpus';
  onGenerateNarratives: () => void;
  onExtractThemes: () => void;
  generating: boolean;
}

/**
 * InterpretationWorkspace Component - Phase 8 Day 1-4
 * 
 * Multi-panel layout for comprehensive factor interpretation
 * Integrates AI-powered narrative generation with manual editing
 * Enhanced with Day 4 insight synthesis components
 */
export function InterpretationWorkspace({
  studyId: _studyId,
  studyData: _studyData,
  analysisResults,
  narratives,
  themes,
  activeTab,
  onGenerateNarratives,
  onExtractThemes,
  generating
}: InterpretationWorkspaceProps) {
  const [selectedFactor, setSelectedFactor] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // Extract factors from analysis results
  const factors = analysisResults?.factors || [];
  const factorCount = factors.length;

  // Calculate interpretation completeness
  const narrativeCompleteness = narratives.length > 0 
    ? (narratives.filter(n => n.narrative && n.narrative.length > 100).length / factorCount) * 100
    : 0;

  const themeCompleteness = themes.length > 0 ? Math.min(100, themes.length * 10) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="p-6 bg-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-label mb-2">
              Interpretation Overview
            </h2>
            <p className="text-sm text-secondary-label">
              Transform your statistical results into meaningful insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-secondary-label mb-1">Narrative Completion</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-system-gray-5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-system-green transition-all duration-300"
                    style={{ width: `${narrativeCompleteness}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(narrativeCompleteness)}%</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-secondary-label mb-1">Theme Extraction</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-system-gray-5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-system-blue transition-all duration-300"
                    style={{ width: `${themeCompleteness}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(themeCompleteness)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Factor Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {factors.slice(0, 4).map((factor: any, index: number) => (
            <div 
              key={index}
              className="p-4 bg-system-gray-6 rounded-lg cursor-pointer hover:bg-system-gray-5 transition-colors"
              onClick={() => setSelectedFactor(index + 1)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-secondary-label">Factor {index + 1}</span>
                {narratives.find(n => n.factorNumber === index + 1) ? (
                  <CheckCircleIcon className="w-4 h-4 text-system-green" />
                ) : (
                  <ExclamationTriangleIcon className="w-4 h-4 text-system-orange" />
                )}
              </div>
              <p className="text-sm font-medium text-label">
                {narratives.find(n => n.factorNumber === index + 1)?.title || 'Unnamed Factor'}
              </p>
              <p className="text-xs text-secondary-label mt-1">
                {factor.eigenvalue ? `Eigenvalue: ${factor.eigenvalue.toFixed(2)}` : 'No data'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Content based on active tab */}
        <div className="lg:col-span-2">
          {activeTab === 'narratives' && (() => {
            const narrative = narratives.find(n => n.factorNumber === selectedFactor);
            if (!narrative) return null;
            return (
              <FactorNarrativePanel
                factor={factors[selectedFactor - 1]}
                factorNumber={selectedFactor}
                narrative={narrative}
                editMode={editMode}
                onEditToggle={() => setEditMode(!editMode)}
                onGenerate={onGenerateNarratives}
                generating={generating}
              />
            );
          })()}

          {activeTab === 'themes' && (
            <ThemeExtractionEngine
              studyId={_studyId}
              analysisResults={analysisResults}
              onThemesExtracted={(extractedThemes) => {
                console.log('Themes extracted:', extractedThemes);
                onExtractThemes();
              }}
            />
          )}

          {activeTab === 'consensus' && (
            <ConsensusAnalysisPanel
              analysisResults={analysisResults}
              factors={factors}
            />
          )}

          {activeTab === 'synthesis' && (
            <CrossFactorSynthesisTool
              narratives={narratives}
              themes={themes}
              factors={factors}
              studyData={_studyData}
              onSynthesisComplete={(synthesis) => {
                console.log('Synthesis completed:', synthesis);
              }}
            />
          )}

          {activeTab === 'bias' && (
            <BiasAnalysisPanel
              studyId={_studyId}
              studyData={_studyData}
              analysisResults={analysisResults}
              onBiasDetected={(analysis) => {
                console.log('Bias analysis completed:', analysis);
              }}
            />
          )}

          {activeTab === 'perspectives' && (
            <PerspectiveValidator
              studyData={_studyData}
              analysisResults={analysisResults}
              statements={_studyData?.statements || []}
              onValidationComplete={(result) => {
                console.log('Perspective validation completed:', result);
              }}
            />
          )}

          {activeTab === 'alternatives' && (
            <AlternativeViewpointGenerator
              studyData={_studyData}
              currentNarratives={narratives}
              factors={factors}
              onViewpointGenerated={(viewpoint) => {
                console.log('Alternative viewpoint generated:', viewpoint);
              }}
            />
          )}

          {activeTab === 'mining' && (
            <QuoteMiner
              data={{
                comments: _studyData?.comments || [],
                responses: _studyData?.responses || []
              }}
              factors={factors}
              onQuotesExtracted={(quotes) => {
                console.log('Quotes extracted:', quotes);
              }}
            />
          )}

          {activeTab === 'patterns' && (
            <QualitativePatternDetector
              data={{
                comments: _studyData?.comments || [],
                responses: _studyData?.responses || [],
                factors: factors
              }}
              onPatternsDetected={(patterns) => {
                console.log('Patterns detected:', patterns);
              }}
            />
          )}

          {activeTab === 'distinguishing' && (
            <DistinguishingViewAnalyzer
              studyData={_studyData}
              analysisResults={analysisResults}
              factors={factors}
              onAnalysisComplete={(analysis) => {
                console.log('Distinguishing analysis completed:', analysis);
              }}
            />
          )}

          {activeTab === 'interactions' && (
            <FactorInteractionMapper
              factors={factors}
              analysisResults={analysisResults}
              narratives={narratives}
              onInteractionAnalyzed={(analysis) => {
                console.log('Interaction analysis completed:', analysis);
              }}
            />
          )}

          {/* Phase 10 Days 24-25: Explainable AI Dashboard */}
          {activeTab === 'explainability' && (
            <ExplainabilityDashboard studyId={_studyId} />
          )}

          {/* Phase 10 Days 26-27: Research Repository & Knowledge System */}
          {activeTab === 'corpus' && (
            <ResearchCorpusPanel studyId={_studyId} />
          )}

          {/* Phase 8 Day 4: Insight Synthesis Components */}
          {activeTab === 'insights' && (
            <InsightAggregator
              insights={[]}
              factors={factors}
              themes={themes}
              onAggregationComplete={(aggregated) => {
                console.log('Insights aggregated:', aggregated);
              }}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationEngine
              analysisResults={analysisResults}
              insights={[]}
              studyContext={_studyData}
              onRecommendationGenerated={(recommendations) => {
                console.log('Recommendations generated:', recommendations);
              }}
            />
          )}

          {activeTab === 'comparison' && (
            <ComparativeInsights
              data={analysisResults}
              groups={[]}
              dimensions={[]}
              onComparisonComplete={(results) => {
                console.log('Comparison complete:', results);
              }}
            />
          )}

          {activeTab === 'trends' && (
            <TrendIdentifier
              data={[]}
              timeSeriesData={[]}
              categories={[]}
              onTrendsIdentified={(trends) => {
                console.log('Trends identified:', trends);
              }}
            />
          )}

          {activeTab === 'actionable' && (
            <ActionableInsightsGenerator
              insights={[]}
              recommendations={[]}
              studyContext={_studyData}
              onInsightsGenerated={(insights) => {
                console.log('Actionable insights generated:', insights);
              }}
            />
          )}
        </div>

        {/* Right Panel - AI Assistant & Tools */}
        <div className="space-y-4">
          {/* AI Interpretation Tools */}
          <Card className="p-4 bg-gradient-to-br from-system-blue/5 to-system-purple/5">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-system-blue" />
              AI Interpretation Tools
            </h3>
            
            <div className="space-y-2">
              <Button
                size="sm"
                variant="primary"
                onClick={onGenerateNarratives}
                loading={generating}
                disabled={generating}
                className="w-full"
              >
                Generate Factor Narratives
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={onExtractThemes}
                loading={generating}
                disabled={generating}
                className="w-full"
              >
                Extract Themes
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="w-full"
              >
                Detect Bias (Coming Soon)
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="w-full"
              >
                Generate Synthesis (Coming Soon)
              </Button>
            </div>
          </Card>

          {/* Factor Navigation */}
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3">Factor Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              {factors.map((_factor: any, index: number) => (
                <Button
                  key={index}
                  size="sm"
                  variant={selectedFactor === index + 1 ? 'primary' : 'secondary'}
                  onClick={() => setSelectedFactor(index + 1)}
                  className="relative"
                >
                  <span>Factor {index + 1}</span>
                  {narratives.find(n => n.factorNumber === index + 1) && (
                    <CheckCircleIcon className="w-3 h-3 absolute top-1 right-1 text-system-green" />
                  )}
                </Button>
              ))}
            </div>
          </Card>

          {/* Interpretation Guidelines */}
          <Card className="p-4 bg-system-yellow/5 border border-system-yellow/20">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <DocumentDuplicateIcon className="w-4 h-4 text-system-yellow" />
              Interpretation Guidelines
            </h3>
            <ul className="text-xs text-secondary-label space-y-1">
              <li>• Focus on distinguishing statements first</li>
              <li>• Look for patterns across high-loading sorts</li>
              <li>• Consider demographic context</li>
              <li>• Check consensus statements for common ground</li>
              <li>• Validate interpretations with participant comments</li>
            </ul>
          </Card>

          {/* Export Options */}
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3">Export Options</h3>
            <div className="space-y-2">
              <Button size="sm" variant="secondary" className="w-full">
                Export Narratives (PDF)
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
                Export Themes (CSV)
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
                Copy to Report
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}