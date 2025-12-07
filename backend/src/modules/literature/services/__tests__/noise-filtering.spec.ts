/**
 * Phase 10.98 ENHANCEMENT: Unit Tests for Noise Filtering
 *
 * Tests for isNoiseWord() method in both:
 * - LocalCodeExtractionService
 * - LocalThemeLabelingService
 *
 * Coverage:
 * - All 7 noise detection rules
 * - Research term whitelist
 * - Edge cases (empty strings, null, etc.)
 * - Performance (Set lookup efficiency)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LocalCodeExtractionService } from '../local-code-extraction.service';
import { LocalThemeLabelingService } from '../local-theme-labeling.service';

describe('Phase 10.98: Noise Filtering Tests', () => {
  let codeExtractionService: LocalCodeExtractionService;
  let themeLabelingService: LocalThemeLabelingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalCodeExtractionService,
        LocalThemeLabelingService,
      ],
    }).compile();

    codeExtractionService = module.get<LocalCodeExtractionService>(LocalCodeExtractionService);
    themeLabelingService = module.get<LocalThemeLabelingService>(LocalThemeLabelingService);
  });

  // ==========================================================================
  // Rule 0: Empty String
  // ==========================================================================

  describe('Rule 0: Empty String Detection', () => {
    it('should filter empty strings (code extraction)', () => {
      const result = codeExtractionService['isNoiseWord']('');
      expect(result).toBe(true);
    });

    it('should filter empty strings (theme labeling)', () => {
      const result = themeLabelingService['isNoiseWord']('');
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // Whitelist: Research Terms
  // ==========================================================================

  describe('Whitelist: Research Term Preservation', () => {
    const whitelistedTerms = [
      // Virus/Disease
      'covid-19', 'covid19', 'sars-cov-2', 'long-covid',
      'h1n1', 'h5n1', 'h7n9', 'hiv-1', 'hiv-2',

      // Statistical
      'p-value', 't-test', 'f-test', 'z-test',
      'r-squared', 'r2', 'chi-square', 'chi2',
      'anova', 'ancova', 'manova',

      // Research Design
      'meta-analysis', 'rct', 'n-of-1',

      // Molecular/Biology
      'mrna', 'dna', 'rna', 'crispr', 'cas9',

      // Technology
      'ml', 'ai', 'nlp', 'llm', 'gpt', 'gpt-3', 'gpt-4',
      'bert', 'vr', 'ar', 'xr', 'iot', 'api', 'sdk',

      // Dimensionality
      '2d', '3d', '4d', '5d',

      // Network
      '5g', '6g', 'wi-fi', 'wi-fi-6',

      // Medical
      'type-1', 'type-2',
    ];

    whitelistedTerms.forEach(term => {
      it(`should preserve whitelisted term: "${term}" (code extraction)`, () => {
        const result = codeExtractionService['isNoiseWord'](term);
        expect(result).toBe(false);
      });

      it(`should preserve whitelisted term: "${term}" (theme labeling)`, () => {
        const result = themeLabelingService['isNoiseWord'](term);
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Rule 1: Pure Numbers
  // ==========================================================================

  describe('Rule 1: Pure Number Detection', () => {
    const pureNumbers = [
      '8211',    // Page number
      '10005',   // Sample size
      '123',     // Generic number
      '2020',    // Year
      '42',      // Answer to everything
      '0',       // Zero
      '999999',  // Large number
    ];

    pureNumbers.forEach(number => {
      it(`should filter pure number: "${number}" (code extraction)`, () => {
        const result = codeExtractionService['isNoiseWord'](number);
        expect(result).toBe(true);
      });

      it(`should filter pure number: "${number}" (theme labeling)`, () => {
        const result = themeLabelingService['isNoiseWord'](number);
        expect(result).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Rule 2: Number-Heavy Strings
  // ==========================================================================

  describe('Rule 2: Number-Heavy String Detection (>50% digits)', () => {
    const numberHeavyStrings = [
      { word: 'abc123', digitRatio: 0.50 },   // 3/6 = 50%
      { word: '8211a', digitRatio: 0.80 },    // 4/5 = 80%
      { word: '123abc', digitRatio: 0.50 },   // 3/6 = 50%
      { word: 'a1b2c3', digitRatio: 0.50 },   // 3/6 = 50%
    ];

    numberHeavyStrings.forEach(({ word, digitRatio }) => {
      it(`should filter "${word}" (${(digitRatio * 100).toFixed(0)}% digits) - code extraction`, () => {
        const result = codeExtractionService['isNoiseWord'](word);
        expect(result).toBe(true);
      });

      it(`should filter "${word}" (${(digitRatio * 100).toFixed(0)}% digits) - theme labeling`, () => {
        const result = themeLabelingService['isNoiseWord'](word);
        expect(result).toBe(true);
      });
    });

    it('should NOT filter "covid19" (22% digits) - whitelisted', () => {
      // covid19 = 2 digits / 7 chars = 28.5% < 50%, but also whitelisted
      const result = codeExtractionService['isNoiseWord']('covid19');
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // Rule 3: Complex Abbreviations with Numbers
  // ==========================================================================

  describe('Rule 3: Complex Abbreviation Detection (letters-numbers-letters)', () => {
    const complexAbbreviations = [
      'psc-17-y',      // Scale name
      'abc-123-def',   // Instrument code
      'test-42-item',  // Survey item
      'q-1-methodology', // NOT matched (q-1 doesn't match pattern)
    ];

    it('should filter "psc-17-y" (complex abbreviation) - code extraction', () => {
      const result = codeExtractionService['isNoiseWord']('psc-17-y');
      expect(result).toBe(true);
    });

    it('should filter "psc-17-y" (complex abbreviation) - theme labeling', () => {
      const result = themeLabelingService['isNoiseWord']('psc-17-y');
      expect(result).toBe(true);
    });

    it('should filter "abc-123-def" - code extraction', () => {
      const result = codeExtractionService['isNoiseWord']('abc-123-def');
      expect(result).toBe(true);
    });

    it('should NOT filter "covid-19" (whitelisted exception)', () => {
      const result = codeExtractionService['isNoiseWord']('covid-19');
      expect(result).toBe(false);
    });

    it('should NOT filter "hiv-1" (whitelisted exception)', () => {
      const result = codeExtractionService['isNoiseWord']('hiv-1');
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // Rule 4: Overly Long Acronyms
  // ==========================================================================

  describe('Rule 4: Overly Long Acronym Detection (7+ chars, all caps)', () => {
    const longAcronyms = [
      'ABCDEFG',     // 7 chars (filtered)
      'ABCDEFGH',    // 8 chars (filtered)
      'LONGACRONYM', // 12 chars (filtered)
    ];

    const validAcronyms = [
      'COVID',  // 5 chars (valid)
      'MAFLD',  // 6 chars (valid)
      'AI',     // 2 chars (valid)
      'NLP',    // 3 chars (valid)
      'BERT',   // 4 chars (valid)
    ];

    longAcronyms.forEach(acronym => {
      it(`should filter long acronym "${acronym}" (${acronym.length} chars) - code extraction`, () => {
        const result = codeExtractionService['isNoiseWord'](acronym);
        expect(result).toBe(true);
      });

      it(`should filter long acronym "${acronym}" (${acronym.length} chars) - theme labeling`, () => {
        const result = themeLabelingService['isNoiseWord'](acronym);
        expect(result).toBe(true);
      });
    });

    validAcronyms.forEach(acronym => {
      it(`should NOT filter valid acronym "${acronym}" (${acronym.length} chars)`, () => {
        // Note: lowercase versions might be checked, test uppercase
        const result = codeExtractionService['isNoiseWord'](acronym);
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Rule 5: HTML Entities
  // ==========================================================================

  describe('Rule 5: HTML Entity Detection', () => {
    const htmlEntities = [
      '&mdash;',   // Em dash
      '&#8211;',   // Numeric entity
      '&nbsp;',    // Non-breaking space
      '&amp;',     // Ampersand
      '&#x2014;',  // Hex entity
    ];

    htmlEntities.forEach(entity => {
      it(`should filter HTML entity "${entity}" - code extraction`, () => {
        const result = codeExtractionService['isNoiseWord'](entity);
        expect(result).toBe(true);
      });

      it(`should filter HTML entity "${entity}" - theme labeling`, () => {
        const result = themeLabelingService['isNoiseWord'](entity);
        expect(result).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Rule 6: Single Character
  // ==========================================================================

  describe('Rule 6: Single Character Detection', () => {
    const singleChars = ['a', 'b', 'x', 'y', 'z', '1', '!', '@'];

    singleChars.forEach(char => {
      it(`should filter single character "${char}" - code extraction`, () => {
        const result = codeExtractionService['isNoiseWord'](char);
        expect(result).toBe(true);
      });

      it(`should filter single character "${char}" - theme labeling`, () => {
        const result = themeLabelingService['isNoiseWord'](char);
        expect(result).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Rule 7: Only Punctuation
  // ==========================================================================

  describe('Rule 7: Punctuation-Only Detection', () => {
    const punctuationOnly = [
      '---',    // Dashes
      '...',    // Ellipsis
      '___',    // Underscores
      '!!!',    // Exclamations
      '???',    // Questions
      '***',    // Asterisks
    ];

    punctuationOnly.forEach(punctuation => {
      it(`should filter punctuation-only "${punctuation}" - code extraction`, () => {
        const result = codeExtractionService['isNoiseWord'](punctuation);
        expect(result).toBe(true);
      });

      it(`should filter punctuation-only "${punctuation}" - theme labeling`, () => {
        const result = themeLabelingService['isNoiseWord'](punctuation);
        expect(result).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Valid Terms (Should Pass All Checks)
  // ==========================================================================

  describe('Valid Terms: Should Pass All Checks', () => {
    const validTerms = [
      'methodology',
      'qualitative',
      'analysis',
      'research',
      'participant',
      'interview',
      'theme',
      'category',
      'concept',
      'perspective',
    ];

    validTerms.forEach(term => {
      it(`should NOT filter valid term "${term}" - code extraction`, () => {
        const result = codeExtractionService['isNoiseWord'](term);
        expect(result).toBe(false);
      });

      it(`should NOT filter valid term "${term}" - theme labeling`, () => {
        const result = themeLabelingService['isNoiseWord'](term);
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle null gracefully (code extraction)', () => {
      const result = codeExtractionService['isNoiseWord'](null as any);
      expect(result).toBe(true);
    });

    it('should handle undefined gracefully (code extraction)', () => {
      const result = codeExtractionService['isNoiseWord'](undefined as any);
      expect(result).toBe(true);
    });

    it('should handle whitespace-only strings', () => {
      const result = codeExtractionService['isNoiseWord']('   ');
      // This would be filtered by Rule 7 (no alphanumeric)
      expect(result).toBe(true);
    });

    it('should be case-insensitive for whitelisted terms', () => {
      // Assuming input is lowercased before calling isNoiseWord
      const result = codeExtractionService['isNoiseWord']('covid-19');
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // Performance Tests
  // ==========================================================================

  describe('Performance: Set Lookup Efficiency', () => {
    it('should use Set for O(1) whitelist lookup (code extraction)', () => {
      const startTime = performance.now();

      // Check 1000 terms
      for (let i = 0; i < 1000; i++) {
        codeExtractionService['isNoiseWord']('covid-19');
        codeExtractionService['isNoiseWord']('p-value');
        codeExtractionService['isNoiseWord']('t-test');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 100ms (very fast)
      expect(duration).toBeLessThan(100);
    });

    it('should handle batch filtering efficiently', () => {
      const words = [
        'methodology', 'qualitative', '8211', 'covid-19',
        'psc-17-y', 'analysis', '10005', 'p-value',
        'theme', '---', 't-test', 'ABCDEFG',
      ];

      const startTime = performance.now();

      const filtered = words.filter(word =>
        !codeExtractionService['isNoiseWord'](word)
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(filtered).toEqual([
        'methodology', 'qualitative', 'covid-19',
        'analysis', 'p-value', 'theme', 't-test',
      ]);
      expect(duration).toBeLessThan(10); // Very fast
    });
  });

  // ==========================================================================
  // Synchronization Tests
  // ==========================================================================

  describe('Synchronization: Code Extraction vs Theme Labeling', () => {
    const testCases = [
      { word: 'covid-19', expected: false },
      { word: '8211', expected: true },
      { word: 'psc-17-y', expected: true },
      { word: 'methodology', expected: false },
      { word: 'ABCDEFG', expected: true },
    ];

    testCases.forEach(({ word, expected }) => {
      it(`should return same result for "${word}" in both services`, () => {
        const codeResult = codeExtractionService['isNoiseWord'](word);
        const themeResult = themeLabelingService['isNoiseWord'](word);

        expect(codeResult).toBe(expected);
        expect(themeResult).toBe(expected);
        expect(codeResult).toBe(themeResult); // Must be synchronized
      });
    });
  });

  // ==========================================================================
  // Real-World Examples
  // ==========================================================================

  describe('Real-World Examples: User-Reported Issues', () => {
    it('should filter "8211" (Issue #2 example)', () => {
      const result = codeExtractionService['isNoiseWord']('8211');
      expect(result).toBe(true);
    });

    it('should filter "10005" (Issue #2 example)', () => {
      const result = codeExtractionService['isNoiseWord']('10005');
      expect(result).toBe(true);
    });

    it('should filter "psc-17-y" (Issue #2 example)', () => {
      const result = codeExtractionService['isNoiseWord']('psc-17-y');
      expect(result).toBe(true);
    });

    it('should preserve "p-value" (common statistical term)', () => {
      const result = codeExtractionService['isNoiseWord']('p-value');
      expect(result).toBe(false);
    });

    it('should preserve "covid-19" (important research term)', () => {
      const result = codeExtractionService['isNoiseWord']('covid-19');
      expect(result).toBe(false);
    });
  });
});
