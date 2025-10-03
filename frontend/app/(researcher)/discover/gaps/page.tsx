/**
 * Research Gaps Analysis - DISCOVER Phase
 * World-class implementation for identifying research opportunities
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  AlertCircle,
  Target,
  BarChart3,
  Activity,
  Users,
  Calendar,
  BookOpen,
  Brain,
  Sparkles,
  Download,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Microscope,
  Telescope,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { literatureAPI } from '@/lib/services/literature-api.service';

interface ResearchGap {
  id: string;
  title: string;
  description: string;
  field: string;
  subfield: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  feasibility: 'high' | 'medium' | 'low';
  novelty: number; // 0-100
  impact: number; // 0-100
  relatedPapers: number;
  suggestedMethods: string[];
  estimatedDuration: string;
  requiredExpertise: string[];
  potentialChallenges: string[];
  opportunityScore: number; // 0-100
  trend: 'emerging' | 'stable' | 'declining';
  lastUpdated: Date;
  citations: {
    supporting: number;
    contradicting: number;
    neutral: number;
  };
  qMethodologyRelevance: boolean;
}

interface GapCategory {
  id: string;
  name: string;
  description: string;
  gapCount: number;
  avgImportance: number;
  color: string;
  icon: React.ElementType;
}

interface TrendData {
  period: string;
  publications: number;
  citations: number;
  gaps: number;
}

const GAP_CATEGORIES: GapCategory[] = [
  {
    id: 'methodological',
    name: 'Methodological Gaps',
    description: 'Gaps in research methods and approaches',
    gapCount: 0,
    avgImportance: 0,
    color: 'purple',
    icon: Microscope,
  },
  {
    id: 'theoretical',
    name: 'Theoretical Gaps',
    description: 'Gaps in theoretical frameworks and models',
    gapCount: 0,
    avgImportance: 0,
    color: 'blue',
    icon: Brain,
  },
  {
    id: 'empirical',
    name: 'Empirical Gaps',
    description: 'Gaps in empirical evidence and data',
    gapCount: 0,
    avgImportance: 0,
    color: 'green',
    icon: BarChart3,
  },
  {
    id: 'technological',
    name: 'Technological Gaps',
    description: 'Gaps in technology application and innovation',
    gapCount: 0,
    avgImportance: 0,
    color: 'orange',
    icon: Zap,
  },
];

export default function ResearchGapsPage() {
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<ResearchGap | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'opportunity' | 'impact' | 'novelty' | 'recent'
  >('opportunity');
  const [aiAnalysisActive, setAiAnalysisActive] = useState(false);
  const [showQMethodOnly, setShowQMethodOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 9 Day 16: Advanced predictive features
  const [fundingProbability, setFundingProbability] = useState<any>(null);
  const [timelineOptimization, setTimelineOptimization] = useState<any>(null);
  const [impactPrediction, setImpactPrediction] = useState<any>(null);
  const [trendForecasts, setTrendForecasts] = useState<any[]>([]);
  const [showAdvancedView, setShowAdvancedView] = useState(false);

  // Fetch real research gaps from backend (Phase 9 Days 14-15)
  useEffect(() => {
    async function fetchResearchGaps() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('📊 Fetching research gaps from backend...');

        // Step 1: Get user's saved papers
        const library = await literatureAPI.getUserLibrary(1, 100);
        const paperIds = library.papers.map(p => p.id);

        if (paperIds.length === 0) {
          console.log('⚠️ No papers in library - showing empty state');
          setGaps([]);
          setIsLoading(false);
          return;
        }

        console.log(`📚 Found ${paperIds.length} papers in library`);

        // Step 2: Analyze gaps from papers
        const analyzedGaps = await literatureAPI.analyzeGapsFromPapers(paperIds);
        console.log(`🔍 Analyzed ${analyzedGaps.length} research gaps`);

        // Step 3: Score opportunities with predictive ML model (Phase 9 Day 15)
        const gapIds = analyzedGaps.map((g: any) => g.id);
        const scoredResult = await literatureAPI.scoreResearchOpportunities(gapIds);

        console.log(`💎 Scored ${scoredResult.opportunities.length} opportunities`);

        // Step 4: Transform backend data to frontend format
        const transformedGaps: ResearchGap[] = scoredResult.opportunities.map((opp: any) => {
          const originalGap = analyzedGaps.find((g: any) => g.id === opp.gapId);

          return {
            id: opp.gapId,
            title: opp.topic,
            description: opp.description,
            field: originalGap?.field || 'General',
            subfield: originalGap?.keywords || [],
            importance: opp.opportunityScore > 0.8 ? 'critical' :
                       opp.opportunityScore > 0.6 ? 'high' :
                       opp.opportunityScore > 0.4 ? 'medium' : 'low',
            feasibility: opp.scoringFactors.feasibility > 0.7 ? 'high' :
                        opp.scoringFactors.feasibility > 0.5 ? 'medium' : 'low',
            novelty: Math.round(opp.scoringFactors.novelty * 100),
            impact: Math.round(opp.scoringFactors.impact * 100),
            relatedPapers: originalGap?.relatedPapers || 0,
            suggestedMethods: [opp.suggestedMethodology],
            estimatedDuration: `${opp.optimalTimeline.totalMonths} months`,
            requiredExpertise: opp.suggestedCollaborators.map((c: any) => c.expertise[0]),
            potentialChallenges: [],
            opportunityScore: Math.round(opp.opportunityScore * 100),
            trend: opp.scoringFactors.timeliness > 0.7 ? 'emerging' :
                   opp.scoringFactors.timeliness > 0.3 ? 'stable' : 'declining',
            lastUpdated: new Date(),
            citations: {
              supporting: 0,
              contradicting: 0,
              neutral: 0,
            },
            qMethodologyRelevance: opp.qMethodologyFit > 0.5,
          };
        });

        setGaps(transformedGaps);
        console.log(`✅ Loaded ${transformedGaps.length} research gaps successfully`);
      } catch (err: any) {
        console.error('❌ Failed to fetch research gaps:', err);
        setError(err.message || 'Failed to load research gaps');
        // Keep empty gaps array on error
        setGaps([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResearchGaps();
  }, []);

  // Filter and sort gaps
  const filteredGaps = useMemo(() => {
    let filtered = [...gaps];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        gap =>
          gap.title.toLowerCase().includes(query) ||
          gap.description.toLowerCase().includes(query) ||
          gap.field.toLowerCase().includes(query) ||
          gap.subfield.some(sf => sf.toLowerCase().includes(query))
      );
    }

    // Apply field filter
    if (filterField !== 'all') {
      filtered = filtered.filter(gap => gap.field === filterField);
    }

    // Apply importance filter
    if (filterImportance !== 'all') {
      filtered = filtered.filter(gap => gap.importance === filterImportance);
    }

    // Apply Q methodology filter
    if (showQMethodOnly) {
      filtered = filtered.filter(gap => gap.qMethodologyRelevance);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'opportunity':
          return b.opportunityScore - a.opportunityScore;
        case 'impact':
          return b.impact - a.impact;
        case 'novelty':
          return b.novelty - a.novelty;
        case 'recent':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    gaps,
    searchQuery,
    filterField,
    filterImportance,
    showQMethodOnly,
    sortBy,
  ]);

  // Calculate category stats
  const categoryStats = useMemo(() => {
    return GAP_CATEGORIES.map(category => {
      const categoryGaps = gaps.filter(gap => {
        // Simple categorization based on keywords
        if (category.id === 'methodological') {
          return (
            gap.title.toLowerCase().includes('method') ||
            gap.subfield.some(sf => sf.toLowerCase().includes('method'))
          );
        }
        if (category.id === 'theoretical') {
          return (
            gap.title.toLowerCase().includes('theor') ||
            gap.subfield.some(sf => sf.toLowerCase().includes('theor'))
          );
        }
        if (category.id === 'empirical') {
          return (
            gap.description.toLowerCase().includes('empirical') ||
            gap.subfield.some(sf => sf.toLowerCase().includes('data'))
          );
        }
        if (category.id === 'technological') {
          return (
            gap.title.toLowerCase().includes('tech') ||
            gap.title.toLowerCase().includes('digital') ||
            gap.subfield.some(sf => sf.toLowerCase().includes('tech'))
          );
        }
        return false;
      });

      const importanceScore = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      const avgImportance =
        categoryGaps.length > 0
          ? categoryGaps.reduce(
              (sum, gap) => sum + importanceScore[gap.importance],
              0
            ) / categoryGaps.length
          : 0;

      return {
        ...category,
        gapCount: categoryGaps.length,
        avgImportance,
      };
    });
  }, [gaps]);

  // Generate trend data
  const trendData: TrendData[] = [
    { period: '2020', publications: 120, citations: 3200, gaps: 15 },
    { period: '2021', publications: 145, citations: 3800, gaps: 18 },
    { period: '2022', publications: 178, citations: 4500, gaps: 22 },
    { period: '2023', publications: 210, citations: 5200, gaps: 28 },
    { period: '2024', publications: 95, citations: 2100, gaps: 12 },
  ];

  // Run AI analysis
  const runAiAnalysis = async () => {
    setAiAnalysisActive(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update gaps with AI insights
    setGaps(prev =>
      prev.map(gap => ({
        ...gap,
        opportunityScore: Math.min(
          100,
          gap.opportunityScore + Math.random() * 10
        ),
      }))
    );

    setAiAnalysisActive(false);
  };

  // Export gaps report
  const exportReport = (format: 'pdf' | 'json' | 'csv') => {
    const data = {
      gaps: filteredGaps,
      categories: categoryStats,
      generated: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'research-gaps-analysis.json';
      a.click();
    }
  };

  // Phase 9 Day 16: Load funding probability details
  const loadFundingProbability = async (gapId: string) => {
    try {
      console.log(`💰 Loading funding probability for gap ${gapId}...`);
      const result = await literatureAPI.predictFundingProbability([gapId]);
      const opportunity = result.fundingOpportunities?.[0] || result.highProbability?.[0];
      setFundingProbability(opportunity);
      console.log(`✓ Loaded funding probability: ${opportunity ? (opportunity.probability * 100).toFixed(1) : 'N/A'}%`);
    } catch (err: any) {
      console.error('❌ Failed to load funding probability:', err);
    }
  };

  // Phase 9 Day 16: Load timeline optimization
  const loadTimelineOptimization = async (gapId: string) => {
    try {
      console.log(`⏱️ Loading timeline optimization for gap ${gapId}...`);
      const result = await literatureAPI.getTimelineOptimizations([gapId]);
      const timeline = result.timelines?.[0];
      setTimelineOptimization(timeline);
      console.log(`✓ Loaded timeline optimization`);
    } catch (err: any) {
      console.error('❌ Failed to load timeline optimization:', err);
    }
  };

  // Phase 9 Day 16: Load impact prediction
  const loadImpactPrediction = async (gapId: string) => {
    try {
      console.log(`📈 Loading impact prediction for gap ${gapId}...`);
      const result = await literatureAPI.predictImpact([gapId]);
      const prediction = result.predictions?.[0] || result.transformativeOpportunities?.[0];
      setImpactPrediction(prediction);
      console.log(`✓ Loaded impact prediction`);
    } catch (err: any) {
      console.error('❌ Failed to load impact prediction:', err);
    }
  };

  // Phase 9 Day 16: Load trend forecasting
  const loadTrendForecasts = async () => {
    try {
      console.log(`📊 Loading trend forecasts for gap topics...`);
      const topics = gaps.slice(0, 5).map(g => g.title);
      const result = await literatureAPI.forecastTrends(topics);
      setTrendForecasts(result.forecasts || []);
      console.log(`✓ Loaded ${result.forecasts?.length || 0} trend forecasts`);
    } catch (err: any) {
      console.error('❌ Failed to load trend forecasts:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Research Gaps Analysis
          </h1>
          <p className="text-gray-600">
            Discover unexplored research opportunities in your field
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <Card className="border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-blue-900">Analyzing Research Gaps...</p>
                  <p className="text-sm text-gray-600">Using AI to identify opportunities in your literature</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Error Loading Research Gaps</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && gaps.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Papers in Library</h3>
              <p className="text-gray-600 mb-4">
                Add papers to your library to analyze research gaps
              </p>
              <Button
                onClick={() => window.location.href = '/discover/literature'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Search Literature
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {!isLoading && !error && gaps.length > 0 && (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4"
        >
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Total Gaps</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {gaps.length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Identified</p>
                </div>
                <Telescope className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Critical Gaps</p>
                  <p className="text-2xl font-bold text-red-900">
                    {gaps.filter(g => g.importance === 'critical').length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">High Priority</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">High Impact</p>
                  <p className="text-2xl font-bold text-green-900">
                    {gaps.filter(g => g.impact >= 80).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Opportunities</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Q-Method Relevant</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {gaps.filter(g => g.qMethodologyRelevance).length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Opportunities</p>
                </div>
                <Brain className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search research gaps..."
                    className="pl-9"
                  />
                </div>

                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="Environmental Science">
                      Environmental Science
                    </SelectItem>
                    <SelectItem value="Research Methods">
                      Research Methods
                    </SelectItem>
                    <SelectItem value="Psychology">Psychology</SelectItem>
                    <SelectItem value="Computational Social Science">
                      Computational Social Science
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterImportance}
                  onValueChange={setFilterImportance}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="impact">Impact</SelectItem>
                    <SelectItem value="novelty">Novelty</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showQMethodOnly ? 'default' : 'outline'}
                  onClick={() => setShowQMethodOnly(!showQMethodOnly)}
                  className={cn(
                    showQMethodOnly &&
                      'bg-gradient-to-r from-purple-600 to-blue-600'
                  )}
                >
                  Q-Method
                </Button>

                <Button
                  onClick={runAiAnalysis}
                  disabled={aiAnalysisActive}
                  variant="outline"
                >
                  {aiAnalysisActive ? (
                    <span className="animate-pulse flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      AI Analysis
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={() => exportReport('json')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Categories Sidebar */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Gap Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                {categoryStats.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setExpandedCategories(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(category.id)) {
                            newSet.delete(category.id);
                          } else {
                            newSet.add(category.id);
                          }
                          return newSet;
                        });
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="w-4 h-4"
                            style={{ color: `var(--${category.color}-500)` }}
                          />
                          <span className="text-sm font-medium">
                            {category.name}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.gapCount}
                        </Badge>
                      </div>
                      <Progress
                        value={category.avgImportance * 25}
                        className="h-1"
                      />
                      {expandedCategories.has(category.id) && (
                        <p className="text-xs text-gray-600 mt-2">
                          {category.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Research Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {trendData.map(data => (
                    <div key={data.period} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{data.period}</span>
                        <span className="font-medium">{data.gaps} gaps</span>
                      </div>
                      <Progress
                        value={(data.gaps / 30) * 100}
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gaps List */}
          <div className="col-span-9 space-y-4">
            {filteredGaps.map((gap, index) => (
              <motion.div
                key={gap.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'hover:shadow-lg transition-all cursor-pointer',
                    selectedGap?.id === gap.id && 'ring-2 ring-purple-400'
                  )}
                  onClick={() => setSelectedGap(gap)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {gap.title}
                          </h3>
                          <Badge
                            className={cn(
                              gap.importance === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : gap.importance === 'high'
                                  ? 'bg-orange-100 text-orange-700'
                                  : gap.importance === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {gap.importance}
                          </Badge>
                          {gap.qMethodologyRelevance && (
                            <Badge className="bg-purple-100 text-purple-700">
                              Q-Method
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              gap.trend === 'emerging'
                                ? 'border-green-500 text-green-600'
                                : gap.trend === 'stable'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-red-500 text-red-600'
                            )}
                          >
                            {gap.trend === 'emerging' ? (
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                            ) : gap.trend === 'declining' ? (
                              <ArrowDownRight className="w-3 h-3 mr-1" />
                            ) : null}
                            {gap.trend}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {gap.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {gap.opportunityScore}
                        </div>
                        <p className="text-xs text-gray-500">
                          Opportunity Score
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Impact</p>
                        <div className="flex items-center gap-2">
                          <Progress value={gap.impact} className="flex-1 h-2" />
                          <span className="text-xs font-medium">
                            {gap.impact}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Novelty</p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={gap.novelty}
                            className="flex-1 h-2"
                          />
                          <span className="text-xs font-medium">
                            {gap.novelty}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Feasibility</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            gap.feasibility === 'high'
                              ? 'border-green-500 text-green-600'
                              : gap.feasibility === 'medium'
                                ? 'border-yellow-500 text-yellow-600'
                                : 'border-red-500 text-red-600'
                          )}
                        >
                          {gap.feasibility}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-xs font-medium">
                          {gap.estimatedDuration}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {gap.relatedPapers} papers
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {gap.requiredExpertise.length} skills
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Updated {gap.lastUpdated.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {gap.subfield.slice(0, 2).map(field => (
                          <Badge
                            key={field}
                            variant="secondary"
                            className="text-xs"
                          >
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedGap?.id === gap.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t space-y-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Suggested Methods:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {gap.suggestedMethods.map(method => (
                              <Badge
                                key={method}
                                variant="outline"
                                className="text-xs"
                              >
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Required Expertise:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {gap.requiredExpertise.map(skill => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Potential Challenges:
                          </p>
                          <ul className="space-y-1">
                            {gap.potentialChallenges.map(challenge => (
                              <li
                                key={challenge}
                                className="text-xs text-gray-600 flex items-start"
                              >
                                <AlertCircle className="w-3 h-3 mr-2 mt-0.5 text-yellow-500" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Phase 9 Day 16: Advanced Predictive Features */}
                        <div className="space-y-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">
                            Advanced Predictions:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadFundingProbability(gap.id);
                                setShowAdvancedView(true);
                              }}
                            >
                              💰 Funding Probability
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadTimelineOptimization(gap.id);
                                setShowAdvancedView(true);
                              }}
                            >
                              ⏱️ Timeline Optimization
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadImpactPrediction(gap.id);
                                setShowAdvancedView(true);
                              }}
                            >
                              📈 Impact Forecast
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadTrendForecasts();
                                setShowAdvancedView(true);
                              }}
                            >
                              📊 Trend Analysis
                            </Button>
                          </div>

                          {/* Show Advanced View Details */}
                          {showAdvancedView && (
                            <div className="mt-4 space-y-4">
                              {/* Funding Probability Details */}
                              {fundingProbability && (
                                <Card className="border-green-200 bg-green-50">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                      <Activity className="w-4 h-4" />
                                      Funding Probability: {(fundingProbability.probability * 100).toFixed(1)}%
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      {fundingProbability.matchedGrants && fundingProbability.matchedGrants.length > 0 && (
                                        <div>
                                          <p className="font-medium text-gray-700">Matched Grant Types:</p>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {fundingProbability.matchedGrants.map((grant: any, idx: number) => (
                                              <Badge key={idx} variant="outline" className="text-xs">
                                                {grant.type} ({Math.round(grant.match * 100)}%)
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {fundingProbability.reasoning && (
                                        <p className="text-gray-600 text-xs mt-2">
                                          {fundingProbability.reasoning}
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Timeline Optimization */}
                              {timelineOptimization && (
                                <Card className="border-blue-200 bg-blue-50">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Optimized Timeline
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      {timelineOptimization.estimatedDuration && (
                                        <p className="text-gray-700">
                                          <span className="font-medium">Duration:</span> {timelineOptimization.estimatedDuration} months
                                        </p>
                                      )}
                                      {timelineOptimization.phases && (
                                        <div>
                                          <p className="font-medium text-gray-700">Phases:</p>
                                          {timelineOptimization.phases.map((phase: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-xs text-gray-600 mt-1">
                                              <span>{phase.name}</span>
                                              <span>{phase.duration} months</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Impact Prediction */}
                              {impactPrediction && (
                                <Card className="border-purple-200 bg-purple-50">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4" />
                                      Impact Forecast
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p className="text-gray-700">
                                        <span className="font-medium">Predicted Citations (Year 5):</span>{' '}
                                        {impactPrediction.predictedCitations || 'N/A'}
                                      </p>
                                      <Progress
                                        value={Math.min((impactPrediction.predictedCitations || 0) / 10, 100)}
                                        className="h-2"
                                      />
                                      <p className="text-xs text-gray-600">
                                        Based on novelty, trending, and feasibility factors
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Trend Forecasts */}
                              {trendForecasts.length > 0 && (
                                <Card className="border-orange-200 bg-orange-50">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                                      <BarChart3 className="w-4 h-4" />
                                      Trend Analysis
                                    </h4>
                                    <div className="space-y-2">
                                      {trendForecasts.map((forecast: any, idx: number) => (
                                        <div key={idx} className="text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium text-xs">
                                              {forecast.topic}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                'text-xs',
                                                forecast.trend === 'EXPONENTIAL'
                                                  ? 'border-green-500 text-green-600'
                                                  : forecast.trend === 'LINEAR'
                                                    ? 'border-blue-500 text-blue-600'
                                                    : forecast.trend === 'PLATEAU'
                                                      ? 'border-yellow-500 text-yellow-600'
                                                      : 'border-red-500 text-red-600'
                                              )}
                                            >
                                              {forecast.trend}
                                            </Badge>
                                          </div>
                                          {forecast.growthRate && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              Growth: {forecast.growthRate}%/year
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button size="sm" variant="outline">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Start Research
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredGaps.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Telescope className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No research gaps found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
