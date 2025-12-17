/**
 * Phase 10.170 Week 4+: Literature Synthesis Pipeline (Meta-ethnography)
 *
 * Enterprise-grade implementation of meta-ethnographic synthesis following
 * Noblit & Hare (1988) methodology for qualitative research synthesis.
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Reciprocal Translation: N-way theme comparisons across studies
 * - Line-of-Argument Synthesis: Building consensus themes
 * - Refutational Synthesis: Identifying contradictory findings
 *
 * KEY FEATURES:
 * - Proper 7-phase meta-ethnography implementation
 * - Theme translation with semantic similarity
 * - Contradiction detection and resolution
 * - Comprehensive quality metrics
 *
 * @module literature-synthesis-pipeline.service
 * @since Phase 10.170 Week 4+
 */

import { Injectable, Logger } from '@nestjs/common';
import { cosineSimilarity } from '../utils/vector-math.utils';
import {
  MetaEthnographyResult,
  ReciprocalTranslation,
  LineOfArgumentSynthesis,
  RefutationalSynthesis,
  SynthesizedTheme,
  SynthesisQualityMetrics,
  ThemeReference,
  ThemeMapping,
  ThemeMappingType,
  ConsensusTheme,
  EvidenceLink,
  Contradiction,
  ContradictionPosition,
  ContradictionType,
  ContradictionExplanation,
  validateSynthesisQualityMetrics,
} from '../types/specialized-pipeline.types';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Study with themes for synthesis
 */
export interface StudyWithThemes {
  readonly id: string;
  readonly title: string;
  readonly themes: readonly StudyTheme[];
  readonly methodology: string | null;
  readonly context: string | null;
  readonly year: number | null;
}

/**
 * Theme from a single study
 */
export interface StudyTheme {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly evidence: readonly string[];
}

/**
 * Embedding provider function
 */
export type EmbeddingProviderFn = (texts: readonly string[]) => Promise<readonly number[][]>;

/**
 * Synthesis configuration
 */
export interface SynthesisConfig {
  /** Similarity threshold for direct mapping (0-1) */
  readonly directMappingThreshold: number;
  /** Similarity threshold for analogous mapping (0-1) */
  readonly analogousMappingThreshold: number;
  /** Minimum studies for consensus theme */
  readonly minStudiesForConsensus: number;
  /** Contradiction severity threshold */
  readonly contradictionSeverityThreshold: number;
}

/**
 * Default synthesis configuration
 */
export const DEFAULT_SYNTHESIS_CONFIG: Readonly<SynthesisConfig> = {
  directMappingThreshold: 0.85,
  analogousMappingThreshold: 0.65,
  minStudiesForConsensus: 2,
  contradictionSeverityThreshold: 0.7,
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Quality thresholds for synthesis
 */
const QUALITY_THRESHOLDS = {
  /** Minimum coverage for acceptable synthesis */
  MIN_COVERAGE: 0.6,
  /** Minimum translation completeness */
  MIN_TRANSLATION_COMPLETENESS: 0.5,
  /** Target saturation level */
  TARGET_SATURATION: 0.8,
} as const;

/**
 * Contradiction keywords by type
 */
const CONTRADICTION_INDICATORS: Readonly<Record<ContradictionType, readonly string[]>> = {
  direct: ['however', 'contrary', 'opposite', 'disagree', 'refute', 'conflict'],
  methodological: ['different method', 'approach varied', 'measurement', 'design'],
  contextual: ['context-specific', 'cultural', 'setting', 'population'],
  temporal: ['over time', 'changed', 'evolved', 'historical'],
} as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class LiteratureSynthesisPipelineService {
  private readonly logger = new Logger(LiteratureSynthesisPipelineService.name);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Execute full meta-ethnographic synthesis
   *
   * Implements Noblit & Hare (1988) 7-phase approach:
   * 1. Getting started (done by caller)
   * 2. Deciding what is relevant (done by caller)
   * 3. Reading the studies (done by caller)
   * 4. Determining how studies are related (reciprocal translation)
   * 5. Translating studies into one another (theme mapping)
   * 6. Synthesizing translations (line-of-argument)
   * 7. Expressing the synthesis (final output)
   *
   * @param studies Studies with their themes to synthesize
   * @param embeddingFn Function to generate embeddings
   * @param config Synthesis configuration
   * @returns Complete meta-ethnography result
   */
  async synthesize(
    studies: readonly StudyWithThemes[],
    embeddingFn: EmbeddingProviderFn,
    config: Partial<SynthesisConfig> = {},
  ): Promise<MetaEthnographyResult> {
    const startTime = Date.now();

    // Merge with defaults
    const fullConfig: SynthesisConfig = {
      ...DEFAULT_SYNTHESIS_CONFIG,
      ...config,
    };

    this.logger.log(
      `Starting meta-ethnographic synthesis: ${studies.length} studies, ` +
        `${studies.reduce((acc, s) => acc + s.themes.length, 0)} total themes`,
    );

    // Phase 4 & 5: Reciprocal translation
    const reciprocalTranslations = await this.performReciprocalTranslation(
      studies,
      embeddingFn,
      fullConfig,
    );

    // Phase 6: Line-of-argument synthesis
    const lineOfArgument = this.performLineOfArgumentSynthesis(
      studies,
      reciprocalTranslations,
      fullConfig,
    );

    // Identify refutational synthesis
    const refutationalSynthesis = this.performRefutationalSynthesis(
      studies,
      reciprocalTranslations,
      fullConfig,
    );

    // Phase 7: Create synthesized themes
    const synthesizedThemes = this.createSynthesizedThemes(
      lineOfArgument,
      refutationalSynthesis,
      reciprocalTranslations,
    );

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(
      studies,
      reciprocalTranslations,
      lineOfArgument,
      refutationalSynthesis,
    );

    // Validate metrics
    try {
      validateSynthesisQualityMetrics(qualityMetrics);
    } catch (error) {
      this.logger.warn(`Quality metrics validation warning: ${error}`);
    }

    const result: MetaEthnographyResult = {
      reciprocalTranslations,
      lineOfArgument,
      refutationalSynthesis,
      synthesizedThemes,
      qualityMetrics,
      durationMs: Date.now() - startTime,
    };

    this.logger.log(
      `Meta-ethnographic synthesis complete: ${synthesizedThemes.length} themes, ` +
        `quality=${(qualityMetrics.overallQuality * 100).toFixed(1)}%, ` +
        `duration=${result.durationMs}ms`,
    );

    return result;
  }

  /**
   * Translate themes between two studies
   *
   * @param sourceStudy Source study
   * @param targetStudy Target study
   * @param embeddingFn Embedding function
   * @param config Synthesis configuration
   * @returns Reciprocal translation
   */
  async translateStudies(
    sourceStudy: StudyWithThemes,
    targetStudy: StudyWithThemes,
    embeddingFn: EmbeddingProviderFn,
    config: SynthesisConfig = DEFAULT_SYNTHESIS_CONFIG,
  ): Promise<ReciprocalTranslation> {
    // Generate embeddings for all themes
    const sourceTexts = sourceStudy.themes.map((t) => `${t.label}: ${t.description}`);
    const targetTexts = targetStudy.themes.map((t) => `${t.label}: ${t.description}`);

    const allEmbeddings = await embeddingFn([...sourceTexts, ...targetTexts]);
    const sourceEmbeddings = allEmbeddings.slice(0, sourceTexts.length);
    const targetEmbeddings = allEmbeddings.slice(sourceTexts.length);

    // Create theme references
    const sourceRefs: ThemeReference[] = sourceStudy.themes.map((t) => ({
      studyId: sourceStudy.id,
      themeId: t.id,
      label: t.label,
      description: t.description,
    }));

    const targetRefs: ThemeReference[] = targetStudy.themes.map((t) => ({
      studyId: targetStudy.id,
      themeId: t.id,
      label: t.label,
      description: t.description,
    }));

    // Calculate mappings
    const mappings = this.calculateThemeMappings(
      sourceRefs,
      targetRefs,
      sourceEmbeddings,
      targetEmbeddings,
      sourceStudy.themes,
      targetStudy.themes,
      config,
    );

    // Check if translation is reciprocal (bidirectional)
    const isReciprocal = this.checkReciprocity(mappings);

    // Calculate overall confidence
    const confidence =
      mappings.length > 0
        ? mappings.reduce((acc, m) => acc + m.similarity, 0) / mappings.length
        : 0;

    return {
      id: `trans_${sourceStudy.id}_${targetStudy.id}`,
      sourceThemes: sourceRefs,
      targetThemes: targetRefs,
      mappings,
      confidence,
      isReciprocal,
    };
  }

  // ============================================================================
  // PRIVATE: RECIPROCAL TRANSLATION
  // ============================================================================

  /**
   * Perform reciprocal translation across all studies
   */
  private async performReciprocalTranslation(
    studies: readonly StudyWithThemes[],
    embeddingFn: EmbeddingProviderFn,
    config: SynthesisConfig,
  ): Promise<readonly ReciprocalTranslation[]> {
    const translations: ReciprocalTranslation[] = [];

    // Pairwise comparison of all studies
    for (let i = 0; i < studies.length; i++) {
      for (let j = i + 1; j < studies.length; j++) {
        const translation = await this.translateStudies(
          studies[i],
          studies[j],
          embeddingFn,
          config,
        );
        translations.push(translation);

        // Also create reverse translation for completeness
        const reverseTranslation = await this.translateStudies(
          studies[j],
          studies[i],
          embeddingFn,
          config,
        );
        translations.push(reverseTranslation);
      }
    }

    return translations;
  }

  /**
   * Calculate theme mappings between two sets of themes
   */
  private calculateThemeMappings(
    sourceRefs: readonly ThemeReference[],
    targetRefs: readonly ThemeReference[],
    sourceEmbeddings: readonly number[][],
    targetEmbeddings: readonly number[][],
    sourceThemes: readonly StudyTheme[],
    targetThemes: readonly StudyTheme[],
    config: SynthesisConfig,
  ): ThemeMapping[] {
    const mappings: ThemeMapping[] = [];

    for (let i = 0; i < sourceRefs.length; i++) {
      for (let j = 0; j < targetRefs.length; j++) {
        const similarity = this.calculateSimilarity(sourceEmbeddings[i], targetEmbeddings[j]);

        // Determine mapping type based on similarity
        const mappingType = this.determineMappingType(
          similarity,
          sourceThemes[i],
          targetThemes[j],
          config,
        );

        // Only include meaningful mappings
        if (mappingType !== null) {
          mappings.push({
            source: sourceRefs[i],
            target: targetRefs[j],
            mappingType,
            similarity,
            evidence: this.extractMappingEvidence(sourceThemes[i], targetThemes[j]),
          });
        }
      }
    }

    // Sort by similarity descending
    return mappings.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Determine mapping type based on similarity and content
   */
  private determineMappingType(
    similarity: number,
    sourceTheme: StudyTheme,
    targetTheme: StudyTheme,
    config: SynthesisConfig,
  ): ThemeMappingType | null {
    // Check for contradiction indicators
    if (this.hasContradictionIndicators(sourceTheme, targetTheme)) {
      return 'refutational';
    }

    // Direct match
    if (similarity >= config.directMappingThreshold) {
      return 'direct';
    }

    // Analogous match
    if (similarity >= config.analogousMappingThreshold) {
      return 'analogous';
    }

    // Partial match
    if (similarity >= 0.4) {
      return 'partial';
    }

    // Below threshold - no meaningful mapping
    return null;
  }

  /**
   * Check if two themes have contradiction indicators
   */
  private hasContradictionIndicators(
    themeA: StudyTheme,
    themeB: StudyTheme,
  ): boolean {
    const textA = `${themeA.label} ${themeA.description}`.toLowerCase();
    const textB = `${themeB.label} ${themeB.description}`.toLowerCase();

    // Check for direct contradiction keywords in both
    for (const indicator of CONTRADICTION_INDICATORS.direct) {
      if (textA.includes(indicator) || textB.includes(indicator)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract evidence supporting a mapping
   */
  private extractMappingEvidence(
    sourceTheme: StudyTheme,
    targetTheme: StudyTheme,
  ): readonly string[] {
    const evidence: string[] = [];

    // Use first evidence from each theme
    if (sourceTheme.evidence.length > 0) {
      evidence.push(`Source: ${sourceTheme.evidence[0]}`);
    }
    if (targetTheme.evidence.length > 0) {
      evidence.push(`Target: ${targetTheme.evidence[0]}`);
    }

    return evidence;
  }

  /**
   * Check if translation is reciprocal (bidirectional agreement)
   */
  private checkReciprocity(mappings: readonly ThemeMapping[]): boolean {
    if (mappings.length < 2) {
      return false;
    }

    // Check if at least some mappings have reverse counterparts
    const sourceToTarget = new Map<string, string>();
    for (const mapping of mappings) {
      const key = `${mapping.source.themeId}`;
      if (!sourceToTarget.has(key)) {
        sourceToTarget.set(key, mapping.target.themeId);
      }
    }

    // Count reciprocal pairs
    let reciprocalCount = 0;
    for (const [sourceId, targetId] of sourceToTarget.entries()) {
      // Check if there's a reverse mapping
      const hasReverse = mappings.some(
        (m) => m.source.themeId === targetId && m.target.themeId === sourceId,
      );
      if (hasReverse) {
        reciprocalCount++;
      }
    }

    // Reciprocal if at least 50% of mappings have reverse
    return reciprocalCount / sourceToTarget.size >= 0.5;
  }

  // ============================================================================
  // PRIVATE: LINE-OF-ARGUMENT SYNTHESIS
  // ============================================================================

  /**
   * Perform line-of-argument synthesis
   */
  private performLineOfArgumentSynthesis(
    studies: readonly StudyWithThemes[],
    translations: readonly ReciprocalTranslation[],
    config: SynthesisConfig,
  ): LineOfArgumentSynthesis {
    // Identify consensus themes from translations
    const consensusThemes = this.identifyConsensusThemes(studies, translations, config);

    // Build evidence chain
    const evidenceChain = this.buildEvidenceChain(consensusThemes, translations);

    // Generate central argument
    const centralArgument = this.generateCentralArgument(consensusThemes);

    // Identify contributing studies
    const contributingStudyIds = this.getContributingStudyIds(consensusThemes, studies);

    // Calculate argument strength
    const strength = this.calculateArgumentStrength(consensusThemes, studies.length);

    return {
      centralArgument,
      supportingThemes: consensusThemes,
      strength,
      contributingStudyIds,
      evidenceChain,
    };
  }

  /**
   * Identify consensus themes across studies
   */
  private identifyConsensusThemes(
    studies: readonly StudyWithThemes[],
    translations: readonly ReciprocalTranslation[],
    config: SynthesisConfig,
  ): ConsensusTheme[] {
    // Group mappings by target theme to find recurring concepts
    const themeOccurrences = new Map<string, {
      label: string;
      description: string;
      studyIds: Set<string>;
      translationIds: Set<string>;
      totalSimilarity: number;
      count: number;
    }>();

    for (const translation of translations) {
      for (const mapping of translation.mappings) {
        if (mapping.mappingType === 'direct' || mapping.mappingType === 'analogous') {
          const key = mapping.target.label.toLowerCase();

          if (!themeOccurrences.has(key)) {
            themeOccurrences.set(key, {
              label: mapping.target.label,
              description: mapping.target.description,
              studyIds: new Set(),
              translationIds: new Set(),
              totalSimilarity: 0,
              count: 0,
            });
          }

          const occurrence = themeOccurrences.get(key)!;
          occurrence.studyIds.add(mapping.source.studyId);
          occurrence.studyIds.add(mapping.target.studyId);
          occurrence.translationIds.add(translation.id);
          occurrence.totalSimilarity += mapping.similarity;
          occurrence.count++;
        }
      }
    }

    // Filter to themes appearing in multiple studies
    const consensusThemes: ConsensusTheme[] = [];

    for (const [, occurrence] of themeOccurrences) {
      if (occurrence.studyIds.size >= config.minStudiesForConsensus) {
        const consensusStrength = occurrence.totalSimilarity / occurrence.count;

        consensusThemes.push({
          id: `consensus_${consensusThemes.length + 1}`,
          label: occurrence.label,
          description: occurrence.description,
          supportingStudyCount: occurrence.studyIds.size,
          consensusStrength,
          translationIds: Array.from(occurrence.translationIds),
        });
      }
    }

    // Sort by supporting study count descending
    return consensusThemes.sort((a, b) => b.supportingStudyCount - a.supportingStudyCount);
  }

  /**
   * Build evidence chain connecting themes
   */
  private buildEvidenceChain(
    consensusThemes: readonly ConsensusTheme[],
    translations: readonly ReciprocalTranslation[],
  ): EvidenceLink[] {
    const links: EvidenceLink[] = [];

    // Connect themes based on translation relationships
    for (let i = 0; i < consensusThemes.length; i++) {
      for (let j = i + 1; j < consensusThemes.length; j++) {
        const themeA = consensusThemes[i];
        const themeB = consensusThemes[j];

        // Check if themes share translations
        const sharedTranslations = themeA.translationIds.filter((t) =>
          themeB.translationIds.includes(t),
        );

        if (sharedTranslations.length > 0) {
          // Calculate connection strength
          const strength = sharedTranslations.length / Math.max(
            themeA.translationIds.length,
            themeB.translationIds.length,
          );

          links.push({
            from: themeA.id,
            to: themeB.id,
            linkType: 'supports',
            strength,
          });
        }
      }
    }

    return links;
  }

  /**
   * Generate central argument from consensus themes
   */
  private generateCentralArgument(themes: readonly ConsensusTheme[]): string {
    if (themes.length === 0) {
      return 'No central argument could be synthesized from the studies.';
    }

    // Use top themes to construct argument
    const topThemes = themes.slice(0, 3);
    const themeLabels = topThemes.map((t) => t.label).join(', ');

    return `The synthesized evidence suggests that ${themeLabels} are central concepts ` +
      `supported across ${topThemes[0]?.supportingStudyCount || 0} or more studies.`;
  }

  /**
   * Get IDs of studies contributing to consensus themes
   */
  private getContributingStudyIds(
    themes: readonly ConsensusTheme[],
    studies: readonly StudyWithThemes[],
  ): readonly string[] {
    const contributingIds = new Set<string>();

    // Get all study IDs from translations referenced by consensus themes
    for (const theme of themes) {
      // For simplicity, add all studies that have themes similar to this consensus theme
      for (const study of studies) {
        for (const studyTheme of study.themes) {
          if (studyTheme.label.toLowerCase().includes(theme.label.toLowerCase()) ||
              theme.label.toLowerCase().includes(studyTheme.label.toLowerCase())) {
            contributingIds.add(study.id);
          }
        }
      }
    }

    return Array.from(contributingIds);
  }

  /**
   * Calculate argument strength
   */
  private calculateArgumentStrength(
    themes: readonly ConsensusTheme[],
    totalStudies: number,
  ): number {
    if (themes.length === 0 || totalStudies === 0) {
      return 0;
    }

    // Average consensus strength weighted by study coverage
    const avgConsensus = themes.reduce((acc, t) => acc + t.consensusStrength, 0) / themes.length;
    const avgCoverage = themes.reduce(
      (acc, t) => acc + t.supportingStudyCount / totalStudies,
      0,
    ) / themes.length;

    return Math.min(1, (avgConsensus * 0.6 + avgCoverage * 0.4));
  }

  // ============================================================================
  // PRIVATE: REFUTATIONAL SYNTHESIS
  // ============================================================================

  /**
   * Perform refutational synthesis
   */
  private performRefutationalSynthesis(
    studies: readonly StudyWithThemes[],
    translations: readonly ReciprocalTranslation[],
    config: SynthesisConfig,
  ): RefutationalSynthesis {
    // Identify contradictions from refutational mappings
    const contradictions = this.identifyContradictions(translations, config);

    // Generate explanations for contradictions
    const explanations = this.generateContradictionExplanations(contradictions, studies);

    // Identify unresolved tensions
    const unresolvedTensions = this.identifyUnresolvedTensions(contradictions, explanations);

    // Calculate complexity score
    const complexityScore = this.calculateRefutationComplexity(
      contradictions,
      explanations,
      unresolvedTensions,
    );

    return {
      contradictions,
      explanations,
      unresolvedTensions,
      complexityScore,
    };
  }

  /**
   * Identify contradictions from translations
   */
  private identifyContradictions(
    translations: readonly ReciprocalTranslation[],
    config: SynthesisConfig,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    for (const translation of translations) {
      for (const mapping of translation.mappings) {
        if (mapping.mappingType === 'refutational') {
          // Determine contradiction type
          const type = this.determineContradictionType(
            mapping.source.description,
            mapping.target.description,
          );

          // Calculate severity
          const severity = this.calculateContradictionSeverity(mapping);

          if (severity >= config.contradictionSeverityThreshold) {
            contradictions.push({
              id: `contradiction_${contradictions.length + 1}`,
              positionA: {
                studyId: mapping.source.studyId,
                claim: mapping.source.description,
                evidence: mapping.evidence.filter((e) => e.startsWith('Source:')),
              },
              positionB: {
                studyId: mapping.target.studyId,
                claim: mapping.target.description,
                evidence: mapping.evidence.filter((e) => e.startsWith('Target:')),
              },
              type,
              severity,
            });
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Determine type of contradiction
   */
  private determineContradictionType(
    descriptionA: string,
    descriptionB: string,
  ): ContradictionType {
    const combined = `${descriptionA} ${descriptionB}`.toLowerCase();

    // Check for methodological indicators
    for (const indicator of CONTRADICTION_INDICATORS.methodological) {
      if (combined.includes(indicator)) {
        return 'methodological';
      }
    }

    // Check for contextual indicators
    for (const indicator of CONTRADICTION_INDICATORS.contextual) {
      if (combined.includes(indicator)) {
        return 'contextual';
      }
    }

    // Check for temporal indicators
    for (const indicator of CONTRADICTION_INDICATORS.temporal) {
      if (combined.includes(indicator)) {
        return 'temporal';
      }
    }

    // Default to direct contradiction
    return 'direct';
  }

  /**
   * Calculate contradiction severity
   */
  private calculateContradictionSeverity(mapping: ThemeMapping): number {
    // Lower similarity = stronger contradiction
    const similarityFactor = 1 - mapping.similarity;

    // Evidence strength
    const evidenceFactor = Math.min(1, mapping.evidence.length / 4);

    return (similarityFactor * 0.7 + evidenceFactor * 0.3);
  }

  /**
   * Generate explanations for contradictions
   */
  private generateContradictionExplanations(
    contradictions: readonly Contradiction[],
    studies: readonly StudyWithThemes[],
  ): ContradictionExplanation[] {
    const explanations: ContradictionExplanation[] = [];

    for (const contradiction of contradictions) {
      // Find the studies involved
      const studyA = studies.find((s) => s.id === contradiction.positionA.studyId);
      const studyB = studies.find((s) => s.id === contradiction.positionB.studyId);

      // Generate explanation based on contradiction type
      const explanation = this.generateExplanation(contradiction, studyA, studyB);
      if (explanation) {
        explanations.push(explanation);
      }
    }

    return explanations;
  }

  /**
   * Generate explanation for a single contradiction
   */
  private generateExplanation(
    contradiction: Contradiction,
    studyA?: StudyWithThemes,
    studyB?: StudyWithThemes,
  ): ContradictionExplanation | null {
    let explanationText: string;
    let type: ContradictionExplanation['type'];
    let plausibility: number;

    switch (contradiction.type) {
      case 'methodological':
        type = 'methodological';
        explanationText = `The contradiction may arise from different methodological approaches: ` +
          `${studyA?.methodology || 'unknown'} vs ${studyB?.methodology || 'unknown'}`;
        plausibility = 0.7;
        break;

      case 'contextual':
        type = 'contextual';
        explanationText = `The findings may be context-specific: ` +
          `${studyA?.context || 'unspecified context'} vs ${studyB?.context || 'unspecified context'}`;
        plausibility = 0.8;
        break;

      case 'temporal':
        type = 'temporal';
        explanationText = `Temporal differences may explain the contradiction: ` +
          `${studyA?.year || 'unknown year'} vs ${studyB?.year || 'unknown year'}`;
        plausibility = 0.6;
        break;

      default:
        type = 'definitional';
        explanationText = `The studies may be using different definitions or conceptualizations ` +
          `of the same phenomenon.`;
        plausibility = 0.5;
    }

    return {
      contradictionId: contradiction.id,
      explanation: explanationText,
      type,
      plausibility,
    };
  }

  /**
   * Identify unresolved tensions
   */
  private identifyUnresolvedTensions(
    contradictions: readonly Contradiction[],
    explanations: readonly ContradictionExplanation[],
  ): readonly string[] {
    const tensions: string[] = [];

    for (const contradiction of contradictions) {
      const explanation = explanations.find((e) => e.contradictionId === contradiction.id);

      // Low plausibility explanations indicate unresolved tensions
      if (!explanation || explanation.plausibility < 0.5) {
        tensions.push(
          `Unresolved tension between "${contradiction.positionA.claim.substring(0, 50)}..." ` +
            `and "${contradiction.positionB.claim.substring(0, 50)}..."`,
        );
      }
    }

    return tensions;
  }

  /**
   * Calculate refutation complexity score
   */
  private calculateRefutationComplexity(
    contradictions: readonly Contradiction[],
    explanations: readonly ContradictionExplanation[],
    unresolvedTensions: readonly string[],
  ): number {
    if (contradictions.length === 0) {
      return 0;
    }

    // Factors: number of contradictions, severity, resolution rate
    const avgSeverity = contradictions.reduce((acc, c) => acc + c.severity, 0) / contradictions.length;
    const resolutionRate = explanations.filter((e) => e.plausibility >= 0.5).length / contradictions.length;
    const tensionRate = unresolvedTensions.length / contradictions.length;

    return Math.min(1, avgSeverity * 0.4 + (1 - resolutionRate) * 0.3 + tensionRate * 0.3);
  }

  // ============================================================================
  // PRIVATE: SYNTHESIS OUTPUT
  // ============================================================================

  /**
   * Create final synthesized themes
   */
  private createSynthesizedThemes(
    lineOfArgument: LineOfArgumentSynthesis,
    refutationalSynthesis: RefutationalSynthesis,
    translations: readonly ReciprocalTranslation[],
  ): SynthesizedTheme[] {
    const themes: SynthesizedTheme[] = [];

    // Add themes from line-of-argument synthesis
    for (const consensusTheme of lineOfArgument.supportingThemes) {
      themes.push({
        id: `synth_loa_${consensusTheme.id}`,
        label: consensusTheme.label,
        description: consensusTheme.description,
        synthesisMethod: 'line_of_argument',
        contributingStudyIds: lineOfArgument.contributingStudyIds,
        confidence: consensusTheme.consensusStrength,
        keyFindings: [
          `Supported by ${consensusTheme.supportingStudyCount} studies`,
          `Consensus strength: ${(consensusTheme.consensusStrength * 100).toFixed(1)}%`,
        ],
      });
    }

    // Add themes from reciprocal translations with high confidence
    const processedLabels = new Set(themes.map((t) => t.label.toLowerCase()));

    for (const translation of translations) {
      if (translation.confidence >= 0.7 && translation.isReciprocal) {
        for (const mapping of translation.mappings.slice(0, 2)) {
          if (mapping.mappingType === 'direct' &&
              !processedLabels.has(mapping.target.label.toLowerCase())) {
            themes.push({
              id: `synth_rec_${themes.length + 1}`,
              label: mapping.target.label,
              description: mapping.target.description,
              synthesisMethod: 'reciprocal',
              contributingStudyIds: [mapping.source.studyId, mapping.target.studyId],
              confidence: mapping.similarity,
              keyFindings: [
                `Direct translation between studies`,
                `Similarity: ${(mapping.similarity * 100).toFixed(1)}%`,
              ],
            });
            processedLabels.add(mapping.target.label.toLowerCase());
          }
        }
      }
    }

    // Add refutational themes for significant contradictions
    for (const contradiction of refutationalSynthesis.contradictions) {
      if (contradiction.severity >= 0.7) {
        themes.push({
          id: `synth_ref_${contradiction.id}`,
          label: `Contested: ${contradiction.positionA.claim.substring(0, 30)}...`,
          description: `Conflicting findings between studies regarding ` +
            `${contradiction.positionA.claim.substring(0, 50)}`,
          synthesisMethod: 'refutational',
          contributingStudyIds: [contradiction.positionA.studyId, contradiction.positionB.studyId],
          confidence: 1 - contradiction.severity, // Lower confidence for contradictions
          keyFindings: [
            `Contradiction type: ${contradiction.type}`,
            `Severity: ${(contradiction.severity * 100).toFixed(1)}%`,
          ],
        });
      }
    }

    return themes;
  }

  // ============================================================================
  // PRIVATE: QUALITY METRICS
  // ============================================================================

  /**
   * Calculate synthesis quality metrics
   */
  private calculateQualityMetrics(
    studies: readonly StudyWithThemes[],
    translations: readonly ReciprocalTranslation[],
    lineOfArgument: LineOfArgumentSynthesis,
    refutationalSynthesis: RefutationalSynthesis,
  ): SynthesisQualityMetrics {
    // Study coverage
    const studyCoverage = lineOfArgument.contributingStudyIds.length / studies.length;

    // Theme saturation (proportion of themes included in consensus)
    const totalThemes = studies.reduce((acc, s) => acc + s.themes.length, 0);
    const consensusThemeCount = lineOfArgument.supportingThemes.length;
    const themeSaturation = Math.min(1, consensusThemeCount / Math.max(1, totalThemes / studies.length));

    // Translation completeness
    const expectedTranslations = (studies.length * (studies.length - 1)); // All pairs, both directions
    const translationCompleteness = translations.length / Math.max(1, expectedTranslations);

    // Contradiction resolution rate
    const totalContradictions = refutationalSynthesis.contradictions.length;
    const resolvedContradictions = refutationalSynthesis.explanations.filter(
      (e) => e.plausibility >= 0.5,
    ).length;
    const contradictionResolutionRate =
      totalContradictions > 0 ? resolvedContradictions / totalContradictions : 1;

    // Overall quality
    const overallQuality =
      studyCoverage * 0.3 +
      themeSaturation * 0.25 +
      translationCompleteness * 0.25 +
      contradictionResolutionRate * 0.2;

    return {
      studyCoverage,
      themeSaturation,
      translationCompleteness,
      contradictionResolutionRate,
      overallQuality: Math.min(1, Math.max(0, overallQuality)),
    };
  }

  // ============================================================================
  // PRIVATE: UTILITIES
  // ============================================================================

  /**
   * Calculate cosine similarity between two vectors
   *
   * DRY FIX: Delegates to shared vector-math utility.
   */
  private calculateSimilarity(a: readonly number[], b: readonly number[]): number {
    return cosineSimilarity(a, b);
  }
}
