import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LoggerService } from '../../../common/logger/logger.service';
import { ValidatedUser } from '../types/jwt.types';

/**
 * JWT Authentication Guard with Enhanced Logging
 * Phase 10.92 Day 18 Stage 2 - STRICT AUDIT CORRECTED
 *
 * Fixes Applied:
 * - TYPE-001: Removed `any` from generic default
 * - TYPE-002: Properly typed user parameter
 * - CONSISTENCY-001: Consistent correlation ID format
 * - BUG-001: More robust error categorization
 * - PERFORMANCE-002: Configurable logging verbosity
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  // ⚡ STRICT AUDIT FIX (PERFORMANCE-002): Make verbose logging configurable
  private readonly verboseLogging =
    process.env.JWT_VERBOSE_LOGGING === 'true' || this.isDevelopment;

  constructor(
    private reflector: Reflector,
    private logger: LoggerService,
  ) {
    super();
  }

  /**
   * Check if route requires authentication
   * Phase 10.92 Day 18 Stage 2: Enhanced guard with logging
   */
  canActivate(context: ExecutionContext) {
    // 🔧 STRICT AUDIT FIX (CONSISTENCY-001): Use consistent correlation ID format
    const correlationId = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      if (this.verboseLogging) {
        this.logger.debug(
          'Public route accessed - bypassing authentication',
          'JwtAuthGuard',
        );
      }
      return true;
    }

    // Get request details for logging
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, headers } = request;
    const ip = request.ip || 'unknown'; // ✅ FIX (BUG-005): Handle undefined ip
    const authHeader = headers.authorization;

    // PHASE 10.94.3: Development mode auth bypass for testing
    // When DEV_AUTH_BYPASS=true and X-Dev-Auth-Bypass header is present, allow request
    // This enables testing theme extraction without authentication in development
    const devAuthBypass = process.env.DEV_AUTH_BYPASS === 'true';
    const hasDevBypassHeader = headers['x-dev-auth-bypass'] === 'true';

    // CRITICAL-005 FIX: Triple-check we're truly in development to prevent production bypass
    const isReallyDevelopment =
      process.env.NODE_ENV === 'development' &&
      !process.env.PRODUCTION &&
      !process.env.VERCEL_ENV &&
      !process.env.RAILWAY_ENVIRONMENT &&
      !process.env.RENDER_EXTERNAL_URL;

    // SECURITY: Fail loudly if bypass is attempted in production
    if (devAuthBypass && hasDevBypassHeader && !isReallyDevelopment) {
      this.logger.logSecurity(
        'CRITICAL_SECURITY_VIOLATION',
        {
          message: 'DEV_AUTH_BYPASS attempted in non-development environment!',
          nodeEnv: process.env.NODE_ENV,
          hasVercel: !!process.env.VERCEL_ENV,
          hasRailway: !!process.env.RAILWAY_ENVIRONMENT,
          ip,
          url,
        },
        'critical',
      );
      // Do NOT bypass - let the request proceed to normal auth
    }

    if (devAuthBypass && isReallyDevelopment && hasDevBypassHeader) {
      this.logger.warn(
        '⚠️  DEV_AUTH_BYPASS enabled - THIS MUST NEVER HAPPEN IN PRODUCTION',
        'JwtAuthGuard',
      );
      // Attach a mock user to the request for downstream use
      (request as Request & { user: ValidatedUser }).user = {
        userId: 'dev-user-bypass',
        email: 'dev@localhost',
        name: 'Dev User (Auth Bypassed)',
        role: 'researcher',
        emailVerified: true,
        twoFactorEnabled: false,
        tenantId: null,
      };
      return true;
    }

    // ✅ Phase 10.92 Day 18 Stage 2: Log authentication attempt
    // ⚡ STRICT AUDIT FIX (PERFORMANCE-002): Only log if verbose logging enabled
    if (this.verboseLogging) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_INVOKED',
        {
          correlationId,
          method,
          url,
          ip,
          hasAuthHeader: !!authHeader,
          authHeaderFormat: authHeader?.substring(0, 7), // "Bearer " only
          userAgent: headers['user-agent']?.substring(0, 100),
        },
        'low',
      );
    }

    // Validate Authorization header format (always log issues)
    if (!authHeader) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_MISSING_HEADER',
        {
          correlationId,
          method,
          url,
          ip,
        },
        'medium',
      );
    } else if (!authHeader.startsWith('Bearer ')) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_INVALID_HEADER_FORMAT',
        {
          correlationId,
          method,
          url,
          ip,
          authHeaderPrefix: authHeader.substring(0, 10),
        },
        'medium',
      );
    }

    return super.canActivate(context);
  }

  /**
   * Handle the result of JWT validation
   * Phase 10.92 Day 18 Stage 2: Enhanced error handling with logging
   * 🔒 STRICT AUDIT FIX (TYPE-001, TYPE-002): Properly typed with ValidatedUser
   */
  handleRequest<TUser extends ValidatedUser = ValidatedUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    context: ExecutionContext,
    status?: number,
  ): TUser {
    // 🔧 STRICT AUDIT FIX (CONSISTENCY-001): Use consistent correlation ID format
    const correlationId = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const ip = request.ip || 'unknown'; // ✅ FIX (BUG-005): Handle undefined ip

    // ✅ Phase 10.92 Day 18 Stage 2: Log authentication result
    if (err || !user) {
      // Authentication failed
      const errorMessage =
        err?.message || info?.message || 'Unknown authentication error';
      const errorName = err?.name || info?.name || 'UnknownError';

      this.logger.logSecurity(
        'JWT_AUTH_GUARD_FAILED',
        {
          correlationId,
          method,
          url,
          ip,
          errorName,
          errorMessage,
          hasError: !!err,
          hasUser: !!user,
          hasInfo: !!info,
          infoType: info?.constructor.name,
        },
        'high',
      );

      // 🔧 STRICT AUDIT FIX (BUG-001): More robust error categorization
      // Check error name/type first, then fall back to message matching
      this.categorizeAuthError(
        errorName,
        errorMessage,
        correlationId,
        method,
        url,
        ip,
      );

      throw err || new UnauthorizedException(errorMessage);
    }

    // Authentication successful
    // 🔒 STRICT AUDIT FIX (TYPE-002): No more `as any` - user is properly typed
    if (this.verboseLogging) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_SUCCESS',
        {
          correlationId,
          method,
          url,
          ip,
          userId: user.userId,
          emailHash: this.hashEmailForLogging(user.email),
          role: user.role,
        },
        'low',
      );
    }

    return super.handleRequest(err, user, info, context, status);
  }

  /**
   * Categorize authentication errors for detailed logging
   * 🔧 STRICT AUDIT FIX (BUG-001): Improved error categorization
   */
  private categorizeAuthError(
    errorName: string,
    errorMessage: string,
    correlationId: string,
    method: string,
    url: string,
    ip: string,
  ): void {
    const context = { correlationId, method, url, ip };

    // Check error name first (more reliable than message)
    if (
      errorName === 'TokenExpiredError' ||
      errorMessage.toLowerCase().includes('expired')
    ) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_TOKEN_EXPIRED',
        context,
        'medium',
      );
    } else if (
      errorName === 'JsonWebTokenError' ||
      errorMessage.toLowerCase().includes('malformed') ||
      errorMessage.toLowerCase().includes('invalid')
    ) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_TOKEN_INVALID',
        context,
        'high',
      );
    } else if (
      errorName === 'NotBeforeError' ||
      errorMessage.toLowerCase().includes('signature')
    ) {
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_SIGNATURE_VERIFICATION_FAILED',
        context,
        'critical',
      );
    } else {
      // Unknown error type
      this.logger.logSecurity(
        'JWT_AUTH_GUARD_UNKNOWN_ERROR',
        { ...context, errorName, errorMessage },
        'high',
      );
    }
  }

  /**
   * Hash email for privacy-compliant logging
   * 🔒 STRICT AUDIT FIX (SECURITY-001): Consistent with jwt.strategy.ts
   */
  private hashEmailForLogging(email: string): string {
    if (this.isDevelopment) {
      return email; // Full email in development for debugging
    }

    // In production: show first 3 chars + hash (e.g., "use***a1b2c3")
    const prefix = email.substring(0, 3);
    const hash = email
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(36)
      .substring(0, 6);

    return `${prefix}***${hash}`;
  }
}
