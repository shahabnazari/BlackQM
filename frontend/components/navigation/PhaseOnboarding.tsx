'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  InformationCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { ResearchPhase } from './PrimaryToolbar';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  videoUrl?: string;
  imageUrl?: string;
  tips?: string[];
  completed?: boolean;
}

interface PhaseOnboardingProps {
  phase: ResearchPhase;
  studyId: string;
  userId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

/**
 * World-class Phase Onboarding Flow
 * Interactive guided tour for each research phase
 */
export function PhaseOnboarding({
  phase,
  userId,
  onComplete,
  onSkip,
  className,
}: PhaseOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setCompletedSteps] = useState<string[]>([]);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Phase-specific onboarding content
  const phaseOnboarding: Record<ResearchPhase, OnboardingStep[]> = {
    discover: [
      {
        id: 'discover-welcome',
        title: 'Welcome to the Discovery Phase! 🔍',
        description:
          "This is where your research journey begins. You'll explore existing literature, identify gaps, and build your theoretical foundation.",
        tips: [
          'Start with broad searches and narrow down',
          'Keep track of search terms that work well',
          'Look for systematic reviews and meta-analyses first',
        ],
      },
      {
        id: 'discover-search',
        title: 'Search Academic Databases',
        description:
          'Use our integrated search to find papers from multiple academic databases simultaneously.',
        action: {
          label: 'Try Literature Search',
          onClick: () => console.log('Open literature search'),
        },
        videoUrl: '/videos/literature-search.mp4',
      },
      {
        id: 'discover-organize',
        title: 'Organize Your References',
        description:
          'Import references and organize them into collections. Tag papers by theme, methodology, or relevance.',
        tips: [
          'Use folders to group related papers',
          'Add notes to remember key insights',
          'Star the most important references',
        ],
      },
      {
        id: 'discover-map',
        title: 'Create a Knowledge Map',
        description:
          'Visualize connections between concepts, theories, and research gaps.',
        action: {
          label: 'Open Knowledge Mapper',
          onClick: () => console.log('Open knowledge mapper'),
        },
      },
    ],
    design: [
      {
        id: 'design-welcome',
        title: 'Design Your Study! 💡',
        description:
          'Transform your research ideas into a structured methodology. Define your questions, hypotheses, and approach.',
        tips: [
          'Keep research questions focused and specific',
          'Ensure your methodology aligns with your questions',
          'Consider ethical implications early',
        ],
      },
      {
        id: 'design-questions',
        title: 'Formulate Research Questions',
        description:
          'Use our guided wizard to create SMART research questions that are testable with Q-methodology.',
        action: {
          label: 'Start Question Wizard',
          onClick: () => console.log('Open question wizard'),
        },
      },
      {
        id: 'design-methodology',
        title: 'Select Your Methodology',
        description:
          'Choose between different Q-methodology approaches and configure your study parameters.',
        tips: [
          'Consider your participant pool when choosing methods',
          'Think about online vs. in-person data collection',
          'Plan for data analysis from the beginning',
        ],
      },
    ],
    build: [
      {
        id: 'build-welcome',
        title: 'Build Your Study! 🛠️',
        description:
          'Create all the materials needed for your Q-study: statements, grid, questionnaires, and instructions.',
        tips: [
          'Aim for 40-80 diverse statements',
          'Test your materials with colleagues first',
          'Keep instructions clear and concise',
        ],
      },
      {
        id: 'build-statements',
        title: 'Generate Q-Statements',
        description:
          'Use AI assistance or manual input to create statements that capture the full range of viewpoints.',
        action: {
          label: 'Open Statement Generator',
          onClick: () => console.log('Open statement generator'),
        },
        videoUrl: '/videos/statement-generation.mp4',
      },
      {
        id: 'build-grid',
        title: 'Design Your Q-Sort Grid',
        description:
          'Configure the sorting grid with the right distribution for your study.',
        tips: [
          'Most studies use quasi-normal distributions',
          'Consider cognitive load when setting grid size',
          'Allow for neutral/ambivalent positions',
        ],
      },
      {
        id: 'build-questionnaires',
        title: 'Add Questionnaires',
        description:
          'Create pre-screening, demographic, and post-sort questionnaires to enrich your data.',
        action: {
          label: 'Questionnaire Builder',
          onClick: () => console.log('Open questionnaire builder'),
        },
      },
    ],
    recruit: [
      {
        id: 'recruit-welcome',
        title: 'Recruit Participants! 👥',
        description:
          'Find and invite the right participants for your study. Quality over quantity in Q-methodology!',
        tips: [
          'Aim for diversity of viewpoints, not statistical representation',
          '20-40 participants is usually sufficient',
          'Screen for relevant experience or knowledge',
        ],
      },
      {
        id: 'recruit-pool',
        title: 'Build Your Participant Pool',
        description:
          'Import contacts, create sign-up forms, or use our participant marketplace.',
        action: {
          label: 'Manage Participants',
          onClick: () => console.log('Open participant manager'),
        },
      },
      {
        id: 'recruit-invite',
        title: 'Send Invitations',
        description:
          'Customize and send invitation emails with personalized study links.',
        tips: [
          'Explain the study purpose clearly',
          'Mention estimated completion time',
          'Include compensation details if applicable',
        ],
      },
    ],
    collect: [
      {
        id: 'collect-welcome',
        title: 'Collect Data! 📊',
        description:
          'Launch your study and monitor participant responses in real-time.',
        tips: [
          'Send reminders to increase response rates',
          'Monitor for technical issues',
          'Be available to answer participant questions',
        ],
      },
      {
        id: 'collect-launch',
        title: 'Launch Your Study',
        description: 'Make your study live and accessible to participants.',
        action: {
          label: 'Go Live',
          onClick: () => console.log('Launch study'),
        },
      },
      {
        id: 'collect-monitor',
        title: 'Monitor Progress',
        description:
          'Track completion rates, response quality, and participant feedback.',
        tips: [
          'Check for incomplete responses',
          'Look for patterns in completion times',
          'Address participant issues quickly',
        ],
      },
    ],
    analyze: [
      {
        id: 'analyze-welcome',
        title: 'Analyze Your Data! 🔬',
        description:
          'Uncover patterns and extract factors from your Q-sort data.',
        tips: [
          'Start with PCA (Principal Component Analysis)',
          'Extract factors with eigenvalues > 1.0',
          'Rotate factors for better interpretation',
        ],
      },
      {
        id: 'analyze-extraction',
        title: 'Extract Factors',
        description:
          'Run factor analysis to identify distinct viewpoints in your data.',
        action: {
          label: 'Run Analysis',
          onClick: () => console.log('Run factor analysis'),
        },
        videoUrl: '/videos/factor-analysis.mp4',
      },
      {
        id: 'analyze-rotation',
        title: 'Rotate Factors',
        description: 'Apply rotation methods to clarify factor distinctions.',
        tips: [
          'Varimax is the most common rotation',
          'Consider theoretical reasons for manual rotation',
          'Look for simple structure',
        ],
      },
    ],
    visualize: [
      {
        id: 'visualize-welcome',
        title: 'Visualize Results! 📈',
        description:
          'Create compelling visualizations to communicate your findings.',
        tips: [
          'Factor arrays show idealized perspectives',
          'Use color coding consistently',
          'Keep visualizations simple and clear',
        ],
      },
      {
        id: 'visualize-arrays',
        title: 'Generate Factor Arrays',
        description: "Create visual representations of each factor's Q-sort.",
        action: {
          label: 'Create Visualizations',
          onClick: () => console.log('Open visualization tools'),
        },
      },
    ],
    interpret: [
      {
        id: 'interpret-welcome',
        title: 'Interpret Your Findings! 📝',
        description:
          'Extract meaning from your factors and write compelling narratives.',
        tips: [
          'Use distinguishing statements to characterize factors',
          'Look for consensus across factors',
          'Connect findings to your research questions',
        ],
      },
      {
        id: 'interpret-narratives',
        title: 'Write Factor Narratives',
        description:
          'Describe each factor as a coherent viewpoint or perspective.',
        action: {
          label: 'Start Writing',
          onClick: () => console.log('Open interpretation workspace'),
        },
      },
    ],
    report: [
      {
        id: 'report-welcome',
        title: 'Create Your Report! 📄',
        description:
          'Document your research journey and findings in a professional report.',
        tips: [
          'Follow academic writing standards',
          'Include all necessary sections',
          'Cite sources properly',
        ],
      },
      {
        id: 'report-generate',
        title: 'Generate Report Sections',
        description:
          'Use templates and AI assistance to create report content.',
        action: {
          label: 'Report Builder',
          onClick: () => console.log('Open report builder'),
        },
      },
    ],
    archive: [
      {
        id: 'archive-welcome',
        title: 'Archive Your Research! 🗄️',
        description:
          'Preserve your study data and materials for future reference and replication.',
        tips: [
          'Include all raw data and analysis files',
          'Document your methodology thoroughly',
          'Consider getting a DOI for your dataset',
        ],
      },
      {
        id: 'archive-package',
        title: 'Create Archive Package',
        description: 'Bundle all study materials into a replication package.',
        action: {
          label: 'Prepare Archive',
          onClick: () => console.log('Create archive package'),
        },
      },
    ],
  };

  const steps = phaseOnboarding[phase] || [];

  // Check if user has seen this phase's onboarding
  useEffect(() => {
    const storageKey = `onboarding_${phase}_${userId}`;
    const hasSeen = localStorage.getItem(storageKey);

    if (!hasSeen && steps.length > 0) {
      setIsVisible(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, [phase, userId]);

  const handleStepComplete = () => {
    const currentStepId = steps[currentStep]?.id;
    if (currentStepId) {
      setCompletedSteps(prev => [...prev, currentStepId]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Fire confetti for celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    });

    // Mark as seen
    const storageKey = `onboarding_${phase}_${userId}`;
    localStorage.setItem(storageKey, 'true');

    setIsVisible(false);
    setHasSeenOnboarding(true);
    onComplete?.();
  };

  const handleSkip = () => {
    // Mark as seen even when skipped
    const storageKey = `onboarding_${phase}_${userId}`;
    localStorage.setItem(storageKey, 'true');

    setIsVisible(false);
    setHasSeenOnboarding(true);
    onSkip?.();
  };

  const restartOnboarding = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsVisible(true);
  };

  // Show restart button if already seen
  if (hasSeenOnboarding && !isVisible) {
    return (
      <button
        onClick={restartOnboarding}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2',
          'text-sm text-indigo-600 hover:text-indigo-700',
          'bg-indigo-50 hover:bg-indigo-100 rounded-lg',
          'transition-colors',
          className
        )}
      >
        <PlayIcon className="w-4 h-4" />
        View Phase Tutorial
      </button>
    );
  }

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!currentStepData) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={cn(
            'w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden',
            className
          )}
        >
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header */}
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-600">
                    Phase Tutorial
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mt-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentStep
                      ? 'w-8 bg-indigo-600'
                      : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {currentStepData.description}
            </p>

            {/* Video preview */}
            {currentStepData.videoUrl && (
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <video
                  src={currentStepData.videoUrl}
                  poster={currentStepData.imageUrl}
                  controls
                  className="w-full h-full"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <PlayIcon className="w-16 h-16 text-white/80" />
                </div>
              </div>
            )}

            {/* Tips */}
            {currentStepData.tips && currentStepData.tips.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Pro Tips:
                    </h4>
                    <ul className="space-y-1">
                      {currentStepData.tips.map((tip, index) => (
                        <li
                          key={index}
                          className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                        >
                          <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action button */}
            {currentStepData.action && (
              <button
                onClick={() => {
                  currentStepData.action?.onClick();
                  handleStepComplete();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                {currentStepData.action.label}
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Skip tutorial
              </button>

              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-4 py-2 border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                )}

                <button
                  onClick={handleStepComplete}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Complete
                      <CheckCircleIconSolid className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
