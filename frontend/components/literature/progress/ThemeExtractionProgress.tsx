/**
 * Theme Extraction Progress Component
 * Day 28: Real-time Progress Animations
 *
 * Displays live progress of theme extraction with stage indicators
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, FileText, Video, Users, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import io from 'socket.io-client';

interface ExtractionProgress {
  userId: string;
  stage: 'analyzing' | 'papers' | 'videos' | 'social' | 'merging' | 'complete' | 'error';
  percentage: number;
  message: string;
  details?: {
    sourcesProcessed?: number;
    totalSources?: number;
    currentSource?: string;
    themesExtracted?: number;
  };
}

interface ThemeExtractionProgressProps {
  userId: string;
  onComplete?: (themesCount: number) => void;
  onError?: (error: string) => void;
}

const STAGE_CONFIG = {
  analyzing: { label: 'Analyzing', icon: Sparkles, color: 'text-purple-600' },
  papers: { label: 'Papers', icon: FileText, color: 'text-blue-600' },
  videos: { label: 'Videos', icon: Video, color: 'text-green-600' },
  social: { label: 'Social', icon: Users, color: 'text-pink-600' },
  merging: { label: 'Merging', icon: Sparkles, color: 'text-amber-600' },
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-green-600' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-red-600' },
};

export function ThemeExtractionProgress({ userId, onComplete, onError }: ThemeExtractionProgressProps) {
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const newSocket = io(`${apiUrl}/theme-extraction`, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Join user's room
      newSocket.emit('join', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('extraction-progress', (data: ExtractionProgress) => {
      console.log('Progress update:', data);
      setProgress(data);
    });

    newSocket.on('extraction-complete', (data: ExtractionProgress) => {
      console.log('Extraction complete:', data);
      setProgress(data);
      if (onComplete && data.details?.themesExtracted !== undefined) {
        setTimeout(() => onComplete(data.details!.themesExtracted!), 1000);
      }
    });

    newSocket.on('extraction-error', (data: ExtractionProgress) => {
      console.error('Extraction error:', data);
      setProgress(data);
      if (onError) {
        setTimeout(() => onError(data.message), 1000);
      }
    });

    return () => {
      if (newSocket) {
        newSocket.emit('leave', userId);
        newSocket.disconnect();
      }
    };
  }, [userId, onComplete, onError]);

  if (!progress && !isConnected) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <p className="text-sm text-gray-600">Connecting to theme extraction service...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStage = progress?.stage || 'analyzing';
  const StageIcon = STAGE_CONFIG[currentStage]?.icon || Loader2;
  const stageColor = STAGE_CONFIG[currentStage]?.color || 'text-gray-600';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`border-2 ${currentStage === 'complete' ? 'border-green-300 bg-green-50' : currentStage === 'error' ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}`}>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: currentStage === 'complete' ? 0 : 360 }}
                transition={{ duration: 2, repeat: currentStage === 'complete' ? 0 : Infinity, ease: 'linear' }}
              >
                <StageIcon className={`w-6 h-6 ${stageColor}`} />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {currentStage === 'complete' ? 'Theme Extraction Complete' : 'Extracting Themes from Sources'}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">{progress?.message || 'Initializing...'}</p>
              </div>
              {progress?.details?.sourcesProcessed !== undefined && progress?.details?.totalSources && (
                <div className="text-sm text-gray-500">
                  {progress.details.sourcesProcessed} / {progress.details.totalSources}
                </div>
              )}
            </div>

            {/* Stage Indicators */}
            <div className="flex items-center justify-between mb-4 px-2">
              {(['analyzing', 'papers', 'videos', 'social', 'merging'] as const).map((stage, index) => {
                const Icon = STAGE_CONFIG[stage].icon;
                const isActive = stage === currentStage;
                const isComplete = progress && ['papers', 'videos', 'social', 'merging', 'complete'].includes(progress.stage) &&
                  (['analyzing', 'papers', 'videos', 'social', 'merging'] as const).indexOf(stage) <
                  (['analyzing', 'papers', 'videos', 'social', 'merging'] as const).indexOf(progress.stage as any);

                return (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center gap-1">
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-blue-600 text-white' :
                          isComplete ? 'bg-green-600 text-white' :
                          'bg-gray-200 text-gray-400'
                        }`}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </motion.div>
                      <span className={`text-xs ${isActive ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                        {STAGE_CONFIG[stage].label}
                      </span>
                    </div>
                    {index < 4 && (
                      <div className={`flex-1 h-0.5 ${isComplete ? 'bg-green-600' : 'bg-gray-300'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">{progress?.percentage || 0}%</span>
              </div>
              <Progress value={progress?.percentage || 0} className="h-3" />
            </div>

            {/* Details */}
            {progress?.details?.themesExtracted !== undefined && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-white rounded-lg border border-gray-200"
              >
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-green-700">{progress.details.themesExtracted}</span> themes extracted
                </p>
              </motion.div>
            )}

            {/* Current Source (if available) */}
            {progress?.details?.currentSource && (
              <div className="mt-3 text-xs text-gray-500 truncate">
                Processing: {progress.details.currentSource}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
