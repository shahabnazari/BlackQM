'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ResearchPhase } from './PrimaryToolbar';
import { cn } from '@/lib/utils';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface ToolItem {
  id: string;
  label: string;
  path: string;
  description?: string;
  badge?: 'NEW' | 'BETA' | 'AI' | number;
  aiEnabled?: boolean;
}

// Phase tools using consolidated routes from Phase 8.5 Day 3
const phaseTools: Record<ResearchPhase, ToolItem[]> = {
  discover: [
    {
      id: 'literature-search',
      label: 'Literature Search',
      path: '/discover/literature',
      description: 'AI-powered paper search',
      aiEnabled: true,
      badge: 'NEW',
    },
    {
      id: 'reference-manager',
      label: 'Reference Manager',
      path: '/discover/references',
      description: 'Import and organize citations',
    },
    {
      id: 'knowledge-map',
      label: 'Knowledge Map',
      path: '/discover/knowledge-map',
      description: 'Visual concept mapping',
    },
    {
      id: 'research-gaps',
      label: 'Research Gaps',
      path: '/discover/gaps',
      description: 'AI gap analysis',
      aiEnabled: true,
    },
    {
      id: 'prior-studies',
      label: 'Prior Studies',
      path: '/discover/studies',
      description: 'Browse existing Q-studies',
    },
  ],
  design: [
    {
      id: 'research-questions',
      label: 'Research Questions',
      path: '/design/questions',
      description: 'Question formulation wizard',
    },
    {
      id: 'hypothesis',
      label: 'Hypothesis Builder',
      path: '/design/hypothesis',
      description: 'Interactive hypothesis tool',
    },
    {
      id: 'methodology',
      label: 'Methodology',
      path: '/design/methodology',
      description: 'Q-method vs others',
    },
    {
      id: 'protocol',
      label: 'Study Protocol',
      path: '/design/protocol',
      description: 'Protocol designer',
    },
    {
      id: 'ethics',
      label: 'Ethics Review',
      path: '/design/ethics',
      description: 'IRB checklist',
    },
  ],
  build: [
    {
      id: 'study-setup',
      label: 'Study Setup',
      path: '/build/study',
      description: 'Basic configuration',
    },
    {
      id: 'grid-designer',
      label: 'Q-Grid Designer',
      path: '/build/grid',
      description: 'Grid configuration',
    },
    {
      id: 'statement-generator',
      label: 'Statement Generator',
      path: '/build/ai-assistant',
      description: 'AI-powered stimuli',
      aiEnabled: true,
    },
    {
      id: 'questionnaire-builder',
      label: 'Questionnaire Builder Pro',
      path: '/build/questionnaire',
      description: 'Advanced 3-column builder',
      badge: 'NEW',
    },
    {
      id: 'consent-forms',
      label: 'Consent Forms',
      path: '/build/consent',
      description: 'Digital consent',
    },
  ],
  recruit: [
    {
      id: 'participant-pool',
      label: 'Participant Pool',
      path: '/recruit/participants',
      description: 'Manage participants',
    },
    {
      id: 'invitations',
      label: 'Invitations',
      path: '/recruit/invitations',
      description: 'Send study invites',
    },
    {
      id: 'pre-screening',
      label: 'Pre-Screening',
      path: '/recruit/screening',
      description: 'Qualification screening',
    },
    {
      id: 'scheduling',
      label: 'Scheduling',
      path: '/recruit/scheduling',
      description: 'Session scheduling',
    },
    {
      id: 'compensation',
      label: 'Compensation',
      path: '/recruit/compensation',
      description: 'Payment tracking',
    },
  ],
  collect: [
    {
      id: 'active-sessions',
      label: 'Active Sessions',
      path: '/collect/sessions',
      description: 'Live monitoring',
    },
    {
      id: 'q-sort',
      label: 'Q-Sort Interface',
      path: '/collect/qsort',
      description: 'Participant view',
    },
    {
      id: 'post-survey',
      label: 'Post-Survey',
      path: '/collect/post-survey',
      description: 'Supplementary data',
    },
    {
      id: 'progress',
      label: 'Progress Tracker',
      path: '/collect/progress',
      description: 'Completion stats',
    },
    {
      id: 'quality',
      label: 'Quality Control',
      path: '/collect/quality',
      description: 'Data quality checks',
    },
  ],
  analyze: [
    {
      id: 'analysis-hub',
      label: 'Analysis Hub',
      path: '/analyze/hub',
      description: 'Unified center',
      badge: 'AI',
    },
    {
      id: 'q-analysis',
      label: 'Q-Analysis',
      path: '/analyze/q-methodology',
      description: 'Factor analysis',
    },
    {
      id: 'statistics',
      label: 'Statistical Tests',
      path: '/analyze/statistics',
      description: 'Significance testing',
    },
    {
      id: 'rotation',
      label: 'Factor Rotation',
      path: '/analyze/rotation',
      description: 'Rotation tools',
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      path: '/analyze/ai-insights',
      description: 'Pattern detection',
      aiEnabled: true,
    },
  ],
  visualize: [
    {
      id: 'factor-arrays',
      label: 'Factor Arrays',
      path: '/visualize/arrays',
      description: 'Array visualizations',
    },
    {
      id: 'loading-plots',
      label: 'Loading Plots',
      path: '/visualize/loadings',
      description: 'Factor loadings',
    },
    {
      id: 'heat-maps',
      label: 'Heat Maps',
      path: '/visualize/heatmaps',
      description: 'Correlation heat maps',
    },
    {
      id: 'distributions',
      label: 'Distributions',
      path: '/visualize/distributions',
      description: 'Response distributions',
    },
    {
      id: 'dashboards',
      label: 'Dashboards',
      path: '/visualize/dashboards',
      description: 'Custom dashboards',
    },
  ],
  interpret: [
    {
      id: 'factor-interpretation',
      label: 'Factor Interpretation',
      path: '/interpret/narratives',
      description: 'AI narratives',
      aiEnabled: true,
    },
    {
      id: 'consensus',
      label: 'Consensus Analysis',
      path: '/interpret/consensus',
      description: 'Agreement patterns',
    },
    {
      id: 'themes',
      label: 'Theme Extraction',
      path: '/interpret/themes',
      description: 'Qualitative themes',
      aiEnabled: true,
    },
    {
      id: 'quotes',
      label: 'Quote Mining',
      path: '/interpret/quotes',
      description: 'Participant comments',
    },
    {
      id: 'synthesis',
      label: 'Synthesis',
      path: '/interpret/synthesis',
      description: 'Cross-factor synthesis',
    },
  ],
  report: [
    {
      id: 'report-generator',
      label: 'Report Generator',
      path: '/report/builder',
      description: 'Automated reports',
      aiEnabled: true,
    },
    {
      id: 'summary',
      label: 'Executive Summary',
      path: '/report/summary',
      description: 'AI-generated summary',
      aiEnabled: true,
    },
    {
      id: 'publication',
      label: 'Publication Export',
      path: '/report/export',
      description: 'Journal formats',
    },
    {
      id: 'presentation',
      label: 'Presentation Mode',
      path: '/report/presentation',
      description: 'Slide generator',
    },
    {
      id: 'collaboration',
      label: 'Collaboration',
      path: '/report/collaborate',
      description: 'Co-author tools',
    },
  ],
  archive: [
    {
      id: 'study-archive',
      label: 'Study Archive',
      path: '/archive/studies',
      description: 'Completed studies',
    },
    {
      id: 'repository',
      label: 'Data Repository',
      path: '/archive/export',
      description: 'Long-term storage',
    },
    {
      id: 'doi',
      label: 'DOI Assignment',
      path: '/archive/doi',
      description: 'Persistent IDs',
    },
    {
      id: 'sharing',
      label: 'Public Sharing',
      path: '/archive/share',
      description: 'Open data options',
    },
    {
      id: 'version',
      label: 'Version Control',
      path: '/archive/version-control',
      description: 'Study versioning',
    },
  ],
};

interface SecondaryToolbarProps {
  phase: ResearchPhase;
  onClose: () => void;
}

export function SecondaryToolbar({ phase, onClose }: SecondaryToolbarProps) {
  const router = useRouter();
  const tools = phaseTools[phase] || [];

  const handleToolClick = (tool: ToolItem) => {
    // Routes are now phase-based, no researcher prefix needed
    router.push(tool.path);
    onClose();
  };

  // Get phase color
  const phaseColors: Record<ResearchPhase, string> = {
    discover: 'border-purple-200 bg-purple-50',
    design: 'border-yellow-200 bg-yellow-50',
    build: 'border-blue-200 bg-blue-50',
    recruit: 'border-green-200 bg-green-50',
    collect: 'border-teal-200 bg-teal-50',
    analyze: 'border-indigo-200 bg-indigo-50',
    visualize: 'border-pink-200 bg-pink-50',
    interpret: 'border-orange-200 bg-orange-50',
    report: 'border-red-200 bg-red-50',
    archive: 'border-gray-200 bg-gray-50',
  };

  return (
    <div
      className={cn(
        'border-b-2 sticky top-0 z-40 bg-white/95 backdrop-blur-sm',
        phaseColors[phase]
      )}
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Sequential Tool Flow with Numbers and Arrows */}
          <div className="flex items-center overflow-x-auto">
            {tools.map((tool, index) => (
              <div key={tool.id} className="flex items-center">
                <motion.button
                  onClick={() => handleToolClick(tool)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'group relative px-4 py-2 rounded-lg transition-all duration-200',
                    'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300',
                    'flex items-center space-x-2 min-w-fit'
                  )}
                >
                  {/* Step Number */}
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                    {index + 1}
                  </span>

                  {/* Tool Label */}
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {tool.label}
                  </span>

                  {/* AI Badge */}
                  {tool.aiEnabled && (
                    <SparklesIcon className="w-4 h-4 text-purple-500" />
                  )}

                  {/* Badge */}
                  {tool.badge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded',
                        tool.badge === 'NEW' && 'bg-green-100 text-green-700',
                        tool.badge === 'BETA' &&
                          'bg-yellow-100 text-yellow-700',
                        tool.badge === 'AI' && 'bg-purple-100 text-purple-700',
                        typeof tool.badge === 'number' &&
                          'bg-blue-100 text-blue-700'
                      )}
                    >
                      {tool.badge}
                    </span>
                  )}

                  {/* Tooltip */}
                  {tool.description && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {tool.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  )}
                </motion.button>

                {/* Arrow between items */}
                {index < tools.length - 1 && (
                  <svg
                    className="w-6 h-6 text-gray-400 mx-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Phase indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-600">
            <span className="font-medium capitalize">{phase}</span>
            <span className="text-xs">Phase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
