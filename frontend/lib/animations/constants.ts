/**
 * Animation Constants
 * Enterprise-grade animation configuration for Phase 5
 */

// Timing constants (in milliseconds)
export const ANIMATION_TIMING = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  lazy: 1000,
  skeleton: 1500,
  shimmer: 2000,
} as const;

// Animation easings using cubic-bezier curves
export const ANIMATION_EASINGS = {
  // Apple's standard easing curves
  appleEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
  appleEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',
  appleEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
  appleEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Spring animations
  spring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  springBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Smooth animations
  smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
  smoothOut: 'cubic-bezier(0, 0, 0.58, 1)',
} as const;

// Spring physics configuration for framer-motion
export const SPRING_PHYSICS = {
  // Default spring
  default: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  
  // Soft spring (for gentle animations)
  soft: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
  
  // Stiff spring (for snappy animations)
  stiff: {
    type: 'spring',
    stiffness: 400,
    damping: 35,
  },
  
  // Bouncy spring (for playful animations)
  bouncy: {
    type: 'spring',
    stiffness: 500,
    damping: 15,
  },
  
  // Q-sort drag physics
  dragDrop: {
    type: 'spring',
    stiffness: 300,
    damping: 20, // 0.7 damping ratio
    mass: 1,
  },
} as const;

// Scale animation values
export const SCALE_VALUES = {
  pressed: 0.95,
  hover: 1.02,
  focus: 1.01,
  normal: 1,
  shrink: 0.98,
  grow: 1.05,
} as const;

// Magnetic hover configuration
export const MAGNETIC_CONFIG = {
  attractionRadius: 30, // pixels
  strength: 0.5,
  friction: 0.2,
  mass: 0.5,
} as const;

// Skeleton animation configuration
export const SKELETON_CONFIG = {
  shimmerDuration: 2,
  shimmerDelay: 0,
  shimmerGradient: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
  pulseOpacity: [0.5, 1, 0.5],
  pulseDuration: 1.5,
} as const;

// Celebration configuration
export const CELEBRATION_CONFIG = {
  confettiCount: 2000,
  confettiSpread: 80,
  confettiGravity: 0.45,
  confettiVelocity: 45,
  confettiColors: [
    '#007AFF', // System Blue
    '#34C759', // System Green
    '#FF3B30', // System Red
    '#FF9500', // System Orange
    '#AF52DE', // System Purple
    '#5856D6', // System Indigo
    '#FFCC00', // System Yellow
  ],
} as const;

// Loading messages for personality
export const LOADING_MESSAGES = [
  'Analyzing your Q-sorts...',
  'Calculating factor loadings...',
  'Discovering patterns in your data...',
  'Organizing participant responses...',
  'Building your visualizations...',
  'Crunching the numbers...',
  'Preparing statistical insights...',
  'Loading eigenvalues...',
  'Processing correlations...',
  'Extracting factors...',
  'Rotating factor matrix...',
  'Computing z-scores...',
  'Identifying consensus statements...',
  'Finding distinguishing statements...',
  'Mapping participant perspectives...',
  'Generating factor arrays...',
  'Creating your dashboard...',
  'Almost there...',
  'Finalizing your results...',
  'One moment please...',
] as const;

// Empty state messages
export const EMPTY_STATE_CONFIG = {
  noStudies: {
    title: 'No Studies Yet',
    message: 'Create your first Q-methodology study to get started.',
    action: 'Create Study',
  },
  noData: {
    title: 'No Data Available',
    message: 'Data will appear here once participants complete their sorts.',
    action: 'Invite Participants',
  },
  noParticipants: {
    title: 'No Participants Yet',
    message: 'Share your study link to start collecting responses.',
    action: 'Share Study',
  },
  sessionExpired: {
    title: 'Session Expired',
    message: 'Your session has expired. Please refresh to continue.',
    action: 'Refresh',
  },
  notFound: {
    title: 'Page Not Found',
    message: 'The page you\'re looking for doesn\'t exist.',
    action: 'Go Home',
  },
  error: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry',
  },
} as const;

// Animation variants for framer-motion
export const ANIMATION_VARIANTS = {
  // Fade animations
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  
  // Scale animations
  scaleIn: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  },
  
  // Slide animations
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
  
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
  
  slideLeft: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  
  slideRight: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  
  // Stagger children
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },
  
  staggerItem: {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
} as const;

// Performance optimization flags
export const PERFORMANCE_CONFIG = {
  enableGpuAcceleration: true,
  use60fps: true,
  reducedMotion: false, // Will be overridden by user preference
  enableWillChange: true,
  lazyLoadAnimations: true,
} as const;

// Accessibility configuration
export const A11Y_CONFIG = {
  respectPrefersReducedMotion: true,
  announceAnimations: false,
  keyboardNavigable: true,
  focusVisible: true,
} as const;

export type AnimationTiming = typeof ANIMATION_TIMING;
export type AnimationEasing = typeof ANIMATION_EASINGS;
export type SpringPhysics = typeof SPRING_PHYSICS;
export type ScaleValues = typeof SCALE_VALUES;