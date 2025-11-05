'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { LoadingOverlay } from '@/components/auth/LoadingOverlay';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  );
  const [countdown, setCountdown] = useState(5);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
    }
  }, [token]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      router.push('/dashboard');
    }
    return undefined;
  }, [status, countdown, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const verifyEmail = async (verificationToken: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would call the actual API
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error: any) {
      setStatus('error');
    }
  };

  const handleResendEmail = async (): Promise<void> => {
    setResendLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, this would call the actual API
      // const response = await fetch('/api/auth/resend-verification');

      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Failed to resend email:', error);
    } finally {
      setResendLoading(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppleCard className="w-full max-w-md p-8 text-center">
          <LoadingOverlay />
          <div className="mb-6">
            <svg
              className="mx-auto h-20 w-20 text-system-blue animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-4">
            Verifying Your Email...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your email address
          </p>
        </AppleCard>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppleCard className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="relative">
              <svg
                className="mx-auto h-20 w-20 text-system-green"
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
              <div className="absolute inset-0 animate-ping">
                <svg
                  className="mx-auto h-20 w-20 text-system-green opacity-30"
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
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Email Verified!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your email has been successfully verified. You'll be redirected to
            your dashboard in {countdown} seconds...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div
              className="bg-system-green h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <AppleButton
            variant="primary"
            size="large"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard Now
          </AppleButton>
        </AppleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AppleCard className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-20 w-20 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-4">Verification Failed</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {!token
            ? 'The verification link is invalid or incomplete.'
            : 'The verification link has expired or has already been used.'}
        </p>

        <div className="space-y-4">
          <AppleButton
            variant="primary"
            size="large"
            className="w-full"
            onClick={handleResendEmail}
            disabled={resendLoading || resendCooldown > 0}
          >
            {resendLoading
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Verification Email'}
          </AppleButton>

          <Link href="/auth/login">
            <AppleButton variant="secondary" className="w-full">
              Back to Login
            </AppleButton>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Having trouble?{' '}
            <Link href="/contact" className="text-system-blue hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </AppleCard>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <AppleCard className="max-w-md w-full">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </AppleCard>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
