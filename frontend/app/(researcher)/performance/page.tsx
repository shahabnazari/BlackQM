'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Gauge,
  Package,
  Clock,
  Zap,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

// Core Web Vitals thresholds
// Removed unused WEB_VITALS_THRESHOLDS

// Removed unused MetricData interface

interface BundleSize {
  name: string;
  size: number;
  gzipped: number;
  percentage: number;
  trend: number;
}

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  // Mock performance data - in production, this would come from monitoring service
  const [webVitals] = useState({
    LCP: { value: 2100, trend: -5, rating: 'good' as const },
    FID: { value: 85, trend: -10, rating: 'good' as const },
    CLS: { value: 0.08, trend: 2, rating: 'good' as const },
    FCP: { value: 1600, trend: -3, rating: 'good' as const },
    TTFB: { value: 450, trend: -8, rating: 'good' as const },
  });

  const [performanceScore, setPerformanceScore] = useState(92);

  // Mock bundle sizes
  const [bundleSizes] = useState<BundleSize[]>([
    {
      name: 'Main Bundle',
      size: 245000,
      gzipped: 78000,
      percentage: 45,
      trend: -2,
    },
    {
      name: 'Vendor Bundle',
      size: 189000,
      gzipped: 62000,
      percentage: 35,
      trend: 0,
    },
    {
      name: 'Charts Library',
      size: 56000,
      gzipped: 18000,
      percentage: 10,
      trend: 1,
    },
    { name: 'Icons', size: 34000, gzipped: 11000, percentage: 6, trend: 0 },
    { name: 'Styles', size: 22000, gzipped: 7000, percentage: 4, trend: -1 },
  ]);

  // Mock historical data
  const [historicalData] = useState([
    { time: '00:00', LCP: 2200, FID: 90, CLS: 0.09, users: 120 },
    { time: '04:00', LCP: 2100, FID: 85, CLS: 0.08, users: 80 },
    { time: '08:00', LCP: 2300, FID: 95, CLS: 0.1, users: 200 },
    { time: '12:00', LCP: 2400, FID: 100, CLS: 0.11, users: 350 },
    { time: '16:00', LCP: 2200, FID: 88, CLS: 0.09, users: 300 },
    { time: '20:00', LCP: 2100, FID: 85, CLS: 0.08, users: 250 },
    { time: 'Now', LCP: 2100, FID: 85, CLS: 0.08, users: 180 },
  ]);

  // Use performance monitor hook
  const performanceMetrics = usePerformanceMonitor();

  useEffect(() => {
    // Update metrics from performance monitor
    if (performanceMetrics) {
      // Update web vitals based on actual measurements
      console.log('Performance metrics:', performanceMetrics);
    }
  }, [performanceMetrics]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Update metrics with new data
    setPerformanceScore(prev => Math.min(100, prev + Math.random() * 2 - 1));
    setIsRefreshing(false);
  };

  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      performanceScore,
      webVitals,
      bundleSizes,
      historicalData,
    };

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-metrics-${Date.now()}.json`;
      a.click();
    } else {
      // CSV export
      const csvRows = [
        ['Metric', 'Value', 'Trend', 'Rating'],
        ...Object.entries(webVitals).map(([key, val]) => [
          key,
          val.value,
          val.trend,
          val.rating,
        ]),
      ];
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-metrics-${Date.now()}.csv`;
      a.click();
    }
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getMetricIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor Core Web Vitals and application performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Performance Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Performance Score</h3>
                <p className="text-muted-foreground">
                  Overall application health
                </p>
              </div>
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${performanceScore * 3.52} 352`}
                    className="text-green-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{performanceScore}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Core Web Vitals */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(webVitals).map(([key, metric], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        metric.rating === 'good'
                          ? 'default'
                          : metric.rating === 'poor'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {key}
                    </Badge>
                    {getMetricIcon(metric.trend)}
                  </div>
                  <div className="space-y-1">
                    <p
                      className={cn(
                        'text-2xl font-bold',
                        getMetricColor(metric.rating)
                      )}
                    >
                      {typeof metric.value === 'number' && metric.value < 1
                        ? metric.value.toFixed(2)
                        : metric.value}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {key === 'CLS' ? '' : 'ms'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
                      from last period
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts Section */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Performance Timeline</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>
                Track Core Web Vitals throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="LCP"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="FID"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="2"
                      stroke="#ffc658"
                      fill="#ffc658"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundle Size Chart */}
        <TabsContent value="bundle">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Size Analysis</CardTitle>
              <CardDescription>
                Breakdown of JavaScript bundle sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bundleSizes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="size"
                        fill="#8884d8"
                        name="Original Size (bytes)"
                      />
                      <Bar
                        dataKey="gzipped"
                        fill="#82ca9d"
                        name="Gzipped Size (bytes)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bundleSizes.map(bundle => (
                    <div
                      key={bundle.name}
                      className="flex items-center justify-between p-3 bg-accent rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(bundle.size / 1000).toFixed(1)}KB (
                          {bundle.percentage}%)
                        </p>
                      </div>
                      <Badge
                        variant={
                          bundle.trend === 0
                            ? 'secondary'
                            : bundle.trend > 0
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        {bundle.trend > 0 ? '+' : ''}
                        {bundle.trend}%
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div>
                    <p className="font-semibold">Total Bundle Size</p>
                    <p className="text-sm text-muted-foreground">
                      All JavaScript assets
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">546KB</p>
                    <p className="text-sm text-green-500">
                      ↓ 2.3% from last build
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Metrics */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>
                In-depth analysis of all performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Lighthouse Metrics */}
                <div>
                  <h3 className="font-semibold mb-3">Lighthouse Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { name: 'Performance', value: 92, color: 'bg-green-500' },
                      {
                        name: 'Accessibility',
                        value: 98,
                        color: 'bg-green-500',
                      },
                      {
                        name: 'Best Practices',
                        value: 95,
                        color: 'bg-green-500',
                      },
                      { name: 'SEO', value: 100, color: 'bg-green-500' },
                    ].map(metric => (
                      <div key={metric.name} className="text-center">
                        <div className="relative inline-flex">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${metric.value * 2.26} 226`}
                              className={cn(metric.color, 'text-opacity-100')}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                            {metric.value}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-2">
                          {metric.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Runtime Metrics */}
                <div>
                  <h3 className="font-semibold mb-3">Runtime Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        name: 'Memory Usage',
                        value: '42MB',
                        trend: -3,
                        icon: Package,
                      },
                      {
                        name: 'CPU Usage',
                        value: '12%',
                        trend: -1,
                        icon: Gauge,
                      },
                      {
                        name: 'Network Requests',
                        value: '24/min',
                        trend: 0,
                        icon: Activity,
                      },
                      {
                        name: 'Cache Hit Rate',
                        value: '94%',
                        trend: 2,
                        icon: Zap,
                      },
                      {
                        name: 'Error Rate',
                        value: '0.02%',
                        trend: -1,
                        icon: AlertTriangle,
                      },
                      {
                        name: 'Avg Response Time',
                        value: '120ms',
                        trend: -5,
                        icon: Clock,
                      },
                    ].map(metric => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.name}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {metric.name}
                              </p>
                              <p className="text-lg font-bold">
                                {metric.value}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              metric.trend === 0
                                ? 'secondary'
                                : metric.trend > 0
                                  ? 'destructive'
                                  : 'default'
                            }
                          >
                            {metric.trend > 0 ? '+' : ''}
                            {metric.trend}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Export Options */}
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium">Export Performance Report</p>
                    <p className="text-sm text-muted-foreground">
                      Download detailed metrics in your preferred format
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={exportFormat}
                      onValueChange={(value: 'csv' | 'json') =>
                        setExportFormat(value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={exportMetrics}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>
              AI-powered suggestions to improve your metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Optimize Largest Contentful Paint',
                  description:
                    'Consider lazy-loading images below the fold and preloading critical resources',
                  impact: 'High',
                  icon: CheckCircle,
                  color: 'text-green-500',
                },
                {
                  title: 'Reduce JavaScript Bundle Size',
                  description:
                    'Enable code splitting for the Charts Library to reduce initial load',
                  impact: 'Medium',
                  icon: Info,
                  color: 'text-blue-500',
                },
                {
                  title: 'Implement Resource Hints',
                  description:
                    'Add preconnect hints for third-party domains to improve connection speed',
                  impact: 'Low',
                  icon: AlertTriangle,
                  color: 'text-yellow-500',
                },
              ].map((recommendation, index) => {
                const Icon = recommendation.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Icon
                      className={cn('h-5 w-5 mt-0.5', recommendation.color)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{recommendation.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.description}
                      </p>
                    </div>
                    <Badge>{recommendation.impact} Impact</Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
