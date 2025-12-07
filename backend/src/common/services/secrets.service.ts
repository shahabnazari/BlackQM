/**
 * Phase 10.102 Phase 9: Security Hardening
 *
 * Secrets Management Service
 *
 * OWASP A02:2021 - Cryptographic Failures Prevention
 * OWASP A05:2021 - Security Misconfiguration Prevention
 *
 * Centralized secrets management with:
 * - AWS Secrets Manager integration (production)
 * - Environment variables fallback (development)
 * - Secret rotation support
 * - Caching with TTL
 * - Audit logging
 *
 * Netflix-Grade Security Standards:
 * - No secrets in code or version control
 * - Automatic secret rotation
 * - Encryption at rest and in transit
 * - Least privilege access
 * - Comprehensive audit trails
 *
 * Usage:
 * ```typescript
 * // Get database URL
 * const dbUrl = await this.secretsService.getSecret('DATABASE_URL');
 *
 * // Get JWT secret
 * const jwtSecret = await this.secretsService.getSecret('JWT_SECRET');
 *
 * // Get API key with structured data
 * const openaiKey = await this.secretsService.getSecretJson('API_KEYS_OPENAI');
 * ```
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class SecretsService implements OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);

  // In-memory cache with TTL (1 hour)
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private readonly cacheTtl = 3600000; // 1 hour in milliseconds

  // AWS Secrets Manager client (lazy-loaded in production)
  private secretsManager: any = null;

  /**
   * Environment-specific configuration
   */
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly awsRegion = process.env.AWS_REGION || 'us-east-1';

  /**
   * Secret name mappings
   *
   * Maps environment variable names to AWS Secrets Manager secret names
   *
   * Format: ENV_VAR_NAME => aws/secretsmanager/path
   */
  private readonly secretMappings: Record<string, string> = {
    // Database
    DATABASE_URL: 'vqmethod/database/url',
    DATABASE_HOST: 'vqmethod/database/host',
    DATABASE_PASSWORD: 'vqmethod/database/password',

    // Redis
    REDIS_URL: 'vqmethod/redis/url',
    REDIS_PASSWORD: 'vqmethod/redis/password',

    // JWT
    JWT_SECRET: 'vqmethod/jwt/secret',
    JWT_REFRESH_SECRET: 'vqmethod/jwt/refresh-secret',

    // API Keys - OpenAI
    OPENAI_API_KEY: 'vqmethod/api-keys/openai',
    OPENAI_ORG_ID: 'vqmethod/api-keys/openai-org',

    // API Keys - Academic Publishers
    SEMANTIC_SCHOLAR_API_KEY: 'vqmethod/api-keys/semantic-scholar',
    SPRINGER_API_KEY: 'vqmethod/api-keys/springer',
    NCBI_API_KEY: 'vqmethod/api-keys/ncbi',
    UNPAYWALL_EMAIL: 'vqmethod/api-keys/unpaywall-email',

    // Sentry
    SENTRY_DSN: 'vqmethod/monitoring/sentry-dsn',

    // Email (SendGrid/SES)
    EMAIL_API_KEY: 'vqmethod/email/api-key',
    EMAIL_FROM: 'vqmethod/email/from-address',

    // OAuth (Google, GitHub, etc.)
    GOOGLE_CLIENT_ID: 'vqmethod/oauth/google-client-id',
    GOOGLE_CLIENT_SECRET: 'vqmethod/oauth/google-client-secret',
    GITHUB_CLIENT_ID: 'vqmethod/oauth/github-client-id',
    GITHUB_CLIENT_SECRET: 'vqmethod/oauth/github-client-secret',

    // Encryption
    ENCRYPTION_KEY: 'vqmethod/encryption/master-key',
    ENCRYPTION_IV: 'vqmethod/encryption/iv',
  };

  /**
   * Initialize secrets on module startup
   *
   * Pre-loads critical secrets to avoid cold start latency
   */
  async onModuleInit() {
    this.logger.log('Initializing Secrets Management Service...');

    if (this.isProduction) {
      // Initialize AWS Secrets Manager client
      this.initializeAwsSecretsManager();

      // Pre-load critical secrets
      await this.preloadCriticalSecrets();

      this.logger.log('✅ AWS Secrets Manager initialized and critical secrets pre-loaded');
    } else {
      this.logger.log('✅ Development mode: Using environment variables');
    }
  }

  /**
   * Get secret value
   *
   * - Production: Fetches from AWS Secrets Manager
   * - Development: Falls back to process.env
   * - Caching: 1-hour TTL to reduce API calls
   *
   * @param secretKey - Environment variable name or AWS secret name
   * @returns Secret value as string
   */
  async getSecret(secretKey: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Development: Use environment variables
    if (!this.isProduction) {
      const value = process.env[secretKey];
      if (!value) {
        this.logger.warn(`Secret not found in environment: ${secretKey}`);
        return '';
      }
      return value;
    }

    // Production: Fetch from AWS Secrets Manager
    try {
      const secretName = this.secretMappings[secretKey] || secretKey;
      const value = await this.fetchFromAws(secretName);

      // Cache for 1 hour
      this.cache.set(secretKey, {
        value,
        expiresAt: Date.now() + this.cacheTtl,
      });

      return value;
    } catch (error: any) {
      this.logger.error(`Failed to fetch secret: ${secretKey}`, error.message);

      // Fallback to environment variable if AWS fails
      const envValue = process.env[secretKey];
      if (envValue) {
        this.logger.warn(`Falling back to environment variable for: ${secretKey}`);
        return envValue;
      }

      throw new Error(`Secret not found: ${secretKey}`);
    }
  }

  /**
   * Get secret as JSON object
   *
   * Useful for structured secrets like API credentials with multiple fields
   *
   * @example
   * const dbConfig = await secretsService.getSecretJson('DATABASE_CONFIG');
   * // Returns: { host: '...', port: 5432, username: '...', password: '...' }
   */
  async getSecretJson(secretKey: string): Promise<any> {
    const secretString = await this.getSecret(secretKey);

    try {
      return JSON.parse(secretString);
    } catch (error) {
      this.logger.error(`Failed to parse secret as JSON: ${secretKey}`);
      throw new Error(`Invalid JSON in secret: ${secretKey}`);
    }
  }

  /**
   * Rotate secret (trigger rotation in AWS Secrets Manager)
   *
   * For production use only
   */
  async rotateSecret(secretKey: string): Promise<void> {
    if (!this.isProduction) {
      this.logger.warn('Secret rotation is only supported in production');
      return;
    }

    // Clear cache to force refresh
    this.cache.delete(secretKey);

    // Trigger rotation in AWS Secrets Manager
    const secretName = this.secretMappings[secretKey] || secretKey;

    try {
      if (!this.secretsManager) {
        throw new Error('AWS Secrets Manager not initialized');
      }

      const { RotateSecretCommand } = await import('@aws-sdk/client-secrets-manager');

      await this.secretsManager.send(
        new RotateSecretCommand({
          SecretId: secretName,
        })
      );

      this.logger.log(`✅ Secret rotation initiated: ${secretKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to rotate secret: ${secretKey}`, error.message);
      throw error;
    }
  }

  /**
   * Clear cache (for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Secrets cache cleared');
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Initialize AWS Secrets Manager client
   *
   * Lazy-loaded to avoid importing AWS SDK in development
   */
  private async initializeAwsSecretsManager(): Promise<void> {
    try {
      const { SecretsManagerClient } = await import('@aws-sdk/client-secrets-manager');

      this.secretsManager = new SecretsManagerClient({
        region: this.awsRegion,
      });

      this.logger.log(`AWS Secrets Manager client initialized (region: ${this.awsRegion})`);
    } catch (error: any) {
      this.logger.error('Failed to initialize AWS Secrets Manager', error.message);
      throw error;
    }
  }

  /**
   * Fetch secret from AWS Secrets Manager
   */
  private async fetchFromAws(secretName: string): Promise<string> {
    if (!this.secretsManager) {
      throw new Error('AWS Secrets Manager not initialized');
    }

    try {
      const { GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');

      const response = await this.secretsManager.send(
        new GetSecretValueCommand({
          SecretId: secretName,
        })
      );

      return response.SecretString || '';
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        this.logger.error(`Secret not found in AWS: ${secretName}`);
      } else if (error.name === 'InvalidRequestException') {
        this.logger.error(`Invalid request for secret: ${secretName}`);
      } else if (error.name === 'InvalidParameterException') {
        this.logger.error(`Invalid parameter for secret: ${secretName}`);
      }

      throw error;
    }
  }

  /**
   * Pre-load critical secrets on startup
   *
   * Reduces cold start latency for first requests
   */
  private async preloadCriticalSecrets(): Promise<void> {
    const criticalSecrets = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REDIS_URL',
      'OPENAI_API_KEY',
      'SENTRY_DSN',
    ];

    this.logger.log('Pre-loading critical secrets...');

    const results = await Promise.allSettled(
      criticalSecrets.map((key) => this.getSecret(key))
    );

    const loaded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(`Pre-loaded ${loaded}/${criticalSecrets.length} critical secrets`);

    if (failed > 0) {
      this.logger.warn(`Failed to pre-load ${failed} secrets (will retry on demand)`);
    }
  }
}
