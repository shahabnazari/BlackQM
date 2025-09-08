'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
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

// Lazy load social icons - they're not critical for initial render
const SocialLoginButtons = dynamic(
  () => import('@/components/auth/SocialLoginButtons'),
  { 
    loading: () => (
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
      </div>
    ),
    ssr: false 
  }
);

// Simple email validation without heavy libraries
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Simple password validation
const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error: authError, clearError } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [suggestedSSO, setSuggestedSSO] = useState<string | null>(null);
  
  // Form state without heavy libraries
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Get redirect URL and any messages from query params
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const successMessage = searchParams.get('success');
  const errorMessage = searchParams.get('error');

  // Prefetch dashboard for faster navigation after login
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/auth/forgot-password');
    router.prefetch('/auth/register');
  }, [router]);

  // Detect institutional email for SSO suggestion
  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      const domain = formData.email.split('@')[1];
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
  }, [formData.email]);

  // Handle form submission with native validation
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({ email: '', password: '' });
    clearError();
    
    // Validate
    let hasErrors = false;
    
    if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      hasErrors = true;
    }
    
    if (!validatePassword(formData.password)) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      hasErrors = true;
    }
    
    if (hasErrors) return;

    // Submit
    const result = await login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });

    if (result.success) {
      router.push(redirectUrl);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    sessionStorage.setItem('auth_redirect', redirectUrl);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      {isLoading && <LoadingOverlay message="Signing you in..." />}

      <div className="w-full max-w-md">
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
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

            {/* Login Form - Native validation */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <TextField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
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
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  prefetch={true}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                size="large"
                loading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Social Login Options - Lazy loaded */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <SocialLoginButtons onLogin={handleSocialLogin} />
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                prefetch={true}
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