/**
 * Word Count Utility Tests
 * Phase 10 Day 5.13+ - Academic Paper Eligibility
 * Phase 10.185: Netflix-Grade - Added Vitest imports for ESM compatibility
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWordCount,
  calculateAbstractWordCount,
  isPaperEligible,
  getWordCountCategory,
  formatWordCount,
  calculateReadingTime,
  formatReadingTime,
} from '../word-count.util';

describe('Word Count Utility', () => {
  describe('calculateWordCount', () => {
    it('should count words correctly in simple text', () => {
      const text = 'This is a simple test sentence';
      expect(calculateWordCount(text)).toBe(6);
    });

    it('should handle empty or null text', () => {
      expect(calculateWordCount('')).toBe(0);
      expect(calculateWordCount(null)).toBe(0);
      expect(calculateWordCount(undefined)).toBe(0);
    });

    it('should exclude references section (English)', () => {
      const text = `
        This is the main content of the paper with important findings.
        Our research demonstrates significant results across multiple domains.

        References
        Smith, J. (2020). Title of paper. Journal Name.
        Jones, A. (2021). Another paper. Conference Proceedings.
      `;
      // Phase 10.185: Fixed test - excludeNonContentSections=true (default) excludes refs
      // Pass true or omit parameter to exclude references
      const wordCount = calculateWordCount(text, true);
      // Should count only content before "References" (~14 words)
      expect(wordCount).toBeLessThan(20);
      expect(wordCount).toBeGreaterThan(10);
    });

    it('should exclude bibliography section', () => {
      const text = `
        Main content here with research findings.

        Bibliography
        Reference 1
        Reference 2
      `;
      // Phase 10.185: Fixed test - use default (true) to exclude bibliography
      const wordCount = calculateWordCount(text);
      // Should count only "Main content here with research findings." (~6 words)
      expect(wordCount).toBeLessThan(10);
    });

    it('should count all words when excludeNonContentSections is false', () => {
      const text = `
        Main content.

        References
        Many reference words here in the reference section.
      `;
      // Phase 10.185: Fixed test - corrected parameter semantics
      // excludeNonContentSections=true → excludes refs (fewer words)
      // excludeNonContentSections=false → includes refs (more words)
      const excludingRefs = calculateWordCount(text, true);
      const includingRefs = calculateWordCount(text, false);
      expect(includingRefs).toBeGreaterThan(excludingRefs);
    });

    it('should handle multiple whitespace correctly', () => {
      const text = '  Multiple    spaces   between    words  ';
      expect(calculateWordCount(text)).toBe(4);
    });

    it('should handle newlines and tabs', () => {
      const text = 'Line one\nLine two\tTab separated';
      expect(calculateWordCount(text)).toBe(6);
    });
  });

  describe('calculateAbstractWordCount', () => {
    it('should count abstract words', () => {
      const abstract = 'This is a test abstract';
      expect(calculateAbstractWordCount(abstract)).toBe(5);
    });

    it('should handle missing abstract', () => {
      expect(calculateAbstractWordCount(undefined)).toBe(0);
      expect(calculateAbstractWordCount(null)).toBe(0);
    });
  });

  describe('isPaperEligible', () => {
    it('should mark papers with >= 1000 words as eligible', () => {
      expect(isPaperEligible(1000)).toBe(true);
      expect(isPaperEligible(1500)).toBe(true);
      expect(isPaperEligible(5000)).toBe(true);
    });

    it('should mark papers with < 1000 words as ineligible', () => {
      expect(isPaperEligible(999)).toBe(false);
      expect(isPaperEligible(500)).toBe(false);
      expect(isPaperEligible(0)).toBe(false);
    });

    it('should support custom threshold', () => {
      expect(isPaperEligible(800, 500)).toBe(true);
      expect(isPaperEligible(400, 500)).toBe(false);
    });
  });

  describe('getWordCountCategory', () => {
    it('should categorize word counts correctly', () => {
      expect(getWordCountCategory(300)).toBe('Very Short');
      expect(getWordCountCategory(700)).toBe('Short');
      expect(getWordCountCategory(2000)).toBe('Medium');
      expect(getWordCountCategory(4000)).toBe('Standard');
      expect(getWordCountCategory(6000)).toBe('Long');
      expect(getWordCountCategory(10000)).toBe('Very Long');
    });
  });

  describe('formatWordCount', () => {
    it('should format word count without category', () => {
      expect(formatWordCount(1234)).toBe('1,234 words');
      expect(formatWordCount(1)).toBe('1 word');
    });

    it('should format word count with category', () => {
      const formatted = formatWordCount(3500, true);
      expect(formatted).toContain('3,500');
      expect(formatted).toContain('Standard');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      expect(calculateReadingTime(225)).toBe(1); // 1 minute at 225 wpm
      expect(calculateReadingTime(450)).toBe(2); // 2 minutes
      expect(calculateReadingTime(0)).toBe(0);
    });

    it('should round up partial minutes', () => {
      expect(calculateReadingTime(300)).toBe(2); // 1.33 minutes -> 2
    });
  });

  describe('formatReadingTime', () => {
    it('should format minutes correctly', () => {
      expect(formatReadingTime(0)).toBe('< 1 min read');
      expect(formatReadingTime(5)).toBe('5 min read');
      expect(formatReadingTime(45)).toBe('45 min read');
    });

    it('should format hours for long reads', () => {
      expect(formatReadingTime(90)).toBe('1.5 hrs read');
      expect(formatReadingTime(120)).toBe('2.0 hrs read');
    });
  });

  describe('Real-world paper abstracts', () => {
    it('should handle typical research paper abstract (200-300 words)', () => {
      const typicalAbstract = `
        Background: This study investigates the relationship between climate change
        and agricultural productivity in developing nations. Previous research has
        shown mixed results regarding the impact of temperature increases on crop yields.

        Methods: We conducted a meta-analysis of 45 peer-reviewed studies published
        between 2010 and 2023, covering data from over 30 countries across Africa,
        Asia, and Latin America. Statistical models were employed to assess correlations
        between temperature anomalies and yield variations.

        Results: Our findings indicate a significant negative correlation (p < 0.001)
        between rising temperatures and yields for major staple crops including rice,
        wheat, and maize. Each 1°C increase in average temperature corresponded to
        an estimated 7-12% decrease in productivity.

        Conclusions: Climate change poses a substantial threat to food security in
        vulnerable regions. Adaptive strategies including drought-resistant crop varieties
        and improved irrigation infrastructure are urgently needed to mitigate these impacts.
      `;

      const wordCount = calculateWordCount(typicalAbstract);
      expect(wordCount).toBeGreaterThan(100);
      expect(wordCount).toBeLessThan(200);
      expect(isPaperEligible(wordCount)).toBe(false); // Abstract alone too short
    });

    it('should exclude common reference markers', () => {
      const paperWithReferences = `
        Main research content discussing findings and methodology.
        Our analysis reveals important patterns in the data.

        Works Cited
        1. Author, A. (2020). Title. Journal.
        2. Author, B. (2021). Another Title. Conference.
        3. Author, C. (2019). Yet Another. Book Publisher.
      `;

      const wordCount = calculateWordCount(paperWithReferences);
      expect(wordCount).toBeLessThan(20); // Should exclude all references
    });
  });
});
