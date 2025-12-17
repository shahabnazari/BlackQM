/**
 * Phase 10.170 Week 4+: Hypothesis Generation Pipeline (Grounded Theory)
 *
 * Enterprise-grade implementation of Grounded Theory methodology for
 * hypothesis generation (Glaser & Strauss, 1967; Strauss & Corbin, 1998).
 *
 * SCIENTIFIC FOUNDATIONS:
 * - Open Coding: Initial categorization and in-vivo codes
 * - Axial Coding: Paradigm model (conditions → actions → consequences)
 * - Selective Coding: Core category identification
 * - Theoretical Framework: Hypothesis generation
 *
 * KEY FEATURES:
 * - Proper 3-stage grounded theory coding
 * - Paradigm model implementation
 * - Core category centrality analysis
 * - Testable hypothesis generation
 *
 * @module hypothesis-generation-pipeline.service
 * @since Phase 10.170 Week 4+
 */

import { Injectable, Logger } from '@nestjs/common';
import { cosineSimilarity } from '../utils/vector-math.utils';
import {
  GroundedTheoryResult,
  OpenCodingResult,
  AxialCodingResult,
  SelectiveCodingResult,
  TheoreticalFramework,
  GeneratedHypothesis,
  GroundedTheoryQualityMetrics,
  OpenCode,
  CodeProperty,
  AxialCategory,
  CategoryRelationship,
  CategoryRelationshipType,
  CoreCategory,
  CategoryIntegration,
  CategoryRole,
  TheoreticalConstruct,
  TheoreticalProposition,
  HypothesisType,
  HypothesisVariable,
  validateGroundedTheoryQualityMetrics,
} from '../types/specialized-pipeline.types';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Source content for grounded theory analysis
 */
export interface GroundedTheorySource {
  readonly id: string;
  readonly title: string;
  readonly abstract: string | null;
  readonly fullText: string | null;
  readonly keywords: readonly string[];
}

/**
 * Embedding provider function
 */
export type GTEmbeddingProviderFn = (texts: readonly string[]) => Promise<readonly number[][]>;

/**
 * Grounded theory configuration
 */
export interface GroundedTheoryConfig {
  /** Minimum frequency for code to be significant */
  readonly minCodeFrequency: number;
  /** Similarity threshold for code merging */
  readonly codeMergeThreshold: number;
  /** Minimum categories for axial coding */
  readonly minAxialCategories: number;
  /** Minimum propositions for hypothesis generation */
  readonly minPropositionsForHypothesis: number;
  /** Enable in-vivo code detection */
  readonly enableInVivoCodes: boolean;
}

/**
 * Default grounded theory configuration
 */
export const DEFAULT_GT_CONFIG: Readonly<GroundedTheoryConfig> = {
  minCodeFrequency: 2,
  codeMergeThreshold: 0.85,
  minAxialCategories: 3,
  minPropositionsForHypothesis: 2,
  enableInVivoCodes: true,
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Paradigm model indicators
 */
const PARADIGM_INDICATORS = {
  causalConditions: ['because', 'due to', 'caused by', 'resulted from', 'leads to'],
  context: ['in the context of', 'within', 'setting', 'environment', 'situation'],
  interveningConditions: ['however', 'although', 'despite', 'influenced by', 'affected by'],
  actionStrategies: ['by', 'through', 'using', 'approach', 'strategy', 'method'],
  consequences: ['resulting in', 'leading to', 'outcome', 'effect', 'consequence', 'impact'],
} as const;

/**
 * Relationship type keywords
 */
const RELATIONSHIP_KEYWORDS: Readonly<Record<CategoryRelationshipType, readonly string[]>> = {
  causal: ['causes', 'leads to', 'results in', 'produces', 'generates'],
  conditional: ['if', 'when', 'depends on', 'requires', 'contingent'],
  sequential: ['then', 'followed by', 'next', 'after', 'before'],
  bidirectional: ['interacts', 'mutual', 'reciprocal', 'co-occurring'],
  hierarchical: ['includes', 'contains', 'part of', 'subset', 'belongs to'],
} as const;

/**
 * In-vivo code patterns (quotation markers)
 */
const IN_VIVO_PATTERNS = [
  /["']([^"']{3,50})["']/g,
  /`([^`]{3,50})`/g,
] as const;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class HypothesisGenerationPipelineService {
  private readonly logger = new Logger(HypothesisGenerationPipelineService.name);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Execute full grounded theory analysis pipeline
   *
   * Implements Strauss & Corbin (1998) coding process:
   * 1. Open Coding: Break down data into discrete parts
   * 2. Axial Coding: Relate categories using paradigm model
   * 3. Selective Coding: Integrate around core category
   *
   * @param sources Source content for analysis
   * @param embeddingFn Function to generate embeddings
   * @param config Analysis configuration
   * @returns Complete grounded theory result with hypotheses
   */
  async generateHypotheses(
    sources: readonly GroundedTheorySource[],
    embeddingFn: GTEmbeddingProviderFn,
    config: Partial<GroundedTheoryConfig> = {},
  ): Promise<GroundedTheoryResult> {
    const startTime = Date.now();

    // Merge with defaults
    const fullConfig: GroundedTheoryConfig = {
      ...DEFAULT_GT_CONFIG,
      ...config,
    };

    this.logger.log(
      `Starting grounded theory analysis: ${sources.length} sources`,
    );

    // Stage 1: Open Coding
    const openCoding = await this.performOpenCoding(sources, embeddingFn, fullConfig);
    this.logger.debug(`Open coding complete: ${openCoding.codes.length} codes`);

    // Stage 2: Axial Coding
    const axialCoding = await this.performAxialCoding(
      openCoding,
      sources,
      embeddingFn,
      fullConfig,
    );
    this.logger.debug(`Axial coding complete: ${axialCoding.categories.length} categories`);

    // Stage 3: Selective Coding
    const selectiveCoding = this.performSelectiveCoding(axialCoding, openCoding);
    this.logger.debug(`Selective coding complete: core category "${selectiveCoding.coreCategory.label}"`);

    // Generate theoretical framework
    const theoreticalFramework = this.generateTheoreticalFramework(
      axialCoding,
      selectiveCoding,
    );

    // Generate hypotheses from framework
    const hypotheses = this.generateHypothesesFromFramework(
      theoreticalFramework,
      fullConfig,
    );

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(
      openCoding,
      axialCoding,
      selectiveCoding,
      theoreticalFramework,
      hypotheses,
    );

    // Validate metrics
    try {
      validateGroundedTheoryQualityMetrics(qualityMetrics);
    } catch (error) {
      this.logger.warn(`Quality metrics validation warning: ${error}`);
    }

    const result: GroundedTheoryResult = {
      openCoding,
      axialCoding,
      selectiveCoding,
      theoreticalFramework,
      hypotheses,
      qualityMetrics,
      durationMs: Date.now() - startTime,
    };

    this.logger.log(
      `Grounded theory analysis complete: ${hypotheses.length} hypotheses, ` +
        `quality=${(qualityMetrics.overallQuality * 100).toFixed(1)}%, ` +
        `duration=${result.durationMs}ms`,
    );

    return result;
  }

  // ============================================================================
  // PRIVATE: OPEN CODING
  // ============================================================================

  /**
   * Perform open coding on sources
   */
  private async performOpenCoding(
    sources: readonly GroundedTheorySource[],
    embeddingFn: GTEmbeddingProviderFn,
    config: GroundedTheoryConfig,
  ): Promise<OpenCodingResult> {
    const allCodes: OpenCode[] = [];
    const inVivoCodes: string[] = [];
    const frequencyMap = new Map<string, number>();

    // Extract codes from each source
    for (const source of sources) {
      const sourceText = this.getSourceText(source);
      if (!sourceText) continue;

      // Extract concepts (simple approach: significant phrases)
      const concepts = this.extractConcepts(sourceText);

      // Extract in-vivo codes if enabled
      if (config.enableInVivoCodes) {
        const sourceInVivo = this.extractInVivoCodes(sourceText);
        inVivoCodes.push(...sourceInVivo);
      }

      // Create codes from concepts
      for (const concept of concepts) {
        const normalizedLabel = concept.toLowerCase().trim();
        const existing = allCodes.find(
          (c) => c.label.toLowerCase() === normalizedLabel,
        );

        if (existing) {
          // Update frequency
          frequencyMap.set(normalizedLabel, (frequencyMap.get(normalizedLabel) || 1) + 1);
        } else {
          // Create new code
          const code: OpenCode = {
            id: `code_${allCodes.length + 1}`,
            label: concept,
            definition: `Concept extracted from: "${sourceText.substring(0, 100)}..."`,
            excerpts: [sourceText.substring(0, 200)],
            frequency: 1,
            isInVivo: inVivoCodes.includes(concept),
            properties: this.extractCodeProperties(concept, sourceText),
          };
          allCodes.push(code);
          frequencyMap.set(normalizedLabel, 1);
        }
      }
    }

    // Merge similar codes using embeddings
    const mergedCodes = await this.mergeSimilarCodes(allCodes, embeddingFn, config);

    // Filter by minimum frequency
    const significantCodes = mergedCodes.filter(
      (c) => c.frequency >= config.minCodeFrequency,
    );

    // Calculate coding density
    const codingDensity = significantCodes.length / sources.length;

    return {
      codes: significantCodes,
      frequencyDistribution: frequencyMap,
      inVivoCodes: [...new Set(inVivoCodes)],
      codingDensity,
    };
  }

  /**
   * Get combined text from source
   */
  private getSourceText(source: GroundedTheorySource): string {
    const parts: string[] = [source.title];

    if (source.abstract) {
      parts.push(source.abstract);
    }

    if (source.fullText) {
      // Use first 2000 chars of full text
      parts.push(source.fullText.substring(0, 2000));
    }

    if (source.keywords.length > 0) {
      parts.push(source.keywords.join(', '));
    }

    return parts.join(' ');
  }

  /**
   * Extract concepts from text
   */
  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];

    // Extract noun phrases (simplified)
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      // Look for significant phrases
      const words = sentence.split(/\s+/).filter((w) => w.length > 3);

      // Extract bi-grams and tri-grams
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`.toLowerCase();
        if (this.isSignificantPhrase(bigram)) {
          concepts.push(bigram);
        }
      }

      for (let i = 0; i < words.length - 2; i++) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase();
        if (this.isSignificantPhrase(trigram)) {
          concepts.push(trigram);
        }
      }
    }

    return [...new Set(concepts)].slice(0, 50); // Limit to 50 concepts per source
  }

  /**
   * Check if phrase is significant
   */
  private isSignificantPhrase(phrase: string): boolean {
    // Filter out common stopword patterns
    const stopPatterns = [
      /^(the|a|an|this|that|these|those)\s/i,
      /\s(is|are|was|were|be|been|being)\s/i,
      /\s(and|or|but|for|nor|so|yet)\s/i,
    ];

    for (const pattern of stopPatterns) {
      if (pattern.test(phrase)) {
        return false;
      }
    }

    return phrase.length >= 5;
  }

  /**
   * Extract in-vivo codes from text
   */
  private extractInVivoCodes(text: string): string[] {
    const codes: string[] = [];

    for (const pattern of IN_VIVO_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          codes.push(match[1]);
        }
      }
    }

    return codes;
  }

  /**
   * Extract code properties (dimensions)
   */
  private extractCodeProperties(concept: string, context: string): CodeProperty[] {
    const properties: CodeProperty[] = [];

    // Intensity dimension
    if (/very|highly|extremely|strongly/i.test(context)) {
      properties.push({
        name: 'intensity',
        dimensionRange: ['low', 'moderate', 'high'],
        position: 'high',
      });
    } else if (/slightly|somewhat|moderately/i.test(context)) {
      properties.push({
        name: 'intensity',
        dimensionRange: ['low', 'moderate', 'high'],
        position: 'moderate',
      });
    }

    // Frequency dimension
    if (/always|constantly|continuously/i.test(context)) {
      properties.push({
        name: 'frequency',
        dimensionRange: ['rare', 'occasional', 'frequent', 'constant'],
        position: 'constant',
      });
    } else if (/sometimes|occasionally/i.test(context)) {
      properties.push({
        name: 'frequency',
        dimensionRange: ['rare', 'occasional', 'frequent', 'constant'],
        position: 'occasional',
      });
    }

    return properties;
  }

  /**
   * Merge similar codes using embeddings
   */
  private async mergeSimilarCodes(
    codes: readonly OpenCode[],
    embeddingFn: GTEmbeddingProviderFn,
    config: GroundedTheoryConfig,
  ): Promise<OpenCode[]> {
    if (codes.length === 0) {
      return [];
    }

    // Get embeddings for all codes
    const codeTexts = codes.map((c) => `${c.label}: ${c.definition}`);
    const embeddings = await embeddingFn(codeTexts);

    // Find merge groups
    const merged = new Set<number>();
    const mergedCodes: OpenCode[] = [];

    for (let i = 0; i < codes.length; i++) {
      if (merged.has(i)) continue;

      const toMerge: number[] = [i];

      // Find similar codes
      for (let j = i + 1; j < codes.length; j++) {
        if (merged.has(j)) continue;

        const similarity = this.calculateSimilarity(embeddings[i], embeddings[j]);
        if (similarity >= config.codeMergeThreshold) {
          toMerge.push(j);
          merged.add(j);
        }
      }

      // Create merged code
      if (toMerge.length > 1) {
        const mergedCode: OpenCode = {
          id: codes[i].id,
          label: codes[i].label, // Keep first label
          definition: codes[i].definition,
          excerpts: toMerge.flatMap((idx) => codes[idx].excerpts),
          frequency: toMerge.reduce((acc, idx) => acc + codes[idx].frequency, 0),
          isInVivo: toMerge.some((idx) => codes[idx].isInVivo),
          properties: codes[i].properties,
        };
        mergedCodes.push(mergedCode);
      } else {
        mergedCodes.push({ ...codes[i] });
      }

      merged.add(i);
    }

    return mergedCodes;
  }

  // ============================================================================
  // PRIVATE: AXIAL CODING
  // ============================================================================

  /**
   * Perform axial coding using paradigm model
   */
  private async performAxialCoding(
    openCoding: OpenCodingResult,
    sources: readonly GroundedTheorySource[],
    embeddingFn: GTEmbeddingProviderFn,
    config: GroundedTheoryConfig,
  ): Promise<AxialCodingResult> {
    // Group codes into categories
    const categories = await this.groupCodesIntoCategories(
      openCoding.codes,
      embeddingFn,
      config,
    );

    // Apply paradigm model to each category
    const axialCategories = this.applyParadigmModel(
      categories,
      sources,
    );

    // Identify relationships between categories
    const relationships = this.identifyCategoryRelationships(axialCategories);

    // Calculate paradigm completeness
    const paradigmCompleteness = this.calculateParadigmCompleteness(axialCategories);

    return {
      categories: axialCategories,
      relationships,
      paradigmCompleteness,
    };
  }

  /**
   * Group codes into higher-level categories
   */
  private async groupCodesIntoCategories(
    codes: readonly OpenCode[],
    embeddingFn: GTEmbeddingProviderFn,
    config: GroundedTheoryConfig,
  ): Promise<Map<string, OpenCode[]>> {
    if (codes.length === 0) {
      return new Map();
    }

    // Get embeddings
    const codeTexts = codes.map((c) => c.label);
    const embeddings = await embeddingFn(codeTexts);

    // Cluster codes (simple k-means-like approach)
    const numCategories = Math.min(
      Math.max(config.minAxialCategories, Math.ceil(codes.length / 5)),
      10,
    );

    // Initialize centroids from diverse codes
    const centroids: number[][] = [];
    const centroidIndices: number[] = [];

    for (let i = 0; i < numCategories && i < codes.length; i++) {
      // Find code most different from current centroids
      let maxMinDist = -1;
      let bestIdx = -1;

      for (let j = 0; j < codes.length; j++) {
        if (centroidIndices.includes(j)) continue;

        let minDist = Infinity;
        for (const idx of centroidIndices) {
          const dist = 1 - this.calculateSimilarity(embeddings[j], embeddings[idx]);
          minDist = Math.min(minDist, dist);
        }

        if (centroidIndices.length === 0) {
          minDist = 1;
        }

        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          bestIdx = j;
        }
      }

      if (bestIdx >= 0) {
        centroids.push(embeddings[bestIdx]);
        centroidIndices.push(bestIdx);
      }
    }

    // Assign codes to nearest centroid
    const categories = new Map<string, OpenCode[]>();

    for (let i = 0; i < codes.length; i++) {
      let bestCentroid = 0;
      let bestSimilarity = -1;

      for (let c = 0; c < centroids.length; c++) {
        const similarity = this.calculateSimilarity(embeddings[i], centroids[c]);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCentroid = c;
        }
      }

      const categoryLabel = codes[centroidIndices[bestCentroid]]?.label || `Category_${bestCentroid}`;

      if (!categories.has(categoryLabel)) {
        categories.set(categoryLabel, []);
      }
      categories.get(categoryLabel)!.push(codes[i]);
    }

    return categories;
  }

  /**
   * Apply paradigm model to categories
   */
  private applyParadigmModel(
    categories: Map<string, OpenCode[]>,
    sources: readonly GroundedTheorySource[],
  ): AxialCategory[] {
    const axialCategories: AxialCategory[] = [];
    let categoryIndex = 0;

    // Get all source text for context analysis
    const allText = sources.map((s) => this.getSourceText(s)).join(' ');

    for (const [label, codes] of categories) {
      // Extract paradigm components from context
      const causalConditions = this.extractParadigmComponent(
        label,
        allText,
        PARADIGM_INDICATORS.causalConditions,
      );

      const context = this.extractParadigmComponent(
        label,
        allText,
        PARADIGM_INDICATORS.context,
      );

      const interveningConditions = this.extractParadigmComponent(
        label,
        allText,
        PARADIGM_INDICATORS.interveningConditions,
      );

      const actionStrategies = this.extractParadigmComponent(
        label,
        allText,
        PARADIGM_INDICATORS.actionStrategies,
      );

      const consequences = this.extractParadigmComponent(
        label,
        allText,
        PARADIGM_INDICATORS.consequences,
      );

      axialCategories.push({
        id: `axial_${categoryIndex + 1}`,
        label,
        description: `Category encompassing: ${codes.map((c) => c.label).slice(0, 3).join(', ')}`,
        causalConditions,
        context,
        interveningConditions,
        actionStrategies,
        consequences,
        subcategories: codes.map((c) => c.label).slice(3),
        openCodeIds: codes.map((c) => c.id),
      });

      categoryIndex++;
    }

    return axialCategories;
  }

  /**
   * Extract paradigm component from text
   */
  private extractParadigmComponent(
    categoryLabel: string,
    text: string,
    indicators: readonly string[],
  ): string[] {
    const components: string[] = [];
    const labelRegex = new RegExp(categoryLabel.replace(/\s+/g, '\\s+'), 'gi');

    for (const indicator of indicators) {
      const pattern = new RegExp(
        `(${indicator})\\s+([^.]{10,100})`,
        'gi',
      );

      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[2] && labelRegex.test(match[2])) {
          components.push(match[2].trim());
        }
      }
    }

    // Also extract based on proximity to category label
    const labelMatches = text.matchAll(labelRegex);
    for (const match of labelMatches) {
      if (match.index !== undefined) {
        const context = text.substring(
          Math.max(0, match.index - 100),
          Math.min(text.length, match.index + 100),
        );

        for (const indicator of indicators) {
          if (context.toLowerCase().includes(indicator)) {
            // Extract the relevant clause
            const clause = context.split(/[.!?]/)[1]?.trim();
            if (clause && clause.length > 10) {
              components.push(clause);
            }
          }
        }
      }
    }

    return [...new Set(components)].slice(0, 5);
  }

  /**
   * Identify relationships between categories
   */
  private identifyCategoryRelationships(
    categories: readonly AxialCategory[],
  ): CategoryRelationship[] {
    const relationships: CategoryRelationship[] = [];

    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const categoryA = categories[i];
        const categoryB = categories[j];

        // Check for relationships based on paradigm components
        const relationship = this.detectRelationship(categoryA, categoryB);

        if (relationship) {
          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Detect relationship between two categories
   */
  private detectRelationship(
    categoryA: AxialCategory,
    categoryB: AxialCategory,
  ): CategoryRelationship | null {
    // Check if A's consequences overlap with B's causal conditions
    const causalEvidence = this.findOverlap(
      categoryA.consequences,
      categoryB.causalConditions,
    );

    if (causalEvidence.length > 0) {
      return {
        sourceId: categoryA.id,
        targetId: categoryB.id,
        type: 'causal',
        strength: Math.min(1, causalEvidence.length * 0.3),
        evidence: causalEvidence,
      };
    }

    // Check for conditional relationship
    const conditionalEvidence = this.findOverlap(
      categoryA.context,
      categoryB.interveningConditions,
    );

    if (conditionalEvidence.length > 0) {
      return {
        sourceId: categoryA.id,
        targetId: categoryB.id,
        type: 'conditional',
        strength: Math.min(1, conditionalEvidence.length * 0.25),
        evidence: conditionalEvidence,
      };
    }

    // Check for hierarchical relationship (subcategories overlap)
    const hierarchicalEvidence = this.findOverlap(
      categoryA.subcategories,
      categoryB.subcategories,
    );

    if (hierarchicalEvidence.length > 0) {
      return {
        sourceId: categoryA.id,
        targetId: categoryB.id,
        type: 'hierarchical',
        strength: Math.min(1, hierarchicalEvidence.length * 0.2),
        evidence: hierarchicalEvidence,
      };
    }

    return null;
  }

  /**
   * Find overlapping elements between two arrays
   */
  private findOverlap(
    arrayA: readonly string[],
    arrayB: readonly string[],
  ): string[] {
    const overlap: string[] = [];

    for (const a of arrayA) {
      for (const b of arrayB) {
        // Check for significant word overlap
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));

        let commonWords = 0;
        for (const word of wordsA) {
          if (wordsB.has(word) && word.length > 3) {
            commonWords++;
          }
        }

        if (commonWords >= 2) {
          overlap.push(`"${a}" relates to "${b}"`);
        }
      }
    }

    return overlap;
  }

  /**
   * Calculate paradigm completeness
   */
  private calculateParadigmCompleteness(categories: readonly AxialCategory[]): number {
    if (categories.length === 0) {
      return 0;
    }

    let totalCompleteness = 0;

    for (const category of categories) {
      // Each paradigm component contributes 0.2 to completeness
      let categoryCompleteness = 0;

      if (category.causalConditions.length > 0) categoryCompleteness += 0.2;
      if (category.context.length > 0) categoryCompleteness += 0.2;
      if (category.interveningConditions.length > 0) categoryCompleteness += 0.2;
      if (category.actionStrategies.length > 0) categoryCompleteness += 0.2;
      if (category.consequences.length > 0) categoryCompleteness += 0.2;

      totalCompleteness += categoryCompleteness;
    }

    return totalCompleteness / categories.length;
  }

  // ============================================================================
  // PRIVATE: SELECTIVE CODING
  // ============================================================================

  /**
   * Perform selective coding to identify core category
   */
  private performSelectiveCoding(
    axialCoding: AxialCodingResult,
    openCoding: OpenCodingResult,
  ): SelectiveCodingResult {
    // Identify core category based on centrality
    const coreCategory = this.identifyCoreCategory(
      axialCoding.categories,
      axialCoding.relationships,
    );

    // Determine how other categories integrate with core
    const categoryIntegration = this.determineCategoryIntegration(
      coreCategory,
      axialCoding.categories,
      axialCoding.relationships,
    );

    // Generate storyline
    const storyline = this.generateStoryline(
      coreCategory,
      categoryIntegration,
      axialCoding.categories,
    );

    // Check theoretical saturation
    const theoreticalSaturation = this.checkTheoreticalSaturation(
      openCoding,
      axialCoding,
    );

    return {
      coreCategory,
      categoryIntegration,
      storyline,
      theoreticalSaturation,
    };
  }

  /**
   * Identify core category based on centrality metrics
   */
  private identifyCoreCategory(
    categories: readonly AxialCategory[],
    relationships: readonly CategoryRelationship[],
  ): CoreCategory {
    if (categories.length === 0) {
      return {
        id: 'core_empty',
        label: 'No Core Category',
        description: 'Insufficient data for core category identification',
        centrality: 0,
        explanatoryPower: 0,
        variationAccountedFor: 0,
      };
    }

    // Calculate centrality for each category
    const centralities = new Map<string, number>();

    for (const category of categories) {
      // Count incoming and outgoing relationships
      const incoming = relationships.filter((r) => r.targetId === category.id).length;
      const outgoing = relationships.filter((r) => r.sourceId === category.id).length;

      // Centrality based on connections and paradigm completeness
      const connectionCentrality = (incoming + outgoing) / (categories.length * 2);
      const paradigmComplete = (
        (category.causalConditions.length > 0 ? 1 : 0) +
        (category.consequences.length > 0 ? 1 : 0) +
        (category.actionStrategies.length > 0 ? 1 : 0)
      ) / 3;

      centralities.set(category.id, connectionCentrality * 0.6 + paradigmComplete * 0.4);
    }

    // Find most central category
    let maxCentrality = 0;
    let coreCandidate = categories[0];

    for (const category of categories) {
      const centrality = centralities.get(category.id) || 0;
      if (centrality > maxCentrality) {
        maxCentrality = centrality;
        coreCandidate = category;
      }
    }

    // Calculate explanatory power and variation
    const explanatoryPower = this.calculateExplanatoryPower(
      coreCandidate,
      categories,
      relationships,
    );

    const variationAccountedFor = coreCandidate.openCodeIds.length /
      categories.reduce((acc, c) => acc + c.openCodeIds.length, 0);

    return {
      id: `core_${coreCandidate.id}`,
      label: coreCandidate.label,
      description: coreCandidate.description,
      centrality: maxCentrality,
      explanatoryPower,
      variationAccountedFor,
    };
  }

  /**
   * Calculate explanatory power of a category
   */
  private calculateExplanatoryPower(
    category: AxialCategory,
    allCategories: readonly AxialCategory[],
    relationships: readonly CategoryRelationship[],
  ): number {
    // Explanatory power based on:
    // 1. Number of relationships
    // 2. Strength of relationships
    // 3. Coverage of other categories

    const relatedRelationships = relationships.filter(
      (r) => r.sourceId === category.id || r.targetId === category.id,
    );

    const avgStrength =
      relatedRelationships.length > 0
        ? relatedRelationships.reduce((acc, r) => acc + r.strength, 0) / relatedRelationships.length
        : 0;

    const connectedCategories = new Set<string>();
    for (const r of relatedRelationships) {
      connectedCategories.add(r.sourceId);
      connectedCategories.add(r.targetId);
    }
    connectedCategories.delete(category.id);

    const coverage = connectedCategories.size / Math.max(1, allCategories.length - 1);

    return avgStrength * 0.5 + coverage * 0.5;
  }

  /**
   * Determine how categories integrate with core
   */
  private determineCategoryIntegration(
    coreCategory: CoreCategory,
    categories: readonly AxialCategory[],
    relationships: readonly CategoryRelationship[],
  ): CategoryIntegration[] {
    const integrations: CategoryIntegration[] = [];

    for (const category of categories) {
      if (category.id === coreCategory.id.replace('core_', '')) continue;

      // Find relationship to core
      const toCore = relationships.find(
        (r) => r.sourceId === category.id &&
              r.targetId === coreCategory.id.replace('core_', ''),
      );

      const fromCore = relationships.find(
        (r) => r.sourceId === coreCategory.id.replace('core_', '') &&
              r.targetId === category.id,
      );

      // Determine role based on relationship type
      let role: CategoryRole = 'context';
      let strength = 0.5;

      if (toCore) {
        switch (toCore.type) {
          case 'causal':
            role = 'condition';
            break;
          case 'conditional':
            role = 'context';
            break;
          case 'sequential':
            role = 'strategy';
            break;
          default:
            role = 'context';
        }
        strength = toCore.strength;
      } else if (fromCore) {
        switch (fromCore.type) {
          case 'causal':
            role = 'consequence';
            break;
          case 'conditional':
            role = 'moderator';
            break;
          default:
            role = 'mediator';
        }
        strength = fromCore.strength;
      }

      integrations.push({
        categoryId: category.id,
        role,
        strength,
        narrativePosition: this.getNarrativePosition(role),
      });
    }

    return integrations;
  }

  /**
   * Get narrative position description for a role
   */
  private getNarrativePosition(role: CategoryRole): string {
    switch (role) {
      case 'condition':
        return 'Precedes and enables the core phenomenon';
      case 'context':
        return 'Provides the setting for the core phenomenon';
      case 'strategy':
        return 'Represents actions taken in response to the core phenomenon';
      case 'consequence':
        return 'Results from the core phenomenon';
      case 'mediator':
        return 'Transmits the effect of the core phenomenon';
      case 'moderator':
        return 'Influences the strength of the core phenomenon';
    }
  }

  /**
   * Generate storyline narrative
   */
  private generateStoryline(
    coreCategory: CoreCategory,
    integrations: readonly CategoryIntegration[],
    categories: readonly AxialCategory[],
  ): string {
    const conditions = integrations.filter((i) => i.role === 'condition');
    const contexts = integrations.filter((i) => i.role === 'context');
    const strategies = integrations.filter((i) => i.role === 'strategy');
    const consequences = integrations.filter((i) => i.role === 'consequence');

    const getCategoryLabel = (id: string) =>
      categories.find((c) => c.id === id)?.label || id;

    const parts: string[] = [
      `The central phenomenon of "${coreCategory.label}" emerges from this analysis.`,
    ];

    if (conditions.length > 0) {
      const conditionLabels = conditions.map((c) => getCategoryLabel(c.categoryId)).join(', ');
      parts.push(`It is preceded by conditions including ${conditionLabels}.`);
    }

    if (contexts.length > 0) {
      const contextLabels = contexts.map((c) => getCategoryLabel(c.categoryId)).join(', ');
      parts.push(`The context is characterized by ${contextLabels}.`);
    }

    if (strategies.length > 0) {
      const strategyLabels = strategies.map((c) => getCategoryLabel(c.categoryId)).join(', ');
      parts.push(`Actors respond through strategies involving ${strategyLabels}.`);
    }

    if (consequences.length > 0) {
      const consequenceLabels = consequences.map((c) => getCategoryLabel(c.categoryId)).join(', ');
      parts.push(`This leads to consequences including ${consequenceLabels}.`);
    }

    return parts.join(' ');
  }

  /**
   * Check theoretical saturation
   */
  private checkTheoreticalSaturation(
    openCoding: OpenCodingResult,
    axialCoding: AxialCodingResult,
  ): boolean {
    // Saturation criteria:
    // 1. All codes are assigned to categories
    // 2. Paradigm model is reasonably complete
    // 3. Relationships are established

    const allCodesAssigned = axialCoding.categories.reduce(
      (acc, c) => acc + c.openCodeIds.length,
      0,
    ) >= openCoding.codes.length * 0.8;

    const paradigmComplete = axialCoding.paradigmCompleteness >= 0.6;

    const relationshipsEstablished = axialCoding.relationships.length >=
      axialCoding.categories.length - 1;

    return allCodesAssigned && paradigmComplete && relationshipsEstablished;
  }

  // ============================================================================
  // PRIVATE: THEORETICAL FRAMEWORK
  // ============================================================================

  /**
   * Generate theoretical framework from coding results
   */
  private generateTheoreticalFramework(
    axialCoding: AxialCodingResult,
    selectiveCoding: SelectiveCodingResult,
  ): TheoreticalFramework {
    // Create constructs from categories
    const constructs = this.createConstructs(axialCoding.categories);

    // Create propositions from relationships
    const propositions = this.createPropositions(
      axialCoding.relationships,
      constructs,
    );

    // Identify boundary conditions
    const boundaryConditions = this.identifyBoundaryConditions(
      axialCoding.categories,
    );

    // Generate diagram
    const diagramMermaid = this.generateMermaidDiagram(
      selectiveCoding.coreCategory,
      constructs,
      propositions,
    );

    return {
      id: `framework_${Date.now()}`,
      name: `Theory of ${selectiveCoding.coreCategory.label}`,
      description: selectiveCoding.storyline,
      coreConstruct: selectiveCoding.coreCategory.label,
      constructs,
      propositions,
      boundaryConditions,
      diagramMermaid,
    };
  }

  /**
   * Create theoretical constructs from categories
   */
  private createConstructs(categories: readonly AxialCategory[]): TheoreticalConstruct[] {
    return categories.map((category) => ({
      id: `construct_${category.id}`,
      name: category.label,
      definition: category.description,
      dimensions: [
        ...category.causalConditions.slice(0, 2),
        ...category.consequences.slice(0, 2),
      ],
      indicators: category.subcategories.slice(0, 5),
      sourceCategoryIds: [category.id],
    }));
  }

  /**
   * Create theoretical propositions from relationships
   */
  private createPropositions(
    relationships: readonly CategoryRelationship[],
    constructs: readonly TheoreticalConstruct[],
  ): TheoreticalProposition[] {
    return relationships.map((relationship, index) => {
      const sourceConstruct = constructs.find(
        (c) => c.sourceCategoryIds.includes(relationship.sourceId),
      );
      const targetConstruct = constructs.find(
        (c) => c.sourceCategoryIds.includes(relationship.targetId),
      );

      // Map relationship type to proposition type
      let relationshipType: TheoreticalProposition['relationshipType'];
      switch (relationship.type) {
        case 'causal':
          relationshipType = 'positive';
          break;
        case 'conditional':
          relationshipType = 'conditional';
          break;
        case 'bidirectional':
          relationshipType = 'moderating';
          break;
        default:
          relationshipType = 'positive';
      }

      return {
        id: `prop_${index + 1}`,
        statement: `${sourceConstruct?.name || relationship.sourceId} ` +
          `${relationship.type === 'causal' ? 'leads to' : 'is associated with'} ` +
          `${targetConstruct?.name || relationship.targetId}`,
        constructIds: [
          sourceConstruct?.id || `construct_${relationship.sourceId}`,
          targetConstruct?.id || `construct_${relationship.targetId}`,
        ],
        relationshipType,
        evidenceStrength: relationship.strength,
        testability: this.calculateTestability(relationship),
      };
    });
  }

  /**
   * Calculate testability of a proposition
   */
  private calculateTestability(relationship: CategoryRelationship): number {
    // Higher testability for causal and sequential relationships
    let base = 0.5;

    switch (relationship.type) {
      case 'causal':
        base = 0.8;
        break;
      case 'sequential':
        base = 0.7;
        break;
      case 'conditional':
        base = 0.6;
        break;
      case 'bidirectional':
        base = 0.5;
        break;
      case 'hierarchical':
        base = 0.4;
        break;
    }

    // Adjust by evidence strength
    return Math.min(1, base * (0.5 + relationship.strength * 0.5));
  }

  /**
   * Identify boundary conditions
   */
  private identifyBoundaryConditions(
    categories: readonly AxialCategory[],
  ): string[] {
    const conditions: string[] = [];

    for (const category of categories) {
      // Add context elements as boundary conditions
      for (const ctx of category.context.slice(0, 2)) {
        conditions.push(`Context: ${ctx}`);
      }

      // Add intervening conditions
      for (const iv of category.interveningConditions.slice(0, 2)) {
        conditions.push(`Condition: ${iv}`);
      }
    }

    return [...new Set(conditions)].slice(0, 10);
  }

  /**
   * Generate Mermaid diagram
   */
  private generateMermaidDiagram(
    coreCategory: CoreCategory,
    constructs: readonly TheoreticalConstruct[],
    propositions: readonly TheoreticalProposition[],
  ): string {
    const lines: string[] = [
      'graph TD',
      `    Core["${coreCategory.label}"]`,
      '',
    ];

    // Add constructs
    for (const construct of constructs) {
      if (construct.name !== coreCategory.label) {
        const nodeId = construct.id.replace(/[^a-zA-Z0-9]/g, '');
        lines.push(`    ${nodeId}["${construct.name}"]`);
      }
    }

    lines.push('');

    // Add relationships
    for (const prop of propositions) {
      const sourceId = prop.constructIds[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'Unknown';
      const targetId = prop.constructIds[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'Unknown';

      let arrow = '-->';
      if (prop.relationshipType === 'conditional') {
        arrow = '-.->';
      } else if (prop.relationshipType === 'moderating') {
        arrow = '<-->';
      }

      lines.push(`    ${sourceId} ${arrow} ${targetId}`);
    }

    // Style core category
    lines.push('');
    lines.push('    style Core fill:#f9f,stroke:#333,stroke-width:4px');

    return lines.join('\n');
  }

  // ============================================================================
  // PRIVATE: HYPOTHESIS GENERATION
  // ============================================================================

  /**
   * Generate hypotheses from theoretical framework
   */
  private generateHypothesesFromFramework(
    framework: TheoreticalFramework,
    config: GroundedTheoryConfig,
  ): GeneratedHypothesis[] {
    const hypotheses: GeneratedHypothesis[] = [];

    // Generate hypothesis from each proposition
    for (const proposition of framework.propositions) {
      if (proposition.evidenceStrength >= 0.3) {
        const hypothesis = this.createHypothesisFromProposition(
          proposition,
          framework.constructs,
        );
        hypotheses.push(hypothesis);
      }
    }

    // Generate interaction hypotheses from multiple propositions
    if (framework.propositions.length >= config.minPropositionsForHypothesis) {
      const interactionHypotheses = this.generateInteractionHypotheses(
        framework.propositions,
        framework.constructs,
      );
      hypotheses.push(...interactionHypotheses);
    }

    return hypotheses;
  }

  /**
   * Create hypothesis from a single proposition
   */
  private createHypothesisFromProposition(
    proposition: TheoreticalProposition,
    constructs: readonly TheoreticalConstruct[],
  ): GeneratedHypothesis {
    // Determine hypothesis type based on proposition relationship
    let type: HypothesisType;
    switch (proposition.relationshipType) {
      case 'positive':
      case 'negative':
        type = 'causal';
        break;
      case 'conditional':
        type = 'conditional';
        break;
      case 'moderating':
        type = 'moderating';
        break;
      default:
        type = 'correlational';
    }

    // Create variables
    const variables: HypothesisVariable[] = proposition.constructIds.map((id, index) => {
      const construct = constructs.find((c) => c.id === id);
      return {
        name: construct?.name || id,
        role: index === 0 ? 'independent' : 'dependent',
        constructId: id,
      };
    });

    // Calculate novelty (inverse of evidence strength - less evidence = more novel)
    const novelty = 1 - proposition.evidenceStrength;

    return {
      id: `hyp_${proposition.id}`,
      statement: this.generateHypothesisStatement(proposition, type),
      type,
      variables,
      grounding: [`Based on proposition: ${proposition.statement}`],
      testability: proposition.testability,
      novelty,
      sourcePropositionIds: [proposition.id],
    };
  }

  /**
   * Generate hypothesis statement
   */
  private generateHypothesisStatement(
    proposition: TheoreticalProposition,
    type: HypothesisType,
  ): string {
    const baseStatement = proposition.statement;

    switch (type) {
      case 'causal':
        return `H: ${baseStatement.replace('is associated with', 'positively influences')}`;
      case 'correlational':
        return `H: There is a significant relationship between ${baseStatement.split(' ').slice(0, 3).join(' ')} and ${baseStatement.split(' ').slice(-3).join(' ')}`;
      case 'conditional':
        return `H: ${baseStatement}, under specific conditions`;
      case 'moderating':
        return `H: The relationship in "${baseStatement}" is moderated by contextual factors`;
      case 'mediating':
        return `H: ${baseStatement.split(' ')[0]} influences outcomes through mediating mechanisms`;
      default:
        return `H: ${baseStatement}`;
    }
  }

  /**
   * Generate interaction hypotheses from multiple propositions
   */
  private generateInteractionHypotheses(
    propositions: readonly TheoreticalProposition[],
    constructs: readonly TheoreticalConstruct[],
  ): GeneratedHypothesis[] {
    const hypotheses: GeneratedHypothesis[] = [];

    // Find propositions that share constructs
    for (let i = 0; i < propositions.length; i++) {
      for (let j = i + 1; j < propositions.length; j++) {
        const propA = propositions[i];
        const propB = propositions[j];

        // Check for shared construct
        const shared = propA.constructIds.filter((id) =>
          propB.constructIds.includes(id),
        );

        if (shared.length > 0) {
          const mediator = constructs.find((c) => c.id === shared[0]);

          hypotheses.push({
            id: `hyp_interaction_${i}_${j}`,
            statement: `H: ${mediator?.name || shared[0]} mediates the relationship between the independent and dependent variables from propositions ${propA.id} and ${propB.id}`,
            type: 'mediating',
            variables: [
              ...propA.constructIds.map((id) => ({
                name: constructs.find((c) => c.id === id)?.name || id,
                role: 'independent' as const,
                constructId: id,
              })),
              {
                name: mediator?.name || shared[0],
                role: 'mediator' as const,
                constructId: shared[0],
              },
            ],
            grounding: [
              `Interaction between: ${propA.statement}`,
              `And: ${propB.statement}`,
            ],
            testability: (propA.testability + propB.testability) / 2,
            novelty: Math.max(1 - propA.evidenceStrength, 1 - propB.evidenceStrength),
            sourcePropositionIds: [propA.id, propB.id],
          });
        }
      }
    }

    return hypotheses.slice(0, 5); // Limit interaction hypotheses
  }

  // ============================================================================
  // PRIVATE: QUALITY METRICS
  // ============================================================================

  /**
   * Calculate grounded theory quality metrics
   */
  private calculateQualityMetrics(
    openCoding: OpenCodingResult,
    axialCoding: AxialCodingResult,
    selectiveCoding: SelectiveCodingResult,
    framework: TheoreticalFramework,
    hypotheses: readonly GeneratedHypothesis[],
  ): GroundedTheoryQualityMetrics {
    // Sampling adequacy
    const samplingAdequacy = Math.min(1, openCoding.codes.length / 20);

    // Coding density
    const codingDensity = openCoding.codingDensity;

    // Category completeness
    const totalCodesCategorized = axialCoding.categories.reduce(
      (acc, c) => acc + c.openCodeIds.length,
      0,
    );
    const categoryCompleteness = openCoding.codes.length > 0
      ? totalCodesCategorized / openCoding.codes.length
      : 0;

    // Paradigm completeness
    const paradigmCompleteness = axialCoding.paradigmCompleteness;

    // Core category centrality
    const coreCategoryCentrality = selectiveCoding.coreCategory.centrality;

    // Theoretical saturation
    const theoreticalSaturation = selectiveCoding.theoreticalSaturation ? 1 : 0.5;

    // Framework coherence
    const frameworkCoherence = framework.propositions.length > 0
      ? framework.propositions.reduce((acc, p) => acc + p.evidenceStrength, 0) /
        framework.propositions.length
      : 0;

    // Overall quality
    const overallQuality =
      samplingAdequacy * 0.1 +
      categoryCompleteness * 0.15 +
      paradigmCompleteness * 0.2 +
      coreCategoryCentrality * 0.2 +
      theoreticalSaturation * 0.2 +
      frameworkCoherence * 0.15;

    return {
      samplingAdequacy,
      codingDensity,
      categoryCompleteness,
      paradigmCompleteness,
      coreCategoryCentrality,
      theoreticalSaturation,
      frameworkCoherence,
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
