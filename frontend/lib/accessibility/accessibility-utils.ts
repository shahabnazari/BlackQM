/**
 * Accessibility Utilities
 * Helper functions and constants for WCAG 2.1 compliance
 */

/**
 * Generate unique IDs for form elements
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within an element (useful for modals)
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * ARIA attributes builder
 */
export interface AriaAttributes {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  pressed?: boolean;
  checked?: boolean;
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  hidden?: boolean;
  live?: 'polite' | 'assertive' | 'off';
  role?: string;
}

export const buildAriaAttributes = (
  attrs: AriaAttributes
): Record<string, any> => {
  const result: Record<string, any> = {};

  if (attrs.label) result['aria-label'] = attrs.label;
  if (attrs.labelledBy) result['aria-labelledby'] = attrs.labelledBy;
  if (attrs.describedBy) result['aria-describedby'] = attrs.describedBy;
  if (attrs.required !== undefined) result['aria-required'] = attrs.required;
  if (attrs.invalid !== undefined) result['aria-invalid'] = attrs.invalid;
  if (attrs.disabled !== undefined) result['aria-disabled'] = attrs.disabled;
  if (attrs.expanded !== undefined) result['aria-expanded'] = attrs.expanded;
  if (attrs.pressed !== undefined) result['aria-pressed'] = attrs.pressed;
  if (attrs.checked !== undefined) result['aria-checked'] = attrs.checked;
  if (attrs.current !== undefined) result['aria-current'] = attrs.current;
  if (attrs.hidden !== undefined) result['aria-hidden'] = attrs.hidden;
  if (attrs.live) result['aria-live'] = attrs.live;
  if (attrs.role) result['role'] = attrs.role;

  return result;
};

/**
 * Get appropriate heading level based on context
 */
export const getHeadingLevel = (
  depth: number
): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' => {
  const level = Math.min(Math.max(1, depth), 6);
  return `h${level}` as any;
};

/**
 * Format text for screen readers (adds punctuation for better reading)
 */
export const formatForScreenReader = (text: string): string => {
  // Add periods after common abbreviations
  let formatted = text.replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr)\b/g, '$1.');

  // Add commas in numbers for better reading
  formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Expand common symbols
  formatted = formatted.replace(/&/g, ' and ');
  formatted = formatted.replace(/@/g, ' at ');
  formatted = formatted.replace(/#/g, ' number ');
  formatted = formatted.replace(/%/g, ' percent ');

  return formatted;
};

/**
 * Check color contrast ratio
 * Returns true if contrast meets WCAG AA standard (4.5:1 for normal text)
 */
export const meetsContrastRatio = (
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const rgb = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!rgb || !rgb[1] || !rgb[2] || !rgb[3]) return 0;

    const [r, g, b] = [
      parseInt(rgb[1], 16) / 255,
      parseInt(rgb[2], 16) / 255,
      parseInt(rgb[3], 16) / 255,
    ].map(val => {
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * (r || 0) + 0.7152 * (g || 0) + 0.0722 * (b || 0);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // WCAG AA: 4.5:1 for normal text, 3:1 for large text
  const requiredRatio = largeText ? 3 : 4.5;
  return contrast >= requiredRatio;
};

/**
 * Debounce function for reducing announcement frequency
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Keyboard navigation keys
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

/**
 * Check if keyboard navigation key
 */
export const isNavigationKey = (key: string): boolean => {
  return Object.values(KEYS).includes(key as any);
};

/**
 * Get text alternative for images
 */
export const getImageAltText = (
  src: string,
  context?: 'decorative' | 'informative' | 'functional',
  description?: string
): string => {
  if (context === 'decorative') return '';

  if (description) return description;

  // Extract filename without extension as fallback
  const filename = src.split('/').pop()?.split('.')[0] || '';
  return filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * WCAG timing adjustments
 */
export const TIMING = {
  // Minimum time for users to read alerts (WCAG 2.2.1)
  ALERT_DURATION: 5000,

  // Session timeout warning (WCAG 2.2.1)
  SESSION_WARNING: 120000, // 2 minutes before timeout

  // Auto-save interval
  AUTO_SAVE: 30000, // 30 seconds

  // Debounce for live regions
  LIVE_REGION_DEBOUNCE: 500,
} as const;

/**
 * Focus management utilities
 */
export const focus = {
  save: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  },

  restore: (element: HTMLElement | null): void => {
    if (element && element.focus) {
      element.focus();
    }
  },

  first: (container: HTMLElement): void => {
    const focusable = container.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  },

  last: (container: HTMLElement): void => {
    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const last = focusables[focusables.length - 1];
    last?.focus();
  },
};

/**
 * Live region priorities
 */
export const LIVE_REGION_PRIORITY = {
  POLITE: 'polite', // Wait for screen reader to finish
  ASSERTIVE: 'assertive', // Interrupt immediately
  OFF: 'off', // Don't announce
} as const;

/**
 * Role definitions for semantic HTML
 */
export const ROLES = {
  ALERT: 'alert',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  DIALOG: 'dialog',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  NAVIGATION: 'navigation',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  REGION: 'region',
  SEARCH: 'search',
  STATUS: 'status',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TOOLTIP: 'tooltip',
} as const;

export default {
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  announceToScreenReader,
  trapFocus,
  buildAriaAttributes,
  getHeadingLevel,
  formatForScreenReader,
  meetsContrastRatio,
  debounce,
  KEYS,
  isNavigationKey,
  getImageAltText,
  TIMING,
  focus,
  LIVE_REGION_PRIORITY,
  ROLES,
};
