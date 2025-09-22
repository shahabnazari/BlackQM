import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { Alert } from '@/components/ui/alert';
import { 
  FireIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  DocumentMagnifyingGlassIcon,
  LightBulbIcon,
  ScaleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface DistinguishingStatement {
  id: string;
  number: number;
  text: string;
  zScore: number;
  significance: 'high' | 'medium' | 'low';
  uniqueToFactor: boolean;
  opposingFactors: number[];
  explanation?: string;
  confidence: number;
}

interface FactorDistinction {
  factorNumber: number;
  distinguishingStatements: DistinguishingStatement[];
  coreBeliefs: string[];
  oppositions: {
    factor: number;
    conflictingBeliefs: string[];
    intensity: number;
  }[];
  uniquenessScore: number;
  clarityScore: number;
}

interface ContrastAnalysis {
  factor1: number;
  factor2: number;
  agreements: {
    statement: string;
    strength: number;
  }[];
  disagreements: {
    statement: string;
    factor1Position: number;
    factor2Position: number;
    gap: number;
  }[];
  overallSimilarity: number;
  keyDifference: string;
}

interface DistinguishingViewAnalyzerProps {
  studyData: any;
  analysisResults: any;
  factors: any[];
  onAnalysisComplete?: (analysis: any) => void;
}

/**
 * DistinguishingViewAnalyzer Component - Phase 8 Day 3
 * 
 * World-class distinguishing statement analysis with:
 * - Multi-factor contrast analysis
 * - Core belief extraction
 * - Opposition mapping
 * - Uniqueness scoring
 * - Interactive comparison tools
 */
export function DistinguishingViewAnalyzer({
  studyData,
  analysisResults,
  factors,
  onAnalysisComplete
}: DistinguishingViewAnalyzerProps) {
  const [selectedFactor, setSelectedFactor] = useState<number>(1);
  const [comparisonFactor, setComparisonFactor] = useState<number | null>(null);
  const [factorDistinctions, setFactorDistinctions] = useState<FactorDistinction[]>([]);
  const [contrastAnalysis, setContrastAnalysis] = useState<ContrastAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'compare' | 'matrix'>('single');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);
  const [thresholdLevel, setThresholdLevel] = useState<'strict' | 'moderate' | 'inclusive'>('moderate');

  // Thresholds for distinguishing statements
  const thresholds = {
    strict: { significance: 0.01, zScore: 2.58 },
    moderate: { significance: 0.05, zScore: 1.96 },
    inclusive: { significance: 0.10, zScore: 1.645 }
  };

  useEffect(() => {
    if (analysisResults && factors.length > 0) {
      analyzeDistinguishingViews();
    }
  }, [analysisResults, factors, thresholdLevel]);

  useEffect(() => {
    if (viewMode === 'compare' && selectedFactor && comparisonFactor) {
      performContrastAnalysis();
    }
  }, [selectedFactor, comparisonFactor, viewMode]);

  const analyzeDistinguishingViews = async () => {
    setIsAnalyzing(true);
    
    try {
      const distinctions: FactorDistinction[] = [];
      
      factors.forEach((factor, index) => {
        const factorNum = index + 1;
        const distinguishing = extractDistinguishingStatements(factor, factorNum);
        const coreBeliefs = extractCoreBeliefs(distinguishing);
        const oppositions = findOppositions(factorNum, distinguishing);
        
        distinctions.push({
          factorNumber: factorNum,
          distinguishingStatements: distinguishing,
          coreBeliefs,
          oppositions,
          uniquenessScore: calculateUniquenessScore(distinguishing),
          clarityScore: calculateClarityScore(distinguishing, coreBeliefs)
        });
      });
      
      setFactorDistinctions(distinctions);
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          distinctions,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error analyzing distinguishing views:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractDistinguishingStatements = (factor: any, factorNum: number): DistinguishingStatement[] => {
    const statements: DistinguishingStatement[] = [];
    const threshold = thresholds[thresholdLevel];
    
    // Extract from factor loadings
    if (factor.loadings) {
      factor.loadings.forEach((loading: any, index: number) => {
        const zScore = Math.abs(loading.value);
        if (zScore >= threshold.zScore) {
          const opposing = findOpposingFactors(index, factorNum, zScore);
          statements.push({
            id: `stmt-${index}`,
            number: index + 1,
            text: studyData?.statements?.[index]?.text || `Statement ${index + 1}`,
            zScore: loading.value,
            significance: getSignificanceLevel(zScore),
            uniqueToFactor: opposing.length === 0,
            opposingFactors: opposing,
            explanation: generateExplanation(loading.value, opposing),
            confidence: calculateConfidence(zScore, opposing.length)
          });
        }
      });
    }
    
    return statements.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  };

  const findOpposingFactors = (stmtIndex: number, currentFactor: number, currentZScore: number): number[] => {
    const opposing: number[] = [];
    
    factors.forEach((factor, index) => {
      const factorNum = index + 1;
      if (factorNum !== currentFactor) {
        const loading = factor.loadings?.[stmtIndex]?.value || 0;
        // Check if this factor has opposite view (different sign and significant)
        if (Math.sign(loading) !== Math.sign(currentZScore) && Math.abs(loading) >= thresholds[thresholdLevel].zScore) {
          opposing.push(factorNum);
        }
      }
    });
    
    return opposing;
  };

  const getSignificanceLevel = (zScore: number): 'high' | 'medium' | 'low' => {
    if (zScore >= 2.58) return 'high';
    if (zScore >= 1.96) return 'medium';
    return 'low';
  };

  const generateExplanation = (zScore: number, opposing: number[]): string => {
    const strength = Math.abs(zScore) >= 2.58 ? 'strongly' : Math.abs(zScore) >= 1.96 ? 'moderately' : 'somewhat';
    const direction = zScore > 0 ? 'agrees with' : 'disagrees with';
    
    if (opposing.length === 0) {
      return `This factor ${strength} ${direction} this statement, making it a unique distinguishing view.`;
    } else {
      return `This factor ${strength} ${direction} this statement, in contrast to factor(s) ${opposing.join(', ')}.`;
    }
  };

  const calculateConfidence = (zScore: number, opposingCount: number): number => {
    let confidence = Math.min(100, (Math.abs(zScore) / 4) * 100);
    if (opposingCount === 0) confidence *= 1.2; // Boost for unique views
    return Math.min(100, confidence);
  };

  const extractCoreBeliefs = (statements: DistinguishingStatement[]): string[] => {
    // Extract top 3-5 most distinguishing statements as core beliefs
    return statements
      .filter(s => s.significance === 'high' || s.uniqueToFactor)
      .slice(0, 5)
      .map(s => s.text);
  };

  const findOppositions = (_factorNum: number, statements: DistinguishingStatement[]): any[] => {
    const oppositions: any[] = [];
    
    // Group by opposing factors
    const opposingMap = new Map<number, DistinguishingStatement[]>();
    statements.forEach(stmt => {
      stmt.opposingFactors.forEach(oppFactor => {
        if (!opposingMap.has(oppFactor)) {
          opposingMap.set(oppFactor, []);
        }
        opposingMap.get(oppFactor)!.push(stmt);
      });
    });
    
    opposingMap.forEach((stmts, oppFactor) => {
      oppositions.push({
        factor: oppFactor,
        conflictingBeliefs: stmts.slice(0, 3).map(s => s.text),
        intensity: calculateOppositionIntensity(stmts)
      });
    });
    
    return oppositions.sort((a, b) => b.intensity - a.intensity);
  };

  const calculateOppositionIntensity = (statements: DistinguishingStatement[]): number => {
    const avgZScore = statements.reduce((sum, s) => sum + Math.abs(s.zScore), 0) / statements.length;
    return Math.min(100, (avgZScore / 4) * 100);
  };

  const calculateUniquenessScore = (statements: DistinguishingStatement[]): number => {
    const uniqueCount = statements.filter(s => s.uniqueToFactor).length;
    const highSigCount = statements.filter(s => s.significance === 'high').length;
    return Math.min(100, ((uniqueCount * 2 + highSigCount) / statements.length) * 100);
  };

  const calculateClarityScore = (statements: DistinguishingStatement[], beliefs: string[]): number => {
    if (statements.length === 0) return 0;
    const avgConfidence = statements.reduce((sum, s) => sum + s.confidence, 0) / statements.length;
    const beliefRatio = beliefs.length / Math.min(5, statements.length);
    return Math.min(100, (avgConfidence * 0.7 + beliefRatio * 30));
  };

  const performContrastAnalysis = () => {
    if (!selectedFactor || !comparisonFactor) return;
    
    const factor1Dist = factorDistinctions.find(d => d.factorNumber === selectedFactor);
    const factor2Dist = factorDistinctions.find(d => d.factorNumber === comparisonFactor);
    
    if (!factor1Dist || !factor2Dist) return;
    
    // Find agreements and disagreements
    const agreements: any[] = [];
    const disagreements: any[] = [];
    
    factor1Dist.distinguishingStatements.forEach(stmt1 => {
      const stmt2 = factor2Dist.distinguishingStatements.find(s => s.number === stmt1.number);
      if (stmt2) {
        if (Math.sign(stmt1.zScore) === Math.sign(stmt2.zScore)) {
          agreements.push({
            statement: stmt1.text,
            strength: Math.min(Math.abs(stmt1.zScore), Math.abs(stmt2.zScore))
          });
        } else {
          disagreements.push({
            statement: stmt1.text,
            factor1Position: stmt1.zScore,
            factor2Position: stmt2.zScore,
            gap: Math.abs(stmt1.zScore - stmt2.zScore)
          });
        }
      }
    });
    
    const similarity = agreements.length / (agreements.length + disagreements.length) * 100;
    
    setContrastAnalysis({
      factor1: selectedFactor,
      factor2: comparisonFactor,
      agreements: agreements.sort((a, b) => b.strength - a.strength),
      disagreements: disagreements.sort((a, b) => b.gap - a.gap),
      overallSimilarity: similarity,
      keyDifference: disagreements[0]?.statement || 'No major differences found'
    });
  };

  const getSignificanceBadge = (level: 'high' | 'medium' | 'low') => {
    const configs = {
      high: { variant: 'destructive' as const, label: 'High' },
      medium: { variant: 'warning' as const, label: 'Medium' },
      low: { variant: 'secondary' as const, label: 'Low' }
    };
    
    const config = configs[level];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const currentDistinction = factorDistinctions.find(d => d.factorNumber === selectedFactor);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-label flex items-center gap-2">
              <FireIcon className="w-6 h-6 text-purple-600" />
              Distinguishing View Analyzer
            </h2>
            <p className="text-sm text-secondary-label mt-1">
              Identify what makes each perspective unique and where they diverge
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'single' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('single')}
            >
              <DocumentMagnifyingGlassIcon className="w-4 h-4" />
              Single
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'compare' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('compare')}
            >
              <ScaleIcon className="w-4 h-4" />
              Compare
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'matrix' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('matrix')}
            >
              <ChartBarIcon className="w-4 h-4" />
              Matrix
            </Button>
          </div>
        </div>

        {/* Analysis Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Threshold:</label>
            <select
              value={thresholdLevel}
              onChange={(e) => setThresholdLevel(e.target.value as any)}
              className="px-3 py-1 text-sm border border-separator rounded-lg"
            >
              <option value="strict">Strict (p &lt; 0.01)</option>
              <option value="moderate">Moderate (p &lt; 0.05)</option>
              <option value="inclusive">Inclusive (p &lt; 0.10)</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExplanations(!showExplanations)}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            {showExplanations ? 'Hide' : 'Show'} Explanations
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={analyzeDistinguishingViews}
            loading={isAnalyzing}
          >
            Analyze Views
          </Button>
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Factor Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3">Select Factor</h3>
            <div className="space-y-2">
              {factors.map((_, index) => {
                const factorNum = index + 1;
                const distinction = factorDistinctions.find(d => d.factorNumber === factorNum);
                return (
                  <div
                    key={factorNum}
                    onClick={() => setSelectedFactor(factorNum)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`p-3 transition-all ${
                        selectedFactor === factorNum 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'hover:bg-system-gray-6'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Factor {factorNum}</span>
                        {distinction && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" size="sm">
                              {distinction.distinguishingStatements.length} views
                            </Badge>
                            <div className="text-xs text-secondary-label">
                              {distinction.uniquenessScore.toFixed(0)}% unique
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </Card>

          {viewMode === 'compare' && (
            <Card className="p-4">
              <h3 className="font-medium text-sm mb-3">Compare With</h3>
              <div className="space-y-2">
                {factors.map((_, index) => {
                  const factorNum = index + 1;
                  if (factorNum === selectedFactor) return null;
                  
                  return (
                    <div
                      key={factorNum}
                      onClick={() => setComparisonFactor(factorNum)}
                      className="cursor-pointer"
                    >
                      <Card
                        className={`p-3 transition-all ${
                          comparisonFactor === factorNum 
                            ? 'ring-2 ring-pink-500 bg-pink-50' 
                            : 'hover:bg-system-gray-6'
                        }`}
                      >
                        <span className="font-medium">Factor {factorNum}</span>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Uniqueness Scores */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-transparent">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <LightBulbIcon className="w-4 h-4 text-purple-600" />
              Uniqueness Scores
            </h3>
            <div className="space-y-2">
              {factorDistinctions
                .sort((a, b) => b.uniquenessScore - a.uniquenessScore)
                .map(dist => (
                  <div key={dist.factorNumber} className="flex items-center justify-between">
                    <span className="text-xs text-secondary-label">Factor {dist.factorNumber}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-system-gray-5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                          style={{ width: `${dist.uniquenessScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{dist.uniquenessScore.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Center/Right Panel - Content */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'single' && currentDistinction && (
            <>
              {/* Distinguishing Statements */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ArrowsPointingOutIcon className="w-5 h-5 text-purple-600" />
                  Distinguishing Statements for Factor {selectedFactor}
                </h3>
                
                <div className="space-y-3">
                  {currentDistinction.distinguishingStatements.map((stmt) => (
                    <Card key={stmt.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" size="sm">#{stmt.number}</Badge>
                          {getSignificanceBadge(stmt.significance)}
                          {stmt.uniqueToFactor && (
                            <Badge variant="default" size="sm">Unique</Badge>
                          )}
                        </div>
                        <div className="text-sm font-mono font-medium">
                          Z: {stmt.zScore.toFixed(2)}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{stmt.text}</p>
                      
                      {showExplanations && stmt.explanation && (
                        <p className="text-xs text-secondary-label italic">
                          {stmt.explanation}
                        </p>
                      )}
                      
                      {stmt.opposingFactors.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-separator">
                          <span className="text-xs text-secondary-label">
                            Opposed by: {stmt.opposingFactors.map(f => `Factor ${f}`).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Confidence Indicator */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary-label">Confidence</span>
                          <span className="text-xs font-medium">{stmt.confidence.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-system-gray-5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                            style={{ width: `${stmt.confidence}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Core Beliefs */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-transparent">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5 text-purple-600" />
                  Core Beliefs
                </h3>
                <div className="space-y-2">
                  {currentDistinction.coreBeliefs.map((belief, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <p className="text-sm">{belief}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Oppositions */}
              {currentDistinction.oppositions.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ExclamationCircleIcon className="w-5 h-5 text-orange-600" />
                    Key Oppositions
                  </h3>
                  <div className="space-y-4">
                    {currentDistinction.oppositions.map((opp) => (
                      <div key={opp.factor} className="border-l-4 border-orange-400 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Against Factor {opp.factor}</span>
                          <Badge variant="warning" size="sm">
                            Intensity: {opp.intensity.toFixed(0)}%
                          </Badge>
                        </div>
                        <ul className="space-y-1">
                          {opp.conflictingBeliefs.map((belief, index) => (
                            <li key={index} className="text-sm text-secondary-label">
                              • {belief}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {viewMode === 'compare' && contrastAnalysis && (
            <>
              {/* Contrast Summary */}
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ScaleIcon className="w-5 h-5 text-purple-600" />
                  Factor {contrastAnalysis.factor1} vs Factor {contrastAnalysis.factor2}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-system-green">
                      {contrastAnalysis.agreements.length}
                    </p>
                    <p className="text-xs text-secondary-label">Agreements</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-system-orange">
                      {contrastAnalysis.disagreements.length}
                    </p>
                    <p className="text-xs text-secondary-label">Disagreements</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-system-blue">
                      {contrastAnalysis.overallSimilarity.toFixed(0)}%
                    </p>
                    <p className="text-xs text-secondary-label">Similarity</p>
                  </div>
                </div>

                <Alert variant="default">
                  <strong>Key Difference:</strong> {contrastAnalysis.keyDifference}
                </Alert>
              </Card>

              {/* Agreements */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ArrowsPointingInIcon className="w-5 h-5 text-system-green" />
                  Points of Agreement
                </h3>
                <div className="space-y-2">
                  {contrastAnalysis.agreements.slice(0, 5).map((agreement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-system-green flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{agreement.statement}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-secondary-label">Strength:</span>
                          <div className="w-20 h-1 bg-system-gray-5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-system-green"
                              style={{ width: `${(agreement.strength / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Disagreements */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ArrowsPointingOutIcon className="w-5 h-5 text-system-orange" />
                  Points of Disagreement
                </h3>
                <div className="space-y-3">
                  {contrastAnalysis.disagreements.slice(0, 5).map((disagreement, index) => (
                    <Card key={index} className="p-3 bg-orange-50 border border-orange-200">
                      <p className="text-sm mb-2">{disagreement.statement}</p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">F{contrastAnalysis.factor1}:</span>
                          <Badge variant={disagreement.factor1Position > 0 ? 'success' : 'destructive'} size="sm">
                            {disagreement.factor1Position.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">F{contrastAnalysis.factor2}:</span>
                          <Badge variant={disagreement.factor2Position > 0 ? 'success' : 'destructive'} size="sm">
                            {disagreement.factor2Position.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Gap:</span>
                          <Badge variant="warning" size="sm">
                            {disagreement.gap.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </>
          )}

          {viewMode === 'matrix' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-purple-600" />
                Distinction Matrix
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-separator">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-secondary-label">Factor</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-secondary-label">Distinguishing</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-secondary-label">Unique</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-secondary-label">Core Beliefs</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-secondary-label">Oppositions</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-secondary-label">Uniqueness</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-secondary-label">Clarity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator">
                    {factorDistinctions.map((dist) => (
                      <tr 
                        key={dist.factorNumber}
                        onClick={() => setSelectedFactor(dist.factorNumber)}
                        className="hover:bg-system-gray-6 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-medium">Factor {dist.factorNumber}</td>
                        <td className="px-4 py-3 text-sm text-center">{dist.distinguishingStatements.length}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {dist.distinguishingStatements.filter(s => s.uniqueToFactor).length}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{dist.coreBeliefs.length}</td>
                        <td className="px-4 py-3 text-sm text-center">{dist.oppositions.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-2 bg-system-gray-5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                                style={{ width: `${dist.uniquenessScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs">{dist.uniquenessScore.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-2 bg-system-gray-5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                                style={{ width: `${dist.clarityScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs">{dist.clarityScore.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Insights Panel */}
      {factorDistinctions.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-purple-600" />
            Key Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {factorDistinctions.reduce((sum, d) => sum + d.distinguishingStatements.filter(s => s.uniqueToFactor).length, 0)}
              </p>
              <p className="text-sm text-secondary-label mt-1">Unique Views</p>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <p className="text-3xl font-bold text-pink-600">
                {Math.max(...factorDistinctions.map(d => d.oppositions.length))}
              </p>
              <p className="text-sm text-secondary-label mt-1">Max Oppositions</p>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {(factorDistinctions.reduce((sum, d) => sum + d.clarityScore, 0) / factorDistinctions.length).toFixed(0)}%
              </p>
              <p className="text-sm text-secondary-label mt-1">Avg Clarity</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Most Distinguishing Factor</h4>
            <p className="text-sm text-secondary-label">
              Factor {factorDistinctions.sort((a, b) => b.uniquenessScore - a.uniquenessScore)[0]?.factorNumber} 
              shows the most unique perspective with {' '}
              {factorDistinctions.sort((a, b) => b.uniquenessScore - a.uniquenessScore)[0]?.distinguishingStatements.filter(s => s.uniqueToFactor).length} 
              {' '} statements that no other factor shares.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Utility imports
import { CheckCircleIcon } from '@heroicons/react/24/solid';