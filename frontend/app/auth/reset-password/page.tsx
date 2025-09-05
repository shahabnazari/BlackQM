'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';
import { TextField as AppleTextField } from '@/components/apple-ui/TextField/TextField';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { LoadingOverlay } from '@/components/auth/LoadingOverlay';
import { AuthError } from '@/components/auth/AuthError';
import { usePasswordReset } from '@/hooks/auth/usePasswordReset';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { resetPassword, isLoading } = usePasswordReset();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await resetPassword({ token, password, confirmPassword: password });
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-green-500';
    return 'bg-system-green';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppleCard className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-20 w-20 text-system-green animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-4">
            Password Reset Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your password has been reset successfully. Redirecting you to
            login...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-system-blue h-2 rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </AppleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {isLoading && <LoadingOverlay />}

      <AppleCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reset Your Password</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a strong password that you haven't used before
          </p>
        </div>

        {error && <AuthError message={error} />}

        {!token ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Invalid or expired reset link
            </p>
            <Link href="/auth/forgot-password">
              <AppleButton variant="primary">
                Request New Reset Link
              </AppleButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <AppleTextField
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Password Strength:
                    </span>
                    <span
                      className={`font-medium ${passwordStrength > 3 ? 'text-green-600' : 'text-gray-600'}`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <AppleTextField
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
                error={
                  confirmPassword && password !== confirmPassword
                    ? 'Passwords do not match'
                    : undefined
                }
              />
            </div>

            <div className="space-y-4">
              <AppleButton
                type="submit"
                variant="primary"
                size="large"
                className="w-full"
                disabled={
                  isLoading ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword
                }
              >
                Reset Password
              </AppleButton>

              <Link href="/auth/login">
                <AppleButton variant="secondary" className="w-full">
                  Cancel
                </AppleButton>
              </Link>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-medium mb-2">Password Requirements:</h3>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <li className={password.length >= 8 ? 'text-green-600' : ''}>
              • At least 8 characters
            </li>
            <li
              className={
                /[a-z]/.test(password) && /[A-Z]/.test(password)
                  ? 'text-green-600'
                  : ''
              }
            >
              • Mix of uppercase and lowercase letters
            </li>
            <li className={/\d/.test(password) ? 'text-green-600' : ''}>
              • At least one number
            </li>
            <li
              className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : ''}
            >
              • At least one special character
            </li>
          </ul>
        </div>
      </AppleCard>
    </div>
  );
}
