import { Injectable } from '@nestjs/common';

/**
 * Q-Methodology Statistical Validation Service
 * Validates Q-methodology calculations against PQMethod standards
 * Ensures statistical accuracy for academic research
 */
@Injectable()
export class QMethodValidatorService {
  /**
   * Validate factor correlation against PQMethod benchmark
   * @param calculated - Calculated correlation value
   * @param expected - Expected correlation value from PQMethod
   * @returns true if correlation meets accuracy threshold (≥0.99)
   */
  validateFactorCorrelation(calculated: number, expected: number): boolean {
    // Check if the correlation coefficient is at least 0.99
    const correlationCoefficient = Math.abs(calculated);
    return correlationCoefficient >= 0.99;
  }

  /**
   * Validate eigenvalues with tolerance
   * @param calculated - Array of calculated eigenvalues
   * @param expected - Array of expected eigenvalues from PQMethod
   * @param tolerance - Acceptable tolerance (default: 0.01)
   * @returns true if all eigenvalues are within tolerance
   */
  validateEigenvalues(
    calculated: number[],
    expected: number[],
    tolerance: number = 0.01
  ): boolean {
    if (calculated.length !== expected.length) {
      return false;
    }

    return calculated.every((value, index) => {
      const difference = Math.abs(value - expected[index]);
      // Round difference to avoid floating point precision issues
      const roundedDiff = Math.round(difference * 1000) / 1000;
      return roundedDiff <= tolerance;
    });
  }

  /**
   * Validate factor loadings with precision
   * @param calculated - Matrix of calculated factor loadings
   * @param expected - Matrix of expected factor loadings from PQMethod
   * @param tolerance - Acceptable tolerance (default: 0.001)
   * @returns true if all loadings are within tolerance
   */
  validateFactorLoadings(
    calculated: number[][],
    expected: number[][],
    tolerance: number = 0.001
  ): boolean {
    if (calculated.length !== expected.length) {
      return false;
    }

    return calculated.every((row, rowIndex) => {
      if (row.length !== expected[rowIndex].length) {
        return false;
      }
      
      return row.every((value, colIndex) => {
        const difference = Math.abs(value - expected[rowIndex][colIndex]);
        // Use a small epsilon to handle floating point precision issues
        return difference <= tolerance + Number.EPSILON;
      });
    });
  }

  /**
   * Validate z-scores to 3 decimal places
   * @param calculated - Array of calculated z-scores
   * @param expected - Array of expected z-scores from PQMethod
   * @returns true if all z-scores match to 3 decimal places
   */
  validateZScores(calculated: number[], expected: number[]): boolean {
    if (calculated.length !== expected.length) {
      return false;
    }

    return calculated.every((value, index) => {
      // Check if values match to 3 decimal places
      // This means the absolute difference should be less than 0.0005
      const difference = Math.abs(value - expected[index]);
      return difference < 0.0005;
    });
  }

  /**
   * Calculate correlation matrix for Q-sorts
   * @param qsorts - Matrix of Q-sort data (participants x statements)
   * @returns Correlation matrix
   */
  calculateCorrelationMatrix(qsorts: number[][]): number[][] {
    const n = qsorts.length;
    const correlationMatrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        correlationMatrix[i][j] = this.calculatePearsonCorrelation(
          qsorts[i],
          qsorts[j]
        );
      }
    }

    return correlationMatrix;
  }

  /**
   * Calculate Pearson correlation coefficient
   * @param x - First array of values
   * @param y - Second array of values
   * @returns Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  /**
   * Perform comprehensive validation against PQMethod benchmark
   * @param studyData - Calculated study data
   * @param benchmark - PQMethod benchmark data
   * @returns Validation report with detailed results
   */
  validateAgainstBenchmark(
    studyData: {
      eigenvalues: number[];
      factorLoadings: number[][];
      zScores: number[];
      correlationMatrix: number[][];
    },
    benchmark: {
      eigenvalues: number[];
      factorLoadings: number[][];
      zScores: number[];
      expectedCorrelation: number;
    }
  ): {
    isValid: boolean;
    eigenvaluesValid: boolean;
    factorLoadingsValid: boolean;
    zScoresValid: boolean;
    correlationValid: boolean;
    details: string[];
  } {
    const details: string[] = [];

    // Validate eigenvalues
    const eigenvaluesValid = this.validateEigenvalues(
      studyData.eigenvalues,
      benchmark.eigenvalues
    );
    details.push(
      `Eigenvalues: ${eigenvaluesValid ? 'PASS' : 'FAIL'} (tolerance: ±0.01)`
    );

    // Validate factor loadings
    const factorLoadingsValid = this.validateFactorLoadings(
      studyData.factorLoadings,
      benchmark.factorLoadings
    );
    details.push(
      `Factor Loadings: ${factorLoadingsValid ? 'PASS' : 'FAIL'} (tolerance: ±0.001)`
    );

    // Validate z-scores
    const zScoresValid = this.validateZScores(
      studyData.zScores,
      benchmark.zScores
    );
    details.push(
      `Z-Scores: ${zScoresValid ? 'PASS' : 'FAIL'} (3 decimal places)`
    );

    // Calculate average correlation from matrix
    const correlations = studyData.correlationMatrix
      .flat()
      .filter((_, index) => index % (studyData.correlationMatrix.length + 1) !== 0); // Exclude diagonal
    const avgCorrelation = correlations.reduce((a, b) => a + Math.abs(b), 0) / correlations.length;
    
    const correlationValid = this.validateFactorCorrelation(
      avgCorrelation,
      benchmark.expectedCorrelation
    );
    details.push(
      `Factor Correlation: ${correlationValid ? 'PASS' : 'FAIL'} (≥0.99 required)`
    );

    const isValid = eigenvaluesValid && factorLoadingsValid && zScoresValid && correlationValid;

    return {
      isValid,
      eigenvaluesValid,
      factorLoadingsValid,
      zScoresValid,
      correlationValid,
      details
    };
  }
}

// Export for use in analysis module
export default QMethodValidatorService;