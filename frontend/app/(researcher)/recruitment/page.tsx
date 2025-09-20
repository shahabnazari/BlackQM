'use client';

import { useState, useEffect } from 'react';
import {
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  FunnelIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  recruitmentAPI
} from '@/lib/services/recruitment-api.service';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'invited' | 'scheduled' | 'completed' | 'no_show' | 'declined';
  scheduledDate?: Date;
  compensationStatus?: 'pending' | 'paid';
  compensationAmount?: number;
  notes?: string;
  tags?: string[];
}

interface Appointment {
  id: string;
  participantId: string;
  participantName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  type: 'online' | 'in-person' | 'phone';
  location?: string;
  meetingUrl?: string;
  remindersSent: number;
}

interface RecruitmentMetrics {
  totalInvited: number;
  totalScheduled: number;
  totalCompleted: number;
  totalNoShows: number;
  conversionRate: number;
  completionRate: number;
  noShowRate: number;
  compensationTotal: number;
  averageTimeToSchedule: number;
  timeSlotUtilization: number;
}

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [selectedStudyId] = useState<string>('study-1');
  const [selectedDate] = useState<Date>(new Date());

  useEffect(() => {
    // Load recruitment data
    loadRecruitmentData();
  }, [selectedStudyId]);

  useEffect(() => {
    // Load time slots when date or study changes
    if (activeTab === 'scheduling') {
      loadTimeSlots();
    }
  }, [selectedDate, selectedStudyId, activeTab]);

  const loadRecruitmentData = async () => {
    try {
      // Fetch real data from API
      const [appointmentsData, metricsData] = await Promise.all([
        recruitmentAPI.getAppointments(selectedStudyId),
        recruitmentAPI.getRecruitmentMetrics(selectedStudyId),
      ]);

      // Map API appointments to local format
      setAppointments(appointmentsData as any);
      setMetrics(metricsData as any);

      // For now, still use mock participants until we have a proper participants API
      setParticipants(getMockParticipants());
    } catch (error) {
      console.error('Failed to load recruitment data:', error);
      // Fallback to mock data on error
      setParticipants(getMockParticipants());
      setAppointments(getMockAppointments());
      setMetrics(getMockMetrics());
    }
  };

  const loadTimeSlots = async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      await recruitmentAPI.getAvailableSlots(
        selectedStudyId,
        startDate,
        endDate
      );
      // Time slots will be used when calendar component is implemented
    } catch (error) {
      console.error('Failed to load time slots:', error);
    }
  };

  return (
    <div className="min-h-screen bg-system-gray-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold">Recruitment Center</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage participants, scheduling, and compensation
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="default" size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Participant
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={UsersIcon}
                  label="Total Invited"
                  value={metrics?.totalInvited || 0}
                  trend={+12}
                  color="blue"
                />
                <MetricCard
                  icon={CalendarIcon}
                  label="Scheduled"
                  value={metrics?.totalScheduled || 0}
                  trend={+8}
                  color="green"
                />
                <MetricCard
                  icon={CheckCircleIcon}
                  label="Completed"
                  value={metrics?.totalCompleted || 0}
                  trend={+5}
                  color="purple"
                />
                <MetricCard
                  icon={CurrencyDollarIcon}
                  label="Total Compensation"
                  value={`$${metrics?.compensationTotal || 0}`}
                  trend={0}
                  color="yellow"
                />
              </div>

              {/* Conversion Funnel */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recruitment Funnel</h3>
                <div className="space-y-3">
                  <FunnelStage 
                    label="Invited" 
                    count={metrics?.totalInvited || 0} 
                    percentage={100} 
                  />
                  <FunnelStage 
                    label="Responded" 
                    count={Math.floor((metrics?.totalInvited || 0) * 0.6)} 
                    percentage={60} 
                  />
                  <FunnelStage 
                    label="Scheduled" 
                    count={metrics?.totalScheduled || 0} 
                    percentage={metrics?.conversionRate || 0} 
                  />
                  <FunnelStage 
                    label="Completed" 
                    count={metrics?.totalCompleted || 0} 
                    percentage={metrics?.completionRate || 0} 
                  />
                </div>
              </Card>

              {/* Upcoming Appointments */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Upcoming Appointments</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="space-y-3">
                  {appointments
                    .filter(a => a.status === 'scheduled' || a.status === 'confirmed')
                    .slice(0, 5)
                    .map(appointment => (
                      <AppointmentRow key={appointment.id} appointment={appointment} />
                    ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants">
            <Card className="p-6">
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search participants..."
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <Button variant="outline" size="sm">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Bulk Actions
                  </Button>
                  <Button variant="default" size="sm">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    Send Invites
                  </Button>
                </div>

                {/* Participants Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Scheduled</th>
                        <th className="text-left py-2">Compensation</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map(participant => (
                        <ParticipantRow key={participant.id} participant={participant} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar View */}
              <Card className="lg:col-span-2 p-6">
                <h3 className="font-semibold mb-4">Schedule Calendar</h3>
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  [Calendar component would go here]
                </div>
              </Card>

              {/* Available Slots */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Available Time Slots</h3>
                <div className="space-y-3">
                  <TimeSlot time="9:00 AM" available={2} total={3} />
                  <TimeSlot time="10:00 AM" available={0} total={3} />
                  <TimeSlot time="11:00 AM" available={3} total={3} />
                  <TimeSlot time="2:00 PM" available={1} total={3} />
                  <TimeSlot time="3:00 PM" available={2} total={3} />
                  <TimeSlot time="4:00 PM" available={3} total={3} />
                </div>
              </Card>
            </div>

            {/* Reminders Section */}
            <Card className="mt-6 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Automated Reminders</h3>
                <Button variant="outline" size="sm">
                  <BellAlertIcon className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReminderCard type="48 hours" enabled={true} sent={45} />
                <ReminderCard type="24 hours" enabled={true} sent={42} />
                <ReminderCard type="2 hours" enabled={true} sent={38} />
              </div>
            </Card>
          </TabsContent>

          {/* Compensation Tab */}
          <TabsContent value="compensation">
            <div className="space-y-6">
              {/* Compensation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Total Owed</p>
                      <p className="text-2xl font-semibold">${metrics?.compensationTotal || 0}</p>
                    </div>
                    <CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Paid Out</p>
                      <p className="text-2xl font-semibold">$850</p>
                    </div>
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-semibold">$450</p>
                    </div>
                    <ClockIcon className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Payment Records */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Payment Records</h3>
                  <Button variant="default" size="sm">
                    Record Payment
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2">Participant</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Payment rows would go here */}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recruitment Trends</h3>
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  [Line chart showing recruitment over time]
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Conversion Rates</h3>
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  [Bar chart showing conversion funnel]
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Time Slot Utilization</h3>
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  [Heat map of time slot usage]
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <MetricRow label="Average Time to Schedule" value="3.2 days" />
                  <MetricRow label="No-Show Rate" value={`${metrics?.noShowRate || 0}%`} />
                  <MetricRow label="Completion Rate" value={`${metrics?.completionRate || 0}%`} />
                  <MetricRow label="Avg Compensation" value="$50" />
                  <MetricRow label="Response Rate" value="62%" />
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component helpers

function MetricCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {trend !== 0 && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last week
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </Card>
  );
}

function FunnelStage({ label, count, percentage }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm">{label}</span>
          <span className="text-sm font-semibold">{count}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{appointment.participantName}</p>
        <p className="text-sm text-gray-600">
          {new Date(appointment.scheduledStart).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={appointment.type === 'online' ? 'default' : 'secondary'}>
          {appointment.type}
        </Badge>
        <Button variant="ghost" size="sm">View</Button>
      </div>
    </div>
  );
}

function ParticipantRow({ participant }: { participant: Participant }) {
  return (
    <tr className="border-b">
      <td className="py-3">{participant.name}</td>
      <td className="py-3">{participant.email}</td>
      <td className="py-3">
        <Badge variant={getStatusVariant(participant.status)}>
          {participant.status}
        </Badge>
      </td>
      <td className="py-3">
        {participant.scheduledDate 
          ? new Date(participant.scheduledDate).toLocaleDateString()
          : '-'}
      </td>
      <td className="py-3">
        {participant.compensationAmount
          ? `$${participant.compensationAmount}`
          : '-'}
      </td>
      <td className="py-3">
        <Button variant="ghost" size="sm">Manage</Button>
      </td>
    </tr>
  );
}

function TimeSlot({ time, available, total }: any) {
  const isFull = available === 0;
  return (
    <div className={`p-3 rounded-lg border ${isFull ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex justify-between items-center">
        <span className={isFull ? 'text-gray-400' : ''}>{time}</span>
        <Badge variant={isFull ? 'secondary' : available === total ? 'default' : 'outline'}>
          {available}/{total} slots
        </Badge>
      </div>
    </div>
  );
}

function ReminderCard({ type, enabled, sent }: any) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium">{type} before</h4>
        <Badge variant={enabled ? 'default' : 'secondary'}>
          {enabled ? 'Active' : 'Disabled'}
        </Badge>
      </div>
      <p className="text-sm text-gray-600">{sent} reminders sent</p>
    </Card>
  );
}

function MetricRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed': return 'default';
    case 'scheduled': return 'outline';
    case 'no_show': return 'destructive';
    case 'declined': return 'secondary';
    default: return 'default';
  }
}

// Mock data functions
function getMockParticipants(): Participant[] {
  return [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      status: 'scheduled',
      scheduledDate: new Date('2024-01-25T10:00:00'),
      compensationStatus: 'pending',
      compensationAmount: 50,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'completed',
      scheduledDate: new Date('2024-01-23T14:00:00'),
      compensationStatus: 'paid',
      compensationAmount: 50,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      status: 'invited',
    },
  ];
}

function getMockAppointments(): Appointment[] {
  return [
    {
      id: '1',
      participantId: '1',
      participantName: 'John Doe',
      scheduledStart: new Date('2024-01-25T10:00:00'),
      scheduledEnd: new Date('2024-01-25T11:00:00'),
      status: 'scheduled',
      type: 'online',
      meetingUrl: 'https://meet.example.com/123',
      remindersSent: 1,
    },
    {
      id: '2',
      participantId: '2',
      participantName: 'Jane Smith',
      scheduledStart: new Date('2024-01-23T14:00:00'),
      scheduledEnd: new Date('2024-01-23T15:00:00'),
      status: 'completed',
      type: 'in-person',
      location: 'Room 101',
      remindersSent: 3,
    },
  ];
}

function getMockMetrics(): RecruitmentMetrics {
  return {
    totalInvited: 50,
    totalScheduled: 30,
    totalCompleted: 22,
    totalNoShows: 3,
    conversionRate: 60,
    completionRate: 73,
    noShowRate: 10,
    compensationTotal: 1300,
    averageTimeToSchedule: 3.2,
    timeSlotUtilization: 78,
  };
}