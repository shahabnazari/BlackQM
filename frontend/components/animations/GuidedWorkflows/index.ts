/**
 * Guided Workflows Export
 * Central export file for all guided workflow and UX polish components
 */

// Guided Tour Components
export {
  GuidedTour,
  createTourStep,
  researcherOnboardingSteps,
  FeatureSpotlight,
  InteractiveHint,
  StepProgress,
} from './GuidedTour';

// Loading Personality Components
export {
  LoadingPersonality,
  PersonalitySkeletonLoader,
  TypingIndicator,
  useLoadingState,
  SmartTooltip,
} from './LoadingPersonality';

// Re-export types
export type { Step } from 'react-joyride';