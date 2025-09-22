import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import {
  RocketLaunchIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  UserGroupIcon,
  PlayIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ActionableInsight {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'short-term' | 'long-term' | 'strategic';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'research' | 'methodology' | 'communication' | 'policy' | 'product';
  actions: Action[];
  impact: {
    area: string;
    magnitude: 'transformational' | 'significant' | 'moderate' | 'minor';
    confidence: number;
  };
  stakeholders: string[];
  timeline: {
    start: string;
    end: string;
    milestones: Milestone[];
  };
  resources: {
    required: Resource[];
    available: Resource[];
    gap: Resource[];
  };
  risks: Risk[];
  dependencies: string[];
  measurableOutcomes: MeasurableOutcome[];
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

interface Action {
  id: string;
  title: string;
  description: string;
  owner?: string;
  deadline: string;
  effort: 'hours' | 'days' | 'weeks' | 'months';
  effortAmount: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  blockers?: string[];
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  achieved: boolean;
}

interface Resource {
  type: 'human' | 'financial' | 'technical' | 'time' | 'data';
  name: string;
  quantity?: number;
  unit?: string;
}

interface Risk {
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface MeasurableOutcome {
  metric: string;
  target: number;
  unit: string;
  baseline?: number;
  method: string;
}

interface ActionableInsightsGeneratorProps {
  insights?: any[];
  recommendations?: any[];
  studyContext?: any;
  onInsightsGenerated?: (insights: ActionableInsight[]) => void;
}

/**
 * ActionableInsightsGenerator Component
 * Phase 8 Day 4 - World-class actionable insights synthesis
 * 
 * Features:
 * - Action plan generation
 * - Timeline and milestone tracking
 * - Resource requirement analysis
 * - Risk assessment and mitigation
 * - Stakeholder mapping
 * - Progress tracking
 * - Impact measurement
 * - Dependency management
 */
export function ActionableInsightsGenerator({
  insights: _insights = [],
  recommendations: _recommendations = [],
  studyContext: _studyContext,
  onInsightsGenerated
}: ActionableInsightsGeneratorProps) {
  const [actionableInsights, setActionableInsights] = useState<ActionableInsight[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline' | 'kanban'>('cards');

  // Generate actionable insights
  const generateActionableInsights = useCallback(async () => {
    setProcessing(true);
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockInsights: ActionableInsight[] = [
        {
          id: 'ai-1',
          title: 'Expand Participant Recruitment',
          description: 'Increase sample size to 100 participants for improved statistical power and factor stability',
          category: 'immediate',
          priority: 'critical',
          type: 'research',
          actions: [
            {
              id: 'a1',
              title: 'Develop recruitment strategy',
              description: 'Create multi-channel recruitment plan targeting diverse demographics',
              owner: 'Research Lead',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'days',
              effortAmount: 3,
              status: 'not-started',
              subtasks: [
                { id: 's1', title: 'Identify recruitment channels', completed: false },
                { id: 's2', title: 'Create recruitment materials', completed: false },
                { id: 's3', title: 'Set up screening criteria', completed: false }
              ]
            },
            {
              id: 'a2',
              title: 'Launch recruitment campaign',
              description: 'Execute recruitment across identified channels',
              owner: 'Recruitment Coordinator',
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'weeks',
              effortAmount: 2,
              status: 'not-started',
              blockers: ['Budget approval pending']
            }
          ],
          impact: {
            area: 'Statistical Validity',
            magnitude: 'significant',
            confidence: 0.85
          },
          stakeholders: ['Research Team', 'Ethics Board', 'Finance', 'Participants'],
          timeline: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: [
              { id: 'm1', title: 'Strategy approved', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm2', title: '50 participants recruited', date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm3', title: '100 participants reached', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), achieved: false }
            ]
          },
          resources: {
            required: [
              { type: 'financial', name: 'Recruitment budget', quantity: 5000, unit: 'USD' },
              { type: 'human', name: 'Recruitment coordinator', quantity: 1 },
              { type: 'time', name: 'Timeline', quantity: 30, unit: 'days' }
            ],
            available: [
              { type: 'financial', name: 'Current budget', quantity: 3000, unit: 'USD' },
              { type: 'human', name: 'Research assistants', quantity: 2 }
            ],
            gap: [
              { type: 'financial', name: 'Additional funding', quantity: 2000, unit: 'USD' }
            ]
          },
          risks: [
            { description: 'Low response rate', probability: 'medium', impact: 'high', mitigation: 'Increase incentives' },
            { description: 'Budget overrun', probability: 'low', impact: 'medium', mitigation: 'Phased recruitment' }
          ],
          dependencies: ['Ethics approval', 'Budget allocation'],
          measurableOutcomes: [
            { metric: 'Sample size', target: 100, unit: 'participants', baseline: 50, method: 'Count' },
            { metric: 'Demographic diversity', target: 0.8, unit: 'index', baseline: 0.6, method: 'Simpson diversity index' },
            { metric: 'Factor stability', target: 0.9, unit: 'coefficient', method: 'Test-retest reliability' }
          ],
          status: 'pending'
        },
        {
          id: 'ai-2',
          title: 'Implement Member Checking Protocol',
          description: 'Validate interpretations with exemplar participants to enhance credibility',
          category: 'short-term',
          priority: 'high',
          type: 'methodology',
          actions: [
            {
              id: 'a3',
              title: 'Identify exemplar participants',
              description: 'Select 3-5 high-loading participants per factor',
              owner: 'Lead Analyst',
              deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'days',
              effortAmount: 2,
              status: 'in-progress',
              subtasks: [
                { id: 's4', title: 'Review factor loadings', completed: true },
                { id: 's5', title: 'Contact participants', completed: false },
                { id: 's6', title: 'Schedule interviews', completed: false }
              ]
            },
            {
              id: 'a4',
              title: 'Conduct validation interviews',
              description: 'Interview participants to validate factor interpretations',
              owner: 'Research Team',
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'weeks',
              effortAmount: 1,
              status: 'not-started'
            }
          ],
          impact: {
            area: 'Interpretation Validity',
            magnitude: 'significant',
            confidence: 0.92
          },
          stakeholders: ['Research Team', 'Participants', 'Academic Advisors'],
          timeline: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: [
              { id: 'm4', title: 'Participants identified', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm5', title: 'Interviews completed', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm6', title: 'Interpretations refined', date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), achieved: false }
            ]
          },
          resources: {
            required: [
              { type: 'human', name: 'Interviewers', quantity: 2 },
              { type: 'time', name: 'Interview time', quantity: 20, unit: 'hours' },
              { type: 'technical', name: 'Recording equipment', quantity: 1 }
            ],
            available: [
              { type: 'human', name: 'Research team', quantity: 3 },
              { type: 'technical', name: 'Zoom license', quantity: 1 }
            ],
            gap: []
          },
          risks: [
            { description: 'Participant availability', probability: 'medium', impact: 'medium', mitigation: 'Flexible scheduling' },
            { description: 'Interpretation conflicts', probability: 'low', impact: 'high', mitigation: 'Document all perspectives' }
          ],
          dependencies: ['Factor analysis complete'],
          measurableOutcomes: [
            { metric: 'Validation coverage', target: 100, unit: '%', baseline: 0, method: 'Percentage of factors validated' },
            { metric: 'Agreement score', target: 0.8, unit: 'coefficient', method: 'Cohen\'s kappa' }
          ],
          status: 'in-progress'
        },
        {
          id: 'ai-3',
          title: 'Create Stakeholder Communication Package',
          description: 'Develop accessible materials for different audience groups',
          category: 'short-term',
          priority: 'high',
          type: 'communication',
          actions: [
            {
              id: 'a5',
              title: 'Design executive summary',
              description: 'Create 2-page summary for decision makers',
              owner: 'Communications Lead',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'days',
              effortAmount: 3,
              status: 'not-started'
            },
            {
              id: 'a6',
              title: 'Create infographic',
              description: 'Visual summary of key findings',
              owner: 'Design Team',
              deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'days',
              effortAmount: 2,
              status: 'not-started'
            },
            {
              id: 'a7',
              title: 'Write policy brief',
              description: 'Policy recommendations based on findings',
              owner: 'Policy Advisor',
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'days',
              effortAmount: 5,
              status: 'not-started'
            }
          ],
          impact: {
            area: 'Knowledge Transfer',
            magnitude: 'moderate',
            confidence: 0.88
          },
          stakeholders: ['Policy Makers', 'Partner Organizations', 'Public', 'Media'],
          timeline: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: [
              { id: 'm7', title: 'Executive summary ready', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm8', title: 'All materials complete', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), achieved: false }
            ]
          },
          resources: {
            required: [
              { type: 'human', name: 'Communications specialist', quantity: 1 },
              { type: 'human', name: 'Graphic designer', quantity: 1 },
              { type: 'technical', name: 'Design software', quantity: 1 }
            ],
            available: [
              { type: 'human', name: 'Research team', quantity: 3 },
              { type: 'technical', name: 'Canva Pro', quantity: 1 }
            ],
            gap: [
              { type: 'human', name: 'Professional designer', quantity: 1 }
            ]
          },
          risks: [
            { description: 'Message dilution', probability: 'medium', impact: 'medium', mitigation: 'Stakeholder review' },
            { description: 'Misinterpretation', probability: 'low', impact: 'high', mitigation: 'Clear messaging guidelines' }
          ],
          dependencies: ['Final results approval'],
          measurableOutcomes: [
            { metric: 'Stakeholder reach', target: 500, unit: 'people', method: 'Distribution tracking' },
            { metric: 'Engagement rate', target: 0.3, unit: 'ratio', method: 'Response/feedback rate' }
          ],
          status: 'pending'
        },
        {
          id: 'ai-4',
          title: 'Plan Follow-up Study',
          description: 'Design expanded study with additional statement dimensions',
          category: 'long-term',
          priority: 'medium',
          type: 'research',
          actions: [
            {
              id: 'a8',
              title: 'Analyze qualitative feedback',
              description: 'Extract themes for new statement generation',
              owner: 'Research Lead',
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'weeks',
              effortAmount: 2,
              status: 'not-started'
            },
            {
              id: 'a9',
              title: 'Develop expanded statement set',
              description: 'Create 30-40 additional statements',
              owner: 'Research Team',
              deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'weeks',
              effortAmount: 3,
              status: 'not-started'
            }
          ],
          impact: {
            area: 'Research Depth',
            magnitude: 'significant',
            confidence: 0.75
          },
          stakeholders: ['Research Team', 'Funding Body', 'Academic Community'],
          timeline: {
            start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: [
              { id: 'm9', title: 'Themes identified', date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm10', title: 'Funding secured', date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), achieved: false }
            ]
          },
          resources: {
            required: [
              { type: 'financial', name: 'Research grant', quantity: 50000, unit: 'USD' },
              { type: 'human', name: 'Research team', quantity: 4 },
              { type: 'time', name: 'Study duration', quantity: 6, unit: 'months' }
            ],
            available: [
              { type: 'human', name: 'Current team', quantity: 3 }
            ],
            gap: [
              { type: 'financial', name: 'Grant funding', quantity: 50000, unit: 'USD' },
              { type: 'human', name: 'Additional researcher', quantity: 1 }
            ]
          },
          risks: [
            { description: 'Funding rejection', probability: 'medium', impact: 'high', mitigation: 'Multiple funding sources' },
            { description: 'Participant fatigue', probability: 'low', impact: 'medium', mitigation: 'Improved incentives' }
          ],
          dependencies: ['Current study completion', 'Funding availability'],
          measurableOutcomes: [
            { metric: 'Statement coverage', target: 80, unit: 'statements', baseline: 40, method: 'Count' },
            { metric: 'Explained variance', target: 0.7, unit: 'R-squared', method: 'Factor analysis' }
          ],
          status: 'pending'
        },
        {
          id: 'ai-5',
          title: 'Establish Research Impact Framework',
          description: 'Create system for measuring and tracking research impact over time',
          category: 'strategic',
          priority: 'medium',
          type: 'policy',
          actions: [
            {
              id: 'a10',
              title: 'Define impact metrics',
              description: 'Establish KPIs for research impact',
              owner: 'Impact Officer',
              deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'days',
              effortAmount: 5,
              status: 'not-started'
            },
            {
              id: 'a11',
              title: 'Set up tracking system',
              description: 'Implement monitoring dashboard',
              owner: 'Data Analyst',
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              effort: 'weeks',
              effortAmount: 2,
              status: 'not-started'
            }
          ],
          impact: {
            area: 'Research Excellence',
            magnitude: 'transformational',
            confidence: 0.7
          },
          stakeholders: ['University', 'Funding Bodies', 'Research Community'],
          timeline: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            milestones: [
              { id: 'm11', title: 'Framework approved', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), achieved: false },
              { id: 'm12', title: 'First impact report', date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), achieved: false }
            ]
          },
          resources: {
            required: [
              { type: 'human', name: 'Impact assessment specialist', quantity: 1 },
              { type: 'technical', name: 'Analytics platform', quantity: 1 }
            ],
            available: [
              { type: 'technical', name: 'Basic analytics tools', quantity: 1 }
            ],
            gap: [
              { type: 'human', name: 'Impact specialist', quantity: 1 }
            ]
          },
          risks: [
            { description: 'Measurement complexity', probability: 'high', impact: 'medium', mitigation: 'Start with simple metrics' },
            { description: 'Attribution challenges', probability: 'medium', impact: 'medium', mitigation: 'Multiple data sources' }
          ],
          dependencies: ['Institutional support'],
          measurableOutcomes: [
            { metric: 'Citation count', target: 50, unit: 'citations', baseline: 0, method: 'Google Scholar' },
            { metric: 'Policy influence', target: 3, unit: 'policies', method: 'Document analysis' },
            { metric: 'Media mentions', target: 10, unit: 'articles', method: 'Media monitoring' }
          ],
          status: 'pending'
        }
      ];
      
      setActionableInsights(mockInsights);
      
      if (onInsightsGenerated) {
        onInsightsGenerated(mockInsights);
      }
    } catch (error) {
      console.error('Error generating actionable insights:', error);
    } finally {
      setProcessing(false);
    }
  }, [onInsightsGenerated]);

  // Toggle action status
  const toggleActionStatus = (insightId: string, actionId: string) => {
    setActionableInsights(prev => prev.map(insight => {
      if (insight.id === insightId) {
        return {
          ...insight,
          actions: insight.actions.map(action => {
            if (action.id === actionId) {
              const statuses = ['not-started', 'in-progress', 'completed', 'blocked'];
              const currentIndex = statuses.indexOf(action.status);
              const nextStatus = statuses[(currentIndex + 1) % statuses.length] as Action['status'];
              return { ...action, status: nextStatus };
            }
            return action;
          })
        };
      }
      return insight;
    }));
  };

  // Toggle subtask completion
  const toggleSubtask = (insightId: string, actionId: string, subtaskId: string) => {
    setActionableInsights(prev => prev.map(insight => {
      if (insight.id === insightId) {
        return {
          ...insight,
          actions: insight.actions.map(action => {
            if (action.id === actionId && action.subtasks) {
              return {
                ...action,
                subtasks: action.subtasks.map(subtask => 
                  subtask.id === subtaskId 
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                )
              };
            }
            return action;
          })
        };
      }
      return insight;
    }));
  };

  // Calculate progress
  const calculateProgress = (insight: ActionableInsight): number => {
    const totalActions = insight.actions.length;
    const completedActions = insight.actions.filter(a => a.status === 'completed').length;
    return totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
  };

  // Get priority color
  const getPriorityColor = (priority: ActionableInsight['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Action['status']) => {
    switch (status) {
      case 'completed': return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <PlayIcon className="w-4 h-4 text-blue-500" />;
      case 'blocked': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default: return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filter insights
  const filteredInsights = useMemo(() => {
    return actionableInsights.filter(insight => {
      if (filterCategory !== 'all' && insight.category !== filterCategory) return false;
      if (filterPriority !== 'all' && insight.priority !== filterPriority) return false;
      return true;
    });
  }, [actionableInsights, filterCategory, filterPriority]);

  // Group insights by category for kanban view
  const kanbanColumns = useMemo(() => {
    const columns = {
      immediate: { title: 'Immediate', color: 'red', insights: [] as ActionableInsight[] },
      'short-term': { title: 'Short Term', color: 'orange', insights: [] as ActionableInsight[] },
      'long-term': { title: 'Long Term', color: 'blue', insights: [] as ActionableInsight[] },
      strategic: { title: 'Strategic', color: 'purple', insights: [] as ActionableInsight[] }
    };
    
    filteredInsights.forEach(insight => {
      columns[insight.category].insights.push(insight);
    });
    
    return columns;
  }, [filteredInsights]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <RocketLaunchIcon className="w-6 h-6 text-green-600" />
              Actionable Insights Generator
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Transform insights into concrete action plans
            </p>
          </div>
          <Button
            onClick={generateActionableInsights}
            disabled={processing}
            variant="primary"
            size="sm"
          >
            {processing ? <LoadingSpinner size="sm" /> : 'Generate Action Plans'}
          </Button>
        </div>

        {/* View Mode & Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1">
            <Button
              onClick={() => setViewMode('cards')}
              variant={viewMode === 'cards' ? 'primary' : 'secondary'}
              size="sm"
            >
              Cards
            </Button>
            <Button
              onClick={() => setViewMode('timeline')}
              variant={viewMode === 'timeline' ? 'primary' : 'secondary'}
              size="sm"
            >
              Timeline
            </Button>
            <Button
              onClick={() => setViewMode('kanban')}
              variant={viewMode === 'kanban' ? 'primary' : 'secondary'}
              size="sm"
            >
              Kanban
            </Button>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="immediate">Immediate</option>
            <option value="short-term">Short Term</option>
            <option value="long-term">Long Term</option>
            <option value="strategic">Strategic</option>
          </select>

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
        </div>

        {/* Summary Stats */}
        {actionableInsights.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {actionableInsights.filter(i => i.priority === 'critical').length}
              </div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {actionableInsights.flatMap(i => i.actions).length}
              </div>
              <div className="text-xs text-gray-500">Total Actions</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {actionableInsights.filter(i => i.status === 'in-progress').length}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Array.from(new Set(actionableInsights.flatMap(i => i.stakeholders))).length}
              </div>
              <div className="text-xs text-gray-500">Stakeholders</div>
            </div>
          </div>
        )}
      </Card>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  {/* Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedInsight(
                      selectedInsight === insight.id ? null : insight.id
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline">{insight.category}</Badge>
                          <Badge variant={
                            insight.impact.magnitude === 'transformational' ? 'destructive' :
                            insight.impact.magnitude === 'significant' ? 'warning' :
                            insight.impact.magnitude === 'moderate' ? 'info' : 'default'
                          } size="sm">
                            {insight.impact.magnitude} impact
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.description}
                        </p>

                        {/* Quick Stats */}
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1">
                            <ClipboardDocumentCheckIcon className="w-4 h-4" />
                            {insight.actions.length} actions
                          </span>
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-4 h-4" />
                            {insight.stakeholders.length} stakeholders
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {insight.timeline.milestones.length} milestones
                          </span>
                        </div>
                      </div>
                      <ArrowRightIcon className={`w-5 h-5 transition-transform ${
                        selectedInsight === insight.id ? 'rotate-90' : ''
                      }`} />
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{calculateProgress(insight).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${calculateProgress(insight)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {selectedInsight === insight.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t"
                      >
                        <div className="p-6 space-y-6">
                          {/* Actions */}
                          <div>
                            <h5 className="font-medium mb-3">Action Items</h5>
                            <div className="space-y-3">
                              {insight.actions.map(action => (
                                <div key={action.id} className="border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start gap-2">
                                      <button
                                        onClick={() => toggleActionStatus(insight.id, action.id)}
                                        className="mt-0.5"
                                      >
                                        {getStatusIcon(action.status)}
                                      </button>
                                      <div className="flex-1">
                                        <h6 className="font-medium">{action.title}</h6>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {action.description}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant={
                                      action.status === 'completed' ? 'success' :
                                      action.status === 'in-progress' ? 'info' :
                                      action.status === 'blocked' ? 'destructive' : 'default'
                                    } size="sm">
                                      {action.status}
                                    </Badge>
                                  </div>

                                  <div className="flex gap-4 text-xs text-gray-500 mb-2">
                                    {action.owner && (
                                      <span>Owner: {action.owner}</span>
                                    )}
                                    <span>Due: {new Date(action.deadline).toLocaleDateString()}</span>
                                    <span>Effort: {action.effortAmount} {action.effort}</span>
                                  </div>

                                  {/* Subtasks */}
                                  {action.subtasks && action.subtasks.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {action.subtasks.map(subtask => (
                                        <div key={subtask.id} className="flex items-center gap-2">
                                          <button
                                            onClick={() => toggleSubtask(insight.id, action.id, subtask.id)}
                                            className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
                                              subtask.completed 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-300 hover:border-blue-500'
                                            }`}
                                          >
                                            {subtask.completed && (
                                              <CheckIcon className="w-2 h-2 text-white mx-auto" />
                                            )}
                                          </button>
                                          <span className={`text-sm ${
                                            subtask.completed ? 'line-through text-gray-500' : ''
                                          }`}>
                                            {subtask.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Blockers */}
                                  {action.blockers && action.blockers.length > 0 && (
                                    <div className="mt-2">
                                      <div className="flex gap-1">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                        <span className="text-xs text-red-600">
                                          Blocked by: {action.blockers.join(', ')}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Resources */}
                          <div>
                            <h5 className="font-medium mb-2">Resources</h5>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <h6 className="font-medium text-green-600 mb-1">Required</h6>
                                {insight.resources.required.map((r, i) => (
                                  <div key={i} className="text-gray-600">
                                    • {r.name} {r.quantity && `(${r.quantity} ${r.unit || ''})`}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <h6 className="font-medium text-blue-600 mb-1">Available</h6>
                                {insight.resources.available.map((r, i) => (
                                  <div key={i} className="text-gray-600">
                                    • {r.name} {r.quantity && `(${r.quantity} ${r.unit || ''})`}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <h6 className="font-medium text-red-600 mb-1">Gap</h6>
                                {insight.resources.gap.length > 0 ? (
                                  insight.resources.gap.map((r, i) => (
                                    <div key={i} className="text-gray-600">
                                      • {r.name} {r.quantity && `(${r.quantity} ${r.unit || ''})`}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-400">None</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Measurable Outcomes */}
                          <div>
                            <h5 className="font-medium mb-2">Expected Outcomes</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {insight.measurableOutcomes.map((outcome, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                  <div className="font-medium text-sm">{outcome.metric}</div>
                                  <div className="flex items-baseline gap-2 mt-1">
                                    {outcome.baseline !== undefined && (
                                      <span className="text-sm text-gray-500">
                                        {outcome.baseline}
                                      </span>
                                    )}
                                    <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                                    <span className="text-lg font-semibold text-green-600">
                                      {outcome.target}
                                    </span>
                                    <span className="text-sm text-gray-500">{outcome.unit}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    via {outcome.method}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card className="p-6">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />
            {filteredInsights
              .sort((a, b) => new Date(a.timeline.start).getTime() - new Date(b.timeline.start).getTime())
              .map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-start gap-4 mb-8"
                >
                  <div className="w-16 flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(insight.timeline.start).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10 ${
                    insight.priority === 'critical' ? 'bg-red-500' :
                    insight.priority === 'high' ? 'bg-orange-500' :
                    insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <Card className="p-4">
                      <h4 className="font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {insight.description}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline" size="sm">{insight.category}</Badge>
                        <Badge variant="outline" size="sm">{insight.type}</Badge>
                      </div>
                      {/* Milestones */}
                      <div className="mt-3 space-y-1">
                        {insight.timeline.milestones.map(milestone => (
                          <div key={milestone.id} className="flex items-center gap-2 text-sm">
                            <FlagIcon className={`w-3 h-3 ${
                              milestone.achieved ? 'text-green-500' : 'text-gray-400'
                            }`} />
                            <span className={milestone.achieved ? 'line-through text-gray-500' : ''}>
                              {milestone.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({new Date(milestone.date).toLocaleDateString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </motion.div>
              ))}
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(kanbanColumns).map(([key, column]) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{column.title}</h4>
                <Badge variant="outline">{column.insights.length}</Badge>
              </div>
              <div className="space-y-2">
                {column.insights.map(insight => (
                  <Card key={insight.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getPriorityColor(insight.priority)} size="sm">
                        {insight.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {calculateProgress(insight).toFixed(0)}%
                      </span>
                    </div>
                    <h5 className="font-medium text-sm mb-1">{insight.title}</h5>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ClipboardDocumentCheckIcon className="w-3 h-3" />
                      {insight.actions.filter(a => a.status === 'completed').length}/{insight.actions.length}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}