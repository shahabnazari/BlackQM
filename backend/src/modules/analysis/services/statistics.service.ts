import { Injectable } from '@nestjs/common';
// Netflix-Grade: Import type-safe array utilities (Phase 10.103 Session 6)
import { safeGet, safeGet2D, assertGet } from '../../../common/utils/array-utils';

/**
 * Statistical calculations service for Q-methodology analysis
 * Provides core statistical functions used throughout the analysis engine
 */
@Injectable()
export class StatisticsService {
  /**
   * Calculate z-scores for a dataset
   */
  calculateZScores(data: number[]): number[] {
    if (!data || data.length === 0) {
      throw new Error('Cannot calculate z-scores for empty array');
    }

    if (data.length === 1) {
      return [0];
    }

    const mean = this.calculateMean(data);
    const sd = this.calculateStandardDeviation(data);

    if (sd === 0) {
      return data.map(() => 0);
    }

    return data.map((value) => (value - mean) / sd);
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) {
      throw new Error('Arrays must have the same length');
    }

    const n = x.length;
    if (n === 0) return 0;

    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    for (let i = 0; i < n; i++) {
      const deviationX = safeGet(x, i, 0) - meanX;
      const deviationY = safeGet(y, i, 0) - meanY;
      numerator += deviationX * deviationY;
      denominatorX += deviationX * deviationX;
      denominatorY += deviationY * deviationY;
    }

    if (denominatorX === 0 || denominatorY === 0) {
      return 0;
    }

    return numerator / Math.sqrt(denominatorX * denominatorY);
  }

  /**
   * Calculate correlation matrix
   */
  calculateCorrelationMatrix(data: number[][]): number[][] {
    const transposed = this.transposeMatrix(data);
    const n = transposed.length;
    const matrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const row = assertGet(matrix, i, 'correlation matrix');
          row[j] = 1;
        } else if (j < i) {
          const row = assertGet(matrix, i, 'correlation matrix');
          row[j] = safeGet2D(matrix, j, i, 0);
        } else {
          const row = assertGet(matrix, i, 'correlation matrix');
          const transposedI = assertGet(transposed, i, 'correlation matrix');
          const transposedJ = assertGet(transposed, j, 'correlation matrix');
          row[j] = this.calculateCorrelation(transposedI, transposedJ);
        }
      }
    }

    return matrix;
  }

  /**
   * Calculate Spearman rank correlation
   */
  calculateSpearmanCorrelation(x: number[], y: number[]): number {
    const rankedX = this.rankData(x);
    const rankedY = this.rankData(y);
    return this.calculateCorrelation(rankedX, rankedY);
  }

  /**
   * Calculate eigenvalues using power iteration method
   */
  calculateEigenvalues(matrix: number[][], options?: any): number[] {
    const n = matrix.length;
    const eigenvalues: number[] = [];
    let tempMatrix = matrix.map((row) => [...row]);

    for (let i = 0; i < n; i++) {
      const result = this.powerIteration(tempMatrix);
      eigenvalues.push(result.eigenvalue);

      // Deflate matrix
      tempMatrix = this.deflateMatrix(
        tempMatrix,
        result.eigenvalue,
        result.eigenvector,
      );
    }

    return eigenvalues.sort((a, b) => b - a);
  }

  /**
   * Calculate eigenvalues and eigenvectors
   */
  calculateEigen(matrix: number[][]): {
    values: number[];
    vectors: number[][];
  } {
    const eigenvalues = this.calculateEigenvalues(matrix);
    const eigenvectors: number[][] = [];

    for (const eigenvalue of eigenvalues) {
      const vector = this.findEigenvector(matrix, eigenvalue);
      eigenvectors.push(vector);
    }

    return {
      values: eigenvalues,
      vectors: this.transposeMatrix(eigenvectors),
    };
  }

  /**
   * Calculate variance
   */
  calculateVariance(data: number[], sample: boolean = false): number {
    if (!data || data.length === 0) {
      throw new Error('Cannot calculate variance for empty array');
    }

    if (data.length === 1) {
      return 0;
    }

    const mean = this.calculateMean(data);
    const squaredDiffs = data.map((value) => Math.pow(value - mean, 2));
    const sumSquaredDiffs = squaredDiffs.reduce((sum, value) => sum + value, 0);

    return sumSquaredDiffs / (data.length - (sample ? 1 : 0));
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(data: number[], sample: boolean = false): number {
    return Math.sqrt(this.calculateVariance(data, sample));
  }

  /**
   * Calculate coefficient of variation
   */
  calculateCoefficientOfVariation(data: number[]): number {
    const mean = this.calculateMean(data);
    if (mean === 0) return 0;
    const sd = this.calculateStandardDeviation(data);
    return (sd / mean) * 100;
  }

  /**
   * Perform t-test for independent samples
   */
  performTTest(group1: number[], group2: number[]): any {
    const mean1 = this.calculateMean(group1);
    const mean2 = this.calculateMean(group2);
    const var1 = this.calculateVariance(group1, true);
    const var2 = this.calculateVariance(group2, true);
    const n1 = group1.length;
    const n2 = group2.length;

    const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));
    const tStatistic = (mean1 - mean2) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;

    // Approximate p-value (would need t-distribution for exact value)
    const pValue = this.approximatePValue(tStatistic, degreesOfFreedom);

    return {
      tStatistic,
      pValue,
      degreesOfFreedom,
      meanDifference: mean1 - mean2,
    };
  }

  /**
   * Perform paired t-test
   */
  performPairedTTest(before: number[], after: number[]): any {
    if (before.length !== after.length) {
      throw new Error('Arrays must have the same length for paired t-test');
    }

    const differences = before.map((value, i) => safeGet(after, i, 0) - value);
    const meanDiff = this.calculateMean(differences);
    const sdDiff = this.calculateStandardDeviation(differences, true);
    const n = differences.length;
    const standardError = sdDiff / Math.sqrt(n);
    const tStatistic = meanDiff / standardError;
    const degreesOfFreedom = n - 1;

    const pValue = this.approximatePValue(tStatistic, degreesOfFreedom);

    return {
      tStatistic,
      pValue,
      degreesOfFreedom,
      meanDifference: meanDiff,
    };
  }

  /**
   * Calculate chi-square statistic
   */
  calculateChiSquare(observed: number[], expected: number[]): number {
    if (observed.length !== expected.length) {
      throw new Error('Arrays must have the same length');
    }

    return observed.reduce((sum, obs, i) => {
      const exp = safeGet(expected, i, 1);
      if (exp === 0) return sum;
      return sum + Math.pow(obs - exp, 2) / exp;
    }, 0);
  }

  /**
   * Perform ANOVA
   */
  performANOVA(groups: number[][]): any {
    const k = groups.length; // Number of groups
    const n = groups.reduce((sum, group) => sum + group.length, 0); // Total observations

    // Calculate overall mean
    const allValues = groups.flat();
    const grandMean = this.calculateMean(allValues);

    // Calculate between-group sum of squares
    let ssBetween = 0;
    for (const group of groups) {
      const groupMean = this.calculateMean(group);
      ssBetween += group.length * Math.pow(groupMean - grandMean, 2);
    }

    // Calculate within-group sum of squares
    let ssWithin = 0;
    for (const group of groups) {
      const groupMean = this.calculateMean(group);
      for (const value of group) {
        ssWithin += Math.pow(value - groupMean, 2);
      }
    }

    // Calculate degrees of freedom
    const dfBetween = k - 1;
    const dfWithin = n - k;

    // Calculate mean squares
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    // Calculate F-statistic
    const fStatistic = msBetween / msWithin;

    // Approximate p-value
    const pValue = this.approximateFPValue(fStatistic, dfBetween, dfWithin);

    return {
      fStatistic,
      pValue,
      degreesOfFreedomBetween: dfBetween,
      degreesOfFreedomWithin: dfWithin,
    };
  }

  /**
   * Q-Methodology specific: Calculate factor scores
   */
  calculateFactorScore(loadings: number[], zScores: number[]): number {
    if (loadings.length !== zScores.length) {
      throw new Error('Arrays must have the same length');
    }

    return loadings.reduce((sum, loading, i) => sum + loading * safeGet(zScores, i, 0), 0);
  }

  /**
   * Q-Methodology specific: Identify distinguishing statements
   */
  identifyDistinguishingStatements(
    factorScores: number[][],
    factorIndex: number,
    threshold: number = 1.96,
  ): number[] {
    const distinguishing: number[] = [];
    const targetScores = factorScores.map((row) => safeGet(row, factorIndex, 0));

    for (let i = 0; i < factorScores.length; i++) {
      const row = assertGet(factorScores, i, 'distinguishing statements');
      const otherFactorScores = row.filter(
        (_, j) => j !== factorIndex,
      );
      const targetScore = Math.abs(safeGet(targetScores, i, 0));
      const maxOtherScore = Math.max(...otherFactorScores.map(Math.abs));

      if (targetScore - maxOtherScore > threshold) {
        distinguishing.push(i);
      }
    }

    return distinguishing;
  }

  /**
   * Q-Methodology specific: Identify consensus statements
   */
  identifyConsensusStatements(
    factorScores: number[][],
    threshold: number = 0.5,
  ): number[] {
    const consensus: number[] = [];

    for (let i = 0; i < factorScores.length; i++) {
      const scores = assertGet(factorScores, i, 'consensus statements');
      const range = Math.max(...scores) - Math.min(...scores);

      if (range < threshold) {
        consensus.push(i);
      }
    }

    return consensus;
  }

  /**
   * Q-Methodology specific: Calculate factor characteristics
   */
  calculateFactorCharacteristics(factorMatrix: number[][]): any[] {
    const firstRow = assertGet(factorMatrix, 0, 'factor characteristics');
    const factors = firstRow.length;
    const characteristics: any[] = [];

    for (let f = 0; f < factors; f++) {
      const loadings = factorMatrix.map((row) => safeGet(row, f, 0));
      const squaredLoadings = loadings.map((l) => l * l);
      const eigenvalue = squaredLoadings.reduce((sum, l) => sum + l, 0);
      const percentVariance = (eigenvalue / factorMatrix.length) * 100;
      const definingVars = loadings.filter((l) => Math.abs(l) > 0.4).length;

      characteristics.push({
        eigenvalue,
        percentVariance,
        numberOfDefiningVariables: definingVars,
      });
    }

    return characteristics;
  }

  /**
   * Matrix operations: Transpose
   */
  transposeMatrix(matrix: number[][]): number[][] {
    if (!matrix || matrix.length === 0) return [];
    const firstRow = assertGet(matrix, 0, 'transpose matrix');
    return firstRow.map((_, colIndex) => matrix.map((row) => safeGet(row, colIndex, 0)));
  }

  /**
   * Matrix operations: Multiply
   */
  multiplyMatrices(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    const firstRowB = assertGet(B, 0, 'multiply matrices');
    const firstRowA = assertGet(A, 0, 'multiply matrices');

    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < firstRowB.length; j++) {
        let sum = 0;
        for (let k = 0; k < firstRowA.length; k++) {
          sum += safeGet2D(A, i, k, 0) * safeGet2D(B, k, j, 0);
        }
        const row = assertGet(result, i, 'multiply matrices');
        row[j] = sum;
      }
    }

    return result;
  }

  /**
   * Matrix operations: Calculate determinant (2x2)
   */
  calculateDeterminant(matrix: number[][]): number {
    if (matrix.length === 2) {
      return safeGet2D(matrix, 0, 0, 0) * safeGet2D(matrix, 1, 1, 0) - safeGet2D(matrix, 0, 1, 0) * safeGet2D(matrix, 1, 0, 0);
    }

    // For larger matrices, use recursive Laplace expansion
    const firstRow = assertGet(matrix, 0, 'calculate determinant');
    let det = 0;
    for (let i = 0; i < firstRow.length; i++) {
      const subMatrix = this.getSubMatrix(matrix, 0, i);
      const cofactor =
        Math.pow(-1, i) * safeGet(firstRow, i, 0) * this.calculateDeterminant(subMatrix);
      det += cofactor;
    }

    return det;
  }

  /**
   * Matrix operations: Invert matrix
   */
  invertMatrix(matrix: number[][]): number[][] {
    const det = this.calculateDeterminant(matrix);

    if (Math.abs(det) < 0.0001) {
      throw new Error('Matrix is singular and cannot be inverted');
    }

    if (matrix.length === 2) {
      return [
        [safeGet2D(matrix, 1, 1, 0) / det, -safeGet2D(matrix, 0, 1, 0) / det],
        [-safeGet2D(matrix, 1, 0, 0) / det, safeGet2D(matrix, 0, 0, 0) / det],
      ];
    }

    // For larger matrices, use Gaussian elimination
    return this.gaussianElimination(matrix);
  }

  /**
   * Descriptive statistics: Mean
   */
  calculateMean(data: number[]): number {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }

  /**
   * Descriptive statistics: Median
   */
  calculateMedian(data: number[]): number {
    if (!data || data.length === 0) return 0;

    const sorted = [...data].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (safeGet(sorted, middle - 1, 0) + safeGet(sorted, middle, 0)) / 2;
    } else {
      return safeGet(sorted, middle, 0);
    }
  }

  /**
   * Descriptive statistics: Mode
   */
  calculateMode(data: number[]): number[] {
    if (!data || data.length === 0) return [];

    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;

    for (const value of data) {
      frequency[value] = (frequency[value] || 0) + 1;
      maxFreq = Math.max(maxFreq, frequency[value]);
    }

    return Object.keys(frequency)
      .filter((key) => frequency[Number(key)] === maxFreq)
      .map(Number);
  }

  /**
   * Descriptive statistics: Quartiles
   */
  calculateQuartiles(data: number[]): any {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;

    const Q1 = this.calculatePercentile(sorted, 25);
    const Q2 = this.calculateMedian(sorted);
    const Q3 = this.calculatePercentile(sorted, 75);

    return {
      Q1,
      Q2,
      Q3,
      IQR: Q3 - Q1,
    };
  }

  /**
   * Calculate skewness
   */
  calculateSkewness(data: number[]): number {
    const mean = this.calculateMean(data);
    const n = data.length;
    const sd = this.calculateStandardDeviation(data);

    if (sd === 0) return 0;

    const sum = data.reduce(
      (acc, value) => acc + Math.pow((value - mean) / sd, 3),
      0,
    );

    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * Calculate kurtosis
   */
  calculateKurtosis(data: number[]): number {
    const mean = this.calculateMean(data);
    const n = data.length;
    const sd = this.calculateStandardDeviation(data);

    if (sd === 0) return 0;

    const sum = data.reduce(
      (acc, value) => acc + Math.pow((value - mean) / sd, 4),
      0,
    );

    return (
      ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum -
      (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
    );
  }

  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(data: number[], confidence: number = 0.95): any {
    const mean = this.calculateMean(data);
    const sd = this.calculateStandardDeviation(data, true);
    const n = data.length;
    const standardError = sd / Math.sqrt(n);

    // Use z-score for normal distribution (approximation)
    const zScore = this.getZScore(confidence);
    const marginOfError = zScore * standardError;

    return {
      mean,
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      confidence,
    };
  }

  /**
   * Bootstrap confidence interval
   */
  bootstrapConfidenceInterval(
    data: number[],
    iterations: number = 1000,
    confidence: number = 0.95,
  ): any {
    const bootstrapMeans: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const sample = this.bootstrapSample(data);
      bootstrapMeans.push(this.calculateMean(sample));
    }

    bootstrapMeans.sort((a, b) => a - b);
    const lowerIndex = Math.floor(((1 - confidence) / 2) * iterations);
    const upperIndex = Math.floor((1 - (1 - confidence) / 2) * iterations);

    return {
      bootstrapMean: this.calculateMean(bootstrapMeans),
      lower: safeGet(bootstrapMeans, lowerIndex, 0),
      upper: safeGet(bootstrapMeans, upperIndex, 0),
      confidence,
    };
  }

  // Helper methods
  private rankData(data: number[]): number[] {
    const indexed = data.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => a.value - b.value);

    const ranks = new Array(data.length);
    let currentRank = 1;

    for (let i = 0; i < indexed.length; i++) {
      const current = assertGet(indexed, i, 'rank data');
      if (i > 0) {
        const previous = assertGet(indexed, i - 1, 'rank data');
        if (current.value !== previous.value) {
          currentRank = i + 1;
        }
      }
      ranks[current.index] = currentRank;
    }

    return ranks;
  }

  private powerIteration(
    matrix: number[][],
    maxIterations: number = 1000,
    tolerance: number = 1e-10,
  ): any {
    const n = matrix.length;
    let vector = new Array(n).fill(1);
    let eigenvalue = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
      const newVector = this.multiplyMatrixVector(matrix, vector);
      const norm = Math.sqrt(newVector.reduce((sum, v) => sum + v * v, 0));

      if (norm === 0) break;

      for (let i = 0; i < n; i++) {
        const value = safeGet(newVector, i, 0);
        newVector[i] = value / norm;
      }

      const newEigenvalue = this.dotProduct(vector, newVector);

      if (Math.abs(newEigenvalue - eigenvalue) < tolerance) {
        return { eigenvalue: norm, eigenvector: newVector };
      }

      eigenvalue = newEigenvalue;
      vector = newVector;
    }

    return { eigenvalue, eigenvector: vector };
  }

  private deflateMatrix(
    matrix: number[][],
    eigenvalue: number,
    eigenvector: number[],
  ): number[][] {
    const n = matrix.length;
    const result: number[][] = [];

    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < n; j++) {
        const row = assertGet(result, i, 'deflate matrix');
        const matrixValue = safeGet2D(matrix, i, j, 0);
        const eigenI = safeGet(eigenvector, i, 0);
        const eigenJ = safeGet(eigenvector, j, 0);
        row[j] = matrixValue - eigenvalue * eigenI * eigenJ;
      }
    }

    return result;
  }

  private findEigenvector(matrix: number[][], eigenvalue: number): number[] {
    const n = matrix.length;
    const modifiedMatrix = matrix.map((row, i) =>
      row.map((val, j) => (i === j ? val - eigenvalue : val)),
    );

    // Use power iteration to find eigenvector
    let vector = new Array(n).fill(1);

    for (let iter = 0; iter < 100; iter++) {
      vector = this.multiplyMatrixVector(modifiedMatrix, vector);
      const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      if (norm > 0) {
        vector = vector.map((v) => v / norm);
      }
    }

    return vector;
  }

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map((row) => this.dotProduct(row, vector));
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * safeGet(b, i, 0), 0);
  }

  private getSubMatrix(
    matrix: number[][],
    rowToRemove: number,
    colToRemove: number,
  ): number[][] {
    return matrix
      .filter((_, i) => i !== rowToRemove)
      .map((row) => row.filter((_, j) => j !== colToRemove));
  }

  private gaussianElimination(matrix: number[][]): number[][] {
    const n = matrix.length;
    const augmented: number[][] = [];

    // Create augmented matrix [A|I]
    for (let i = 0; i < n; i++) {
      const row = assertGet(matrix, i, 'gaussian elimination');
      augmented[i] = [...row];
      for (let j = 0; j < n; j++) {
        const augRow = assertGet(augmented, i, 'gaussian elimination');
        augRow.push(i === j ? 1 : 0);
      }
    }

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(safeGet2D(augmented, k, i, 0)) > Math.abs(safeGet2D(augmented, maxRow, i, 0))) {
          maxRow = k;
        }
      }

      // Swap rows
      const rowI = assertGet(augmented, i, 'gaussian elimination');
      const rowMaxRow = assertGet(augmented, maxRow, 'gaussian elimination');
      [augmented[i], augmented[maxRow]] = [rowMaxRow, rowI];

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const factor = safeGet2D(augmented, k, i, 0) / safeGet2D(augmented, i, i, 1);
        for (let j = i; j < 2 * n; j++) {
          const rowK = assertGet(augmented, k, 'gaussian elimination');
          const currentValue = safeGet(rowK, j, 0);
          const iValue = safeGet2D(augmented, i, j, 0);
          rowK[j] = currentValue - factor * iValue;
        }
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      for (let k = i - 1; k >= 0; k--) {
        const factor = safeGet2D(augmented, k, i, 0) / safeGet2D(augmented, i, i, 1);
        for (let j = i; j < 2 * n; j++) {
          const rowK = assertGet(augmented, k, 'back substitution');
          const currentValue = safeGet(rowK, j, 0);
          const iValue = safeGet2D(augmented, i, j, 0);
          rowK[j] = currentValue - factor * iValue;
        }
      }
    }

    // Normalize diagonal
    for (let i = 0; i < n; i++) {
      const divisor = safeGet2D(augmented, i, i, 1);
      for (let j = i; j < 2 * n; j++) {
        const row = assertGet(augmented, i, 'normalize diagonal');
        const value = safeGet(row, j, 0);
        row[j] = value / divisor;
      }
    }

    // Extract inverse matrix
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row = assertGet(augmented, i, 'extract inverse');
      inverse[i] = row.slice(n);
    }

    return inverse;
  }

  private calculatePercentile(
    sortedData: number[],
    percentile: number,
  ): number {
    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return safeGet(sortedData, lower, 0);
    }

    return safeGet(sortedData, lower, 0) * (1 - weight) + safeGet(sortedData, upper, 0) * weight;
  }

  private getZScore(confidence: number): number {
    // Approximation for common confidence levels
    const zScores: { [key: number]: number } = {
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    return zScores[confidence] || 1.96;
  }

  private bootstrapSample(data: number[]): number[] {
    const sample: number[] = [];
    const n = data.length;

    for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      sample.push(safeGet(data, randomIndex, 0));
    }

    return sample;
  }

  private approximatePValue(tStatistic: number, df: number): number {
    // Very rough approximation for demonstration
    const absT = Math.abs(tStatistic);
    if (absT < 1.96) return 0.5;
    if (absT < 2.576) return 0.05;
    if (absT < 3.291) return 0.01;
    return 0.001;
  }

  private approximateFPValue(
    fStatistic: number,
    df1: number,
    df2: number,
  ): number {
    // Very rough approximation for demonstration
    if (fStatistic < 3) return 0.5;
    if (fStatistic < 4) return 0.05;
    if (fStatistic < 7) return 0.01;
    return 0.001;
  }
}
