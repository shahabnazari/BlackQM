/**
 * Phase 10.102 Phase 9: Security Hardening
 *
 * Security Module
 *
 * Centralized security module providing:
 * - Input Sanitization Service (A03: Injection Prevention)
 * - Security Logger Service (A09: Security Logging)
 * - HTTP Client Security Service (A10: SSRF Protection)
 * - Secrets Management Service (A02: Cryptographic Failures)
 *
 * Netflix-Grade Security Standards:
 * - Defense in depth
 * - Fail-safe defaults
 * - Complete separation of duties
 * - Comprehensive logging
 * - Zero-trust architecture
 *
 * Usage in other modules:
 * ```typescript
 * import { SecurityModule } from './common/security/security.module';
 *
 * @Module({
 *   imports: [SecurityModule],
 *   ...
 * })
 * export class YourModule {}
 * ```
 */

import { Module, Global } from '@nestjs/common';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { SecurityLoggerService } from '../services/security-logger.service';
import { HttpClientSecurityService } from '../services/http-client-security.service';
import { SecretsService } from '../services/secrets.service';

/**
 * @Global decorator makes this module's providers available globally
 *
 * This means you don't need to import SecurityModule in every module
 * that needs security services
 */
@Global()
@Module({
  providers: [
    InputSanitizationService,
    SecurityLoggerService,
    HttpClientSecurityService,
    SecretsService,
  ],
  exports: [
    InputSanitizationService,
    SecurityLoggerService,
    HttpClientSecurityService,
    SecretsService,
  ],
})
export class SecurityModule {}
