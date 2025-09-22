'use client';

import React, { useState } from 'react';
import {
  Copy,
  RefreshCw,
  CheckCircle,
  Clock,
  Activity,
  Terminal,
  BookOpen,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed: Date | null;
  expiresAt: Date | null;
  permissions: string[];
  rateLimit: number;
  usage: {
    calls: number;
    lastCall: Date | null;
  };
  status: 'active' | 'revoked' | 'expired';
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive';
  lastTriggered: Date | null;
  failureCount: number;
}

export function APIAccessManager() {
  const [apiKeys] = useState<APIKey[]>([ // Read-only for demo
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_1234567890abcdef',
      createdAt: new Date('2024-01-01'),
      lastUsed: new Date('2024-01-20'),
      expiresAt: null,
      permissions: ['read', 'write', 'delete'],
      rateLimit: 1000,
      usage: {
        calls: 4523,
        lastCall: new Date('2024-01-20'),
      },
      status: 'active',
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk_test_abcdef1234567890',
      createdAt: new Date('2024-01-10'),
      lastUsed: new Date('2024-01-19'),
      expiresAt: new Date('2024-02-10'),
      permissions: ['read'],
      rateLimit: 100,
      usage: {
        calls: 234,
        lastCall: new Date('2024-01-19'),
      },
      status: 'active',
    },
  ]);

  const [webhooks] = useState<Webhook[]>([ // Read-only for demo
    {
      id: '1',
      name: 'Response Notification',
      url: 'https://api.yourapp.com/webhooks/responses',
      events: ['response.created', 'response.updated'],
      secret: 'whsec_1234567890',
      status: 'active',
      lastTriggered: new Date('2024-01-20T10:30:00'),
      failureCount: 0,
    },
  ]);

  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  const codeExamples = {
    javascript: `// JavaScript Example
const response = await fetch('https://api.vqmethod.com/v1/surveys', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`,

    python: `# Python Example
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.vqmethod.com/v1/surveys',
    headers=headers
)
data = response.json()`,

    curl: `# cURL Example
curl -X GET https://api.vqmethod.com/v1/surveys \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Terminal className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">API Access</h2>
            <p className="text-sm text-gray-600">
              Manage API keys and integrate with external systems
            </p>
          </div>
        </div>
        <Button variant="outline">
          <BookOpen className="w-4 h-4 mr-2" />
          API Documentation
        </Button>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">API Keys</h3>
              <Button onClick={() => setShowCreateKeyDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Key
              </Button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Badge
                          variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {apiKey.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {showKey === apiKey.id ? apiKey.key : '••••••••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                        >
                          {showKey === apiKey.id ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <p className="font-medium">{format(apiKey.createdAt, 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Used:</span>
                          <p className="font-medium">
                            {apiKey.lastUsed ? format(apiKey.lastUsed, 'MMM dd, yyyy') : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Rate Limit:</span>
                          <p className="font-medium">{apiKey.rateLimit}/hour</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Calls:</span>
                          <p className="font-medium">{apiKey.usage.calls.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {apiKey.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Webhooks</h3>
              <Button onClick={() => setShowWebhookDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </div>

            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge
                          variant={webhook.status === 'active' ? 'default' : 'secondary'}
                        >
                          {webhook.status}
                        </Badge>
                        {webhook.failureCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {webhook.failureCount} failures
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{webhook.url}</p>
                      <div className="flex gap-2">
                        {webhook.events.map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      {webhook.lastTriggered && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last triggered: {format(webhook.lastTriggered, 'PPp')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Start Examples</h3>
            <Tabs defaultValue="javascript">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              {Object.entries(codeExamples).map(([lang, code]) => (
                <TabsContent key={lang} value={lang}>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Available Endpoints</h3>
            <div className="space-y-2">
              {[
                { method: 'GET', path: '/surveys', desc: 'List all surveys' },
                { method: 'POST', path: '/surveys', desc: 'Create a new survey' },
                { method: 'GET', path: '/surveys/:id', desc: 'Get survey details' },
                { method: 'PUT', path: '/surveys/:id', desc: 'Update survey' },
                { method: 'DELETE', path: '/surveys/:id', desc: 'Delete survey' },
                { method: 'GET', path: '/responses', desc: 'List responses' },
                { method: 'POST', path: '/responses', desc: 'Submit response' },
              ].map((endpoint) => (
                <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-3 p-2">
                  <Badge
                    className={cn(
                      "text-xs font-mono w-16",
                      endpoint.method === 'GET' && "bg-blue-100 text-blue-700",
                      endpoint.method === 'POST' && "bg-green-100 text-green-700",
                      endpoint.method === 'PUT' && "bg-yellow-100 text-yellow-700",
                      endpoint.method === 'DELETE' && "bg-red-100 text-red-700"
                    )}
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm">{endpoint.path}</code>
                  <span className="text-sm text-gray-600">- {endpoint.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">API Usage Statistics</h3>
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Calls</span>
                </div>
                <div className="text-2xl font-bold">4,757</div>
                <p className="text-xs text-gray-600">This month</p>
              </Card>

              <Card className="p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Success Rate</span>
                </div>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-gray-600">Last 30 days</p>
              </Card>

              <Card className="p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Avg Response</span>
                </div>
                <div className="text-2xl font-bold">124ms</div>
                <p className="text-xs text-gray-600">P50 latency</p>
              </Card>

              <Card className="p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Rate Limit</span>
                </div>
                <div className="text-2xl font-bold">47%</div>
                <p className="text-xs text-gray-600">Used this hour</p>
              </Card>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rate Limits</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Hourly Limit</span>
                  <span className="text-sm font-medium">470 / 1,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '47%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Daily Limit</span>
                  <span className="text-sm font-medium">4,757 / 20,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Modal */}
      {showCreateKeyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input placeholder="e.g., Production API Key" className="mt-2" />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {['Read', 'Write', 'Delete'].map((perm) => (
                    <div key={perm} className="flex items-center gap-2">
                      <Switch />
                      <Label className="font-normal">{perm}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Rate Limit (requests/hour)</Label>
                <Input type="number" placeholder="1000" className="mt-2" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowCreateKeyDialog(false)}>
                Cancel
              </Button>
              <Button>Create Key</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showWebhookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Webhook</h3>
            <div className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <Input placeholder="https://api.yourapp.com/webhooks" className="mt-2" />
              </div>
              <div>
                <Label>Events</Label>
                <div className="space-y-2 mt-2">
                  {['response.created', 'response.updated', 'survey.completed'].map((event) => (
                    <div key={event} className="flex items-center gap-2">
                      <Switch />
                      <Label className="font-normal">{event}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
                Cancel
              </Button>
              <Button>Add Webhook</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}