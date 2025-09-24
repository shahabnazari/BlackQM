'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Play,
  Pause,
  Target,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
  Bell,
  Zap,
  Timer,
  Globe,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SurveySchedule {
  id: string;
  name: string;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'draft';
  startDate: Date;
  endDate: Date;
  timezone: string;
  responseQuota: {
    target: number;
    current: number;
    daily?: number;
    weekly?: number;
  };
  segments: {
    name: string;
    quota: number;
    current: number;
    criteria: Record<string, any>;
  }[];
  reminders: {
    type: 'email' | 'sms' | 'push';
    schedule: string;
    template: string;
    enabled: boolean;
  }[];
  automation: {
    autoClose: boolean;
    autoCloseCondition: 'quota' | 'date' | 'both';
    autoRemind: boolean;
    remindAfterDays: number;
    autoThankYou: boolean;
  };
}

export function SurveySchedulingManager() {
  const [quotaSettings, setQuotaSettings] = useState({
    total: 500,
    daily: 50,
    enableSegments: false,
  });

  // Mock data
  const mockSchedule: SurveySchedule = {
    id: '1',
    name: 'Q1 Customer Satisfaction Survey',
    status: 'active',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15'),
    timezone: 'America/New_York',
    responseQuota: {
      target: 500,
      current: 234,
      daily: 50,
      weekly: 200,
    },
    segments: [
      {
        name: 'New Customers',
        quota: 200,
        current: 89,
        criteria: { customerType: 'new', joinedAfter: '2024-01-01' },
      },
      {
        name: 'Existing Customers',
        quota: 300,
        current: 145,
        criteria: { customerType: 'existing' },
      },
    ],
    reminders: [
      {
        type: 'email',
        schedule: '3 days after invite',
        template: 'reminder_1',
        enabled: true,
      },
      {
        type: 'email',
        schedule: '7 days after invite',
        template: 'reminder_2',
        enabled: true,
      },
    ],
    automation: {
      autoClose: true,
      autoCloseCondition: 'both',
      autoRemind: true,
      remindAfterDays: 3,
      autoThankYou: true,
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateResponseRate = () => {
    const daysSinceStart = Math.max(
      1,
      Math.ceil(
        (Date.now() - mockSchedule.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return Math.round(mockSchedule.responseQuota.current / daysSinceStart);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Survey Scheduling & Quotas
            </h2>
            <p className="text-sm text-gray-600">
              Control when and how your survey collects responses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mockSchedule.status === 'active' ? (
            <Button variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pause Survey
            </Button>
          ) : (
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Start Survey
            </Button>
          )}
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Active Survey Overview */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{mockSchedule.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {mockSchedule.startDate.toLocaleDateString()} -{' '}
                {mockSchedule.endDate.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {mockSchedule.timezone}
              </span>
              <Badge className={getStatusColor(mockSchedule.status)}>
                {mockSchedule.status.charAt(0).toUpperCase() +
                  mockSchedule.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {calculateDaysRemaining(mockSchedule.endDate)}
            </div>
            <div className="text-sm text-gray-600">days remaining</div>
          </div>
        </div>

        {/* Response Progress */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {mockSchedule.responseQuota.current} /{' '}
                {mockSchedule.responseQuota.target} responses
              </span>
            </div>
            <Progress
              value={
                (mockSchedule.responseQuota.current /
                  mockSchedule.responseQuota.target) *
                100
              }
              className="h-3"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card className="p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600">Target</span>
              </div>
              <div className="text-xl font-bold">
                {mockSchedule.responseQuota.target}
              </div>
            </Card>
            <Card className="p-3 bg-blue-50">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">Current</span>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {mockSchedule.responseQuota.current}
              </div>
            </Card>
            <Card className="p-3 bg-green-50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Daily Avg</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                {calculateResponseRate()}
              </div>
            </Card>
            <Card className="p-3 bg-purple-50">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600">Est. Completion</span>
              </div>
              <div className="text-xl font-bold text-purple-600">
                {Math.ceil(
                  (mockSchedule.responseQuota.target -
                    mockSchedule.responseQuota.current) /
                    calculateResponseRate()
                )}
                d
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Configuration Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="quotas">
          <TabsList>
            <TabsTrigger value="quotas">Response Quotas</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="quotas" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Response Target</Label>
                <Input
                  type="number"
                  value={quotaSettings.total}
                  onChange={e =>
                    setQuotaSettings({
                      ...quotaSettings,
                      total: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Survey will automatically close when target is reached
                </p>
              </div>
              <div>
                <Label>Daily Response Limit (Optional)</Label>
                <Input
                  type="number"
                  value={quotaSettings.daily}
                  onChange={e =>
                    setQuotaSettings({
                      ...quotaSettings,
                      daily: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Pause collection after reaching daily limit
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">
                  Smart Quota Distribution
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Automatically distribute responses across time periods to avoid
                clustering
              </p>
              <Switch />
            </div>
          </TabsContent>

          <TabsContent value="segments" className="mt-4">
            <div className="space-y-4">
              {mockSchedule.segments.map(segment => (
                <Card key={segment.name} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-sm text-gray-600">
                        Criteria:{' '}
                        {Object.entries(segment.criteria)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {segment.current} / {segment.quota}
                    </Badge>
                  </div>
                  <Progress
                    value={(segment.current / segment.quota) * 100}
                    className="h-2"
                  />
                </Card>
              ))}
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Segment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" className="mt-2" />
              </div>
              <div>
                <Label>End Date & Time</Label>
                <Input type="datetime-local" className="mt-2" />
              </div>
            </div>

            <div>
              <Label>Timezone</Label>
              <Select defaultValue="America/New_York">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">
                    Eastern Time (ET)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (PT)
                  </SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Blackout Periods</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">No surveys on weekends</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">No surveys after 9 PM</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">Respect holidays</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reminders" className="mt-4">
            <div className="space-y-4">
              {mockSchedule.reminders.map((reminder, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {reminder.type === 'email' && (
                        <Mail className="w-4 h-4" />
                      )}
                      {reminder.type === 'sms' && (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      {reminder.type === 'push' && <Bell className="w-4 h-4" />}
                      <div>
                        <span className="font-medium capitalize">
                          {reminder.type} Reminder
                        </span>
                        <p className="text-sm text-gray-600">
                          {reminder.schedule}
                        </p>
                      </div>
                    </div>
                    <Switch checked={reminder.enabled} />
                  </div>
                  <div>
                    <Label className="text-xs">Template</Label>
                    <Select defaultValue={reminder.template}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reminder_1">
                          Friendly Reminder
                        </SelectItem>
                        <SelectItem value="reminder_2">Last Chance</SelectItem>
                        <SelectItem value="reminder_3">
                          Survey Closing Soon
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="mt-4 space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-3">Auto-Close Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={mockSchedule.automation.autoClose} />
                  <Label className="font-normal">
                    Automatically close survey
                  </Label>
                </div>
                {mockSchedule.automation.autoClose && (
                  <div className="ml-6">
                    <Label className="text-sm">When to close</Label>
                    <Select
                      defaultValue={mockSchedule.automation.autoCloseCondition}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quota">
                          When quota is reached
                        </SelectItem>
                        <SelectItem value="date">On end date</SelectItem>
                        <SelectItem value="both">
                          Whichever comes first
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Auto-Reminder Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={mockSchedule.automation.autoRemind} />
                  <Label className="font-normal">
                    Send automatic reminders
                  </Label>
                </div>
                {mockSchedule.automation.autoRemind && (
                  <div className="ml-6">
                    <Label className="text-sm">Remind after (days)</Label>
                    <Input
                      type="number"
                      value={mockSchedule.automation.remindAfterDays}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Thank You Messages</h4>
              <div className="flex items-center gap-2">
                <Switch checked={mockSchedule.automation.autoThankYou} />
                <Label className="font-normal">
                  Send automatic thank you message
                </Label>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
