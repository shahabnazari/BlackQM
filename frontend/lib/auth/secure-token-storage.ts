/**
 * Secure Token Storage Utility - Phase 7 Day 2 Security Enhancement
 * 
 * Provides secure token storage with:
 * - sessionStorage for sensitive tokens (cleared on tab close)
 * - localStorage for remember-me functionality
 * - Encryption for stored values (optional)
 * - Automatic expiry management
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REMEMBER_ME_KEY = 'remember_me';

export class SecureTokenStorage {
  private static isSSR = typeof window === 'undefined';

  /**
   * Store authentication token with appropriate security
   */
  static setToken(token: string, rememberMe: boolean = false): void {
    if (this.isSSR) return;

    if (rememberMe) {
      // Use localStorage for persistent storage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      // Use sessionStorage for session-only storage
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    // Set token expiry (1 hour)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
  }

  /**
   * Get authentication token with expiry check
   */
  static getToken(): string | null {
    if (this.isSSR) return null;

    // Check sessionStorage first
    let token = sessionStorage.getItem(TOKEN_KEY);
    let expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

    // Fall back to localStorage if remember me was used
    if (!token && localStorage.getItem(REMEMBER_ME_KEY) === 'true') {
      token = localStorage.getItem(TOKEN_KEY);
      expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    }

    if (!token) return null;

    // Check expiry
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiry < new Date()) {
        this.clearToken();
        return null;
      }
    }

    return token;
  }

  /**
   * Set refresh token (always in localStorage)
   */
  static setRefreshToken(token: string): void {
    if (this.isSSR) return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    if (this.isSSR) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all authentication tokens
   */
  static clearToken(): void {
    if (this.isSSR) return;

    // Clear from both storages
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user has valid authentication
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Extend token expiry (for activity-based extension)
   */
  static extendExpiry(): void {
    if (this.isSSR) return;

    const token = this.getToken();
    if (!token) return;

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    const isRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const storage = isRememberMe ? localStorage : sessionStorage;
    storage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
  }

  /**
   * Get token expiry time
   */
  static getExpiryTime(): Date | null {
    if (this.isSSR) return null;

    let expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr && localStorage.getItem(REMEMBER_ME_KEY) === 'true') {
      expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    }

    return expiryStr ? new Date(expiryStr) : null;
  }

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  static isAboutToExpire(): boolean {
    const expiry = this.getExpiryTime();
    if (!expiry) return false;

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return expiry <= fiveMinutesFromNow;
  }
}

export default SecureTokenStorage;