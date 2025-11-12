'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowTrendingUpIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  BeakerIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { studyApi } from '@/lib/api/study';

// Study-specific dashboard for individual study management
export default function StudyDashboard() {
  const params = useParams();
  const router = useRouter();
  const studyId = params['id'] as string;

  const [study, setStudy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phaseProgress, setPhaseProgress] = useState<Record<string, number>>({
    discover: 0,
    design: 0,
    build: 0,
    recruit: 0,
    collect: 0,
    analyze: 0,
    visualize: 0,
    interpret: 0,
    report: 0,
    archive: 0,
  });

  useEffect(() => {
    const fetchStudyData = async () => {
      try {
        setLoading(true);
        const studyData = await studyApi.getStudy(studyId);
        setStudy(studyData);

        // Calculate phase progress based on study data
        const progress = calculatePhaseProgress(studyData);
        setPhaseProgress(progress);
      } catch (error) {
        console.error('Failed to fetch study:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStudyData();
  }, [studyId, router]);

  const calculatePhaseProgress = (studyData: any) => {
    const progress: Record<string, number> = {
      discover: studyData.literatureReviewed ? 100 : 0,
      design: studyData.researchQuestions?.length > 0 ? 100 : 0,
      build:
        studyData.statements?.length >= 20
          ? 100
          : studyData.statements?.length * 5 || 0,
      recruit: Math.min(
        ((studyData.participantCount || 0) /
          (studyData.targetParticipants || 30)) *
          100,
        100
      ),
      collect: studyData.completedSorts || 0,
      analyze: studyData.analysisCompleted ? 100 : 0,
      visualize: studyData.chartsGenerated ? 100 : 0,
      interpret: studyData.interpretationCompleted ? 100 : 0,
      report: studyData.reportGenerated ? 100 : 0,
      archive: studyData.archived ? 100 : 0,
    };
    return progress;
  };

  const getCurrentPhase = () => {
    // Determine current phase based on progress
    for (const [phase, progress] of Object.entries(phaseProgress)) {
      if (progress < 100) return phase;
    }
    return 'archive';
  };

  const getNextActions = () => {
    const currentPhase = getCurrentPhase();
    const actions = {
      discover: [
        {
          label: 'Continue Literature Review',
          icon: DocumentTextIcon,
          href: `/discover/literature?studyId=${studyId}`,
        },
        {
          label: 'Map Knowledge Gaps',
          icon: ChartBarIcon,
          href: `/discover/knowledge-map?studyId=${studyId}`,
        },
      ],
      design: [
        {
          label: 'Formulate Research Questions',
          icon: DocumentTextIcon,
          href: `/design/questions?studyId=${studyId}`,
        },
        {
          label: 'Define Hypotheses',
          icon: BeakerIcon,
          href: `/design/hypothesis?studyId=${studyId}`,
        },
      ],
      build: [
        {
          label: 'Add Statements',
          icon: DocumentTextIcon,
          href: `/build/statements?studyId=${studyId}`,
        },
        {
          label: 'Configure Q-Grid',
          icon: ChartBarIcon,
          href: `/build/grid?studyId=${studyId}`,
        },
      ],
      recruit: [
        {
          label: 'Invite Participants',
          icon: UserGroupIcon,
          href: `/recruit/invite?studyId=${studyId}`,
        },
        {
          label: 'Manage Schedule',
          icon: CalendarIcon,
          href: `/recruit/schedule?studyId=${studyId}`,
        },
      ],
      collect: [
        {
          label: 'Monitor Progress',
          icon: ChartBarIcon,
          href: `/collect/monitor?studyId=${studyId}`,
        },
        {
          label: 'Send Reminders',
          icon: ClockIcon,
          href: `/collect/reminders?studyId=${studyId}`,
        },
      ],
      analyze: [
        {
          label: 'Run Factor Analysis',
          icon: BeakerIcon,
          href: `/analysis/q-methodology?studyId=${studyId}`,
        },
        {
          label: 'View Results',
          icon: ChartBarIcon,
          href: `/analysis/hub?studyId=${studyId}`,
        },
      ],
      visualize: [
        {
          label: 'Generate Charts',
          icon: ChartBarIcon,
          href: `/visualize?studyId=${studyId}`,
        },
      ],
      interpret: [
        {
          label: 'Extract Themes',
          icon: DocumentTextIcon,
          href: `/interpret/themes?studyId=${studyId}`,
        },
      ],
      report: [
        {
          label: 'Generate Report',
          icon: DocumentTextIcon,
          href: `/report?studyId=${studyId}`,
        },
      ],
      archive: [
        {
          label: 'Archive Study',
          icon: DocumentTextIcon,
          href: `/archive?studyId=${studyId}`,
        },
      ],
    };

    return actions[currentPhase as keyof typeof actions] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading study dashboard...</p>
        </div>
      </div>
    );
  }

  if (!study) {
    return null;
  }

  const currentPhase = getCurrentPhase();
  const nextActions = getNextActions();
  const overallProgress =
    Object.values(phaseProgress).reduce((sum, val) => sum + val, 0) / 10;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Study Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{study.title}</h1>
            <p className="text-gray-600 mt-2">{study.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge
                variant={study.status === 'active' ? 'success' : 'secondary'}
              >
                {study.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {new Date(study.createdAt).toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-500">
                Current Phase:{' '}
                <strong className="capitalize">{currentPhase}</strong>
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to All Studies
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Study Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Completion</span>
                <span className="text-sm text-gray-600">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Phase Progress Grid */}
            <div className="grid grid-cols-5 gap-4 mt-6">
              {Object.entries(phaseProgress).map(([phase, progress]) => (
                <div key={phase} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto">
                      <svg className="transform -rotate-90 w-16 h-16">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${progress * 1.76} 176`}
                          className={
                            progress === 100
                              ? 'text-green-500'
                              : 'text-purple-600'
                          }
                        />
                      </svg>
                      {progress === 100 && (
                        <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-5 left-5" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs capitalize mt-2">{phase}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round(progress)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recommended Next Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {nextActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push(action.href)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {study.participantCount || 0}
                </p>
                <p className="text-xs text-gray-500">
                  Target: {study.targetParticipants || 30}
                </p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <Progress
              value={
                ((study.participantCount || 0) /
                  (study.targetParticipants || 30)) *
                100
              }
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {study.completionRate || 0}%
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <ArrowTrendingUpIcon className="w-3 h-3 text-green-500 mr-1" />
                  +5% this week
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {study.dataQualityScore || 85}%
                </p>
                <Badge variant="success" className="mt-1">
                  Excellent
                </Badge>
              </div>
              <BeakerIcon className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Study Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                Started: {new Date(study.createdAt).toLocaleDateString()}
              </span>
              <span>
                Estimated Completion:{' '}
                {new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200"></div>
              {Object.entries(phaseProgress).map(([phase, progress]) => (
                <div key={phase} className="relative flex items-center mb-4">
                  <div
                    className={`absolute left-0 w-4 h-4 rounded-full ${
                      progress === 100
                        ? 'bg-green-500'
                        : progress > 0
                          ? 'bg-purple-600'
                          : 'bg-gray-300'
                    }`}
                    style={{ left: '-7px' }}
                  ></div>
                  <div className="ml-8">
                    <p className="text-sm font-medium capitalize">{phase}</p>
                    {progress === 100 && (
                      <p className="text-xs text-gray-500">Completed</p>
                    )}
                    {progress > 0 && progress < 100 && (
                      <p className="text-xs text-purple-600">
                        In Progress ({progress}%)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
