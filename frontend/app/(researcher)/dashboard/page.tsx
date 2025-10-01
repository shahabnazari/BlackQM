'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { studyApi, Study } from '@/lib/api/study';
import {
  BookOpenIcon,
  LightBulbIcon,
  WrenchIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  BellAlertIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  CpuChipIcon,
  LightBulbIcon as BulbIcon,
  DocumentMagnifyingGlassIcon,
  PlusIcon,
  PlayIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { phaseProgressService } from '@/lib/navigation/phase-progress.service';
import { ResearchPhase } from '@/components/navigation/PrimaryToolbar';
import { useAuth } from '@/hooks/auth/useAuth';
import {
  format,
  formatDistanceToNow,
  subDays,
  differenceInDays,
} from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// Phase icons mapping
const phaseIcons: Record<ResearchPhase, React.ComponentType<any>> = {
  discover: BookOpenIcon,
  design: LightBulbIcon,
  build: WrenchIcon,
  recruit: UsersIcon,
  collect: ClipboardDocumentListIcon,
  analyze: BeakerIcon,
  visualize: ChartBarIcon,
  interpret: DocumentMagnifyingGlassIcon,
  report: DocumentTextIcon,
  archive: ArchiveBoxIcon,
};

// Phase colors for consistent theming
const phaseColors: Record<
  ResearchPhase,
  { gradient: string; bg: string; text: string; border: string }
> = {
  discover: {
    gradient: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  design: {
    gradient: 'from-amber-500 to-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  build: {
    gradient: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  recruit: {
    gradient: 'from-green-500 to-green-700',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  collect: {
    gradient: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  analyze: {
    gradient: 'from-indigo-500 to-indigo-700',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  visualize: {
    gradient: 'from-pink-500 to-pink-700',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
  },
  interpret: {
    gradient: 'from-rose-500 to-rose-700',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  report: {
    gradient: 'from-teal-500 to-teal-700',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  archive: {
    gradient: 'from-gray-500 to-gray-700',
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800',
  },
};

// AI-powered insights interface
interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  priority: 'high' | 'medium' | 'low';
  phase?: ResearchPhase;
}

// Study metrics interface
interface StudyMetrics extends Study {
  name: string;
  phase: ResearchPhase;
  progress: number;
  participants: number;
  completionRate: number;
  quality: number;
  lastActivity: Date;
  nextDeadline?: Date;
  trend: 'up' | 'down' | 'stable';
}

// Helper to convert Study to StudyMetrics
function toStudyMetrics(study: Study): StudyMetrics {
  // Determine phase based on study status and data
  let phase: ResearchPhase = 'design';
  if (study.status === 'draft') phase = 'build';
  else if (study.status === 'active' && !study.statistics?.totalParticipants)
    phase = 'recruit';
  else if (study.status === 'active' && study.statistics?.totalParticipants)
    phase = 'collect';
  else if (
    study.statistics?.completedSorts &&
    study.statistics.completedSorts > 0
  )
    phase = 'analyze';

  const result: StudyMetrics = {
    ...study,
    name: study.title,
    phase,
    progress:
      study.status === 'completed'
        ? 100
        : study.status === 'active'
          ? 50 + (study.statistics?.responseRate || 0) / 2
          : 25,
    participants: study.statistics?.totalParticipants || 0,
    completionRate: study.statistics?.responseRate || 0,
    quality: 85, // Default quality score
    lastActivity: new Date(study.updatedAt),
    trend: 'stable' as const,
  };

  if (study.status === 'active') {
    result.nextDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  return result;
}

export default function WorldClassDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [studies, setStudies] = useState<StudyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<ResearchPhase>('discover');
  const [viewMode, setViewMode] = useState<
    'overview' | 'detailed' | 'timeline'
  >('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>(
    '30d'
  );

  // Fetch real studies on mount
  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setLoading(true);
        const apiStudies = await studyApi.getStudies();
        const studyMetrics = apiStudies.map(toStudyMetrics);
        setStudies(studyMetrics);

        // Auto-select first active or draft study
        if (studyMetrics.length > 0) {
          const activeStudy =
            studyMetrics.find(s => s.status === 'active') ||
            studyMetrics.find(s => s.status === 'draft') ||
            studyMetrics[0];
          if (activeStudy) {
            setSelectedStudyId(activeStudy.id);
            setCurrentPhase(activeStudy.phase);
          }
        }
      } catch (error) {
        console.error('Failed to fetch studies:', error);
        // Fallback to empty state
        setStudies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, []);

  // Initialize phase progress for the selected study
  const studyProgress = useMemo(() => {
    return selectedStudyId
      ? phaseProgressService.getStudyProgress(selectedStudyId)
      : phaseProgressService.getStudyProgress('default');
  }, [selectedStudyId]);

  // Group studies by status for better organization
  const draftStudies = useMemo(
    () => studies.filter(s => s.status === 'draft'),
    [studies]
  );
  const activeStudies = useMemo(
    () => studies.filter(s => s.status === 'active'),
    [studies]
  );
  const completedStudies = useMemo(
    () => studies.filter(s => s.status === 'completed'),
    [studies]
  );

  // Get active study for context
  const activeStudy = studies.find(s => s.id === selectedStudyId) || studies[0];

  // AI-powered insights based on current context
  const aiInsights: AIInsight[] = useMemo(() => {
    if (!activeStudy) return [];

    const insights: AIInsight[] = [];

    // Dynamic insights based on study status
    if (activeStudy.status === 'draft') {
      insights.push({
        id: '1',
        type: 'recommendation',
        title: 'Complete Your Study Setup',
        description:
          'Your study is still in draft. Add statements and configure the Q-grid to start collecting responses.',
        action: {
          label: 'Continue Setup',
          href: `/studies/${activeStudy.id}/edit`,
        },
        priority: 'high',
      });
    }

    if (activeStudy.status === 'active' && activeStudy.participants < 10) {
      insights.push({
        id: '2',
        type: 'warning',
        title: 'Low Participant Count',
        description: `Only ${activeStudy.participants} participants so far. Q-methodology typically requires 20-40 participants for reliable results.`,
        action: {
          label: 'Invite More',
          href: `/studies/${activeStudy.id}/participants/invite`,
        },
        priority: 'high',
      });
    }

    if (activeStudy.completionRate < 50 && activeStudy.status === 'active') {
      insights.push({
        id: '3',
        type: 'info',
        title: 'Improve Completion Rate',
        description: `Your completion rate is ${activeStudy.completionRate}%. Consider simplifying instructions or reducing the number of statements.`,
        action: {
          label: 'View Analytics',
          href: `/analysis/hub/${activeStudy.id}`,
        },
        priority: 'medium',
      });
    }

    if (activeStudy.status === 'active' && activeStudy.participants >= 20) {
      insights.push({
        id: '4',
        type: 'success',
        title: 'Ready for Analysis',
        description: `Great progress! You have ${activeStudy.participants} participants. You can now run factor analysis.`,
        action: {
          label: 'Run Analysis',
          href: `/analysis/hub/${activeStudy.id}`,
        },
        priority: 'high',
      });
    }

    // Add generic insights if needed
    while (insights.length < 4) {
      insights.push({
        id: `generic-${insights.length}`,
        type: 'info',
        title:
          insights.length === 0
            ? 'Explore Literature'
            : insights.length === 1
              ? 'Check Best Practices'
              : insights.length === 2
                ? 'Review Methodology'
                : 'Community Resources',
        description:
          insights.length === 0
            ? 'Start with a literature review to ground your research.'
            : insights.length === 1
              ? 'Follow Q-methodology best practices for reliable results.'
              : insights.length === 2
                ? 'Ensure your methodology aligns with your research questions.'
                : 'Connect with other researchers using Q-methodology.',
        action: {
          label: 'Learn More',
          href:
            insights.length === 0
              ? '/discover/literature'
              : insights.length === 1
                ? '/help/best-practices'
                : insights.length === 2
                  ? '/design/methodology'
                  : '/community',
        },
        priority: 'low',
      });
    }

    return insights;
  }, [activeStudy]);

  // Timeline data for activity chart
  const timelineData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'MMM dd'),
      participants: Math.floor(Math.random() * 15) + 5,
      responses: Math.floor(Math.random() * 30) + 10,
      quality: Math.floor(Math.random() * 20) + 75,
    };
  });

  // Phase distribution data
  const phaseDistribution = [
    { name: 'Discover', value: 100, color: '#9333ea' },
    { name: 'Design', value: 100, color: '#f59e0b' },
    { name: 'Build', value: 85, color: '#3b82f6' },
    { name: 'Recruit', value: 60, color: '#10b981' },
    { name: 'Collect', value: 45, color: '#06b6d4' },
    { name: 'Analyze', value: 20, color: '#6366f1' },
    { name: 'Visualize', value: 0, color: '#ec4899' },
    { name: 'Interpret', value: 0, color: '#f43f5e' },
    { name: 'Report', value: 0, color: '#14b8a6' },
    { name: 'Archive', value: 0, color: '#6b7280' },
  ];

  // Research velocity radar chart data
  const researchVelocity = [
    { phase: 'Literature', current: 85, benchmark: 70 },
    { phase: 'Design', current: 92, benchmark: 80 },
    { phase: 'Collection', current: 78, benchmark: 75 },
    { phase: 'Analysis', current: 65, benchmark: 85 },
    { phase: 'Writing', current: 45, benchmark: 60 },
    { phase: 'Collaboration', current: 88, benchmark: 70 },
  ];

  const availablePhases = selectedStudyId
    ? phaseProgressService.getAvailablePhases(selectedStudyId)
    : [];
  const currentPhaseProgress = studyProgress.phases.get(currentPhase);

  // Show loading state while fetching studies
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading your research dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no studies
  // No longer return early for empty state - show full dashboard
  const hasStudies = studies.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section with Personalized Greeting */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {hasStudies
                    ? `Welcome back, ${user?.name || 'Researcher'}`
                    : `Welcome, ${user?.name || 'Researcher'}`}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                  {hasStudies
                    ? `Your research journey continues • ${studies.length} ${studies.length === 1 ? 'study' : 'studies'} in progress`
                    : 'Begin your Q-methodology research journey today'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setViewMode(
                      viewMode === 'overview'
                        ? 'detailed'
                        : viewMode === 'detailed'
                          ? 'timeline'
                          : 'overview'
                    )
                  }
                >
                  <CpuChipIcon className="w-4 h-4 mr-2" />
                  {viewMode === 'overview'
                    ? 'Detailed View'
                    : viewMode === 'detailed'
                      ? 'Timeline'
                      : 'Overview'}
                </Button>
                <Button
                  variant="default"
                  onClick={() => router.push('/studies/create')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  New Study
                </Button>
              </div>
            </div>

            {/* Research Health Score - Only show when there are studies */}
            {hasStudies && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-6 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(studyProgress.overallProgress * 226.2) / 100} 226.2`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {studyProgress.overallProgress}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Research Health Score
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Excellent progress across {availablePhases.length}{' '}
                        active phases
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {studies.filter(s => s.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Active Studies
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {studies.reduce((sum, s) => sum + s.participants, 0)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Participants
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {studies.length > 0
                          ? `${Math.round(studies.reduce((sum, s) => sum + s.quality, 0) / studies.length)}%`
                          : '—'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Avg. Quality
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section for New Users - Only shows when no studies */}
          {!hasStudies && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardContent className="py-12">
                  <div className="text-center max-w-2xl mx-auto">
                    <AcademicCapIcon className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Welcome to VQMethod Research Platform
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                      Start your Q-methodology research journey with our
                      comprehensive tools and guided workflows.
                    </p>
                    <div className="flex justify-center gap-4 mb-8">
                      <Button
                        variant="default"
                        size="lg"
                        onClick={() => router.push('/studies/create')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create Your First Study
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push('/discover/literature')}
                      >
                        <BookOpenIcon className="w-5 h-5 mr-2" />
                        Start with Literature Review
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <DocumentMagnifyingGlassIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Discover</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Review literature and identify research gaps
                        </p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <WrenchIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Build</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Design your Q-methodology study
                        </p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <ChartBarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Analyze</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Interpret results with AI assistance
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* My Studies Section - Shows always but adapts content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Studies</CardTitle>
                    <CardDescription>
                      {hasStudies
                        ? `${studies.length} total • ${activeStudies.length} active • ${draftStudies.length} drafts`
                        : 'Get started with your first study'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => router.push('/studies/create')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Study
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Empty state when no studies */}
                {!hasStudies && (
                  <div className="text-center py-8">
                    <FolderOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No studies yet. Create your first study to get started.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/discover')}
                      >
                        <BookOpenIcon className="w-4 h-4 mr-2" />
                        Explore Literature
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/design/questions')}
                      >
                        <LightBulbIcon className="w-4 h-4 mr-2" />
                        Design Research
                      </Button>
                    </div>
                  </div>
                )}

                {/* Draft Studies - Priority for continuation */}
                {draftStudies.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      Continue Working On
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {draftStudies.map(study => (
                        <motion.div
                          key={study.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{study.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Last edited{' '}
                                {formatDistanceToNow(study.lastActivity, {
                                  addSuffix: true,
                                })}
                              </p>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(
                                      `/studies/${study.id}/dashboard`
                                    )
                                  }
                                >
                                  <PlayIcon className="w-3 h-3 mr-1" />
                                  Open Study
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(`/studies/${study.id}/preview`)
                                  }
                                >
                                  Preview
                                </Button>
                              </div>
                            </div>
                            <Badge variant="warning">Draft</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Studies - Monitor progress */}
                {activeStudies.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      Active Studies
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeStudies.map(study => (
                        <motion.div
                          key={study.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{study.name}</h4>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-600">
                                  <UsersIcon className="w-4 h-4 inline mr-1" />
                                  {study.participants} participants
                                </span>
                                <span className="text-sm text-gray-600">
                                  {study.completionRate}% complete
                                </span>
                              </div>
                              <ProgressBar
                                value={study.progress}
                                className="mt-2"
                              />
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    router.push(
                                      `/studies/${study.id}/dashboard`
                                    )
                                  }
                                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                                >
                                  <BeakerIcon className="w-3 h-3 mr-1" />
                                  View Dashboard
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(
                                      `/studies/${study.id}/dashboard`
                                    )
                                  }
                                >
                                  Manage
                                </Button>
                              </div>
                            </div>
                            <Badge variant="success">Active</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Studies */}
                {completedStudies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      Completed Studies
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {completedStudies.map(study => (
                        <motion.div
                          key={study.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{study.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Completed{' '}
                                {formatDistanceToNow(study.lastActivity, {
                                  addSuffix: true,
                                })}
                              </p>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(
                                      `/studies/${study.id}/dashboard`
                                    )
                                  }
                                >
                                  View Study
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(`/reports/${study.id}`)
                                  }
                                >
                                  Export Report
                                </Button>
                              </div>
                            </div>
                            <Badge variant="info">Completed</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Study Selector for context */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">
                      Active Study Context:
                    </label>
                    <select
                      value={selectedStudyId}
                      onChange={e => {
                        setSelectedStudyId(e.target.value);
                        const study = studies.find(
                          s => s.id === e.target.value
                        );
                        if (study) setCurrentPhase(study.phase);
                      }}
                      className="px-3 py-1 text-sm border rounded-lg dark:bg-gray-800"
                    >
                      <option value="">Select a study...</option>
                      {studies.map(study => (
                        <option key={study.id} value={study.id}>
                          {study.name} ({study.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BulbIcon className="w-6 h-6 text-yellow-500" />
                    <CardTitle>AI-Powered Insights</CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  >
                    {aiInsights.length} New
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.slice(0, 4).map(insight => (
                    <motion.div
                      key={insight.id}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        'p-4 rounded-lg border-2',
                        insight.type === 'recommendation' &&
                          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
                        insight.type === 'warning' &&
                          'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                        insight.type === 'success' &&
                          'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
                        insight.type === 'info' &&
                          'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            insight.type === 'recommendation' &&
                              'bg-blue-100 dark:bg-blue-900',
                            insight.type === 'warning' &&
                              'bg-amber-100 dark:bg-amber-900',
                            insight.type === 'success' &&
                              'bg-green-100 dark:bg-green-900',
                            insight.type === 'info' &&
                              'bg-gray-100 dark:bg-gray-900'
                          )}
                        >
                          {insight.type === 'recommendation' && (
                            <SparklesIcon className="w-5 h-5 text-blue-600" />
                          )}
                          {insight.type === 'warning' && (
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                          )}
                          {insight.type === 'success' && (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          )}
                          {insight.type === 'info' && (
                            <BellAlertIcon className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {insight.description}
                          </p>
                          {insight.action && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="mt-2"
                              onClick={() => router.push(insight.action!.href)}
                            >
                              {insight.action.label}
                              <ChevronRightIcon className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Phase Journey Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Research Phase Journey</CardTitle>
                <CardDescription>
                  Track your progress across all research phases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2" />
                  <div className="relative flex justify-between">
                    {phaseDistribution.map(phase => {
                      const phaseKey =
                        phase.name.toLowerCase() as ResearchPhase;
                      const phaseData = studyProgress.phases.get(phaseKey);
                      const isAvailable = availablePhases.includes(phaseKey);
                      const isComplete = phaseData?.progress === 100;
                      const isCurrent = currentPhase === phaseKey;
                      const Icon = phaseIcons[phaseKey];

                      if (!Icon) return null;

                      return (
                        <motion.div
                          key={phase.name}
                          whileHover={{ scale: 1.1 }}
                          className="relative flex flex-col items-center cursor-pointer"
                          onClick={() => {
                            setCurrentPhase(phaseKey);
                            router.push(`/phases/${phaseKey}`);
                          }}
                        >
                          <div
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                              isComplete && 'bg-green-500 border-green-500',
                              isCurrent &&
                                !isComplete &&
                                `bg-gradient-to-r ${phaseColors[phaseKey].gradient} border-transparent`,
                              !isCurrent &&
                                !isComplete &&
                                isAvailable &&
                                'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                              !isAvailable &&
                                'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50'
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-6 h-6',
                                isComplete && 'text-white',
                                isCurrent && !isComplete && 'text-white',
                                !isCurrent &&
                                  !isComplete &&
                                  isAvailable &&
                                  phaseColors[phaseKey].text,
                                !isAvailable && 'text-gray-400'
                              )}
                            />
                          </div>
                          <span
                            className={cn(
                              'text-xs mt-2 font-medium',
                              isCurrent && 'text-blue-600 dark:text-blue-400',
                              !isCurrent &&
                                isAvailable &&
                                'text-gray-700 dark:text-gray-300',
                              !isAvailable && 'text-gray-400'
                            )}
                          >
                            {phase.name}
                          </span>
                          {phaseData && phaseData.progress > 0 && (
                            <div className="absolute -bottom-6 text-xs font-bold">
                              {phaseData.progress}%
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Studies with Real-time Metrics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-xl h-full">
                <CardHeader>
                  <CardTitle>
                    {activeStudy ? activeStudy.name : 'Select a Study'}
                  </CardTitle>
                  <CardDescription>
                    {activeStudy
                      ? `${activeStudy.status} • ${activeStudy.phase} phase`
                      : 'Choose a study from above to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeStudy ? (
                    <>
                      {/* Study Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div
                          className={cn(
                            'p-4 rounded-lg',
                            phaseColors[activeStudy.phase]?.bg || 'bg-gray-100'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Phase Progress
                            </span>
                            <Badge
                              className={phaseColors[activeStudy.phase].text}
                            >
                              {activeStudy.phase}
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                              {activeStudy.progress}%
                            </span>
                            {activeStudy.trend === 'up' && (
                              <ArrowUpIcon className="w-4 h-4 text-green-500" />
                            )}
                            {activeStudy.trend === 'down' && (
                              <ArrowDownIcon className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <ProgressBar
                            value={activeStudy.progress}
                            className="mt-2"
                          />
                        </div>

                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Participants
                            </span>
                            <UsersIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                              {activeStudy.participants}
                            </span>
                            <span className="text-sm text-gray-600">
                              /{activeStudy.participants + 50} target
                            </span>
                          </div>
                          <ProgressBar
                            value={
                              (activeStudy.participants /
                                (activeStudy.participants + 50)) *
                              100
                            }
                            className="mt-2"
                          />
                        </div>

                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Completion Rate
                            </span>
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                              {activeStudy.completionRate}%
                            </span>
                            <span className="text-sm text-green-600">
                              +5% this week
                            </span>
                          </div>
                          <ProgressBar
                            value={activeStudy.completionRate}
                            className="mt-2 bg-green-100"
                          />
                        </div>

                        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Data Quality
                            </span>
                            <SparklesIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                              {activeStudy.quality}%
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Excellent
                            </Badge>
                          </div>
                          <ProgressBar
                            value={activeStudy.quality}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Activity Timeline Chart */}
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-4">
                          30-Day Activity Timeline
                        </h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={timelineData}>
                            <defs>
                              <linearGradient
                                id="colorParticipants"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorResponses"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#8b5cf6"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#8b5cf6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#6b7280"
                              fontSize={12}
                            />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="participants"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#colorParticipants)"
                            />
                            <Area
                              type="monotone"
                              dataKey="responses"
                              stroke="#8b5cf6"
                              fillOpacity={1}
                              fill="url(#colorResponses)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Phase-specific Actions */}
                      {activeStudy && (
                        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <h4 className="text-sm font-semibold mb-3">
                            Recommended Actions for {activeStudy.phase} Phase
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {currentPhaseProgress?.tasks
                              .filter(t => !t.completed)
                              .slice(0, 4)
                              .map(task => (
                                <Button
                                  key={task.id}
                                  variant="secondary"
                                  size="sm"
                                  className="justify-start"
                                  onClick={() =>
                                    router.push(
                                      `/studies/${activeStudy.id}/${activeStudy.phase}/${task.id}`
                                    )
                                  }
                                >
                                  <div
                                    className={cn(
                                      'w-2 h-2 rounded-full mr-2',
                                      task.required
                                        ? 'bg-red-500'
                                        : 'bg-yellow-500'
                                    )}
                                  />
                                  {task.label}
                                </Button>
                              )) || (
                              <p className="text-sm text-gray-500 col-span-2">
                                Select a study above to see phase-specific
                                actions
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FolderOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No study selected</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Choose a study from the My Studies section above
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Research Velocity & Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {/* Research Velocity Radar */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base">Research Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={researchVelocity}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="phase" fontSize={11} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        fontSize={10}
                      />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Benchmark"
                        dataKey="benchmark"
                        stroke="#6b7280"
                        fill="#6b7280"
                        fillOpacity={0.3}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Smart Quick Actions */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base">Smart Actions</CardTitle>
                  <CardDescription>
                    {activeStudy ? `For ${activeStudy.name}` : 'Get started'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeStudy ? (
                    <>
                      {/* Study-specific actions */}
                      {activeStudy.status === 'draft' && (
                        <>
                          <Button
                            variant="default"
                            className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500"
                            onClick={() =>
                              router.push(
                                `/studies/${activeStudy.id}/dashboard`
                              )
                            }
                          >
                            <PlayIcon className="w-4 h-4 mr-2" />
                            Open Study Dashboard
                          </Button>
                          <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() =>
                              router.push(
                                `/studies/${activeStudy.id}/statements`
                              )
                            }
                          >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            AI Statement Generator
                          </Button>
                        </>
                      )}
                      {activeStudy.status === 'active' && (
                        <>
                          <Button
                            variant="default"
                            className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500"
                            onClick={() =>
                              router.push(
                                `/studies/${activeStudy.id}/dashboard`
                              )
                            }
                          >
                            <BeakerIcon className="w-4 h-4 mr-2" />
                            View Study Dashboard
                          </Button>
                          <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() =>
                              router.push(
                                `/studies/${activeStudy.id}/participants`
                              )
                            }
                          >
                            <UsersIcon className="w-4 h-4 mr-2" />
                            Manage Participants
                            {activeStudy.participants > 0 && (
                              <Badge variant="info" className="ml-auto text-xs">
                                {activeStudy.participants} active
                              </Badge>
                            )}
                          </Button>
                        </>
                      )}
                      {activeStudy.status === 'completed' && (
                        <>
                          <Button
                            variant="default"
                            className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500"
                            onClick={() =>
                              router.push(`/reports/${activeStudy.id}`)
                            }
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            Generate Report
                          </Button>
                          <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() =>
                              router.push(`/analysis/hub/${activeStudy.id}`)
                            }
                          >
                            <BeakerIcon className="w-4 h-4 mr-2" />
                            View Analysis
                          </Button>
                        </>
                      )}
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() =>
                          router.push(`/studies/${activeStudy.id}`)
                        }
                      >
                        <FolderOpenIcon className="w-4 h-4 mr-2" />
                        Study Details
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* No study selected - show general actions */}
                      <Button
                        variant="default"
                        className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500"
                        onClick={() => router.push('/studies/create')}
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Your First Study
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => router.push('/discover/literature')}
                      >
                        <BookOpenIcon className="w-4 h-4 mr-2" />
                        Start Literature Review
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => router.push('/studies')}
                      >
                        <FolderOpenIcon className="w-4 h-4 mr-2" />
                        Browse All Studies
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base">
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studies
                      .filter(s => s.nextDeadline)
                      .map(study => (
                        <div
                          key={study.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">
                                {study.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatDistanceToNow(study.nextDeadline!, {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              differenceInDays(
                                study.nextDeadline!,
                                new Date()
                              ) < 3
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {format(study.nextDeadline!, 'MMM dd')}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Platform Capabilities Section - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Research Capabilities</CardTitle>
                <CardDescription>
                  Explore the full power of the VQMethod platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <BookOpenIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                    <h4 className="font-semibold mb-1">Literature Review</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Search academic databases and identify research gaps
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/discover/literature')}
                    >
                      Start Exploring
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <CpuChipIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <h4 className="font-semibold mb-1">AI Assistant</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Generate statements and get research insights with AI
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/studies/create')}
                    >
                      Try AI Tools
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                    <ChartBarIcon className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                    <h4 className="font-semibold mb-1">Advanced Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Q-methodology analysis with factor extraction
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!hasStudies}
                    >
                      {hasStudies ? 'View Analytics' : 'Create Study First'}
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <UsersIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                    <h4 className="font-semibold mb-1">Collaboration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Work together with your research team
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/participants')}
                    >
                      Manage Team
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Research Metrics Overview - Shows placeholder when no data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Research Metrics</CardTitle>
                <CardDescription>
                  {hasStudies
                    ? 'Track your research progress'
                    : 'Your metrics will appear here once you create studies'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {hasStudies ? studies.length : '0'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Studies
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {hasStudies
                        ? studies.reduce((sum, s) => sum + s.participants, 0)
                        : '0'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Participants
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {hasStudies
                        ? `${Math.round(studies.reduce((sum, s) => sum + s.quality, 0) / studies.length)}%`
                        : '—'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Quality
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {hasStudies ? activeStudies.length : '0'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Active Now
                    </p>
                  </div>
                </div>
                {!hasStudies && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start your first study to begin tracking metrics
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Advanced Analytics Section - Only shows with data */}
          {hasStudies && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Research Analytics Hub</CardTitle>
                    <Tabs
                      value={timeRange}
                      onValueChange={(v: string) =>
                        setTimeRange(v as '7d' | '30d' | '90d' | 'all')
                      }
                    >
                      <TabsList>
                        <TabsTrigger value="7d">7 Days</TabsTrigger>
                        <TabsTrigger value="30d">30 Days</TabsTrigger>
                        <TabsTrigger value="90d">90 Days</TabsTrigger>
                        <TabsTrigger value="all">All Time</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Participant Engagement */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4">
                        Participant Engagement
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={timelineData.slice(-7)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis dataKey="date" fontSize={11} />
                          <YAxis fontSize={11} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="quality"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Phase Distribution */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4">
                        Phase Completion Status
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={phaseDistribution.slice(0, 6)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            fontSize={11}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis fontSize={11} />
                          <Tooltip />
                          <Bar
                            dataKey="value"
                            fill="#8b5cf6"
                            radius={[8, 8, 0, 0]}
                          >
                            {phaseDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Study Status Distribution */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4">
                        Study Status Overview
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Active',
                                value: studies.filter(
                                  s => s.status === 'active'
                                ).length,
                                color: '#10b981',
                              },
                              {
                                name: 'Paused',
                                value: studies.filter(
                                  s => s.status === 'paused'
                                ).length,
                                color: '#f59e0b',
                              },
                              {
                                name: 'Completed',
                                value: studies.filter(
                                  s => s.status === 'completed'
                                ).length,
                                color: '#3b82f6',
                              },
                              {
                                name: 'Draft',
                                value: studies.filter(s => s.status === 'draft')
                                  .length,
                                color: '#6b7280',
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Active', value: 3, color: '#10b981' },
                              { name: 'Paused', value: 1, color: '#f59e0b' },
                              { name: 'Completed', value: 2, color: '#3b82f6' },
                              { name: 'Draft', value: 1, color: '#6b7280' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Research Community & Collaboration - Only show with real data */}
          {hasStudies && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="w-6 h-6 text-indigo-600" />
                      <CardTitle>Research Community</CardTitle>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/participants')}
                    >
                      View All
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <AcademicCapIcon className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-gray-600">Collaborators</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-gray-600">Shared Studies</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <BookOpenIcon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-gray-600">References</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <ChartBarIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-sm text-gray-600">Peer Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
