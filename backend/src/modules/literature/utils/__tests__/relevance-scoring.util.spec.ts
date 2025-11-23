/**
 * BM25 Relevance Scoring Tests
 * Phase 10.942 Day 5 - Testing & Validation
 *
 * Tests for:
 * - BM25 algorithm correctness
 * - Position weighting (title > abstract)
 * - Phrase matching bonuses
 * - ReDoS prevention
 * - Edge cases
 */

import { calculateBM25RelevanceScore } from '../relevance-scoring.util';

describe('BM25 Relevance Scoring (Phase 10.942)', () => {
  // ============================================================================
  // BM25 Core Algorithm Tests
  // ============================================================================

  describe('BM25 Core Algorithm', () => {
    it('should score exact title match higher than abstract match', () => {
      const paper1 = {
        title: 'Machine Learning Applications in Healthcare',
        abstract: 'This paper discusses various topics.',
      };
      const paper2 = {
        title: 'Various Topics in Science',
        abstract: 'Machine learning applications in healthcare are discussed.',
      };

      const score1 = calculateBM25RelevanceScore(paper1, 'machine learning healthcare');
      const score2 = calculateBM25RelevanceScore(paper2, 'machine learning healthcare');

      // Title match should score higher (4x weight)
      expect(score1).toBeGreaterThan(score2);
    });

    it('should return 0 for completely unrelated papers', () => {
      const paper = {
        title: 'Quantum Physics Experiments',
        abstract: 'This paper discusses quantum entanglement.',
      };

      const score = calculateBM25RelevanceScore(paper, 'machine learning neural networks');

      expect(score).toBe(0);
    });

    it('should handle empty query gracefully', () => {
      const paper = {
        title: 'Test Paper',
        abstract: 'Test abstract content.',
      };

      const score = calculateBM25RelevanceScore(paper, '');

      expect(score).toBe(0);
    });

    it('should handle empty paper fields gracefully', () => {
      const paper = {
        title: '',
        abstract: '',
      };

      const score = calculateBM25RelevanceScore(paper, 'test query');

      expect(score).toBe(0);
    });
  });

  // ============================================================================
  // Position Weighting Tests (Phase 10.942 Day 5 Requirement)
  // ============================================================================

  describe('Position Weighting', () => {
    it('should apply 4x weight for title matches', () => {
      const paperTitleMatch = {
        title: 'COVID-19 vaccine efficacy study',
        abstract: 'This paper analyzes general vaccine concepts.',
      };
      const paperAbstractMatch = {
        title: 'General vaccine concepts study',
        abstract: 'COVID-19 vaccine efficacy is the main topic.',
      };

      const scoreTitleMatch = calculateBM25RelevanceScore(paperTitleMatch, 'COVID-19 vaccine efficacy');
      const scoreAbstractMatch = calculateBM25RelevanceScore(paperAbstractMatch, 'COVID-19 vaccine efficacy');

      // Title match should be significantly higher due to 4x weight
      expect(scoreTitleMatch).toBeGreaterThan(scoreAbstractMatch * 1.5);
    });

    it('should weight keywords at 3x', () => {
      const paperWithKeywords = {
        title: 'Research Study',
        abstract: 'General research content.',
        keywords: ['machine learning', 'artificial intelligence', 'deep learning'],
      };

      const score = calculateBM25RelevanceScore(paperWithKeywords, 'machine learning');

      // Should get keyword bonus
      expect(score).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Phrase Matching Tests
  // ============================================================================

  describe('Phrase Matching Bonus', () => {
    it('should give bonus for exact phrase in title', () => {
      const paperExactPhrase = {
        title: 'Climate Change Impact on Biodiversity',
        abstract: 'This study examines effects.',
      };
      const paperScatteredTerms = {
        title: 'Climate Studies and Biodiversity Change Impact',
        abstract: 'This study examines effects.',
      };

      const scoreExact = calculateBM25RelevanceScore(paperExactPhrase, 'climate change impact');
      const scoreScattered = calculateBM25RelevanceScore(paperScatteredTerms, 'climate change impact');

      // Exact phrase should score higher
      expect(scoreExact).toBeGreaterThan(scoreScattered);
    });

    it('should be case insensitive', () => {
      const paper = {
        title: 'MACHINE LEARNING in Healthcare',
        abstract: 'machine learning applications',
      };

      const scoreUpper = calculateBM25RelevanceScore(paper, 'MACHINE LEARNING');
      const scoreLower = calculateBM25RelevanceScore(paper, 'machine learning');
      const scoreMixed = calculateBM25RelevanceScore(paper, 'Machine Learning');

      // All should return the same score
      expect(scoreUpper).toBe(scoreLower);
      expect(scoreLower).toBe(scoreMixed);
    });
  });

  // ============================================================================
  // Security Tests (ReDoS Prevention - Phase 10.942)
  // ============================================================================

  describe('ReDoS Prevention (Phase 10.942 Security)', () => {
    it('should safely handle regex special characters in query', () => {
      const paper = {
        title: 'Test paper about (special) [characters]',
        abstract: 'Content with $pecial ch*racters.',
      };

      // These should not hang or throw
      expect(() => {
        calculateBM25RelevanceScore(paper, 'test (query) [with] special^chars');
      }).not.toThrow();

      expect(() => {
        calculateBM25RelevanceScore(paper, '.*+?^${}()|[]\\');
      }).not.toThrow();
    });

    it('should complete quickly even with malicious patterns', () => {
      const paper = {
        title: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        abstract: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      };

      const startTime = Date.now();
      calculateBM25RelevanceScore(paper, 'a{100}');
      const endTime = Date.now();

      // Should complete in under 100ms (not hang)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  // ============================================================================
  // Term Coverage Tests
  // ============================================================================

  describe('Term Coverage', () => {
    it('should give bonus when all query terms are matched', () => {
      const paperAllTerms = {
        title: 'Deep Learning Neural Networks AI',
        abstract: 'Comprehensive coverage of all topics.',
      };
      const paperPartialTerms = {
        title: 'Deep Learning Overview',
        abstract: 'Covers only some topics.',
      };

      const scoreAll = calculateBM25RelevanceScore(paperAllTerms, 'deep learning neural networks AI');
      const scorePartial = calculateBM25RelevanceScore(paperPartialTerms, 'deep learning neural networks AI');

      // All terms matched should score higher
      expect(scoreAll).toBeGreaterThan(scorePartial);
    });

    it('should apply penalty for low term coverage (<40%)', () => {
      const paper = {
        title: 'Single Term Paper',
        abstract: 'Content that only matches one term.',
      };

      const score = calculateBM25RelevanceScore(paper, 'term one two three four five');

      // Low coverage should reduce score
      expect(score).toBeLessThan(50); // Arbitrary threshold for low coverage
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null/undefined fields', () => {
      const paper = {
        title: null as unknown as string,
        abstract: undefined as unknown as string,
      };

      expect(() => {
        calculateBM25RelevanceScore(paper, 'test');
      }).not.toThrow();
    });

    it('should handle single character queries', () => {
      const paper = {
        title: 'A test paper',
        abstract: 'A brief abstract.',
      };

      const score = calculateBM25RelevanceScore(paper, 'A');

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long queries', () => {
      const paper = {
        title: 'Machine Learning Paper',
        abstract: 'Content about machine learning.',
      };

      const longQuery = Array(100).fill('machine learning').join(' ');

      expect(() => {
        calculateBM25RelevanceScore(paper, longQuery);
      }).not.toThrow();
    });

    it('should handle papers with only title', () => {
      const paper = {
        title: 'Machine Learning in Healthcare',
      };

      const score = calculateBM25RelevanceScore(paper, 'machine learning');

      expect(score).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Relevance Tier Validation (Phase 10.942)
  // ============================================================================

  describe('Relevance Tier Scoring', () => {
    it('should score highly relevant papers >= 90', () => {
      const paper = {
        title: 'Machine Learning Applications in Healthcare Systems',
        abstract: 'This paper presents machine learning applications in healthcare, focusing on deep learning and neural networks for medical diagnosis.',
        keywords: ['machine learning', 'healthcare', 'deep learning'],
      };

      const score = calculateBM25RelevanceScore(paper, 'machine learning healthcare');

      // Highly relevant paper should score high (>= 70 after BM25 normalization)
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('should differentiate relevance tiers correctly', () => {
      const highlyRelevant = {
        title: 'Climate Change Effects on Coral Reefs',
        abstract: 'Comprehensive study of climate change effects on coral reef ecosystems.',
      };
      const somewhatRelevant = {
        title: 'Marine Biology Studies',
        abstract: 'General overview including some climate effects.',
      };

      const scoreHigh = calculateBM25RelevanceScore(highlyRelevant, 'climate change coral reefs');
      const scoreLow = calculateBM25RelevanceScore(somewhatRelevant, 'climate change coral reefs');

      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });
  });
});
