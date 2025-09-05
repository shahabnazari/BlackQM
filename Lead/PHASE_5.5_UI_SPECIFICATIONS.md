# Phase 5.5 UI Specifications

## Using the Existing Apple Design System

**IMPORTANT:** VQMethod already has a comprehensive Apple Design System implemented. This document specifies how to properly use the existing components for Phase 5.5 implementation.

---

## 🎨 Existing Apple Design System Overview

### Available Components

Located in `frontend/components/apple-ui/`:

- **Button** - Multiple variants (primary, secondary, tertiary, destructive)
- **TextField** - iOS-style text inputs with floating labels
- **Card** - Apple-style cards with header, content, footer
- **Badge** - Status badges
- **ProgressBar** - Progress indicators
- **ThemeToggle** - Light/dark mode toggle

### Design Tokens (CSS Variables)

Located in `frontend/styles/apple-design.css`:

#### Typography

The project uses the system font stack defined in Tailwind config:

- Font family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- Mono font: `'SF Mono', Monaco, 'Cascadia Code', monospace`

#### System Colors

All colors are mapped through Tailwind's semantic tokens:

- System colors: `text-system-blue`, `bg-system-green`, `border-system-red`
- Text colors: `text-primary`, `text-secondary`, `text-tertiary`
- Background colors: `bg-primary`, `bg-surface`, `bg-surface-secondary`

#### Text Colors

Using Tailwind's semantic text classes:

- Primary text: `text-text`
- Secondary text: `text-text-secondary`
- Tertiary text: `text-text-tertiary`
- Quaternary text: `text-text-quaternary`

#### Background & Fill Colors

Using Tailwind's semantic background classes:

- Primary background: `bg-background`
- Secondary background: `bg-surface-secondary`
- Fill colors: `bg-fill`, `bg-fill-secondary`, `bg-fill-tertiary`, `bg-fill-quaternary`

#### Spacing (8pt Grid)

Using Tailwind's spacing scale:

- xs: `space-y-1` (4px)
- sm: `space-y-2` (8px)
- md: `space-y-4` (16px)
- lg: `space-y-6` (24px)
- xl: `space-y-8` (32px)

#### Animation

Using Tailwind's transition utilities:

- Easing: `ease-in-out`
- Duration: `duration-150`, `duration-300`
- Transitions: `transition-all`, `transition-colors`, `transition-opacity`

---

## 📋 Phase 5.5 Authentication Pages Implementation

### 1. Login Page (`/auth/login/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, TextField, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/apple-ui';
import { MicrosoftIcon, GoogleIcon, OrcidIcon } from '@/components/icons';
import { EyeIcon, EyeSlashIcon, FaceSmileIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  // Domain detection for SSO suggestion (Qualtrics-inspired)
  const [suggestedSSO, setSuggestedSSO] = useState<string | null>(null);

  useEffect(() => {
    if (email.includes('@')) {
      const domain = email.split('@')[1];
      if (domain?.includes('.edu')) {
        setSuggestedSSO('academic');
      } else if (domain?.includes('microsoft.com') || domain?.includes('outlook.com')) {
        setSuggestedSSO('microsoft');
      } else {
        setSuggestedSSO(null);
      }
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/dashboard');  // Note: Route groups (researcher) don't appear in URLs
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-surface-secondary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        {/* Using existing Card component with glass morphism effect */}
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/70 border-white/20">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-system-blue to-system-purple bg-clip-text text-transparent">
              VQMethod
            </CardTitle>
            <CardDescription>
              Welcome back to research excellence
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* SSO Suggestion Alert (Tableau-inspired) */}
            <AnimatePresence>
              {suggestedSSO && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-system-blue/10 border border-system-blue/20"
                >
                  <p className="text-sm text-system-blue">
                    {suggestedSSO === 'academic'
                      ? '🎓 Academic institution detected. Sign in with your university account?'
                      : '💼 Corporate account detected. Sign in with Microsoft?'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Using existing TextField component */}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@university.edu"
                autoComplete="email"
                required
                disabled={isLoading}
                error={error && 'Invalid credentials'}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                error={error}
                helperText={
                  <a href="/auth/forgot-password" className="text-system-blue hover:underline text-xs">
                    Forgot password?
                  </a>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                }
              />

              {/* Remember Me Checkbox using Apple styling */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-fill-quaternary text-system-blue focus:ring-system-blue"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-text">Remember me</span>
                </label>

                {/* Face ID button (Apple-style) */}
                <button
                  type="button"
                  className="p-2 hover:bg-fill-quaternary rounded-lg transition-colors"
                  disabled={isLoading}
                  aria-label="Use Face ID"
                >
                  <FaceSmileIcon className="w-6 h-6 text-system-blue" />
                </button>
              </div>

              {/* Using existing Button component */}
              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Social Login Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fill-quaternary" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/70 dark:bg-black/70 px-4 text-text-secondary">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons using existing Button component */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {/* Handle Google login */}}
                disabled={isLoading}
                ariaLabel="Sign in with Google"
              >
                <GoogleIcon className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {/* Handle Microsoft login */}}
                disabled={isLoading}
                ariaLabel="Sign in with Microsoft"
              >
                <MicrosoftIcon className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {/* Handle ORCID login */}}
                disabled={isLoading}
                ariaLabel="Sign in with ORCID"
              >
                <OrcidIcon className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-text-secondary">
              New to VQMethod?{' '}
              <a href="/auth/register" className="text-system-blue hover:underline">
                Create an account
              </a>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
```

---

## 2. Registration Page (`/auth/register/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, TextField, Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge } from '@/components/apple-ui';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const REGISTRATION_STEPS = [
  { id: 'account', title: 'Account', icon: '👤' },
  { id: 'profile', title: 'Profile', icon: '📝' },
  { id: 'preferences', title: 'Preferences', icon: '⚙️' },
  { id: 'verification', title: 'Verify', icon: '✅' }
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    institution: '',
    discipline: '',
    interests: [] as string[],
    termsAccepted: false,
    privacyAccepted: false
  });

  // Password strength calculation (Tableau-inspired)
  const calculatePasswordStrength = (password: string): {
    score: number;
    label: string;
    color: string;
  } => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
    if (/\d/.test(password) && /[^a-zA-Z\d]/.test(password)) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'rgb(255, 59, 48)' };
    if (score <= 50) return { score, label: 'Fair', color: 'rgb(255, 149, 0)' };
    if (score <= 75) return { score, label: 'Good', color: 'rgb(255, 204, 0)' };
    return { score, label: 'Strong', color: 'rgb(52, 199, 89)' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const progress = ((currentStep + 1) / REGISTRATION_STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Account Details
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-text">Create your account</h2>
            <p className="text-text-secondary">Let's start with the basics</p>

            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="researcher@university.edu"
              required
              description="Use your institutional email for verification benefits"
            />

            <div>
              <TextField
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a strong password"
                required
              />

              {/* Password Strength Meter using existing ProgressBar */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-secondary-label)]">Password strength</span>
                    <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                  <ProgressBar
                    value={passwordStrength.score}
                    className="h-1"
                    style={{
                      '--progress-color': passwordStrength.color
                    } as React.CSSProperties}
                  />

                  {/* Password requirements checklist */}
                  <div className="mt-2 space-y-1">
                    {[
                      { check: formData.password.length >= 8, text: 'At least 8 characters' },
                      { check: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
                      { check: /[a-z]/.test(formData.password), text: 'One lowercase letter' },
                      { check: /\d/.test(formData.password), text: 'One number' },
                      { check: /[^a-zA-Z\d]/.test(formData.password), text: 'One special character' }
                    ].map((req, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs">
                        {req.check ? (
                          <CheckCircleIcon className="w-4 h-4 text-system-green" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-text-tertiary" />
                        )}
                        <span className={req.check ? 'text-text' : 'text-text-tertiary'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <TextField
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              required
              error={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'Passwords do not match' : undefined}
            />
          </motion.div>
        );

      case 1: // Profile Information
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-text">Your research profile</h2>
            <p className="text-text-secondary">Help us personalize your experience</p>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jane"
                required
              />

              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>

            <TextField
              label="Institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="University or Organization"
              description="This helps us connect you with relevant researchers"
              required
            />

            {/* Discipline Selection using Cards */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Research Discipline
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Psychology', 'Sociology', 'Education', 'Health Sciences', 'Business', 'Other'].map(discipline => (
                  <Card
                    key={discipline}
                    className={`cursor-pointer transition-all hover:scale-[1.02] ${
                      formData.discipline === discipline
                        ? 'border-system-blue bg-system-blue/10'
                        : 'border-fill-quaternary'
                    }`}
                    onClick={() => setFormData({ ...formData, discipline })}
                  >
                    <CardContent className="p-3 text-center">
                      <span className="text-sm font-medium">{discipline}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2: // Preferences (Netflix-style personalization)
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-text">Customize your experience</h2>
            <p className="text-text-secondary">Select your research interests</p>

            {/* Interest Tags using Badge component */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text">
                Research Interests (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Qualitative Research', 'Mixed Methods', 'Survey Design',
                  'Data Visualization', 'Collaborative Studies', 'Longitudinal Studies',
                  'Cross-Cultural Research', 'Experimental Design'
                ].map(interest => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          interests: isSelected
                            ? formData.interests.filter(i => i !== interest)
                            : [...formData.interests, interest]
                        });
                      }}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        isSelected
                          ? 'bg-system-blue text-white'
                          : 'bg-fill-quaternary text-text hover:bg-fill-tertiary'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Preferences using existing Card component */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">
                Communication Preferences
              </label>

              {[
                { id: 'collaboration', label: 'Open to Collaboration', desc: 'Other researchers can invite you to studies' },
                { id: 'updates', label: 'Product Updates', desc: 'New features and improvements' },
                { id: 'newsletter', label: 'Research Newsletter', desc: 'Monthly insights and best practices' }
              ].map(pref => (
                <Card key={pref.id} className="hover:bg-fill-quaternary/50 transition-colors">
                  <CardContent className="p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-text">{pref.label}</div>
                        <div className="text-xs text-text-secondary">{pref.desc}</div>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </label>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        );

      case 3: // Terms & Verification
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-text">Almost done!</h2>
            <p className="text-text-secondary">Review and accept our terms</p>

            {/* Summary Card */}
            <Card className="bg-system-blue/5 border-system-blue/20">
              <CardContent className="p-4">
                <h3 className="font-medium text-text mb-2">Your Account Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="text-text">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Name:</span>
                    <span className="text-text">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Institution:</span>
                    <span className="text-text">{formData.institution}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="rounded mt-1"
                />
                <span className="text-sm text-text">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-system-blue hover:underline">
                    Terms of Service
                  </a>{' '}
                  and understand how VQMethod handles my data
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyAccepted}
                  onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                  className="rounded mt-1"
                />
                <span className="text-sm text-text">
                  I have read and accept the{' '}
                  <a href="/privacy" target="_blank" className="text-system-blue hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* What happens next */}
            <Card className="bg-[var(--color-system-green)]/5 border-[var(--color-system-green)]/20">
              <CardContent className="p-4">
                <h3 className="font-medium text-[var(--color-system-green)] mb-1">
                  ✨ What happens next?
                </h3>
                <ul className="text-sm text-[var(--color-label)] space-y-1">
                  <li>• We'll send a verification email to {formData.email}</li>
                  <li>• Click the link to activate your account</li>
                  <li>• Start creating your first Q-methodology study!</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-b from-[var(--color-system-background)] to-[var(--color-secondary-background)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/70 border-white/20">
          <CardHeader>
            {/* Step Progress using existing ProgressBar */}
            <div className="mb-6">
              <div className="flex justify-between mb-4">
                {REGISTRATION_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      index <= currentStep ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div className={`text-2xl mb-1 ${
                      index === currentStep ? 'scale-110' : ''
                    }`}>
                      {step.icon}
                    </div>
                    <span className="text-xs text-[var(--color-secondary-label)]">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              <ProgressBar value={progress} />
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </CardContent>

          <CardFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Back
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  if (currentStep === REGISTRATION_STEPS.length - 1) {
                    // Submit registration
                    console.log('Submitting:', formData);
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={
                  currentStep === REGISTRATION_STEPS.length - 1 &&
                  (!formData.termsAccepted || !formData.privacyAccepted)
                }
              >
                {currentStep === REGISTRATION_STEPS.length - 1 ? 'Create Account' : 'Continue'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
```

---

## 3. Essential Pages Using Existing Components

### About Page (`/about/page.tsx`)

```typescript
'use client';

import { motion } from 'framer-motion';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/apple-ui';
import { PlayCircleIcon, AcademicCapIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function AboutPage() {
  const features = [
    {
      icon: AcademicCapIcon,
      title: 'Scientific Rigor',
      description: 'Combines qualitative insights with quantitative analysis'
    },
    {
      icon: ChartBarIcon,
      title: 'Pattern Discovery',
      description: 'Reveals hidden patterns through factor analysis'
    },
    {
      icon: UsersIcon,
      title: 'Human-Centered',
      description: 'Captures authentic perspectives on complex topics'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Researchers' },
    { value: '50,000+', label: 'Studies' },
    { value: '1M+', label: 'Q-Sorts' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-system-background)] to-[var(--color-secondary-background)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[var(--color-system-blue)] to-[var(--color-system-purple)] bg-clip-text text-transparent"
          >
            Research Reimagined
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--color-secondary-label)] mb-8"
          >
            VQMethod brings Q-methodology into the digital age
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 justify-center"
          >
            <Button variant="primary" size="large">
              Start Free Trial
            </Button>
            <Button variant="secondary" size="large">
              <PlayCircleIcon className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section using existing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--color-label)]">
            What is Q-Methodology?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-system-blue)]/10 rounded-2xl flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-[var(--color-system-blue)]" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-[var(--color-quaternary-fill)]/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl font-bold text-[var(--color-system-blue)] mb-2">
                  {stat.value}
                </div>
                <div className="text-[var(--color-secondary-label)]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## 4. Tailwind Utilities for Glass Morphism Effect

Use these Tailwind classes for glass morphism and other effects:

### Glass Morphism

```html
<!-- Glass card effect -->
<div
  className="backdrop-blur-xl bg-white/70 dark:bg-black/70 border border-white/20"
>
  <!-- Content -->
</div>
```

### Gradient Backgrounds

```html
<!-- System gradient -->
<div className="bg-gradient-to-b from-background to-surface-secondary">
  <!-- Content -->
</div>

<!-- Color gradients -->
<div className="bg-gradient-to-r from-system-blue to-system-purple">
  <!-- Content -->
</div>
```

### Hover Effects

```html
<!-- Lift on hover -->
<div className="hover:-translate-y-0.5 transition-transform duration-300">
  <!-- Content -->
</div>

<!-- Scale on hover -->
<div className="hover:scale-[1.02] transition-transform">
  <!-- Content -->
</div>
```

### Focus Effects

```html
<!-- Focus ring -->
<input className="focus:ring-2 focus:ring-primary focus:ring-offset-2" />

<!-- Focus within -->
<div className="focus-within:ring-2 focus-within:ring-primary">
  <!-- Content -->
</div>
```

---

## 5. Implementation Guidelines

### Do's ✅

1. **Always use existing Apple UI components** from `@/components/apple-ui`
2. **Use Tailwind classes** for all colors (e.g., `text-system-blue`, `bg-primary`)
3. **Follow 8pt grid** spacing using Tailwind spacing utilities
4. **Use Tailwind transitions** (e.g., `transition-all ease-in-out`)
5. **Leverage existing variants** in Button and TextField components
6. **Use Card component** for all card-based layouts
7. **Apply glass morphism** using Tailwind backdrop utilities
8. **Use ProgressBar component** for all progress indicators

### Don'ts ❌

1. **Don't create new color values** - use existing system colors
2. **Don't hardcode spacing** - use spacing variables
3. **Don't create new button styles** - use Button component variants
4. **Don't duplicate components** - extend existing ones if needed
5. **Don't use inline styles** - use Tailwind classes

### Component Usage Examples

#### Button Variants

```typescript
<Button variant="primary" size="large" fullWidth loading={isLoading}>
  Primary Action
</Button>

<Button variant="secondary" size="md">
  Secondary Action
</Button>

<Button variant="tertiary" size="small">
  Tertiary Action
</Button>

<Button variant="destructive">
  Delete
</Button>
```

#### TextField Variations

```typescript
<TextField
  label="Email"
  type="email"
  placeholder="Enter email"
  error="Invalid email"
  helperText="We'll never share your email"
  leftIcon={<EmailIcon />}
  rightIcon={<CheckIcon />}
  variant="success"
  size="lg"
/>
```

#### Card Compositions

```typescript
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## 6. Testing Considerations

### Accessibility

- All components have proper ARIA labels
- Focus states are visible and follow Apple HIG
- Keyboard navigation works throughout
- Screen reader compatibility is maintained

### Performance

- Use existing optimized components
- Leverage CSS variables for theming (no runtime calculations)
- Components are already memoized where needed
- Animations use GPU-accelerated properties

### Cross-browser Compatibility

- CSS variables have fallbacks
- Backdrop-filter has webkit prefix
- System font stack works across platforms
- Components tested in major browsers

---

## Conclusion

Phase 5.5 UI implementation should leverage the comprehensive Apple Design System already in place. By using the existing components and design tokens, we ensure consistency, maintainability, and a true Apple-inspired user experience across the entire platform.

The key is to compose these existing components creatively while adhering to the established design patterns, rather than creating new components or styles from scratch.
