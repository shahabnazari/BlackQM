import { useState, useCallback } from 'react';
import { PasswordReset } from '@/lib/auth/types';
import { authApi } from '@/lib/auth/api';

export function usePasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleForgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setResetError(null);
    setSuccessMessage(null);

    try {
      await authApi.forgotPassword(email);
      setSuccessMessage('Password reset email sent. Please check your inbox.');
      return { success: true };
    } catch (err: any) {
      const message =
        err.message || 'Failed to send reset email. Please try again.';
      setResetError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (data: PasswordReset) => {
    setIsLoading(true);
    setResetError(null);
    setSuccessMessage(null);

    try {
      await authApi.resetPassword(data);
      setSuccessMessage(
        'Password reset successful. You can now login with your new password.'
      );
      return { success: true };
    } catch (err: any) {
      const message =
        err.message || 'Failed to reset password. Please try again.';
      setResetError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    isLoading,
    error: resetError,
    successMessage,
    clearError: () => {
      setResetError(null);
      setSuccessMessage(null);
    },
  };
}
