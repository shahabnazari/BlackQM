'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles
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
  
  const { loading, error, execute } = useResponseAnalysis();

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
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
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default ResponseAnalyzer;