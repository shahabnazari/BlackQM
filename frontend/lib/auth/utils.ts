import Cookies from 'js-cookie';
import { User, Session } from './types';

// Token management constants
const ACCESS_TOKEN_KEY = 'vqmethod_access_token';
const REFRESH_TOKEN_KEY = 'vqmethod_refresh_token';
const USER_KEY = 'vqmethod_user';
const SESSION_EXPIRY_KEY = 'vqmethod_session_expiry';

// Cookie options for secure token storage
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  expires: 30, // 30 days for refresh token
};

// Token storage functions
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken: (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    Cookies.set(REFRESH_TOKEN_KEY, token, cookieOptions);
  },

  clearTokens: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    }
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
};

// User storage functions
export const userStorage = {
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (error: any) {
      return null;
    }
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },
};

// Session management functions
export const sessionStorage = {
  getSessionExpiry: (): number | null => {
    if (typeof window === 'undefined') return null;
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  },

  setSessionExpiry: (expiresIn: number): void => {
    if (typeof window === 'undefined') return;
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
  },

  isSessionExpired: (): boolean => {
    const expiry = sessionStorage.getSessionExpiry();
    if (!expiry) return true;
    return Date.now() > expiry;
  },
};

// Token expiry checking
export const isTokenExpired = (token: string): boolean => {
  try {
    // Decode JWT without verification (for client-side expiry check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch (error: any) {
    return true;
  }
};

// Permission checking utilities
export const hasRole = (user: User | null, role: string): boolean => {
  return user?.role === role;
};

export const canAccessRoute = (
  user: User | null,
  requiredRoles: string[]
): boolean => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
};

// Session validation
export const validateSession = (): Session => {
  const accessToken = tokenStorage.getAccessToken();
  const user = userStorage.getUser();
  const expiresAt = sessionStorage.getSessionExpiry();

  const isAuthenticated = !!(
    accessToken &&
    user &&
    !sessionStorage.isSessionExpired()
  );

  return {
    user,
    accessToken,
    refreshToken: tokenStorage.getRefreshToken() || null,
    expiresAt,
    isLoading: false,
    isAuthenticated,
  };
};

// Clear all auth data
export const clearAuthData = (): void => {
  tokenStorage.clearTokens();
  userStorage.clearUser();
};

// Format error messages for display
export const formatAuthError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred. Please try again.';
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generate device fingerprint for session security
export const getDeviceFingerprint = (): string => {
  if (typeof window === 'undefined') return 'server';

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
  ].join('|');

  return btoa(fingerprint);
};
