/**
 * Authentication headers utility
 * Provides JWT token from localStorage for authenticated API requests
 * Phase 10 Day 14: Fixed to use correct token key 'access_token'
 * Phase 10 Day 34: Added enterprise-grade validation and environment-conditional logging
 */

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return {};
  }

  // Phase 10 Day 14: Check 'access_token' (primary) and 'auth_token' (legacy)
  // Auth service stores token as 'access_token', not 'auth_token'
  const token =
    localStorage.getItem('access_token') || localStorage.getItem('auth_token');

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Auth Headers] No token found in localStorage');
    }
    return {};
  }

  // Enterprise-grade validation: Ensure token is a valid JWT
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    console.error(
      `[Auth Headers] INVALID JWT! Expected 3 parts, got ${tokenParts.length}`
    );
    console.error(`[Auth Headers] Token stored in localStorage is corrupted`);
    // Clear corrupted token
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    return {};
  }

  if (token.length < 100) {
    console.error(
      `[Auth Headers] Token too short! Length: ${token.length} (expected >100)`
    );
    console.error(`[Auth Headers] Token may be truncated`);
    return {};
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth Headers] Token found:', token.substring(0, 20) + '...');
    console.log('[Auth Headers] Token length:', token.length);
    console.log('[Auth Headers] Token parts:', tokenParts.length);
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
