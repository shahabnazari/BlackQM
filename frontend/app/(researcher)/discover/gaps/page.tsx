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
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
    icon: Microscope
  },
  {
    id: 'theoretical',
    name: 'Theoretical Gaps',
    description: 'Gaps in theoretical frameworks and models',
    gapCount: 0,
    avgImportance: 0,
    color: 'blue',
    icon: Brain
  },
  {
    id: 'empirical',
    name: 'Empirical Gaps',
    description: 'Gaps in empirical evidence and data',
    gapCount: 0,
    avgImportance: 0,
    color: 'green',
    icon: BarChart3
  },
  {
    id: 'technological',
    name: 'Technological Gaps',
    description: 'Gaps in technology application and innovation',
    gapCount: 0,
    avgImportance: 0,
    color: 'orange',
    icon: Zap
  }
];

export default function ResearchGapsPage() {
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<ResearchGap | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'opportunity' | 'impact' | 'novelty' | 'recent'>('opportunity');
  const [aiAnalysisActive, setAiAnalysisActive] = useState(false);
  const [showQMethodOnly, setShowQMethodOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Generate mock data
  useEffect(() => {
    const mockGaps: ResearchGap[] = [
      {
        id: '1',
        title: 'Q Methodology in Climate Change Communication',
        description: 'Limited application of Q methodology to understand stakeholder perspectives on climate change communication strategies. Current research lacks systematic exploration of subjective viewpoints across different demographic groups.',
        field: 'Environmental Science',
        subfield: ['Climate Communication', 'Q Methodology', 'Stakeholder Analysis'],
        importance: 'critical',
        feasibility: 'high',
        novelty: 85,
        impact: 90,
        relatedPapers: 12,
        suggestedMethods: ['Q-sort', 'Factor analysis', 'Semi-structured interviews'],
        estimatedDuration: '12-18 months',
        requiredExpertise: ['Q methodology', 'Environmental psychology', 'Statistical analysis'],
        potentialChallenges: ['Participant recruitment', 'Cross-cultural validation', 'Large sample size needed'],
        opportunityScore: 88,
        trend: 'emerging',
        lastUpdated: new Date('2024-02-15'),
        citations: {
          supporting: 45,
          contradicting: 3,
          neutral: 18
        },
        qMethodologyRelevance: true
      },
      {
        id: '2',
        title: 'Digital Q-Sort Validation Studies',
        description: 'Insufficient empirical validation of digital Q-sort platforms compared to traditional paper-based methods. Need for systematic comparison studies across different populations and research contexts.',
        field: 'Research Methods',
        subfield: ['Digital Methods', 'Q Methodology', 'Validation Studies'],
        importance: 'high',
        feasibility: 'high',
        novelty: 75,
        impact: 80,
        relatedPapers: 8,
        suggestedMethods: ['Comparative study', 'Test-retest reliability', 'Cross-validation'],
        estimatedDuration: '6-9 months',
        requiredExpertise: ['Q methodology', 'Digital research methods', 'Psychometrics'],
        potentialChallenges: ['Platform development', 'Participant technology access', 'Standardization'],
        opportunityScore: 78,
        trend: 'emerging',
        lastUpdated: new Date('2024-02-10'),
        citations: {
          supporting: 32,
          contradicting: 5,
          neutral: 12
        },
        qMethodologyRelevance: true
      },
      {
        id: '3',
        title: 'AI-Assisted Factor Interpretation in Q Studies',
        description: 'Lack of research on using artificial intelligence to assist in factor interpretation and pattern recognition in Q methodology studies. Potential for improving efficiency and uncovering hidden patterns.',
        field: 'Computational Social Science',
        subfield: ['AI/ML', 'Q Methodology', 'Pattern Recognition'],
        importance: 'high',
        feasibility: 'medium',
        novelty: 92,
        impact: 85,
        relatedPapers: 3,
        suggestedMethods: ['Machine learning', 'Natural language processing', 'Pattern recognition'],
        estimatedDuration: '18-24 months',
        requiredExpertise: ['Q methodology', 'Machine learning', 'Software development'],
        potentialChallenges: ['Algorithm development', 'Validation', 'Interpretability'],
        opportunityScore: 85,
        trend: 'emerging',
        lastUpdated: new Date('2024-02-20'),
        citations: {
          supporting: 15,
          contradicting: 2,
          neutral: 8
        },
        qMethodologyRelevance: true
      },
      {
        id: '4',
        title: 'Cross-Cultural Subjective Well-being Assessment',
        description: 'Gap in understanding subjective well-being perspectives across different cultural contexts using systematic approaches. Limited cross-cultural validation of well-being constructs.',
        field: 'Psychology',
        subfield: ['Cross-cultural Psychology', 'Well-being', 'Subjective Assessment'],
        importance: 'medium',
        feasibility: 'medium',
        novelty: 70,
        impact: 75,
        relatedPapers: 25,
        suggestedMethods: ['Cross-cultural surveys', 'Mixed methods', 'Meta-analysis'],
        estimatedDuration: '24-36 months',
        requiredExpertise: ['Cross-cultural psychology', 'Research methods', 'Multiple languages'],
        potentialChallenges: ['Cultural sensitivity', 'Translation issues', 'Sample diversity'],
        opportunityScore: 72,
        trend: 'stable',
        lastUpdated: new Date('2024-02-05'),
        citations: {
          supporting: 68,
          contradicting: 12,
          neutral: 35
        },
        qMethodologyRelevance: false
      }
    ];

    setGaps(mockGaps);
  }, []);

  // Filter and sort gaps
  const filteredGaps = useMemo(() => {
    let filtered = [...gaps];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gap =>
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
  }, [gaps, searchQuery, filterField, filterImportance, showQMethodOnly, sortBy]);

  // Calculate category stats
  const categoryStats = useMemo(() => {
    return GAP_CATEGORIES.map(category => {
      const categoryGaps = gaps.filter(gap => {
        // Simple categorization based on keywords
        if (category.id === 'methodological') {
          return gap.title.toLowerCase().includes('method') || 
                 gap.subfield.some(sf => sf.toLowerCase().includes('method'));
        }
        if (category.id === 'theoretical') {
          return gap.title.toLowerCase().includes('theor') || 
                 gap.subfield.some(sf => sf.toLowerCase().includes('theor'));
        }
        if (category.id === 'empirical') {
          return gap.description.toLowerCase().includes('empirical') || 
                 gap.subfield.some(sf => sf.toLowerCase().includes('data'));
        }
        if (category.id === 'technological') {
          return gap.title.toLowerCase().includes('tech') || 
                 gap.title.toLowerCase().includes('digital') ||
                 gap.subfield.some(sf => sf.toLowerCase().includes('tech'));
        }
        return false;
      });

      const importanceScore = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };

      const avgImportance = categoryGaps.length > 0
        ? categoryGaps.reduce((sum, gap) => sum + importanceScore[gap.importance], 0) / categoryGaps.length
        : 0;

      return {
        ...category,
        gapCount: categoryGaps.length,
        avgImportance
      };
    });
  }, [gaps]);

  // Generate trend data
  const trendData: TrendData[] = [
    { period: '2020', publications: 120, citations: 3200, gaps: 15 },
    { period: '2021', publications: 145, citations: 3800, gaps: 18 },
    { period: '2022', publications: 178, citations: 4500, gaps: 22 },
    { period: '2023', publications: 210, citations: 5200, gaps: 28 },
    { period: '2024', publications: 95, citations: 2100, gaps: 12 }
  ];

  // Run AI analysis
  const runAiAnalysis = async () => {
    setAiAnalysisActive(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update gaps with AI insights
    setGaps(prev => prev.map(gap => ({
      ...gap,
      opportunityScore: Math.min(100, gap.opportunityScore + Math.random() * 10)
    })));
    
    setAiAnalysisActive(false);
  };

  // Export gaps report
  const exportReport = (format: 'pdf' | 'json' | 'csv') => {
    const data = {
      gaps: filteredGaps,
      categories: categoryStats,
      generated: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'research-gaps-analysis.json';
      a.click();
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

        {/* Stats Overview */}
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
                  <p className="text-2xl font-bold text-purple-900">{gaps.length}</p>
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                    <SelectItem value="Research Methods">Research Methods</SelectItem>
                    <SelectItem value="Psychology">Psychology</SelectItem>
                    <SelectItem value="Computational Social Science">Computational Social Science</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterImportance} onValueChange={setFilterImportance}>
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

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
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
                  variant={showQMethodOnly ? "default" : "outline"}
                  onClick={() => setShowQMethodOnly(!showQMethodOnly)}
                  className={cn(
                    showQMethodOnly && "bg-gradient-to-r from-purple-600 to-blue-600"
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

                <Button
                  variant="outline"
                  onClick={() => exportReport('json')}
                >
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
                {categoryStats.map((category) => {
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
                          <Icon className="w-4 h-4" style={{ color: `var(--${category.color}-500)` }} />
                          <span className="text-sm font-medium">{category.name}</span>
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
                  {trendData.map((data) => (
                    <div key={data.period} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{data.period}</span>
                        <span className="font-medium">{data.gaps} gaps</span>
                      </div>
                      <Progress value={(data.gaps / 30) * 100} className="h-1" />
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
                    "hover:shadow-lg transition-all cursor-pointer",
                    selectedGap?.id === gap.id && "ring-2 ring-purple-400"
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
                              gap.importance === 'critical' ? "bg-red-100 text-red-700" :
                              gap.importance === 'high' ? "bg-orange-100 text-orange-700" :
                              gap.importance === 'medium' ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
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
                              gap.trend === 'emerging' ? "border-green-500 text-green-600" :
                              gap.trend === 'stable' ? "border-blue-500 text-blue-600" :
                              "border-red-500 text-red-600"
                            )}
                          >
                            {gap.trend === 'emerging' ? <ArrowUpRight className="w-3 h-3 mr-1" /> :
                             gap.trend === 'declining' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
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
                        <p className="text-xs text-gray-500">Opportunity Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Impact</p>
                        <div className="flex items-center gap-2">
                          <Progress value={gap.impact} className="flex-1 h-2" />
                          <span className="text-xs font-medium">{gap.impact}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Novelty</p>
                        <div className="flex items-center gap-2">
                          <Progress value={gap.novelty} className="flex-1 h-2" />
                          <span className="text-xs font-medium">{gap.novelty}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Feasibility</p>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-xs",
                            gap.feasibility === 'high' ? "border-green-500 text-green-600" :
                            gap.feasibility === 'medium' ? "border-yellow-500 text-yellow-600" :
                            "border-red-500 text-red-600"
                          )}
                        >
                          {gap.feasibility}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-xs font-medium">{gap.estimatedDuration}</p>
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
                          <Badge key={field} variant="secondary" className="text-xs">
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
                          <p className="text-sm font-medium text-gray-700 mb-2">Suggested Methods:</p>
                          <div className="flex flex-wrap gap-2">
                            {gap.suggestedMethods.map(method => (
                              <Badge key={method} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Required Expertise:</p>
                          <div className="flex flex-wrap gap-2">
                            {gap.requiredExpertise.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Potential Challenges:</p>
                          <ul className="space-y-1">
                            {gap.potentialChallenges.map(challenge => (
                              <li key={challenge} className="text-xs text-gray-600 flex items-start">
                                <AlertCircle className="w-3 h-3 mr-2 mt-0.5 text-yellow-500" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button size="sm" variant="outline">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
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
      </div>
    </div>
  );
}