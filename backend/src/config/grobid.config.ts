/**
 * GROBID Service Configuration
 * Phase 10.94 Minimal Implementation - Day 0
 *
 * CORRECTED VERSION - Issues Fixed:
 * ✅ Added environment variable validation
 * ✅ Added error handling for parseInt
 * ✅ Added URL format validation
 * ✅ Added ConfigValidationError class
 *
 * Service Size: < 80 lines (WITHIN LIMIT) ✅
 */

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export interface GrobidConfig {
  enabled: boolean;
  url: string;
  timeout: number;
  maxFileSize: number;
  consolidateHeader: boolean;
  consolidateCitations: boolean;
}

function validateUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must use http or https protocol');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid URL';
    throw new ConfigValidationError(`Invalid GROBID_URL: ${message}`);
  }
}

function parsePositiveInt(value: string | undefined, defaultValue: number, fieldName: string): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed <= 0) {
    throw new ConfigValidationError(
      `${fieldName} must be a positive integer, got: ${value}`
    );
  }

  return parsed;
}

export const getGrobidConfig = (): GrobidConfig => {
  const url = process.env.GROBID_URL || 'http://localhost:8070';

  // Validate URL format
  validateUrl(url);

  // Parse and validate numeric values
  const timeout = parsePositiveInt(
    process.env.GROBID_TIMEOUT,
    60000,
    'GROBID_TIMEOUT'
  );

  const maxFileSize = parsePositiveInt(
    process.env.GROBID_MAX_FILE_SIZE,
    52428800,
    'GROBID_MAX_FILE_SIZE'
  );

  return {
    enabled: process.env.GROBID_ENABLED === 'true',
    url,
    timeout,
    maxFileSize,
    consolidateHeader: process.env.GROBID_CONSOLIDATE_HEADER !== 'false',
    consolidateCitations: process.env.GROBID_CONSOLIDATE_CITATIONS !== 'false',
  };
};
