'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import { useLogin } from '@/hooks/auth/useLogin';
import { Button } from '@/components/apple-ui/Button/Button';
import { Card } from '@/components/apple-ui/Card/Card';
import { TextField } from '@/components/apple-ui/TextField/TextField';
import { LoadingOverlay } from '@/components/auth/LoadingOverlay';
import { AuthError } from '@/components/auth/AuthError';
import {
  GoogleIcon,
  MicrosoftIcon,
  OrcidIcon,
  AppleIcon,
  GitHubIcon,
} from '@/components/icons';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error: authError, clearError } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [suggestedSSO, setSuggestedSSO] = useState<string | null>(null);

  // Get redirect URL and any messages from query params
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const successMessage = searchParams.get('success');
  const errorMessage = searchParams.get('error');

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema as any) as any,
    defaultValues: {
      rememberMe: true,
    },
  });

  const email = watch('email');

  // Detect institutional email for SSO suggestion
  useEffect(() => {
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      if (domain.includes('.edu')) {
        setSuggestedSSO('institutional');
      } else if (
        domain.includes('microsoft.com') ||
        domain.includes('outlook.com')
      ) {
        setSuggestedSSO('microsoft');
      } else if (domain.includes('gmail.com')) {
        setSuggestedSSO('google');
      } else {
        setSuggestedSSO(null);
      }
    }
  }, [email]);

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const result = await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.success) {
      router.push(redirectUrl);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    // Store the redirect URL for after OAuth callback
    sessionStorage.setItem('auth_redirect', redirectUrl);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {isLoading && <LoadingOverlay message="Signing you in..." />}

      <div className="w-full max-w-md">
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/70 border border-white/20 dark:border-white/10 shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to continue to VQMethod
              </p>
            </div>

            {/* Success/Error Messages */}
            {successMessage === 'password_reset' && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Password reset successful! You can now login with your new
                    password.
                  </p>
                </div>
              </div>
            )}

            {successMessage === 'email_verified' && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Email verified successfully! You can now login.
                  </p>
                </div>
              </div>
            )}

            {errorMessage === 'session_expired' && (
              <div className="mb-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Your session has expired. Please login again.
                  </p>
                </div>
              </div>
            )}

            {authError && (
              <div className="mb-4">
                <AuthError message={authError} onClose={clearError} />
              </div>
            )}

            {/* SSO Suggestion */}
            {suggestedSSO && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 Tip: You can sign in faster with{' '}
                  {suggestedSSO === 'institutional'
                    ? "your institution's SSO"
                    : suggestedSSO === 'microsoft'
                      ? 'Microsoft'
                      : 'Google'}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <TextField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register('rememberMe')}
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                size="large"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </form>

            {/* Social Login Options */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <GoogleIcon />
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('microsoft')}
                  className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MicrosoftIcon />
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('orcid')}
                  className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <OrcidIcon />
                </button>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
