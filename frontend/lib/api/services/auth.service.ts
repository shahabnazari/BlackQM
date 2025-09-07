import { apiClient, ApiResponse } from '../client';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string; // Will be split into firstName and lastName
  firstName?: string;
  lastName?: string;
  organization?: string;
  role?: 'researcher' | 'participant';
  confirmPassword?: string;
  acceptTerms?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Computed from firstName + lastName
  organization?: string;
  role: 'researcher' | 'participant' | 'admin';
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

class AuthService {
  // Helper to compute name from firstName and lastName
  private formatUser(user: any): User {
    // If backend already provides name, use it; otherwise compute from firstName/lastName
    const name =
      user.name ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email;

    // Normalize role to lowercase
    const normalizedRole = (user.role || 'researcher').toLowerCase();

    return {
      ...user,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      name: name,
      role: normalizedRole as 'researcher' | 'participant' | 'admin',
      createdAt:
        typeof user.createdAt === 'string'
          ? new Date(user.createdAt)
          : user.createdAt || new Date(),
      updatedAt:
        typeof user.updatedAt === 'string'
          ? new Date(user.updatedAt)
          : user.updatedAt || new Date(),
      emailVerified: user.emailVerified ?? false,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
    };
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // The apiClient.post method returns the raw axios response
      const response = await apiClient
        .getClient()
        .post('/auth/login', credentials);

      // Format user with computed name
      const formattedResponse = {
        ...response.data,
        user: this.formatUser(response.data.user),
      };

      // Store tokens
      if (formattedResponse.accessToken) {
        localStorage.setItem('access_token', formattedResponse.accessToken);
        localStorage.setItem('refresh_token', formattedResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(formattedResponse.user));
      }

      return formattedResponse;
    } catch (error: any) {
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // Split name into firstName and lastName if not provided
    const [firstName, ...lastNameParts] = (data.name || '').split(' ');
    const registrationData = {
      email: data.email,
      password: data.password,
      firstName: data.firstName || firstName || '',
      lastName: data.lastName || lastNameParts.join(' ') || '',
      organization: data.organization,
      role: data.role,
    };

    const response = await apiClient
      .getClient()
      .post('/auth/register', registrationData);

    // Format user with computed name
    const formattedResponse = {
      ...response.data,
      user: this.formatUser(response.data.user),
    };

    // Store tokens
    if (formattedResponse.accessToken) {
      localStorage.setItem('access_token', formattedResponse.accessToken);
      localStorage.setItem('refresh_token', formattedResponse.refreshToken);
      localStorage.setItem('user', JSON.stringify(formattedResponse.user));
    }

    return formattedResponse;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.getClient().post('/auth/logout');
    } finally {
      // Clear local storage regardless of API response
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    // Update tokens
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }

    return response.data;
  }

  // User Management
  async getCurrentUser(): Promise<User> {
    // First try to get user from localStorage
    const storedUser = this.getUser();
    if (storedUser) {
      return storedUser;
    }

    // If no stored user, try to get from backend (if endpoint exists)
    try {
      const response = await apiClient.getClient().get('/auth/profile');

      // Format user with computed name
      const formattedUser = this.formatUser(response.data);

      // Update local storage
      localStorage.setItem('user', JSON.stringify(formattedUser));

      return formattedUser;
    } catch (error) {
      const fallbackUser = this.getUser();
      if (fallbackUser) {
        return fallbackUser;
      }
      throw new Error('No user session found');
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', data);

    // Format user with computed name
    const formattedUser = this.formatUser(response.data);

    // Update local storage
    localStorage.setItem('user', JSON.stringify(formattedUser));

    return formattedUser;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  }

  // Email Verification
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/auth/resend-verification');
  }

  // Password Reset
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  }

  // Two-Factor Authentication
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response =
      await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
    return response.data;
  }

  async enableTwoFactor(code: string): Promise<void> {
    await apiClient.post('/auth/2fa/enable', { code });
  }

  async disableTwoFactor(code: string): Promise<void> {
    await apiClient.post('/auth/2fa/disable', { code });
  }

  async verifyTwoFactor(code: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/2fa/verify', {
      code,
    });

    // Store tokens
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response.data;
  }

  // Session Management
  async getSessions(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/auth/sessions');
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    await apiClient.post('/auth/sessions/revoke-all');
  }

  // Helper Methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      const user = JSON.parse(userStr);
      // Ensure name is computed if missing
      if (!user.name && (user.firstName || user.lastName)) {
        user.name =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      }
      // Parse dates
      if (typeof user.createdAt === 'string') {
        user.createdAt = new Date(user.createdAt);
      }
      if (typeof user.updatedAt === 'string') {
        user.updatedAt = new Date(user.updatedAt);
      }
      return user;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('csrf_token');
  }

  // Role-based access control
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  isResearcher(): boolean {
    return this.hasRole('researcher');
  }

  isParticipant(): boolean {
    return this.hasRole('participant');
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export types
export type { AuthService };
