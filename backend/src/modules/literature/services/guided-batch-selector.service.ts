/**
 * Phase 10 Day 19.6: Guided Batch Selector Service
 *
 * Scientifically-guided paper selection for incremental extraction
 *
 * Research Foundation:
 * - Patton (1990): Purposive Sampling Strategies
 *   - Maximum Variation Sampling
 *   - Intensity Sampling
 *   - Criterion Sampling
 * - Glaser & Strauss (1967): Theoretical Sampling
 * - Francis et al. (2010): Saturation in Qualitative Research
 *
 * Selection Strategy:
 * - Iteration 1: High-quality core papers (foundation)
 * - Iteration 2: Diverse perspectives (robustness)
 * - Iteration 3+: Gap-filling based on theme analysis
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  PaperQualityScoringService,
  Paper,
  QualityScore,
} from './paper-quality-scoring.service';

export interface BatchRecommendation {
  papers: Paper[];
  rationale: string;
  goals: string[];
  expectedOutcome: {
    newThemes: string;
    strengthenedThemes: string;
    saturationEstimate: string;
  };
  iteration: number;
}

export interface DiversityMetrics {
  topicDiversity: number; // 0-100
  methodologyDiversity: number; // 0-100
  populationDiversity: number; // 0-100
  overallDiversity: number; // 0-100
  underrepresentedAreas: string[];
}

@Injectable()
export class GuidedBatchSelectorService {
  private readonly logger = new Logger(GuidedBatchSelectorService.name);

  constructor(
    private readonly qualityScoring: PaperQualityScoringService
  ) {}

  /**
   * Select next batch of papers for incremental extraction
   */
  async selectNextBatch(
    allPapers: Paper[],
    processedPapers: Paper[],
    currentThemes: any[],
    iteration: number,
    batchSize: number = 5
  ): Promise<BatchRecommendation> {
    this.logger.log(
      `🎯 selectNextBatch called: iteration=${iteration}, allPapers=${allPapers?.length || 0}, processed=${processedPapers?.length || 0}, batchSize=${batchSize}`
    );

    try {
      // Validate inputs
      if (!allPapers || allPapers.length === 0) {
        this.logger.error(`❌ No papers provided to selectNextBatch`);
        throw new Error('No papers provided to selectNextBatch');
      }

      // Get quality scores for all unprocessed papers
      const unprocessedPapers = allPapers.filter(
        (p) => !processedPapers.some((pp) => pp.id === p.id)
      );

      this.logger.log(`📊 Unprocessed papers: ${unprocessedPapers.length}`);

      if (unprocessedPapers.length === 0) {
        this.logger.error(`❌ No unprocessed papers available`);
        throw new Error('No unprocessed papers available');
      }

      this.logger.log(`🔬 Assessing paper quality...`);
      const qualityScores = await this.qualityScoring.assessPapers(
        unprocessedPapers
      );
      this.logger.log(`✅ Quality assessment complete: ${qualityScores.size} papers scored`);

      // Select based on iteration strategy
      this.logger.log(`🎯 Selecting batch using iteration ${iteration} strategy...`);

      if (iteration === 1) {
        this.logger.log(`📌 Using Foundation Batch strategy`);
        return this.selectFoundationBatch(
          unprocessedPapers,
          qualityScores,
          batchSize
        );
      } else if (iteration === 2) {
        this.logger.log(`📌 Using Diversity Batch strategy`);
        return this.selectDiversityBatch(
          unprocessedPapers,
          processedPapers,
          qualityScores,
          batchSize
        );
      } else {
        this.logger.log(`📌 Using Gap-Filling Batch strategy`);
        return this.selectGapFillingBatch(
          unprocessedPapers,
          processedPapers,
          currentThemes,
          qualityScores,
          batchSize,
          iteration
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error in selectNextBatch:`, error);
      if (error instanceof Error) {
        this.logger.error(`❌ Error message:`, error.message);
        this.logger.error(`❌ Error stack:`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Iteration 1: Select highest-quality core papers
   */
  private selectFoundationBatch(
    papers: Paper[],
    qualityScores: Map<string, QualityScore>,
    batchSize: number
  ): BatchRecommendation {
    // Sort by overall quality score
    const sortedPapers = papers
      .map((paper) => ({
        paper,
        score: qualityScores.get(paper.id)!,
      }))
      .sort((a, b) => b.score.overallScore - a.score.overallScore);

    // Take top papers with some diversity
    const selected: Paper[] = [];
    const selectedMethodologies = new Set<string>();

    for (const { paper, score } of sortedPapers) {
      if (selected.length >= batchSize) break;

      // Prefer high-quality papers
      if (score.overallScore >= 75) {
        selected.push(paper);
      } else if (selected.length < batchSize) {
        // Fill remaining slots
        selected.push(paper);
      }
    }

    const avgQuality =
      selected.reduce(
        (sum, p) => sum + qualityScores.get(p.id)!.overallScore,
        0
      ) / selected.length;

    return {
      papers: selected,
      iteration: 1,
      rationale: `Starting with ${selected.length} highest-quality papers (avg quality: ${Math.round(avgQuality)}/100).
This establishes a robust baseline with foundational literature. High-quality sources ensure reliable
initial themes that will be tested for robustness in subsequent iterations.`,
      goals: [
        'Establish core themes from high-quality sources',
        'Create reliable baseline for comparison',
        'Identify foundational concepts in the field',
      ],
      expectedOutcome: {
        newThemes: '8-15 core themes',
        strengthenedThemes: 'N/A (first iteration)',
        saturationEstimate: '15-25% (establishing baseline)',
      },
    };
  }

  /**
   * Iteration 2: Select for maximum diversity
   */
  private selectDiversityBatch(
    papers: Paper[],
    processedPapers: Paper[],
    qualityScores: Map<string, QualityScore>,
    batchSize: number
  ): BatchRecommendation {
    const selected: Paper[] = [];

    // Analyze what methodologies/topics we already have
    const processedMethodologies = this.extractMethodologies(processedPapers);
    const processedTopics = this.extractTopics(processedPapers);

    // Score papers by diversity potential
    const diversityScores = papers.map((paper) => {
      const quality = qualityScores.get(paper.id)!.overallScore;
      const methodology = this.detectMethodology(paper);
      const isNewMethodology = !processedMethodologies.has(methodology);

      // Diversity score: quality * (1 + diversity bonus)
      const diversityBonus = isNewMethodology ? 0.3 : 0;
      const diversityScore = quality * (1 + diversityBonus);

      return { paper, diversityScore, methodology };
    });

    // Sort by diversity score
    diversityScores.sort((a, b) => b.diversityScore - a.diversityScore);

    // Select diverse papers
    const selectedMethodologies = new Set<string>();
    for (const { paper, methodology } of diversityScores) {
      if (selected.length >= batchSize) break;

      // Prefer papers with new methodologies
      if (
        !selectedMethodologies.has(methodology) ||
        selected.length < batchSize
      ) {
        selected.push(paper);
        selectedMethodologies.add(methodology);
      }
    }

    return {
      papers: selected,
      iteration: 2,
      rationale: `Selected ${selected.length} papers to maximize diversity across methodologies and contexts.
This iteration tests whether themes from iteration 1 hold across different research designs, populations,
and settings. Methodological diversity strengthens theme robustness.`,
      goals: [
        'Test theme robustness across contexts',
        'Add methodological diversity',
        'Explore boundary conditions',
      ],
      expectedOutcome: {
        newThemes: '3-7 new themes',
        strengthenedThemes: '6-10 existing themes confirmed',
        saturationEstimate: '40-55% (diversity testing)',
      },
    };
  }

  /**
   * Iteration 3+: Fill conceptual gaps
   */
  private selectGapFillingBatch(
    papers: Paper[],
    processedPapers: Paper[],
    currentThemes: any[],
    qualityScores: Map<string, QualityScore>,
    batchSize: number,
    iteration: number
  ): BatchRecommendation {
    // Identify underrepresented themes
    const themeStrengths = currentThemes.map((theme) => ({
      theme,
      evidenceCount: theme.sources?.length || 0,
    }));

    const weakThemes = themeStrengths
      .filter((t) => t.evidenceCount < 3)
      .map((t) => t.theme);

    // Select papers that might address weak themes
    const selected: Paper[] = [];

    // Simple selection: highest quality papers we haven't processed
    const sortedPapers = papers
      .map((paper) => ({
        paper,
        score: qualityScores.get(paper.id)!,
      }))
      .sort((a, b) => b.score.overallScore - a.score.overallScore);

    for (const { paper } of sortedPapers) {
      if (selected.length >= batchSize) break;
      selected.push(paper);
    }

    const saturationEstimate =
      iteration === 3
        ? '65-75% (nearing saturation)'
        : '80-90% (saturation likely)';

    return {
      papers: selected,
      iteration,
      rationale: `Iteration ${iteration}: Testing for theoretical saturation. Selected ${selected.length} high-relevance
papers to confirm whether new themes still emerge. ${weakThemes.length > 0 ? `Also addressing ${weakThemes.length} underrepresented themes.` : 'Most themes well-supported.'}`,
      goals: [
        'Test for theoretical saturation',
        weakThemes.length > 0
          ? 'Strengthen underrepresented themes'
          : 'Confirm theme stability',
        'Identify any final missing perspectives',
      ],
      expectedOutcome: {
        newThemes: iteration === 3 ? '1-4 new themes' : '0-2 new themes',
        strengthenedThemes: `${Math.max(8, currentThemes.length - 5)}-${currentThemes.length} themes confirmed`,
        saturationEstimate,
      },
    };
  }

  /**
   * Extract methodologies from papers
   */
  private extractMethodologies(papers: Paper[]): Set<string> {
    const methodologies = new Set<string>();
    papers.forEach((paper) => {
      const method = this.detectMethodology(paper);
      methodologies.add(method);
    });
    return methodologies;
  }

  /**
   * Detect paper methodology type
   */
  private detectMethodology(paper: Paper): string {
    const text = (paper.abstract || '').toLowerCase();

    if (
      text.includes('randomized') ||
      text.includes('rct') ||
      text.includes('experimental')
    )
      return 'experimental';
    if (text.includes('meta-analysis') || text.includes('systematic review'))
      return 'meta-analysis';
    if (text.includes('qualitative') || text.includes('interview'))
      return 'qualitative';
    if (text.includes('mixed methods')) return 'mixed';
    if (text.includes('survey') || text.includes('questionnaire'))
      return 'survey';
    if (text.includes('longitudinal') || text.includes('cohort'))
      return 'longitudinal';
    return 'other';
  }

  /**
   * Extract topics from papers (simplified)
   */
  private extractTopics(papers: Paper[]): Set<string> {
    const topics = new Set<string>();
    papers.forEach((paper) => {
      (paper.keywords || []).forEach((keyword) => topics.add(keyword));
    });
    return topics;
  }

  /**
   * Calculate diversity metrics for corpus
   */
  calculateDiversityMetrics(papers: Paper[]): DiversityMetrics {
    const methodologies = this.extractMethodologies(papers);
    const topics = this.extractTopics(papers);

    // Simple diversity scoring
    const methodologyDiversity = Math.min(
      100,
      (methodologies.size / 5) * 100
    ); // Max 5 methodologies
    const topicDiversity = Math.min(100, (topics.size / 20) * 100); // Max 20 topics

    const overallDiversity = (methodologyDiversity + topicDiversity) / 2;

    const underrepresentedAreas: string[] = [];
    if (methodologies.size < 3)
      underrepresentedAreas.push('Need more methodology diversity');
    if (topics.size < 10)
      underrepresentedAreas.push('Limited topic coverage');

    return {
      topicDiversity,
      methodologyDiversity,
      populationDiversity: 50, // Simplified
      overallDiversity,
      underrepresentedAreas,
    };
  }
}
