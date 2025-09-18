import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { authApi } from '@/lib/auth/api';
import {
  tokenStorage,
  userStorage,
  sessionStorage,
  validatePasswordStrength,
  isValidEmail,
} from '@/lib/auth/utils';

// Mock the API
vi.mock('@/lib/auth/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getMe: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Authentication System', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'researcher' as const,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock sessionStorage.clear since it's not available in test environment
    if (typeof sessionStorage !== 'undefined' && sessionStorage.clear) {
      sessionStorage.clear();
    }
  });

  describe('Auth Utils', () => {
    it('validates email format correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('validates password strength correctly', () => {
      const weakPassword = validatePasswordStrength('weak');
      expect(weakPassword.isValid).toBe(false);
      expect(weakPassword.errors.length).toBeGreaterThan(0);

      const strongPassword = validatePasswordStrength('Strong@Pass123');
      expect(strongPassword.isValid).toBe(true);
      expect(strongPassword.errors.length).toBe(0);
    });

    it('manages tokens correctly', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      tokenStorage.setAccessToken(accessToken);
      expect(tokenStorage.getAccessToken()).toBe(accessToken);

      tokenStorage.setRefreshToken(refreshToken);
      expect(tokenStorage.getRefreshToken()).toBe(refreshToken);

      tokenStorage.clearTokens();
      expect(tokenStorage.getAccessToken()).toBeNull();
    });

    it('manages user storage correctly', () => {
      userStorage.setUser(mockUser);
      const storedUser = userStorage.getUser();
      expect(storedUser?.email).toBe(mockUser.email);

      userStorage.clearUser();
      expect(userStorage.getUser()).toBeNull();
    });

    it('manages session expiry correctly', () => {
      const expiresIn = 3600; // 1 hour
      sessionStorage.setSessionExpiry(expiresIn);

      expect(sessionStorage.isSessionExpired()).toBe(false);

      // Mock expired session
      const expiredTime = Date.now() - 10000;
      localStorage.setItem('vqmethod_session_expiry', expiredTime.toString());
      expect(sessionStorage.isSessionExpired()).toBe(true);
    });
  });

  describe('useAuth Hook', () => {
    it('initializes with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });

    it('handles login successfully', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.email).toBe(mockUser.email);
      });
    });

    it('handles login error', async () => {
      const errorMessage = 'Invalid credentials';
      vi.mocked(authApi.login).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error: any) {
          expect(error).toBeDefined();
        }
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error?.message).toBe(errorMessage);
      });
    });

    it('handles registration successfully', async () => {
      vi.mocked(authApi.register).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'Strong@Pass123',
          confirmPassword: 'Strong@Pass123',
          name: 'New User',
          acceptTerms: true,
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.email).toBe(mockUser.email);
      });
    });

    it('handles logout correctly', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);
      vi.mocked(authApi.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });

    it('handles token refresh', async () => {
      const newToken = 'new-access-token';
      vi.mocked(authApi.refreshToken).mockResolvedValue({
        ...mockAuthResponse,
        accessToken: newToken,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshToken();
      });

      await waitFor(() => {
        expect(tokenStorage.getAccessToken()).toBe(newToken);
      });
    });

    it('handles password reset flow', async () => {
      vi.mocked(authApi.forgotPassword).mockResolvedValue({
        message: 'Reset email sent',
      });
      vi.mocked(authApi.resetPassword).mockResolvedValue({
        message: 'Password reset successful',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Request password reset
      await act(async () => {
        await result.current.forgotPassword('test@example.com');
      });

      // Reset password with token
      await act(async () => {
        await result.current.resetPassword({
          token: 'reset-token',
          password: 'NewStrong@Pass123',
          confirmPassword: 'NewStrong@Pass123',
        });
      });

      expect(authApi.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(authApi.resetPassword).toHaveBeenCalled();
    });

    it('handles email verification', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true };
      vi.mocked(authApi.verifyEmail).mockResolvedValue({
        message: 'Email verified',
        user: verifiedUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.verifyEmail('verification-token');
      });

      await waitFor(() => {
        expect(result.current.user?.emailVerified).toBe(true);
      });
    });

    it('clears error correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set an error first
      vi.mocked(authApi.login).mockRejectedValue(new Error('Test error'));

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
          });
        } catch (error: any) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
