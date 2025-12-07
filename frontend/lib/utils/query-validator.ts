/**
 * Query Validator - Netflix-Grade
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 10.104: Netflix-Grade Search Bar Optimization
 *
 * Features:
 * - Real-time query validation (debounced)
 * - Quality score calculation (0-100)
 * - Constructive warnings and suggestions
 * - Academic search best practices
 * - Special character handling
 * - Boolean operator validation
 *
 * Inspired by: Google Scholar, PubMed, Web of Science query builders
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface QueryValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100 (quality score)
  metadata: {
    length: number;
    wordCount: number;
    hasBooleanOperators: boolean;
    hasQuotes: boolean;
    hasSpecialChars: boolean;
  };
}

export interface QueryQualityMetrics {
  specificity: number; // 0-100
  completeness: number; // 0-100
  complexity: number; // 0-100
  overallScore: number; // 0-100
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 500;
const OPTIMAL_WORD_COUNT_MIN = 2;
const OPTIMAL_WORD_COUNT_MAX = 10;

// Boolean operators (academic search standard)
const BOOLEAN_OPERATORS = ['AND', 'OR', 'NOT'];
const BOOLEAN_REGEX = /\b(AND|OR|NOT)\b/g;

// Common academic search patterns
const QUOTED_PHRASE_REGEX = /"([^"]+)"/g;
const WILDCARD_REGEX = /[*?]/g;
const SPECIAL_CHARS_REGEX = /[^\w\s"'*?()\-]/g;

// Stop words (low value for academic search)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'can'
]);

// ═══════════════════════════════════════════════════════════════════════════
// QUERY VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

export class QueryValidator {
  /**
   * Validate search query (Netflix-grade: comprehensive real-time feedback)
   *
   * @param query - Search query string
   * @returns Validation result with warnings, suggestions, and quality score
   *
   * @remarks
   * Validation checks:
   * 1. Length validation (3-500 characters)
   * 2. Word count optimization (2-10 words ideal)
   * 3. Boolean operator syntax
   * 4. Quote matching (paired quotes)
   * 5. Special character warnings
   * 6. Stop word density
   * 7. Query complexity assessment
   */
  static validate(query: string): QueryValidation {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Defensive: Handle null/undefined
    if (!query || typeof query !== 'string') {
      return {
        isValid: false,
        warnings: ['Query is required'],
        suggestions: ['Enter a search term to begin'],
        score: 0,
        metadata: {
          length: 0,
          wordCount: 0,
          hasBooleanOperators: false,
          hasQuotes: false,
          hasSpecialChars: false
        }
      };
    }

    const trimmed = query.trim();
    const length = trimmed.length;
    const words = this.extractWords(trimmed);
    const wordCount = words.length;

    // Metadata extraction
    const hasBooleanOperators = BOOLEAN_REGEX.test(trimmed);
    const hasQuotes = trimmed.includes('"');
    const hasSpecialChars = SPECIAL_CHARS_REGEX.test(trimmed);

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 1: Minimum Length
    // ─────────────────────────────────────────────────────────────────────
    if (length < MIN_QUERY_LENGTH) {
      warnings.push(`Query too short (minimum ${MIN_QUERY_LENGTH} characters)`);
      suggestions.push('Add more specific terms to improve search accuracy');
      score -= 50;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 2: Maximum Length
    // ─────────────────────────────────────────────────────────────────────
    if (length > MAX_QUERY_LENGTH) {
      warnings.push(`Query too long (maximum ${MAX_QUERY_LENGTH} characters)`);
      suggestions.push('Simplify query by focusing on key concepts');
      score -= 30;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 3: Optimal Word Count
    // ─────────────────────────────────────────────────────────────────────
    if (wordCount < OPTIMAL_WORD_COUNT_MIN) {
      warnings.push('Single-word queries may return too many irrelevant results');
      suggestions.push('Add descriptive terms (e.g., "symbolic interactionism theory")');
      score -= 15;
    } else if (wordCount > OPTIMAL_WORD_COUNT_MAX) {
      warnings.push('Very long queries may miss relevant papers');
      suggestions.push('Focus on 2-5 core concepts for best results');
      score -= 10;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 4: Quote Matching
    // ─────────────────────────────────────────────────────────────────────
    const quoteCount = (trimmed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      warnings.push('Unmatched quotation marks');
      suggestions.push('Ensure all quoted phrases have closing quotes');
      score -= 20;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 5: Boolean Operator Syntax
    // ─────────────────────────────────────────────────────────────────────
    if (hasBooleanOperators) {
      const booleanIssues = this.validateBooleanSyntax(trimmed);
      if (booleanIssues.length > 0) {
        warnings.push(...booleanIssues);
        suggestions.push('Use AND/OR/NOT with terms on both sides (e.g., "theory AND practice")');
        score -= 15;
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 6: Special Characters
    // ─────────────────────────────────────────────────────────────────────
    const specialChars = trimmed.match(SPECIAL_CHARS_REGEX);
    if (specialChars && specialChars.length > 0) {
      warnings.push(`Unexpected special characters: ${[...new Set(specialChars)].join(', ')}`);
      suggestions.push('Remove special characters or use quotes for exact phrases');
      score -= 10;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 7: Stop Word Density
    // ─────────────────────────────────────────────────────────────────────
    const stopWordCount = words.filter(word =>
      STOP_WORDS.has(word.toLowerCase()) && !BOOLEAN_OPERATORS.includes(word.toUpperCase())
    ).length;
    const stopWordDensity = wordCount > 0 ? (stopWordCount / wordCount) : 0;

    if (stopWordDensity > 0.5) {
      warnings.push('Query contains many common words with low search value');
      suggestions.push('Focus on specific technical or domain terms');
      score -= 10;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 8: All Caps (possible shouting or boolean confusion)
    // ─────────────────────────────────────────────────────────────────────
    const nonBooleanWords = words.filter(word =>
      !BOOLEAN_OPERATORS.includes(word.toUpperCase())
    );
    const allCapsWords = nonBooleanWords.filter(word =>
      word === word.toUpperCase() && word.length > 1
    );

    if (allCapsWords.length > 0) {
      suggestions.push('Use standard capitalization for better results');
      score -= 5;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CHECK 9: Empty Query (whitespace only)
    // ─────────────────────────────────────────────────────────────────────
    if (length === 0) {
      warnings.push('Query cannot be empty');
      score = 0;
    }

    // ─────────────────────────────────────────────────────────────────────
    // POSITIVE SIGNALS (increase score)
    // ─────────────────────────────────────────────────────────────────────

    // Bonus: Quoted phrases (indicates precision)
    const quotedPhrases = trimmed.match(QUOTED_PHRASE_REGEX) || [];
    if (quotedPhrases.length > 0 && quoteCount % 2 === 0) {
      score = Math.min(100, score + 5);
      suggestions.push('Good: Using quoted phrases for exact matching');
    }

    // Bonus: Boolean operators (indicates advanced usage)
    if (hasBooleanOperators && this.validateBooleanSyntax(trimmed).length === 0) {
      score = Math.min(100, score + 5);
      suggestions.push('Good: Using Boolean operators for precise control');
    }

    // ─────────────────────────────────────────────────────────────────────
    // FINAL VALIDATION
    // ─────────────────────────────────────────────────────────────────────

    // Ensure score is in valid range
    score = Math.max(0, Math.min(100, score));

    // Query is valid if it meets minimum requirements
    const isValid = length >= MIN_QUERY_LENGTH &&
                    length <= MAX_QUERY_LENGTH &&
                    quoteCount % 2 === 0 &&
                    score >= 30; // Minimum acceptable score

    logger.debug('Query validation complete', 'QueryValidator', {
      query: trimmed.substring(0, 50), // Log first 50 chars only
      score,
      isValid,
      warningCount: warnings.length
    });

    return {
      isValid,
      warnings,
      suggestions,
      score,
      metadata: {
        length,
        wordCount,
        hasBooleanOperators,
        hasQuotes,
        hasSpecialChars
      }
    };
  }

  /**
   * Calculate detailed quality metrics
   *
   * @param query - Search query string
   * @returns Quality metrics breakdown
   */
  static calculateQualityMetrics(query: string): QueryQualityMetrics {
    const trimmed = query.trim();
    const words = this.extractWords(trimmed);
    const wordCount = words.length;

    // ─────────────────────────────────────────────────────────────────────
    // METRIC 1: Specificity (0-100)
    // ─────────────────────────────────────────────────────────────────────
    // Higher score = more specific terms (longer words, technical terms)
    const avgWordLength = wordCount > 0
      ? words.reduce((sum, word) => sum + word.length, 0) / wordCount
      : 0;
    const specificity = Math.min(100, Math.round(avgWordLength * 15));

    // ─────────────────────────────────────────────────────────────────────
    // METRIC 2: Completeness (0-100)
    // ─────────────────────────────────────────────────────────────────────
    // Optimal word count = 100%, too few or too many = lower score
    let completeness = 100;
    if (wordCount < OPTIMAL_WORD_COUNT_MIN) {
      completeness = Math.round((wordCount / OPTIMAL_WORD_COUNT_MIN) * 100);
    } else if (wordCount > OPTIMAL_WORD_COUNT_MAX) {
      completeness = Math.max(50, 100 - ((wordCount - OPTIMAL_WORD_COUNT_MAX) * 5));
    }

    // ─────────────────────────────────────────────────────────────────────
    // METRIC 3: Complexity (0-100)
    // ─────────────────────────────────────────────────────────────────────
    // Measures use of advanced features (boolean, quotes, wildcards)
    let complexity = 50; // Baseline
    if (BOOLEAN_REGEX.test(trimmed)) complexity += 20;
    if (QUOTED_PHRASE_REGEX.test(trimmed)) complexity += 15;
    if (WILDCARD_REGEX.test(trimmed)) complexity += 15;
    complexity = Math.min(100, complexity);

    // ─────────────────────────────────────────────────────────────────────
    // OVERALL SCORE
    // ─────────────────────────────────────────────────────────────────────
    // Weighted average: Specificity (40%), Completeness (40%), Complexity (20%)
    const overallScore = Math.round(
      specificity * 0.4 +
      completeness * 0.4 +
      complexity * 0.2
    );

    return {
      specificity,
      completeness,
      complexity,
      overallScore
    };
  }

  /**
   * Get constructive suggestions for improving query
   *
   * @param query - Search query string
   * @returns Array of actionable suggestions
   */
  static getSuggestions(query: string): string[] {
    const validation = this.validate(query);
    const suggestions: string[] = [];

    // If already high quality, give encouragement
    if (validation.score >= 80) {
      suggestions.push('✓ High-quality query - excellent search specificity');
      return suggestions;
    }

    // Provide actionable suggestions based on validation results
    if (validation.metadata.wordCount === 1) {
      suggestions.push('Add context: Consider "symbolic interactionism theory" vs just "symbolic"');
    }

    if (!validation.metadata.hasBooleanOperators && validation.metadata.wordCount > 3) {
      suggestions.push('Use AND/OR to combine concepts: "machine learning AND healthcare"');
    }

    if (!validation.metadata.hasQuotes) {
      suggestions.push('Use quotes for phrases: "artificial intelligence" (not artificial intelligence)');
    }

    // Add suggestions from validation
    suggestions.push(...validation.suggestions.filter(s => !s.startsWith('Good:')));

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Extract words from query (handles quotes, boolean operators)
   */
  private static extractWords(query: string): string[] {
    // Remove quoted phrases temporarily
    const withoutQuotes = query.replace(QUOTED_PHRASE_REGEX, '');

    // Split on whitespace and filter empty strings
    return withoutQuotes
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Validate boolean operator syntax
   *
   * @returns Array of validation errors (empty if valid)
   */
  private static validateBooleanSyntax(query: string): string[] {
    const errors: string[] = [];

    // Check for boolean operators at start/end
    const trimmed = query.trim();
    if (BOOLEAN_OPERATORS.some(op => trimmed.startsWith(op + ' ') || trimmed.endsWith(' ' + op))) {
      errors.push('Boolean operators (AND/OR/NOT) cannot start or end the query');
    }

    // Check for consecutive boolean operators
    if (/\b(AND|OR|NOT)\s+(AND|OR|NOT)\b/.test(trimmed)) {
      errors.push('Cannot have consecutive boolean operators');
    }

    // Check for NOT without following term
    if (/\bNOT\s*$/.test(trimmed)) {
      errors.push('NOT operator must be followed by a term');
    }

    return errors;
  }

  /**
   * Check if query is likely a common mistake
   */
  static isCommonMistake(query: string): boolean {
    const trimmed = query.trim().toLowerCase();

    // Common mistakes
    const mistakes = [
      /^test$/,           // Just "test"
      /^search$/,         // Just "search"
      /^example$/,        // Just "example"
      /^asdf/,            // Keyboard mashing
      /^qwerty/,          // Keyboard test
      /^111+$/,           // Number repetition
      /^aaa+$/,           // Letter repetition
    ];

    return mistakes.some(pattern => pattern.test(trimmed));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debounced query validator (for real-time UI feedback)
 *
 * @param query - Search query
 * @param callback - Callback to receive validation result
 * @param delayMs - Debounce delay in milliseconds (default: 300ms)
 */
let validationTimeout: NodeJS.Timeout | null = null;

export function validateQueryDebounced(
  query: string,
  callback: (validation: QueryValidation) => void,
  delayMs: number = 300
): void {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  validationTimeout = setTimeout(() => {
    const validation = QueryValidator.validate(query);
    callback(validation);
  }, delayMs);
}

/**
 * Get query quality indicator (for UI badges/labels)
 *
 * @param score - Query quality score (0-100)
 * @returns Quality indicator object
 */
export function getQualityIndicator(score: number): {
  label: string;
  color: 'red' | 'yellow' | 'green';
  emoji: string;
} {
  if (score >= 80) {
    return { label: 'Excellent', color: 'green', emoji: '✓' };
  } else if (score >= 60) {
    return { label: 'Good', color: 'green', emoji: '✓' };
  } else if (score >= 40) {
    return { label: 'Fair', color: 'yellow', emoji: '⚠' };
  } else {
    return { label: 'Poor', color: 'red', emoji: '✗' };
  }
}
