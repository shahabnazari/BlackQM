/**
 * Type definitions for factor extraction methods
 */

export enum ExtractionMethod {
  PCA = 'PCA', // Principal Component Analysis
  CENTROID = 'CENTROID', // Centroid Method
  ML = 'ML', // Maximum Likelihood
  PAF = 'PAF', // Principal Axis Factoring
  IMAGE = 'IMAGE', // Image Factoring
  ALPHA = 'ALPHA', // Alpha Factoring
  ULS = 'ULS', // Unweighted Least Squares
  GLS = 'GLS', // Generalized Least Squares
  MINRES = 'MINRES', // Minimum Residual
}

export interface ExtractionOptions {
  correlationMatrix: number[][];
  method: ExtractionMethod;
  numberOfFactors?: number;
  minEigenvalue?: number;
  maxIterations?: number;
  convergenceCriterion?: number;
  communalityEstimation?: 'SMC' | 'maxr' | 'unity';
  normalize?: boolean;
  sampleSize?: number;
}

export interface ExtractionResult {
  method: ExtractionMethod;
  eigenvalues: number[];
  eigenvectors?: number[][];
  factorLoadings: number[][];
  communalities: number[];
  variance: number[];
  cumulativeVariance: number[];
  numberOfFactors: number;
  iterations?: number;
  converged?: boolean;
  heywoodCase?: boolean;
  warnings?: string[];
  screeData?: ScreePoint[];
  chiSquare?: number;
  degreesOfFreedom?: number;
  pValue?: number;
}

export interface ScreePoint {
  factor: number;
  eigenvalue: number;
  variance?: number;
  cumulativeVariance?: number;
}

export interface CommunalityEstimate {
  initial: number[];
  extracted: number[];
  method: string;
}

export interface FactorExtractionValidation {
  kmoMeasure?: number; // Kaiser-Meyer-Olkin measure
  bartlettTest?: {
    chiSquare: number;
    df: number;
    pValue: number;
  };
  determinant?: number;
  conditionNumber?: number;
  reproduced?: {
    correlations: number[][];
    residuals: number[][];
    rmse: number;
  };
}
