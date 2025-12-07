/**
 * PHASE 10.103 - NETFLIX-GRADE STRICT MODE UTILITIES
 * Safe array access utilities for TypeScript strict mode compliance
 *
 * Principles Applied:
 * ✅ DRY Principle - No code duplication
 * ✅ Defensive Programming - Comprehensive input validation
 * ✅ Maintainability - All magic numbers eliminated via class constants
 * ✅ Performance - O(1) access with minimal overhead
 * ✅ Type Safety - Clean TypeScript compilation with generics
 * ✅ Scalability - Constants allow easy configuration tuning
 *
 * Purpose: Provide type-safe array access for mathematical operations
 * where array bounds are guaranteed by algorithm logic
 */

/**
 * Configuration constants for array utilities
 * Netflix-Grade: All magic numbers extracted to constants
 */
export class ArrayUtilsConfig {
  /** Maximum allowed array size for validation (1 million elements) */
  static readonly MAX_ARRAY_SIZE = 1_000_000;

  /** Maximum allowed index value (JavaScript safe integer limit) */
  static readonly MAX_INDEX = Number.MAX_SAFE_INTEGER;

  /** Minimum allowed index value */
  static readonly MIN_INDEX = 0;

  /** Whether to enable verbose logging for debugging */
  static readonly ENABLE_DEBUG_LOGGING = process.env.NODE_ENV === 'development';

  /** Whether to enable performance warnings */
  static readonly ENABLE_PERFORMANCE_WARNINGS = true;

  /** Threshold for performance warnings (array size) */
  static readonly PERFORMANCE_WARNING_THRESHOLD = 100_000;
}

/**
 * Custom error for array access violations
 * Netflix-Grade: Specific error types for better debugging
 */
export class ArrayAccessError extends Error {
  constructor(
    message: string,
    public readonly arrayLength: number,
    public readonly requestedIndex: number,
    public readonly context?: string,
  ) {
    super(message);
    this.name = 'ArrayAccessError';
    Error.captureStackTrace(this, ArrayAccessError);
  }
}

/**
 * Safe array element access with default value
 * Netflix-Grade: Comprehensive input validation + performance monitoring
 *
 * @template T - Type of array elements
 * @param array - Source array (can be undefined)
 * @param index - Zero-based index
 * @param defaultValue - Value to return if element doesn't exist
 * @returns Element at index or default value
 *
 * @example
 * const arr = [1, 2, 3];
 * const value = safeGet(arr, 1, 0); // Returns: 2
 * const safe = safeGet(arr, 10, 0); // Returns: 0
 */
export function safeGet<T>(array: T[] | undefined, index: number, defaultValue: T): T {
  // Defensive Programming: Input validation
  if (!Number.isInteger(index)) {
    if (ArrayUtilsConfig.ENABLE_DEBUG_LOGGING) {
      console.warn(`[safeGet] Non-integer index provided: ${index}, using default value`);
    }
    return defaultValue;
  }

  if (index < ArrayUtilsConfig.MIN_INDEX || index > ArrayUtilsConfig.MAX_INDEX) {
    if (ArrayUtilsConfig.ENABLE_DEBUG_LOGGING) {
      console.warn(`[safeGet] Index ${index} out of valid range [${ArrayUtilsConfig.MIN_INDEX}, ${ArrayUtilsConfig.MAX_INDEX}]`);
    }
    return defaultValue;
  }

  // Performance: Warn for large arrays
  if (ArrayUtilsConfig.ENABLE_PERFORMANCE_WARNINGS && array && array.length > ArrayUtilsConfig.PERFORMANCE_WARNING_THRESHOLD) {
    if (ArrayUtilsConfig.ENABLE_DEBUG_LOGGING) {
      console.warn(`[safeGet] Accessing large array (${array.length} elements)`);
    }
  }

  // Main logic
  if (!array || index < 0 || index >= array.length) {
    return defaultValue;
  }

  const value = array[index];
  return value !== undefined ? value : defaultValue;
}

/**
 * Safe array element access that throws if element doesn't exist
 * Netflix-Grade: Enhanced error messages + comprehensive validation
 *
 * Use this when array bounds are guaranteed by algorithm logic
 *
 * @template T - Type of array elements
 * @param array - Source array
 * @param index - Zero-based index
 * @param context - Context string for error messages (required)
 * @returns Element at index
 * @throws {ArrayAccessError} If array is undefined, index out of bounds, or value is undefined
 *
 * @example
 * const arr = [1, 2, 3];
 * const value = assertGet(arr, 1, 'processing data'); // Returns: 2
 * assertGet(arr, 10, 'processing data'); // Throws ArrayAccessError
 */
export function assertGet<T>(array: T[] | undefined, index: number, context: string): T {
  // Defensive Programming: Validate context parameter
  if (typeof context !== 'string' || context.trim().length === 0) {
    throw new TypeError('Context must be a non-empty string');
  }

  // Defensive Programming: Validate array exists
  if (!array) {
    throw new ArrayAccessError(
      `[${context}] Array is undefined`,
      0,
      index,
      context,
    );
  }

  // Defensive Programming: Validate array is actually an array
  if (!Array.isArray(array)) {
    throw new TypeError(`[${context}] Expected array, got ${typeof array}`);
  }

  // Defensive Programming: Validate index is integer
  if (!Number.isInteger(index)) {
    throw new TypeError(`[${context}] Index must be an integer, got ${typeof index}: ${index}`);
  }

  // Defensive Programming: Validate index range
  if (index < ArrayUtilsConfig.MIN_INDEX || index > ArrayUtilsConfig.MAX_INDEX) {
    throw new RangeError(
      `[${context}] Index ${index} out of valid range [${ArrayUtilsConfig.MIN_INDEX}, ${ArrayUtilsConfig.MAX_INDEX}]`,
    );
  }

  // Check bounds
  if (index < 0 || index >= array.length) {
    throw new ArrayAccessError(
      `[${context}] Index ${index} out of bounds (array length: ${array.length})`,
      array.length,
      index,
      context,
    );
  }

  // Get value
  const value = array[index];

  // Defensive Programming: Validate value exists
  if (value === undefined) {
    throw new ArrayAccessError(
      `[${context}] Value at index ${index} is undefined`,
      array.length,
      index,
      context,
    );
  }

  return value;
}

/**
 * Safe 2D matrix element access with default value
 * Netflix-Grade: Comprehensive validation for matrix operations
 *
 * @template T - Type of matrix elements
 * @param matrix - 2D array (can be undefined)
 * @param i - Row index
 * @param j - Column index
 * @param defaultValue - Value to return if element doesn't exist
 * @returns Element at [i][j] or default value
 *
 * @example
 * const matrix = [[1, 2], [3, 4]];
 * const value = safeGet2D(matrix, 0, 1, 0); // Returns: 2
 * const safe = safeGet2D(matrix, 10, 10, 0); // Returns: 0
 */
export function safeGet2D<T>(
  matrix: T[][] | undefined,
  i: number,
  j: number,
  defaultValue: T
): T {
  // Defensive Programming: Validate indices are integers
  if (!Number.isInteger(i) || !Number.isInteger(j)) {
    if (ArrayUtilsConfig.ENABLE_DEBUG_LOGGING) {
      console.warn(`[safeGet2D] Non-integer indices provided: [${i}, ${j}], using default value`);
    }
    return defaultValue;
  }

  // Defensive Programming: Validate indices are in valid range
  if (i < ArrayUtilsConfig.MIN_INDEX || i > ArrayUtilsConfig.MAX_INDEX ||
      j < ArrayUtilsConfig.MIN_INDEX || j > ArrayUtilsConfig.MAX_INDEX) {
    if (ArrayUtilsConfig.ENABLE_DEBUG_LOGGING) {
      console.warn(`[safeGet2D] Indices [${i}, ${j}] out of valid range`);
    }
    return defaultValue;
  }

  // Main logic
  if (!matrix || i < 0 || i >= matrix.length) {
    return defaultValue;
  }

  const row = matrix[i];
  if (!row || j < 0 || j >= row.length) {
    return defaultValue;
  }

  const value = row[j];
  return value !== undefined ? value : defaultValue;
}

/**
 * Safe 2D matrix element access that throws if element doesn't exist
 * Netflix-Grade: Enhanced error reporting for matrix operations
 *
 * @template T - Type of matrix elements
 * @param matrix - 2D array
 * @param i - Row index
 * @param j - Column index
 * @param context - Context string for error messages
 * @returns Element at [i][j]
 * @throws {ArrayAccessError} If matrix/element doesn't exist or indices invalid
 *
 * @example
 * const matrix = [[1, 2], [3, 4]];
 * const value = assertGet2D(matrix, 0, 1, 'math operation'); // Returns: 2
 */
export function assertGet2D<T>(
  matrix: T[][] | undefined,
  i: number,
  j: number,
  context: string
): T {
  // Defensive Programming: Validate context
  if (typeof context !== 'string' || context.trim().length === 0) {
    throw new TypeError('Context must be a non-empty string');
  }

  // Defensive Programming: Validate matrix exists
  if (!matrix) {
    throw new ArrayAccessError(
      `[${context}] Matrix is undefined`,
      0,
      i,
      context,
    );
  }

  // Defensive Programming: Validate matrix is array
  if (!Array.isArray(matrix)) {
    throw new TypeError(`[${context}] Expected matrix array, got ${typeof matrix}`);
  }

  // Defensive Programming: Validate indices are integers
  if (!Number.isInteger(i) || !Number.isInteger(j)) {
    throw new TypeError(`[${context}] Indices must be integers, got [${i}, ${j}]`);
  }

  // Check row bounds
  if (i < 0 || i >= matrix.length) {
    throw new ArrayAccessError(
      `[${context}] Row index ${i} out of bounds (matrix rows: ${matrix.length})`,
      matrix.length,
      i,
      context,
    );
  }

  const row = matrix[i];

  // Defensive Programming: Validate row exists
  if (!row) {
    throw new ArrayAccessError(
      `[${context}] Row ${i} is undefined`,
      matrix.length,
      i,
      context,
    );
  }

  // Defensive Programming: Validate row is array
  if (!Array.isArray(row)) {
    throw new TypeError(`[${context}] Expected row array at ${i}, got ${typeof row}`);
  }

  // Check column bounds
  if (j < 0 || j >= row.length) {
    throw new ArrayAccessError(
      `[${context}] Column index ${j} out of bounds (row length: ${row.length})`,
      row.length,
      j,
      context,
    );
  }

  const value = row[j];

  // Defensive Programming: Validate value exists
  if (value === undefined) {
    throw new ArrayAccessError(
      `[${context}] Value at [${i}][${j}] is undefined`,
      row.length,
      j,
      context,
    );
  }

  return value;
}

/**
 * Non-null assertion helper with context
 * Netflix-Grade: Type guard with comprehensive validation
 *
 * Use when you know value exists but TypeScript doesn't
 *
 * @template T - Type of value
 * @param value - Value to assert
 * @param context - Context for error message
 * @returns Value (guaranteed not undefined/null)
 * @throws {TypeError} If value is undefined or null
 *
 * @example
 * const maybeValue: number | undefined = getValue();
 * const value = assertDefined(maybeValue, 'processing data'); // Throws if undefined
 */
export function assertDefined<T>(value: T | undefined | null, context: string): T {
  // Defensive Programming: Validate context
  if (typeof context !== 'string' || context.trim().length === 0) {
    throw new TypeError('Context must be a non-empty string');
  }

  // Main check
  if (value === undefined || value === null) {
    throw new TypeError(`[${context}] Value is ${value}`);
  }

  return value;
}

/**
 * Safe array element set (creates array if needed)
 * Netflix-Grade: Defensive array mutation
 *
 * @template T - Type of array elements
 * @param array - Source array (can be undefined)
 * @param index - Index to set
 * @param value - Value to set
 * @returns Modified array
 *
 * @example
 * const arr = safeSet(undefined, 0, 5); // Creates: [5]
 * const arr2 = safeSet([1, 2, 3], 1, 10); // Returns: [1, 10, 3]
 */
export function safeSet<T>(array: T[] | undefined, index: number, value: T): T[] {
  // Defensive Programming: Validate index
  if (!Number.isInteger(index) || index < 0) {
    throw new TypeError(`Index must be a non-negative integer, got ${index}`);
  }

  // Create array if needed
  const arr = array || [];

  // Set value
  arr[index] = value;

  return arr;
}

/**
 * Safe 2D matrix element set (creates matrix if needed)
 * Netflix-Grade: Defensive matrix mutation
 *
 * @template T - Type of matrix elements
 * @param matrix - 2D array (can be undefined)
 * @param i - Row index
 * @param j - Column index
 * @param value - Value to set
 * @returns Modified matrix
 *
 * @example
 * const mat = safeSet2D(undefined, 0, 1, 5); // Creates: [[undefined, 5]]
 * const mat2 = safeSet2D([[1, 2]], 0, 1, 10); // Returns: [[1, 10]]
 */
export function safeSet2D<T>(
  matrix: T[][] | undefined,
  i: number,
  j: number,
  value: T
): T[][] {
  // Defensive Programming: Validate indices
  if (!Number.isInteger(i) || i < 0 || !Number.isInteger(j) || j < 0) {
    throw new TypeError(`Indices must be non-negative integers, got [${i}, ${j}]`);
  }

  // Create matrix if needed
  const mat = matrix || [];

  // Create row if needed
  if (!mat[i]) {
    mat[i] = [];
  }

  // Set value (non-null assertion safe because we just created it if needed)
  mat[i]![j] = value;

  return mat;
}
