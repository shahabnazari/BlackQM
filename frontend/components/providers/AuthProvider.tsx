'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/auth/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // TODO: Validate token with backend
          // For now, just set a mock user
          setUser({
            id: '1',
            email: 'demo@vqmethod.com',
            name: 'Demo User',
            role: 'researcher',
            emailVerified: true,
            twoFactorEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login API call
      // For now, just set a mock user
      setUser({
        id: '1',
        email,
        name: 'Demo User',
        role: 'researcher',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      localStorage.setItem('authToken', 'mock-token');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration API call
      console.log('Registration data:', userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
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
