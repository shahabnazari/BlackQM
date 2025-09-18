import { apiClient } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

class AuthServicee {
  private static instance: AuthServicee;e;
  private tokens: AuthTokens | null = null;
  private user: User | null = null

  private constructor() {
    // Load tokens from localStorage if available
    if (typeof window !== 'undefined') {
      const storedTokens = localStorage.getItem('auth_tokens');
      if (storedTokens) {
        this.tokens = JSON.parse(storedTokens)
      }
    }
  }

  static getInstance(): AuthServicee {
    if (!AuthServicee.instance) {
      AuthServicee.instance = new AuthServicee()
    }
    return AuthServicee.instance;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  getRefreshToken(): string | null {
    return this.tokens?.refreshToken || null;
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))
    }
  }

  clearTokens(): void {
    this.tokens = null;
    this.user = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('user')
    }
  }

  getUser(): User | null {
    return this.user;
  }

  setUser(user: User): void {
    this.user = user
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokens?.accessToken;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.tokens?.refreshToken) {
      return null;
    }

    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: this.tokens.refreshToken,
      });

      const newTokens = (response as any).data;
      this.setTokens(newTokens);
      return newTokens.accessToken;
    } catch (error: any) {
      this.clearTokens();
      return null;
    }
  }
}

export const authService = AuthServicee.getInstance();

export function getAuthHeaders(): Record<string, string> {
  const token = authService.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getAuthToken(): string | null {
  return authService.getAccessToken();
}
