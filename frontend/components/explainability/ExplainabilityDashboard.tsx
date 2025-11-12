'use client';

/**
 * Explainability Dashboard
 * Phase 10 Days 24-25: Unified Explainable AI Interface
 *
 * Enterprise-grade dashboard combining:
 * - Feature Importance (SHAP-inspired)
 * - Interactive What-If Analysis
 * - Bias Audit
 * - Certainty Scoring
 * - Alternative Explanations
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  explainabilityApi,
  type FactorExplanation,
  type BiasAudit,
  type CertaintyScore,
} from '@/lib/api/services/explainability-api.service';
import { InteractiveWhatIfAnalysis } from './InteractiveWhatIfAnalysis';

// ============================================================================
// TYPES
// ============================================================================

interface ExplainabilityDashboardProps {
  studyId: string;
  initialTab?:
    | 'feature-importance'
    | 'what-if'
    | 'bias-audit'
    | 'certainty'
    | 'alternatives';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Feature Importance Panel
 */
function FeatureImportancePanel({ factors }: { factors: FactorExplanation[] }) {
  const [selectedFactor, setSelectedFactor] = useState(0);

  const currentFactor = factors[selectedFactor];

  if (!currentFactor) {
    return (
      <div className="text-center py-12 text-gray-500">
        No factor data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Factor Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">
            Select Factor:
          </span>
          {factors.map((factor, idx) => (
            <Button
              key={factor.factorNumber}
              size="sm"
              variant={selectedFactor === idx ? 'primary' : 'secondary'}
              onClick={() => setSelectedFactor(idx)}
            >
              Factor {factor.factorNumber}
              <span className="ml-2 text-xs opacity-75">
                ({(factor.explainedVariance * 100).toFixed(1)}% var)
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Factor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Explained Variance</div>
          <div className="text-2xl font-bold text-blue-600">
            {(currentFactor.explainedVariance * 100).toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Certainty Score</div>
          <div className="text-2xl font-bold text-green-600">
            {(currentFactor.certaintyScore * 100).toFixed(0)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Top Positive</div>
          <div className="text-2xl font-bold text-green-600">
            {currentFactor.topPositiveStatements.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Top Negative</div>
          <div className="text-2xl font-bold text-red-600">
            {currentFactor.topNegativeStatements.length}
          </div>
        </Card>
      </div>

      {/* Top Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Statements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-700">
            Most Important Positive Statements
          </h3>
          <div className="space-y-3">
            {currentFactor.topPositiveStatements
              .slice(0, 5)
              .map((stmt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      #{stmt.rank}
                    </Badge>
                    <span className="text-xs text-green-700 font-medium">
                      {(stmt.importance * 100).toFixed(0)}% importance
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{stmt.statementText}</p>
                  <p className="text-xs text-green-600 mt-1 italic">
                    {stmt.explanation}
                  </p>
                </div>
              ))}
          </div>
        </Card>

        {/* Negative Statements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-700">
            Most Important Negative Statements
          </h3>
          <div className="space-y-3">
            {currentFactor.topNegativeStatements
              .slice(0, 5)
              .map((stmt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      #{stmt.rank}
                    </Badge>
                    <span className="text-xs text-red-700 font-medium">
                      {(stmt.importance * 100).toFixed(0)}% importance
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{stmt.statementText}</p>
                  <p className="text-xs text-red-600 mt-1 italic">
                    {stmt.explanation}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Bias Audit Panel
 */
function BiasAuditPanel({ biasAudit }: { biasAudit: BiasAudit }) {
  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (level: string) => {
    const configs: Record<
      string,
      { variant: 'success' | 'warning' | 'destructive'; icon: React.ReactNode }
    > = {
      excellent: {
        variant: 'success',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      good: {
        variant: 'success',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      acceptable: {
        variant: 'warning',
        icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      },
      needs_improvement: {
        variant: 'destructive',
        icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      },
    };
    return configs[level] ?? configs['acceptable'];
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Overall Bias Score</h2>
            <p className="text-sm text-gray-600 mt-1">
              Lower is better (0-100 scale)
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-5xl font-bold ${getScoreColor(biasAudit.overallBiasScore)}`}
            >
              {biasAudit.overallBiasScore}
            </div>
            {(() => {
              const badge = getComplianceBadge(biasAudit.complianceLevel);
              if (!badge) return null;
              return (
                <Badge
                  variant={badge.variant}
                  className="mt-2 flex items-center gap-1"
                >
                  {badge.icon}
                  {biasAudit.complianceLevel.replace('_', ' ')}
                </Badge>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Bias Dimensions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Bias Dimensions</h3>
        <div className="grid gap-4">
          {Object.entries(biasAudit.dimensions).map(([key, dimension]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {dimension.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {dimension.description}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}
                  >
                    {dimension.score}
                  </div>
                  <Badge
                    className={
                      dimension.level === 'low'
                        ? 'bg-green-100 text-green-700'
                        : dimension.level === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }
                  >
                    {dimension.level} risk
                  </Badge>
                </div>
              </div>

              {/* Evidence */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Evidence:
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {dimension.evidence.map((ev, idx) => (
                    <li key={idx}>• {ev}</li>
                  ))}
                </ul>
              </div>

              {/* Corrective Actions */}
              {dimension.level !== 'low' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="text-xs font-medium text-yellow-800 mb-1">
                    Recommended Actions:
                  </div>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {dimension.correctiveActions.map((action, idx) => (
                      <li key={idx}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      {biasAudit.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Priority Recommendations
          </h3>
          <div className="space-y-3">
            {biasAudit.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg ${
                  rec.priority === 'critical'
                    ? 'border-red-300 bg-red-50'
                    : rec.priority === 'high'
                      ? 'border-orange-300 bg-orange-50'
                      : rec.priority === 'medium'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-blue-300 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={
                      rec.priority === 'critical' || rec.priority === 'high'
                        ? 'destructive'
                        : rec.priority === 'medium'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {rec.priority} priority
                  </Badge>
                  <span className="text-xs text-gray-600">{rec.category}</span>
                </div>
                <h4 className="font-medium text-gray-900">{rec.issue}</h4>
                <p className="text-sm text-gray-700 mt-2">
                  {rec.recommendation}
                </p>
                <div className="mt-3 text-xs text-gray-600">
                  <strong>Expected Impact:</strong> {rec.expectedImpact}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Certainty Score Panel
 */
function CertaintyScorePanel({
  certaintyScores,
  factors,
}: {
  certaintyScores: Record<number, CertaintyScore>;
  factors: FactorExplanation[];
}) {
  const [selectedFactor, setSelectedFactor] = useState<number>(1);

  const currentScore = certaintyScores[selectedFactor];

  if (!currentScore) {
    return (
      <div className="text-center py-12 text-gray-500">
        No certainty data available
      </div>
    );
  }

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'very_high':
        return 'text-green-600';
      case 'high':
        return 'text-blue-600';
      case 'moderate':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Factor Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">
            Select Factor:
          </span>
          {factors.map(factor => (
            <Button
              key={factor.factorNumber}
              size="sm"
              variant={
                selectedFactor === factor.factorNumber ? 'primary' : 'secondary'
              }
              onClick={() => setSelectedFactor(factor.factorNumber)}
            >
              Factor {factor.factorNumber}
            </Button>
          ))}
        </div>
      </Card>

      {/* Overall Certainty */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Overall Certainty</h2>
            <p className="text-sm text-gray-600 mt-1">
              Confidence in factor interpretation
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-5xl font-bold ${getReliabilityColor(currentScore.reliability)}`}
            >
              {(currentScore.overall * 100).toFixed(0)}%
            </div>
            <Badge variant="secondary" className="mt-2">
              {currentScore.reliability.replace('_', ' ')} reliability
            </Badge>
          </div>
        </div>
      </Card>

      {/* Components */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Certainty Components</h3>
        <div className="space-y-4">
          {Object.entries(currentScore.components).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-sm font-bold">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Confidence Interval */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">95% Confidence Interval</h3>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(currentScore.confidenceInterval[0] * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Lower Bound</div>
          </div>
          <div className="flex-1 bg-gray-200 h-2 rounded-full relative">
            <div
              className="absolute h-2 bg-blue-500 rounded-full"
              style={{
                left: `${currentScore.confidenceInterval[0] * 100}%`,
                width: `${(currentScore.confidenceInterval[1] - currentScore.confidenceInterval[0]) * 100}%`,
              }}
            />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(currentScore.confidenceInterval[1] * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Upper Bound</div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4 italic">
          {currentScore.explanation}
        </p>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export function ExplainabilityDashboard({
  studyId,
  initialTab = 'feature-importance',
}: ExplainabilityDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [featureImportance, setFeatureImportance] = useState<
    FactorExplanation[] | null
  >(null);
  const [biasAudit, setBiasAudit] = useState<BiasAudit | null>(null);
  const [certaintyScores, setCertaintyScores] = useState<Record<
    number,
    CertaintyScore
  > | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const summary =
          await explainabilityApi.getExplainabilitySummary(studyId);
        setFeatureImportance(summary.featureImportance.factors);
        setBiasAudit(summary.biasAudit);
        setCertaintyScores(summary.certaintyScores);
      } catch (err: any) {
        setError(err.message || 'Failed to load explainability data');
        console.error('Explainability loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [studyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-gray-600">
          Loading explainability analysis...
        </span>
      </div>
    );
  }

  if (error || !featureImportance || !biasAudit || !certaintyScores) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load
          </h3>
          <p className="text-sm text-gray-600">
            {error || 'Unable to load explainability data'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <SparklesIcon className="w-8 h-8" />
              Explainability Dashboard
            </h1>
            <p className="text-purple-100 mt-2">
              SHAP-inspired analysis • Interactive What-If • Bias Detection •
              Certainty Scoring
            </p>
          </div>
          <Badge className="bg-white text-purple-600 border-0">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Backend Complete
          </Badge>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as typeof activeTab)}
      >
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="feature-importance">
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Feature Importance
          </TabsTrigger>
          <TabsTrigger value="what-if">
            <SparklesIcon className="w-4 h-4 mr-2" />
            What-If Analysis
          </TabsTrigger>
          <TabsTrigger value="bias-audit">
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            Bias Audit
          </TabsTrigger>
          <TabsTrigger value="certainty">
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            Certainty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feature-importance">
          <FeatureImportancePanel factors={featureImportance} />
        </TabsContent>

        <TabsContent value="what-if">
          {featureImportance[0] && (
            <InteractiveWhatIfAnalysis
              studyId={studyId}
              factorNumber={1}
              factorExplanation={featureImportance[0]}
            />
          )}
        </TabsContent>

        <TabsContent value="bias-audit">
          <BiasAuditPanel biasAudit={biasAudit} />
        </TabsContent>

        <TabsContent value="certainty">
          <CertaintyScorePanel
            certaintyScores={certaintyScores}
            factors={featureImportance}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
