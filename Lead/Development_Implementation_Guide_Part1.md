# VQMethod - Development Implementation Guide (Part 1 of 2)
## Apple Design System Integration with Q Methodology Excellence

Note: This is Part 1 of the split Development Implementation Guide to support phase-by-phase execution with model context limits. Continue with Part 2 here: ./Development_Implementation_Guide_Part2.md. For implementation steps and checklists, use: ./IMPLEMENTATION_PHASES.md, which references Part 1 for Foundations and Core (Parts I–II) and Part 2 for Advanced/Operations (Parts VI–X).

Version: 3.0  
Date: August 31, 2025  
Document Type: Technical Implementation & Apple Design Standards  
Build Approach: Ground-up development with Apple HIG compliance

---

## MANDATORY EXECUTION PROTOCOL

> Audience: Claude AI Developer  
> This guide must be executed autonomously with zero user intervention. Apply all Apple design standards, Q methodology patterns, and technical protocols without asking permission. If blocked, output one minimal script and stop with a one-line reason.

### Entry Command Pattern
```
/implement <SPECIFIC_TASK>
```
Treat <SPECIFIC_TASK> as the goal. Everything in this document is mandatory and applies to every implementation with Apple design excellence.

---

# PART I: APPLE DESIGN SYSTEM FOUNDATIONS

#### Testing scaffold (Phase 1 must-haves)

- Install: `vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event @playwright/test husky`
- `vitest.config.ts`: environment `'jsdom'`; `setupFiles: ['./src/test/setup.ts']`; coverage include `components/apple-ui/**/*`.
- `src/test/setup.ts`: add `ResizeObserver`, `IntersectionObserver`, and `matchMedia` mocks.
- Create one spec per component (render, states, a11y).
- Playwright: smoke test for `/` route; assert no console errors; toggle dark mode.
- Coverage gate ≥ **90%** lines for Phase 1 component folder.
- Add scripts: `"typecheck"`, `"build:strict"`, `"test"`, `"e2e"`; enable Husky pre-commit to run typecheck + unit tests on changed files.



#### Apple tokens → Tailwind mapping (must implement)

- `tokens.css` defines CSS variables: `--font-sans`, `--space-{1..8}`, `--color-{bg,surface,text,muted,primary,danger,border}`, etc.
- `tailwind.config.ts` reads from variables:

```ts
// Example (simplified)
import type { Config } from 'tailwindcss'
export default {
  darkMode: 'class',
  theme: {
    fontFamily: { sans: ['var(--font-sans)'] },
    spacing: { 1:'var(--space-1)', 2:'var(--space-2)', 3:'var(--space-3)', 4:'var(--space-4)' },
    colors: {
      bg:'var(--color-bg)',
      surface:'var(--color-surface)',
      text:'var(--color-text)',
      muted:'var(--color-muted)',
      primary:'var(--color-primary)',
      danger:'var(--color-danger)',
      border:'var(--color-border)'
    }
  }
} satisfies Config;
```

- Dark mode via the `dark` class on `<html>`. Provide a `ThemeToggle` that flips the class and persists the preference.



## 1. Apple Human Interface Guidelines Integration

### 1.1 Core Design Principles (Mandatory)
```typescript
// Apple Design System Configuration
export const AppleDesignSystem = {
  principles: {
    clarity: 'Typography and visual hierarchy prioritize content readability',
    deference: 'UI elements support content without competing for attention',  
    depth: 'Layered interfaces create spatial relationships',
    consistency: 'Predictable patterns across all interactions'
  },
  implementation: 'Every component must follow Apple HIG 2024 standards'
} as const;
```

### 1.2 Typography System (San Francisco Pro)
```css
/* MANDATORY: Apple Typography System */
:root {
  /* San Francisco Pro Font Stack */
  --font-family-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-text: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Apple Typography Scale (Mandatory sizes) */
  --text-large-title: 34px;    /* Hero sections, main titles */
  --text-title-1: 28px;        /* Section headers */
  --text-title-2: 22px;        /* Subsection headers */
  --text-title-3: 20px;        /* Card titles */
  --text-headline: 17px;       /* Prominent body text */
  --text-body: 17px;           /* Standard body text */
  --text-callout: 16px;        /* Secondary content */
  --text-subhead: 15px;        /* Supporting text */
  --text-footnote: 13px;       /* Metadata, captions */
  --text-caption-1: 12px;      /* Small labels */
  --text-caption-2: 11px;      /* Smallest text */
}

/* Typography Implementation Classes */
.apple-large-title { 
  font-family: var(--font-family-display);
  font-size: var(--text-large-title);
  font-weight: 700;
  line-height: 1.2;
}

.apple-body {
  font-family: var(--font-family-text);
  font-size: var(--text-body);
  font-weight: 400;
  line-height: 1.47;
}
```

### 1.3 Color System (Apple Semantic Colors)
```css
/* MANDATORY: Apple Color System with Light/Dark Mode */
:root {
  color-scheme: light dark;
  
  /* Label Colors */
  --color-label: light-dark(rgba(0,0,0,1), rgba(255,255,255,1));
  --color-secondary-label: light-dark(rgba(60,60,67,0.6), rgba(235,235,245,0.6));
  --color-tertiary-label: light-dark(rgba(60,60,67,0.3), rgba(235,235,245,0.3));
  --color-quaternary-label: light-dark(rgba(60,60,67,0.18), rgba(235,235,245,0.16));
  
  /* Background Colors */
  --color-system-background: light-dark(rgba(255,255,255,1), rgba(0,0,0,1));
  --color-secondary-background: light-dark(rgba(242,242,247,1), rgba(28,28,30,1));
  --color-tertiary-background: light-dark(rgba(255,255,255,1), rgba(44,44,46,1));
  
  /* System Colors */
  --color-system-blue: light-dark(rgba(0,122,255,1), rgba(10,132,255,1));
  --color-system-green: light-dark(rgba(52,199,89,1), rgba(48,209,88,1));
  --color-system-red: light-dark(rgba(255,59,48,1), rgba(255,69,58,1));
  --color-system-orange: light-dark(rgba(255,149,0,1), rgba(255,159,10,1));
  --color-system-yellow: light-dark(rgba(255,204,0,1), rgba(255,214,10,1));
  --color-system-purple: light-dark(rgba(175,82,222,1), rgba(191,90,242,1));
  --color-system-pink: light-dark(rgba(255,45,85,1), rgba(255,55,95,1));
  --color-system-teal: light-dark(rgba(89,173,196,1), rgba(102,187,106,1));
  
  /* Fill Colors for Interactive Elements */
  --color-system-fill: light-dark(rgba(120,120,128,0.2), rgba(120,120,128,0.36));
  --color-secondary-fill: light-dark(rgba(120,120,128,0.16), rgba(120,120,128,0.32));
  --color-tertiary-fill: light-dark(rgba(118,118,128,0.12), rgba(118,118,128,0.24));
  --color-quaternary-fill: light-dark(rgba(116,116,128,0.08), rgba(118,118,128,0.18));
}
```

### 1.4 Spacing System (8pt Grid)
```css
/* MANDATORY: Apple 8pt Grid System */
:root {
  /* Base spacing unit: 8px */
  --spacing-base: 8px;
  
  /* Apple Spacing Scale */
  --spacing-xs: 4px;     /* 0.5 × base */
  --spacing-sm: 8px;     /* 1 × base */
  --spacing-md: 16px;    /* 2 × base */
  --spacing-lg: 24px;    /* 3 × base */
  --spacing-xl: 32px;    /* 4 × base */
  --spacing-xxl: 48px;   /* 6 × base */
  --spacing-xxxl: 64px;  /* 8 × base */
  
  /* Component-specific spacing */
  --spacing-button-padding: 12px 16px;
  --spacing-card-padding: 16px;
  --spacing-section-gap: 32px;
  --spacing-form-gap: 16px;
}
```

### 1.5 Animation System (Apple Motion)
```css
/* MANDATORY: Apple Animation Standards */
:root {
  /* Apple Easing Functions */
  --ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  
  /* Apple Standard Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;
}

/* Apple-style Transitions */
.apple-transition {
  transition: all var(--duration-normal) var(--ease-in-out);
}

.apple-hover-scale:hover {
  transform: scale(1.02);
  transition: transform var(--duration-fast) var(--ease-out);
}
```

---

# PART II: DUAL INTERFACE ARCHITECTURE

## 2. Interface Architecture (Researcher + Participant)

### 2.1 Repository Structure (Mandatory)
```
vqmethod/
├── .nvmrc                     # Node version (20)
├── docker-compose.yml         # Development environment
├── package.json              # Root workspace configuration
├── frontend/                 # Next.js application
│   ├── app/                  # Next.js App Router
│   │   ├── (researcher)/     # Researcher interface routes
│   │   │   ├── dashboard/
│   │   │   ├── studies/
│   │   │   │   ├── create/
│   │   │   │   └── [id]/
│   │   │   │       ├── design/
│   │   │   │       ├── participants/
│   │   │   │       ├── analysis/
│   │   │   │       └── export/
│   │   │   └── settings/
│   │   ├── (participant)/    # Participant interface routes
│   │   │   ├── join/         # SECURITY: Invitation redemption page
│   │   │   └── study/        # Secure participant flow (session-based)
│   │   │       ├── welcome/
│   │   │       ├── consent/
│   │   │       ├── familiarization/
│   │   │       ├── pre-sort/
│   │   │       ├── q-sort/
│   │   │       ├── commentary/
│   │   │       ├── post-survey/
│   │   │       └── thank-you/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── apple-ui/         # Apple HIG component library
│   │   │   ├── Button/
│   │   │   ├── TextField/
│   │   │   ├── Slider/
│   │   │   ├── SegmentedControl/
│   │   │   ├── NavigationBar/
│   │   │   ├── TabBar/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── ProgressBar/
│   │   │   └── index.ts
│   │   ├── researcher/       # Researcher interface components
│   │   │   ├── Dashboard/
│   │   │   ├── StudyBuilder/
│   │   │   │   ├── QuestionBuilder/
│   │   │   │   ├── GridDesigner/
│   │   │   │   ├── StimuliManager/
│   │   │   │   └── FlowDesigner/
│   │   │   ├── Analytics/
│   │   │   └── DataExport/
│   │   ├── participant/      # Participant interface components
│   │   │   ├── StepFlow/
│   │   │   ├── QSortGrid/
│   │   │   ├── PreSorting/
│   │   │   ├── StimuliGallery/
│   │   │   ├── Commentary/
│   │   │   └── ProgressTracker/
│   │   └── shared/          # Shared components
│   │       ├── VideoConferencing/
│   │       ├── RichTextEditor/
│   │       ├── MediaPlayer/
│   │       └── FormBuilder/
│   ├── lib/
│   │   ├── apple-design/     # Apple design system utilities
│   │   ├── api/             # API client layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand state management
│   │   └── utils/           # Utility functions
│   └── styles/
│       ├── apple-design.css  # Apple design system base
│       ├── globals.css      # Global styles
│       └── components.css   # Component-specific styles
├── backend/                 # NestJS application
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── studies/
│   │   │   ├── questionnaires/  # Advanced questionnaire engine
│   │   │   ├── qsort/          # Q-sort specific logic
│   │   │   ├── stimuli/        # Media management
│   │   │   ├── participants/   # Participant management
│   │   │   ├── analysis/       # Q methodology analysis
│   │   │   ├── video-conferencing/ # Meet/Zoom integration
│   │   │   ├── export/         # Data export
│   │   │   └── notifications/  # Email/SMS
│   │   └── common/
│   │       ├── apple-design/   # Apple design validation
│   │       └── q-methodology/  # Q methodology utilities
│   └── prisma/
└── infrastructure/         # Docker, deployment configs
```

### 2.2 Apple UI Component Library (Mandatory Implementation)

#### Base Button Component
```typescript
// components/apple-ui/Button/Button.tsx
'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles following Apple HIG
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Apple iOS button styles
        primary: "bg-system-blue text-white hover:bg-blue-600 active:bg-blue-700",
        secondary: "bg-quaternary-fill text-label hover:bg-tertiary-fill",
        destructive: "bg-system-red text-white hover:bg-red-600 active:bg-red-700",
        ghost: "text-system-blue hover:bg-quaternary-fill active:bg-tertiary-fill",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base", // Default iOS button height
        lg: "h-13 px-6 text-lg", // Apple standard height for large buttons
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
```

#### Apple TextField Component
```typescript
// components/apple-ui/TextField/TextField.tsx
'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textFieldVariants = cva(
  // Apple iOS text field styling
  "w-full rounded-lg border bg-tertiary-background px-4 py-3 text-body text-label placeholder:text-tertiary-label transition-all focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20",
  {
    variants: {
      variant: {
        default: "border-quaternary-fill hover:border-tertiary-fill",
        error: "border-system-red focus:border-system-red focus:ring-red-500/20",
        success: "border-system-green focus:border-system-green focus:ring-green-500/20",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-body", // iOS standard
        lg: "h-13 px-4 text-lg", // Apple standard height for large text fields
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, helperText, error, variant, size, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(props.value || props.defaultValue);
    
    const currentVariant = error ? 'error' : variant || 'default';

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            className={cn(textFieldVariants({ variant: currentVariant, size }), className)}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {/* iOS-style floating label */}
          {props.placeholder && (isFocused || hasValue) && (
            <div className="absolute -top-2 left-3 bg-tertiary-background px-1 text-xs text-secondary-label">
              {props.placeholder}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p className={cn(
            "text-sm",
            error ? "text-system-red" : "text-secondary-label"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";

export { TextField };
```

## 3. 8-Step Participant Journey Implementation

### 3.1 Step Flow Controller (Mandatory Pattern)
```typescript
// lib/hooks/useParticipantFlow.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ParticipantStep = 
  | 'pre-screening'
  | 'welcome' 
  | 'consent'
  | 'familiarization'
  | 'pre-sorting'
  | 'q-sort'
  | 'commentary'
  | 'post-survey'
  | 'thank-you';

interface ParticipantFlowState {
  currentStep: ParticipantStep;
  completedSteps: ParticipantStep[];
  studyToken: string;
  participantData: {
    demographics?: Record<string, any>;
    consent?: ConsentData;
    qSortData?: QSortData;
    commentary?: CommentaryData;
    surveyData?: Record<string, any>;
  };
  
  // Actions
  setCurrentStep: (step: ParticipantStep) => void;
  completeStep: (step: ParticipantStep, data?: any) => void;
  updateParticipantData: (key: string, data: any) => void;
  resetFlow: () => void;
  
  // Apple-style progress calculation
  getProgress: () => number;
  getNextStep: () => ParticipantStep | null;
  getPreviousStep: () => ParticipantStep | null;
}

// Participant flow step order (9 steps total including pre-screening and thank-you)
const PARTICIPANT_STEP_ORDER: ParticipantStep[] = [
  'pre-screening', 'welcome', 'consent', 'familiarization',
  'pre-sorting', 'q-sort', 'commentary', 'post-survey', 'thank-you'
];

// SECURITY: No localStorage persistence for participant data
// All sensitive data (demographics, consent, Q-sort data) stored server-side only
// Client stores only encrypted resume token for session recovery
export const useParticipantFlow = create<ParticipantFlowState>()((set, get) => ({
  currentStep: 'pre-screening',
  completedSteps: [],
  studyToken: '',
  participantData: {}, // Never persisted locally - server-side only
  resumeToken: '', // Encrypted, server-validated resume token

  setCurrentStep: (step) => {
    set({ currentStep: step });
    // Auto-save progress to server with resume token
    get().saveProgressToServer();
  },
  
  completeStep: async (step, data) => {
    // Save data to server immediately, never store locally
    const response = await fetch('/api/participant/save-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeToken: get().resumeToken,
        step,
        data: data || {},
        timestamp: new Date().toISOString()
      }),
      credentials: 'include' // Use HttpOnly cookies for session
    });

    if (response.ok) {
      const { encryptedResumeToken } = await response.json();
      set((state) => ({
        completedSteps: [...state.completedSteps, step],
        resumeToken: encryptedResumeToken,
        // participantData NOT stored locally
      }));
    }
  },

  updateParticipantData: async (key, data) => {
    // All participant data updates go to server immediately
    await fetch('/api/participant/update-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeToken: get().resumeToken,
        key,
        data,
        timestamp: new Date().toISOString()
      }),
      credentials: 'include'
    });
  },

  resetFlow: () => {
    // Clear all local state and invalidate server session
    fetch('/api/participant/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeToken: get().resumeToken }),
      credentials: 'include'
    });
    
    set({
      currentStep: 'pre-screening',
      completedSteps: [],
      participantData: {},
      resumeToken: '',
    });
  },

  saveProgressToServer: async () => {
    const { currentStep, completedSteps, resumeToken } = get();
    try {
      await fetch('/api/participant/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeToken,
          currentStep,
          completedSteps,
          timestamp: new Date().toISOString()
        }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  },

  getProgress: () => {
    const { completedSteps } = get();
    const totalSteps = PARTICIPANT_STEP_ORDER.length; 
    return (completedSteps.length / totalSteps) * 100;
  },

  getNextStep: (): ParticipantStep | null => {
    const { currentStep } = get();
    const currentIndex = PARTICIPANT_STEP_ORDER.indexOf(currentStep);
    return currentIndex < PARTICIPANT_STEP_ORDER.length - 1 ? PARTICIPANT_STEP_ORDER[currentIndex + 1] : null;
  },

  getPreviousStep: (): ParticipantStep | null => {
    const { currentStep } = get();
    const currentIndex = PARTICIPANT_STEP_ORDER.indexOf(currentStep);
    return currentIndex > 0 ? PARTICIPANT_STEP_ORDER[currentIndex - 1] : null;
  },
}));
```

### 3.2 Apple-Style Progress Indicator
```typescript
// components/participant/ProgressTracker/ProgressTracker.tsx
'use client';

import { useParticipantFlow } from '@/lib/hooks/useParticipantFlow';
import { cn } from '@/lib/utils';

const stepLabels = {
  'pre-screening': 'Screening',
  'welcome': 'Welcome',
  'consent': 'Consent',
  'familiarization': 'Review',
  'pre-sorting': 'Pre-Sort',
  'q-sort': 'Q-Sort',
  'commentary': 'Comments',
  'post-survey': 'Survey',
  'thank-you': 'Complete'
};

export function ProgressTracker() {
  const { currentStep, completedSteps, getProgress } = useParticipantFlow();
  const progress = getProgress();

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Apple-style progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary-label">Progress</span>
          <span className="text-sm font-medium text-secondary-label">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-quaternary-fill rounded-full overflow-hidden">
          <div 
            className="h-full bg-system-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators - Apple iOS style */}
      <div className="flex items-center justify-between">
        {Object.entries(stepLabels).map(([step, label], index) => {
          const isCompleted = completedSteps.includes(step as any);
          const isCurrent = currentStep === step;
          
          return (
            <div key={step} className="flex flex-col items-center space-y-2">
              {/* Step circle */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                isCurrent && "bg-system-blue text-white scale-110",
                isCompleted && !isCurrent && "bg-system-green text-white",
                !isCompleted && !isCurrent && "bg-quaternary-fill text-tertiary-label"
              )}>
                {isCompleted && !isCurrent ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Step label */}
              <span className={cn(
                "text-xs font-medium text-center max-w-16",
                isCurrent && "text-system-blue",
                isCompleted && !isCurrent && "text-system-green",
                !isCompleted && !isCurrent && "text-tertiary-label"
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```
