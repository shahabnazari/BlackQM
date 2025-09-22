'use client';

import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Filter,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash,
  Share2,
  Key,
  LogIn,
  RefreshCw,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    ip: string;
  };
  action: {
    type: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export' | 'login' | 'permission';
    category: 'question' | 'survey' | 'response' | 'user' | 'system' | 'security';
    description: string;
  };
  resource: {
    type: string;
    id: string;
    name: string;
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    browser?: string;
    os?: string;
    location?: string;
    sessionId: string;
  };
  severity: 'info' | 'warning' | 'critical';
  status: 'success' | 'failed' | 'pending';
}

interface ComplianceReport {
  gdpr: boolean;
  ccpa: boolean;
  hipaa: boolean;
  sox: boolean;
  lastAudit: Date;
  issues: string[];
}

export function AuditTrailManager() {
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Mock audit events
  const auditEvents: AuditEvent[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-20T14:30:00'),
      user: {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        ip: '192.168.1.100',
      },
      action: {
        type: 'update',
        category: 'question',
        description: 'Modified question text and validation rules',
      },
      resource: {
        type: 'Question',
        id: 'q5',
        name: 'Customer Satisfaction Rating',
      },
      changes: [
        {
          field: 'text',
          oldValue: 'How satisfied are you?',
          newValue: 'How would you rate your overall satisfaction?',
        },
        {
          field: 'required',
          oldValue: false,
          newValue: true,
        },
      ],
      metadata: {
        browser: 'Chrome 120',
        os: 'macOS',
        location: 'New York, US',
        sessionId: 'sess_abc123',
      },
      severity: 'info',
      status: 'success',
    },
    {
      id: '2',
      timestamp: new Date('2024-01-20T14:25:00'),
      user: {
        id: 'u2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Editor',
        ip: '192.168.1.101',
      },
      action: {
        type: 'export',
        category: 'response',
        description: 'Exported survey responses to CSV',
      },
      resource: {
        type: 'Survey',
        id: 's1',
        name: 'Q1 Customer Survey',
      },
      metadata: {
        browser: 'Firefox 121',
        os: 'Windows',
        location: 'London, UK',
        sessionId: 'sess_def456',
      },
      severity: 'warning',
      status: 'success',
    },
    {
      id: '3',
      timestamp: new Date('2024-01-20T14:20:00'),
      user: {
        id: 'u3',
        name: 'System',
        email: 'system@example.com',
        role: 'System',
        ip: '127.0.0.1',
      },
      action: {
        type: 'delete',
        category: 'system',
        description: 'Automatic cleanup of expired sessions',
      },
      resource: {
        type: 'Session',
        id: 'multiple',
        name: '15 expired sessions',
      },
      metadata: {
        sessionId: 'system',
      },
      severity: 'info',
      status: 'success',
    },
    {
      id: '4',
      timestamp: new Date('2024-01-20T14:15:00'),
      user: {
        id: 'u4',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'Viewer',
        ip: '192.168.1.102',
      },
      action: {
        type: 'read',
        category: 'security',
        description: 'Failed login attempt - incorrect password',
      },
      resource: {
        type: 'Account',
        id: 'u4',
        name: 'mike@example.com',
      },
      metadata: {
        browser: 'Safari 17',
        os: 'iOS',
        location: 'San Francisco, US',
        sessionId: 'none',
      },
      severity: 'critical',
      status: 'failed',
    },
  ];

  const complianceReport: ComplianceReport = {
    gdpr: true,
    ccpa: true,
    hipaa: false,
    sox: true,
    lastAudit: new Date('2024-01-15'),
    issues: [
      'HIPAA: Missing encryption for health-related questions',
      'GDPR: Update data retention policy documentation',
    ],
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create': return <Plus className="w-4 h-4" />;
      case 'read': return <Eye className="w-4 h-4" />;
      case 'update': return <Edit className="w-4 h-4" />;
      case 'delete': return <Trash className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      case 'export': return <Download className="w-4 h-4" />;
      case 'login': return <LogIn className="w-4 h-4" />;
      case 'permission': return <Key className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const filteredEvents = auditEvents.filter(event => {
    const matchesUser = filterUser === 'all' || event.user.name === filterUser;
    const matchesAction = filterAction === 'all' || event.action.type === filterAction;
    const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
    const matchesSearch = searchQuery === '' || 
      event.action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesUser && matchesAction && matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Audit Trail & Compliance</h2>
            <p className="text-sm text-gray-600">
              Track all system activities and ensure compliance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Audit
          </Button>
        </div>
      </div>

      {/* Compliance Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className={cn(
            "p-4",
            complianceReport.gdpr ? "bg-green-50" : "bg-red-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">GDPR</span>
              {complianceReport.gdpr ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {complianceReport.gdpr ? 'Compliant' : 'Issues Found'}
            </p>
          </Card>

          <Card className={cn(
            "p-4",
            complianceReport.ccpa ? "bg-green-50" : "bg-red-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">CCPA</span>
              {complianceReport.ccpa ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {complianceReport.ccpa ? 'Compliant' : 'Issues Found'}
            </p>
          </Card>

          <Card className={cn(
            "p-4",
            complianceReport.hipaa ? "bg-green-50" : "bg-red-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">HIPAA</span>
              {complianceReport.hipaa ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {complianceReport.hipaa ? 'Compliant' : 'Issues Found'}
            </p>
          </Card>

          <Card className={cn(
            "p-4",
            complianceReport.sox ? "bg-green-50" : "bg-red-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">SOX</span>
              {complianceReport.sox ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {complianceReport.sox ? 'Compliant' : 'Issues Found'}
            </p>
          </Card>
        </div>

        {complianceReport.issues.length > 0 && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Compliance Issues</h4>
                <ul className="space-y-1">
                  {complianceReport.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-yellow-800">• {issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search audit events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="John Doe">John Doe</SelectItem>
              <SelectItem value="Jane Smith">Jane Smith</SelectItem>
              <SelectItem value="System">System</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Audit Trail Table */}
      <Card className="p-6">
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Audit Events</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
            <TabsTrigger value="data">Data Access</TabsTrigger>
            <TabsTrigger value="permissions">Permission Changes</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <div className="h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <TableCell className="text-sm">
                        {format(event.timestamp, 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{event.user.name}</p>
                          <p className="text-xs text-gray-600">{event.user.role}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(event.action.type)}
                          <span className="text-sm">{event.action.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{event.resource.name}</p>
                          <p className="text-xs text-gray-600">{event.resource.type}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {event.user.ip}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getSeverityColor(event.severity))}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="text-center py-8 text-gray-500">
              Security-specific events will be shown here
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="text-center py-8 text-gray-500">
              Data access logs will be shown here
            </div>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="text-center py-8 text-gray-500">
              Permission change logs will be shown here
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Event Details Modal */}
      {showDetailsDialog && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Audit Event Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDetailsDialog(false)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Timestamp</Label>
                  <p className="font-medium">
                    {format(selectedEvent.timestamp, 'PPpp')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Session ID</Label>
                  <p className="font-mono text-sm">{selectedEvent.metadata.sessionId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">User</Label>
                  <p className="font-medium">{selectedEvent.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedEvent.user.email}</p>
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <p className="text-sm">{selectedEvent.metadata.location || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{selectedEvent.user.ip}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs">Action</Label>
                <p className="font-medium">{selectedEvent.action.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge>{selectedEvent.action.type}</Badge>
                  <Badge variant="outline">{selectedEvent.action.category}</Badge>
                </div>
              </div>

              {selectedEvent.changes && selectedEvent.changes.length > 0 && (
                <div>
                  <Label className="text-xs">Changes</Label>
                  <div className="mt-2 space-y-2">
                    {selectedEvent.changes.map((change, index) => (
                      <Card key={index} className="p-3 bg-gray-50">
                        <p className="font-medium text-sm mb-1">{change.field}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Old: </span>
                            <span className="font-mono">{JSON.stringify(change.oldValue)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">New: </span>
                            <span className="font-mono">{JSON.stringify(change.newValue)}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs">System Information</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>Browser: {selectedEvent.metadata.browser}</div>
                  <div>OS: {selectedEvent.metadata.os}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}