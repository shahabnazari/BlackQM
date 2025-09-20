'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Brain, 
  Sparkles, 
  AlertCircle,
  UserCheck,
  Activity,
  Target,
  Download,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { aiBackendService } from '@/lib/services/ai-backend.service';
import { hubAPIService } from '@/lib/services/hub-api.service';

interface ResponseAnalyzerProps {
  studyId: string;
  responses?: any[];
  onInsightsGenerated?: (insights: any) => void;
}

/**
 * AI Response Analyzer Component - Phase 7 Day 3 Implementation
 * 
 * Integrates Phase 6.86b Response Analyzer AI
 * Enterprise-grade AI-powered response analysis
 * 
 * @features
 * - Pattern detection across Q-sorts
 * - Quality assessment and anomaly detection
 * - Participant behavior insights
 * - Response consistency validation
 * - AI-powered interpretations
 * - Real-time analysis updates
 */
export function ResponseAnalyzer({ 
  studyId, 
  responses: initialResponses,
  onInsightsGenerated 
}: ResponseAnalyzerProps) {
  const [responses, setResponses] = useState(initialResponses || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<'patterns' | 'quality' | 'anomalies' | 'insights'>('patterns');

  const [analysisConfig, setAnalysisConfig] = useState({
    includePatterns: true,
    includeQuality: true,
    includeAnomalies: true,
    includeInsights: true,
    depth: 'comprehensive' as 'quick' | 'comprehensive',
    generateReport: true,
    compareWithBaseline: false,
    identifyConsensus: true,
    flagOutliers: true,
  });

  // Load responses if not provided
  useEffect(() => {
    if (!initialResponses && studyId) {
      loadResponses();
    }
  }, [studyId, initialResponses]);

  const loadResponses = async () => {
    try {
      const hubData = await hubAPIService.getHubData(studyId);
      setResponses(hubData.qsorts.data);
    } catch (err: any) {
      setError('Failed to load responses');
    }
  };

  const runAIAnalysis = async () => {
    if (!responses || responses.length === 0) {
      setError('No responses available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Prepare analysis types based on configuration
      const analysisTypes: ('patterns' | 'quality' | 'anomalies' | 'insights')[] = [];
      if (analysisConfig.includePatterns) analysisTypes.push('patterns');
      if (analysisConfig.includeQuality) analysisTypes.push('quality');
      if (analysisConfig.includeAnomalies) analysisTypes.push('anomalies');
      if (analysisConfig.includeInsights) analysisTypes.push('insights');

      // Call AI backend service
      const results = await aiBackendService.analyzeResponses({
        responses: responses.map(r => ({
          participantId: r.participantId,
          qsort: r.rankings ? Object.values(r.rankings) : [],
          surveyAnswers: r.surveyData,
          completionTime: r.duration,
        })),
        analysisTypes,
      });

      setAnalysisResults(results);
      onInsightsGenerated?.(results);

      // Save to backend for future reference
      if (analysisConfig.generateReport) {
        await hubAPIService.generateAnalysisReport(studyId, results);
      }
    } catch (err: any) {
      setError(err.message || 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderPatternAnalysis = () => {
    if (!analysisResults?.patterns) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pattern Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dominant Perspectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysisResults.patterns.dominantPerspectives?.map((perspective: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{perspective.name}</span>
                    <Badge>{perspective.frequency}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Clustering Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Identified Clusters</span>
                  <Badge variant="secondary">{analysisResults.patterns.clusterCount || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cohesion Score</span>
                  <Badge variant="secondary">{analysisResults.patterns.cohesionScore || '0%'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {analysisResults.patterns.consensusStatements && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Consensus Statements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysisResults.patterns.consensusStatements.map((statement: any, idx: number) => (
                  <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="text-sm">{statement.text}</p>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Agreement: {statement.agreement}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderQualityAnalysis = () => {
    if (!analysisResults?.quality) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quality Assessment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overall Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysisResults.quality.overallScore || 0}/100
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {analysisResults.quality.rating || 'Good'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Response Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysisResults.quality.consistencyScore || 0}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {analysisResults.quality.consistentParticipants || 0} consistent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Engagement Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysisResults.quality.engagementLevel || 'High'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Based on completion time & patterns
              </p>
            </CardContent>
          </Card>
        </div>

        {analysisResults.quality.warnings && analysisResults.quality.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Quality Warnings</div>
              <ul className="list-disc list-inside space-y-1">
                {analysisResults.quality.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderAnomalyAnalysis = () => {
    if (!analysisResults?.anomalies) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Anomaly Detection</h3>
        
        {analysisResults.anomalies.detected ? (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {analysisResults.anomalies.count} anomalies detected in response data
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {analysisResults.anomalies.details?.map((anomaly: any, idx: number) => (
                <Card key={idx} className="border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Participant {anomaly.participantId}</span>
                      <Badge variant="destructive">{anomaly.type}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {anomaly.description}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs font-semibold">Confidence: </span>
                      <span className="text-xs">{anomaly.confidence}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              No significant anomalies detected. All responses appear valid.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderInsights = () => {
    if (!analysisResults?.insights) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
        
        <div className="space-y-3">
          {analysisResults.insights.keyFindings?.map((finding: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  {finding.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{finding.description}</p>
                {finding.recommendations && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-xs font-semibold mb-1">Recommendation:</p>
                    <p className="text-xs">{finding.recommendations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {analysisResults.insights.interpretation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Overall Interpretation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysisResults.insights.interpretation}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Response Analyzer
            <Badge variant="secondary">Phase 6.86b Integration</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {analysisResults && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => hubAPIService.downloadResults(studyId, 'excel')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            <Button
              onClick={runAIAnalysis}
              disabled={isAnalyzing || responses.length === 0}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Configuration Panel */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Pattern Detection</label>
              <Switch
                checked={analysisConfig.includePatterns}
                onCheckedChange={(v: boolean) => setAnalysisConfig({...analysisConfig, includePatterns: v})}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Quality Check</label>
              <Switch
                checked={analysisConfig.includeQuality}
                onCheckedChange={(v: boolean) => setAnalysisConfig({...analysisConfig, includeQuality: v})}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Anomaly Detection</label>
              <Switch
                checked={analysisConfig.includeAnomalies}
                onCheckedChange={(v: boolean) => setAnalysisConfig({...analysisConfig, includeAnomalies: v})}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">AI Insights</label>
              <Switch
                checked={analysisConfig.includeInsights}
                onCheckedChange={(v: boolean) => setAnalysisConfig({...analysisConfig, includeInsights: v})}
              />
            </div>
          </div>
        </div>

        {/* Response Summary */}
        {responses.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Responses</div>
              <div className="text-xl font-bold">{responses.length}</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
              <div className="text-xl font-bold">
                {responses.filter((r: any) => r.completedAt).length}
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
              <div className="text-xl font-bold">
                {Math.round(responses.reduce((sum: number, r: any) => sum + (r.duration || 0), 0) / responses.length)} min
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults ? (
          <Tabs value={selectedAnalysis} onValueChange={(v: any) => setSelectedAnalysis(v)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="patterns" className="mt-4">
              {renderPatternAnalysis()}
            </TabsContent>
            
            <TabsContent value="quality" className="mt-4">
              {renderQualityAnalysis()}
            </TabsContent>
            
            <TabsContent value="anomalies" className="mt-4">
              {renderAnomalyAnalysis()}
            </TabsContent>
            
            <TabsContent value="insights" className="mt-4">
              {renderInsights()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Run AI analysis to generate insights
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}