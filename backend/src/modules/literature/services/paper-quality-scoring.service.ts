/**
 * Phase 10 Day 19.6: Paper Quality Scoring Service
 *
 * Scientifically-backed paper quality assessment for guided incremental extraction
 *
 * Research Foundation:
 * - CASP (Critical Appraisal Skills Programme) quality criteria
 * - JBI (Joanna Briggs Institute) quality assessment tools
 * - Patton (1990): Purposive sampling strategies
 *
 * Scoring Dimensions:
 * 1. Methodology Quality (30%)
 * 2. Citation Impact (25%)
 * 3. Journal Impact (20%)
 * 4. Content Quality (15%)
 * 5. Full-text Availability (10%)
 */

import { Injectable, Logger } from '@nestjs/common';

export interface QualityScore {
  overallScore: number; // 0-100
  methodologyScore: number; // 0-100
  citationScore: number; // 0-100
  journalScore: number; // 0-100
  contentQualityScore: number; // 0-100
  fullTextBonus: number; // 0-10
  breakdown: {
    methodology: string;
    citations: string;
    journal: string;
    content: string;
    fullText: string;
  };
}

export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  fullText?: string;
  authors?: string[];
  year?: number;
  doi?: string;
  citationCount?: number;
  journal?: string;
  keywords?: string[];
  hasFullText: boolean;
  // Phase 10.6 Day 2: Enhanced PubMed metadata
  meshTerms?: Array<{ descriptor: string; qualifiers: string[] }>;
  publicationType?: string[];
  authorAffiliations?: Array<{ author: string; affiliation: string }>;
  grants?: Array<{ grantId: string | null; agency: string | null; country: string | null }>;
}

@Injectable()
export class PaperQualityScoringService {
  private readonly logger = new Logger(PaperQualityScoringService.name);

  /**
   * Assess paper quality across multiple dimensions
   */
  async assessPaperQuality(paper: Paper): Promise<QualityScore> {
    const methodologyScore = this.assessMethodology(paper);
    const citationScore = this.assessCitations(paper);
    const journalScore = this.assessJournal(paper);
    const contentQualityScore = this.assessContentQuality(paper);
    const fullTextBonus = paper.hasFullText ? 10 : 0;

    // Weighted overall score
    const overallScore =
      methodologyScore * 0.3 +
      citationScore * 0.25 +
      journalScore * 0.2 +
      contentQualityScore * 0.15 +
      fullTextBonus * 0.1;

    return {
      overallScore: Math.round(overallScore),
      methodologyScore,
      citationScore,
      journalScore,
      contentQualityScore,
      fullTextBonus,
      breakdown: {
        methodology: this.getMethodologyBreakdown(methodologyScore),
        citations: this.getCitationBreakdown(
          citationScore,
          paper.citationCount,
        ),
        journal: this.getJournalBreakdown(journalScore),
        content: this.getContentBreakdown(contentQualityScore),
        fullText: paper.hasFullText
          ? '✅ Full-text available (+10 points)'
          : '⚠️ Abstract only',
      },
    };
  }

  /**
   * Assess methodology quality based on keywords and abstract content
   * Phase 10.6 Day 2: Enhanced with publication type and MeSH term weighting
   */
  private assessMethodology(paper: Paper): number {
    const text =
      (paper.abstract || '') + ' ' + (paper.keywords || []).join(' ');
    const lowerText = text.toLowerCase();

    let score = 50; // Base score

    // Phase 10.6 Day 2: Publication Type Scoring (from PubMed metadata)
    if (paper.publicationType && paper.publicationType.length > 0) {
      const pubTypes = paper.publicationType.map(t => t.toLowerCase());

      // High-quality publication types (+30 points)
      const highQualityTypes = [
        'randomized controlled trial',
        'meta-analysis',
        'systematic review',
        'clinical trial',
      ];
      if (highQualityTypes.some(type => pubTypes.includes(type))) {
        score += 30;
      }

      // Medium-quality publication types (+15 points)
      const mediumQualityTypes = [
        'review',
        'comparative study',
        'multicenter study',
        'observational study',
      ];
      if (mediumQualityTypes.some(type => pubTypes.includes(type))) {
        score += 15;
      }
    } else {
      // Fallback to text-based detection if no publication type metadata
      // High-quality research designs (+30 points)
      const highQuality = [
        'randomized controlled trial',
        'rct',
        'meta-analysis',
        'systematic review',
        'longitudinal',
        'experimental',
      ];
      if (highQuality.some((term) => lowerText.includes(term))) {
        score += 30;
      }

      // Medium-quality designs (+15 points)
      const mediumQuality = [
        'quasi-experimental',
        'cohort study',
        'case-control',
        'cross-sectional',
        'mixed methods',
      ];
      if (mediumQuality.some((term) => lowerText.includes(term))) {
        score += 15;
      }
    }

    // Rigorous methodology indicators (+5 points each)
    const rigorIndicators = [
      'sample size',
      'power analysis',
      'control group',
      'blind',
      'validated',
      'reliability',
      'validity',
    ];
    const foundIndicators = rigorIndicators.filter((term) =>
      lowerText.includes(term),
    ).length;
    score += foundIndicators * 5;

    // Phase 10.6 Day 2: MeSH Terms Quality Bonus
    // Papers with MeSH terms are professionally indexed by NLM curators
    if (paper.meshTerms && paper.meshTerms.length > 0) {
      // +10 points for having MeSH terms (indicates thorough indexing)
      score += 10;

      // Additional bonus for comprehensive MeSH indexing
      if (paper.meshTerms.length >= 10) {
        score += 5; // Well-categorized papers have 10+ MeSH terms
      }
    }

    return Math.min(100, score);
  }

  /**
   * Assess citation impact (normalized by age)
   */
  private assessCitations(paper: Paper): number {
    if (!paper.citationCount || !paper.year) return 50;

    const currentYear = new Date().getFullYear();
    const paperAge = currentYear - paper.year;

    // Avoid division by zero for very recent papers
    const normalizedAge = Math.max(1, paperAge);

    // Citations per year
    const citationsPerYear = paper.citationCount / normalizedAge;

    // Scoring thresholds
    if (citationsPerYear >= 50) return 100; // Highly influential
    if (citationsPerYear >= 20) return 90;
    if (citationsPerYear >= 10) return 80;
    if (citationsPerYear >= 5) return 70;
    if (citationsPerYear >= 2) return 60;
    if (citationsPerYear >= 1) return 50;
    return 40; // Low impact
  }

  /**
   * Assess journal quality based on name recognition
   */
  private assessJournal(paper: Paper): number {
    if (!paper.journal) return 50;

    const journal = paper.journal.toLowerCase();

    // Top-tier journals (95-100)
    const topTier = [
      'nature',
      'science',
      'lancet',
      'jama',
      'nejm',
      'cell',
      'pnas',
    ];
    if (topTier.some((j) => journal.includes(j))) return 95;

    // High-impact specialized journals (80-90)
    const highImpact = [
      'psychological',
      'journal of',
      'american journal',
      'british journal',
      'research quarterly',
    ];
    if (highImpact.some((j) => journal.includes(j))) return 85;

    // Standard academic journals (60-75)
    if (journal.includes('journal') || journal.includes('review')) return 70;

    // Other sources (40-60)
    return 50;
  }

  /**
   * Assess content quality based on abstract completeness and structure
   */
  private assessContentQuality(paper: Paper): number {
    const abstract = paper.abstract || '';

    let score = 40; // Base score

    // Length indicators
    if (abstract.length > 2000)
      score += 20; // Comprehensive
    else if (abstract.length > 1000) score += 15;
    else if (abstract.length > 500) score += 10;
    else if (abstract.length > 200) score += 5;

    // Structured abstract indicators
    const structureWords = [
      'background',
      'methods',
      'results',
      'conclusion',
      'objective',
      'findings',
    ];
    const foundStructure = structureWords.filter((word) =>
      abstract.toLowerCase().includes(word),
    ).length;
    score += foundStructure * 5;

    // Completeness indicators
    if (paper.title && paper.title.length > 20) score += 5;
    if (paper.authors && paper.authors.length > 0) score += 5;
    if (paper.year) score += 5;
    if (paper.doi) score += 5;
    if (paper.keywords && paper.keywords.length > 0) score += 5;

    return Math.min(100, score);
  }

  /**
   * Generate human-readable methodology breakdown
   */
  private getMethodologyBreakdown(score: number): string {
    if (score >= 90)
      return '🟢 Excellent (RCT/Meta-analysis/Systematic review)';
    if (score >= 75) return '🟢 High-quality (Experimental/Longitudinal)';
    if (score >= 60) return '🟡 Medium-quality (Cross-sectional/Mixed)';
    return '🟠 Standard methodology';
  }

  /**
   * Generate citation breakdown
   */
  private getCitationBreakdown(score: number, count?: number): string {
    if (!count) return '⚪ No citation data';
    if (score >= 90) return `🟢 Highly influential (${count} citations)`;
    if (score >= 70) return `🟢 Well-cited (${count} citations)`;
    if (score >= 50) return `🟡 Moderately cited (${count} citations)`;
    return `🟠 Low citations (${count})`;
  }

  /**
   * Generate journal breakdown
   */
  private getJournalBreakdown(score: number): string {
    if (score >= 90) return '🟢 Top-tier journal';
    if (score >= 75) return '🟢 High-impact journal';
    if (score >= 60) return '🟡 Standard academic journal';
    return '⚪ Other source';
  }

  /**
   * Generate content breakdown
   */
  private getContentBreakdown(score: number): string {
    if (score >= 80) return '🟢 Comprehensive & well-structured';
    if (score >= 60) return '🟡 Complete abstract with metadata';
    return '🟠 Limited information';
  }

  /**
   * Batch assess multiple papers
   */
  async assessPapers(papers: Paper[]): Promise<Map<string, QualityScore>> {
    const scores = new Map<string, QualityScore>();

    for (const paper of papers) {
      const score = await this.assessPaperQuality(paper);
      scores.set(paper.id, score);
      this.logger.debug(
        `Quality scored: ${paper.title.substring(0, 50)}... = ${score.overallScore}/100`,
      );
    }

    return scores;
  }
}
