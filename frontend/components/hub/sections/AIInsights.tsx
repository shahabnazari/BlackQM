'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Brain,
  Sparkles,
  FileText,
  Lightbulb,
  BookOpen,
  RefreshCw,
  Download,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { hubAPIService } from '@/lib/services/hub-api.service';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
  studyId: string;
  analysisData?: any;
  onInsightUpdate?: (insights: any) => void;
}

interface FactorNarrative {
  factorNumber: number;
  title: string;
  mainTheme: string;
  narrative: string;
  distinguishingStatements: string[];
  consensusStatements: string[];
  confidence: number;
  participantCount: number;
}

interface StudyRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  rationale: string;
  actionItems: string[];
}

interface InsightCache {
  narratives?: FactorNarrative[];
  recommendations?: StudyRecommendation[];
  biasAnalysis?: any;
  themes?: any[];
  timestamp?: string;
}

/**
 * AI Insights Section - Phase 7 Day 5 Implementation
 * 
 * Central hub for all AI-powered interpretation capabilities
 * Integrates narrative generation, recommendations, bias detection
 * 
 * @features
 * - Factor narrative generation with AI
 * - Study recommendations and action items
 * - Bias detection and validation
 * - Theme extraction and pattern mining
 * - Insight caching for performance
 * - Export capabilities for all insights
 * - Real-time interpretation updates
 */
export function AIInsights({ 
  studyId, 
  analysisData: _analysisData,
  onInsightUpdate 
}: AIInsightsProps) {
  // State management
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('narratives');
  const [narratives, setNarratives] = useState<FactorNarrative[]>([]);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [biasAnalysis, setBiasAnalysis] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<number | null>(null);
  const [insightCache, setInsightCache] = useState<InsightCache>({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load cached insights on mount
  useEffect(() => {
    loadCachedInsights();
  }, [studyId]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAllInsights();
      }, 300000); // Refresh every 5 minutes
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  // Load cached insights from local storage
  const loadCachedInsights = () => {
    const cacheKey = `ai-insights-${studyId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setInsightCache(data);
        if (data.narratives) setNarratives(data.narratives);
        if (data.recommendations) setRecommendations(data.recommendations);
        if (data.biasAnalysis) setBiasAnalysis(data.biasAnalysis);
        if (data.themes) setThemes(data.themes);
      } catch (e: any) {
        console.error('Failed to load cached insights:', e);
      }
    }
  };

  // Save insights to cache
  const saveToCache = (updates: Partial<InsightCache>) => {
    const cacheKey = `ai-insights-${studyId}`;
    const newCache = {
      ...insightCache,
      ...updates,
      timestamp: new Date().toISOString()
    };
    setInsightCache(newCache);
    localStorage.setItem(cacheKey, JSON.stringify(newCache));
  };

  // Generate factor narratives
  const generateNarratives = async () => {
    setGenerating('narratives');
    try {
      const response = await hubAPIService.generateFactorNarratives(studyId, {
        includeDistinguishing: true,
        includeConsensus: true,
        analysisDepth: 'comprehensive'
      });
      
      const narrativeData = response.narratives.map((n: any) => ({
        factorNumber: n.factor,
        title: n.title || `Factor ${n.factor}`,
        mainTheme: n.theme,
        narrative: n.interpretation,
        distinguishingStatements: n.distinguishing || [],
        consensusStatements: n.consensus || [],
        confidence: n.confidence || 0.85,
        participantCount: n.participantCount || 0
      }));
      
      setNarratives(narrativeData);
      saveToCache({ narratives: narrativeData });
      onInsightUpdate?.({ type: 'narratives', data: narrativeData });
    } catch (error: any) {
      console.error('Failed to generate narratives:', error);
    } finally {
      setGenerating(null);
    }
  };

  // Generate study recommendations
  const generateRecommendations = async () => {
    setGenerating('recommendations');
    try {
      const response = await hubAPIService.generateRecommendations(studyId, {
        includeActionItems: true,
        prioritize: true
      });
      
      const recData: StudyRecommendation[] = response.recommendations.map((r: any) => ({
        category: r.category,
        priority: r.priority,
        recommendation: r.text,
        rationale: r.rationale,
        actionItems: r.actions || []
      }));
      
      setRecommendations(recData);
      saveToCache({ recommendations: recData });
      onInsightUpdate?.({ type: 'recommendations', data: recData });
    } catch (error: any) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setGenerating(null);
    }
  };

  // Run bias analysis
  const runBiasAnalysis = async () => {
    setGenerating('bias');
    try {
      const response = await hubAPIService.analyzeBias(studyId, {
        dimensions: ['selection', 'response', 'interpretation', 'demographic'],
        includeRecommendations: true
      });
      
      setBiasAnalysis(response);
      saveToCache({ biasAnalysis: response });
      onInsightUpdate?.({ type: 'bias', data: response });
    } catch (error: any) {
      console.error('Failed to run bias analysis:', error);
    } finally {
      setGenerating(null);
    }
  };

  // Extract themes
  const extractThemes = async () => {
    setGenerating('themes');
    try {
      const response = await hubAPIService.extractThemes(studyId, {
        method: 'ai-powered',
        minOccurrence: 2,
        includeQuotes: true
      });
      
      setThemes(response.themes);
      saveToCache({ themes: response.themes });
      onInsightUpdate?.({ type: 'themes', data: response.themes });
    } catch (error: any) {
      console.error('Failed to extract themes:', error);
    } finally {
      setGenerating(null);
    }
  };

  // Refresh all insights
  const refreshAllInsights = async () => {
    setLoading(true);
    await Promise.all([
      generateNarratives(),
      generateRecommendations(),
      runBiasAnalysis(),
      extractThemes()
    ]);
    setLoading(false);
  };

  // Export insights
  const exportInsights = () => {
    const exportData = {
      studyId,
      timestamp: new Date().toISOString(),
      narratives,
      recommendations,
      biasAnalysis,
      themes
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-insights-${studyId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render factor narrative card
  const renderNarrativeCard = (narrative: FactorNarrative) => (
    <Card 
      key={narrative.factorNumber}
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        selectedFactor === narrative.factorNumber && "ring-2 ring-primary"
      )}
      onClick={() => setSelectedFactor(narrative.factorNumber)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Factor {narrative.factorNumber}: {narrative.title}
          </CardTitle>
          <Badge variant="secondary">
            {narrative.participantCount} participants
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Main Theme</p>
          <p className="text-sm">{narrative.mainTheme}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">AI-Generated Narrative</p>
          <p className="text-sm line-clamp-4">{narrative.narrative}</p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {Math.round(narrative.confidence * 100)}% confidence
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  // Render recommendation card
  const renderRecommendationCard = (rec: StudyRecommendation) => (
    <Card key={`${rec.category}-${rec.recommendation.slice(0, 20)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">{rec.category}</CardTitle>
          </div>
          <Badge 
            variant={
              rec.priority === 'high' ? 'destructive' :
              rec.priority === 'medium' ? 'default' :
              'secondary'
            }
          >
            {rec.priority} priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{rec.recommendation}</p>
        
        {rec.rationale && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Rationale</p>
            <p className="text-xs">{rec.rationale}</p>
          </div>
        )}
        
        {rec.actionItems.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Action Items</p>
            <ul className="space-y-1">
              {rec.actionItems.map((item, idx) => (
                <li key={idx} className="text-xs flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render bias analysis
  const renderBiasAnalysis = () => (
    <div className="space-y-4">
      {biasAnalysis ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Overall Bias Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(biasAnalysis.dimensions || {}).map(([dimension, data]: [string, any]) => (
                  <div key={dimension}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {dimension} Bias
                      </span>
                      <Badge variant={data.level === 'low' ? 'default' : data.level === 'medium' ? 'secondary' : 'destructive'}>
                        {data.level}
                      </Badge>
                    </div>
                    <Progress value={data.score * 100} className="h-2" />
                    {data.recommendation && (
                      <p className="text-xs text-muted-foreground mt-1">{data.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {biasAnalysis.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bias Mitigation Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {biasAnalysis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No bias analysis available. Click "Analyze Bias" to generate.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render theme extraction
  const renderThemeExtraction = () => (
    <div className="space-y-4">
      {themes.length > 0 ? (
        themes.map((theme, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {theme.name}
                </CardTitle>
                <Badge>{theme.occurrences} occurrences</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{theme.description}</p>
              
              {theme.quotes && theme.quotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Supporting Quotes</p>
                  {theme.quotes.slice(0, 3).map((quote: string, qIdx: number) => (
                    <blockquote key={qIdx} className="text-xs italic border-l-2 pl-3 text-muted-foreground">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              )}
              
              {theme.keywords && (
                <div className="flex flex-wrap gap-1">
                  {theme.keywords.map((keyword: string, kIdx: number) => (
                    <Badge key={kIdx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No themes extracted yet. Click "Extract Themes" to analyze.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI-Powered Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Advanced interpretation and narrative generation
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="auto-refresh" className="text-sm">Auto-refresh</label>
            <Switch 
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllInsights}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportInsights}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-4">
            <Button
              variant={generating === 'narratives' ? 'default' : 'outline'}
              onClick={generateNarratives}
              disabled={generating !== null}
              className="flex flex-col h-auto py-4"
            >
              {generating === 'narratives' ? (
                <LoadingSpinner className="h-5 w-5 mb-2" />
              ) : (
                <FileText className="h-5 w-5 mb-2" />
              )}
              <span className="text-xs">Generate Narratives</span>
            </Button>
            
            <Button
              variant={generating === 'recommendations' ? 'default' : 'outline'}
              onClick={generateRecommendations}
              disabled={generating !== null}
              className="flex flex-col h-auto py-4"
            >
              {generating === 'recommendations' ? (
                <LoadingSpinner className="h-5 w-5 mb-2" />
              ) : (
                <Lightbulb className="h-5 w-5 mb-2" />
              )}
              <span className="text-xs">Get Recommendations</span>
            </Button>
            
            <Button
              variant={generating === 'bias' ? 'default' : 'outline'}
              onClick={runBiasAnalysis}
              disabled={generating !== null}
              className="flex flex-col h-auto py-4"
            >
              {generating === 'bias' ? (
                <LoadingSpinner className="h-5 w-5 mb-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 mb-2" />
              )}
              <span className="text-xs">Analyze Bias</span>
            </Button>
            
            <Button
              variant={generating === 'themes' ? 'default' : 'outline'}
              onClick={extractThemes}
              disabled={generating !== null}
              className="flex flex-col h-auto py-4"
            >
              {generating === 'themes' ? (
                <LoadingSpinner className="h-5 w-5 mb-2" />
              ) : (
                <BookOpen className="h-5 w-5 mb-2" />
              )}
              <span className="text-xs">Extract Themes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="narratives" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Narratives
            {narratives.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {narratives.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
            {recommendations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {recommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bias" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Bias Analysis
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Themes
            {themes.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {themes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="h-[600px] pr-4 overflow-y-auto">
          <TabsContent value="narratives" className="space-y-4 mt-4">
            {generating === 'narratives' ? (
              <LoadingSkeleton />
            ) : narratives.length > 0 ? (
              <div className="grid gap-4">
                {narratives.map(renderNarrativeCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Narratives Generated</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Generate Narratives" to create AI-powered factor interpretations
                  </p>
                  <Button onClick={generateNarratives}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-4">
            {generating === 'recommendations' ? (
              <LoadingSkeleton />
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map(renderRecommendationCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate AI-powered recommendations for your study
                  </p>
                  <Button onClick={generateRecommendations}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Recommendations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bias" className="mt-4">
            {generating === 'bias' ? (
              <LoadingSkeleton />
            ) : (
              renderBiasAnalysis()
            )}
          </TabsContent>

          <TabsContent value="themes" className="mt-4">
            {generating === 'themes' ? (
              <LoadingSkeleton />
            ) : (
              renderThemeExtraction()
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Cache Status */}
      {insightCache.timestamp && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Insights cached at {new Date(insightCache.timestamp).toLocaleString()}
            {autoRefresh && ' • Auto-refresh enabled (every 5 minutes)'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}