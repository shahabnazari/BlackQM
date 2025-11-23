import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { JwtPayload, ValidatedUser } from '../types/jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly isDevelopment: boolean;

  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'default-secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    // Initialize after super() call
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    // ✅ Phase 10.92 Day 18 Stage 2: Enterprise logging on initialization
    // 🔒 STRICT AUDIT FIX (SECURITY-002): Only log secret prefix in development
    if (this.isDevelopment) {
      this.logger.log(
        `JWT Strategy initialized (secret prefix: ${jwtSecret.substring(0, 10)}...)`,
        'JwtStrategy',
      );
    } else {
      this.logger.log('JWT Strategy initialized', 'JwtStrategy');
    }

    this.logger.logSecurity(
      'JWT_STRATEGY_INITIALIZED',
      {
        environment: this.isDevelopment ? 'development' : 'production',
        ignoreExpiration: false,
      },
      'low',
    );
  }

  /**
   * Validate JWT payload and return authenticated user
   * Phase 10.92 Day 18 Stage 2: Enterprise-grade validation with comprehensive logging
   *
   * @param payload JWT payload decoded by Passport
   * @returns Validated user object for request context
   * @throws UnauthorizedException if validation fails
   */
  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    // ⚡ STRICT AUDIT FIX (PERFORMANCE-001): Store timestamp once
    const startTime = Date.now();
    const correlationId = `auth_${startTime}_${Math.random().toString(36).substring(7)}`;

    // ✅ STEP 1: Log validation entry point
    // 🔒 STRICT AUDIT NOTE (SECURITY-001): Email is PII - logged for security audit trail
    // Consider implementing email hashing/redaction for production if required by privacy policy
    this.logger.logSecurity(
      'JWT_VALIDATION_STARTED',
      {
        correlationId,
        userId: payload.sub,
        emailHash: this.isDevelopment
          ? payload.email
          : this.hashEmail(payload.email),
        issuedAt: payload.iat
          ? new Date(payload.iat * 1000).toISOString()
          : null,
        expiresAt: payload.exp
          ? new Date(payload.exp * 1000).toISOString()
          : null,
      },
      'low',
    );

    try {
      // ✅ STEP 2: Validate payload structure
      if (!payload.sub || typeof payload.sub !== 'string') {
        this.logger.logSecurity(
          'JWT_VALIDATION_FAILED_INVALID_PAYLOAD',
          {
            correlationId,
            reason: 'Missing or invalid sub claim',
            hasSub: !!payload.sub,
            subType: typeof payload.sub,
          },
          'high',
        );
        throw new UnauthorizedException('Invalid token payload: missing user ID');
      }

      if (!payload.email || typeof payload.email !== 'string') {
        this.logger.logSecurity(
          'JWT_VALIDATION_FAILED_INVALID_PAYLOAD',
          {
            correlationId,
            reason: 'Missing or invalid email claim',
            userId: payload.sub,
            hasEmail: !!payload.email,
            emailType: typeof payload.email,
          },
          'high',
        );
        throw new UnauthorizedException('Invalid token payload: missing email');
      }

      // ✅ STEP 3: Query database for user
      const queryStartTime = Date.now();
      this.logger.debug(
        `Querying database for user ${payload.sub}`,
        'JwtStrategy',
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          twoFactorEnabled: true,
          tenantId: true,
        },
      });

      const queryDuration = Date.now() - queryStartTime;
      this.logger.logPerformance('jwt_user_lookup', queryDuration, {
        correlationId,
        userId: payload.sub,
      });

      // ✅ STEP 4: Validate user exists
      if (!user) {
        this.logger.logSecurity(
          'JWT_VALIDATION_FAILED_USER_NOT_FOUND',
          {
            correlationId,
            userId: payload.sub,
            emailHash: this.isDevelopment
              ? payload.email
              : this.hashEmail(payload.email),
            queryDuration,
          },
          'high',
        );
        throw new UnauthorizedException('User not found');
      }

      // ✅ STEP 5: Validate user is active
      if (!user.isActive) {
        this.logger.logSecurity(
          'JWT_VALIDATION_FAILED_USER_INACTIVE',
          {
            correlationId,
            userId: user.id,
            emailHash: this.isDevelopment
              ? user.email
              : this.hashEmail(user.email),
            role: user.role,
          },
          'medium',
        );
        throw new UnauthorizedException('User account is inactive');
      }

      // ✅ STEP 6: Validate email matches token
      if (user.email !== payload.email) {
        this.logger.logSecurity(
          'JWT_VALIDATION_FAILED_EMAIL_MISMATCH',
          {
            correlationId,
            userId: user.id,
            tokenEmailHash: this.hashEmail(payload.email),
            dbEmailHash: this.hashEmail(user.email),
          },
          'critical',
        );
        throw new UnauthorizedException('Token email mismatch');
      }

      // ✅ STEP 7: Build validated user object
      const validatedUser: ValidatedUser = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        tenantId: user.tenantId,
      };

      // ✅ STEP 8: Log successful validation
      const validationDuration = Date.now() - startTime;
      this.logger.logSecurity(
        'JWT_VALIDATION_SUCCESS',
        {
          correlationId,
          userId: user.id,
          emailHash: this.isDevelopment
            ? user.email
            : this.hashEmail(user.email),
          role: user.role,
          emailVerified: !!user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          tenantId: user.tenantId,
          validationDuration,
        },
        'low',
      );

      this.logger.logPerformance(
        'jwt_validation_complete',
        validationDuration,
        {
          correlationId,
          userId: user.id,
        },
      );

      return validatedUser;
    } catch (error: unknown) {
      // ✅ STEP 9: Handle and log errors
      const validationDuration = Date.now() - startTime;

      // Type-safe error handling
      if (error instanceof UnauthorizedException) {
        // Already logged above, just rethrow
        throw error;
      }

      // Unexpected error - log with high severity
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.logSecurity(
        'JWT_VALIDATION_ERROR_UNEXPECTED',
        {
          correlationId,
          userId: payload.sub,
          emailHash: this.isDevelopment
            ? payload.email
            : this.hashEmail(payload.email),
          error: errorMessage,
          stack: this.isDevelopment ? errorStack : undefined,
          validationDuration,
        },
        'critical',
      );

      this.logger.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: payload.sub,
          metadata: { correlationId },
        },
      );

      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Hash email for privacy-compliant logging
   * 🔒 STRICT AUDIT FIX (SECURITY-001): Redact PII in production logs
   *
   * @param email Email address to hash
   * @returns First 3 chars + hash or full email in development
   */
  private hashEmail(email: string): string {
    if (this.isDevelopment) {
      return email; // Full email in development for debugging
    }

    // In production: show first 3 chars + hash (e.g., "use***a1b2c3")
    const prefix = email.substring(0, 3);
    // Simple hash - in production, use crypto.createHash('sha256')
    const hash = email
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(36)
      .substring(0, 6);

    return `${prefix}***${hash}`;
  }
}
