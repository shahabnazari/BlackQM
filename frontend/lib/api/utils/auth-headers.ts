/**
 * Authentication headers utility
 * Provides JWT token from localStorage for authenticated API requests
 * Phase 10 Day 14: Fixed to use correct token key 'access_token'
 */

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return {};
  }

  // Phase 10 Day 14: Check 'access_token' (primary) and 'auth_token' (legacy)
  // Auth service stores token as 'access_token', not 'auth_token'
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');

  if (!token) {
    console.warn('[Auth Headers] No token found in localStorage');
    return {};
  }

  console.log('[Auth Headers] Token found:', token.substring(0, 20) + '...');
  return {
    Authorization: `Bearer ${token}`,
  };
}
