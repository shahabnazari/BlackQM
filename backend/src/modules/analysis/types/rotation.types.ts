/**
 * Type definitions for factor rotation methods
 */

export enum RotationMethod {
  VARIMAX = 'VARIMAX', // Orthogonal rotation - maximizes variance
  QUARTIMAX = 'QUARTIMAX', // Orthogonal rotation - minimizes factors per variable
  EQUIMAX = 'EQUIMAX', // Orthogonal rotation - compromise between Varimax and Quartimax
  PARSIMAX = 'PARSIMAX', // Orthogonal rotation - parsimony
  PROMAX = 'PROMAX', // Oblique rotation - based on Varimax
  OBLIMIN = 'OBLIMIN', // Oblique rotation - direct oblimin
  QUARTIMIN = 'QUARTIMIN', // Oblique rotation - special case of oblimin
  GEOMIN = 'GEOMIN', // Oblique rotation - geometric minimum
  MANUAL = 'MANUAL', // Manual/interactive rotation
  NONE = 'NONE', // No rotation
}

export interface RotationOptions {
  loadingMatrix: number[][];
  method: RotationMethod;
  numberOfFactors?: number;
  normalize?: boolean; // Kaiser normalization
  maxIterations?: number;
  convergenceCriterion?: number;
  // Oblique rotation parameters
  kappa?: number; // For Promax (typically 2-4)
  gamma?: number; // For Oblimin (0 = Quartimin, 0.5 = Biquartimin, 1 = Covarimin)
  delta?: number; // For Direct Oblimin
  // Manual rotation parameters
  rotationAngles?: {
    theta?: number; // Rotation angle around X axis
    phi?: number; // Rotation angle around Y axis
    psi?: number; // Rotation angle around Z axis
  };
  factorPairs?: [number, number][]; // Specific factor pairs to rotate
}

export interface RotationResult {
  method: RotationMethod;
  rotatedLoadings: number[][]; // Final rotated factor loadings
  rotationMatrix: number[][]; // Transformation matrix
  patternMatrix?: number[][]; // For oblique rotations
  structureMatrix?: number[][]; // For oblique rotations
  factorCorrelations?: number[][]; // For oblique rotations
  iterations: number;
  converged: boolean;
  oblique: boolean;
  normalized?: boolean;
  quality?: RotationQuality;
  warnings?: string[];
}

export interface RotationQuality {
  simplicityIndex: number; // Measure of simple structure (0-1)
  hyperplaneCount: number; // Number of near-zero loadings
  complexityIndex: number; // Average complexity per variable
  varianceExplained: number[]; // Variance explained by each factor after rotation
  crossLoadings: number; // Number of substantial cross-loadings
}

export interface InteractiveRotationState {
  currentLoadings: number[][];
  rotationHistory: RotationStep[];
  totalRotation: number[][];
  canUndo: boolean;
  canRedo: boolean;
}

export interface RotationStep {
  angle: number;
  factorPair: [number, number];
  timestamp: Date;
  loadingsBefore: number[][];
  loadingsAfter: number[][];
}

export interface RotationAnimation {
  startLoadings: number[][];
  endLoadings: number[][];
  duration: number; // Animation duration in ms
  frameRate: number; // Frames per second
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}
