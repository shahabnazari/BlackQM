'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ResearchPhase } from './PrimaryToolbar';
import { useNavigationState } from '@/hooks/useNavigationState';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface PhaseProgressIndicatorProps {
  studyId?: string;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function PhaseProgressIndicator({
  studyId: _studyId, // TODO: Use for study-specific progress
  compact = false,
  orientation = 'horizontal',
}: PhaseProgressIndicatorProps) {
  const { phaseProgress, completedPhases, currentPhase, availablePhases } =
    useNavigationState();

  const phases: Array<{
    id: ResearchPhase;
    label: string;
    shortLabel: string;
  }> = [
    { id: 'discover', label: 'Discover', shortLabel: 'DIS' },
    { id: 'design', label: 'Design', shortLabel: 'DES' },
    { id: 'build', label: 'Build', shortLabel: 'BLD' },
    { id: 'recruit', label: 'Recruit', shortLabel: 'REC' },
    { id: 'collect', label: 'Collect', shortLabel: 'COL' },
    { id: 'analyze', label: 'Analyze', shortLabel: 'ANA' },
    { id: 'visualize', label: 'Visualize', shortLabel: 'VIS' },
    { id: 'interpret', label: 'Interpret', shortLabel: 'INT' },
    { id: 'report', label: 'Report', shortLabel: 'REP' },
    { id: 'archive', label: 'Archive', shortLabel: 'ARC' },
  ];

  const getPhaseColor = (phase: ResearchPhase) => {
    const colors: Record<ResearchPhase, string> = {
      discover: 'bg-purple-500',
      design: 'bg-yellow-500',
      build: 'bg-blue-500',
      recruit: 'bg-green-500',
      collect: 'bg-teal-500',
      analyze: 'bg-indigo-500',
      visualize: 'bg-pink-500',
      interpret: 'bg-orange-500',
      report: 'bg-red-500',
      archive: 'bg-gray-500',
    };
    return colors[phase];
  };

  const getPhaseStatus = (phase: ResearchPhase) => {
    if (completedPhases.includes(phase)) return 'completed';
    if (currentPhase === phase) return 'current';
    if (availablePhases.includes(phase)) return 'available';
    return 'locked';
  };

  const containerClass = cn(
    'flex items-center',
    orientation === 'vertical' ? 'flex-col space-y-4' : 'space-x-2',
    compact ? 'p-2' : 'p-4'
  );

  const phaseClass = (status: string) =>
    cn(
      'relative flex items-center justify-center rounded-full transition-all duration-300',
      compact ? 'w-8 h-8' : 'w-12 h-12',
      status === 'completed' && 'bg-green-500 text-white',
      status === 'current' && 'ring-4 ring-blue-400 ring-offset-2',
      status === 'available' && 'bg-gray-200 hover:bg-gray-300',
      status === 'locked' && 'bg-gray-100 opacity-50'
    );

  return (
    <div className={containerClass}>
      {phases.map((phase, index) => {
        const progress = phaseProgress[phase.id] || 0;
        const status = getPhaseStatus(phase.id);

        return (
          <React.Fragment key={phase.id}>
            {/* Connector Line */}
            {index > 0 && orientation === 'horizontal' && (
              <div
                className={cn(
                  'h-0.5 bg-gray-300',
                  compact ? 'w-4' : 'w-8',
                  index > 0 &&
                    phases[index - 1] &&
                    completedPhases.includes(phases[index - 1]!.id) &&
                    'bg-green-500'
                )}
              />
            )}

            {/* Phase Circle */}
            <motion.div
              className={phaseClass(status)}
              whileHover={status === 'available' ? { scale: 1.1 } : {}}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {status === 'completed' ? (
                <CheckCircleIcon className={compact ? 'w-4 h-4' : 'w-6 h-6'} />
              ) : (
                <div className="relative w-full h-full">
                  {/* Progress Ring */}
                  <svg className="absolute inset-0 -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r={compact ? '14' : '20'}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r={compact ? '14' : '20'}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * (compact ? 14 : 20)}`}
                      strokeDashoffset={`${2 * Math.PI * (compact ? 14 : 20) * (1 - progress / 100)}`}
                      className={cn(
                        'transition-all duration-500',
                        status === 'current'
                          ? getPhaseColor(phase.id)
                          : 'text-gray-400'
                      )}
                    />
                  </svg>

                  {/* Phase Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={cn(
                        'font-semibold',
                        compact ? 'text-xs' : 'text-sm',
                        status === 'locked' && 'text-gray-400'
                      )}
                    >
                      {compact ? phase.shortLabel : (index + 1).toString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Tooltip */}
              {!compact && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-gray-600">{phase.label}</span>
                  {progress > 0 && progress < 100 && (
                    <span className="block text-xs text-gray-400">
                      {progress}%
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </React.Fragment>
        );
      })}

      {/* Overall Progress Summary */}
      {!compact && (
        <div className="ml-4 text-sm text-gray-600">
          <div className="font-medium">
            {completedPhases.length} of {phases.length} phases complete
          </div>
          <div className="text-xs text-gray-400">
            Overall:{' '}
            {Math.round(
              Object.values(phaseProgress).reduce((a, b) => a + b, 0) /
                phases.length
            )}
            %
          </div>
        </div>
      )}
    </div>
  );
}
