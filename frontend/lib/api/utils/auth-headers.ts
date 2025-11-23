/**
 * Authentication headers utility
 * Provides JWT token from localStorage for authenticated API requests
 * Phase 10 Day 14: Fixed to use correct token key 'access_token'
 * Phase 10 Day 34: Added enterprise-grade validation and environment-conditional logging
 * PHASE 10.94.3: Added warning rate limiting to prevent console spam
 */

// PERF FIX: Rate limit "no token" warnings to prevent console spam
// Only warn once per 10 seconds instead of on every call
let lastNoTokenWarning = 0;
const NO_TOKEN_WARNING_INTERVAL_MS = 10000; // 10 seconds

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
    // PERF FIX: Rate limit warnings to prevent console spam (8+ calls on page load)
    const now = Date.now();
    if (process.env.NODE_ENV !== 'production' && now - lastNoTokenWarning > NO_TOKEN_WARNING_INTERVAL_MS) {
      console.warn('[Auth Headers] No token found in localStorage (this warning is rate-limited to once per 10s)');
      lastNoTokenWarning = now;
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
