'use client';

import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  ProgressBar,
} from '@/components/apple-ui';

export default function ResearcherDashboard() {
  // Mock data for dashboard
  const stats = {
    activeStudies: 3,
    totalParticipants: 127,
    completionRate: 78,
    pendingAnalysis: 2,
  };

  const recentStudies = [
    {
      id: 1,
      title: 'Climate Change Perceptions',
      participants: 45,
      completion: 85,
      status: 'active',
    },
    {
      id: 2,
      title: 'Healthcare Policy Q-Sort',
      participants: 32,
      completion: 60,
      status: 'active',
    },
    {
      id: 3,
      title: 'Education Reform Views',
      participants: 28,
      completion: 100,
      status: 'completed',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'New participant joined',
      study: 'Climate Change Perceptions',
      time: '2 hours ago',
    },
    {
      id: 2,
      action: 'Study completed',
      study: 'Education Reform Views',
      time: '5 hours ago',
    },
    {
      id: 3,
      action: 'Analysis exported',
      study: 'Healthcare Policy Q-Sort',
      time: '1 day ago',
    },
    {
      id: 4,
      action: 'New study created',
      study: 'Urban Planning Priorities',
      time: '2 days ago',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-label mb-2">
          Welcome back, Researcher
        </h1>
        <p className="text-secondary-label">
          Here's an overview of your Q-methodology research
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-system-blue/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <Badge variant="info" size="sm">
                Active
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.activeStudies}</h3>
            <p className="text-sm text-secondary-label">Active Studies</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-system-green/10 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <Badge variant="success" size="sm">
                +12%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {stats.totalParticipants}
            </h3>
            <p className="text-sm text-secondary-label">Total Participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-system-purple/10 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <Badge variant="default" size="sm">
                {stats.completionRate}%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.completionRate}%</h3>
            <p className="text-sm text-secondary-label">Completion Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-system-orange/10 flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <Badge variant="warning" size="sm">
                Pending
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.pendingAnalysis}</h3>
            <p className="text-sm text-secondary-label">Pending Analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Studies - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Studies</CardTitle>
              <CardDescription>
                Your active and recent Q-methodology studies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudies.map(study => (
                  <div
                    key={study.id}
                    className="border rounded-lg p-4 hover:bg-surface-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-label">
                          {study.title}
                        </h4>
                        <p className="text-sm text-secondary-label mt-1">
                          {study.participants} participants
                        </p>
                      </div>
                      <Badge
                        variant={
                          study.status === 'active' ? 'success' : 'secondary'
                        }
                        size="sm"
                      >
                        {study.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-label">Completion</span>
                        <span className="font-medium">{study.completion}%</span>
                      </div>
                      <ProgressBar
                        value={study.completion}
                        variant={
                          study.completion === 100 ? 'success' : 'default'
                        }
                        size="sm"
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="small" variant="secondary">
                        View Details
                      </Button>
                      <Button size="small" variant="secondary">
                        Analytics
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button fullWidth>View All Studies</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Takes 1 column */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your studies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-label">
                        {activity.action}
                      </p>
                      <p className="text-xs text-secondary-label mt-1">
                        {activity.study}
                      </p>
                      <p className="text-xs text-tertiary-label mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button size="small" fullWidth variant="secondary">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button fullWidth variant="primary">
                  <span className="mr-2">➕</span>
                  Create New Study
                </Button>
                <Button fullWidth variant="secondary">
                  <span className="mr-2">👥</span>
                  Invite Participants
                </Button>
                <Button fullWidth variant="secondary">
                  <span className="mr-2">📊</span>
                  Export Analytics
                </Button>
                <Button fullWidth variant="secondary">
                  <span className="mr-2">📚</span>
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Getting Started Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Tips</CardTitle>
          <CardDescription>
            New to VQMethod? Here are some helpful resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-secondary rounded-lg">
              <h4 className="font-semibold mb-2">📖 Q-Methodology Guide</h4>
              <p className="text-sm text-secondary-label mb-3">
                Learn the basics of Q-methodology research and best practices.
              </p>
              <Button size="small" variant="secondary">
                Learn More
              </Button>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <h4 className="font-semibold mb-2">🎥 Video Tutorials</h4>
              <p className="text-sm text-secondary-label mb-3">
                Watch step-by-step tutorials on creating and managing studies.
              </p>
              <Button size="small" variant="secondary">
                Watch Now
              </Button>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <h4 className="font-semibold mb-2">💬 Community Forum</h4>
              <p className="text-sm text-secondary-label mb-3">
                Connect with other researchers and share experiences.
              </p>
              <Button size="small" variant="secondary">
                Join Forum
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
