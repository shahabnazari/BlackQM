'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Download,
  RefreshCw,
  Settings,
  Palette,
  Maximize2,
  Save,
  Share2,
  Layers,
  Grid3X3,
  Activity,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useStudyHub } from '@/lib/stores/study-hub.store';

interface VisualizationCenterProps {
  studyId: string;
  onExport?: (chart: any) => void;
}

interface ChartConfig {
  type: string;
  width: number;
  height: number;
  colorScheme: string;
  showLabels: boolean;
  showLegend: boolean;
  showGrid: boolean;
  format: 'svg' | 'png' | 'pdf';
  interactive: boolean;
  animation: boolean;
}

/**
 * Visualization Center Component - Phase 7 Day 4 Implementation
 *
 * World-class chart visualization hub with server-side rendering
 * Integrates with backend visualization.service.ts
 * Part of VISUALIZE phase in Research Lifecycle
 *
 * @features
 * - Server-side D3.js chart rendering
 * - Real-time chart updates via WebSocket
 * - Multiple export formats (PNG, SVG, PDF)
 * - Interactive chart builder
 * - Chart templates library
 * - Performance optimized with caching
 * - PQMethod-compatible visualizations
 */
function VisualizationCenterComponent({
  studyId,
  onExport,
}: VisualizationCenterProps) {
  const {} = useStudyHub();
  const [activeTab, setActiveTab] = useState('standard');
  const [selectedChart, setSelectedChart] = useState('correlation-heatmap');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [config, setConfig] = useState<ChartConfig>({
    type: 'heatmap',
    width: 800,
    height: 600,
    colorScheme: 'viridis',
    showLabels: true,
    showLegend: true,
    showGrid: true,
    format: 'svg',
    interactive: true,
    animation: true,
  });

  const [chartCache] = useState<Map<string, any>>(new Map());
  const [exportQueue, setExportQueue] = useState<string[]>([]);

  // Standard Q-methodology charts
  const standardCharts = [
    {
      id: 'correlation-heatmap',
      name: 'Correlation Matrix Heatmap',
      icon: Grid3X3,
      description: 'Participant correlation patterns',
      category: 'correlation',
    },
    {
      id: 'factor-loading',
      name: 'Factor Loading Plot',
      icon: ScatterChart,
      description: 'Participant loadings on factors',
      category: 'factors',
    },
    {
      id: 'scree-plot',
      name: 'Eigenvalue Scree Plot',
      icon: LineChart,
      description: 'Factor extraction decisions',
      category: 'factors',
    },
    {
      id: 'factor-arrays',
      name: 'Factor Arrays',
      icon: Layers,
      description: 'Idealized Q-sorts for factors',
      category: 'factors',
    },
    {
      id: 'distinguishing-statements',
      name: 'Distinguishing Statements',
      icon: BarChart3,
      description: 'Statements that define factors',
      category: 'statements',
    },
    {
      id: 'consensus-statements',
      name: 'Consensus Statements',
      icon: Activity,
      description: 'Statements agreed across factors',
      category: 'statements',
    },
  ];

  // Custom chart builder options
  const customChartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'heatmap', label: 'Heat Map', icon: Grid3X3 },
    { value: 'sankey', label: 'Sankey Diagram', icon: Activity },
  ];

  // Color schemes
  const colorSchemes = [
    { value: 'viridis', label: 'Viridis' },
    { value: 'RdBu', label: 'Red-Blue' },
    { value: 'spectral', label: 'Spectral' },
    { value: 'category10', label: 'Category 10' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'dark', label: 'Dark Theme' },
  ];

  useEffect(() => {
    if (realtimeEnabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [realtimeEnabled, studyId]);

  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:3001/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected for visualization updates');
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: `visualization:${studyId}`,
        })
      );
    };

    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.type === 'visualization-update') {
        handleRealtimeUpdate(message.data);
      }
    };

    ws.onerror = error => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleRealtimeUpdate = (data: any) => {
    // Update chart with real-time data
    setChartData((prev: any) => ({
      ...prev,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  };

  const generateChart = async (chartId: string) => {
    // Check cache first
    const cacheKey = `${chartId}-${JSON.stringify(config)}`;
    if (chartCache.has(cacheKey)) {
      setChartData(chartCache.get(cacheKey));
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      let params: any = {
        format: config.format,
        width: config.width,
        height: config.height,
      };

      switch (chartId) {
        case 'correlation-heatmap':
          endpoint = `/api/visualization/study/${studyId}/correlation-heatmap`;
          params.colorScheme = config.colorScheme;
          break;
        case 'factor-loading':
          endpoint = `/api/visualization/study/${studyId}/factor-loading`;
          params.showLabels = config.showLabels;
          params.threshold = 0.35;
          break;
        case 'scree-plot':
          endpoint = `/api/visualization/study/${studyId}/scree-plot`;
          params.showKaiserCriterion = true;
          break;
        case 'factor-arrays':
          endpoint = `/api/visualization/study/${studyId}/factor-arrays/1`;
          break;
        default:
          endpoint = `/api/visualization/study/${studyId}/custom`;
          params.type = chartId;
      }

      const response = await fetch(
        endpoint + '?' + new URLSearchParams(params),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (config.format === 'svg') {
        const data = await response.json();
        setChartData(data);
        // Cache the result
        chartCache.set(cacheKey, data);
      } else {
        // Handle binary formats
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setChartData({ url, format: config.format });
      }
    } catch (error: any) {
      console.error('Failed to generate chart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportChart = async () => {
    if (!chartData) return;

    if (config.format === 'svg' && chartData.data) {
      // Download SVG
      const blob = new Blob([chartData.data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedChart}.svg`;
      a.click();
    } else if (chartData.url) {
      // Download binary format
      const a = document.createElement('a');
      a.href = chartData.url;
      a.download = `${selectedChart}.${config.format}`;
      a.click();
    }

    onExport?.(chartData);
  };

  const exportBatch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/visualization/study/${studyId}/export-batch`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            charts: exportQueue.map(id => ({
              type: id,
              include: true,
            })),
            format: config.format,
            combine: true,
          }),
        }
      );

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-visualizations.${config.format}`;
      a.click();
    } catch (error: any) {
      console.error('Batch export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    await fetch(`/api/visualization/study/${studyId}/cache`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    chartCache.clear();
  };

  const renderStandardCharts = () => (
    <div className="space-y-6">
      {/* Chart Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standardCharts.map(chart => {
          const Icon = chart.icon;
          const isSelected = selectedChart === chart.id;
          const isQueued = exportQueue.includes(chart.id);

          return (
            <Card
              key={chart.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedChart(chart.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{chart.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {chart.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isQueued && (
                      <Badge variant="secondary" className="text-xs">
                        Queued
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        setExportQueue(prev =>
                          isQueued
                            ? prev.filter(id => id !== chart.id)
                            : [...prev, chart.id]
                        );
                      }}
                    >
                      {isQueued ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Visualization Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Dimensions: {config.width} × {config.height}
              </label>
              <div className="space-y-3">
                <Slider
                  value={[config.width]}
                  onValueChange={([v]) =>
                    setConfig({ ...config, width: v || config.width })
                  }
                  min={400}
                  max={1600}
                  step={100}
                />
                <Slider
                  value={[config.height]}
                  onValueChange={([v]) =>
                    setConfig({ ...config, height: v || config.height })
                  }
                  min={300}
                  max={1200}
                  step={100}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Color Scheme
              </label>
              <Select
                value={config.colorScheme}
                onValueChange={v => setConfig({ ...config, colorScheme: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorSchemes.map(scheme => (
                    <SelectItem key={scheme.value} value={scheme.value}>
                      {scheme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Export Format
              </label>
              <Select
                value={config.format}
                onValueChange={(v: 'svg' | 'png' | 'pdf') =>
                  setConfig({ ...config, format: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svg">SVG (Vector)</SelectItem>
                  <SelectItem value="png">PNG (Image)</SelectItem>
                  <SelectItem value="pdf">PDF (Document)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Labels</label>
                <Switch
                  checked={config.showLabels}
                  onCheckedChange={v => setConfig({ ...config, showLabels: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Legend</label>
                <Switch
                  checked={config.showLegend}
                  onCheckedChange={v => setConfig({ ...config, showLegend: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Real-time Updates</label>
                <Switch
                  checked={realtimeEnabled}
                  onCheckedChange={setRealtimeEnabled}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearCache}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              {exportQueue.length > 0 && (
                <Badge variant="secondary">
                  {exportQueue.length} charts selected for export
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => generateChart(selectedChart)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Chart
                  </>
                )}
              </Button>

              {chartData && (
                <Button variant="outline" onClick={exportChart}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}

              {exportQueue.length > 0 && (
                <Button variant="secondary" onClick={exportBatch}>
                  <Save className="h-4 w-4 mr-2" />
                  Export Batch
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      {chartData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chart Preview</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config.format === 'svg' && chartData.data ? (
              <div
                className="w-full overflow-auto"
                dangerouslySetInnerHTML={{ __html: chartData.data }}
              />
            ) : chartData.url ? (
              <img src={chartData.url} alt="Chart" className="w-full" />
            ) : null}

            {chartData.timestamp && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Last updated:{' '}
                {new Date(chartData.timestamp).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCustomBuilder = () => (
    <div className="space-y-6">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Create custom visualizations by selecting chart type and configuring
          data mappings
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Custom Chart Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customChartTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    config.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                  onClick={() => setConfig({ ...config, type: type.value })}
                >
                  <Icon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{type.label}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Alert variant="default">
              <AlertDescription>
                Custom chart builder will connect to your data and provide
                interactive configuration
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Academic Report Set</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete set of visualizations for academic papers
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="outline">10 charts</Badge>
                <span>Factor analysis suite</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">APA</Badge>
                <span>Publication ready</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              High-level insights for stakeholders
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="outline">5 charts</Badge>
                <span>Key findings focus</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">PPT</Badge>
                <span>Presentation ready</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Visualization Center</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create publication-ready charts with server-side rendering
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="standard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Standard Charts
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Palette className="h-4 w-4 mr-2" />
            Custom Builder
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-6">
          {renderStandardCharts()}
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          {renderCustomBuilder()}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {renderTemplates()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const VisualizationCenter = memo(VisualizationCenterComponent);
