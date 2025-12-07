/**
 * Mathematical Utilities Service
 * Phase 10.98 Day 1: Core mathematical operations for clustering algorithms
 *
 * Enterprise-grade implementations with:
 * - Type safety (zero `any` types)
 * - Defensive null checking
 * - Performance optimizations
 * - Comprehensive error handling
 */

import { Injectable, Logger } from '@nestjs/common';
import type { InitialCode } from '../types/unified-theme-extraction.types';
import type { Cluster } from '../types/phase-10.98.types';

@Injectable()
export class MathematicalUtilitiesService {
  private readonly logger = new Logger(MathematicalUtilitiesService.name);
  private static readonly LOG_PREFIX = '[MathUtils]';

  /**
   * Calculate cosine similarity between two vectors
   * Formula: cos(θ) = (A·B) / (||A|| × ||B||)
   * Range: [-1, 1], where 1 = identical, 0 = orthogonal, -1 = opposite
   *
   * @param vec1 - First embedding vector
   * @param vec2 - Second embedding vector
   * @returns Cosine similarity score (0-1)
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
      this.logger.warn(`${MathematicalUtilitiesService.LOG_PREFIX} cosineSimilarity called with invalid vectors`);
      return 0;
    }

    if (vec1.length !== vec2.length) {
      this.logger.warn(
        `${MathematicalUtilitiesService.LOG_PREFIX} Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`,
      );
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Calculate Euclidean distance between two vectors
   * Formula: d(A,B) = sqrt(Σ(A_i - B_i)²)
   *
   * @param vec1 - First embedding vector
   * @param vec2 - Second embedding vector
   * @returns Euclidean distance
   */
  euclideanDistance(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
      this.logger.warn(`${MathematicalUtilitiesService.LOG_PREFIX} euclideanDistance called with invalid vectors`);
      return Infinity;
    }

    if (vec1.length !== vec2.length) {
      this.logger.warn(
        `${MathematicalUtilitiesService.LOG_PREFIX} Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`,
      );
      return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      const diff = vec1[i] - vec2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Calculate centroid (mean vector) of multiple embeddings
   * STRICT AUDIT FIX: Validates all embeddings have consistent dimensions
   *
   * @param embeddings - Array of embedding vectors
   * @returns Mean embedding vector (centroid)
   * @throws Error if embeddings have inconsistent dimensions
   */
  calculateCentroid(embeddings: number[][]): number[] {
    if (!embeddings || embeddings.length === 0) {
      return [];
    }

    const dimensions = embeddings[0].length;

    // STRICT AUDIT FIX: Validate all embeddings have same dimension
    for (let i = 1; i < embeddings.length; i++) {
      if (embeddings[i].length !== dimensions) {
        throw new Error(
          `Inconsistent embedding dimensions: expected ${dimensions}, got ${embeddings[i].length} at index ${i}`
        );
      }
    }

    // STRICT AUDIT FIX: Use Array.from for better performance than fill()
    const centroid = Array.from({ length: dimensions }, () => 0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }

    // Divide by count to get mean
    const count = embeddings.length;
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= count;
    }

    return centroid;
  }

  /**
   * Calculate inertia (within-cluster sum of squares)
   * Lower inertia = tighter clusters
   *
   * @param clusters - Array of clusters
   * @param codeEmbeddings - Map of code embeddings
   * @returns Total inertia value
   */
  calculateInertia(
    clusters: Cluster[],
    codeEmbeddings: Map<string, number[]>,
  ): number {
    let totalInertia = 0;

    for (const cluster of clusters) {
      for (const code of cluster.codes) {
        const embedding = codeEmbeddings.get(code.id);
        if (!embedding) continue;

        const distance = this.euclideanDistance(embedding, cluster.centroid);
        totalInertia += distance * distance;
      }
    }

    return totalInertia;
  }

  /**
   * Calculate Silhouette score for clustering quality
   * Formula: s = (b - a) / max(a, b)
   * Range: [-1, 1], where 1 = perfect clustering
   *
   * @param clusters - Array of clusters
   * @param codeEmbeddings - Map of code embeddings
   * @returns Average silhouette score
   */
  calculateSilhouetteScore(
    clusters: Cluster[],
    codeEmbeddings: Map<string, number[]>,
  ): number {
    if (clusters.length <= 1) {
      return 0; // Silhouette is undefined for single cluster
    }

    let totalScore = 0;
    let count = 0;

    for (const cluster of clusters) {
      for (const code of cluster.codes) {
        const embedding = codeEmbeddings.get(code.id);
        if (!embedding) continue;

        // a(i) = average distance to points in same cluster
        const a = this.averageDistanceInCluster(
          code,
          cluster,
          codeEmbeddings,
        );

        // b(i) = minimum average distance to points in nearest cluster
        const b = this.minAverageDistanceToOtherClusters(
          code,
          cluster,
          clusters,
          codeEmbeddings,
        );

        // s(i) = (b - a) / max(a, b)
        if (a === 0 && b === 0) {
          // Single-code cluster, skip
          continue;
        }

        const s = (b - a) / Math.max(a, b);
        totalScore += s;
        count++;
      }
    }

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * Calculate Davies-Bouldin index for clustering quality
   * Lower DB index = better clustering (more compact and well-separated)
   *
   * @param clusters - Array of clusters
   * @param codeEmbeddings - Map of code embeddings
   * @returns Davies-Bouldin index
   */
  calculateDaviesBouldinIndex(
    clusters: Cluster[],
    codeEmbeddings: Map<string, number[]>,
  ): number {
    if (clusters.length <= 1) {
      return 0; // DB index is undefined for single cluster
    }

    const n = clusters.length;
    let dbSum = 0;

    for (let i = 0; i < n; i++) {
      const cluster_i = clusters[i];
      const s_i = this.clusterScatter(cluster_i, codeEmbeddings);

      let maxRatio = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;

        const cluster_j = clusters[j];
        const s_j = this.clusterScatter(cluster_j, codeEmbeddings);
        const d_ij = this.euclideanDistance(
          cluster_i.centroid,
          cluster_j.centroid,
        );

        if (d_ij > 0) {
          const ratio = (s_i + s_j) / d_ij;
          maxRatio = Math.max(maxRatio, ratio);
        }
      }

      dbSum += maxRatio;
    }

    return dbSum / n;
  }

  /**
   * Calculate cluster scatter (average distance from centroid)
   *
   * @private
   */
  private clusterScatter(
    cluster: Cluster,
    codeEmbeddings: Map<string, number[]>,
  ): number {
    if (cluster.codes.length === 0) return 0;

    let totalDistance = 0;
    let count = 0;

    for (const code of cluster.codes) {
      const embedding = codeEmbeddings.get(code.id);
      if (!embedding) continue;

      totalDistance += this.euclideanDistance(embedding, cluster.centroid);
      count++;
    }

    return count > 0 ? totalDistance / count : 0;
  }

  /**
   * Calculate average distance from a code to all codes in its cluster
   *
   * @private
   */
  private averageDistanceInCluster(
    code: InitialCode,
    cluster: Cluster,
    codeEmbeddings: Map<string, number[]>,
  ): number {
    const codeEmbedding = codeEmbeddings.get(code.id);
    if (!codeEmbedding) return 0;

    if (cluster.codes.length <= 1) {
      return 0; // Single-code cluster
    }

    let totalDistance = 0;
    let count = 0;

    for (const otherCode of cluster.codes) {
      if (otherCode.id === code.id) continue;

      const otherEmbedding = codeEmbeddings.get(otherCode.id);
      if (!otherEmbedding) continue;

      totalDistance += this.euclideanDistance(codeEmbedding, otherEmbedding);
      count++;
    }

    return count > 0 ? totalDistance / count : 0;
  }

  /**
   * Find minimum average distance from a code to codes in other clusters
   *
   * @private
   */
  private minAverageDistanceToOtherClusters(
    code: InitialCode,
    currentCluster: Cluster,
    allClusters: Cluster[],
    codeEmbeddings: Map<string, number[]>,
  ): number {
    const codeEmbedding = codeEmbeddings.get(code.id);
    if (!codeEmbedding) return Infinity;

    let minAvgDistance = Infinity;

    for (const cluster of allClusters) {
      // Skip the current cluster
      if (cluster === currentCluster) continue;

      let totalDistance = 0;
      let count = 0;

      for (const otherCode of cluster.codes) {
        const otherEmbedding = codeEmbeddings.get(otherCode.id);
        if (!otherEmbedding) continue;

        totalDistance += this.euclideanDistance(codeEmbedding, otherEmbedding);
        count++;
      }

      if (count > 0) {
        const avgDistance = totalDistance / count;
        minAvgDistance = Math.min(minAvgDistance, avgDistance);
      }
    }

    return minAvgDistance;
  }

  /**
   * Find elbow point in inertia curve using maximum curvature method
   *
   * @param data - Array of {k, inertia} points
   * @returns Optimal k value at elbow point
   */
  findElbowPoint(data: Array<{ k: number; inertia: number }>): number {
    if (data.length < 3) {
      return data[0]?.k || 30;
    }

    // Calculate second derivative (curvature) at each point
    const curvatures: Array<{ k: number; curvature: number }> = [];

    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const next = data[i + 1];

      // Second derivative approximation
      const curvature = Math.abs(
        (prev.inertia - 2 * curr.inertia + next.inertia) /
          Math.pow(curr.k - prev.k, 2),
      );

      curvatures.push({ k: curr.k, curvature });
    }

    // Elbow = maximum curvature
    const elbow = curvatures.reduce((max, curr) =>
      curr.curvature > max.curvature ? curr : max,
    );

    return elbow.k;
  }

  /**
   * Calculate centroid movement between iterations
   * Used to check k-means convergence
   *
   * @param oldCentroids - Previous iteration centroids
   * @param newCentroids - Current iteration centroids
   * @returns Maximum centroid movement distance
   */
  calculateCentroidMovement(
    oldCentroids: number[][],
    newCentroids: number[][],
  ): number {
    if (oldCentroids.length !== newCentroids.length) {
      return Infinity;
    }

    let maxMovement = 0;

    for (let i = 0; i < oldCentroids.length; i++) {
      const movement = this.euclideanDistance(
        oldCentroids[i],
        newCentroids[i],
      );
      maxMovement = Math.max(maxMovement, movement);
    }

    return maxMovement;
  }

  /**
   * Chunk an array into smaller batches
   * Utility for batch processing
   *
   * @param array - Array to chunk
   * @param size - Batch size
   * @returns Array of batches
   */
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
