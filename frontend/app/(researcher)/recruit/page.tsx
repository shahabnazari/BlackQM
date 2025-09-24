'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  UserPlus,
  Calendar,
  Mail,
  Share2,
  DollarSign,
  BarChart,
  ArrowRight,
  Clock,
  Send,
  Link as LinkIcon,
  QrCode,
  Target
} from 'lucide-react'

interface RecruitmentMetrics {
  targetParticipants: number
  currentParticipants: number
  invitationsSent: number
  responseRate: number
  averageCompletionTime: string
  activeRecruitmentDays: number
}

export default function RecruitPhasePage() {
  const metrics: RecruitmentMetrics = {
    targetParticipants: 40,
    currentParticipants: 12,
    invitationsSent: 35,
    responseRate: 34.3,
    averageCompletionTime: '18 min',
    activeRecruitmentDays: 5
  }

  const recruitmentChannels = [
    {
      name: 'Email Invitations',
      icon: Mail,
      sent: 20,
      responded: 8,
      completed: 6
    },
    {
      name: 'Social Media',
      icon: Share2,
      sent: 10,
      responded: 4,
      completed: 3
    },
    {
      name: 'Direct Link',
      icon: LinkIcon,
      sent: 5,
      responded: 3,
      completed: 3
    }
  ]

  const upcomingSchedule = [
    { date: 'Today, 2:00 PM', participant: 'P013', status: 'confirmed' },
    { date: 'Today, 3:30 PM', participant: 'P014', status: 'confirmed' },
    { date: 'Tomorrow, 10:00 AM', participant: 'P015', status: 'pending' },
    { date: 'Tomorrow, 11:30 AM', participant: 'P016', status: 'confirmed' }
  ]

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruit Phase</h1>
          <p className="text-muted-foreground mt-2">
            Manage participant recruitment and scheduling
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Phase 4 of 10
        </Badge>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {metrics.currentParticipants}/{metrics.targetParticipants}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <Progress 
              value={(metrics.currentParticipants / metrics.targetParticipants) * 100} 
              className="mt-3 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{metrics.responseRate}%</p>
              </div>
              <BarChart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">{metrics.averageCompletionTime}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Days</p>
                <p className="text-2xl font-bold">{metrics.activeRecruitmentDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recruitment Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Recruitment Channels</CardTitle>
              <CardDescription>
                Performance by recruitment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recruitmentChannels.map((channel) => {
                  const Icon = channel.icon
                  return (
                    <div key={channel.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {channel.sent} sent • {channel.responded} responded • {channel.completed} completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {((channel.completed / channel.sent) * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">conversion</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                Scheduled participant sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSchedule.map((session, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        session.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">{session.participant}</p>
                        <p className="text-sm text-muted-foreground">{session.date}</p>
                      </div>
                    </div>
                    <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participant Management</CardTitle>
              <CardDescription>
                View and manage study participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <Link href="/participants">
                  <Button size="lg">
                    <Users className="h-5 w-5 mr-2" />
                    View All Participants
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling System</CardTitle>
              <CardDescription>
                Manage participant appointments and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <Link href="/recruitment">
                  <Button size="lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Open Scheduling Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outreach Tools</CardTitle>
              <CardDescription>
                Tools for participant recruitment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">Email Campaign</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send personalized invitations via email
                    </p>
                    <Button className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <LinkIcon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">Share Link</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a shareable study link
                    </p>
                    <Button className="w-full" variant="outline">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <QrCode className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">QR Code</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate QR code for easy access
                    </p>
                    <Button className="w-full" variant="outline">
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">Compensation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage participant compensation
                    </p>
                    <Button className="w-full" variant="outline">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Setup Compensation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Alert>
        <UserPlus className="h-4 w-4" />
        <AlertTitle>Recruitment Tips</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Aim for diversity in viewpoints rather than large sample size</li>
            <li>• Send reminders 24 hours before scheduled sessions</li>
            <li>• Clearly communicate time commitment (typically 15-30 minutes)</li>
            <li>• Consider offering compensation for participant time</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/build">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Build
          </Button>
        </Link>
        <Link href="/collect">
          <Button>
            Continue to Collect
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}