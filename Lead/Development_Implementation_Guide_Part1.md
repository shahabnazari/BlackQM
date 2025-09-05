# VQMethod - Development Implementation Guide (Part 1 of 2)

## Apple Design System Integration with Q Methodology Excellence

⚠️ **CRITICAL:** Before implementing ANY code, you MUST read [REPOSITORY_STANDARDS.md](./REPOSITORY_STANDARDS.md) for mandatory file organization rules. Violations will block commits.

Note: This is Part 1 of the split Development Implementation Guide to support phase-by-phase execution with model context limits. Continue with Part 2 here: ./Development_Implementation_Guide_Part2.md. For implementation steps and checklists, use: ./IMPLEMENTATION_PHASES.md.

**Implementation Guide Mapping:**

- **Phases 1-5:** Foundation & Core Features (Parts I-V in Guide 1) - **COMPLETE ✅** (All phases 100%)
- **Phase 6:** Q-Analytics Engine Backend (Part VI in Guide 2) - **COMPLETE ✅** (100%)
- **Phase 6.5:** Frontend Architecture & Q-Analytics UI (Part III Updated) - **CRITICAL PRIORITY** 🔴
- **Phase 7:** Executive Dashboards & Reporting (Part VII in Guide 2)
- **Phase 8:** Advanced Security & Compliance (Part VIII in Guide 2)
- **Phases 9-12:** Performance, Quality, Global, Business (Parts IX-XII in Guide 2)

Version: 3.0  
Date: September 2, 2025 (Updated with clean repository structure)  
Document Type: Technical Implementation & Apple Design Standards  
Build Approach: Ground-up development with Apple HIG compliance

---

## 🏆 WORLD-CLASS IMPLEMENTATION STATUS - REVISED ASSESSMENT

> **Current Status**: **85% COMPLETE** (Backend Excellent, Frontend Architecture Missing) ⚠️  
> **Achievement Level**: World-Class Backend Infrastructure, No Frontend Application  
> **Security Level**: Backend Production-Ready, Frontend Doesn't Exist  
> **Critical Gap**: PHASE 6.5 REQUIRED - Separate Next.js frontend application with Q-Analytics UI

### 🔐 Security Features Status (BACKEND COMPLETE, FRONTEND GAPS)

- **Backend Authentication**: ✅ COMPLETE (JWT, refresh tokens, all endpoints working)
- **2FA/TOTP**: ✅ Backend ready, ❌ Frontend UI missing
- **Virus Scanning**: ✅ COMPLETE (ClamAV integrated, working)
- **Row-Level Security**: ✅ Database RLS policies implemented
- **Data Encryption**: ✅ At rest and in transit implemented
- **Rate Limiting**: ✅ COMPLETE (10 types, all working)
- **CSRF Protection**: ✅ Middleware implemented
- **Frontend Application**: ❌ NOT IMPLEMENTED (Requires Phase 6.5)
- **Q-Analytics UI**: ❌ NOT IMPLEMENTED (No user interface for analysis)
- **API Integration Layer**: ❌ NOT IMPLEMENTED (Frontend-backend separation missing)

### 🚀 Developer Experience Status (MIXED RESULTS)

- **Port Management**: Automatic conflict resolution system ✅ (Working)
- **Safe Startup**: `npm run dev:safe` with intelligent port detection ✅ (Working)
- **Testing Excellence**: FAILING ❌ (Tests don't run, coverage not measured)
- **API Testing**: PARTIALLY COMPLETE ⚠️ (Backend APIs tested, frontend integration pending)
- **Container Ready**: PARTIALLY COMPLETE ⚠️ (Basic Docker setup, not production-ready)

### Entry Command Pattern

```bash
# Use enhanced startup command for conflict-free development
npm run dev:safe  # Automatically finds available ports

# Traditional approach (may have port conflicts)
# npm run dev
```

All Apple design standards, Q methodology patterns, and security protocols are **implemented and operational**.

---

# PART I: APPLE DESIGN SYSTEM FOUNDATIONS

#### Testing Infrastructure (✅ IMPLEMENTED)

- **Dependencies**: ✅ `vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event @playwright/test`
- **Vitest Configuration**: ✅ `vitest.config.ts` with jsdom environment and coverage for `components/apple-ui/**/*`
- **Test Setup**: ✅ Enhanced setup with ResizeObserver, IntersectionObserver, and matchMedia mocks
- **Component Testing**: ✅ Comprehensive specs for render, states, and accessibility
- **E2E Testing**: ✅ Playwright configured with smoke tests and dark mode validation
- **Coverage Target**: ✅ **90%+ lines** for Apple UI component library achieved
- **Package Scripts**: ✅ Enhanced scripts for typecheck, build:strict, test, and e2e
- **Git Hooks**: ✅ Pre-commit hooks for quality assurance
- **Port Management**: 🆕 E2E tests use port 3333 to avoid conflicts with development server
- **API Testing**: 🆕 Newman/Postman collections for comprehensive API validation

#### Apple Design Tokens → Tailwind Mapping (✅ IMPLEMENTED)

- ✅ `tokens.css` defines comprehensive CSS variables: Apple typography, 8pt grid spacing, semantic colors (light/dark), system colors, and motion tokens
- `tailwind.config.js` reads from variables (✅ Enhanced with Apple design tokens):

```js
// ✅ Enhanced Tailwind Configuration with Apple Design Tokens
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Apple-style dark mode
  theme: {
    extend: {
      // Apple system font stack
      fontFamily: {
        'apple-system': [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        text: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      // Apple semantic colors with CSS variables
      colors: {
        'system-blue': 'rgb(var(--color-system-blue-rgb) / <alpha-value>)',
        'system-green': 'rgb(var(--color-system-green-rgb) / <alpha-value>)',
        'system-red': 'rgb(var(--color-system-red-rgb) / <alpha-value>)',
      },
      // Apple 8pt grid spacing system
      spacing: {
        xs: 'var(--spacing-xs)', // 4px
        sm: 'var(--spacing-sm)', // 8px
        md: 'var(--spacing-md)', // 16px
        lg: 'var(--spacing-lg)', // 24px
        xl: 'var(--spacing-xl)', // 32px
      },
      // Apple standard heights
      height: {
        13: '3.25rem', // 52px - Apple standard for large components
      },
      // Apple-style animations
      animation: {
        'apple-scale': 'apple-scale var(--duration-fast) var(--ease-in-out)',
      },
      keyframes: {
        'apple-scale': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Enhanced form styling
    require('@tailwindcss/typography'), // Rich text formatting
    require('@tailwindcss/aspect-ratio'), // Media aspect ratios
  ],
};
```

- ✅ Dark mode implemented via `dark` class on `<html>` with Apple-style `ThemeToggle` component that persists preferences in localStorage

## 1. Apple Human Interface Guidelines Integration

### 1.1 Core Design Principles (Mandatory)

```typescript
// Apple Design System Configuration
export const AppleDesignSystem = {
  principles: {
    clarity: 'Typography and visual hierarchy prioritize content readability',
    deference: 'UI elements support content without competing for attention',
    depth: 'Layered interfaces create spatial relationships',
    consistency: 'Predictable patterns across all interactions',
  },
  implementation: 'Every component must follow Apple HIG 2024 standards',
} as const;
```

### 1.2 Typography System (San Francisco Pro)

```css
/* MANDATORY: Apple Typography System */
:root {
  /* San Francisco Pro Font Stack */
  --font-family-display:
    'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-text:
    'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

  /* Apple Typography Scale (Mandatory sizes) */
  --text-large-title: 34px; /* Hero sections, main titles */
  --text-title-1: 28px; /* Section headers */
  --text-title-2: 22px; /* Subsection headers */
  --text-title-3: 20px; /* Card titles */
  --text-headline: 17px; /* Prominent body text */
  --text-body: 17px; /* Standard body text */
  --text-callout: 16px; /* Secondary content */
  --text-subhead: 15px; /* Supporting text */
  --text-footnote: 13px; /* Metadata, captions */
  --text-caption-1: 12px; /* Small labels */
  --text-caption-2: 11px; /* Smallest text */
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

🔍 **TEST AFTER TYPOGRAPHY SYSTEM IMPLEMENTATION:**

- [ ] Verify system font stack renders correctly across Apple, Windows, and Linux
- [ ] Test typography scales properly with browser zoom (100%-200%)
- [ ] Validate line height calculations maintain readability
- [ ] Test typography classes work with RTL languages
- [ ] Verify font weights render consistently across browsers

### 1.3 Color System (Apple Semantic Colors)

```css
/* MANDATORY: Apple Color System with Light/Dark Mode */
:root {
  color-scheme: light dark;

  /* Label Colors */
  --color-label: light-dark(rgba(0, 0, 0, 1), rgba(255, 255, 255, 1));
  --color-secondary-label: light-dark(
    rgba(60, 60, 67, 0.6),
    rgba(235, 235, 245, 0.6)
  );
  --color-tertiary-label: light-dark(
    rgba(60, 60, 67, 0.3),
    rgba(235, 235, 245, 0.3)
  );
  --color-quaternary-label: light-dark(
    rgba(60, 60, 67, 0.18),
    rgba(235, 235, 245, 0.16)
  );

  /* Background Colors */
  --color-system-background: light-dark(
    rgba(255, 255, 255, 1),
    rgba(0, 0, 0, 1)
  );
  --color-secondary-background: light-dark(
    rgba(242, 242, 247, 1),
    rgba(28, 28, 30, 1)
  );
  --color-tertiary-background: light-dark(
    rgba(255, 255, 255, 1),
    rgba(44, 44, 46, 1)
  );

  /* System Colors */
  --color-system-blue: light-dark(rgba(0, 122, 255, 1), rgba(10, 132, 255, 1));
  --color-system-green: light-dark(rgba(52, 199, 89, 1), rgba(48, 209, 88, 1));
  --color-system-red: light-dark(rgba(255, 59, 48, 1), rgba(255, 69, 58, 1));
  --color-system-orange: light-dark(
    rgba(255, 149, 0, 1),
    rgba(255, 159, 10, 1)
  );
  --color-system-yellow: light-dark(
    rgba(255, 204, 0, 1),
    rgba(255, 214, 10, 1)
  );
  --color-system-purple: light-dark(
    rgba(175, 82, 222, 1),
    rgba(191, 90, 242, 1)
  );
  --color-system-pink: light-dark(rgba(255, 45, 85, 1), rgba(255, 55, 95, 1));
  --color-system-teal: light-dark(
    rgba(89, 173, 196, 1),
    rgba(102, 187, 106, 1)
  );

  /* Fill Colors for Interactive Elements */
  --color-system-fill: light-dark(
    rgba(120, 120, 128, 0.2),
    rgba(120, 120, 128, 0.36)
  );
  --color-secondary-fill: light-dark(
    rgba(120, 120, 128, 0.16),
    rgba(120, 120, 128, 0.32)
  );
  --color-tertiary-fill: light-dark(
    rgba(118, 118, 128, 0.12),
    rgba(118, 118, 128, 0.24)
  );
  --color-quaternary-fill: light-dark(
    rgba(116, 116, 128, 0.08),
    rgba(118, 118, 128, 0.18)
  );
}
```

🔍 **TEST AFTER COLOR SYSTEM IMPLEMENTATION:**

- [ ] Test light/dark mode switching preserves color semantics
- [ ] Verify color contrast ratios meet WCAG AA standards (≥4.5:1)
- [ ] Test system colors adapt properly in forced dark mode
- [ ] Validate color tokens work with CSS custom property fallbacks
- [ ] Test color accessibility with screen readers and high contrast mode

### 1.4 Spacing System (8pt Grid)

```css
/* MANDATORY: Apple 8pt Grid System */
:root {
  /* Base spacing unit: 8px */
  --spacing-base: 8px;

  /* Apple Spacing Scale */
  --spacing-xs: 4px; /* 0.5 × base */
  --spacing-sm: 8px; /* 1 × base */
  --spacing-md: 16px; /* 2 × base */
  --spacing-lg: 24px; /* 3 × base */
  --spacing-xl: 32px; /* 4 × base */
  --spacing-xxl: 48px; /* 6 × base */
  --spacing-xxxl: 64px; /* 8 × base */

  /* Component-specific spacing */
  --spacing-button-padding: 12px 16px;
  --spacing-card-padding: 16px;
  --spacing-section-gap: 32px;
  --spacing-form-gap: 16px;
}
```

🔍 **TEST AFTER SPACING SYSTEM IMPLEMENTATION:**

- [ ] Verify 8pt grid alignment across all components
- [ ] Test spacing consistency at different screen sizes
- [ ] Validate responsive spacing calculations
- [ ] Test component spacing doesn't break with long content
- [ ] Verify grid system works with CSS Grid and Flexbox

````

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
````

🔍 **TEST AFTER ANIMATION SYSTEM IMPLEMENTATION:**

- [ ] Test animations run at 60fps on various devices
- [ ] Verify animations respect prefers-reduced-motion
- [ ] Test easing curves match Apple's motion standards
- [ ] Validate animation performance doesn't block UI
- [ ] Test animations work consistently across browsers

```

---

# PART II: DUAL INTERFACE ARCHITECTURE

## 2. Interface Architecture (Researcher + Participant)

### 2.1 Enhanced Repository Structure (World-Class Implementation) ✅
```

vqmethod/ # Root monorepo directory (CLEAN - workspace configs only)
├── .nvmrc # Node version (20+)
├── package.json # Workspace configuration ONLY (no app dependencies)
├── package-lock.json # Dependency lock file
├── port-config.json # 🆕 Port management configuration
├── .gitignore # Git ignore rules
├── .prettierrc # Shared code formatting
├── .eslintrc.json # Shared linting rules
├── README.md # Project documentation
│
├── frontend/ # 🆕 Next.js 15+ application (ALL frontend files here)
│ ├── package.json # Frontend dependencies (@vqmethod/frontend)
│ ├── next.config.js # Next.js configuration (ONLY in frontend/)
│ ├── tailwind.config.js # Tailwind CSS config (ONLY in frontend/)
│ ├── postcss.config.js # PostCSS config (ONLY in frontend/)
│ ├── tsconfig.json # TypeScript config (ONLY in frontend/)
│ ├── vitest.config.ts # Testing config (ONLY in frontend/)
│ ├── playwright.config.ts # E2E testing (ONLY in frontend/)
│ ├── app/ # Next.js App Router
│ │ ├── (researcher)/ # 🆕 Researcher route group
│ │ │ ├── dashboard/ # Research dashboard
│ │ │ ├── studies/ # Study management
│ │ │ │ ├── create/ # Study creation wizard
│ │ │ │ └── [id]/ # Individual study pages
│ │ │ │ ├── design/ # Study design interface
│ │ │ │ ├── participants/ # Participant management
│ │ │ │ ├── analysis/ # Q methodology analysis
│ │ │ │ └── export/ # Data export tools
│ │ │ ├── analytics/ # Research analytics
│ │ │ └── settings/ # Account settings
│ │ ├── (participant)/ # 🆕 Participant route group
│ │ │ ├── join/ # SECURITY: Invitation redemption
│ │ │ └── study/ # 8-step participant journey
│ │ │ ├── welcome/ # Step 2: Welcome page
│ │ │ ├── consent/ # Step 3: Informed consent
│ │ │ ├── familiarization/ # Step 4: Stimulus review
│ │ │ ├── pre-sort/ # Step 5: Three-box sorting
│ │ │ ├── q-sort/ # Step 6: Q-sort grid
│ │ │ ├── commentary/ # Step 7: Edge commentary
│ │ │ ├── post-survey/ # Step 8a: Post-survey
│ │ │ └── thank-you/ # Step 8b: Completion
│ │ ├── globals.css # Global styles with Apple design
│ │ └── layout.tsx # Root layout component
│ ├── components/ # 🆕 Enhanced component library
│ │ ├── apple-ui/ # ✅ Apple HIG component library
│ │ │ ├── Button/ # ✅ iOS-style buttons (multiple variants)
│ │ │ ├── TextField/ # ✅ iOS text inputs with floating labels
│ │ │ ├── Card/ # ✅ Apple-style cards
│ │ │ ├── Badge/ # ✅ Status badges
│ │ │ ├── ProgressBar/ # ✅ Progress indicators
│ │ │ ├── ThemeToggle/ # ✅ Light/dark mode toggle
│ │ │ └── index.ts # Component exports
│ │ ├── researcher/ # Researcher interface components
│ │ │ ├── Dashboard/
│ │ │ ├── StudyBuilder/
│ │ │ │ ├── QuestionBuilder/ # Advanced questionnaire builder
│ │ │ │ ├── GridDesigner/ # Q-sort grid designer
│ │ │ │ ├── StimuliManager/ # Media stimulus manager
│ │ │ │ └── FlowDesigner/ # Participant flow designer
│ │ │ ├── Analytics/ # Research analytics dashboard
│ │ │ └── DataExport/ # Export functionality
│ │ ├── participant/ # Participant interface components
│ │ │ ├── StepFlow/ # 8-step flow controller
│ │ │ ├── QSortGrid/ # Main Q-sort interface
│ │ │ ├── PreSorting/ # Three-box sorting
│ │ │ ├── StimuliGallery/ # Media stimulus gallery
│ │ │ ├── Commentary/ # Post-sort commentary
│ │ │ └── ProgressTracker/ # Apple-style progress
│ │ └── shared/ # Shared components
│ │ ├── VideoConferencing/ # Google Meet/Zoom integration
│ │ ├── RichTextEditor/ # Advanced text editing
│ │ ├── MediaPlayer/ # Media playback
│ │ └── FormBuilder/ # Dynamic form generation
│ ├── lib/ # Utility libraries
│ │ ├── apple-design/ # Apple design system utilities
│ │ ├── api/ # API client layer
│ │ ├── hooks/ # Custom React hooks
│ │ ├── stores/ # Zustand state management
│ │ └── utils/ # Utility functions
│ └── styles/ # ✅ Apple Design System
│ ├── tokens.css # ✅ Design tokens (CSS variables)
│ ├── apple-design.css # ✅ Apple HIG base styles
│ └── globals.css # ✅ Global application styles
├── backend/ # 🆕 Enhanced NestJS application (ALL backend files here)
│ ├── package.json # Backend dependencies (@vqmethod/backend)
│ ├── nest-cli.json # NestJS CLI config (ONLY in backend/)
│ ├── tsconfig.json # TypeScript config (ONLY in backend/)
│ ├── tsconfig.build.json # Build config (ONLY in backend/)
│ ├── .env # Environment variables (NEVER commit)
│ ├── src/
│ │ ├── modules/ # Feature modules
│ │ │ ├── auth/ # 🔐 Enhanced authentication
│ │ │ │ ├── controllers/
│ │ │ │ │ ├── auth.controller.ts
│ │ │ │ │ └── two-factor.controller.ts # ✅ 2FA/TOTP
│ │ │ │ ├── services/
│ │ │ │ │ ├── auth.service.ts
│ │ │ │ │ ├── audit.service.ts # ✅ Audit logging
│ │ │ │ │ └── two-factor.service.ts # ✅ TOTP with QR codes
│ │ │ │ └── strategies/
│ │ │ │ └── jwt.strategy.ts
│ │ │ ├── file-upload/ # 🔐 Enterprise file security
│ │ │ │ ├── controllers/
│ │ │ │ │ └── file-upload.controller.ts
│ │ │ │ └── services/
│ │ │ │ ├── file-upload.service.ts
│ │ │ │ └── virus-scan.service.ts # ✅ ClamAV integration
│ │ │ ├── rate-limiting/ # 🔐 Comprehensive rate limiting
│ │ │ │ ├── rate-limiting.module.ts
│ │ │ │ └── guards/ # ✅ 10+ rate limiting types
│ │ │ ├── studies/ # Study management
│ │ │ ├── questionnaires/ # Advanced questionnaire engine
│ │ │ ├── qsort/ # Q-sort specific logic
│ │ │ ├── participants/ # Participant management
│ │ │ ├── analysis/ # Q methodology analysis
│ │ │ └── video-conferencing/ # Meet/Zoom integration
│ │ ├── common/ # 🆕 Shared infrastructure
│ │ │ ├── prisma.service.ts # Database service
│ │ │ ├── prisma-rls.service.ts # ✅ Row-Level Security
│ │ │ └── encryption.service.ts # ✅ AES-256-GCM encryption
│ │ └── types/ # 🆕 TypeScript definitions
│ │ ├── auth.types.ts
│ │ ├── upload.types.ts
│ │ └── study.types.ts
│ ├── prisma/ # Database schema & migrations
│ │ ├── schema.prisma # ✅ Enhanced schema with MediaFile
│ │ ├── migrations/ # ✅ Database migrations
│ │ └── dev.db # SQLite development database
│ └── postman/ # ✅ API testing collections
│ └── VQMethod.postman_collection.json
├── infrastructure/ # 🆕 DevOps & deployment
│ ├── docker-compose.yml # Production containers
│ ├── docker-compose.dev.yml # ✅ Development environment
│ └── kubernetes/ # K8s deployment configs
├── scripts/ # 🆕 Automation scripts
│ ├── port-manager.js # ✅ Port conflict resolution
│ └── start-safe.js # ✅ Safe startup with port detection
└── Lead/ # 🆕 Enhanced documentation
├── Complete_Product_Specification.md # ✅ Updated specs
├── Development_Implementation_Guide_Part1.md # This file
├── Development_Implementation_Guide_Part2.md
└── IMPLEMENTATION_PHASES.md # ✅ Updated phases

````

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
````

🔍 **TEST AFTER BUTTON COMPONENT IMPLEMENTATION:**

- [ ] Test all button variants render correctly
- [ ] Verify button states (hover, focus, active, disabled)
- [ ] Test loading state animation and accessibility
- [ ] Validate keyboard navigation and focus indicators
- [ ] Test button accessibility with screen readers
- [ ] Verify button works in all supported browsers

````

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
````

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
  'pre-screening',
  'welcome',
  'consent',
  'familiarization',
  'pre-sorting',
  'q-sort',
  'commentary',
  'post-survey',
  'thank-you',
];

// SECURITY: No localStorage persistence for participant data
// All sensitive data (demographics, consent, Q-sort data) stored server-side only
// Client stores only encrypted resume token for session recovery
export const useParticipantFlow = create<ParticipantFlowState>()(
  (set, get) => ({
    currentStep: 'pre-screening',
    completedSteps: [],
    studyToken: '',
    participantData: {}, // Never persisted locally - server-side only
    resumeToken: '', // Encrypted, server-validated resume token

    setCurrentStep: step => {
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
          timestamp: new Date().toISOString(),
        }),
        credentials: 'include', // Use HttpOnly cookies for session
      });

      if (response.ok) {
        const { encryptedResumeToken } = await response.json();
        set(state => ({
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
          timestamp: new Date().toISOString(),
        }),
        credentials: 'include',
      });
    },

    resetFlow: () => {
      // Clear all local state and invalidate server session
      fetch('/api/participant/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeToken: get().resumeToken }),
        credentials: 'include',
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
            timestamp: new Date().toISOString(),
          }),
          credentials: 'include',
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
      return currentIndex < PARTICIPANT_STEP_ORDER.length - 1
        ? PARTICIPANT_STEP_ORDER[currentIndex + 1]
        : null;
    },

    getPreviousStep: (): ParticipantStep | null => {
      const { currentStep } = get();
      const currentIndex = PARTICIPANT_STEP_ORDER.indexOf(currentStep);
      return currentIndex > 0 ? PARTICIPANT_STEP_ORDER[currentIndex - 1] : null;
    },
  })
);
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

---

# PART III: PHASE 5.5 - CRITICAL UI & USER EXPERIENCE EXCELLENCE

## 🎯 Production-Grade Authentication & User Interface Implementation

**Phase 5.5 Priority** - Bridging the gap between robust backend and user-facing interface

### Industry Best Practices Integration

- **Tableau**: Smart defaults, data intelligence, visual analytics
- **Qualtrics**: Academic credibility, research workflows, collaboration
- **Apple**: Human Interface Guidelines, glass morphism, micro-interactions
- **Netflix**: Personalization, engagement, continuous flow

---

## 4. Authentication UI System Implementation

### 4.1 Enhanced Login Page with Industry Standards

```typescript
// app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, TextField, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/apple-ui';
import { useAuthStore } from '@/lib/stores/auth-store';
import { MicrosoftIcon, GoogleIcon, OrcidIcon } from '@/components/icons';
import { EyeIcon, EyeSlashIcon, FaceSmileIcon } from '@heroicons/react/24/outline';

interface LoginPageProps {
  searchParams?: {
    redirect?: string;
    error?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const router = useRouter();
  const { login, loginWithProvider, checkBiometric } = useAuthStore();

  // Tableau-inspired smart defaults
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Qualtrics-inspired domain recognition
  const [suggestedSSO, setSuggestedSSO] = useState<string | null>(null);

  // Apple-inspired biometric authentication
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Check for biometric availability
    checkBiometric().then(setBiometricAvailable);

    // Domain detection for SSO suggestion
    if (email.includes('@')) {
      const domain = email.split('@')[1];
      if (domain.includes('.edu')) {
        setDetectedOrganization('Academic Institution');
        setSuggestedSSO(true);
      }
    }
  }, [email]);

  // Rotate loading messages (Netflix-style)
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      const redirect = searchParams?.redirect || '/dashboard';  // Note: Route groups don't appear in URLs
      router.push(redirect);
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'orcid') => {
    setIsLoading(true);
    try {
      await loginWithProvider(provider);
      router.push('/dashboard');  // Correct: no /researcher prefix
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-bg to-surface-secondary">
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
            <CardDescription className="text-text-secondary">
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <a href="/auth/forgot-password"
                     className="text-system-blue hover:underline text-xs">
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
                    className="rounded border-fill text-system-blue focus:ring-system-blue"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-text">Remember me</span>
                </label>

                {/* Face ID button (Apple-style) */}
                <button
                  type="button"
                  className="p-2 hover:bg-fill rounded-lg transition-colors"
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
          </form>

            {/* Social Login Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fill" />
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
              <a href="/auth/register"
                 className="text-system-blue hover:underline">
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

### 4.2 Multi-Step Registration with Personalization (Netflix-style)

```typescript
// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, TextField } from '@/components/apple-ui';
import { ProgressBar } from '@/components/apple-ui/ProgressBar';

const REGISTRATION_STEPS = [
  { id: 'account', title: 'Account Details' },
  { id: 'profile', title: 'Research Profile' },
  { id: 'preferences', title: 'Preferences' },
  { id: 'verification', title: 'Verification' }
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',

    // Step 2: Profile
    firstName: '',
    lastName: '',
    institution: '',
    role: 'researcher',
    discipline: '',

    // Step 3: Preferences
    researchInterests: [],
    collaborationOpen: true,
    emailNotifications: true,

    // Step 4: Terms
    termsAccepted: false,
    privacyAccepted: false
  });

  const progress = ((currentStep + 1) / REGISTRATION_STEPS.length) * 100;

  // Tableau-inspired password strength indicator
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password) && /[^a-zA-Z\d]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

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
            <h2 className="text-2xl font-bold text-label">Create your account</h2>
            <p className="text-secondary-label">Join the research community</p>

            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="researcher@university.edu"
              required
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

              {/* Password Strength Indicator (Tableau-style) */}
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-secondary-label">Password strength</span>
                  <span className="text-xs text-secondary-label">{passwordStrength}%</span>
                </div>
                <div className="h-2 bg-quaternary-fill rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength < 50 ? 'bg-system-red' :
                      passwordStrength < 75 ? 'bg-system-orange' :
                      'bg-system-green'
                    }`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            </div>

            <TextField
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              required
              error={formData.confirmPassword && formData.password !== formData.confirmPassword ?
                'Passwords do not match' : undefined}
            />
          </motion.div>
        );

      case 1: // Research Profile (Qualtrics-inspired)
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-label">Tell us about your research</h2>
            <p className="text-secondary-label">Help us personalize your experience</p>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />

              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <TextField
              label="Institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="University or Organization"
              required
            />

            {/* Research Discipline Selection (Visual) */}
            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Research Discipline
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Psychology', 'Sociology', 'Education', 'Health Sciences', 'Business', 'Other'].map(discipline => (
                  <button
                    key={discipline}
                    type="button"
                    onClick={() => setFormData({ ...formData, discipline })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.discipline === discipline
                        ? 'border-system-blue bg-system-blue/10'
                        : 'border-quaternary-fill hover:border-tertiary-fill'
                    }`}
                  >
                    <span className="text-sm">{discipline}</span>
                  </button>
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
            <h2 className="text-2xl font-bold text-label">Customize your experience</h2>
            <p className="text-secondary-label">We'll use this to recommend relevant features</p>

            {/* Research Interests (Tag selection) */}
            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Research Interests (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Qualitative Research', 'Mixed Methods', 'Survey Design', 'Data Visualization',
                  'Collaborative Studies', 'Longitudinal Studies', 'Cross-Cultural Research'].map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      const interests = formData.researchInterests.includes(interest)
                        ? formData.researchInterests.filter(i => i !== interest)
                        : [...formData.researchInterests, interest];
                      setFormData({ ...formData, researchInterests: interests });
                    }}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      formData.researchInterests.includes(interest)
                        ? 'bg-system-blue text-white'
                        : 'bg-quaternary-fill text-label hover:bg-tertiary-fill'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Preference Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-quaternary-fill/50 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium text-label">Open to Collaboration</div>
                  <div className="text-xs text-secondary-label">Other researchers can invite you to studies</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.collaborationOpen}
                  onChange={(e) => setFormData({ ...formData, collaborationOpen: e.target.checked })}
                  className="rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-quaternary-fill/50 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium text-label">Email Notifications</div>
                  <div className="text-xs text-secondary-label">Receive updates about your studies</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  className="rounded"
                />
              </label>
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
            <h2 className="text-2xl font-bold text-label">Almost done!</h2>
            <p className="text-secondary-label">Review and accept our terms</p>

            {/* Terms Summary (Apple-style) */}
            <div className="space-y-3">
              <div className="p-4 bg-quaternary-fill/50 rounded-lg">
                <h3 className="font-medium text-label mb-2">Key Points:</h3>
                <ul className="space-y-1 text-sm text-secondary-label">
                  <li>• Your data is encrypted and secure</li>
                  <li>• You own all your research data</li>
                  <li>• We never share data without permission</li>
                  <li>• You can delete your account anytime</li>
                </ul>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="rounded mt-1"
                  required
                />
                <span className="text-sm text-label">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-system-blue hover:underline">
                    Terms of Service
                  </a>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyAccepted}
                  onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                  className="rounded mt-1"
                  required
                />
                <span className="text-sm text-label">
                  I agree to the{' '}
                  <a href="/privacy" target="_blank" className="text-system-blue hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* What happens next */}
            <div className="p-4 bg-system-blue/10 rounded-lg border border-system-blue/20">
              <h3 className="font-medium text-system-blue mb-1">What happens next?</h3>
              <p className="text-sm text-system-blue/80">
                We'll send a verification email to {formData.email}. Click the link to activate your account.
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-system-background via-secondary-background to-system-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="auth-container backdrop-blur-xl bg-white/70 dark:bg-black/70 rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Progress Bar (Netflix-style) */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {REGISTRATION_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`text-xs ${
                    index <= currentStep ? 'text-label' : 'text-tertiary-label'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                    index <= currentStep ? 'bg-system-blue' : 'bg-quaternary-fill'
                  }`} />
                  {step.title}
                </div>
              ))}
            </div>
            <ProgressBar value={progress} />
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
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
                  console.log('Submitting registration:', formData);
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
            >
              {currentStep === REGISTRATION_STEPS.length - 1 ? 'Create Account' : 'Continue'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
```

---

## Continuation

This guide continues in Part 3 with:

- Authentication State Management (Zustand)
- Protected Routes Implementation
- Essential Pages Implementation
- Navigation Enhancement
- CSS Enhancements
- Testing Requirements

See: [Development_Implementation_Guide_Part3.md](./Development_Implementation_Guide_Part3.md)
