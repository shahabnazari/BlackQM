/**
 * Phase 10.170 Week 4+: Shared Vector Math Utilities
 *
 * DRY FIX: Centralized vector operations to eliminate duplication across services.
 * Previously duplicated in 7+ services.
 *
 * @module vector-math.utils
 * @since Phase 10.170 Week 4+
 */

// ============================================================================
// COSINE SIMILARITY
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 *
 * Returns a value between -1 and 1:
 * - 1: Identical direction (perfect similarity)
 * - 0: Orthogonal (no similarity)
 * - -1: Opposite direction (perfect dissimilarity)
 *
 * QUALITY FEATURES:
 * - Explicit empty array handling (returns 0)
 * - Length mismatch handling (returns 0 with optional warning)
 * - Zero vector handling (returns 0)
 *
 * @param a First vector
 * @param b Second vector
 * @param onLengthMismatch Optional callback for length mismatch logging
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(
  a: readonly number[],
  b: readonly number[],
  onLengthMismatch?: (aLength: number, bLength: number) => void,
): number {
  // Handle empty arrays
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  // Handle length mismatch
  if (a.length !== b.length) {
    if (onLengthMismatch) {
      onLengthMismatch(a.length, b.length);
    }
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  // Handle zero vectors
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

// ============================================================================
// EUCLIDEAN DISTANCE
// ============================================================================

/**
 * Calculate Euclidean distance between two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns Euclidean distance (0 = identical)
 */
export function euclideanDistance(
  a: readonly number[],
  b: readonly number[],
): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return Infinity;
  }

  let sumSquares = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sumSquares += diff * diff;
  }

  return Math.sqrt(sumSquares);
}

// ============================================================================
// VECTOR NORMALIZATION
// ============================================================================

/**
 * Normalize a vector to unit length
 *
 * @param v Vector to normalize
 * @returns Normalized vector (or zero vector if input is zero)
 */
export function normalizeVector(v: readonly number[]): number[] {
  if (v.length === 0) {
    return [];
  }

  let norm = 0;
  for (let i = 0; i < v.length; i++) {
    norm += v[i] * v[i];
  }
  norm = Math.sqrt(norm);

  if (norm === 0) {
    return v.map(() => 0);
  }

  return v.map((x) => x / norm);
}

// ============================================================================
// DOT PRODUCT
// ============================================================================

/**
 * Calculate dot product of two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns Dot product (0 if vectors are incompatible)
 */
export function dotProduct(
  a: readonly number[],
  b: readonly number[],
): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result += a[i] * b[i];
  }

  return result;
}

// ============================================================================
// VECTOR MAGNITUDE
// ============================================================================

/**
 * Calculate magnitude (L2 norm) of a vector
 *
 * @param v Vector
 * @returns Magnitude
 */
export function magnitude(v: readonly number[]): number {
  if (v.length === 0) {
    return 0;
  }

  let sumSquares = 0;
  for (let i = 0; i < v.length; i++) {
    sumSquares += v[i] * v[i];
  }

  return Math.sqrt(sumSquares);
}
