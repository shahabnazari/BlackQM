/**
 * Accessibility Module - Central Export
 * ======================================
 * Import from '@/lib/accessibility' to access all accessibility utilities
 *
 * @example
 * import { A11Y_CONFIG, FONT_SIZE, buildAriaAttributes } from '@/lib/accessibility';
 */

// =============================================================================
// Configuration & Constants (from a11y-config.ts)
// =============================================================================
export {
  // Font sizes
  FONT_SIZE,
  isFontSizeAccessible,

  // Contrast
  CONTRAST_RATIO,
  isContrastAccessible,

  // Touch targets
  TOUCH_TARGET,
  isTouchTargetAccessible,

  // Focus indicators
  FOCUS_INDICATOR,

  // Timing (WCAG timing constants)
  TIMING,

  // Animation
  ANIMATION,

  // Keyboard
  KEYBOARD,

  // ARIA
  ARIA_ROLES,
  ARIA_LIVE,

  // Tailwind classes
  A11Y_CLASSES,
  getAccessibleInteractiveClasses,

  // Preference detection
  prefersReducedMotion,
  prefersHighContrast,

  // Types
  type FontSize,
  type ContrastRatio,
  type TouchTarget,
  type FocusIndicator,
  type Timing,
  type Animation,
  type Keyboard,
  type AriaRoles,
  type AriaLive,
  type A11yClasses,
} from './a11y-config';

// =============================================================================
// Utilities (from accessibility-utils.ts)
// =============================================================================
export {
  // ID generation
  generateId,

  // ARIA attribute builder
  buildAriaAttributes,
  type AriaAttributes,

  // Screen reader utilities
  announceToScreenReader,
  formatForScreenReader,

  // Focus management
  trapFocus,
  focus,

  // Color contrast
  meetsContrastRatio,

  // Keyboard navigation
  KEYS,
  isNavigationKey,

  // Heading utilities
  getHeadingLevel,

  // Image utilities
  getImageAltText,

  // Debounce
  debounce,

  // Role definitions
  ROLES,

  // Live region priorities
  LIVE_REGION_PRIORITY,

  // Preference detection (also exported from a11y-config but these are the original)
  prefersDarkMode,
} from './accessibility-utils';
