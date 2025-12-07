/**
 * Error Classifier Service - Phase 10.93 Day 4
 *
 * Enterprise-grade error classification for user-friendly error handling.
 * Categorizes errors and provides actionable user messages.
 *
 * @module theme-extraction/ErrorClassifierService
 * @since Phase 10.93 Day 4
 *
 * **Purpose:**
 * - Classify errors into categories (network, auth, rate limit, etc.)
 * - Determine if error is retryable
 * - Provide user-friendly error messages
 * - Suggest recovery actions
 *
 * **Usage:**
 * ```typescript
 * const classifier = new ErrorClassifierService();
 * const classification = classifier.classify(error);
 *
 * if (classification.isRetryable) {
 *   // Retry operation
 *   toast.warning(classification.userMessage);
 * } else {
 *   // Show error and suggested action
 *   toast.error(classification.userMessage, {
 *     description: classification.suggestedAction,
 *   });
 * }
 * ```
 */

import { logger } from '@/lib/utils/logger';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  /** Transient network errors - RETRY */
  TRANSIENT = 'transient',

  /** Rate limiting errors - WAIT AND RETRY */
  RATE_LIMIT = 'rate_limit',

  /** Authentication/authorization errors - SHOW LOGIN */
  AUTHENTICATION = 'auth',

  /** Resource not found - SKIP */
  NOT_FOUND = 'not_found',

  /** Server errors (5xx) - RETRY WITH BACKOFF */
  SERVER_ERROR = 'server',

  /** Client errors (4xx, not 401/403/404/429) - SKIP */
  CLIENT_ERROR = 'client',

  /** Validation errors - SHOW ERROR */
  VALIDATION = 'validation',

  /** Timeout errors - RETRY */
  TIMEOUT = 'timeout',

  /** Cancellation (user-initiated) - NO ACTION */
  CANCELLATION = 'cancellation',

  /** Unknown errors - LOG AND RETRY ONCE */
  UNKNOWN = 'unknown',
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  /** Error category */
  category: ErrorCategory;

  /** Whether error is retryable */
  isRetryable: boolean;

  /** User-friendly error message */
  userMessage: string;

  /** Suggested action for user or system */
  suggestedAction: string;

  /** Recommended retry delay in milliseconds (if retryable) */
  retryDelayMs?: number;

  /** Original error message (for logging) */
  originalError: string;
}

/**
 * Error pattern matching rules
 */
interface ErrorPattern {
  /** Regular expressions to match error messages */
  patterns: RegExp[];

  /** Error category */
  category: ErrorCategory;

  /** User-friendly message template */
  userMessage: string;

  /** Suggested action */
  suggestedAction: string;

  /** Is retryable */
  isRetryable: boolean;

  /** Retry delay (if retryable) */
  retryDelayMs?: number;
}

/**
 * Error classification rules
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // CANCELLATION (user-initiated)
  {
    patterns: [/cancel/i, /abort/i, /user.*cancel/i, /operation.*cancelled/i],
    category: ErrorCategory.CANCELLATION,
    userMessage: 'Operation cancelled',
    suggestedAction: 'No action required',
    isRetryable: false,
  },

  // AUTHENTICATION
  {
    patterns: [
      /401/,
      /403/,
      /unauthorized/i,
      /forbidden/i,
      /authentication.*required/i,
      /authentication.*failed/i,
      /not.*authenticated/i,
      /invalid.*token/i,
      /expired.*token/i,
    ],
    category: ErrorCategory.AUTHENTICATION,
    userMessage: 'Authentication required',
    suggestedAction: 'Please sign in again to continue',
    isRetryable: false,
  },

  // RATE LIMITING
  {
    patterns: [/429/, /rate.*limit/i, /too.*many.*requests/i, /quota.*exceeded/i],
    category: ErrorCategory.RATE_LIMIT,
    userMessage: 'Rate limit reached',
    suggestedAction: 'Waiting before retrying automatically...',
    isRetryable: true,
    retryDelayMs: 30000, // 30 seconds
  },

  // NOT FOUND
  {
    patterns: [/404/, /not.*found/i, /does.*not.*exist/i, /resource.*not.*found/i],
    category: ErrorCategory.NOT_FOUND,
    userMessage: 'Resource not found',
    suggestedAction: 'This item may have been removed',
    isRetryable: false,
  },

  // TIMEOUT
  {
    patterns: [
      /timeout/i,
      /timed.*out/i,
      /ETIMEDOUT/,
      /operation.*took.*too.*long/i,
      /request.*timeout/i,
    ],
    category: ErrorCategory.TIMEOUT,
    userMessage: 'Request timed out',
    suggestedAction: 'Retrying automatically...',
    isRetryable: true,
    retryDelayMs: 2000, // 2 seconds
  },

  // NETWORK/TRANSIENT
  {
    patterns: [
      /network/i,
      /connection/i,
      /ECONNREFUSED/,
      /ENOTFOUND/,
      /ECONNRESET/,
      /socket.*hang.*up/i,
      /fetch.*failed/i,
      /failed.*to.*fetch/i,
    ],
    category: ErrorCategory.TRANSIENT,
    userMessage: 'Network connection issue',
    suggestedAction: 'Retrying automatically...',
    isRetryable: true,
    retryDelayMs: 1000, // 1 second
  },

  // SERVER ERRORS (5xx)
  {
    patterns: [
      /500/,
      /502/,
      /503/,
      /504/,
      /internal.*server.*error/i,
      /bad.*gateway/i,
      /service.*unavailable/i,
      /gateway.*timeout/i,
      /server.*error/i,
    ],
    category: ErrorCategory.SERVER_ERROR,
    userMessage: 'Server error',
    suggestedAction: 'Retrying automatically...',
    isRetryable: true,
    retryDelayMs: 5000, // 5 seconds (longer for server recovery)
  },

  // VALIDATION
  {
    patterns: [
      /validation/i,
      /invalid.*input/i,
      /invalid.*data/i,
      /invalid.*format/i,
      /required.*field/i,
      /must.*be/i,
    ],
    category: ErrorCategory.VALIDATION,
    userMessage: 'Invalid input',
    suggestedAction: 'Please check your input and try again',
    isRetryable: false,
  },

  // CLIENT ERRORS (4xx, not covered above)
  {
    patterns: [
      /400/,
      /402/,
      /405/,
      /406/,
      /407/,
      /408/,
      /409/,
      /410/,
      /411/,
      /412/,
      /413/,
      /414/,
      /415/,
      /416/,
      /417/,
      /bad.*request/i,
      /conflict/i,
      /gone/i,
      /payload.*too.*large/i,
    ],
    category: ErrorCategory.CLIENT_ERROR,
    userMessage: 'Invalid request',
    suggestedAction: 'Please try a different action',
    isRetryable: false,
  },
];

/**
 * Error Classifier Service
 *
 * Classifies errors into categories and provides user-friendly messages.
 *
 * **Classification Process:**
 * 1. Extract error message from Error object
 * 2. Match against known error patterns
 * 3. Determine category, retryability, user message
 * 4. Return classification result
 *
 * **Enterprise Features:**
 * - Comprehensive error pattern matching
 * - User-friendly messages (no technical jargon)
 * - Actionable suggestions
 * - Retry delay recommendations
 * - Unknown error handling (conservative retry)
 */
export class ErrorClassifierService {
  /**
   * Classify an error
   *
   * @param error - Error to classify
   * @returns Classification result with category, message, and suggested action
   *
   * @example
   * ```typescript
   * const classifier = new ErrorClassifierService();
   *
   * try {
   *   await fetchData();
   * } catch (error) {
   *   const classification = classifier.classify(error as Error);
   *
   *   logger.error('Operation failed', 'MyService', {
   *     category: classification.category,
   *     isRetryable: classification.isRetryable,
   *   });
   *
   *   toast.error(classification.userMessage, {
   *     description: classification.suggestedAction,
   *   });
   * }
   * ```
   */
  public classify(error: Error): ErrorClassification {
    const errorMessage = error.message || String(error);

    logger.debug('Classifying error', 'ErrorClassifierService', {
      errorMessage: errorMessage.substring(0, 100),
    });

    // Match against known patterns
    for (const pattern of ERROR_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(errorMessage)) {
          logger.debug('Error pattern matched', 'ErrorClassifierService', {
            category: pattern.category,
            pattern: regex.toString(),
          });

          // Build classification, only including retryDelayMs if defined
          const classification: ErrorClassification = {
            category: pattern.category,
            isRetryable: pattern.isRetryable,
            userMessage: pattern.userMessage,
            suggestedAction: pattern.suggestedAction,
            originalError: errorMessage,
          };

          // Only include retryDelayMs if it's defined (exactOptionalPropertyTypes compliance)
          if (pattern.retryDelayMs !== undefined) {
            classification.retryDelayMs = pattern.retryDelayMs;
          }

          return classification;
        }
      }
    }

    // Unknown error - be conservative and allow one retry
    logger.warn('Unknown error pattern', 'ErrorClassifierService', {
      errorMessage: errorMessage.substring(0, 200),
    });

    return {
      category: ErrorCategory.UNKNOWN,
      isRetryable: true, // Conservative: allow retry once
      userMessage: 'An unexpected error occurred',
      suggestedAction: 'Please try again',
      retryDelayMs: 1000, // 1 second
      originalError: errorMessage,
    };
  }

  /**
   * Get user-friendly error message with action
   *
   * Convenience method that combines userMessage and suggestedAction.
   *
   * @param error - Error to classify
   * @returns Combined message string
   *
   * @example
   * ```typescript
   * const message = classifier.getUserFriendlyMessage(error);
   * toast.error(message);
   * // Output: "Network connection issue. Retrying automatically..."
   * ```
   */
  public getUserFriendlyMessage(error: Error): string {
    const classification = this.classify(error);
    return `${classification.userMessage}. ${classification.suggestedAction}`;
  }

  /**
   * Check if error is retryable
   *
   * Convenience method for quick retry decision.
   *
   * @param error - Error to check
   * @returns true if error should be retried
   *
   * @example
   * ```typescript
   * if (classifier.isRetryable(error)) {
   *   await retryService.executeWithRetry(() => operation());
   * } else {
   *   toast.error('Operation failed permanently');
   * }
   * ```
   */
  public isRetryable(error: Error): boolean {
    return this.classify(error).isRetryable;
  }

  /**
   * Get recommended retry delay
   *
   * Returns recommended delay before retry, or undefined if not retryable.
   *
   * @param error - Error to check
   * @returns Retry delay in milliseconds, or undefined
   *
   * @example
   * ```typescript
   * const delayMs = classifier.getRetryDelay(error);
   * if (delayMs) {
   *   await new Promise(resolve => setTimeout(resolve, delayMs));
   *   await retryOperation();
   * }
   * ```
   */
  public getRetryDelay(error: Error): number | undefined {
    const classification = this.classify(error);
    return classification.isRetryable ? classification.retryDelayMs : undefined;
  }

  /**
   * Get error category
   *
   * Convenience method to get just the category.
   *
   * @param error - Error to classify
   * @returns Error category
   *
   * @example
   * ```typescript
   * const category = classifier.getCategory(error);
   * if (category === ErrorCategory.AUTHENTICATION) {
   *   redirectToLogin();
   * }
   * ```
   */
  public getCategory(error: Error): ErrorCategory {
    return this.classify(error).category;
  }
}
