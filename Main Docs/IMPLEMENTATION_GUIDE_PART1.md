# VQMethod Implementation Guide - Part 1

## Phases 1-3.5: Foundation & Core Architecture

**Updated:** September 2025 - World-Class Organization with Perfect Alignment  
**Phase Tracker:** [PHASE_TRACKER_PART1.md](./PHASE_TRACKER_PART1.md) - Checkboxes only  
**Next Part:** [IMPLEMENTATION_GUIDE_PART2.md](./IMPLEMENTATION_GUIDE_PART2.md) - Phases 4-5.5  
**Document Rule**: Maximum 20,000 tokens per document. Content continues in sequentially numbered parts.

### Phase Coverage
- **Phase 1:** Foundation & Design System
- **Phase 2:** Authentication & Core Backend  
- **Phase 3:** Dual Interface Architecture
- **Phase 3.5:** Critical Infrastructure & Testing

### ⚠️ CRITICAL UPDATE: Daily Error Management
All phases now require daily error checks at 5 PM:
```bash
#!/bin/bash
ERROR_COUNT=$(npm run typecheck 2>&1 | grep -c "error TS")
BASELINE=47  # From Phase 6.94
if [ $ERROR_COUNT -gt $BASELINE ]; then
    echo "❌ BLOCKING: Fix errors before tomorrow"
    exit 1
fi
```

---

# PHASE 1: FOUNDATION & DESIGN SYSTEM

**Duration:** 3-5 days  
**Status:** ✅ COMPLETE (100%)

## 1.1 Project Setup

### Initial Configuration

```bash
# Create monorepo structure
mkdir vqmethod && cd vqmethod
npm init -y

# Initialize workspaces
cat > package.json << 'EOF'
{
  "name": "vqmethod",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "npm -w frontend run dev",
    "dev:backend": "npm -w backend run dev",
    "dev:safe": "node scripts/start-safe.js",
    "build": "npm run build:frontend && npm run build:backend",
    "test": "npm run test:frontend && npm run test:backend",
    "typecheck": "npm run typecheck:frontend && npm run typecheck:backend"
  }
}
EOF
```

### Frontend Setup (Next.js 15+)

```bash
# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend

# Install essential dependencies
npm install @headlessui/react @heroicons/react class-variance-authority clsx tailwind-merge framer-motion zustand @tanstack/react-query react-hook-form zod @hookform/resolvers

# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @vitejs/plugin-react jsdom @axe-core/react
```

### Backend Setup (NestJS)

```bash
# Create NestJS application
cd ../
npx @nestjs/cli new backend --package-manager npm

cd backend
# Install core dependencies
npm install @nestjs/swagger @nestjs/throttler @nestjs/jwt @nestjs/passport @prisma/client prisma passport-jwt bcryptjs helmet compression class-transformer class-validator

# Install security dependencies
npm install speakeasy qrcode clamav.js multer @types/multer
```

## 1.2 Apple Design System Implementation

### Design Tokens Setup

```css
/* frontend/styles/tokens.css */
:root {
  /* Typography */
  --font-family-display:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  --font-family-text:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

  /* Typography Scale */
  --text-large-title: 34px;
  --text-title-1: 28px;
  --text-title-2: 22px;
  --text-title-3: 20px;
  --text-headline: 17px;
  --text-body: 17px;
  --text-callout: 16px;
  --text-subhead: 15px;
  --text-footnote: 13px;
  --text-caption-1: 12px;
  --text-caption-2: 11px;

  /* Colors - Light/Dark Mode Support */
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

  /* System Colors */
  --color-system-blue: light-dark(rgba(0, 122, 255, 1), rgba(10, 132, 255, 1));
  --color-system-green: light-dark(rgba(52, 199, 89, 1), rgba(48, 209, 88, 1));
  --color-system-red: light-dark(rgba(255, 59, 48, 1), rgba(255, 69, 58, 1));

  /* RGB Values for Tailwind */
  --color-system-blue-rgb: 0 122 255;
  --color-system-green-rgb: 52 199 89;
  --color-system-red-rgb: 255 59 48;

  /* Spacing (8pt Grid) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-xxxl: 64px;

  /* Animation */
  --ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
}
```

### Tailwind Configuration

```javascript
// frontend/tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'apple-system': ['var(--font-family-display)'],
        display: ['var(--font-family-display)'],
        text: ['var(--font-family-text)'],
      },
      colors: {
        'system-blue': 'rgb(var(--color-system-blue-rgb) / <alpha-value>)',
        'system-green': 'rgb(var(--color-system-green-rgb) / <alpha-value>)',
        'system-red': 'rgb(var(--color-system-red-rgb) / <alpha-value>)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

## 1.3 Core UI Components

### Button Component

```typescript
// frontend/components/apple-ui/Button/Button.tsx
'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-system-blue text-white hover:bg-blue-600 active:bg-blue-700",
        secondary: "bg-quaternary-fill text-label hover:bg-tertiary-fill",
        destructive: "bg-system-red text-white hover:bg-red-600",
        ghost: "text-system-blue hover:bg-quaternary-fill",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-13 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button, buttonVariants };
```

### Additional Components Required

- TextField with floating labels
- Card with glass morphism
- Badge for status indicators
- ProgressBar for loading states
- ThemeToggle for dark mode

## 1.4 Testing Infrastructure

### Vitest Configuration

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/', 'test/'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Component Test Example

```typescript
// frontend/components/apple-ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## 🔍 Testing Checkpoint 1.1

- [ ] All components render without errors
- [ ] Light/dark mode switching works
- [ ] Animations run at 60fps
- [ ] WCAG AA compliance achieved
- [ ] Coverage ≥90% for apple-ui components

---

# PHASE 2: AUTHENTICATION & CORE BACKEND

**Duration:** 4-6 days  
**Status:** ✅ COMPLETE (100%)

## 2.1 Database Setup

### Prisma Schema

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  password         String
  firstName        String?
  lastName         String?
  role             Role      @default(RESEARCHER)
  totpSecret       String?
  totpEnabled      Boolean   @default(false)
  backupCodes      String[]
  emailVerified    Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  studies          Study[]
  responses        Response[]
  sessions         Session[]
  auditLogs        AuditLog[]
}

model Study {
  id               String    @id @default(cuid())
  title            String
  description      String?
  researcherId     String
  inviteCode       String    @unique
  status           StudyStatus @default(DRAFT)
  configuration    Json
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  researcher       User      @relation(fields: [researcherId], references: [id])
  participants     Participant[]
  responses        Response[]
}

model Response {
  id               String    @id @default(cuid())
  studyId          String
  participantId    String
  userId           String?
  qSortData        Json
  surveyData       Json?
  completedAt      DateTime?

  study            Study     @relation(fields: [studyId], references: [id])
  user             User?     @relation(fields: [userId], references: [id])
}

enum Role {
  ADMIN
  RESEARCHER
  PARTICIPANT
}

enum StudyStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

## 2.2 Authentication Implementation

### JWT Strategy

```typescript
// backend/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Auth Service

```typescript
// backend/src/modules/auth/services/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
```

## 2.3 Two-Factor Authentication

### TOTP Service

```typescript
// backend/src/modules/auth/services/two-factor.service.ts
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  async generateSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const secret = speakeasy.generateSecret({
      name: `VQMethod (${user.email})`,
      issuer: 'VQMethod',
      length: 32,
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `VQMethod:${user.email}`,
      issuer: 'VQMethod',
      encoding: 'base32',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store encrypted secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: this.encrypt(secret.base32),
        totpEnabled: false,
      },
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes: this.generateBackupCodes(),
    };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.totpSecret) return false;

    return speakeasy.totp.verify({
      secret: this.decrypt(user.totpSecret),
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }

  private encrypt(text: string): string {
    // Implement AES-256-GCM encryption
    return text; // Placeholder
  }

  private decrypt(text: string): string {
    // Implement AES-256-GCM decryption
    return text; // Placeholder
  }
}
```

## 2.4 Security Hardening

### Rate Limiting Configuration

```typescript
// backend/src/modules/rate-limiting/rate-limiting.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 attempts
      },
      {
        name: 'api',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
      {
        name: 'upload',
        ttl: 3600000, // 1 hour
        limit: 10, // 10 uploads
      },
    ]),
  ],
})
export class RateLimitingModule {}
```

### File Security Service

```typescript
// backend/src/modules/file-upload/services/virus-scan.service.ts
import { Injectable } from '@nestjs/common';
import * as ClamAV from 'clamav.js';

@Injectable()
export class VirusScanService {
  private scanner: any;

  constructor() {
    this.scanner = new ClamAV.Scanner({
      host: process.env.CLAMAV_HOST || 'localhost',
      port: process.env.CLAMAV_PORT || 3310,
    });
  }

  async scanFile(
    filePath: string
  ): Promise<{ isClean: boolean; virus?: string }> {
    try {
      const result = await this.scanner.scanFile(filePath);
      return {
        isClean: result.isInfected === false,
        virus: result.viruses?.[0],
      };
    } catch (error) {
      console.error('Virus scan failed:', error);
      return { isClean: false, virus: 'SCAN_ERROR' };
    }
  }
}
```

## 🔍 Testing Checkpoint 2.1

- [ ] User registration and login work
- [ ] JWT tokens generate and validate
- [ ] 2FA setup and verification work
- [ ] Rate limiting blocks excessive attempts
- [ ] File uploads are scanned for viruses
- [ ] Database migrations run successfully

---

# PHASE 3: DUAL INTERFACE ARCHITECTURE

**Duration:** 5-7 days  
**Status:** ✅ COMPLETE (100%)  
**Reference:** [RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md](./RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md)

## 3.1 Double Toolbar Navigation System

### Primary Research Toolbar Component

```typescript
// frontend/components/navigation/ResearchToolbar.tsx
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  BookOpenIcon, LightBulbIcon, WrenchIcon, UsersIcon,
  PlayIcon, ChartBarIcon, DocumentTextIcon, ShareIcon 
} from '@heroicons/react/24/outline';

const RESEARCH_PHASES = [
  {
    id: 'discover',
    label: 'DISCOVER',
    icon: BookOpenIcon,
    color: 'purple',
    description: 'Literature review & research foundation',
    path: '/discover'
  },
  {
    id: 'design',
    label: 'DESIGN',
    icon: LightBulbIcon,
    color: 'yellow',
    description: 'Formulate questions & methodology',
    path: '/design'
  },
  {
    id: 'build',
    label: 'BUILD',
    icon: WrenchIcon,
    color: 'blue',
    description: 'Create study instruments',
    path: '/studies/create'
  },
  {
    id: 'recruit',
    label: 'RECRUIT',
    icon: UsersIcon,
    color: 'green',
    description: 'Find & manage participants',
    path: '/recruit'
  },
  {
    id: 'collect',
    label: 'COLLECT',
    icon: PlayIcon,
    color: 'orange',
    description: 'Gather research data',
    path: '/studies'
  },
  {
    id: 'analyze',
    label: 'ANALYZE',
    icon: ChartBarIcon,
    color: 'indigo',
    description: 'Process & examine data',
    path: '/analysis'
  },
  {
    id: 'report',
    label: 'REPORT',
    icon: DocumentTextIcon,
    color: 'rose',
    description: 'Document findings',
    path: '/reports'
  },
  {
    id: 'share',
    label: 'SHARE',
    icon: ShareIcon,
    color: 'teal',
    description: 'Publish & collaborate',
    path: '/share'
  }
];

export function ResearchToolbar() {
  const pathname = usePathname();
  const [activePhase, setActivePhase] = useState(() => 
    RESEARCH_PHASES.find(p => pathname.startsWith(p.path))?.id || 'build'
  );

  return (
    <div className="border-b bg-white/80 backdrop-blur-xl sticky top-16 z-30">
      <div className="flex items-center justify-between px-4 h-12">
        {RESEARCH_PHASES.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setActivePhase(phase.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all
              ${activePhase === phase.id 
                ? `bg-${phase.color}-100 text-${phase.color}-700 font-semibold` 
                : 'hover:bg-gray-100 text-gray-600'}
            `}
          >
            <phase.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{phase.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Secondary Contextual Toolbar

```typescript
// frontend/components/navigation/SecondaryToolbar.tsx
import { useResearchPhase } from '@/hooks/useResearchPhase';

const PHASE_TOOLS = {
  discover: [
    { label: 'Literature Search', path: '/discover/search' },
    { label: 'Reference Manager', path: '/discover/references' },
    { label: 'Knowledge Map', path: '/discover/map' },
    { label: 'Research Gaps', path: '/discover/gaps' }
  ],
  design: [
    { label: 'Research Questions', path: '/design/questions' },
    { label: 'Hypothesis Builder', path: '/design/hypothesis' },
    { label: 'Methodology', path: '/design/methodology' },
    { label: 'Study Protocol', path: '/design/protocol' }
  ],
  build: [
    { label: 'Study Setup', path: '/studies/create' },
    { label: 'Q-Grid Designer', path: '/studies/create/grid' },
    { label: 'Statement Generator', path: '/ai-tools' },
    { label: 'Questionnaires', path: '/studies/create/questionnaire' }
  ],
  // ... other phases
};

export function SecondaryToolbar() {
  const { activePhase } = useResearchPhase();
  const tools = PHASE_TOOLS[activePhase] || [];

  return (
    <div className="bg-gray-50 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            href={tool.path}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded-md transition-colors"
          >
            {tool.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## 3.2 Research Phase Integration

### Phase-Aware Layout

```typescript
// frontend/app/(researcher)/layout.tsx
import { ResearchToolbar } from '@/components/navigation/ResearchToolbar';
import { SecondaryToolbar } from '@/components/navigation/SecondaryToolbar';
import { ResearchPhaseProvider } from '@/providers/ResearchPhaseProvider';

export default function ResearcherLayout({ children }) {
  return (
    <ResearchPhaseProvider>
      <div className="min-h-screen">
        <ResearchToolbar />
        <SecondaryToolbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </ResearchPhaseProvider>
  );
}
```

### Phase Context Provider

```typescript
// frontend/providers/ResearchPhaseProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ResearchPhaseContext = createContext({
  activePhase: 'build',
  setActivePhase: (phase: string) => {},
  phaseProgress: {},
  updateProgress: (phase: string, progress: number) => {}
});

export function ResearchPhaseProvider({ children }) {
  const pathname = usePathname();
  const [activePhase, setActivePhase] = useState('build');
  const [phaseProgress, setPhaseProgress] = useState({});

  useEffect(() => {
    // Auto-detect phase from URL
    const phase = detectPhaseFromPath(pathname);
    if (phase) setActivePhase(phase);
  }, [pathname]);

  const updateProgress = (phase: string, progress: number) => {
    setPhaseProgress(prev => ({ ...prev, [phase]: progress }));
  };

  return (
    <ResearchPhaseContext.Provider value={{
      activePhase,
      setActivePhase,
      phaseProgress,
      updateProgress
    }}>
      {children}
    </ResearchPhaseContext.Provider>
  );
}

export const useResearchPhase = () => useContext(ResearchPhaseContext);
```

## 3.3 Phase-Specific Landing Pages

### Build Phase Hub

```typescript
// frontend/app/(researcher)/build/page.tsx
export default function BuildPhaseHub() {
  const router = useRouter();
  const { studies } = useStudies();

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Build Your Study</h1>
        <p className="text-blue-100">Create and configure your Q-methodology study</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="New Study"
          icon={PlusIcon}
          onClick={() => router.push('/studies/create')}
        >
          Start from scratch or use a template
        </Card>
        
        <Card 
          title="AI Statement Generator"
          icon={SparklesIcon}
          onClick={() => router.push('/ai-tools')}
        >
          Generate Q-sort statements with AI
        </Card>

        <Card 
          title="Grid Designer"
          icon={GridIcon}
          onClick={() => router.push('/studies/create/grid')}
        >
          Configure your Q-sort grid
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Studies</h2>
        <StudiesList studies={studies.slice(0, 5)} />
      </div>
    </div>
  );
}
```

## 3.4 Phase Transition Animations

```typescript
// frontend/components/navigation/PhaseTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useResearchPhase } from '@/hooks/useResearchPhase';

export function PhaseTransition({ children }) {
  const { activePhase } = useResearchPhase();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePhase}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## 3.5 Testing

```typescript
// frontend/test/navigation/research-lifecycle.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchToolbar } from '@/components/navigation/ResearchToolbar';

describe('Research Lifecycle Navigation', () => {
  it('highlights active phase based on current route', () => {
    render(<ResearchToolbar />, {
      wrapper: ({ children }) => (
        <RouterContext.Provider value={{ pathname: '/studies/create' }}>
          {children}
        </RouterContext.Provider>
      )
    });

    const buildButton = screen.getByText('BUILD');
    expect(buildButton.parentElement).toHaveClass('bg-blue-100');
  });

  it('shows correct secondary tools for each phase', () => {
    render(<SecondaryToolbar activePhase="build" />);
    
    expect(screen.getByText('Study Setup')).toBeInTheDocument();
    expect(screen.getByText('Q-Grid Designer')).toBeInTheDocument();
    expect(screen.getByText('Statement Generator')).toBeInTheDocument();
  });
});
```

---

# PHASE 3.5: CRITICAL INFRASTRUCTURE & TESTING FOUNDATION

**Duration:** 3-4 days  
**Status:** ✅ COMPLETE (100%)  
**Priority:** CRITICAL - Foundation for all future features

## 3.5.1 TypeScript Configuration

### Strict Mode Setup

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  }
}
```

## 3.5.2 Testing Infrastructure

### Playwright E2E Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### React Testing Library

```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

## 3.5.3 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
```

## 3.5.4 Performance Monitoring

### Web Vitals Tracking

```typescript
// lib/performance.ts
export function reportWebVitals(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
  
  // Send to analytics endpoint
  navigator.sendBeacon('/api/analytics', body);
}
```

## 3.5.5 Error Tracking

### Sentry Integration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

## Testing Checkpoint 3.5

- [ ] TypeScript strict mode enabled with 0 errors
- [ ] All unit tests passing (>90% coverage)
- [ ] E2E tests cover critical paths
- [ ] CI/CD pipeline runs successfully
- [ ] Performance monitoring active
- [ ] Error tracking configured

---

## PHASE 3 CONTINUATION: Route Structure

### Next.js App Router Organization

```
frontend/app/
├── (researcher)/          # Researcher route group
│   ├── dashboard/
│   │   └── page.tsx      # /dashboard
│   ├── studies/
│   │   ├── page.tsx      # /studies
│   │   ├── create/
│   │   │   └── page.tsx  # /studies/create
│   │   └── [id]/
│   │       ├── page.tsx  # /studies/:id
│   │       ├── design/
│   │       ├── participants/
│   │       └── analysis/
│   └── layout.tsx       # Researcher layout
├── (participant)/        # Participant route group
│   ├── join/
│   │   └── page.tsx     # /join
│   ├── study/
│   │   └── [token]/
│   │       ├── welcome/
│   │       ├── consent/
│   │       ├── familiarization/
│   │       ├── pre-sort/
│   │       ├── q-sort/
│   │       ├── commentary/
│   │       └── thank-you/
│   └── layout.tsx      # Participant layout
├── auth/               # Auth pages (no route group)
│   ├── login/
│   └── register/
└── layout.tsx         # Root layout
```

## 3.2 Researcher Dashboard

### Dashboard Page

```typescript
// frontend/app/(researcher)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { StudyCard } from '@/components/researcher/StudyCard';
import { MetricsOverview } from '@/components/researcher/MetricsOverview';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [studies, setStudies] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const [studiesRes, metricsRes] = await Promise.all([
      fetch('/api/studies'),
      fetch('/api/dashboard/metrics'),
    ]);

    setStudies(await studiesRes.json());
    setMetrics(await metricsRes.json());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-label">
          Welcome back, {user?.firstName || 'Researcher'}
        </h1>
        <p className="text-secondary-label mt-2">
          Here's an overview of your research activities
        </p>
      </div>

      <MetricsOverview metrics={metrics} />

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-label">Your Studies</h2>
          <Button href="/studies/create">Create New Study</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studies.map(study => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Study Builder Component

```typescript
// frontend/components/researcher/StudyBuilder/StudyBuilder.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/apple-ui/Button';
import { TextField } from '@/components/apple-ui/TextField';
import { GridDesigner } from './GridDesigner';
import { StimuliManager } from './StimuliManager';
import { QuestionBuilder } from './QuestionBuilder';

const studySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  configuration: z.object({
    gridDistribution: z.array(z.number()),
    statements: z.array(z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(['text', 'image']),
    })),
    preQuestions: z.array(z.any()),
    postQuestions: z.array(z.any()),
  }),
});

export function StudyBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const { register, handleSubmit, watch, setValue } = useForm({
    resolver: zodResolver(studySchema),
  });

  const steps = [
    { id: 'basics', title: 'Basic Information' },
    { id: 'grid', title: 'Grid Design' },
    { id: 'stimuli', title: 'Stimuli' },
    { id: 'questions', title: 'Questions' },
    { id: 'review', title: 'Review' },
  ];

  const onSubmit = async (data) => {
    const response = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const study = await response.json();
      window.location.href = `/studies/${study.id}`;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                index <= currentStep ? 'text-system-blue' : 'text-tertiary-label'
              }`}
            >
              <div className="mb-2">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                  index <= currentStep ? 'bg-system-blue text-white' : 'bg-quaternary-fill'
                }`}>
                  {index + 1}
                </span>
              </div>
              <span className="text-sm">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <TextField
            label="Study Title"
            {...register('title')}
            placeholder="Enter your study title"
          />
          <TextField
            label="Description"
            {...register('description')}
            placeholder="Describe your study (optional)"
            multiline
            rows={4}
          />
        </div>
      )}

      {currentStep === 1 && (
        <GridDesigner
          onChange={(distribution) => setValue('configuration.gridDistribution', distribution)}
        />
      )}

      {currentStep === 2 && (
        <StimuliManager
          onChange={(statements) => setValue('configuration.statements', statements)}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
          </Button>
        ) : (
          <Button type="submit">Create Study</Button>
        )}
      </div>
    </form>
  );
}
```

## 3.3 Participant Journey

### Participant Flow Hook

```typescript
// frontend/lib/hooks/useParticipantFlow.ts
import { create } from 'zustand';

type Step =
  | 'welcome'
  | 'consent'
  | 'familiarization'
  | 'pre-sort'
  | 'q-sort'
  | 'commentary'
  | 'post-survey'
  | 'thank-you';

interface ParticipantFlowState {
  studyToken: string;
  currentStep: Step;
  completedSteps: Step[];
  participantData: {
    consent?: boolean;
    demographics?: Record<string, any>;
    preSortData?: Record<string, any>;
    qSortData?: Record<string, number>;
    commentary?: Record<string, string>;
    surveyData?: Record<string, any>;
  };

  setStep: (step: Step) => void;
  completeStep: (step: Step, data?: any) => void;
  saveProgress: () => Promise<void>;
  getProgress: () => number;
}

const STEP_ORDER: Step[] = [
  'welcome',
  'consent',
  'familiarization',
  'pre-sort',
  'q-sort',
  'commentary',
  'post-survey',
  'thank-you',
];

export const useParticipantFlow = create<ParticipantFlowState>((set, get) => ({
  studyToken: '',
  currentStep: 'welcome',
  completedSteps: [],
  participantData: {},

  setStep: step => {
    set({ currentStep: step });
    get().saveProgress();
  },

  completeStep: async (step, data) => {
    const state = get();

    // Save data to server immediately
    await fetch('/api/participant/save-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studyToken: state.studyToken,
        step,
        data,
      }),
    });

    set(state => ({
      completedSteps: [...state.completedSteps, step],
      participantData: {
        ...state.participantData,
        [step]: data,
      },
    }));

    // Auto-advance to next step
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1] });
    }
  },

  saveProgress: async () => {
    const state = get();
    await fetch('/api/participant/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studyToken: state.studyToken,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
      }),
    });
  },

  getProgress: () => {
    const { completedSteps } = get();
    return (completedSteps.length / STEP_ORDER.length) * 100;
  },
}));
```

### Q-Sort Grid Component

```typescript
// frontend/components/participant/QSortGrid/QSortGrid.tsx
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { SortableStatement } from './SortableStatement';
import { DroppableCell } from './DroppableCell';

interface QSortGridProps {
  distribution: number[]; // e.g., [1, 2, 3, 4, 3, 2, 1]
  statements: Statement[];
  onComplete: (placements: Record<string, string>) => void;
}

export function QSortGrid({ distribution, statements, onComplete }: QSortGridProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    setPlacements(prev => {
      const newPlacements = { ...prev };

      // Remove from previous position if exists
      Object.keys(newPlacements).forEach(key => {
        if (newPlacements[key] === active.id) {
          delete newPlacements[key];
        }
      });

      // Add to new position
      newPlacements[over.id as string] = active.id as string;

      return newPlacements;
    });

    setActiveId(null);
  };

  const isComplete = Object.keys(placements).length === statements.length;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        {/* Q-Sort Grid */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-center gap-2">
            {distribution.map((count, columnIndex) => {
              const columnValue = columnIndex - Math.floor(distribution.length / 2);

              return (
                <div key={columnIndex} className="flex flex-col items-center">
                  <div className="text-sm font-medium text-secondary-label mb-2">
                    {columnValue > 0 ? `+${columnValue}` : columnValue}
                  </div>
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: count }).map((_, rowIndex) => {
                      const cellId = `${columnIndex}-${rowIndex}`;
                      const statementId = placements[cellId];

                      return (
                        <DroppableCell
                          key={cellId}
                          id={cellId}
                          statement={statements.find(s => s.id === statementId)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statement Bank */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Statements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statements
              .filter(s => !Object.values(placements).includes(s.id))
              .map(statement => (
                <SortableStatement key={statement.id} statement={statement} />
              ))}
          </div>
        </div>

        {/* Complete Button */}
        {isComplete && (
          <div className="text-center">
            <Button size="lg" onClick={() => onComplete(placements)}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </DndContext>
  );
}
```

## 🔍 Testing Checkpoint 3.1

- [ ] Researcher can create and manage studies
- [ ] Q-sort grid drag-and-drop works smoothly
- [ ] Participant journey flows correctly
- [ ] Data saves at each step
- [ ] Progress tracking is accurate
- [ ] Mobile responsiveness verified

---

# Summary

This Part 1 covers:

- **Phase 1**: Foundation setup with Apple Design System
- **Phase 2**: Authentication and security implementation
- **Phase 3**: Dual interface architecture for researchers and participants
- **Phase 3.5**: Critical infrastructure and testing foundation

Continue to **IMPLEMENTATION_GUIDE_PART2.md** for Phases 4-5.5.

**Document Size**: ~19,500 tokens
