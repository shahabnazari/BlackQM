import { Injectable } from '@nestjs/common';
import * as math from 'mathjs';
import {
  RotationMethod,
  RotationOptions,
  RotationResult,
} from '../types/rotation.types';
import { StatisticsService } from './statistics.service';
import { AnalysisLoggerService } from './analysis-logger.service';

/**
 * Rotation Engine Service
 * Implements various factor rotation methods for Q-methodology
 * Supports both orthogonal and oblique rotations
 */
@Injectable()
export class RotationEngineService {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly logger: AnalysisLoggerService,
  ) {}

  /**
   * Main rotation method that delegates to specific rotation methods
   */
  async rotate(options: RotationOptions): Promise<RotationResult> {
    // Validate input
    if (!options.loadingMatrix || options.loadingMatrix.length === 0) {
      throw new Error('Loading matrix cannot be empty');
    }

    const numVariables = options.loadingMatrix.length;
    const numFactors = options.loadingMatrix[0]?.length || 0;

    if (numFactors === 0) {
      throw new Error('Loading matrix has no factors');
    }

    if (numFactors === 1) {
      throw new Error('Cannot rotate single factor');
    }

    // Validate rotation angles for manual rotation
    if (options.method === RotationMethod.MANUAL && !options.rotationAngles) {
      throw new Error('Rotation angles required for manual rotation');
    }

    // Validate kappa for Promax
    if (options.method === RotationMethod.PROMAX) {
      if (options.kappa !== undefined && options.kappa <= 1) {
        throw new Error('Kappa must be greater than 1');
      }
    }

    // Validate gamma for Oblimin
    if (options.method === RotationMethod.OBLIMIN) {
      if (
        options.gamma !== undefined &&
        (options.gamma < -1 || options.gamma > 1)
      ) {
        throw new Error('Gamma must be between -1 and 1');
      }
    }

    // Delegate to appropriate method
    let result: any;
    switch (options.method) {
      case RotationMethod.VARIMAX:
        result = await this.rotateVarimax(
          options.loadingMatrix,
          options.normalize ?? true,
          options.maxIterations,
          options.convergenceCriterion,
        );
        break;
      case RotationMethod.QUARTIMAX:
        result = await this.rotateQuartimax(
          options.loadingMatrix,
          options.maxIterations,
          options.convergenceCriterion,
        );
        break;
      case RotationMethod.PROMAX:
        result = await this.rotatePromax(
          options.loadingMatrix,
          options.kappa ?? 4,
        );
        break;
      case RotationMethod.OBLIMIN:
        result = await this.rotateOblimin(
          options.loadingMatrix,
          options.gamma ?? 0,
          options.maxIterations,
          options.convergenceCriterion,
        );
        break;
      case RotationMethod.MANUAL:
        result = await this.rotateManual(
          options.loadingMatrix,
          options.rotationAngles!.theta ?? 0,
          options.rotationAngles!.phi ?? 0,
          options.rotationAngles!.psi ?? 0,
        );
        break;
      case RotationMethod.NONE:
        result = {
          rotatedLoadings: options.loadingMatrix,
          rotationMatrix: this.createIdentityMatrix(numFactors),
          iterations: 0,
          converged: true,
        };
        break;
      default:
        throw new Error(`Unsupported rotation method: ${options.method}`);
    }

    // Format result to match RotationResult interface
    const rotationResult: RotationResult = {
      method: options.method,
      rotatedLoadings:
        result.rotatedLoadings || result.loadings || options.loadingMatrix,
      rotationMatrix:
        result.rotationMatrix || this.createIdentityMatrix(numFactors),
      iterations: result.iterations || 0,
      converged: result.converged !== undefined ? result.converged : true,
      oblique: [RotationMethod.PROMAX, RotationMethod.OBLIMIN].includes(
        options.method,
      ),
      normalized: options.normalize,
      patternMatrix: result.patternMatrix,
      structureMatrix: result.structureMatrix,
      factorCorrelations: result.factorCorrelations,
      quality: this.calculateRotationQuality(
        result.rotatedLoadings || options.loadingMatrix,
      ),
      warnings: result.warnings || [],
    };

    // Add warnings for non-convergence
    if (!rotationResult.converged) {
      rotationResult.warnings?.push('Rotation did not converge');
    }

    return rotationResult;
  }

  private createIdentityMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        matrix[i][j] = i === j ? 1 : 0;
      }
    }
    return matrix;
  }

  private calculateRotationQuality(loadings: number[][]): any {
    const threshold = 0.1;
    let hyperplaneCount = 0;
    let crossLoadings = 0;
    const complexities: number[] = [];

    for (const row of loadings) {
      const significantLoadings = row.filter((l) => Math.abs(l) > 0.4).length;
      complexities.push(significantLoadings);

      if (row.every((l) => Math.abs(l) < threshold)) {
        hyperplaneCount++;
      }

      if (significantLoadings > 1) {
        crossLoadings++;
      }
    }

    const simplicityIndex = 1 - crossLoadings / loadings.length;
    const complexityIndex =
      complexities.reduce((a, b) => a + b, 0) / complexities.length;

    return {
      simplicityIndex,
      hyperplaneCount,
      complexityIndex,
      crossLoadings,
    };
  }
  /**
   * Varimax Rotation (Orthogonal)
   * Most common rotation method in Q-methodology
   * Maximizes variance of squared loadings
   */
  async rotateVarimax(
    loadings: number[][],
    normalize: boolean = true, // Kaiser normalization
    maxIterations: number = 100,
    tolerance: number = 0.00001,
  ): Promise<{
    rotatedLoadings: number[][];
    rotationMatrix: number[][];
    iterations: number;
    converged: boolean;
  }> {
    const numVariables = loadings.length;
    const numFactors = loadings[0].length;

    // Step 1: Kaiser normalization (optional)
    let workingLoadings = math.clone(loadings);
    let communalities: number[] = [];

    if (normalize) {
      communalities = this.calculateCommunalities(loadings);
      workingLoadings = this.normalizeLoadings(loadings, communalities);
    }

    // Step 2: Initialize rotation matrix as identity
    let rotationMatrix = (
      math.identity(numFactors) as any
    ).toArray() as number[][];

    // Step 3: Iterative rotation
    let previousVariance = 0;
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
      // Rotate each pair of factors
      for (let i = 0; i < numFactors - 1; i++) {
        for (let j = i + 1; j < numFactors; j++) {
          // Extract columns for factors i and j
          const x = workingLoadings.map((row) => row[i]);
          const y = workingLoadings.map((row) => row[j]);

          // Calculate rotation angle
          const angle = this.calculateVarimaxAngle(x, y);

          // Create rotation matrix for this pair
          const pairRotation = this.createRotationMatrix(
            numFactors,
            i,
            j,
            angle,
          );

          // Apply rotation
          workingLoadings = math.multiply(
            workingLoadings,
            pairRotation,
          ) as number[][];
          rotationMatrix = math.multiply(
            rotationMatrix,
            pairRotation,
          ) as number[][];
        }
      }

      // Check convergence
      const currentVariance = this.calculateVarimaxCriterion(workingLoadings);
      converged = Math.abs(currentVariance - previousVariance) < tolerance;
      previousVariance = currentVariance;
      iteration++;
    }

    // Step 4: Denormalize if Kaiser normalization was used
    if (normalize) {
      workingLoadings = this.denormalizeLoadings(
        workingLoadings,
        communalities,
      );
    }

    return {
      rotatedLoadings: workingLoadings,
      rotationMatrix,
      iterations: iteration,
      converged,
    };
  }

  /**
   * Quartimax Rotation (Orthogonal)
   * Minimizes number of factors needed to explain each variable
   */
  async rotateQuartimax(
    loadings: number[][],
    maxIterations: number = 100,
    tolerance: number = 0.00001,
  ): Promise<{
    rotatedLoadings: number[][];
    rotationMatrix: number[][];
    iterations: number;
    converged: boolean;
  }> {
    const numFactors = loadings[0].length;
    let workingLoadings = math.clone(loadings);
    let rotationMatrix = (
      math.identity(numFactors) as any
    ).toArray() as number[][];

    let previousCriterion = 0;
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
      for (let i = 0; i < numFactors - 1; i++) {
        for (let j = i + 1; j < numFactors; j++) {
          const x = workingLoadings.map((row) => row[i]);
          const y = workingLoadings.map((row) => row[j]);

          const angle = this.calculateQuartimaxAngle(x, y);
          const pairRotation = this.createRotationMatrix(
            numFactors,
            i,
            j,
            angle,
          );

          workingLoadings = math.multiply(
            workingLoadings,
            pairRotation,
          ) as number[][];
          rotationMatrix = math.multiply(
            rotationMatrix,
            pairRotation,
          ) as number[][];
        }
      }

      const currentCriterion =
        this.calculateQuartimaxCriterion(workingLoadings);
      converged = Math.abs(currentCriterion - previousCriterion) < tolerance;
      previousCriterion = currentCriterion;
      iteration++;
    }

    return {
      rotatedLoadings: workingLoadings,
      rotationMatrix,
      iterations: iteration,
      converged,
    };
  }

  /**
   * Promax Rotation (Oblique)
   * Allows factors to be correlated
   */
  async rotatePromax(
    loadings: number[][],
    kappa: number = 4, // Power parameter
  ): Promise<{
    patternMatrix: number[][];
    structureMatrix: number[][];
    factorCorrelations: number[][];
  }> {
    // Step 1: Start with Varimax rotation
    const varimaxResult = await this.rotateVarimax(loadings);
    const varimaxLoadings = varimaxResult.rotatedLoadings;

    // Step 2: Raise loadings to power kappa (preserving sign)
    const target = varimaxLoadings.map((row) =>
      row.map(
        (loading) => Math.sign(loading) * Math.pow(Math.abs(loading), kappa),
      ),
    );

    // Step 3: Procrustes rotation to target
    const procrustesResult = this.procrustesRotation(loadings, target);

    // Step 4: Calculate pattern and structure matrices
    const patternMatrix = procrustesResult.rotatedMatrix;
    const factorCorrelations = this.calculateFactorCorrelations(patternMatrix);
    const structureMatrix = math.multiply(
      patternMatrix,
      factorCorrelations,
    ) as number[][];

    return {
      patternMatrix,
      structureMatrix,
      factorCorrelations,
    };
  }

  /**
   * Direct Oblimin Rotation (Oblique)
   * Direct oblique rotation method
   */
  async rotateOblimin(
    loadings: number[][],
    delta: number = 0, // 0 = most oblique, positive = less oblique
    maxIterations: number = 100,
    tolerance: number = 0.00001,
  ): Promise<{
    patternMatrix: number[][];
    structureMatrix: number[][];
    factorCorrelations: number[][];
    iterations: number;
    converged: boolean;
  }> {
    const numVariables = loadings.length;
    const numFactors = loadings[0].length;

    let patternMatrix = math.clone(loadings);
    let previousCriterion = 0;
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
      // Oblimin rotation logic
      for (let i = 0; i < numFactors - 1; i++) {
        for (let j = i + 1; j < numFactors; j++) {
          const angle = this.calculateObliminAngle(patternMatrix, i, j, delta);
          patternMatrix = this.applyObliqueRotation(patternMatrix, i, j, angle);
        }
      }

      const currentCriterion = this.calculateObliminCriterion(
        patternMatrix,
        delta,
      );
      converged = Math.abs(currentCriterion - previousCriterion) < tolerance;
      previousCriterion = currentCriterion;
      iteration++;
    }

    const factorCorrelations = this.calculateFactorCorrelations(patternMatrix);
    const structureMatrix = math.multiply(
      patternMatrix,
      factorCorrelations,
    ) as number[][];

    return {
      patternMatrix,
      structureMatrix,
      factorCorrelations,
      iterations: iteration,
      converged,
    };
  }

  /**
   * Manual/Judgmental Rotation
   * Allows interactive rotation by specified angles
   */
  async rotateManual(
    loadings: number[][],
    factor1: number,
    factor2: number,
    angleDegrees: number,
  ): Promise<{
    rotatedLoadings: number[][];
    rotationMatrix: number[][];
  }> {
    const numFactors = loadings[0].length;
    const angleRadians = (angleDegrees * Math.PI) / 180;

    // Create rotation matrix for specified factors
    const rotationMatrix = this.createRotationMatrix(
      numFactors,
      factor1,
      factor2,
      angleRadians,
    );

    // Apply rotation
    const rotatedLoadings = math.multiply(
      loadings,
      rotationMatrix,
    ) as number[][];

    return {
      rotatedLoadings,
      rotationMatrix,
    };
  }

  /**
   * Interactive rotation with real-time preview
   * Returns intermediate results for visualization
   */
  async rotateInteractive(
    loadings: number[][],
    rotationHistory: { factor1: number; factor2: number; angle: number }[],
  ): Promise<{
    rotatedLoadings: number[][];
    cumulativeRotationMatrix: number[][];
    factorArrays: number[][];
  }> {
    const numFactors = loadings[0].length;
    let workingLoadings = math.clone(loadings);
    let cumulativeRotationMatrix = (
      math.identity(numFactors) as any
    ).toArray() as number[][];

    // Apply each rotation in history
    for (const rotation of rotationHistory) {
      const rotMatrix = this.createRotationMatrix(
        numFactors,
        rotation.factor1,
        rotation.factor2,
        rotation.angle,
      );

      workingLoadings = math.multiply(workingLoadings, rotMatrix) as number[][];
      cumulativeRotationMatrix = math.multiply(
        cumulativeRotationMatrix,
        rotMatrix,
      ) as number[][];
    }

    // Calculate factor arrays for preview
    const factorArrays = this.calculateFactorArrays(workingLoadings);

    return {
      rotatedLoadings: workingLoadings,
      cumulativeRotationMatrix,
      factorArrays,
    };
  }

  // Helper methods
  private calculateVarimaxAngle(x: number[], y: number[]): number {
    const n = x.length;
    let a = 0,
      b = 0,
      c = 0,
      d = 0;

    for (let i = 0; i < n; i++) {
      const u = x[i] * x[i] - y[i] * y[i];
      const v = 2 * x[i] * y[i];
      a += u;
      b += v;
      c += u * u - v * v;
      d += 2 * u * v;
    }

    const num = d - (2 * a * b) / n;
    const den = c - (a * a - b * b) / n;

    return Math.atan2(num, den) / 4;
  }

  private calculateQuartimaxAngle(x: number[], y: number[]): number {
    const n = x.length;
    let num = 0,
      den = 0;

    for (let i = 0; i < n; i++) {
      const x2 = x[i] * x[i];
      const y2 = y[i] * y[i];
      const xy = x[i] * y[i];

      num += 4 * xy * (x2 - y2);
      den += (x2 - y2) * (x2 - y2) - 4 * xy * xy;
    }

    return Math.atan2(num, den) / 4;
  }

  private calculateObliminAngle(
    loadings: number[][],
    factor1: number,
    factor2: number,
    delta: number,
  ): number {
    // Simplified oblimin angle calculation
    const x = loadings.map((row) => row[factor1]);
    const y = loadings.map((row) => row[factor2]);

    // Apply delta parameter
    const adjustedAngle = this.calculateVarimaxAngle(x, y);
    return adjustedAngle * (1 - delta / 10);
  }

  private createRotationMatrix(
    size: number,
    i: number,
    j: number,
    angle: number,
  ): number[][] {
    const matrix = (math.identity(size) as any).toArray() as number[][];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    matrix[i][i] = cos;
    matrix[i][j] = -sin;
    matrix[j][i] = sin;
    matrix[j][j] = cos;

    return matrix;
  }

  private calculateVarimaxCriterion(loadings: number[][]): number {
    const numVariables = loadings.length;
    const numFactors = loadings[0].length;
    let variance = 0;

    for (let j = 0; j < numFactors; j++) {
      let sum2 = 0,
        sum4 = 0;

      for (let i = 0; i < numVariables; i++) {
        const loading2 = loadings[i][j] * loadings[i][j];
        sum2 += loading2;
        sum4 += loading2 * loading2;
      }

      variance += numVariables * sum4 - sum2 * sum2;
    }

    return variance / (numVariables * numVariables);
  }

  private calculateQuartimaxCriterion(loadings: number[][]): number {
    let sum = 0;

    for (const row of loadings) {
      for (const loading of row) {
        sum += Math.pow(loading, 4);
      }
    }

    return sum;
  }

  private calculateObliminCriterion(
    loadings: number[][],
    delta: number,
  ): number {
    const numFactors = loadings[0].length;
    let criterion = 0;

    for (let i = 0; i < numFactors; i++) {
      for (let j = 0; j < numFactors; j++) {
        if (i !== j) {
          let covariance = 0;
          for (const row of loadings) {
            covariance += row[i] * row[i] * row[j] * row[j];
          }
          criterion += covariance - delta * Math.abs(covariance);
        }
      }
    }

    return criterion;
  }

  private calculateCommunalities(loadings: number[][]): number[] {
    return loadings.map((row) =>
      row.reduce((sum, loading) => sum + loading * loading, 0),
    );
  }

  private normalizeLoadings(
    loadings: number[][],
    communalities: number[],
  ): number[][] {
    return loadings.map((row, i) =>
      row.map((loading) => loading / Math.sqrt(communalities[i])),
    );
  }

  private denormalizeLoadings(
    loadings: number[][],
    communalities: number[],
  ): number[][] {
    return loadings.map((row, i) =>
      row.map((loading) => loading * Math.sqrt(communalities[i])),
    );
  }

  private procrustesRotation(
    source: number[][],
    target: number[][],
  ): { rotatedMatrix: number[][]; transformMatrix: number[][] } {
    // Simplified Procrustes rotation
    const sourceT = math.transpose(source);
    const targetT = math.transpose(target);

    const crossProduct = math.multiply(sourceT, target) as number[][];
    const svd = this.simpleSVD(crossProduct);

    const transformMatrix = math.multiply(svd.U, svd.V) as number[][];
    const rotatedMatrix = math.multiply(source, transformMatrix) as number[][];

    return { rotatedMatrix, transformMatrix };
  }

  private simpleSVD(matrix: number[][]): {
    U: number[][];
    S: number[];
    V: number[][];
  } {
    // Simplified SVD implementation
    // In production, use a proper numerical library
    const eigen = math.eigs(math.multiply(math.transpose(matrix), matrix));

    // Extract eigenvectors properly
    const eigenvectorsArray = eigen.eigenvectors || [];
    const V = eigenvectorsArray.map((ev: any) =>
      Array.isArray(ev.vector) ? ev.vector : (ev.vector as any).toArray(),
    ) as number[][];

    // Extract eigenvalues properly
    const valuesArray = Array.isArray(eigen.values)
      ? eigen.values
      : (eigen.values as any).toArray();
    const S = valuesArray.map((v: any) =>
      Math.sqrt(Math.max(0, typeof v === 'number' ? v : v.toNumber())),
    );

    const U = math.multiply(matrix, V) as number[][];

    return { U, S, V };
  }

  private calculateFactorCorrelations(patternMatrix: number[][]): number[][] {
    const numFactors = patternMatrix[0].length;
    const correlations: number[][] = [];

    for (let i = 0; i < numFactors; i++) {
      correlations[i] = [];
      for (let j = 0; j < numFactors; j++) {
        if (i === j) {
          correlations[i][j] = 1;
        } else {
          // Calculate correlation between factors
          const factor1 = patternMatrix.map((row) => row[i]);
          const factor2 = patternMatrix.map((row) => row[j]);
          correlations[i][j] = this.pearsonCorrelation(factor1, factor2);
        }
      }
    }

    return correlations;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    return den === 0 ? 0 : num / den;
  }

  private applyObliqueRotation(
    matrix: number[][],
    factor1: number,
    factor2: number,
    angle: number,
  ): number[][] {
    const result = math.clone(matrix);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let i = 0; i < matrix.length; i++) {
      const f1 = matrix[i][factor1];
      const f2 = matrix[i][factor2];

      result[i][factor1] = f1 * cos - f2 * sin;
      result[i][factor2] = f1 * sin + f2 * cos;
    }

    return result;
  }

  private calculateFactorArrays(loadings: number[][]): number[][] {
    // Convert loadings to factor arrays (z-scores)
    const numFactors = loadings[0].length;
    const factorArrays: number[][] = [];

    for (let factor = 0; factor < numFactors; factor++) {
      const factorLoadings = loadings.map((row) => row[factor]);
      const zScores = this.standardize(factorLoadings);
      factorArrays.push(zScores);
    }

    return factorArrays;
  }

  private standardize(values: number[]): number[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return values.map((val) => (val - mean) / stdDev);
  }
}
