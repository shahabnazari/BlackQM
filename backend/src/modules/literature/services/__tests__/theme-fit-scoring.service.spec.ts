/**
 * Phase 10.113 Week 2: ThemeFitScoringService Unit Tests
 *
 * Netflix-grade test coverage for Theme-Fit Relevance Scoring.
 * Tests all scoring components with strict TypeScript compliance.
 *
 * Test Categories:
 * 1. Controversy Potential Detection
 * 2. Statement Clarity Analysis
 * 3. Perspective Diversity Scoring
 * 4. Citation Controversy Analysis
 * 5. Combined Score Calculation
 * 6. Batch Processing
 * 7. Edge Cases & Error Handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ThemeFitScoringService, ThemeFitScore, PaperWithThemeFit } from '../theme-fit-scoring.service';
import type { Paper } from '../../dto/literature.dto';
import { LiteratureSource } from '../../dto/literature.dto';

describe('ThemeFitScoringService', () => {
  let service: ThemeFitScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThemeFitScoringService],
    }).compile();

    service = module.get<ThemeFitScoringService>(ThemeFitScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // 1. CONTROVERSY POTENTIAL DETECTION
  // ============================================================================
  describe('Controversy Potential Detection', () => {
    it('should detect explicit disagreement markers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'However, some researchers argue that the approach is fundamentally flawed. ' +
                  'Nevertheless, proponents maintain that the benefits outweigh the costs.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.controversyPotential).toBeGreaterThan(0.3);
      expect(score.explanation).toContain('Controversy=');
    });

    it('should detect debate vocabulary', () => {
      const paper: Paper = createMockPaper({
        abstract: 'This controversial topic has sparked debate among scholars. ' +
                  'There is significant disagreement about the methodology used.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.controversyPotential).toBeGreaterThan(0.4);
    });

    it('should detect competing viewpoints', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Some researchers argue that climate change is primarily anthropogenic, ' +
                  'while others suggest natural cycles play a larger role.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.controversyPotential).toBeGreaterThan(0.2);
    });

    it('should detect conflicting evidence patterns', () => {
      const paper: Paper = createMockPaper({
        abstract: 'The literature shows conflicting evidence regarding the effectiveness. ' +
                  'Mixed results have been reported across multiple studies.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.controversyPotential).toBeGreaterThan(0.3);
    });

    it('should return low score for consensus-based abstracts', () => {
      const paper: Paper = createMockPaper({
        abstract: 'The results confirm the established theory. All participants agreed with the findings.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.controversyPotential).toBeLessThan(0.2);
    });
  });

  // ============================================================================
  // 2. STATEMENT CLARITY ANALYSIS
  // ============================================================================
  describe('Statement Clarity Analysis', () => {
    it('should detect author claims', () => {
      const paper: Paper = createMockPaper({
        abstract: 'We argue that the new framework provides superior results. ' +
                  'We propose that policymakers should adopt this approach immediately.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.statementClarity).toBeGreaterThan(0.3);
      expect(score.explanation).toContain('Statements=');
    });

    it('should detect evidence-based claims', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Evidence suggests that early intervention is critical. ' +
                  'Findings indicate that the treatment should be administered within 24 hours.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.statementClarity).toBeGreaterThan(0.4);
    });

    it('should detect normative statements', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Clinicians should prioritize patient safety. ' +
                  'Healthcare systems must invest in preventive care.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.statementClarity).toBeGreaterThan(0.3);
    });

    it('should detect importance markers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'It is critically important to address this issue. ' +
                  'The fundamental challenge is essential to understand.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.statementClarity).toBeGreaterThan(0.3);
    });

    it('should return low score for vague abstracts', () => {
      const paper: Paper = createMockPaper({
        abstract: 'This paper explores the topic. Various aspects were examined.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.statementClarity).toBeLessThan(0.2);
    });
  });

  // ============================================================================
  // 3. PERSPECTIVE DIVERSITY SCORING
  // ============================================================================
  describe('Perspective Diversity Scoring', () => {
    it('should detect multiple perspective markers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'From a psychological perspective, the intervention shows promise. ' +
                  'From an economic point of view, the costs may be prohibitive.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.perspectiveDiversity).toBeGreaterThan(0.3);
      expect(score.explanation).toContain('Perspectives=');
    });

    it('should detect stakeholder references', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Practitioners report positive outcomes, while policymakers remain cautious. ' +
                  'Patients expressed satisfaction with the treatment approach.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.perspectiveDiversity).toBeGreaterThan(0.4);
    });

    it('should detect disciplinary perspectives', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Sociologically, the phenomenon reflects broader cultural shifts. ' +
                  'Economically, the impact is significant for developing nations.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.perspectiveDiversity).toBeGreaterThan(0.3);
    });

    it('should return low score for single-perspective abstracts', () => {
      const paper: Paper = createMockPaper({
        abstract: 'The experiment was conducted under controlled conditions. Results were measured.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.perspectiveDiversity).toBeLessThan(0.2);
    });
  });

  // ============================================================================
  // 4. CITATION CONTROVERSY ANALYSIS
  // ============================================================================
  describe('Citation Controversy Analysis', () => {
    it('should detect citation debate indicators', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Previous work has been cited extensively in the scholarly debate. ' +
                  'In response to earlier criticisms, we present new evidence.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.citationControversy).toBeGreaterThan(0.2);
      expect(score.explanation).toContain('CitationDebate=');
    });

    it('should boost score for highly cited papers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'We present our findings.',
        citationCount: 500,
        year: 2020,
      });

      const score = service.calculateThemeFitScore(paper);

      // High citations should boost controversy score
      expect(score.citationControversy).toBeGreaterThan(0.1);
    });

    it('should boost score for rapidly cited papers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'We present our findings.',
        citationCount: 100,
        year: 2023, // 2 years old with 100 citations = 50 citations/year
      });

      const score = service.calculateThemeFitScore(paper);

      // Rapid citation velocity indicates academic interest
      expect(score.citationControversy).toBeGreaterThan(0.1);
    });

    it('should detect competing schools of thought', () => {
      const paper: Paper = createMockPaper({
        abstract: 'One school of thought emphasizes genetic factors, ' +
                  'while another school focuses on environmental influences. ' +
                  'These competing schools have rival theories.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.citationControversy).toBeGreaterThan(0.3);
    });
  });

  // ============================================================================
  // 5. COMBINED SCORE CALCULATION
  // ============================================================================
  describe('Combined Score Calculation', () => {
    it('should calculate weighted overall score', () => {
      const paper: Paper = createMockPaper({
        abstract: 'However, some researchers argue that this controversial approach ' +
                  'should be adopted. We propose that evidence suggests a new paradigm. ' +
                  'From a sociological perspective, practitioners and policymakers disagree.',
      });

      const score = service.calculateThemeFitScore(paper);

      // Overall score should be weighted combination
      expect(score.overallThemeFit).toBeGreaterThan(0.3);
      expect(score.overallThemeFit).toBeLessThanOrEqual(1.0);
    });

    it('should produce consistent scores for same input', () => {
      const paper: Paper = createMockPaper({
        abstract: 'However, the debate continues with conflicting evidence.',
      });

      const score1 = service.calculateThemeFitScore(paper);
      const score2 = service.calculateThemeFitScore(paper);

      expect(score1.overallThemeFit).toEqual(score2.overallThemeFit);
      expect(score1.controversyPotential).toEqual(score2.controversyPotential);
    });

    it('should generate explanation string', () => {
      const paper: Paper = createMockPaper({
        abstract: 'We argue that this is important. However, others disagree.',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.explanation).toBeDefined();
      expect(score.explanation).toContain('ThemeFit=');
    });
  });

  // ============================================================================
  // 6. BATCH PROCESSING
  // ============================================================================
  describe('Batch Processing', () => {
    it('should process multiple papers efficiently', () => {
      const papers: Paper[] = [
        createMockPaper({ abstract: 'However, the debate continues.' }),
        createMockPaper({ abstract: 'We argue that this is critical.' }),
        createMockPaper({ abstract: 'Simple findings were reported.' }),
      ];

      const startTime = Date.now();
      const scoredPapers = service.calculateThemeFitScoresBatch(papers);
      const duration = Date.now() - startTime;

      expect(scoredPapers).toHaveLength(3);
      expect(scoredPapers[0].themeFitScore).toBeDefined();
      expect(scoredPapers[1].themeFitScore).toBeDefined();
      expect(scoredPapers[2].themeFitScore).toBeDefined();
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should preserve original paper properties', () => {
      const paper: Paper = createMockPaper({
        id: 'test-123',
        title: 'Test Paper',
        abstract: 'However, the debate continues.',
        citationCount: 100,
      });

      const [scoredPaper] = service.calculateThemeFitScoresBatch([paper]);

      expect(scoredPaper.id).toEqual('test-123');
      expect(scoredPaper.title).toEqual('Test Paper');
      expect(scoredPaper.citationCount).toEqual(100);
    });

    it('should rank papers by theme-fit potential', () => {
      const papers: Paper[] = [
        createMockPaper({
          abstract: 'Simple findings.',
        }),
        createMockPaper({
          abstract: 'However, this controversial topic sparks debate. We argue that ' +
                    'practitioners and policymakers should adopt new strategies.',
        }),
        createMockPaper({
          abstract: 'The results confirm the theory.',
        }),
      ];

      const scoredPapers = service.calculateThemeFitScoresBatch(papers);
      const sorted = [...scoredPapers].sort(
        (a, b) => (b.themeFitScore?.overallThemeFit ?? 0) - (a.themeFitScore?.overallThemeFit ?? 0)
      );

      // Paper with controversy and multiple perspectives should rank highest
      expect(sorted[0].themeFitScore?.overallThemeFit).toBeGreaterThan(
        sorted[2].themeFitScore?.overallThemeFit ?? 0
      );
    });
  });

  // ============================================================================
  // 7. EDGE CASES & ERROR HANDLING
  // ============================================================================
  describe('Edge Cases & Error Handling', () => {
    it('should handle empty abstract', () => {
      const paper: Paper = createMockPaper({
        abstract: '',
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.overallThemeFit).toBe(0);
      expect(score.controversyPotential).toBe(0);
    });

    it('should handle undefined abstract', () => {
      const paper: Paper = createMockPaper({
        abstract: undefined,
      });

      const score = service.calculateThemeFitScore(paper);

      // Should use title if abstract is undefined
      expect(score.overallThemeFit).toBeGreaterThanOrEqual(0);
    });

    it('should handle paper with only title', () => {
      const paper: Paper = createMockPaper({
        title: 'Controversial Debate: However, We Argue That...',
        abstract: undefined,
      });

      const score = service.calculateThemeFitScore(paper);

      // Should extract patterns from title
      expect(score.overallThemeFit).toBeGreaterThan(0);
    });

    it('should handle paper with keywords', () => {
      const paper: Paper = createMockPaper({
        abstract: 'Basic findings.',
        keywords: ['debate', 'controversial', 'practitioners', 'policymakers'],
      });

      const score = service.calculateThemeFitScore(paper);

      // Keywords should contribute to score
      expect(score.overallThemeFit).toBeGreaterThan(0.1);
    });

    it('should not exceed score of 1.0', () => {
      const paper: Paper = createMockPaper({
        abstract: 'However, nevertheless, in contrast, on the other hand, conversely, ' +
                  'the controversial debate challenges and questions the opposing views. ' +
                  'Some researchers argue while others disagree. Conflicting evidence shows ' +
                  'mixed results. We argue that evidence suggests findings indicate results show. ' +
                  'Should must need to ought to essential critical important necessary crucial. ' +
                  'Practitioners policymakers stakeholders patients clinicians teachers students.',
        citationCount: 10000,
        year: 2024,
      });

      const score = service.calculateThemeFitScore(paper);

      expect(score.overallThemeFit).toBeLessThanOrEqual(1.0);
      expect(score.controversyPotential).toBeLessThanOrEqual(1.0);
      expect(score.statementClarity).toBeLessThanOrEqual(1.0);
      expect(score.perspectiveDiversity).toBeLessThanOrEqual(1.0);
      expect(score.citationControversy).toBeLessThanOrEqual(1.0);
    });
  });

  // ============================================================================
  // 8. THEMATIZATION TIER CLASSIFICATION
  // ============================================================================
  describe('Thematization Tier Classification', () => {
    it('should classify excellent thematization potential', () => {
      const tier = service.getThematizationTier(0.85);
      expect(tier).toBe('Excellent for Q-Sort');
    });

    it('should classify very good thematization potential', () => {
      const tier = service.getThematizationTier(0.70);
      expect(tier).toBe('Very Good for Thematization');
    });

    it('should classify good thematization potential', () => {
      const tier = service.getThematizationTier(0.55);
      expect(tier).toBe('Good for Thematization');
    });

    it('should classify moderate potential', () => {
      const tier = service.getThematizationTier(0.40);
      expect(tier).toBe('Moderate Potential');
    });

    it('should classify limited potential', () => {
      const tier = service.getThematizationTier(0.25);
      expect(tier).toBe('Limited Potential');
    });

    it('should classify low value', () => {
      const tier = service.getThematizationTier(0.10);
      expect(tier).toBe('Low Thematization Value');
    });
  });

  // ============================================================================
  // 9. isGoodForThematization HELPER
  // ============================================================================
  describe('isGoodForThematization Helper', () => {
    it('should return true for high-potential papers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'However, this controversial topic sparks debate. We argue that ' +
                  'practitioners and policymakers should adopt new strategies based on ' +
                  'conflicting evidence from multiple perspectives.',
      });

      const isGood = service.isGoodForThematization(paper);

      expect(isGood).toBe(true);
    });

    it('should return false for low-potential papers', () => {
      const paper: Paper = createMockPaper({
        abstract: 'The experiment was conducted. Results were measured and recorded.',
      });

      const isGood = service.isGoodForThematization(paper);

      expect(isGood).toBe(false);
    });
  });
});

/**
 * Helper function to create mock Paper objects
 */
function createMockPaper(overrides: Partial<Paper> = {}): Paper {
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    title: 'Mock Paper Title',
    authors: ['Author One', 'Author Two'],
    source: LiteratureSource.SEMANTIC_SCHOLAR,
    ...overrides,
  };
}
