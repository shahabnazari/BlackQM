/**
 * Accessibility Configuration Tests
 * Verifies WCAG 2.1 AA compliance constants and utilities
 */
import { describe, it, expect } from 'vitest';
import {
  FONT_SIZE,
  CONTRAST_RATIO,
  TOUCH_TARGET,
  FOCUS_INDICATOR,
  TIMING,
  ANIMATION,
  KEYBOARD,
  ARIA_ROLES,
  ARIA_LIVE,
  A11Y_CLASSES,
  isFontSizeAccessible,
  isContrastAccessible,
  isTouchTargetAccessible,
  getAccessibleInteractiveClasses,
  prefersReducedMotion,
  prefersHighContrast,
} from '../a11y-config';

describe('a11y-config', () => {
  describe('FONT_SIZE constants', () => {
    it('defines minimum font size as 12px', () => {
      expect(FONT_SIZE.MIN).toBe(12);
    });

    it('defines Tailwind class for minimum size', () => {
      expect(FONT_SIZE.MIN_CLASS).toBe('text-xs');
    });

    it('defines large text threshold as 18px', () => {
      expect(FONT_SIZE.LARGE_TEXT_THRESHOLD).toBe(18);
    });
  });

  describe('CONTRAST_RATIO constants', () => {
    it('defines AA normal text contrast as 4.5:1', () => {
      expect(CONTRAST_RATIO.NORMAL_TEXT_AA).toBe(4.5);
    });

    it('defines AA large text contrast as 3:1', () => {
      expect(CONTRAST_RATIO.LARGE_TEXT_AA).toBe(3);
    });

    it('defines AAA normal text contrast as 7:1', () => {
      expect(CONTRAST_RATIO.NORMAL_TEXT_AAA).toBe(7);
    });
  });

  describe('TOUCH_TARGET constants', () => {
    it('defines minimum touch target as 44px (Apple HIG)', () => {
      expect(TOUCH_TARGET.MIN_SIZE).toBe(44);
    });

    it('defines recommended touch target as 48px', () => {
      expect(TOUCH_TARGET.RECOMMENDED).toBe(48);
    });
  });

  describe('isFontSizeAccessible', () => {
    it('returns true for fonts >= 12px', () => {
      expect(isFontSizeAccessible(12)).toBe(true);
      expect(isFontSizeAccessible(14)).toBe(true);
      expect(isFontSizeAccessible(16)).toBe(true);
    });

    it('returns false for fonts < 12px', () => {
      expect(isFontSizeAccessible(11)).toBe(false);
      expect(isFontSizeAccessible(10)).toBe(false);
      expect(isFontSizeAccessible(9)).toBe(false);
    });
  });

  describe('isContrastAccessible', () => {
    it('returns true for normal text with ratio >= 4.5', () => {
      expect(isContrastAccessible(4.5)).toBe(true);
      expect(isContrastAccessible(7)).toBe(true);
    });

    it('returns false for normal text with ratio < 4.5', () => {
      expect(isContrastAccessible(4.4)).toBe(false);
      expect(isContrastAccessible(3)).toBe(false);
    });

    it('returns true for large text with ratio >= 3', () => {
      expect(isContrastAccessible(3, true)).toBe(true);
      expect(isContrastAccessible(4.5, true)).toBe(true);
    });

    it('returns false for large text with ratio < 3', () => {
      expect(isContrastAccessible(2.9, true)).toBe(false);
    });
  });

  describe('isTouchTargetAccessible', () => {
    it('returns true for touch targets >= 44x44px', () => {
      expect(isTouchTargetAccessible(44, 44)).toBe(true);
      expect(isTouchTargetAccessible(48, 48)).toBe(true);
      expect(isTouchTargetAccessible(100, 100)).toBe(true);
    });

    it('returns false for touch targets < 44px in either dimension', () => {
      expect(isTouchTargetAccessible(43, 44)).toBe(false);
      expect(isTouchTargetAccessible(44, 43)).toBe(false);
      expect(isTouchTargetAccessible(40, 40)).toBe(false);
    });
  });

  describe('getAccessibleInteractiveClasses', () => {
    it('returns combined accessibility classes', () => {
      const classes = getAccessibleInteractiveClasses();
      expect(classes).toContain('min-w-[44px]');
      expect(classes).toContain('min-h-[44px]');
      expect(classes).toContain('focus-visible');
      expect(classes).toContain('motion-reduce');
    });
  });

  describe('A11Y_CLASSES', () => {
    it('provides all required utility classes', () => {
      expect(A11Y_CLASSES.minFontSize).toBe('text-xs');
      expect(A11Y_CLASSES.touchTarget).toContain('44px');
      expect(A11Y_CLASSES.focusVisible).toContain('focus-visible');
      expect(A11Y_CLASSES.reducedMotion).toContain('motion-reduce');
      expect(A11Y_CLASSES.srOnly).toBe('sr-only');
      expect(A11Y_CLASSES.disabled).toContain('opacity-50');
    });
  });

  describe('TIMING constants', () => {
    it('defines minimum read time as 5 seconds', () => {
      expect(TIMING.MIN_READ_TIME).toBe(5000);
    });

    it('defines tooltip auto-dismiss as 3 seconds', () => {
      expect(TIMING.TOOLTIP_AUTO_DISMISS).toBe(3000);
    });
  });

  describe('ANIMATION constants', () => {
    it('respects reduced motion by default', () => {
      expect(ANIMATION.RESPECT_REDUCED_MOTION).toBe(true);
    });

    it('limits flashes to max 3 per second', () => {
      expect(ANIMATION.MAX_FLASHES_PER_SECOND).toBe(3);
    });
  });

  describe('KEYBOARD constants', () => {
    it('defines activation keys', () => {
      expect(KEYBOARD.ACTIVATION).toContain('Enter');
      expect(KEYBOARD.ACTIVATION).toContain(' ');
    });

    it('defines dismiss keys', () => {
      expect(KEYBOARD.DISMISS).toContain('Escape');
    });

    it('defines arrow keys', () => {
      expect(KEYBOARD.ARROWS).toContain('ArrowUp');
      expect(KEYBOARD.ARROWS).toContain('ArrowDown');
      expect(KEYBOARD.ARROWS).toContain('ArrowLeft');
      expect(KEYBOARD.ARROWS).toContain('ArrowRight');
    });
  });

  describe('ARIA_ROLES constants', () => {
    it('defines common widget roles', () => {
      expect(ARIA_ROLES.BUTTON).toBe('button');
      expect(ARIA_ROLES.DIALOG).toBe('dialog');
      expect(ARIA_ROLES.TOOLTIP).toBe('tooltip');
    });

    it('defines landmark roles', () => {
      expect(ARIA_ROLES.NAVIGATION).toBe('navigation');
      expect(ARIA_ROLES.MAIN).toBe('main');
      expect(ARIA_ROLES.SEARCH).toBe('search');
    });

    it('defines live region roles', () => {
      expect(ARIA_ROLES.ALERT).toBe('alert');
      expect(ARIA_ROLES.STATUS).toBe('status');
    });
  });

  describe('ARIA_LIVE constants', () => {
    it('defines all politeness levels', () => {
      expect(ARIA_LIVE.POLITE).toBe('polite');
      expect(ARIA_LIVE.ASSERTIVE).toBe('assertive');
      expect(ARIA_LIVE.OFF).toBe('off');
    });
  });

  describe('preference detection', () => {
    it('prefersReducedMotion returns boolean', () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });

    it('prefersHighContrast returns boolean', () => {
      const result = prefersHighContrast();
      expect(typeof result).toBe('boolean');
    });
  });
});
