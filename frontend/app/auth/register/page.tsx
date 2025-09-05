'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { useRegister } from '@/hooks/auth/useRegister';
import { Button } from '@/components/apple-ui/Button/Button';
import { Card } from '@/components/apple-ui/Card/Card';
import { TextField } from '@/components/apple-ui/TextField/TextField';
import { LoadingOverlay } from '@/components/auth/LoadingOverlay';
import { AuthError } from '@/components/auth/AuthError';
import { FormErrors } from '@/components/auth/FormErrors';
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from '@/components/icons';

// Validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
    role: z.enum(['researcher', 'participant']).default('researcher'),
    organization: z.string().optional(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register: registerUser,
    isLoading,
    error: authError,
    clearError,
  } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema as any) as any,
    defaultValues: {
      role: 'researcher',
      acceptTerms: false,
    },
    mode: 'onChange',
  });

  const password = watch('password');
  const role = watch('role');

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*]/.test(password),
    ];
    const strength = checks.filter(Boolean).length;
    return {
      strength,
      checks,
    };
  };

  const passwordStrength = password
    ? getPasswordStrength(password)
    : { strength: 0, checks: [] };

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    const result = await registerUser(data);

    if (result.success) {
      router.push('/auth/verify-email');
    }
  };

  // Handle next step in multi-step form
  const handleNextStep = async () => {
    const fieldsToValidate =
      currentStep === 1
        ? (['name', 'email', 'role', 'organization'] as const)
        : (['password', 'confirmPassword', 'acceptTerms'] as const);

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  // Handle social registration
  const handleSocialRegister = (provider: string) => {
    sessionStorage.setItem('auth_redirect', '/dashboard');
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {isLoading && <LoadingOverlay message="Creating your account..." />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/70 border border-white/20 dark:border-white/10 shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Join VQMethod to start your research
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-24 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  2
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {authError && (
              <div className="mb-4">
                <AuthError message={authError} onClose={clearError} />
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="mb-4">
                <FormErrors
                  errors={Object.values(errors).map(e => e?.message || '')}
                />
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 ? (
                <>
                  {/* Step 1: Basic Information */}
                  <div>
                    <TextField
                      label="Full Name"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                          role === 'researcher'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          value="researcher"
                          className="sr-only"
                          {...register('role')}
                        />
                        <span
                          className={`text-sm font-medium ${
                            role === 'researcher'
                              ? 'text-blue-600'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Researcher
                        </span>
                      </label>
                      <label
                        className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                          role === 'participant'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          value="participant"
                          className="sr-only"
                          {...register('role')}
                        />
                        <span
                          className={`text-sm font-medium ${
                            role === 'participant'
                              ? 'text-blue-600'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Participant
                        </span>
                      </label>
                    </div>
                  </div>

                  {role === 'researcher' && (
                    <div>
                      <TextField
                        label="Organization (Optional)"
                        type="text"
                        placeholder="University or Institution"
                        autoComplete="organization"
                        error={errors.organization?.message}
                        {...register('organization')}
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    fullWidth
                    size="large"
                    onClick={handleNextStep}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  {/* Step 2: Password & Terms */}
                  <div>
                    <div className="relative">
                      <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter a strong password"
                        autoComplete="new-password"
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

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Password strength
                          </span>
                          <span className="text-xs font-medium">
                            {passwordStrength.strength === 5
                              ? 'Strong'
                              : passwordStrength.strength >= 3
                                ? 'Medium'
                                : 'Weak'}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 h-1 rounded-full ${
                                i < passwordStrength.strength
                                  ? passwordStrength.strength >= 4
                                    ? 'bg-green-500'
                                    : passwordStrength.strength >= 2
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  : 'bg-gray-300 dark:bg-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="mt-2 space-y-1">
                          {[
                            '8+ characters',
                            'Uppercase letter',
                            'Lowercase letter',
                            'Number',
                            'Special character',
                          ].map((req, i) => (
                            <div
                              key={req}
                              className="flex items-center text-xs"
                            >
                              {passwordStrength.checks[i] ? (
                                <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                              ) : (
                                <XMarkIcon className="h-3 w-3 text-gray-400 mr-1" />
                              )}
                              <span
                                className={
                                  passwordStrength.checks[i]
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-500'
                                }
                              >
                                {req}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <TextField
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...register('acceptTerms')}
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        I agree to the{' '}
                        <Link
                          href="/terms"
                          className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/privacy"
                          className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.acceptTerms.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      size="large"
                      onClick={() => setCurrentStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      fullWidth
                      size="large"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Create Account
                    </Button>
                  </div>
                </>
              )}
            </form>

            {currentStep === 1 && (
              <>
                {/* Social Registration Options */}
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
                      onClick={() => handleSocialRegister('google')}
                      className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <GoogleIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialRegister('microsoft')}
                      className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <MicrosoftIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialRegister('orcid')}
                      className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <OrcidIcon />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Sign In Link */}
            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
