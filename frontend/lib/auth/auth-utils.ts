/**
 * Authentication Utilities
 *
 * Helper functions for authentication-related operations
 * Phase 10 Day 34: Added enterprise-grade token validation
 */

/**
 * Validates that a token is a properly formatted JWT
 * @param token - Token to validate
 * @returns true if valid, false otherwise
 */
function isValidJWT(token: string): boolean {
  // JWT tokens must have exactly 3 parts (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[Auth Utils] Invalid JWT format: Expected 3 parts, got ${parts.length}`
      );
    }
    return false;
  }

  // JWT tokens should be at least 100 characters
  if (token.length < 100) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[Auth Utils] Token too short: ${token.length} chars (expected >100)`
      );
    }
    return false;
  }

  // Each part should be base64url encoded (no whitespace)
  if (/\s/.test(token)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[Auth Utils] Token contains whitespace - may be corrupted'
      );
    }
    return false;
  }

  return true;
}

// Get the auth token from local storage or session
export async function getAuthToken(): Promise<string | null> {
  // Check localStorage first - looking for 'access_token' which is what auth service stores
  const token = localStorage.getItem('access_token');
  if (token) {
    if (!isValidJWT(token)) {
      console.error('[Auth Utils] Token in localStorage is invalid - clearing');
      localStorage.removeItem('access_token');
      return null;
    }
    return token;
  }

  // Also check for legacy 'auth_token' key
  const legacyToken = localStorage.getItem('auth_token');
  if (legacyToken) {
    if (!isValidJWT(legacyToken)) {
      console.error(
        '[Auth Utils] Legacy token in localStorage is invalid - clearing'
      );
      localStorage.removeItem('auth_token');
      return null;
    }
    return legacyToken;
  }

  // Check sessionStorage as fallback
  const sessionToken =
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('auth_token');
  if (sessionToken) {
    if (!isValidJWT(sessionToken)) {
      console.error(
        '[Auth Utils] Token in sessionStorage is invalid - clearing'
      );
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('auth_token');
      return null;
    }
    return sessionToken;
  }

  // If no token found, try to get from cookie
  const cookieToken = getCookie('access_token') || getCookie('auth_token');
  if (cookieToken) {
    if (!isValidJWT(cookieToken)) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Auth Utils] Token in cookie is invalid');
      }
      return null;
    }
    return cookieToken;
  }

  return null;
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop();
    if (part) {
      return part.split(';').shift() || null;
    }
  }
  return null;
}

// Store auth token
export function setAuthToken(token: string, persistent: boolean = true): void {
  if (persistent) {
    localStorage.setItem('access_token', token);
    // Also set legacy key for backward compatibility
    localStorage.setItem('auth_token', token);
  } else {
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('auth_token', token);
  }
}

// Clear auth token
export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('auth_token');

  // Clear cookie if exists
  if (typeof document !== 'undefined') {
    document.cookie =
      'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie =
      'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

// Decode JWT token (basic implementation)
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const expirationDate = new Date(decoded.exp * 1000);
  return expirationDate <= new Date();
}
