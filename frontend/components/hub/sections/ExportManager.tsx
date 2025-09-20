'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileJson,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  RefreshCw,
  Archive,
  Database,
  FileCode,
  GraduationCap
} from 'lucide-react';
import { useStudyHub } from '@/lib/stores/study-hub.store';
import { cn } from '@/lib/utils';

interface ExportManagerProps {
  studyId: string;
}

interface ExportJob {
  id: string;
  type: 'report' | 'data' | 'analysis' | 'visualization' | 'complete';
  format: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  size?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  downloadUrl?: string;
}

interface ExportPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  exports: {
    type: string;
    format: string;
    options?: Record<string, any>;
  }[];
}

/**
 * Export Manager Component - Phase 7 Day 6 Implementation
 * 
 * Enterprise-grade export management system with download queue
 * Supports multiple formats and batch exports
 * 
 * @features
 * - Download queue management
 * - Multiple export formats (PDF, Word, CSV, JSON, LaTeX)
 * - Batch export presets
 * - Progress tracking
 * - Export history
 * - Retry failed exports
 * - File size optimization
 */
export function ExportManager({ studyId }: ExportManagerProps) {
  const { studyData } = useStudyHub();
  const [exportQueue, setExportQueue] = useState<ExportJob[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Export presets for common use cases
  const exportPresets: ExportPreset[] = [
    {
      id: 'complete-study',
      name: 'Complete Study Package',
      description: 'All data, analysis, and visualizations',
      icon: Package,
      exports: [
        { type: 'report', format: 'pdf' },
        { type: 'data', format: 'csv' },
        { type: 'analysis', format: 'json' },
        { type: 'visualization', format: 'png' }
      ]
    },
    {
      id: 'academic-submission',
      name: 'Academic Submission',
      description: 'Report and supporting data for journal submission',
      icon: GraduationCap,
      exports: [
        { type: 'report', format: 'latex' },
        { type: 'data', format: 'csv' },
        { type: 'analysis', format: 'spss' }
      ]
    },
    {
      id: 'data-only',
      name: 'Raw Data Export',
      description: 'Q-sorts and participant responses',
      icon: Database,
      exports: [
        { type: 'data', format: 'csv' },
        { type: 'data', format: 'json' },
        { type: 'data', format: 'xlsx' }
      ]
    },
    {
      id: 'visualizations',
      name: 'All Visualizations',
      description: 'Charts and graphs in multiple formats',
      icon: FileImage,
      exports: [
        { type: 'visualization', format: 'png' },
        { type: 'visualization', format: 'svg' },
        { type: 'visualization', format: 'pdf' }
      ]
    },
    {
      id: 'pqmethod',
      name: 'PQMethod Compatible',
      description: 'Export for PQMethod software',
      icon: FileCode,
      exports: [
        { type: 'data', format: 'pqmethod' },
        { type: 'analysis', format: 'pqmethod' }
      ]
    }
  ];

  // Load export history on mount
  useEffect(() => {
    loadExportHistory();
  }, [studyId]);

  // Process export queue
  useEffect(() => {
    if (isProcessing && exportQueue.length > 0) {
      const pendingJobs = exportQueue.filter(job => job.status === 'pending');
      if (pendingJobs.length > 0) {
        processNextJob();
      }
    }
  }, [exportQueue, isProcessing]);

  // Load export history from localStorage (Phase 10 will use backend)
  const loadExportHistory = () => {
    const savedHistory = localStorage.getItem(`export_history_${studyId}`);
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setExportHistory(history.map((job: any) => ({
        ...job,
        startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
        completedAt: job.completedAt ? new Date(job.completedAt) : undefined
      })));
    }
  };

  // Save export history
  const saveExportHistory = (history: ExportJob[]) => {
    localStorage.setItem(`export_history_${studyId}`, JSON.stringify(history));
  };

  // Add export job to queue
  const addExportJob = (type: string, format: string) => {
    const job: ExportJob = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      format,
      filename: generateFilename(type, format),
      status: 'pending',
      progress: 0
    };

    setExportQueue(prev => [...prev, job]);
    
    if (!isProcessing) {
      setIsProcessing(true);
    }
  };

  // Generate filename based on type and format
  const generateFilename = (type: string, format: string): string => {
    const studyName = studyData?.study?.title?.replace(/[^a-z0-9]/gi, '_') || 'study';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${studyName}_${type}_${timestamp}.${format}`;
  };

  // Process next job in queue
  const processNextJob = async () => {
    const job = exportQueue.find(j => j.status === 'pending');
    if (!job) {
      setIsProcessing(false);
      return;
    }

    // Update job status
    updateJobStatus(job.id, 'processing', 0);

    try {
      // Simulate export process (Phase 10 will use real backend)
      await simulateExport(job);
      
      // Mark as completed
      updateJobStatus(job.id, 'completed', 100);
      
      // Move to history
      moveJobToHistory(job.id);
      
    } catch (error: any) {
      updateJobStatus(job.id, 'failed', 0, error.message);
    }

    // Process next job
    setTimeout(() => {
      if (isProcessing) {
        processNextJob();
      }
    }, 500);
  };

  // Simulate export process (will be replaced with real API calls in Phase 10)
  const simulateExport = async (job: ExportJob): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        updateJobProgress(job.id, progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200);

      // Simulate random failure (10% chance)
      if (Math.random() < 0.1) {
        clearInterval(interval);
        setTimeout(() => reject(new Error('Export failed')), 500);
      }
    });
  };

  // Update job status
  const updateJobStatus = (jobId: string, status: ExportJob['status'], progress: number, error?: string) => {
    setExportQueue(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status, 
            progress,
            error,
            startedAt: status === 'processing' ? new Date() : job.startedAt,
            completedAt: status === 'completed' ? new Date() : job.completedAt
          } as ExportJob
        : job
    ));
  };

  // Update job progress
  const updateJobProgress = (jobId: string, progress: number) => {
    setExportQueue(prev => prev.map(job =>
      job.id === jobId ? { ...job, progress } : job
    ));
  };

  // Move completed job to history
  const moveJobToHistory = (jobId: string) => {
    const job = exportQueue.find(j => j.id === jobId);
    if (job) {
      const updatedHistory = [...exportHistory, job];
      setExportHistory(updatedHistory);
      saveExportHistory(updatedHistory);
      setExportQueue(prev => prev.filter(j => j.id !== jobId));
    }
  };

  // Cancel job
  const cancelJob = (jobId: string) => {
    updateJobStatus(jobId, 'cancelled', 0);
    setTimeout(() => {
      setExportQueue(prev => prev.filter(j => j.id !== jobId));
    }, 500);
  };

  // Retry failed job
  const retryJob = (jobId: string) => {
    const job = [...exportQueue, ...exportHistory].find(j => j.id === jobId);
    if (job) {
      addExportJob(job.type, job.format);
      // Remove from history if it was there
      setExportHistory(prev => prev.filter(j => j.id !== jobId));
    }
  };

  // Clear history
  const clearHistory = () => {
    setExportHistory([]);
    localStorage.removeItem(`export_history_${studyId}`);
  };

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = exportPresets.find(p => p.id === presetId);
    if (preset) {
      preset.exports.forEach(exp => {
        addExportJob(exp.type, exp.format);
      });
      setSelectedPreset(presetId);
    }
  };

  // Get icon for export type
  const getExportIcon = (type: string) => {
    switch (type) {
      case 'report': return FileText;
      case 'data': return FileSpreadsheet;
      case 'visualization': return FileImage;
      case 'analysis': return FileJson;
      default: return FileText;
    }
  };

  // Get status color
  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'cancelled': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Manager</h2>
          <p className="text-muted-foreground">
            Download your study data in multiple formats
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsProcessing(!isProcessing)}
            disabled={exportQueue.filter(j => j.status === 'pending').length === 0}
          >
            {isProcessing ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Queue
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Queue
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Export Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Quick Export Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {exportPresets.map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "p-4 border rounded-lg text-left hover:bg-accent transition-colors",
                    selectedPreset === preset.id && "border-primary bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {preset.description}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {preset.exports.map((exp, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {exp.format.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Export Queue
              {exportQueue.length > 0 && (
                <Badge>{exportQueue.length}</Badge>
              )}
            </CardTitle>
            {exportQueue.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExportQueue([])}
              >
                Clear Queue
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {exportQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exports in queue. Select a preset or add individual exports.
            </div>
          ) : (
            <div className="space-y-3">
              {exportQueue.map(job => {
                const Icon = getExportIcon(job.type);
                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{job.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {job.format.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {job.status === 'processing' && (
                        <Progress value={job.progress} className="h-2 mt-2" />
                      )}
                      
                      {job.error && (
                        <p className="text-xs text-red-500 mt-1">{job.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.status === 'processing' && (
                        <LoadingSpinner className="w-4 h-4" />
                      )}
                      
                      <span className={cn("text-sm", getStatusColor(job.status))}>
                        {job.status === 'processing' && `${job.progress}%`}
                        {job.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                        {job.status === 'failed' && <XCircle className="w-4 h-4" />}
                        {job.status === 'cancelled' && <AlertCircle className="w-4 h-4" />}
                      </span>
                      
                      {job.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => retryJob(job.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {(job.status === 'pending' || job.status === 'processing') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelJob(job.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Export History
              {exportHistory.length > 0 && (
                <Badge variant="outline">{exportHistory.length}</Badge>
              )}
            </CardTitle>
            {exportHistory.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearHistory}
              >
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {exportHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No export history yet.
            </div>
          ) : (
            <div className="space-y-2">
              {exportHistory.slice().reverse().map(job => {
                const Icon = getExportIcon(job.type);
                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    
                    <div className="flex-1">
                      <span className="text-sm">{job.filename}</span>
                      {job.completedAt && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {job.completedAt.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {job.format.toUpperCase()}
                    </Badge>
                    
                    {job.status === 'completed' ? (
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryJob(job.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Exported files are available for download for 7 days. 
          Consider saving important exports to your local storage or cloud service.
        </AlertDescription>
      </Alert>
    </div>
  );
}