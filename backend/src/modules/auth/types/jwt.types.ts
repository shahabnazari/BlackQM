/**
 * Shared JWT Authentication Types
 * Phase 10.92 Day 18 Stage 2 - STRICT AUDIT FIX (DX-001)
 *
 * Centralized type definitions for JWT authentication to ensure consistency
 * across strategy, guard, and consuming services.
 */

/**
 * JWT Payload structure as issued by AuthService
 * Must match the payload created in auth.service.ts
 */
export interface JwtPayload {
  sub: string; // User ID (subject claim)
  email: string; // User email
  iat?: number; // Issued at (Unix timestamp)
  exp?: number; // Expiration (Unix timestamp)
}

/**
 * User object returned after successful JWT validation
 * Attached to request.user by Passport after JwtStrategy.validate()
 */
export interface ValidatedUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean; // ✅ FIX (BUG-006): Changed from Date | null to boolean to match Prisma schema
  twoFactorEnabled: boolean;
  tenantId: string | null;
}

/**
 * Extended Request type with authenticated user
 * Use this in controllers that need typed access to request.user
 */
export interface AuthenticatedRequest extends Request {
  user: ValidatedUser;
}
