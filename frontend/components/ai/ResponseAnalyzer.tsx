'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useResponseAnalysis } from '@/hooks/useAIBackend';
import { 
  BarChart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Users,
  Activity,
  Sparkles,
  Bot,
  Shield,
  Fingerprint,
  Eye,
  Cpu,
  Timer,
  MousePointer
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
// Tabs components - simple implementation
const Tabs = ({ value, onValueChange, children, ...props }: any) => {
  const [activeTab, setActiveTab] = React.useState(value);
  React.useEffect(() => {
    if (onValueChange) onValueChange(activeTab);
  }, [activeTab, onValueChange]);
  return (
    <div {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};
const TabsList = ({ children, className, ...props }: any) => (
  <div className={`flex space-x-1 rounded-lg bg-muted p-1 ${className}`} {...props}>{children}</div>
);
const TabsTrigger = ({ value, children, activeTab, setActiveTab, ...props }: any) => (
  <button 
    className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-all ${
      activeTab === value ? 'bg-background shadow-sm' : 'hover:bg-background/50'
    }`}
    onClick={() => setActiveTab(value)}
    {...props}
  >
    {children}
  </button>
);
const TabsContent = ({ value, activeTab, children, className, ...props }: any) => {
  if (activeTab !== value) return null;
  return <div className={className} {...props}>{children}</div>
};

interface QSortResponse {
  participantId: string;
  qsort: number[];
  surveyAnswers?: Record<string, any>;
  completionTime?: number;
  timestamp?: Date;
}

interface BotDetectionResult {
  participantId: string;
  botProbability: number;
  humanProbability: number;
  confidence: number;
  flags: string[];
  behavioralMetrics: {
    responseTimeConsistency: number;
    patternRegularity: number;
    linguisticDiversity: number;
    engagementDepth: number;
    temporalClustering: number;
  };
  anomalyScore: number;
  recommendation: 'human' | 'bot' | 'suspicious' | 'review';
}

interface AnalysisResult {
  patterns?: {
    clusters: Array<{
      id: string;
      participantIds: string[];
      characteristics: string[];
      size: number;
    }>;
    trends: string[];
    commonalities: string[];
  };
  quality?: {
    overallScore: number;
    completenessScore: number;
    consistencyScore: number;
    engagementScore: number;
    issues: string[];
  };
  anomalies?: {
    outliers: string[];
    suspicious: string[];
    incomplete: string[];
  };
  insights?: {
    keyFindings: string[];
    recommendations: string[];
    interpretations: string[];
  };
  botDetection?: {
    overallBotRate: number;
    detectedBots: BotDetectionResult[];
    suspiciousResponses: BotDetectionResult[];
    cleanResponses: number;
    detectionConfidence: number;
  };
}

interface ResponseAnalyzerProps {
  responses: QSortResponse[];
  studyId?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  className?: string;
}

export function ResponseAnalyzer({ 
  responses, 
  onAnalysisComplete,
  className 
}: ResponseAnalyzerProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>(['patterns', 'quality']);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [botDetectionEnabled] = useState(true);
  // Bot detection results state removed (unused)
  
  const { loading, error, execute } = useResponseAnalysis();

  // Bot Detection Algorithm Functions
  const detectBotPatterns = useMemo(() => {
    return (response: QSortResponse): BotDetectionResult => {
      const metrics = calculateBehavioralMetrics(response);
      const flags = identifyBotFlags(response, metrics);
      const anomalyScore = calculateAnomalyScore(response, metrics);
      
      // ML-inspired bot probability calculation
      const botProbability = calculateBotProbability(metrics, flags, anomalyScore);
      const humanProbability = 100 - botProbability;
      const confidence = Math.abs(botProbability - 50) * 2; // Confidence increases as we move away from 50/50
      
      return {
        participantId: response.participantId,
        botProbability,
        humanProbability,
        confidence,
        flags,
        behavioralMetrics: metrics,
        anomalyScore,
        recommendation: getRecommendation(botProbability, confidence),
      };
    };
  }, []);

  const calculateBehavioralMetrics = (response: QSortResponse) => {
    const completionTime = response.completionTime || 0;
    const qsort = response.qsort || [];
    
    // Response Time Consistency
    const expectedTime = qsort.length * 5; // 5 seconds per item average
    const responseTimeConsistency = Math.max(0, 100 - Math.abs(completionTime - expectedTime) / expectedTime * 100);
    
    // Pattern Regularity (detect straight-lining, zigzag patterns)
    const patternRegularity = detectPatternRegularity(qsort);
    
    // Linguistic Diversity (for survey answers)
    const linguisticDiversity = response.surveyAnswers 
      ? calculateLinguisticDiversity(response.surveyAnswers)
      : 50;
    
    // Engagement Depth
    const engagementDepth = calculateEngagementDepth(response);
    
    // Temporal Clustering (responses clustered in time)
    const temporalClustering = calculateTemporalClustering(response.timestamp);
    
    return {
      responseTimeConsistency,
      patternRegularity,
      linguisticDiversity,
      engagementDepth,
      temporalClustering,
    };
  };

  const detectPatternRegularity = (qsort: number[]): number => {
    if (!qsort || qsort.length === 0) return 0;
    
    // Check for straight-line patterns
    let consecutiveCount = 0;
    let maxConsecutive = 0;
    
    for (let i = 1; i < qsort.length; i++) {
      if (Math.abs(qsort[i]! - qsort[i-1]!) <= 1) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 0;
      }
    }
    
    // Check for repeating patterns
    const patternLength = Math.min(5, Math.floor(qsort.length / 3));
    let repeatScore = 0;
    
    for (let len = 2; len <= patternLength; len++) {
      for (let start = 0; start < qsort.length - len * 2; start++) {
        const pattern = qsort.slice(start, start + len);
        const nextPattern = qsort.slice(start + len, start + len * 2);
        
        if (pattern.every((val, idx) => val === nextPattern[idx])) {
          repeatScore += len * 10;
        }
      }
    }
    
    // Calculate irregularity score (higher is more human-like)
    const straightLineScore = (maxConsecutive / qsort.length) * 100;
    const irregularity = Math.max(0, 100 - straightLineScore - repeatScore);
    
    return irregularity;
  };

  const calculateLinguisticDiversity = (surveyAnswers: Record<string, any>): number => {
    const textResponses = Object.values(surveyAnswers)
      .filter(v => typeof v === 'string' && v.length > 10);
    
    if (textResponses.length === 0) return 50;
    
    // Calculate vocabulary diversity
    const allWords = textResponses.join(' ').toLowerCase().split(/\s+/);
    const uniqueWords = new Set(allWords);
    const diversity = (uniqueWords.size / allWords.length) * 100;
    
    // Check for repeated phrases (bot indicator)
    const phrases = new Set<string>();
    const repeatedPhrases = new Set<string>();
    
    textResponses.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        if (phrases.has(phrase)) {
          repeatedPhrases.add(phrase);
        }
        phrases.add(phrase);
      }
    });
    
    const repetitionPenalty = (repeatedPhrases.size / phrases.size) * 50;
    
    return Math.max(0, diversity - repetitionPenalty);
  };

  const calculateEngagementDepth = (response: QSortResponse): number => {
    let score = 50; // Base score
    
    // Check completion time (too fast or too slow indicates bot)
    if (response.completionTime) {
      const optimalTime = response.qsort.length * 5000; // 5 seconds per item
      const timeDiff = Math.abs(response.completionTime - optimalTime);
      score += Math.max(-30, Math.min(30, 30 - timeDiff / 1000));
    }
    
    // Check survey answer quality
    if (response.surveyAnswers) {
      const answers = Object.values(response.surveyAnswers);
      const avgLength = answers.reduce((sum: number, ans: any) => {
        return sum + (typeof ans === 'string' ? ans.length : 0);
      }, 0) / answers.length;
      
      score += Math.min(20, avgLength / 10); // Reward longer, thoughtful answers
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateTemporalClustering = (timestamp?: Date): number => {
    if (!timestamp) return 50;
    
    // Check if response came during typical bot hours
    const hour = new Date(timestamp).getHours();
    const isOddHour = hour < 6 || hour > 23;
    
    return isOddHour ? 30 : 70;
  };

  const identifyBotFlags = (response: QSortResponse, metrics: any): string[] => {
    const flags: string[] = [];
    
    // Time-based flags
    if (response.completionTime && response.completionTime < response.qsort.length * 1000) {
      flags.push('Completed too quickly');
    }
    
    if (metrics.responseTimeConsistency < 30) {
      flags.push('Inconsistent response time');
    }
    
    // Pattern-based flags
    if (metrics.patternRegularity < 20) {
      flags.push('Repetitive pattern detected');
    }
    
    // Content-based flags
    if (metrics.linguisticDiversity < 30) {
      flags.push('Low linguistic diversity');
    }
    
    if (response.surveyAnswers) {
      const values = Object.values(response.surveyAnswers);
      const uniqueValues = new Set(values.map(v => JSON.stringify(v)));
      if (uniqueValues.size < values.length / 2) {
        flags.push('Duplicate answers detected');
      }
    }
    
    // Engagement flags
    if (metrics.engagementDepth < 30) {
      flags.push('Low engagement depth');
    }
    
    return flags;
  };

  const calculateAnomalyScore = (_response: QSortResponse, metrics: any): number => {
    // Use statistical anomaly detection
    const scores = [
      metrics.responseTimeConsistency,
      metrics.patternRegularity,
      metrics.linguisticDiversity,
      metrics.engagementDepth,
      metrics.temporalClustering,
    ];
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-scores and anomaly
    const zScores = scores.map(score => Math.abs((score - mean) / (stdDev || 1)));
    const anomalyScore = zScores.reduce((a, b) => a + b, 0) / zScores.length * 20;
    
    return Math.min(100, anomalyScore);
  };

  const calculateBotProbability = (metrics: any, flags: string[], anomalyScore: number): number => {
    // Weighted scoring system
    const weights = {
      responseTime: 0.15,
      pattern: 0.25,
      linguistic: 0.20,
      engagement: 0.20,
      temporal: 0.10,
      anomaly: 0.10,
    };
    
    // Invert metrics (lower scores = more bot-like)
    const botScores = {
      responseTime: 100 - metrics.responseTimeConsistency,
      pattern: 100 - metrics.patternRegularity,
      linguistic: 100 - metrics.linguisticDiversity,
      engagement: 100 - metrics.engagementDepth,
      temporal: 100 - metrics.temporalClustering,
      anomaly: anomalyScore,
    };
    
    let weightedScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      weightedScore += botScores[key as keyof typeof botScores] * weight;
    });
    
    // Add penalty for multiple flags
    const flagPenalty = Math.min(20, flags.length * 4);
    
    return Math.min(100, weightedScore + flagPenalty);
  };

  const getRecommendation = (botProbability: number, confidence: number): 'human' | 'bot' | 'suspicious' | 'review' => {
    if (botProbability >= 80 && confidence >= 70) return 'bot';
    if (botProbability <= 30 && confidence >= 70) return 'human';
    if (botProbability >= 60) return 'suspicious';
    return 'review';
  };

  const runBotDetection = () => {
    if (!responses || responses.length === 0) return;
    
    const detectionResults = responses.map(response => detectBotPatterns(response));
    setBotDetectionResults(detectionResults);
    
    // Calculate overall statistics
    const botCount = detectionResults.filter(r => r.recommendation === 'bot').length;
    // const suspiciousCount = detectionResults.filter(r => r.recommendation === 'suspicious').length;
    const humanCount = detectionResults.filter(r => r.recommendation === 'human').length;
    const overallBotRate = (botCount / responses.length) * 100;
    const avgConfidence = detectionResults.reduce((sum, r) => sum + r.confidence, 0) / detectionResults.length;
    
    // Update analysis result with bot detection
    setAnalysisResult(prev => ({
      ...prev,
      botDetection: {
        overallBotRate,
        detectedBots: detectionResults.filter(r => r.recommendation === 'bot'),
        suspiciousResponses: detectionResults.filter(r => r.recommendation === 'suspicious'),
        cleanResponses: humanCount,
        detectionConfidence: avgConfidence,
      },
    }));
  };

  const handleAnalyze = async () => {
    if (!responses || responses.length === 0) return;

    try {
      const result = await execute({
        responses: responses.map(r => ({
          participantId: r.participantId,
          qsort: r.qsort,
          ...(r.surveyAnswers && { surveyAnswers: r.surveyAnswers }),
          ...(r.completionTime && { completionTime: r.completionTime })
        })),
        analysisTypes: selectedAnalyses as Array<'patterns' | 'quality' | 'anomalies' | 'insights'>
      });

      if (result) {
        setAnalysisResult(result);
        
        // Run bot detection if enabled
        if (botDetectionEnabled) {
          runBotDetection();
        }
        
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  // Auto-analyze when responses change
  useEffect(() => {
    if (responses && responses.length > 0) {
      handleAnalyze();
    }
  }, [responses]);

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Response Analysis
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {responses.length} responses
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Analysis Types</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'patterns', label: 'Pattern Detection', icon: Activity },
              { value: 'quality', label: 'Quality Assessment', icon: CheckCircle },
              { value: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
              { value: 'insights', label: 'Generate Insights', icon: TrendingUp }
            ].map(type => (
              <label 
                key={type.value}
                className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedAnalyses.includes(type.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAnalyses([...selectedAnalyses, type.value]);
                    } else {
                      setSelectedAnalyses(selectedAnalyses.filter(a => a !== type.value));
                    }
                  }}
                  className="h-4 w-4"
                />
                <type.icon className="h-4 w-4" />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || responses.length === 0 || selectedAnalyses.length === 0}
          className="w-full"
        >
          {loading ? (
            <>Analyzing Responses...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Responses
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="botdetection">Bot Detection</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{responses.length}</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
                
                {analysisResult.quality && (
                  <div className="text-center p-3 border rounded">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className={`text-2xl font-bold ${getQualityColor(analysisResult.quality.overallScore)}`}>
                      {analysisResult.quality.overallScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                  </div>
                )}
                
                {analysisResult.patterns?.clusters && (
                  <div className="text-center p-3 border rounded">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{analysisResult.patterns.clusters.length}</div>
                    <div className="text-xs text-muted-foreground">Clusters Found</div>
                  </div>
                )}
              </div>

              {/* Key Findings */}
              {analysisResult.insights?.keyFindings && analysisResult.insights.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Key Findings
                  </h4>
                  <ul className="space-y-1">
                    {analysisResult.insights.keyFindings.slice(0, 3).map((finding, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              {analysisResult.patterns ? (
                <>
                  {/* Clusters */}
                  {analysisResult.patterns.clusters && analysisResult.patterns.clusters.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Participant Clusters</h4>
                      {analysisResult.patterns.clusters.map((cluster, i) => (
                        <div key={cluster.id} className="p-3 border rounded space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Cluster {i + 1}</span>
                            <span className="text-sm text-muted-foreground">
                              {cluster.size} participants
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cluster.characteristics.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trends */}
                  {analysisResult.patterns.trends && analysisResult.patterns.trends.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Identified Trends</h4>
                      {analysisResult.patterns.trends.map((trend, i) => (
                        <div key={i} className="text-sm p-2 bg-secondary rounded">
                          {trend}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No pattern analysis available</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              {analysisResult.quality ? (
                <>
                  {/* Quality Scores */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Overall Quality</span>
                        <span className={`text-sm font-medium ${getQualityColor(analysisResult.quality.overallScore)}`}>
                          {analysisResult.quality.overallScore}% - {getQualityLabel(analysisResult.quality.overallScore)}
                        </span>
                      </div>
                      <Progress value={analysisResult.quality.overallScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Completeness</span>
                        <span className="text-sm font-medium">
                          {analysisResult.quality.completenessScore}%
                        </span>
                      </div>
                      <Progress value={analysisResult.quality.completenessScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Consistency</span>
                        <span className="text-sm font-medium">
                          {analysisResult.quality.consistencyScore}%
                        </span>
                      </div>
                      <Progress value={analysisResult.quality.consistencyScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Engagement</span>
                        <span className="text-sm font-medium">
                          {analysisResult.quality.engagementScore}%
                        </span>
                      </div>
                      <Progress value={analysisResult.quality.engagementScore} className="h-2" />
                    </div>
                  </div>

                  {/* Quality Issues */}
                  {analysisResult.quality.issues && analysisResult.quality.issues.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">Quality Issues Detected:</div>
                        <ul className="text-sm space-y-1">
                          {analysisResult.quality.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No quality analysis available</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {analysisResult.insights ? (
                <>
                  {/* Key Findings */}
                  {analysisResult.insights.keyFindings && analysisResult.insights.keyFindings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Findings</h4>
                      {analysisResult.insights.keyFindings.map((finding, i) => (
                        <div key={i} className="p-3 bg-secondary rounded">
                          <span className="text-sm">{finding}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.insights.recommendations && analysisResult.insights.recommendations.length > 0 && (
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Recommendations</div>
                        <ul className="space-y-1">
                          {analysisResult.insights.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm">• {rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No insights available yet</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="botdetection" className="space-y-4">
              {/* Bot Detection Controls */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Advanced Bot Detection</p>
                    <p className="text-sm text-gray-600">ML-powered behavioral analysis</p>
                  </div>
                </div>
                <Button
                  onClick={runBotDetection}
                  size="sm"
                  variant={botDetectionEnabled ? "default" : "outline"}
                >
                  {botDetectionEnabled ? (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Run Detection
                    </>
                  )}
                </Button>
              </div>

              {analysisResult.botDetection && (
                <>
                  {/* Bot Detection Summary */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 border rounded text-center">
                      <Cpu className="h-6 w-6 mx-auto mb-2 text-red-600" />
                      <div className="text-xl font-bold text-red-600">
                        {analysisResult.botDetection.detectedBots.length}
                      </div>
                      <div className="text-xs text-gray-600">Bots Detected</div>
                    </div>
                    <div className="p-3 border rounded text-center">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                      <div className="text-xl font-bold text-yellow-600">
                        {analysisResult.botDetection.suspiciousResponses.length}
                      </div>
                      <div className="text-xs text-gray-600">Suspicious</div>
                    </div>
                    <div className="p-3 border rounded text-center">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <div className="text-xl font-bold text-green-600">
                        {analysisResult.botDetection.cleanResponses}
                      </div>
                      <div className="text-xs text-gray-600">Human Verified</div>
                    </div>
                    <div className="p-3 border rounded text-center">
                      <Fingerprint className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-xl font-bold text-purple-600">
                        {Math.round(analysisResult.botDetection.detectionConfidence)}%
                      </div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                  </div>

                  {/* Overall Bot Rate */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Bot Contamination Rate</span>
                      <span className={`text-lg font-bold ${
                        analysisResult.botDetection.overallBotRate < 5 ? 'text-green-600' :
                        analysisResult.botDetection.overallBotRate < 15 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(analysisResult.botDetection.overallBotRate)}%
                      </span>
                    </div>
                    <Progress 
                      value={analysisResult.botDetection.overallBotRate} 
                      className="h-3"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      {analysisResult.botDetection.overallBotRate < 5 
                        ? 'Excellent data quality - minimal bot presence'
                        : analysisResult.botDetection.overallBotRate < 15
                        ? 'Moderate data quality - some bot activity detected'
                        : 'Poor data quality - significant bot contamination'}
                    </p>
                  </div>

                  {/* Detected Bots List */}
                  {analysisResult.botDetection.detectedBots.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4 text-red-600" />
                        Detected Bot Responses ({analysisResult.botDetection.detectedBots.length})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {analysisResult.botDetection.detectedBots.map((bot) => (
                          <div key={bot.participantId} className="p-3 border border-red-200 rounded-lg bg-red-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                Participant: {bot.participantId}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                  {Math.round(bot.botProbability)}% Bot
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  {Math.round(bot.confidence)}% Confident
                                </span>
                              </div>
                            </div>
                            
                            {/* Behavioral Metrics */}
                            <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3 text-gray-500" />
                                <span>Time: {Math.round(bot.behavioralMetrics.responseTimeConsistency)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3 text-gray-500" />
                                <span>Pattern: {Math.round(bot.behavioralMetrics.patternRegularity)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MousePointer className="h-3 w-3 text-gray-500" />
                                <span>Engagement: {Math.round(bot.behavioralMetrics.engagementDepth)}%</span>
                              </div>
                            </div>
                            
                            {/* Flags */}
                            {bot.flags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {bot.flags.map((flag, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-white text-red-600 rounded border border-red-200">
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suspicious Responses */}
                  {analysisResult.botDetection.suspiciousResponses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Suspicious Responses ({analysisResult.botDetection.suspiciousResponses.length})
                      </h4>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          These responses show some bot-like characteristics but require manual review.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {analysisResult.botDetection.suspiciousResponses.slice(0, 5).map((suspicious) => (
                          <div key={suspicious.participantId} className="p-2 border border-yellow-200 rounded bg-yellow-50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {suspicious.participantId}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-yellow-700">
                                  {Math.round(suspicious.botProbability)}% Bot Probability
                                </span>
                                <Button size="sm" variant="outline" className="h-6 text-xs">
                                  Review
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <p className="font-medium mb-1">Bot Detection Recommendations:</p>
                      <ul className="text-sm space-y-1">
                        {analysisResult.botDetection.overallBotRate > 10 && (
                          <li>• Consider removing detected bot responses before analysis</li>
                        )}
                        {analysisResult.botDetection.suspiciousResponses.length > 0 && (
                          <li>• Manually review suspicious responses for final determination</li>
                        )}
                        <li>• Use CAPTCHA or response time limits for future data collection</li>
                        <li>• Implement honeypot questions to catch automated responses</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {!analysisResult.botDetection && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Click "Run Detection" to analyze responses for bot patterns using advanced ML algorithms.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default ResponseAnalyzer;