/**
 * Centralized Accessibility Configuration
 * ========================================
 * Single source of truth for WCAG 2.1 AA compliance settings.
 * Import this config to ensure consistent accessibility across all components.
 *
 * @module a11y-config
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

// =============================================================================
// WCAG 2.1 AA COMPLIANCE CONSTANTS
// =============================================================================

/**
 * Minimum font sizes per WCAG 1.4.4 (Resize Text)
 * All text must be at least 12px for readability
 */
export const FONT_SIZE = {
  /** Minimum readable font size (12px = 0.75rem) */
  MIN: 12,
  /** Tailwind class for minimum size */
  MIN_CLASS: 'text-xs',
  /** Small text (14px = 0.875rem) */
  SM: 14,
  /** Base text (16px = 1rem) */
  BASE: 16,
  /** Large text threshold for contrast (18px or 14px bold) */
  LARGE_TEXT_THRESHOLD: 18,
} as const;

/**
 * Color contrast ratios per WCAG 1.4.3 (Contrast Minimum)
 */
export const CONTRAST_RATIO = {
  /** Normal text contrast (AA) - 4.5:1 */
  NORMAL_TEXT_AA: 4.5,
  /** Large text contrast (AA) - 3:1 */
  LARGE_TEXT_AA: 3,
  /** UI components and graphics (AA) - 3:1 */
  UI_COMPONENTS_AA: 3,
  /** Normal text contrast (AAA) - 7:1 */
  NORMAL_TEXT_AAA: 7,
  /** Large text contrast (AAA) - 4.5:1 */
  LARGE_TEXT_AAA: 4.5,
} as const;

/**
 * Touch target sizes per WCAG 2.5.5 (Target Size)
 * Also aligns with Apple HIG (44pt) and Material Design (48dp)
 */
export const TOUCH_TARGET = {
  /** Minimum touch target size in pixels (Apple HIG) */
  MIN_SIZE: 44,
  /** Tailwind class for minimum size */
  MIN_CLASS: 'min-w-[44px] min-h-[44px]',
  /** Recommended touch target size */
  RECOMMENDED: 48,
  /** Minimum spacing between touch targets */
  MIN_SPACING: 8,
} as const;

/**
 * Focus indicator styles per WCAG 2.4.7 (Focus Visible)
 */
export const FOCUS_INDICATOR = {
  /** Focus ring width */
  WIDTH: '2px',
  /** Focus ring offset from element */
  OFFSET: '2px',
  /** Focus ring color (CSS variable) */
  COLOR: 'var(--color-primary, #6366f1)',
  /** Tailwind classes for focus styling */
  CLASSES: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
} as const;

/**
 * Timing constraints per WCAG 2.2.1 (Timing Adjustable)
 */
export const TIMING = {
  /** Minimum time for users to read content (ms) */
  MIN_READ_TIME: 5000,
  /** Maximum auto-play duration for media (ms) */
  MAX_AUTO_PLAY: 5000,
  /** Debounce delay for live region announcements (ms) */
  ANNOUNCEMENT_DELAY: 500,
  /** Tooltip auto-dismiss for touch (ms) */
  TOOLTIP_AUTO_DISMISS: 3000,
  /** Blur close delay to allow clicking content (ms) */
  BLUR_CLOSE_DELAY: 150,
} as const;

/**
 * Animation settings per WCAG 2.3.3 (Animation from Interactions)
 */
export const ANIMATION = {
  /** Respect user's reduced motion preference */
  RESPECT_REDUCED_MOTION: true,
  /** Minimum animation duration (ms) */
  MIN_DURATION: 150,
  /** Default transition duration (ms) */
  DEFAULT_DURATION: 200,
  /** Maximum flashes per second (WCAG 2.3.1) */
  MAX_FLASHES_PER_SECOND: 3,
  /** CSS for reduced motion */
  REDUCED_MOTION_CLASS: 'motion-reduce:transition-none motion-reduce:animate-none',
} as const;

/**
 * Keyboard navigation keys
 */
export const KEYBOARD = {
  /** Keys that activate interactive elements */
  ACTIVATION: ['Enter', ' '],
  /** Keys that dismiss/close elements */
  DISMISS: ['Escape'],
  /** Arrow keys for navigation */
  ARROWS: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  /** Keys for jumping to start/end */
  JUMP: ['Home', 'End', 'PageUp', 'PageDown'],
  /** All supported navigation keys */
  ALL: [
    'Enter', ' ', 'Escape', 'Tab',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown',
  ],
} as const;

/**
 * ARIA roles commonly used
 */
export const ARIA_ROLES = {
  // Landmark roles
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  REGION: 'region',

  // Widget roles
  BUTTON: 'button',
  LINK: 'link',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTBOX: 'textbox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERTDIALOG: 'alertdialog',
  TOOLTIP: 'tooltip',
  PROGRESSBAR: 'progressbar',
  SLIDER: 'slider',
  SWITCH: 'switch',

  // Document structure roles
  ARTICLE: 'article',
  HEADING: 'heading',
  LIST: 'list',
  LISTITEM: 'listitem',
  TABLE: 'table',
  ROW: 'row',
  CELL: 'cell',

  // Live region roles
  ALERT: 'alert',
  STATUS: 'status',
  LOG: 'log',
  TIMER: 'timer',
} as const;

/**
 * Live region politeness levels
 */
export const ARIA_LIVE = {
  /** Announce after current speech */
  POLITE: 'polite',
  /** Interrupt current speech immediately */
  ASSERTIVE: 'assertive',
  /** Do not announce (default) */
  OFF: 'off',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a font size meets WCAG minimum requirements
 */
export function isFontSizeAccessible(pxSize: number): boolean {
  return pxSize >= FONT_SIZE.MIN;
}

/**
 * Check if contrast ratio meets WCAG AA for normal text
 */
export function isContrastAccessible(ratio: number, isLargeText = false): boolean {
  const threshold = isLargeText ? CONTRAST_RATIO.LARGE_TEXT_AA : CONTRAST_RATIO.NORMAL_TEXT_AA;
  return ratio >= threshold;
}

/**
 * Check if touch target size meets minimum requirements
 */
export function isTouchTargetAccessible(width: number, height: number): boolean {
  return width >= TOUCH_TARGET.MIN_SIZE && height >= TOUCH_TARGET.MIN_SIZE;
}

/**
 * Get Tailwind classes for accessible interactive element
 */
export function getAccessibleInteractiveClasses(): string {
  return [
    TOUCH_TARGET.MIN_CLASS,
    FOCUS_INDICATOR.CLASSES,
    ANIMATION.REDUCED_MOTION_CLASS,
  ].join(' ');
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// =============================================================================
// TAILWIND UTILITY CLASSES (for reference)
// =============================================================================

/**
 * Tailwind classes that ensure WCAG compliance
 * Use these in components to maintain accessibility
 */
export const A11Y_CLASSES = {
  /** Minimum font size (12px) */
  minFontSize: 'text-xs',

  /** Focus visible indicator */
  focusVisible: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',

  /** Minimum touch target */
  touchTarget: 'min-w-[44px] min-h-[44px]',

  /** Reduced motion support */
  reducedMotion: 'motion-reduce:transition-none motion-reduce:animate-none',

  /** Screen reader only (visually hidden) */
  srOnly: 'sr-only',

  /** Not screen reader only (override sr-only) */
  notSrOnly: 'not-sr-only',

  /** Skip link for keyboard navigation */
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded',

  /** Disabled state (opacity + cursor + no events) */
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',

  /** High contrast border */
  highContrastBorder: 'border-2 border-current',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FontSize = typeof FONT_SIZE;
export type ContrastRatio = typeof CONTRAST_RATIO;
export type TouchTarget = typeof TOUCH_TARGET;
export type FocusIndicator = typeof FOCUS_INDICATOR;
export type Timing = typeof TIMING;
export type Animation = typeof ANIMATION;
export type Keyboard = typeof KEYBOARD;
export type AriaRoles = typeof ARIA_ROLES;
export type AriaLive = typeof ARIA_LIVE;
export type A11yClasses = typeof A11Y_CLASSES;
