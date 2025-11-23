/**
 * Unit Tests for Progress Constants
 * Phase 10.91 Day 11 - Enterprise-Grade Testing
 *
 * Tests formatCount utility function with comprehensive edge cases
 */

import { formatCount, SOURCE_DISPLAY_NAMES, SOURCE_DESCRIPTIONS, ANIMATION_DELAYS, ANIMATION_DURATIONS } from '../constants';

describe('formatCount', () => {
  describe('Million range (1M+)', () => {
    it('should format 1 million correctly', () => {
      expect(formatCount(1000000)).toBe('1.0M');
    });

    it('should format 1.2 million correctly', () => {
      expect(formatCount(1234567)).toBe('1.2M');
    });

    it('should format 10 million correctly', () => {
      expect(formatCount(10000000)).toBe('10.0M');
    });

    it('should format 999 million correctly', () => {
      expect(formatCount(999999999)).toBe('1000.0M');
    });
  });

  describe('Hundred thousand range (100K - 999K)', () => {
    it('should format 100K correctly (no decimal)', () => {
      expect(formatCount(100000)).toBe('100K');
    });

    it('should format 123K correctly (rounded)', () => {
      expect(formatCount(123456)).toBe('123K');
    });

    it('should format 999K correctly (rounded)', () => {
      expect(formatCount(999999)).toBe('1000K');
    });
  });

  describe('Ten thousand range (10K - 99K)', () => {
    it('should format 10K correctly', () => {
      expect(formatCount(10000)).toBe('10.0K');
    });

    it('should format 12.3K correctly', () => {
      expect(formatCount(12345)).toBe('12.3K');
    });

    it('should format 99.9K correctly', () => {
      expect(formatCount(99999)).toBe('100.0K');
    });
  });

  describe('Small numbers (< 10K)', () => {
    it('should format 0 with locale string', () => {
      expect(formatCount(0)).toBe('0');
    });

    it('should format 999 with no suffix', () => {
      expect(formatCount(999)).toBe('999');
    });

    it('should format 1,234 with comma', () => {
      expect(formatCount(1234)).toBe('1,234');
    });

    it('should format 9,999 with comma', () => {
      expect(formatCount(9999)).toBe('9,999');
    });
  });

  describe('Edge cases', () => {
    it('should handle negative numbers', () => {
      expect(formatCount(-1234567)).toBe('-1.2M');
    });

    it('should handle decimal numbers (floor)', () => {
      expect(formatCount(1234567.89)).toBe('1.2M');
    });

    it('should handle very large numbers', () => {
      expect(formatCount(1234567890)).toBe('1234.6M');
    });
  });
});

describe('SOURCE_DISPLAY_NAMES', () => {
  it('should contain all expected sources', () => {
    const expectedSources = [
      'pubmed', 'pmc', 'arxiv', 'semantic_scholar', 'crossref',
      'eric', 'core', 'springer', 'ssrn', 'google_scholar',
      'web_of_science', 'scopus', 'ieee_xplore', 'nature',
      'wiley', 'sage', 'taylor_francis'
    ];

    expectedSources.forEach(source => {
      expect(SOURCE_DISPLAY_NAMES[source]).toBeDefined();
      expect(typeof SOURCE_DISPLAY_NAMES[source]).toBe('string');
      expect(SOURCE_DISPLAY_NAMES[source].length).toBeGreaterThan(0);
    });
  });

  it('should have exactly 17 sources', () => {
    expect(Object.keys(SOURCE_DISPLAY_NAMES)).toHaveLength(17);
  });

  it('should have human-readable names', () => {
    expect(SOURCE_DISPLAY_NAMES.pubmed).toBe('PubMed');
    expect(SOURCE_DISPLAY_NAMES.semantic_scholar).toBe('Semantic Scholar');
    expect(SOURCE_DISPLAY_NAMES.web_of_science).toBe('Web of Science');
  });
});

describe('SOURCE_DESCRIPTIONS', () => {
  it('should contain descriptions for all sources', () => {
    const sourceKeys = Object.keys(SOURCE_DISPLAY_NAMES);
    sourceKeys.forEach(source => {
      expect(SOURCE_DESCRIPTIONS[source]).toBeDefined();
      expect(typeof SOURCE_DESCRIPTIONS[source]).toBe('string');
      expect(SOURCE_DESCRIPTIONS[source].length).toBeGreaterThan(0);
    });
  });

  it('should have exactly 17 descriptions', () => {
    expect(Object.keys(SOURCE_DESCRIPTIONS)).toHaveLength(17);
  });

  it('should include paper counts in descriptions', () => {
    expect(SOURCE_DESCRIPTIONS.pubmed).toContain('36M+');
    expect(SOURCE_DESCRIPTIONS.semantic_scholar).toContain('200M+');
    expect(SOURCE_DESCRIPTIONS.core).toContain('250M+');
  });
});

describe('ANIMATION_DELAYS', () => {
  it('should have all required delay constants', () => {
    expect(ANIMATION_DELAYS.BASE).toBe(0.4);
    expect(ANIMATION_DELAYS.STAGGER).toBe(0.05);
    expect(ANIMATION_DELAYS.COMPONENT_ENTRY).toBe(0.2);
    expect(ANIMATION_DELAYS.TRANSPARENCY_SUMMARY).toBe(0.3);
  });

  it('should be typed as readonly (TypeScript)', () => {
    // Note: 'as const' provides TypeScript immutability, not runtime immutability
    // This test verifies the constants exist and have the right type
    expect(typeof ANIMATION_DELAYS.BASE).toBe('number');
    expect(typeof ANIMATION_DELAYS.STAGGER).toBe('number');
    expect(typeof ANIMATION_DELAYS.COMPONENT_ENTRY).toBe('number');
    expect(typeof ANIMATION_DELAYS.TRANSPARENCY_SUMMARY).toBe('number');
  });

  it('should have sensible values (> 0 and < 2 seconds)', () => {
    Object.values(ANIMATION_DELAYS).forEach(delay => {
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThan(2);
    });
  });
});

describe('ANIMATION_DURATIONS', () => {
  it('should have all required duration constants', () => {
    expect(ANIMATION_DURATIONS.FAST).toBe(0.3);
    expect(ANIMATION_DURATIONS.STANDARD).toBe(0.5);
    expect(ANIMATION_DURATIONS.SLOW).toBe(0.8);
  });

  it('should be typed as readonly (TypeScript)', () => {
    // Note: 'as const' provides TypeScript immutability, not runtime immutability
    // This test verifies the constants exist and have the right type
    expect(typeof ANIMATION_DURATIONS.FAST).toBe('number');
    expect(typeof ANIMATION_DURATIONS.STANDARD).toBe('number');
    expect(typeof ANIMATION_DURATIONS.SLOW).toBe('number');
  });

  it('should have increasing durations (FAST < STANDARD < SLOW)', () => {
    expect(ANIMATION_DURATIONS.FAST).toBeLessThan(ANIMATION_DURATIONS.STANDARD);
    expect(ANIMATION_DURATIONS.STANDARD).toBeLessThan(ANIMATION_DURATIONS.SLOW);
  });
});
