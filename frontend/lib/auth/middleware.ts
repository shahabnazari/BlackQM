/**
 * Authentication Middleware for API Routes
 * Phase 6.86 - Enterprise-grade security
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

/**
 * Verify authentication for API routes
 * Returns user info if authenticated, null if not
 */
export async function verifyAuth(req: NextRequest): Promise<{
  authenticated: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Try to get session first (for server components)
    const session = await getServerSession();

    if (session && session.user) {
      return {
        authenticated: true,
        user: session.user,
      };
    }

    // Try JWT token (for API routes)
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return { authenticated: false };
    }

    const token = await getToken({
      req,
      secret,
    });

    if (token) {
      return {
        authenticated: true,
        user: {
          id: token.sub,
          email: token.email as string,
          name: token.name as string,
        },
      };
    }

    // Check for API key authentication (for service-to-service calls)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey && apiKey === process.env.INTERNAL_API_KEY) {
      return {
        authenticated: true,
        user: {
          id: 'system',
          email: 'system@vqmethod.com',
          role: 'system',
        },
      };
    }

    return {
      authenticated: false,
      error: 'No valid authentication found',
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      authenticated: false,
      error: 'Authentication verification failed',
    };
  }
}

/**
 * Middleware wrapper to require authentication
 */
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const auth = await verifyAuth(req);

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: auth.error,
        },
        { status: 401 }
      );
    }

    // Add user to request for handler use
    (req as any).user = auth.user;

    return handler(req, context);
  };
}

/**
 * Check if user has required role
 */
export function requireRole(role: string | string[]) {
  const roles = Array.isArray(role) ? role : [role];

  return function (
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return withAuth(async (req: NextRequest, context?: any) => {
      const user = (req as any).user;

      if (!user || !user.role) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      if (!roles.includes(user.role)) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            required: roles,
            current: user.role,
          },
          { status: 403 }
        );
      }

      return handler(req, context);
    });
  };
}

/**
 * Rate limiting per user
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  options: {
    requests: number;
    windowMs: number;
  } = { requests: 10, windowMs: 60000 }
) {
  return function (
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return withAuth(async (req: NextRequest, context?: any) => {
      const user = (req as any).user;
      const userId = user?.id || 'anonymous';
      const now = Date.now();

      const userLimit = rateLimitMap.get(userId);

      if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, {
          count: 1,
          resetTime: now + options.windowMs,
        });
      } else {
        if (userLimit.count >= options.requests) {
          const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);

          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              retryAfter,
            },
            {
              status: 429,
              headers: {
                'Retry-After': retryAfter.toString(),
              },
            }
          );
        }

        userLimit.count++;
      }

      return handler(req, context);
    });
  };
}
