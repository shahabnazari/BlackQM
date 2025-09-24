'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Inbox,
  Activity,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart2,
  Timer,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'

interface CollectionStats {
  totalStarted: number
  totalCompleted: number
  inProgress: number
  averageTime: string
  completionRate: number
  lastActivity: string
  todayCompleted: number
  weeklyTrend: 'up' | 'down' | 'stable'
}

export default function CollectPhasePage() {
  const stats: CollectionStats = {
    totalStarted: 35,
    totalCompleted: 28,
    inProgress: 3,
    averageTime: '18:45',
    completionRate: 80,
    lastActivity: '2 hours ago',
    todayCompleted: 4,
    weeklyTrend: 'up'
  }

  const activeParticipants = [
    { id: 'P017', status: 'sorting', progress: 65, startTime: '10 min ago' },
    { id: 'P018', status: 'pre-survey', progress: 20, startTime: '5 min ago' },
    { id: 'P019', status: 'post-survey', progress: 90, startTime: '25 min ago' }
  ]

  const recentCompletions = [
    { id: 'P016', completedAt: '2 hours ago', time: '17:32', quality: 'high' },
    { id: 'P015', completedAt: '3 hours ago', time: '19:21', quality: 'high' },
    { id: 'P014', completedAt: '5 hours ago', time: '16:45', quality: 'medium' },
    { id: 'P013', completedAt: '6 hours ago', time: '22:10', quality: 'high' }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'sorting': return 'bg-blue-100 text-blue-700'
      case 'pre-survey': return 'bg-yellow-100 text-yellow-700'
      case 'post-survey': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getQualityBadge = (quality: string) => {
    switch(quality) {
      case 'high': return <Badge className="bg-green-100 text-green-700">High Quality</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">Medium Quality</Badge>
      case 'low': return <Badge className="bg-red-100 text-red-700">Low Quality</Badge>
      default: return null
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collect Phase</h1>
          <p className="text-muted-foreground mt-2">
            Monitor real-time data collection and participant progress
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Inbox className="h-4 w-4" />
          Phase 5 of 10
        </Badge>
      </div>

      {/* Live Status */}
      <Alert className="bg-green-50 border-green-200">
        <Activity className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Study Active</AlertTitle>
        <AlertDescription className="text-green-700">
          Your study is live and accepting responses. {stats.inProgress} participants currently active.
        </AlertDescription>
      </Alert>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.totalCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">of {stats.totalStarted} started</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress 
              value={stats.completionRate} 
              className="mt-3 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.lastActivity}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">{stats.averageTime}</p>
                <p className="text-xs text-muted-foreground mt-1">per completion</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.todayCompleted}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.weeklyTrend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                  )}
                  <p className="text-xs text-muted-foreground">vs. avg</p>
                </div>
              </div>
              <BarChart2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Activity
          </CardTitle>
          <CardDescription>
            Participants currently completing the study
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeParticipants.length > 0 ? (
            <div className="space-y-4">
              {activeParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm font-medium">{participant.id}</div>
                    <Badge className={getStatusColor(participant.status)}>
                      {participant.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Started {participant.startTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Progress value={participant.progress} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">{participant.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No active participants at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Completions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completions</CardTitle>
          <CardDescription>
            Latest completed Q-sorts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCompletions.map((completion) => (
              <div key={completion.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <span className="font-mono text-sm font-medium">{completion.id}</span>
                    <p className="text-sm text-muted-foreground">
                      {completion.completedAt} • {completion.time}
                    </p>
                  </div>
                </div>
                {getQualityBadge(completion.quality)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Controls</CardTitle>
          <CardDescription>
            Manage data collection settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Study Status</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Currently accepting new participants
                </p>
                <Button variant="outline" className="w-full">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Collection
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Time Limit</span>
                  </div>
                  <Badge variant="outline">30 min</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Maximum time per participant
                </p>
                <Button variant="outline" className="w-full">
                  Adjust Limit
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Auto-Close</span>
                  </div>
                  <Badge variant="outline">At 40</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Close when target reached
                </p>
                <Button variant="outline" className="w-full">
                  Configure
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Collection Best Practices</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Monitor for incomplete sorts and follow up with participants</li>
            <li>• Check data quality indicators for suspicious patterns</li>
            <li>• Consider sending reminders to participants who started but didn't complete</li>
            <li>• Export data regularly as backup during collection</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/recruit">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Recruit
          </Button>
        </Link>
        <Link href="/analyze">
          <Button>
            Continue to Analyze
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}