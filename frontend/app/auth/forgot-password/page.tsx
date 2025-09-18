'use client';

import { Button as AppleButton } from '@/components/apple-ui/Button/Button';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { TextField as AppleTextField } from '@/components/apple-ui/TextField/TextField';
import { AuthError } from '@/components/auth/AuthError';
import { LoadingOverlay } from '@/components/auth/LoadingOverlay';
import { usePasswordReset } from '@/hooks/auth/usePasswordReset';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  // const router = useRouter(); // Will be used for navigation after reset
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { forgotPassword, isLoading } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email'
      );
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppleCard className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-20 w-20 text-system-green"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-4">Check Your Email</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent password reset instructions to:
          </p>
          <p className="font-medium text-lg mb-8">{email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Didn't receive the email? Check your spam folder or request a new
            one.
          </p>
          <AppleButton
            variant="secondary"
            className="w-full mb-4"
            onClick={() => setSubmitted(false)}
          >
            Send Another Email
          </AppleButton>
          <Link href="/auth/login">
            <AppleButton variant="secondary" className="w-full">
              Back to Login
            </AppleButton>
          </Link>
        </AppleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {isLoading && <LoadingOverlay />}

      <AppleCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you instructions to reset
            your password.
          </p>
        </div>

        {error && <AuthError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AppleTextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
          />

          <div className="space-y-4">
            <AppleButton
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              disabled={isLoading || !email}
            >
              Send Reset Email
            </AppleButton>

            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Remember your password?
              </span>
              <Link
                href="/auth/login"
                className="text-system-blue hover:underline font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Security Tips:</h3>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <li>• We'll never ask for your password in an email</li>
            <li>• Reset links expire after 1 hour for security</li>
            <li>• Check your spam folder if you don't see our email</li>
          </ul>
        </div>
      </AppleCard>
    </div>
  );
}
