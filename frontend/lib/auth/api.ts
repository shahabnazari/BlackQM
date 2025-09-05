import axios, { AxiosInstance } from 'axios';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PasswordResetRequest,
  PasswordReset,
  EmailVerification,
  User,
} from './types';
import { tokenStorage, getDeviceFingerprint } from './utils';

// Create axios instance with base configuration
const createAuthClient = (): AxiosInstance => {
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable cookies for httpOnly tokens
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    config => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Add device fingerprint for additional security
      config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  client.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (refreshToken) {
            const response = await authApi.refreshToken();
            tokenStorage.setAccessToken(response.accessToken);
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenStorage.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?error=session_expired';
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const authClient = createAuthClient();

// Auth API functions
export const authApi = {
  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await authClient.post<AuthResponse>('/auth/login', {
      ...credentials,
      deviceFingerprint: getDeviceFingerprint(),
    });
    return response.data;
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authClient.post<AuthResponse>('/auth/register', {
      ...data,
      deviceFingerprint: getDeviceFingerprint(),
    });
    return response.data;
  },

  // Social login
  loginWithProvider: async (provider: string): Promise<void> => {
    // Redirect to OAuth provider
    const redirectUrl = `${authClient.defaults.baseURL}/auth/${provider}`;
    window.location.href = redirectUrl;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await authClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error('Logout error:', error);
    } finally {
      tokenStorage.clearTokens();
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = tokenStorage.getRefreshToken();
    const response = await authClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
      deviceFingerprint: getDeviceFingerprint(),
    });
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await authClient.post<{ message: string }>(
      '/auth/forgot-password',
      {
        email,
      }
    );
    return response.data;
  },

  // Reset password with token
  resetPassword: async (data: PasswordReset): Promise<{ message: string }> => {
    const response = await authClient.post<{ message: string }>(
      '/auth/reset-password',
      {
        token: data.token,
        password: data.password,
      }
    );
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (
    token: string
  ): Promise<{ message: string; user: User }> => {
    const response = await authClient.post<{ message: string; user: User }>(
      '/auth/verify-email',
      {
        token,
      }
    );
    return response.data;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await authClient.get<User>('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await authClient.patch<User>('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await authClient.post<{ message: string }>(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      }
    );
    return response.data;
  },

  // Enable two-factor authentication
  enable2FA: async (): Promise<{ qrCode: string; secret: string }> => {
    const response = await authClient.post<{ qrCode: string; secret: string }>(
      '/auth/2fa/enable'
    );
    return response.data;
  },

  // Verify 2FA code
  verify2FA: async (code: string): Promise<{ message: string }> => {
    const response = await authClient.post<{ message: string }>(
      '/auth/2fa/verify',
      { code }
    );
    return response.data;
  },

  // Disable two-factor authentication
  disable2FA: async (code: string): Promise<{ message: string }> => {
    const response = await authClient.post<{ message: string }>(
      '/auth/2fa/disable',
      { code }
    );
    return response.data;
  },

  // Check if email is available
  checkEmailAvailable: async (
    email: string
  ): Promise<{ available: boolean }> => {
    const response = await authClient.post<{ available: boolean }>(
      '/auth/check-email',
      { email }
    );
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async (): Promise<{ message: string }> => {
    const response = await authClient.post<{ message: string }>(
      '/auth/resend-verification'
    );
    return response.data;
  },
};

export default authApi;
