'use client';

import { Badge } from '@/components/apple-ui/Badge/Badge';
import { Button } from '@/components/apple-ui/Button/Button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/apple-ui/Card/Card';
import { ProgressBar } from '@/components/apple-ui/ProgressBar/ProgressBar';
import {
    ArrowDownTrayIcon,
    BeakerIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    PauseIcon,
    PlayIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface StudyData {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  participantCount: number;
  targetParticipants: number;
  completionRate: number;
  statements: number;
  gridSize: string;
  timeEstimate: string;
  tags: string[];
  lastActivity?: string;
}

// Mock data for demonstration
const mockStudyData: StudyData = {
  id: '1',
  title: 'Public Perception of Air Pollution Solutions',
  description:
    'Understanding public attitudes toward various air pollution mitigation strategies and policies in urban environments. This study explores perspectives on technological, policy-based, and behavioral interventions.',
  status: 'ACTIVE',
  createdAt: '2024-01-15',
  startDate: '2024-01-20',
  participantCount: 42,
  targetParticipants: 100,
  completionRate: 42,
  statements: 36,
  gridSize: '9x9',
  timeEstimate: '20-30 minutes',
  tags: ['Environmental', 'Policy', 'Urban Planning', 'Public Health'],
  lastActivity: '2 hours ago',
};

export default function StudyDetailPage() {
  const params = useParams();
  // Router will be used for navigation
  // const router = useRouter();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'participants' | 'analysis' | 'settings'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading study data
    setTimeout(() => {
      setStudy({ ...mockStudyData, id: params['id'] as string });
      setIsLoading(false);
    }, 500);
  }, [params]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary-label">Loading study...</p>
        </div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-system-red mb-4" />
        <h2 className="text-2xl font-bold mb-2">Study Not Found</h2>
        <p className="text-secondary-label mb-4">
          The study you're looking for doesn't exist.
        </p>
        <Link href="/studies">
          <Button>Back to Studies</Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'DRAFT':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-surface-secondary rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{study.title}</h1>
              <Badge variant={getStatusColor(study.status)}>
                {study.status}
              </Badge>
            </div>
            <p className="text-secondary-label mb-4">{study.description}</p>
            <div className="flex flex-wrap gap-2">
              {study.tags.map((tag: any) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {study.status === 'ACTIVE' && (
              <Button variant="secondary" size="md">
                <PauseIcon className="w-4 h-4 mr-2" />
                Pause Study
              </Button>
            )}
            {study.status === 'PAUSED' && (
              <Button variant="primary" size="md">
                <PlayIcon className="w-4 h-4 mr-2" />
                Resume Study
              </Button>
            )}
            <Button variant="primary" size="md">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              View Report
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-label">Participants</p>
                <p className="text-2xl font-bold">
                  {study.participantCount}/{study.targetParticipants}
                </p>
                <ProgressBar value={study.completionRate} className="mt-2" />
              </div>
              <UserGroupIcon className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-label">Statements</p>
                <p className="text-2xl font-bold">{study.statements}</p>
                <p className="text-xs text-tertiary-label mt-1">
                  Grid: {study.gridSize}
                </p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-system-blue" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-label">Completion Time</p>
                <p className="text-2xl font-bold">{study.timeEstimate}</p>
                <p className="text-xs text-tertiary-label mt-1">
                  Average duration
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-system-green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-label">Last Activity</p>
                <p className="text-2xl font-bold">
                  {study.lastActivity || 'N/A'}
                </p>
                <p className="text-xs text-tertiary-label mt-1">
                  Recent response
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-system-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'participants', label: 'Participants', icon: UserGroupIcon },
            { id: 'analysis', label: 'Analysis', icon: BeakerIcon },
            { id: 'settings', label: 'Settings', icon: DocumentTextIcon },
          ].map((tab: any) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary-label hover:text-text'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Timeline</CardTitle>
                <CardDescription>Daily participant responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-surface-secondary rounded-lg flex items-center justify-center">
                  <p className="text-secondary-label">
                    Response chart visualization
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Funnel</CardTitle>
                <CardDescription>
                  Participant progress through study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Started</span>
                    <span className="font-semibold">42</span>
                  </div>
                  <ProgressBar value={100} />
                  <div className="flex justify-between">
                    <span>Completed Q-Sort</span>
                    <span className="font-semibold">38</span>
                  </div>
                  <ProgressBar value={90} />
                  <div className="flex justify-between">
                    <span>Submitted Comments</span>
                    <span className="font-semibold">35</span>
                  </div>
                  <ProgressBar value={83} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href={`/studies/${study.id}/analysis`}>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                    >
                      <ChartBarIcon className="w-4 h-4 mr-2" />
                      View Q-Analysis Results
                    </Button>
                  </Link>
                  <Link href={`/analysis/q-methodology?studyId=${study.id}`}>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                    >
                      <BeakerIcon className="w-4 h-4 mr-2" />
                      Run Factor Analysis
                    </Button>
                  </Link>
                  <Button variant="secondary" className="w-full justify-start">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Export Study Data
                  </Button>
                  <Link href={`/studies/${study.id}/participants`}>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                    >
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      Manage Participants
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-secondary-label">Grid Size</span>
                    <span className="font-medium">{study.gridSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-label">
                      Total Statements
                    </span>
                    <span className="font-medium">{study.statements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-label">Created</span>
                    <span className="font-medium">
                      {new Date(study.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-label">Started</span>
                    <span className="font-medium">
                      {study.startDate
                        ? new Date(study.startDate).toLocaleDateString()
                        : 'Not started'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'participants' && (
          <Card>
            <CardHeader>
              <CardTitle>Participant Management</CardTitle>
              <CardDescription>
                View and manage study participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserGroupIcon className="w-16 h-16 mx-auto text-secondary-label mb-4" />
                <p className="text-secondary-label">
                  Participant list and management features
                </p>
                <Link href={`/studies/${study.id}/participants`}>
                  <Button className="mt-4">View All Participants</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Q-Methodology Analysis</CardTitle>
                <CardDescription>
                  Statistical analysis and factor extraction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BeakerIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                  <p className="text-secondary-label mb-4">
                    Ready to analyze {study.participantCount} responses
                  </p>
                  <Link href={`/analysis/q-methodology?studyId=${study.id}`}>
                    <Button>Start Q-Analysis</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/visualization-demo/q-methodology?studyId=${study.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <ChartBarIcon className="w-8 h-8 text-system-blue mb-3" />
                    <h3 className="font-semibold mb-2">Factor Visualization</h3>
                    <p className="text-sm text-secondary-label">
                      Interactive factor plots and loadings
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/analytics?studyId=${study.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <DocumentTextIcon className="w-8 h-8 text-system-green mb-3" />
                    <h3 className="font-semibold mb-2">Response Analytics</h3>
                    <p className="text-sm text-secondary-label">
                      Detailed response patterns and statistics
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Study Settings</CardTitle>
              <CardDescription>
                Configure study parameters and options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 mx-auto text-secondary-label mb-4" />
                <p className="text-secondary-label">
                  Study configuration and settings
                </p>
                <Link href={`/studies/${study.id}/design`}>
                  <Button className="mt-4">Edit Study Design</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
