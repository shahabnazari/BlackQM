'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Download,
  BookOpen,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

// Types
interface Finding {
  id: string;
  category: 'confirmatory' | 'novel' | 'contradictory' | 'extension';
  title: string;
  description: string;
  studyValue: number;
  literatureValue: number;
  confidence: number;
  significance: 'high' | 'medium' | 'low';
  relatedPapers: string[];
  theme?: string;
  factor?: string;
}

interface ComparisonMetric {
  metric: string;
  studyScore: number;
  literatureAvg: number;
  literatureMin: number;
  literatureMax: number;
  percentile: number;
  trend: 'above' | 'below' | 'aligned';
}

interface ThemeAlignment {
  theme: string;
  studyEmphasis: number;
  literatureEmphasis: number;
  alignment: number; // 0-100%
  papers: number;
}

interface GapCoverage {
  gap: string;
  addressed: boolean;
  coverage: number; // 0-100%
  findings: string[];
  impact: 'high' | 'medium' | 'low';
}

interface LiteratureComparisonVisualizationsProps {
  studyId: string;
  findings?: Finding[];
  metrics?: ComparisonMetric[];
  themes?: ThemeAlignment[];
  gaps?: GapCoverage[];
  onFindingClick?: (finding: Finding) => void;
  onExport?: (type: string, data: any) => void;
}

// Color schemes
const CATEGORY_COLORS = {
  confirmatory: '#22C55E',
  novel: '#3B82F6',
  contradictory: '#EF4444',
  extension: '#F59E0B',
};

const SIGNIFICANCE_COLORS = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#6B7280',
};

// Mock data generator
function generateMockData() {
  const findings: Finding[] = [
    {
      id: '1',
      category: 'confirmatory',
      title: 'Climate concern drives action',
      description:
        'Strong correlation between concern and behavioral change confirmed',
      studyValue: 0.82,
      literatureValue: 0.79,
      confidence: 0.91,
      significance: 'high',
      relatedPapers: ['Smith2023', 'Johnson2024'],
      theme: 'Environmental Action',
      factor: 'Factor 1',
    },
    {
      id: '2',
      category: 'novel',
      title: 'Youth activism patterns',
      description:
        'Unique mobilization patterns among Gen Z not previously documented',
      studyValue: 0.73,
      literatureValue: 0,
      confidence: 0.78,
      significance: 'high',
      relatedPapers: [],
      theme: 'Generational Differences',
      factor: 'Factor 2',
    },
    {
      id: '3',
      category: 'contradictory',
      title: 'Economic priorities',
      description:
        'Opposite relationship between income and environmental priority',
      studyValue: -0.45,
      literatureValue: 0.31,
      confidence: 0.69,
      significance: 'medium',
      relatedPapers: ['Brown2022', 'Davis2023'],
      theme: 'Economic Factors',
      factor: 'Factor 3',
    },
    {
      id: '4',
      category: 'extension',
      title: 'Rural-urban divide nuances',
      description: 'Extends understanding of location-based differences',
      studyValue: 0.56,
      literatureValue: 0.42,
      confidence: 0.85,
      significance: 'medium',
      relatedPapers: ['Wilson2023'],
      theme: 'Geographic Patterns',
      factor: 'Factor 1',
    },
  ];

  const metrics: ComparisonMetric[] = [
    {
      metric: 'Factor Clarity',
      studyScore: 85,
      literatureAvg: 72,
      literatureMin: 58,
      literatureMax: 89,
      percentile: 78,
      trend: 'above',
    },
    {
      metric: 'Sample Diversity',
      studyScore: 76,
      literatureAvg: 81,
      literatureMin: 65,
      literatureMax: 94,
      percentile: 42,
      trend: 'below',
    },
    {
      metric: 'Theoretical Alignment',
      studyScore: 91,
      literatureAvg: 88,
      literatureMin: 71,
      literatureMax: 95,
      percentile: 71,
      trend: 'aligned',
    },
    {
      metric: 'Statistical Power',
      studyScore: 88,
      literatureAvg: 79,
      literatureMin: 62,
      literatureMax: 91,
      percentile: 84,
      trend: 'above',
    },
  ];

  const themes: ThemeAlignment[] = [
    {
      theme: 'Environmental Action',
      studyEmphasis: 35,
      literatureEmphasis: 28,
      alignment: 80,
      papers: 42,
    },
    {
      theme: 'Economic Factors',
      studyEmphasis: 25,
      literatureEmphasis: 31,
      alignment: 65,
      papers: 38,
    },
    {
      theme: 'Policy Support',
      studyEmphasis: 20,
      literatureEmphasis: 22,
      alignment: 91,
      papers: 29,
    },
    {
      theme: 'Generational Differences',
      studyEmphasis: 15,
      literatureEmphasis: 8,
      alignment: 45,
      papers: 15,
    },
    {
      theme: 'Geographic Patterns',
      studyEmphasis: 5,
      literatureEmphasis: 11,
      alignment: 38,
      papers: 21,
    },
  ];

  const gaps: GapCoverage[] = [
    {
      gap: 'Youth climate activism',
      addressed: true,
      coverage: 85,
      findings: ['finding2', 'finding4'],
      impact: 'high',
    },
    {
      gap: 'Rural perspectives',
      addressed: true,
      coverage: 60,
      findings: ['finding4'],
      impact: 'medium',
    },
    {
      gap: 'Longitudinal effects',
      addressed: false,
      coverage: 0,
      findings: [],
      impact: 'low',
    },
    {
      gap: 'Cross-cultural comparison',
      addressed: false,
      coverage: 15,
      findings: [],
      impact: 'medium',
    },
  ];

  return { findings, metrics, themes, gaps };
}

export default function LiteratureComparisonVisualizations({
  studyId: _studyId,
  findings: propFindings,
  metrics: propMetrics,
  themes: propThemes,
  gaps: propGaps,
  onFindingClick,
  onExport,
}: LiteratureComparisonVisualizationsProps) {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSignificance, setSelectedSignificance] =
    useState<string>('all');
  const [isLoading, setIsLoading] = useState(!propFindings);

  // Use mock data if not provided
  const data = useMemo(() => {
    if (propFindings) {
      return {
        findings: propFindings,
        metrics: propMetrics || [],
        themes: propThemes || [],
        gaps: propGaps || [],
      };
    }
    return generateMockData();
  }, [propFindings, propMetrics, propThemes, propGaps]);

  // Load data if needed
  useEffect(() => {
    if (!propFindings) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [propFindings]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    let filtered = data.findings;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    if (selectedSignificance !== 'all') {
      filtered = filtered.filter(f => f.significance === selectedSignificance);
    }

    return filtered;
  }, [data.findings, selectedCategory, selectedSignificance]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = data.findings.length;
    const byCategory = data.findings.reduce(
      (acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgConfidence =
      data.findings.reduce((sum, f) => sum + f.confidence, 0) / total;
    const highSignificance = data.findings.filter(
      f => f.significance === 'high'
    ).length;

    return {
      total,
      byCategory,
      avgConfidence,
      highSignificance,
      confirmatoryRate: ((byCategory.confirmatory || 0) / total) * 100,
      noveltyRate: ((byCategory.novel || 0) / total) * 100,
    };
  }, [data.findings]);

  // Prepare chart data
  const categoryDistribution = useMemo(() => {
    return Object.entries(statistics.byCategory).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
      percentage: ((count / statistics.total) * 100).toFixed(1),
    }));
  }, [statistics]);

  const comparisonData = useMemo(() => {
    return filteredFindings.map(f => ({
      title: f.title,
      study: f.studyValue,
      literature: f.literatureValue,
      difference: f.studyValue - f.literatureValue,
      category: f.category,
    }));
  }, [filteredFindings]);

  const confidenceData = useMemo(() => {
    return filteredFindings.map(f => ({
      title: f.title,
      confidence: f.confidence * 100,
      significance: f.significance,
      category: f.category,
    }));
  }, [filteredFindings]);

  const themeComparisonData = useMemo(() => {
    return data.themes.map(t => ({
      theme: t.theme,
      'Study Emphasis': t.studyEmphasis,
      'Literature Emphasis': t.literatureEmphasis,
      alignment: t.alignment,
    }));
  }, [data.themes]);

  const gapCoverageData = useMemo(() => {
    return data.gaps.map(g => ({
      gap: g.gap,
      coverage: g.coverage,
      impact: g.impact,
      addressed: g.addressed,
    }));
  }, [data.gaps]);

  // Export functions
  const handleExport = (type: string) => {
    const exportData = {
      findings: filteredFindings,
      metrics: data.metrics,
      themes: data.themes,
      gaps: data.gaps,
      statistics,
    };
    onExport?.(type, exportData);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Literature Comparison Analysis</CardTitle>
              <CardDescription>
                How your study findings compare to existing literature
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{statistics.total}</p>
              <p className="text-sm text-gray-600">Total Findings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {statistics.byCategory.confirmatory || 0}
              </p>
              <p className="text-sm text-gray-600">Confirmatory</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {statistics.byCategory.novel || 0}
              </p>
              <p className="text-sm text-gray-600">Novel</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {statistics.byCategory.contradictory || 0}
              </p>
              <p className="text-sm text-gray-600">Contradictory</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {(statistics.avgConfidence * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="confirmatory">Confirmatory</SelectItem>
                <SelectItem value="novel">Novel</SelectItem>
                <SelectItem value="contradictory">Contradictory</SelectItem>
                <SelectItem value="extension">Extension</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedSignificance}
              onValueChange={setSelectedSignificance}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Significance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Significance</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualizations */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="gaps">Research Gaps</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Finding Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ percent }: any) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CATEGORY_COLORS[
                              entry.category.toLowerCase() as keyof typeof CATEGORY_COLORS
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Confidence Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confidence Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={confidenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="confidence" fill="#8B5CF6">
                      {confidenceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SIGNIFICANCE_COLORS[entry.significance]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Finding Cards */}
          <div className="grid grid-cols-2 gap-4">
            {filteredFindings.map(finding => (
              <Card
                key={finding.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onFindingClick?.(finding)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          style={{
                            backgroundColor: CATEGORY_COLORS[finding.category],
                            color: 'white',
                          }}
                        >
                          {finding.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor:
                              SIGNIFICANCE_COLORS[finding.significance],
                            color: SIGNIFICANCE_COLORS[finding.significance],
                          }}
                        >
                          {finding.significance}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">
                        {finding.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {finding.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {(finding.confidence * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-600">confidence</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Study: </span>
                      <span className="font-medium">
                        {finding.studyValue.toFixed(2)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-600">Literature: </span>
                      <span className="font-medium">
                        {finding.literatureValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {finding.relatedPapers.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {finding.relatedPapers.length} papers
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Study vs Literature Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="title"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="study" fill="#3B82F6" />
                  <Bar dataKey="literature" fill="#94A3B8" />
                  <ReferenceLine y={0} stroke="#000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Difference from Literature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="title"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="difference">
                    {comparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.difference > 0 ? '#22C55E' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                  <ReferenceLine y={0} stroke="#000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Theme Emphasis Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={themeComparisonData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="theme" />
                  <PolarRadiusAxis angle={90} domain={[0, 40]} />
                  <Radar
                    name="Study"
                    dataKey="Study Emphasis"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Literature"
                    dataKey="Literature Emphasis"
                    stroke="#94A3B8"
                    fill="#94A3B8"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {data.themes.map(theme => (
              <Card key={theme.theme}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{theme.theme}</h4>
                      <Badge variant="outline">{theme.papers} papers</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Study Emphasis</span>
                        <span>{theme.studyEmphasis}%</span>
                      </div>
                      <Progress value={theme.studyEmphasis} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span>Literature Emphasis</span>
                        <span>{theme.literatureEmphasis}%</span>
                      </div>
                      <Progress
                        value={theme.literatureEmphasis}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Alignment</span>
                        <span
                          className={
                            theme.alignment > 70
                              ? 'text-green-600'
                              : theme.alignment > 40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {theme.alignment}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Research Gaps Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Research Gap Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gapCoverageData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="gap" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="coverage">
                    {gapCoverageData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.addressed ? '#22C55E' : '#EF4444'}
                        fillOpacity={entry.addressed ? 1 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {data.gaps.map(gap => (
              <Card key={gap.gap}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{gap.gap}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {gap.addressed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Addressed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Addressed
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          style={{
                            borderColor:
                              gap.impact === 'high'
                                ? '#DC2626'
                                : gap.impact === 'medium'
                                  ? '#F59E0B'
                                  : '#6B7280',
                            color:
                              gap.impact === 'high'
                                ? '#DC2626'
                                : gap.impact === 'medium'
                                  ? '#F59E0B'
                                  : '#6B7280',
                          }}
                        >
                          {gap.impact} impact
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{gap.coverage}%</p>
                      <p className="text-xs text-gray-600">coverage</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={gap.coverage} className="h-2" />
                  {gap.findings.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {gap.findings.length} related findings
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Study Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={data.metrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Study"
                    dataKey="studyScore"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Literature Avg"
                    dataKey="literatureAvg"
                    stroke="#94A3B8"
                    fill="#94A3B8"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {data.metrics.map(metric => (
              <Card key={metric.metric}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{metric.metric}</CardTitle>
                    <div className="flex items-center gap-1">
                      {metric.trend === 'above' && (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      )}
                      {metric.trend === 'below' && (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      )}
                      {metric.trend === 'aligned' && (
                        <Minus className="w-4 h-4 text-blue-600" />
                      )}
                      <span
                        className={
                          metric.trend === 'above'
                            ? 'text-green-600'
                            : metric.trend === 'below'
                              ? 'text-red-600'
                              : 'text-blue-600'
                        }
                      >
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Study</span>
                      <span className="text-lg font-bold">
                        {metric.studyScore}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-8 bg-gray-100 rounded flex items-center">
                        <div className="absolute w-full px-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{metric.literatureMin}</span>
                            <span>{metric.literatureMax}</span>
                          </div>
                        </div>
                        <div
                          className="h-full bg-blue-200 rounded-l"
                          style={{
                            width: `${
                              ((metric.literatureAvg - metric.literatureMin) /
                                (metric.literatureMax - metric.literatureMin)) *
                              100
                            }%`,
                          }}
                        />
                        <div
                          className="absolute h-full w-1 bg-blue-600"
                          style={{
                            left: `${
                              ((metric.studyScore - metric.literatureMin) /
                                (metric.literatureMax - metric.literatureMin)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Literature Avg</span>
                      <span>{metric.literatureAvg}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Percentile</span>
                      <Badge variant="outline">{metric.percentile}th</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights Alert */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Key Insights</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Your study confirms {statistics.confirmatoryRate.toFixed(0)}% of
              literature findings
            </li>
            <li>
              {statistics.byCategory.novel || 0} novel discoveries not
              previously documented
            </li>
            <li>
              Average confidence level of{' '}
              {(statistics.avgConfidence * 100).toFixed(0)}% across all findings
            </li>
            <li>
              {data.gaps.filter(g => g.addressed).length} of {data.gaps.length}{' '}
              identified research gaps addressed
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
