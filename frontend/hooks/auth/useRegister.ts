import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { RegisterData } from '@/lib/auth/types';

export function useRegister() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleRegister = useCallback(
    async (data: RegisterData) => {
      setIsLoading(true);
      setRegisterError(null);

      try {
        await register(data);
        return { success: true };
      } catch (err: any) {
        const message = err.message || 'Registration failed. Please try again.';
        setRegisterError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [register]
  );

  return {
    register: handleRegister,
    isLoading,
    error: registerError,
    clearError: () => setRegisterError(null),
  };
}
