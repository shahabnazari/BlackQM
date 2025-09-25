'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { ResearchPhase } from './PrimaryToolbar';
import { phaseProgressService } from '@/lib/navigation/phase-progress.service';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

interface PhaseAvailabilityProps {
  studyId: string;
  currentPhase: ResearchPhase;
  onPhaseSelect: (phase: ResearchPhase) => void;
  className?: string;
  compact?: boolean;
}

interface PhaseStatus {
  phase: ResearchPhase;
  available: boolean;
  completed: boolean;
  inProgress: boolean;
  locked: boolean;
  progress: number;
  blockers: string[];
  nextUp: boolean;
}

/**
 * World-class Smart Phase Availability Component
 * Shows phase status with intelligent availability detection
 */
export function PhaseAvailability({
  studyId,
  currentPhase,
  onPhaseSelect,
  className,
  compact = false,
}: PhaseAvailabilityProps) {
  const [phaseStatuses, setPhaseStatuses] = useState<PhaseStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPhase, setHoveredPhase] = useState<ResearchPhase | null>(null);

  // Phase metadata
  const phaseMetadata: Record<ResearchPhase, { label: string; color: string; icon: string }> = {
    discover: { label: 'Discover', color: 'purple', icon: '📚' },
    design: { label: 'Design', color: 'yellow', icon: '💡' },
    build: { label: 'Build', color: 'blue', icon: '🛠️' },
    recruit: { label: 'Recruit', color: 'green', icon: '👥' },
    collect: { label: 'Collect', color: 'teal', icon: '📊' },
    analyze: { label: 'Analyze', color: 'indigo', icon: '🔬' },
    visualize: { label: 'Visualize', color: 'pink', icon: '📈' },
    interpret: { label: 'Interpret', color: 'orange', icon: '📝' },
    report: { label: 'Report', color: 'red', icon: '📄' },
    archive: { label: 'Archive', color: 'gray', icon: '🗄️' },
  };

  useEffect(() => {
    loadPhaseStatuses();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadPhaseStatuses, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [studyId]);

  const loadPhaseStatuses = async () => {
    try {
      setLoading(true);
      const studyProgress = phaseProgressService.getStudyProgress(studyId);
      const availablePhases = phaseProgressService.getAvailablePhases(studyId);
      const nextPhase = studyProgress.nextRecommendedPhase;

      const statuses: PhaseStatus[] = [];
      
      studyProgress.phases.forEach((phaseProgress, phase) => {
        const blockers = phaseProgressService.getPhaseBlockers(studyId, phase);
        const isAvailable = availablePhases.includes(phase);
        const isCompleted = phaseProgress.progress >= 80;
        const isInProgress = phaseProgress.progress > 0 && phaseProgress.progress < 80;
        const isLocked = !isAvailable && !isCompleted;
        const isNext = phase === nextPhase;

        statuses.push({
          phase,
          available: isAvailable,
          completed: isCompleted,
          inProgress: isInProgress,
          locked: isLocked,
          progress: phaseProgress.progress,
          blockers,
          nextUp: isNext,
        });
      });

      setPhaseStatuses(statuses);
    } catch (error) {
      console.error('Failed to load phase statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseStyle = (status: PhaseStatus) => {
    const meta = phaseMetadata[status.phase];
    
    if (status.completed) {
      return `bg-${meta.color}-100 dark:bg-${meta.color}-900/20 border-${meta.color}-300 dark:border-${meta.color}-700`;
    }
    if (status.inProgress) {
      return `bg-${meta.color}-50 dark:bg-${meta.color}-900/10 border-${meta.color}-200 dark:border-${meta.color}-800`;
    }
    if (status.locked) {
      return 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800 opacity-50';
    }
    if (status.nextUp) {
      return `bg-${meta.color}-50 dark:bg-${meta.color}-900/10 border-${meta.color}-400 dark:border-${meta.color}-600 ring-2 ring-${meta.color}-400/50`;
    }
    return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300';
  };

  const getStatusIcon = (status: PhaseStatus) => {
    if (status.completed) {
      return <CheckCircleIconSolid className="w-5 h-5 text-green-600" />;
    }
    if (status.inProgress) {
      return <ClockIcon className="w-5 h-5 text-blue-600 animate-pulse" />;
    }
    if (status.locked) {
      return <LockClosedIcon className="w-5 h-5 text-gray-400" />;
    }
    if (status.nextUp) {
      return <ArrowRightIcon className="w-5 h-5 text-indigo-600 animate-bounce-x" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (compact) {
    // Compact view for toolbar
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {phaseStatuses.map((status) => {
          const meta = phaseMetadata[status.phase];
          return (
            <Tooltip key={status.phase} content={
              <div className="p-2">
                <div className="font-semibold">{meta.label}</div>
                <div className="text-sm text-gray-500">Progress: {status.progress}%</div>
                {status.blockers.length > 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    {status.blockers[0]}
                  </div>
                )}
              </div>
            }>
              <button
                onClick={() => !status.locked && onPhaseSelect(status.phase)}
                disabled={status.locked}
                className={cn(
                  "relative w-10 h-10 rounded-lg border-2 transition-all",
                  "flex items-center justify-center",
                  status.phase === currentPhase && "ring-2 ring-offset-2",
                  getPhaseStyle(status)
                )}
              >
                <span className="text-lg">{meta.icon}</span>
                {status.completed && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 bg-white rounded-full" />
                  </div>
                )}
                {status.inProgress && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-md">
                    <div 
                      className={`h-full bg-${meta.color}-500 rounded-b-md transition-all`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Full view for dashboard
  return (
    <div className={cn("space-y-3", className)}>
      <AnimatePresence>
        {phaseStatuses.map((status, index) => {
          const meta = phaseMetadata[status.phase];
          return (
            <motion.div
              key={status.phase}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredPhase(status.phase)}
              onMouseLeave={() => setHoveredPhase(null)}
            >
              <button
                onClick={() => !status.locked && onPhaseSelect(status.phase)}
                disabled={status.locked}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all",
                  "flex items-center justify-between group",
                  status.phase === currentPhase && "ring-2 ring-offset-2",
                  getPhaseStyle(status)
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{meta.icon}</div>
                  <div className="text-left">
                    <div className="font-semibold flex items-center gap-2">
                      {meta.label}
                      {status.nextUp && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {status.completed && 'Completed'}
                      {status.inProgress && `${status.progress}% Complete`}
                      {status.locked && 'Locked'}
                      {!status.completed && !status.inProgress && !status.locked && 'Ready to start'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  {status.inProgress && (
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-${meta.color}-500`}
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  )}
                  
                  {/* Status icon */}
                  {getStatusIcon(status)}
                </div>
              </button>

              {/* Blockers message */}
              {hoveredPhase === status.phase && status.blockers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <div className="font-semibold mb-1">Requirements not met:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {status.blockers.map((blocker, i) => (
                          <li key={i}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}