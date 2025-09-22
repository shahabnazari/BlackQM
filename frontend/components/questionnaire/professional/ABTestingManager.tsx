'use client';

import React, { useState } from 'react';
import {
  Shuffle,
  BarChart3,
  Play,
  Pause,
  Plus,
  Eye,
  Activity,
  Info,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
// Tooltip component not available - removed import
// Motion not used - removed import
import { cn } from '@/lib/utils';

interface ABVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // percentage
  questions: string[];
  responseRate: number;
  completionRate: number;
  avgTime: number; // seconds
  sampleSize: number;
  confidence: number;
  isControl: boolean;
  color: string;
}

interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date | null;
  endDate: Date | null;
  targetSampleSize: number;
  currentSampleSize: number;
  variants: ABVariant[];
  metrics: {
    primaryMetric: string;
    secondaryMetrics: string[];
  };
  significance: number;
  minimumDetectableEffect: number;
  power: number;
}

export function ABTestingManager() {
  // const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [testAllocation, setTestAllocation] = useState([50, 50]);
  const [significanceLevel, setSignificanceLevel] = useState(95);
  const [minimumEffect, setMinimumEffect] = useState(5);

  // Mock data
  const mockTest: ABTest = {
    id: '1',
    name: 'Question Order Impact Test',
    hypothesis: 'Changing question order from demographics-first to experience-first will increase completion rates by 10%',
    status: 'running',
    startDate: new Date('2024-01-15'),
    endDate: null,
    targetSampleSize: 1000,
    currentSampleSize: 456,
    variants: [
      {
        id: 'control',
        name: 'Control (Demographics First)',
        description: 'Traditional order with demographic questions at the beginning',
        allocation: 50,
        questions: ['age', 'gender', 'location', 'satisfaction', 'feedback'],
        responseRate: 68.2,
        completionRate: 82.5,
        avgTime: 240,
        sampleSize: 228,
        confidence: 92.3,
        isControl: true,
        color: 'blue',
      },
      {
        id: 'variant-a',
        name: 'Variant A (Experience First)',
        description: 'Experience questions first, demographics at the end',
        allocation: 50,
        questions: ['satisfaction', 'feedback', 'age', 'gender', 'location'],
        responseRate: 71.8,
        completionRate: 88.1,
        avgTime: 210,
        sampleSize: 228,
        confidence: 94.1,
        isControl: false,
        color: 'green',
      },
    ],
    metrics: {
      primaryMetric: 'Completion Rate',
      secondaryMetrics: ['Response Rate', 'Time to Complete', 'Data Quality Score'],
    },
    significance: 0.95,
    minimumDetectableEffect: 0.05,
    power: 0.8,
  };

  const calculateSampleSize = (effect: number) => {
    // Simplified sample size calculation for demonstration
    const z_alpha = 1.96; // for 95% confidence
    const z_beta = 0.84; // for 80% power
    const p = 0.5; // estimated proportion
    const n = Math.ceil(((z_alpha + z_beta) ** 2 * 2 * p * (1 - p)) / (effect ** 2));
    return n;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shuffle className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">A/B Testing</h2>
            <p className="text-sm text-gray-600">
              Test different questionnaire variations to optimize response rates
            </p>
          </div>
        </div>
        <Button onClick={() => console.log('Create new test')}>
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </div>

      {/* Active Test Overview */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{mockTest.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{mockTest.hypothesis}</p>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(mockTest.status)}>
                {mockTest.status === 'running' && <Activity className="w-3 h-3 mr-1" />}
                {mockTest.status.charAt(0).toUpperCase() + mockTest.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">
                Started {mockTest.startDate?.toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-500">
                {mockTest.currentSampleSize} / {mockTest.targetSampleSize} responses
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            {mockTest.status === 'running' ? (
              <Button variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Test Progress</span>
            <span className="text-sm text-gray-600">
              {Math.round((mockTest.currentSampleSize / mockTest.targetSampleSize) * 100)}%
            </span>
          </div>
          <Progress value={(mockTest.currentSampleSize / mockTest.targetSampleSize) * 100} />
        </div>

        {/* Variants Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {mockTest.variants.map((variant) => (
            <Card
              key={variant.id}
              className={cn(
                "p-4 border-2",
                variant.isControl ? "border-blue-200 bg-blue-50/50" : "border-green-200 bg-green-50/50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {variant.name}
                    {variant.isControl && (
                      <Badge variant="secondary" className="text-xs">
                        Control
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{variant.description}</p>
                </div>
                <div title={`Sample Size: ${variant.sampleSize}\nConfidence: ${variant.confidence.toFixed(1)}%`}>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{variant.completionRate.toFixed(1)}%</span>
                    {!variant.isControl && mockTest.variants[0] && variant.completionRate > mockTest.variants[0].completionRate && (
                      <Badge variant="secondary" className="text-xs text-green-600">
                        +{(variant.completionRate - mockTest.variants[0].completionRate).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{variant.responseRate.toFixed(1)}%</span>
                    {!variant.isControl && mockTest.variants[0] && variant.responseRate > mockTest.variants[0].responseRate && (
                      <Badge variant="secondary" className="text-xs text-green-600">
                        +{(variant.responseRate - mockTest.variants[0].responseRate).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Time</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {Math.floor(variant.avgTime / 60)}:{(variant.avgTime % 60).toString().padStart(2, '0')}
                    </span>
                    {!variant.isControl && mockTest.variants[0] && variant.avgTime < mockTest.variants[0].avgTime && (
                      <Badge variant="secondary" className="text-xs text-green-600">
                        -{Math.abs(variant.avgTime - mockTest.variants[0].avgTime)}s
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Traffic Allocation</span>
                    <span className="text-sm font-medium">{variant.allocation}%</span>
                  </div>
                  <Progress value={variant.allocation} className="h-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Statistical Significance */}
        <Card className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Statistical Significance</h4>
                <p className="text-sm text-gray-600">
                  {mockTest.variants[1]?.confidence && mockTest.variants[1].confidence >= 95 
                    ? "Results are statistically significant"
                    : mockTest.variants[1] ? `Need ${Math.ceil((95 - mockTest.variants[1].confidence) * 10)} more responses for significance` : "No data available"
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {mockTest.variants[1]?.confidence ? `${mockTest.variants[1].confidence.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Confidence Level</div>
            </div>
          </div>
        </Card>
      </Card>

      {/* Test Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
        <Tabs defaultValue="setup">
          <TabsList>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div>
              <Label>Traffic Allocation</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm w-24">Control</span>
                  <Slider
                    value={[testAllocation[0] ?? 50]}
                    onValueChange={(v) => setTestAllocation([v[0] ?? 50, 100 - (v[0] ?? 50)])}
                    max={100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{testAllocation[0]}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm w-24">Variant A</span>
                  <Slider
                    value={[testAllocation[1] ?? 50]}
                    disabled
                    max={100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{testAllocation[1]}%</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Statistical Significance Level</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[significanceLevel]}
                  onValueChange={(v) => setSignificanceLevel(v[0] ?? 95)}
                  min={90}
                  max={99}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{significanceLevel}%</span>
              </div>
            </div>

            <div>
              <Label>Minimum Detectable Effect</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[minimumEffect]}
                  onValueChange={(v) => setMinimumEffect(v[0] ?? 5)}
                  min={1}
                  max={20}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{minimumEffect}%</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Required Sample Size</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Based on current settings
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {calculateSampleSize(minimumEffect / 100).toLocaleString()}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div>
              <Label>Primary Metric</Label>
              <Select defaultValue="completion">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion">Completion Rate</SelectItem>
                  <SelectItem value="response">Response Rate</SelectItem>
                  <SelectItem value="time">Time to Complete</SelectItem>
                  <SelectItem value="quality">Data Quality Score</SelectItem>
                  <SelectItem value="satisfaction">Satisfaction Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Secondary Metrics</Label>
              <div className="space-y-2 mt-2">
                {['Response Rate', 'Time to Complete', 'Data Quality Score', 'Drop-off Rate'].map((metric) => (
                  <div key={metric} className="flex items-center gap-2">
                    <Switch defaultChecked={metric !== 'Drop-off Rate'} />
                    <Label className="font-normal">{metric}</Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="targeting" className="space-y-4">
            <div>
              <Label>Audience Segmentation</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">New users only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">Mobile users</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">Specific geographic regions</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" className="mt-2" />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input type="date" className="mt-2" />
              </div>
            </div>

            <div>
              <Label>Stop Conditions</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch defaultChecked />
                  <Label className="font-normal">Stop when statistical significance reached</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">Stop when sample size reached</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch />
                  <Label className="font-normal">Stop after specific duration</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}