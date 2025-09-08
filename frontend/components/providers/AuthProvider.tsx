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
  const [isLoading, setIsLoading] = useState(false); // Changed to false to not block initial render

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a token
        if (authService.isAuthenticated()) {
          setIsLoading(true);
          // Get current user from backend
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // Clear invalid token
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = true) => {
      setIsLoading(true);
      try {
        const response = await authService.login({
          email,
          password,
          rememberMe,
        });

        setUser(response.user);
        toast.success('Welcome back!');
      } catch (error: any) {
        console.error('Login failed:', error);
        throw new Error(
          error.response?.data?.message || 'Invalid email or password'
        );
      } finally {
        setIsLoading(false);
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
    } catch (error) {
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
    } catch (error) {
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
