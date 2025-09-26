import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { LoginCredentials } from '@/lib/auth/types';

export function useLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      console.log('useLogin: Starting login with:', credentials.email);
      setIsLoading(true);
      setLoginError(null);

      try {
        const response = await login(
          credentials.email,
          credentials.password,
          credentials.rememberMe
        );
        console.log('useLogin: Login successful, response:', response);
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        console.error('useLogin: Login error:', err);
        const message = err.message || 'Login failed. Please try again.';
        setLoginError(message);
        setIsLoading(false);
        return { success: false, error: message };
      }
    },
    [login]
  );

  return {
    login: handleLogin,
    isLoading,
    error: loginError,
    clearError: () => setLoginError(null),
  };
}
