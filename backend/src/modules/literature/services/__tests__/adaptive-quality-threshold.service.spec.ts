/**
 * Phase 10.155: AdaptiveQualityThresholdService Unit Tests
 *
 * Netflix-grade test coverage for adaptive field-based quality thresholds.
 * Tests field detection accuracy, threshold selection, and relaxation logic.
 *
 * Test Categories:
 * 1. Field Detection from Query
 * 2. Initial Threshold Selection
 * 3. Threshold Relaxation
 * 4. Edge Cases & Fallbacks
 */

import {
  AdaptiveQualityThresholdService,
  AcademicField,
  FieldDetectionResult,
} from '../adaptive-quality-threshold.service';

describe('AdaptiveQualityThresholdService', () => {
  let service: AdaptiveQualityThresholdService;

  beforeEach(() => {
    service = new AdaptiveQualityThresholdService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // 1. FIELD DETECTION FROM QUERY
  // ============================================================================
  describe('Field Detection', () => {
    describe('Biomedical Detection', () => {
      it('should detect biomedical field from medical keywords', () => {
        const result = service.detectField('cancer immunotherapy clinical trials');
        expect(result.field).toBe('biomedical');
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['cancer', 'clinical'])
        );
      });

      it('should detect biomedical from COVID-related queries', () => {
        const result = service.detectField('COVID-19 vaccine efficacy studies');
        expect(result.field).toBe('biomedical');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['covid', 'vaccine'])
        );
      });

      it('should detect biomedical from patient health queries', () => {
        const result = service.detectField('patient health outcomes in hospital settings');
        expect(result.field).toBe('biomedical');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['patient', 'health', 'hospital'])
        );
      });
    });

    describe('Physics Detection', () => {
      it('should detect physics from quantum mechanics queries', () => {
        // Use unambiguous physics query (not "computing algorithms" which overlaps with CS)
        const result = service.detectField('quantum mechanics particle entanglement');
        expect(result.field).toBe('physics');
        expect(result.matchedKeywords).toContain('quantum');
      });

      it('should detect physics from astrophysics queries', () => {
        const result = service.detectField('gravitational waves cosmology research');
        expect(result.field).toBe('physics');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['gravitational', 'cosmology'])
        );
      });

      it('should detect physics from particle physics queries', () => {
        const result = service.detectField('particle accelerator CERN experiments');
        expect(result.field).toBe('physics');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['particle', 'accelerator', 'cern'])
        );
      });
    });

    describe('Computer Science Detection', () => {
      it('should detect CS from machine learning queries', () => {
        const result = service.detectField('machine learning neural networks');
        expect(result.field).toBe('computer-science');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['machine learning', 'neural network'])
        );
      });

      it('should detect CS from AI/ML queries', () => {
        const result = service.detectField('deep learning transformer models NLP');
        expect(result.field).toBe('computer-science');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['deep learning', 'nlp'])
        );
      });

      it('should detect CS from blockchain queries', () => {
        const result = service.detectField('blockchain cryptocurrency security');
        expect(result.field).toBe('computer-science');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['blockchain', 'cryptocurrency'])
        );
      });
    });

    describe('Social Science Detection', () => {
      it('should detect social science from political queries', () => {
        // Use query with clear social science keywords
        const result = service.detectField('political behavior voting election democracy');
        expect(result.field).toBe('social-science');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['political', 'voting', 'behavior'])
        );
      });

      it('should detect social science from psychology queries', () => {
        const result = service.detectField('mental health psychology depression treatment');
        expect(result.field).toBe('social-science');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['mental health', 'psychology', 'depression'])
        );
      });

      it('should detect social science from policy queries', () => {
        const result = service.detectField('climate change policy economic impact');
        expect(result.field).toBe('social-science');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['policy', 'economic'])
        );
      });
    });

    describe('Humanities Detection', () => {
      it('should detect humanities from history queries', () => {
        const result = service.detectField('renaissance art history Florence');
        expect(result.field).toBe('humanities');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['renaissance', 'art', 'history'])
        );
      });

      it('should detect humanities from philosophy queries', () => {
        const result = service.detectField('ethics philosophy morality debate');
        expect(result.field).toBe('humanities');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['ethics', 'philosophy', 'morality'])
        );
      });

      it('should detect humanities from literature queries', () => {
        const result = service.detectField('postmodern literature narrative analysis');
        expect(result.field).toBe('humanities');
        expect(result.matchedKeywords).toEqual(
          expect.arrayContaining(['postmodern', 'literature', 'narrative'])
        );
      });
    });

    describe('Interdisciplinary Fallback', () => {
      it('should fallback to interdisciplinary for ambiguous queries', () => {
        const result = service.detectField('research methods analysis');
        expect(result.field).toBe('interdisciplinary');
        expect(result.confidence).toBe(0.5);
      });

      it('should fallback for very short queries', () => {
        const result = service.detectField('study');
        expect(result.field).toBe('interdisciplinary');
      });

      it('should fallback for mixed-field queries with low confidence', () => {
        // Query has one keyword from multiple fields
        const result = service.detectField('data trends analysis');
        expect(result.field).toBe('interdisciplinary');
      });
    });
  });

  // ============================================================================
  // 2. INITIAL THRESHOLD SELECTION
  // ============================================================================
  describe('Initial Threshold Selection', () => {
    it('should return 60 for biomedical field', () => {
      expect(service.getInitialThreshold('biomedical')).toBe(60);
    });

    it('should return 55 for physics field', () => {
      expect(service.getInitialThreshold('physics')).toBe(55);
    });

    it('should return 55 for computer-science field', () => {
      expect(service.getInitialThreshold('computer-science')).toBe(55);
    });

    it('should return 45 for social-science field', () => {
      expect(service.getInitialThreshold('social-science')).toBe(45);
    });

    it('should return 40 for humanities field', () => {
      expect(service.getInitialThreshold('humanities')).toBe(40);
    });

    it('should return 50 for interdisciplinary field', () => {
      expect(service.getInitialThreshold('interdisciplinary')).toBe(50);
    });

    it('should return correct threshold from query detection', () => {
      const recommendation = service.getThresholdRecommendation('cancer treatment clinical trials');
      expect(recommendation.threshold).toBe(60);
      expect(recommendation.field).toBe('biomedical');
      expect(recommendation.isRelaxed).toBe(false);
      expect(recommendation.iteration).toBe(1);
    });
  });

  // ============================================================================
  // 3. THRESHOLD RELAXATION
  // ============================================================================
  describe('Threshold Relaxation', () => {
    it('should relax from 60 to 50', () => {
      expect(service.getNextThreshold(60, 1)).toBe(50);
    });

    it('should relax from 50 to 40', () => {
      expect(service.getNextThreshold(50, 2)).toBe(40);
    });

    it('should relax from 40 to 35', () => {
      expect(service.getNextThreshold(40, 3)).toBe(35);
    });

    it('should relax from 35 to 30', () => {
      expect(service.getNextThreshold(35, 4)).toBe(30);
    });

    it('should return null when at minimum threshold', () => {
      expect(service.getNextThreshold(30, 5)).toBeNull();
    });

    it('should return null for values below minimum', () => {
      expect(service.getNextThreshold(25, 5)).toBeNull();
    });

    it('should correctly identify relaxation capability', () => {
      expect(service.canRelaxThreshold(60)).toBe(true);
      expect(service.canRelaxThreshold(40)).toBe(true);
      expect(service.canRelaxThreshold(30)).toBe(false);
      expect(service.canRelaxThreshold(25)).toBe(false);
    });

    it('should provide relaxation recommendation with context', () => {
      const recommendation = service.getNextThresholdRecommendation(
        60,
        'biomedical',
        1,
        82,
        300,
      );

      expect(recommendation).not.toBeNull();
      expect(recommendation!.threshold).toBe(50);
      expect(recommendation!.isRelaxed).toBe(true);
      expect(recommendation!.iteration).toBe(2);
      expect(recommendation!.rationale).toContain('82');
      expect(recommendation!.rationale).toContain('300');
    });

    it('should return null recommendation when cannot relax', () => {
      const recommendation = service.getNextThresholdRecommendation(
        30,
        'biomedical',
        4,
        250,
        300,
      );

      expect(recommendation).toBeNull();
    });
  });

  // ============================================================================
  // 4. EDGE CASES & FALLBACKS
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const result = service.detectField('');
      expect(result.field).toBe('interdisciplinary');
      expect(result.confidence).toBe(0.5);
    });

    it('should handle query with only special characters', () => {
      const result = service.detectField('!@#$%^&*()');
      expect(result.field).toBe('interdisciplinary');
    });

    it('should handle case-insensitive matching', () => {
      const result1 = service.detectField('MACHINE LEARNING');
      const result2 = service.detectField('machine learning');
      const result3 = service.detectField('Machine Learning');

      expect(result1.field).toBe('computer-science');
      expect(result2.field).toBe('computer-science');
      expect(result3.field).toBe('computer-science');
    });

    it('should handle multi-word keyword matching', () => {
      const result = service.detectField('natural language processing');
      expect(result.field).toBe('computer-science');
      expect(result.matchedKeywords).toContain('natural language processing');
    });

    it('should return minimum threshold correctly', () => {
      expect(service.getMinThreshold()).toBe(30);
    });

    it('should expose all field thresholds', () => {
      const thresholds = service.getAllFieldThresholds();
      expect(thresholds).toEqual({
        'biomedical': 60,
        'physics': 55,
        'computer-science': 55,
        'social-science': 45,
        'humanities': 40,
        'interdisciplinary': 50,
      });
    });

    it('should expose relaxation sequence', () => {
      const sequence = service.getRelaxationSequence();
      expect(sequence).toEqual([60, 50, 40, 35, 30]);
    });
  });

  // ============================================================================
  // 5. INTEGRATION SCENARIOS
  // ============================================================================
  describe('Integration Scenarios', () => {
    it('should handle realistic biomedical query workflow', () => {
      const query = 'cancer immunotherapy clinical trials patient outcomes';

      // Step 1: Initial detection
      const detection = service.detectField(query);
      expect(detection.field).toBe('biomedical');

      // Step 2: Get initial threshold
      const initial = service.getThresholdRecommendation(query);
      expect(initial.threshold).toBe(60);

      // Step 3: First relaxation
      const relaxed1 = service.getNextThresholdRecommendation(60, 'biomedical', 1, 82, 300);
      expect(relaxed1!.threshold).toBe(50);

      // Step 4: Second relaxation
      const relaxed2 = service.getNextThresholdRecommendation(50, 'biomedical', 2, 185, 300);
      expect(relaxed2!.threshold).toBe(40);

      // Step 5: Third relaxation
      const relaxed3 = service.getNextThresholdRecommendation(40, 'biomedical', 3, 250, 300);
      expect(relaxed3!.threshold).toBe(35);
    });

    it('should handle social science query with lower initial threshold', () => {
      const query = 'mental health depression psychology qualitative study';

      const detection = service.detectField(query);
      expect(detection.field).toBe('social-science');

      const initial = service.getThresholdRecommendation(query);
      expect(initial.threshold).toBe(45);

      // Social science starts at 45, next step is 40
      const relaxed = service.getNextThresholdRecommendation(45, 'social-science', 1, 150, 300);
      expect(relaxed!.threshold).toBe(40);
    });

    it('should handle humanities query with lowest initial threshold', () => {
      const query = 'renaissance art history cultural analysis';

      const detection = service.detectField(query);
      expect(detection.field).toBe('humanities');

      const initial = service.getThresholdRecommendation(query);
      expect(initial.threshold).toBe(40);

      // Humanities starts at 40, can still relax to 35
      const relaxed = service.getNextThresholdRecommendation(40, 'humanities', 1, 100, 300);
      expect(relaxed!.threshold).toBe(35);
    });
  });
});
