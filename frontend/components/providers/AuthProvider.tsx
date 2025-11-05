'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { authService, User, RegisterData } from '@/lib/api/services';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true for initial session check
  const [isClient, setIsClient] = useState(false);

  // Client-side only flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for existing session on mount (client-side only)
  useEffect(() => {
    if (!isClient) return; // Skip during SSR

    const checkSession = async () => {
      try {
        console.log('[AuthProvider] Checking existing session...');
        // Check if we have a token
        if (authService.isAuthenticated()) {
          console.log('[AuthProvider] Token found, fetching user...');
          // Get current user from storage or backend
          const currentUser = await authService.getCurrentUser();
          console.log('[AuthProvider] User loaded:', currentUser);
          setUser(currentUser);
        } else {
          console.log('[AuthProvider] No token found');
          // Ensure storage is clean
          authService.clearAuthData();
          setUser(null);
        }
      } catch (error: any) {
        // Session check failed - clear all auth data
        console.log(
          '[AuthProvider] Session check failed, clearing auth data:',
          error.message || error
        );
        authService.clearAuthData();
        setUser(null);
      } finally {
        // Always set loading to false
        console.log('[AuthProvider] Session check complete');
        setIsLoading(false);
      }
    };

    checkSession();
  }, [isClient]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = true) => {
      console.log('AuthProvider: Starting login...');
      setIsLoading(true);
      try {
        const response = await authService.login({
          email,
          password,
          rememberMe,
        });

        console.log('AuthProvider: Login response received:', response);

        if (!response || !response.user) {
          throw new Error('Invalid response from authentication service');
        }

        setUser(response.user);
        toast.success('Welcome back!');
        console.log('AuthProvider: User state updated, user:', response.user);

        // Don't return the response, just complete the promise
        // The interface expects Promise<void>
      } catch (error: any) {
        console.error('AuthProvider: Login failed:', error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Invalid email or password';
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
        console.log('AuthProvider: Loading state cleared');
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout failed:', error);
      // Still clear local data even if API call fails
      authService.clearAuthData();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(
        error.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
