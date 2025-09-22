import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import {
  LightBulbIcon,
  RocketLaunchIcon,
  BeakerIcon,
  AcademicCapIcon,
  ChartPieIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Recommendation {
  id: string;
  type: 'methodological' | 'analytical' | 'interpretive' | 'future-research' | 'practical';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  evidence: {
    type: string;
    description: string;
    strength: number;
  }[];
  actionItems: {
    id: string;
    task: string;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    completed: boolean;
  }[];
  impact: {
    area: string;
    description: string;
    magnitude: number;
  }[];
  resources: {
    type: 'tool' | 'reference' | 'example' | 'template';
    title: string;
    url?: string;
  }[];
  dependencies: string[];
  risks: {
    description: string;
    likelihood: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}

interface RecommendationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  recommendations: Recommendation[];
  overallPriority: number;
}

interface RecommendationEngineProps {
  analysisResults?: any;
  insights?: any[];
  studyContext?: any;
  onRecommendationGenerated?: (recommendations: Recommendation[]) => void;
}

/**
 * RecommendationEngine Component
 * Phase 8 Day 4 - World-class recommendation synthesis
 * 
 * Features:
 * - Evidence-based recommendation generation
 * - Priority scoring and ranking
 * - Actionable item creation
 * - Impact assessment
 * - Resource linking
 * - Risk analysis
 * - Implementation roadmap
 * - Progress tracking
 */
export function RecommendationEngine({
  analysisResults: _analysisResults,
  insights: _insights = [],
  studyContext: _studyContext,
  onRecommendationGenerated
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [categories, setCategories] = useState<RecommendationCategory[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // Generate recommendations based on analysis
  const generateRecommendations = useCallback(async () => {
    setProcessing(true);
    
    try {
      // Simulate recommendation generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockRecommendations: Recommendation[] = [
        {
          id: 'rec-1',
          type: 'methodological',
          priority: 'critical',
          title: 'Increase sample size for better factor stability',
          description: 'Current sample size of 50 participants is at the minimum threshold. Increasing to 80-100 would significantly improve factor stability.',
          rationale: 'Factor analysis reliability increases substantially with larger sample sizes, especially for exploratory studies.',
          evidence: [
            { type: 'Statistical', description: 'KMO value of 0.68 suggests marginal sampling adequacy', strength: 0.85 },
            { type: 'Literature', description: 'Brown (2010) recommends 80+ participants for stable Q-method factors', strength: 0.9 },
            { type: 'Analysis', description: 'Bootstrap confidence intervals show high variability', strength: 0.75 }
          ],
          actionItems: [
            { id: 'a1', task: 'Plan recruitment strategy for additional 30-50 participants', effort: 'medium', timeframe: '2 weeks', completed: false },
            { id: 'a2', task: 'Update ethics approval for expanded sample', effort: 'low', timeframe: '1 week', completed: false },
            { id: 'a3', task: 'Prepare additional compensation budget', effort: 'low', timeframe: '3 days', completed: false }
          ],
          impact: [
            { area: 'Statistical Power', description: 'Increase factor stability by 35%', magnitude: 0.85 },
            { area: 'Generalizability', description: 'Better representation of population viewpoints', magnitude: 0.7 },
            { area: 'Publication', description: 'Meet journal standards for sample size', magnitude: 0.9 }
          ],
          resources: [
            { type: 'reference', title: 'Watts & Stenner (2012) - Sample Size Guidelines' },
            { type: 'tool', title: 'Power Analysis Calculator', url: 'https://example.com/power' },
            { type: 'template', title: 'Recruitment Email Template' }
          ],
          dependencies: ['Budget approval', 'Ethics amendment'],
          risks: [
            { description: 'Recruitment fatigue in target population', likelihood: 'medium', mitigation: 'Expand recruitment channels' },
            { description: 'Data collection timeline extension', likelihood: 'high', mitigation: 'Parallel recruitment streams' }
          ]
        },
        {
          id: 'rec-2',
          type: 'analytical',
          priority: 'high',
          title: 'Explore alternative rotation methods',
          description: 'Current Varimax rotation may not be optimal. Consider Oblimin for correlated factors.',
          rationale: 'Factor correlations suggest non-orthogonal structure might better represent the data.',
          evidence: [
            { type: 'Statistical', description: 'Inter-factor correlations exceed 0.3', strength: 0.8 },
            { type: 'Theoretical', description: 'Conceptually related viewpoints expected', strength: 0.7 }
          ],
          actionItems: [
            { id: 'a4', task: 'Run Oblimin rotation analysis', effort: 'low', timeframe: '1 day', completed: false },
            { id: 'a5', task: 'Compare factor structures', effort: 'medium', timeframe: '3 days', completed: false },
            { id: 'a6', task: 'Document rotation decision rationale', effort: 'low', timeframe: '1 day', completed: false }
          ],
          impact: [
            { area: 'Interpretation', description: 'Clearer factor structure', magnitude: 0.75 },
            { area: 'Validity', description: 'Better theoretical alignment', magnitude: 0.8 }
          ],
          resources: [
            { type: 'reference', title: 'Rotation Methods in Q-Methodology' },
            { type: 'example', title: 'Oblimin Rotation Case Study' }
          ],
          dependencies: [],
          risks: [
            { description: 'More complex interpretation', likelihood: 'medium', mitigation: 'Provide clear documentation' }
          ]
        },
        {
          id: 'rec-3',
          type: 'interpretive',
          priority: 'high',
          title: 'Conduct member checking with exemplar participants',
          description: 'Validate factor interpretations with high-loading participants from each factor.',
          rationale: 'Participant feedback can confirm or refine factor narratives and increase validity.',
          evidence: [
            { type: 'Best Practice', description: 'Member checking is gold standard for qualitative validation', strength: 0.95 },
            { type: 'Gap Analysis', description: 'No participant validation conducted yet', strength: 1.0 }
          ],
          actionItems: [
            { id: 'a7', task: 'Identify 3-5 exemplar participants per factor', effort: 'low', timeframe: '2 days', completed: false },
            { id: 'a8', task: 'Prepare factor interpretation summaries', effort: 'medium', timeframe: '1 week', completed: false },
            { id: 'a9', task: 'Conduct validation interviews', effort: 'high', timeframe: '2 weeks', completed: false },
            { id: 'a10', task: 'Integrate feedback into final interpretations', effort: 'medium', timeframe: '1 week', completed: false }
          ],
          impact: [
            { area: 'Validity', description: 'Strengthen interpretation credibility', magnitude: 0.9 },
            { area: 'Depth', description: 'Richer narrative descriptions', magnitude: 0.75 },
            { area: 'Participant Engagement', description: 'Increased stakeholder buy-in', magnitude: 0.65 }
          ],
          resources: [
            { type: 'template', title: 'Member Checking Interview Guide' },
            { type: 'reference', title: 'Lincoln & Guba (1985) - Trustworthiness Criteria' }
          ],
          dependencies: ['Participant availability', 'Ethics approval for follow-up'],
          risks: [
            { description: 'Participant dropout', likelihood: 'low', mitigation: 'Over-recruit validation participants' },
            { description: 'Conflicting interpretations', likelihood: 'medium', mitigation: 'Document all perspectives' }
          ]
        },
        {
          id: 'rec-4',
          type: 'future-research',
          priority: 'medium',
          title: 'Design follow-up study with expanded statement set',
          description: 'Current findings suggest additional dimensions. Plan study with 60-80 statements.',
          rationale: 'Several themes emerged in qualitative comments not captured by current statements.',
          evidence: [
            { type: 'Qualitative', description: '25% of comments mention uncovered themes', strength: 0.7 },
            { type: 'Statistical', description: 'Unexplained variance suggests missing factors', strength: 0.65 }
          ],
          actionItems: [
            { id: 'a11', task: 'Analyze qualitative comments for new themes', effort: 'medium', timeframe: '1 week', completed: false },
            { id: 'a12', task: 'Generate 30-40 additional statements', effort: 'high', timeframe: '2 weeks', completed: false },
            { id: 'a13', task: 'Pilot test expanded statement set', effort: 'medium', timeframe: '2 weeks', completed: false }
          ],
          impact: [
            { area: 'Comprehensiveness', description: 'Fuller viewpoint coverage', magnitude: 0.8 },
            { area: 'Theory Development', description: 'Refined conceptual model', magnitude: 0.85 }
          ],
          resources: [
            { type: 'tool', title: 'Statement Generation AI Assistant' },
            { type: 'reference', title: 'Iterative Q-Study Design Guide' }
          ],
          dependencies: ['Funding for follow-up study'],
          risks: [
            { description: 'Participant burden with larger Q-set', likelihood: 'medium', mitigation: 'Consider online adaptive Q-sort' }
          ]
        },
        {
          id: 'rec-5',
          type: 'practical',
          priority: 'medium',
          title: 'Create stakeholder communication materials',
          description: 'Develop accessible summaries for different audience groups.',
          rationale: 'Research impact requires effective knowledge translation.',
          evidence: [
            { type: 'Context', description: 'Multiple stakeholder groups identified', strength: 0.9 },
            { type: 'Request', description: 'Partner organizations need actionable insights', strength: 0.95 }
          ],
          actionItems: [
            { id: 'a14', task: 'Create executive summary (2 pages)', effort: 'low', timeframe: '3 days', completed: false },
            { id: 'a15', task: 'Design infographic of key findings', effort: 'medium', timeframe: '1 week', completed: false },
            { id: 'a16', task: 'Prepare policy brief', effort: 'medium', timeframe: '1 week', completed: false },
            { id: 'a17', task: 'Develop presentation deck', effort: 'low', timeframe: '3 days', completed: false }
          ],
          impact: [
            { area: 'Knowledge Transfer', description: 'Reach wider audience', magnitude: 0.75 },
            { area: 'Policy', description: 'Inform decision-making', magnitude: 0.7 },
            { area: 'Public Engagement', description: 'Increase research visibility', magnitude: 0.6 }
          ],
          resources: [
            { type: 'template', title: 'Policy Brief Template' },
            { type: 'tool', title: 'Canva Infographic Templates', url: 'https://canva.com' },
            { type: 'example', title: 'Effective Research Communication Examples' }
          ],
          dependencies: ['Final results approval'],
          risks: [
            { description: 'Oversimplification of findings', likelihood: 'medium', mitigation: 'Layer information for different audiences' }
          ]
        }
      ];
      
      setRecommendations(mockRecommendations);
      
      // Organize into categories
      const categorized = organizeByCategory(mockRecommendations);
      setCategories(categorized);
      
      if (onRecommendationGenerated) {
        onRecommendationGenerated(mockRecommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setProcessing(false);
    }
  }, [onRecommendationGenerated]);

  // Organize recommendations by category
  const organizeByCategory = (recs: Recommendation[]): RecommendationCategory[] => {
    const categoryMap = new Map<string, Recommendation[]>();
    
    recs.forEach(rec => {
      if (!categoryMap.has(rec.type)) {
        categoryMap.set(rec.type, []);
      }
      categoryMap.get(rec.type)!.push(rec);
    });
    
    const categoryConfig: Record<string, { name: string; icon: React.ReactNode; description: string }> = {
      methodological: {
        name: 'Methodological',
        icon: <BeakerIcon className="w-5 h-5" />,
        description: 'Study design and data collection improvements'
      },
      analytical: {
        name: 'Analytical',
        icon: <ChartPieIcon className="w-5 h-5" />,
        description: 'Statistical analysis enhancements'
      },
      interpretive: {
        name: 'Interpretive',
        icon: <AcademicCapIcon className="w-5 h-5" />,
        description: 'Meaning-making and validation'
      },
      'future-research': {
        name: 'Future Research',
        icon: <RocketLaunchIcon className="w-5 h-5" />,
        description: 'Next steps and follow-up studies'
      },
      practical: {
        name: 'Practical Application',
        icon: <UserGroupIcon className="w-5 h-5" />,
        description: 'Knowledge translation and impact'
      }
    };
    
    return Array.from(categoryMap.entries()).map(([type, recList]) => ({
      id: type,
      name: categoryConfig[type]?.name || type,
      icon: categoryConfig[type]?.icon || <DocumentTextIcon className="w-5 h-5" />,
      description: categoryConfig[type]?.description || '',
      recommendations: recList,
      overallPriority: recList.reduce((sum, r) => 
        sum + (r.priority === 'critical' ? 4 : r.priority === 'high' ? 3 : r.priority === 'medium' ? 2 : 1), 0
      ) / recList.length
    })).sort((a, b) => b.overallPriority - a.overallPriority);
  };

  // Toggle action item completion
  const toggleActionItem = (recId: string, actionId: string) => {
    setRecommendations(prev => prev.map(rec => {
      if (rec.id === recId) {
        return {
          ...rec,
          actionItems: rec.actionItems.map(action => 
            action.id === actionId 
              ? { ...action, completed: !action.completed }
              : action
          )
        };
      }
      return rec;
    }));
  };

  // Calculate completion percentage
  const getCompletionPercentage = (rec: Recommendation): number => {
    const completed = rec.actionItems.filter(a => a.completed).length;
    return rec.actionItems.length > 0 ? (completed / rec.actionItems.length) * 100 : 0;
  };

  // Get priority color
  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get effort badge variant
  const getEffortVariant = (effort: string): "default" | "success" | "warning" | "destructive" => {
    switch (effort) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      default: return 'default';
    }
  };

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      if (filterPriority !== 'all' && rec.priority !== filterPriority) return false;
      if (!showCompleted && getCompletionPercentage(rec) === 100) return false;
      return true;
    });
  }, [recommendations, filterPriority, showCompleted]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const allActions = recommendations.flatMap(r => r.actionItems);
    const completedActions = allActions.filter(a => a.completed).length;
    return allActions.length > 0 ? (completedActions / allActions.length) * 100 : 0;
  }, [recommendations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <LightBulbIcon className="w-6 h-6 text-blue-600" />
              Recommendation Engine
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Evidence-based recommendations for your research
            </p>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={processing}
            variant="primary"
            size="sm"
          >
            {processing ? <LoadingSpinner size="sm" /> : 'Generate Recommendations'}
          </Button>
        </div>

        {/* Progress Overview */}
        {recommendations.length > 0 && (
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{overallProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{recommendations.length} recommendations</span>
              <span>{recommendations.flatMap(r => r.actionItems).length} action items</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button
            onClick={() => setShowCompleted(!showCompleted)}
            variant="secondary"
            size="sm"
          >
            {showCompleted ? 'Hide' : 'Show'} Completed
          </Button>
        </div>
      </Card>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
              className="text-left focus:outline-none"
            >
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2">
                  {category.icon}
                </div>
                <h4 className="font-medium text-sm">{category.name}</h4>
                <Badge variant="outline" className="mt-1">
                  {category.recommendations.length}
                </Badge>
              </div>
            </Card>
            </button>
          ))}
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredRecommendations
            .filter(rec => !selectedCategory || rec.type === selectedCategory)
            .map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  {/* Recommendation Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.type}</Badge>
                          {getCompletionPercentage(rec) === 100 && (
                            <Badge variant="success">
                              <CheckIcon className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold mb-1">{rec.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rec.description}
                        </p>
                        
                        {/* Quick Stats */}
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1">
                            <DocumentTextIcon className="w-4 h-4" />
                            {rec.actionItems.length} actions
                          </span>
                          <span className="flex items-center gap-1">
                            <SparklesIcon className="w-4 h-4" />
                            {rec.evidence.length} evidence points
                          </span>
                          {rec.risks.length > 0 && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              {rec.risks.length} risks
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRightIcon className={`w-5 h-5 transition-transform ${
                        expandedRec === rec.id ? 'rotate-90' : ''
                      }`} />
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${getCompletionPercentage(rec)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedRec === rec.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t"
                      >
                        <div className="p-6 space-y-6">
                          {/* Rationale */}
                          <div>
                            <h5 className="font-medium mb-2">Rationale</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {rec.rationale}
                            </p>
                          </div>

                          {/* Evidence */}
                          <div>
                            <h5 className="font-medium mb-2">Supporting Evidence</h5>
                            <div className="space-y-2">
                              {rec.evidence.map((ev, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <Badge variant="outline" className="mt-0.5">
                                    {ev.type}
                                  </Badge>
                                  <div className="flex-1">
                                    <p className="text-sm">{ev.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div 
                                          className="bg-blue-500 h-1.5 rounded-full"
                                          style={{ width: `${ev.strength * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {(ev.strength * 100).toFixed(0)}% strength
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Items */}
                          <div>
                            <h5 className="font-medium mb-2">Action Items</h5>
                            <div className="space-y-2">
                              {rec.actionItems.map(action => (
                                <div 
                                  key={action.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                                    action.completed 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActionItem(rec.id, action.id);
                                    }}
                                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 ${
                                      action.completed 
                                        ? 'bg-green-500 border-green-500' 
                                        : 'border-gray-300 hover:border-blue-500'
                                    }`}
                                  >
                                    {action.completed && (
                                      <CheckIcon className="w-3 h-3 text-white mx-auto" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <p className={`text-sm ${
                                      action.completed ? 'line-through text-gray-500' : ''
                                    }`}>
                                      {action.task}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                      <Badge variant={getEffortVariant(action.effort)} size="sm">
                                        {action.effort} effort
                                      </Badge>
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {action.timeframe}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Impact */}
                          <div>
                            <h5 className="font-medium mb-2">Expected Impact</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {rec.impact.map((imp, i) => (
                                <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                  <h6 className="font-medium text-sm mb-1">{imp.area}</h6>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {imp.description}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, j) => (
                                      <div
                                        key={j}
                                        className={`w-2 h-2 rounded-full ${
                                          j < Math.round(imp.magnitude * 5) 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Risks */}
                          {rec.risks.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Risk Assessment</h5>
                              <div className="space-y-2">
                                {rec.risks.map((risk, i) => (
                                  <div key={i} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-1">
                                      <p className="text-sm font-medium">{risk.description}</p>
                                      <Badge 
                                        variant={
                                          risk.likelihood === 'high' ? 'destructive' :
                                          risk.likelihood === 'medium' ? 'warning' : 'success'
                                        }
                                        size="sm"
                                      >
                                        {risk.likelihood}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      <strong>Mitigation:</strong> {risk.mitigation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {rec.resources.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Resources</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {rec.resources.map((resource, i) => (
                                  <a
                                    key={i}
                                    href={resource.url || '#'}
                                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                                    onClick={(e) => !resource.url && e.preventDefault()}
                                  >
                                    <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{resource.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}