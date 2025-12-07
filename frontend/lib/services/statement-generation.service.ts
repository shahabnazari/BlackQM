/**
 * Statement Generation Service - Phase 10.97 Day 2
 *
 * Enterprise-grade service for generating Q-methodology statements from extracted themes.
 * Maintains full provenance chain: Paper -> Theme -> Statement
 *
 * Features:
 * - Multi-perspective statement generation (supportive, critical, neutral, balanced)
 * - Controversy pair generation for balanced Q-sorts
 * - Full provenance tracking (sourceThemeId, sourcePaperId, citationChain)
 * - Batch generation with transactional safety
 * - Progress tracking for large batches
 *
 * @module StatementGenerationService
 * @since Phase 10.97 Day 2
 */

import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import type { UnifiedTheme, ThemeSource } from '@/lib/api/services/unified-theme-api.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOGGER_CONTEXT = 'StatementGenerationService';

/** Maximum statements to generate per API call */
const MAX_BATCH_SIZE = 50;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Statement perspective for Q-methodology */
export type StatementPerspective = 'supportive' | 'critical' | 'neutral' | 'balanced';

/** Generation method for audit trail */
export type GenerationMethod = 'theme-based' | 'ai-augmented' | 'controversy-pair' | 'manual';

/**
 * Provenance data for full audit trail
 * Links statement to its source theme and paper
 */
export interface StatementProvenance {
  readonly sourceThemeId: string;
  readonly sourceThemeLabel: string;
  readonly sourcePaperId: string | null;
  readonly sourcePaperTitle: string | null;
  readonly sourcePaperDOI: string | null;
  readonly sourcePaperAuthors: readonly string[];
  readonly sourcePaperYear: number | null;
  readonly extractedExcerpts: readonly string[];
  readonly generationTimestamp: string;
  readonly aiModel: string;
  readonly confidence: number;
}

/**
 * Generated statement with full provenance
 */
export interface GeneratedStatement {
  readonly id: string;
  readonly text: string;
  readonly perspective: StatementPerspective;
  readonly generationMethod: GenerationMethod;
  readonly confidence: number;
  readonly provenance: StatementProvenance;
  readonly isEdited: boolean;
  readonly editedText?: string;
  readonly order: number;
}

/**
 * Request to generate statements from themes
 */
export interface GenerateStatementsRequest {
  readonly themeIds: readonly string[];
  readonly studyId: string;
  readonly options: GenerationOptions;
}

/**
 * Options for statement generation
 */
export interface GenerationOptions {
  /** Number of statements to generate per theme (1-5) */
  readonly statementsPerTheme: number;
  /** Which perspectives to generate */
  readonly perspectives: readonly StatementPerspective[];
  /** Generate controversy pairs for balanced Q-sorts */
  readonly includeControversyPairs: boolean;
  /** Minimum confidence threshold (0-1) */
  readonly minConfidence: number;
  /** Maximum total statements */
  readonly maxTotalStatements: number;
}

/**
 * Response from statement generation API
 */
export interface GenerateStatementsResponse {
  readonly statements: readonly GeneratedStatement[];
  readonly totalGenerated: number;
  readonly themesProcessed: number;
  readonly generationTime: number;
  readonly warnings: readonly string[];
}

/**
 * Progress update during batch generation
 */
export interface GenerationProgress {
  readonly current: number;
  readonly total: number;
  readonly percentage: number;
  readonly currentTheme: string;
  readonly statementsGenerated: number;
}

/**
 * Request to save statements to a study
 */
export interface SaveStatementsRequest {
  readonly studyId: string;
  readonly statements: readonly GeneratedStatement[];
}

/**
 * Saved statement response from backend
 */
export interface SavedStatement {
  readonly id: string;
  readonly surveyId: string;
  readonly text: string;
  readonly order: number;
  readonly sourceThemeId: string | null;
  readonly sourcePaperId: string | null;
  readonly perspective: StatementPerspective | null;
  readonly generationMethod: GenerationMethod | null;
  readonly confidence: number | null;
  readonly provenance: StatementProvenance | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  statementsPerTheme: 2,
  perspectives: ['supportive', 'neutral'],
  includeControversyPairs: false,
  minConfidence: 0.6,
  maxTotalStatements: 80,
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/** Counter for unique ID generation within session */
let idCounter = 0;

/**
 * Generate a unique statement ID
 * Combines timestamp, random component, and counter to ensure uniqueness
 */
function generateUniqueId(prefix: string = 'stmt'): string {
  idCounter += 1;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}_${idCounter}`;
}

class StatementGenerationService {
  /**
   * Generate Q-statements from extracted themes
   * Calls backend theme-to-statement API with full provenance tracking
   */
  async generateFromThemes(
    themes: readonly UnifiedTheme[],
    studyId: string,
    options: Partial<GenerationOptions> = {},
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GenerateStatementsResponse> {
    const mergedOptions: GenerationOptions = {
      ...DEFAULT_GENERATION_OPTIONS,
      ...options,
    };

    logger.info('Generating statements from themes', LOGGER_CONTEXT, {
      themeCount: themes.length,
      studyId,
      options: mergedOptions,
    });

    try {
      // Prepare request with theme IDs
      const request: GenerateStatementsRequest = {
        themeIds: themes.map((t) => t.id),
        studyId,
        options: mergedOptions,
      };

      // Call backend API
      const response = await apiClient.post<GenerateStatementsResponse>(
        '/literature/themes/generate-statements',
        request
      );

      logger.info('Statements generated successfully', LOGGER_CONTEXT, {
        totalGenerated: response.data.totalGenerated,
        themesProcessed: response.data.themesProcessed,
        generationTime: response.data.generationTime,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate statements from themes', LOGGER_CONTEXT, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback: Generate statements locally if backend fails
      return this.generateLocally(themes, mergedOptions, onProgress);
    }
  }

  /**
   * Generate statements locally (fallback when backend unavailable)
   * Uses theme data to create statements with provenance
   */
  private async generateLocally(
    themes: readonly UnifiedTheme[],
    options: GenerationOptions,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GenerateStatementsResponse> {
    const startTime = Date.now();
    const statements: GeneratedStatement[] = [];
    const warnings: string[] = [];
    let order = 1;

    const totalThemes = themes.length;
    const maxStatements = options.maxTotalStatements;

    for (let i = 0; i < themes.length && statements.length < maxStatements; i++) {
      const theme = themes[i];

      // TypeScript guard: skip if theme is undefined (defensive)
      if (!theme) continue;

      // Report progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: totalThemes,
          percentage: Math.round(((i + 1) / totalThemes) * 100),
          currentTheme: theme.label,
          statementsGenerated: statements.length,
        });
      }

      // Skip low-confidence themes
      if (theme.confidence < options.minConfidence) {
        warnings.push(`Skipped theme "${theme.label}" due to low confidence (${theme.confidence.toFixed(2)})`);
        continue;
      }

      // Get primary source paper for provenance
      const primarySource = this.getPrimaryPaperSource(theme);

      // Generate statements for each requested perspective
      for (const perspective of options.perspectives) {
        if (statements.length >= maxStatements) break;

        const statement = this.createStatementFromTheme(
          theme,
          perspective,
          primarySource,
          order++
        );
        statements.push(statement);
      }

      // Generate controversy pairs if requested
      if (options.includeControversyPairs && theme.controversial && statements.length < maxStatements - 1) {
        const controversyPair = this.createControversyPair(theme, primarySource, order);
        statements.push(...controversyPair);
        order += 2;
      }
    }

    const generationTime = Date.now() - startTime;

    logger.info('Local statement generation complete', LOGGER_CONTEXT, {
      totalGenerated: statements.length,
      themesProcessed: themes.length,
      generationTime,
      warnings: warnings.length,
    });

    return {
      statements,
      totalGenerated: statements.length,
      themesProcessed: themes.length,
      generationTime,
      warnings,
    };
  }

  /**
   * Get the primary paper source from a theme for provenance
   * Optimized: Uses reduce O(n) instead of sort O(n log n)
   */
  private getPrimaryPaperSource(theme: UnifiedTheme): ThemeSource | null {
    const paperSources = theme.sources.filter((s) => s.sourceType === 'paper');
    if (paperSources.length === 0) return null;

    // Use reduce to find max in O(n) instead of sort's O(n log n)
    return paperSources.reduce<ThemeSource | null>((max, current) => {
      if (!max || current.influence > max.influence) {
        return current;
      }
      return max;
    }, null);
  }

  /**
   * Create a statement from a theme with full provenance
   */
  private createStatementFromTheme(
    theme: UnifiedTheme,
    perspective: StatementPerspective,
    primarySource: ThemeSource | null,
    order: number
  ): GeneratedStatement {
    const statementText = this.generateStatementText(theme, perspective);

    const provenance: StatementProvenance = {
      sourceThemeId: theme.id,
      sourceThemeLabel: theme.label,
      sourcePaperId: primarySource?.sourceId || null,
      sourcePaperTitle: primarySource?.sourceTitle || null,
      sourcePaperDOI: primarySource?.doi || null,
      sourcePaperAuthors: primarySource?.authors || [],
      sourcePaperYear: primarySource?.year || null,
      extractedExcerpts: primarySource?.excerpts || [],
      generationTimestamp: new Date().toISOString(),
      aiModel: 'local-template',
      confidence: theme.confidence,
    };

    return {
      id: generateUniqueId('stmt'),
      text: statementText,
      perspective,
      generationMethod: 'theme-based',
      confidence: theme.confidence,
      provenance,
      isEdited: false,
      order,
    };
  }

  /**
   * Generate statement text from theme based on perspective
   */
  private generateStatementText(theme: UnifiedTheme, perspective: StatementPerspective): string {
    const description = theme.description || theme.label;

    switch (perspective) {
      case 'supportive':
        return `${description} is an important consideration in this context.`;
      case 'critical':
        return `The significance of ${theme.label.toLowerCase()} is often overemphasized.`;
      case 'neutral':
        return `${description}`;
      case 'balanced':
        return `There are both benefits and drawbacks to ${theme.label.toLowerCase()}.`;
      default:
        return description;
    }
  }

  /**
   * Create a controversy pair for balanced Q-sorts
   */
  private createControversyPair(
    theme: UnifiedTheme,
    primarySource: ThemeSource | null,
    startOrder: number
  ): [GeneratedStatement, GeneratedStatement] {
    const baseProvenance: StatementProvenance = {
      sourceThemeId: theme.id,
      sourceThemeLabel: theme.label,
      sourcePaperId: primarySource?.sourceId || null,
      sourcePaperTitle: primarySource?.sourceTitle || null,
      sourcePaperDOI: primarySource?.doi || null,
      sourcePaperAuthors: primarySource?.authors || [],
      sourcePaperYear: primarySource?.year || null,
      extractedExcerpts: primarySource?.excerpts || [],
      generationTimestamp: new Date().toISOString(),
      aiModel: 'local-template',
      confidence: theme.confidence * 0.9, // Slightly lower confidence for controversy pairs
    };

    const supportive: GeneratedStatement = {
      id: generateUniqueId('stmt_pro'),
      text: `${theme.label} plays a crucial positive role in achieving desired outcomes.`,
      perspective: 'supportive',
      generationMethod: 'controversy-pair',
      confidence: theme.confidence * 0.9,
      provenance: baseProvenance,
      isEdited: false,
      order: startOrder,
    };

    const critical: GeneratedStatement = {
      id: generateUniqueId('stmt_con'),
      text: `${theme.label} can have negative consequences that outweigh its benefits.`,
      perspective: 'critical',
      generationMethod: 'controversy-pair',
      confidence: theme.confidence * 0.9,
      provenance: baseProvenance,
      isEdited: false,
      order: startOrder + 1,
    };

    return [supportive, critical];
  }

  /**
   * Save generated statements to a study
   * Uses transactional bulk insert for data integrity
   */
  async saveToStudy(
    studyId: string,
    statements: readonly GeneratedStatement[]
  ): Promise<SavedStatement[]> {
    logger.info('Saving statements to study', LOGGER_CONTEXT, {
      studyId,
      statementCount: statements.length,
    });

    try {
      // Prepare statements for backend API
      const statementData = statements.map((stmt) => ({
        text: stmt.isEdited && stmt.editedText ? stmt.editedText : stmt.text,
        order: stmt.order,
        sourceThemeId: stmt.provenance.sourceThemeId,
        sourcePaperId: stmt.provenance.sourcePaperId,
        perspective: stmt.perspective,
        generationMethod: stmt.generationMethod,
        confidence: stmt.confidence,
        provenance: stmt.provenance,
      }));

      // Save in batches if large
      const savedStatements: SavedStatement[] = [];

      for (let i = 0; i < statementData.length; i += MAX_BATCH_SIZE) {
        const batch = statementData.slice(i, i + MAX_BATCH_SIZE);

        const response = await apiClient.post<SavedStatement[]>(
          `/studies/${studyId}/statements`,
          { statements: batch }
        );

        savedStatements.push(...response.data);
      }

      logger.info('Statements saved successfully', LOGGER_CONTEXT, {
        studyId,
        savedCount: savedStatements.length,
      });

      return savedStatements;
    } catch (error) {
      logger.error('Failed to save statements to study', LOGGER_CONTEXT, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        studyId,
      });
      throw error;
    }
  }

  /**
   * Update a statement's text (user editing)
   */
  editStatement(
    statement: GeneratedStatement,
    newText: string
  ): GeneratedStatement {
    return {
      ...statement,
      isEdited: true,
      editedText: newText,
    };
  }

  /**
   * Get recommended number of statements based on Q-methodology best practices
   */
  getRecommendedCount(themeCount: number): { min: number; max: number; recommended: number } {
    // Q-methodology typically uses 30-80 statements
    // Aim for ~1.5-2 statements per theme
    const themeBasedMin = Math.floor(themeCount * 1.2);
    const themeBasedMax = Math.ceil(themeCount * 2.5);

    // Ensure min/max are within Q-methodology bounds (30-80)
    // but also ensure min <= max for small theme counts
    const rawMin = Math.max(30, themeBasedMin);
    const rawMax = Math.min(80, themeBasedMax);

    // Critical: Ensure min never exceeds max
    const min = Math.min(rawMin, rawMax);
    const max = Math.max(rawMin, rawMax);
    const recommended = Math.round((min + max) / 2);

    return { min, max, recommended };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Singleton instance */
export const statementGenerationService = new StatementGenerationService();

/** Export class for testing */
export { StatementGenerationService };
