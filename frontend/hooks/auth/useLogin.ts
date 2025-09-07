import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { LoginCredentials } from '@/lib/auth/types';

export function useLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      setLoginError(null);

      try {
        await login(
          credentials.email,
          credentials.password,
          credentials.rememberMe
        );
        return { success: true };
      } catch (err: any) {
        const message = err.message || 'Login failed. Please try again.';
        setLoginError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
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
