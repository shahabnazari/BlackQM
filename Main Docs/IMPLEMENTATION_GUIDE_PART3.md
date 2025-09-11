# VQMethod Implementation Guide - Part 3

## Phases 6.5-6.85: Frontend Architecture through UI Polish

**Document Rule**: Maximum 20,000 tokens per document. Content continues in sequentially numbered parts.  
**Previous Part**: [IMPLEMENTATION_GUIDE_PART2.md](./IMPLEMENTATION_GUIDE_PART2.md) - Phases 4-6  
**Next Part**: [IMPLEMENTATION_GUIDE_PART4.md](./IMPLEMENTATION_GUIDE_PART4.md) - Phases 6.86-10

---

# PHASE 6.5: FRONTEND ARCHITECTURE & Q-ANALYTICS UI

**Duration:** 4-5 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** Complete frontend architecture with Q-Analytics UI

## 6.5.1 Enhanced Route Architecture

### Route Group Structure

```
frontend/app/
├── (auth)/                    # Authentication routes
│   ├── login/
│   ├── register/
│   └── layout.tsx            # Minimal auth layout
├── (researcher)/             # Researcher interface
│   ├── dashboard/
│   │   └── page.tsx
│   ├── studies/
│   │   ├── page.tsx         # Studies list
│   │   ├── create/
│   │   │   └── page.tsx     # Study creation wizard
│   │   └── [id]/
│   │       ├── page.tsx     # Study overview
│   │       ├── design/      # Study design tools
│   │       ├── participants/# Participant management
│   │       ├── analysis/    # Q-methodology analysis
│   │       └── export/      # Data export
│   └── layout.tsx          # Researcher layout with sidebar
├── (participant)/          # Participant interface
│   ├── join/
│   │   └── page.tsx       # Join study page
│   ├── study/[token]/
│   │   ├── welcome/
│   │   ├── consent/
│   │   ├── familiarization/
│   │   ├── pre-sort/
│   │   ├── q-sort/
│   │   ├── commentary/
│   │   ├── post-survey/
│   │   └── thank-you/
│   └── layout.tsx        # Participant layout
└── layout.tsx           # Root layout
```

### Unified Navigation Component

```typescript
// frontend/components/navigation/UnifiedNavigation.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/apple-ui/Button';
import { useAuthStore } from '@/lib/stores/auth-store';

const researcherNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/studies', label: 'Studies', icon: StudyIcon },
  { href: '/analytics', label: 'Analytics', icon: ChartIcon },
  { href: '/participants', label: 'Participants', icon: UsersIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

const participantNavItems = [
  { href: '/my-studies', label: 'My Studies', icon: StudyIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
];

export function UnifiedNavigation() {
  const pathname = usePathname();
  const { user, role } = useAuthStore();

  // Determine navigation context
  const isResearcherRoute = pathname.startsWith('/dashboard') ||
                           pathname.startsWith('/studies') ||
                           pathname.startsWith('/analytics');
  const isParticipantRoute = pathname.startsWith('/join') ||
                            pathname.startsWith('/study');

  const navItems = isResearcherRoute ? researcherNavItems :
                   isParticipantRoute ? participantNavItems : [];

  if (navItems.length === 0) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-4 border-b">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-system-blue">VQMethod</span>
            </Link>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                             pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-system-blue/10 text-system-blue"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <UserMenu user={user} />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
                           pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 text-xs",
                  isActive ? "text-system-blue" : "text-gray-600"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
```

## 6.5.2 Q-Analytics UI Components

### Analytics Dashboard Layout

```typescript
// frontend/app/(researcher)/analytics/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MetricsOverview } from '@/components/analytics/MetricsOverview';
import { CorrelationAnalysis } from '@/components/analytics/CorrelationAnalysis';
import { FactorAnalysis } from '@/components/analytics/FactorAnalysis';
import { ParticipantInsights } from '@/components/analytics/ParticipantInsights';
import { ExportCenter } from '@/components/analytics/ExportCenter';

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-label">Analytics Dashboard</h1>
        <p className="text-secondary-label mt-2">
          Comprehensive Q-methodology analysis and insights
        </p>
      </div>

      <MetricsOverview />

      <Tabs defaultValue="correlation" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="factors">Factor Analysis</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="correlation" className="mt-6">
          <CorrelationAnalysis />
        </TabsContent>

        <TabsContent value="factors" className="mt-6">
          <FactorAnalysis />
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <ParticipantInsights />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <ExportCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Interactive Factor Analysis Component

```typescript
// frontend/components/analytics/FactorAnalysis.tsx
import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Select } from '@/components/apple-ui/Select';
import { ScreePlot } from './visualizations/ScreePlot';
import { FactorLoadingPlot } from './visualizations/FactorLoadingPlot';
import { FactorRotationControls } from './FactorRotationControls';

export function FactorAnalysis() {
  const [extractionMethod, setExtractionMethod] = useState('pca');
  const [rotationMethod, setRotationMethod] = useState('varimax');
  const [numberOfFactors, setNumberOfFactors] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const runFactorAnalysis = async () => {
    const response = await fetch('/api/analysis/factors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extractionMethod,
        rotationMethod,
        numberOfFactors,
      }),
    });

    const results = await response.json();
    setAnalysisResults(results);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Factor Analysis Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Extraction Method"
            value={extractionMethod}
            onChange={setExtractionMethod}
            options={[
              { value: 'pca', label: 'Principal Component Analysis' },
              { value: 'centroid', label: 'Centroid Method' },
              { value: 'pal', label: 'Principal Axis' },
            ]}
          />

          <Select
            label="Rotation Method"
            value={rotationMethod}
            onChange={setRotationMethod}
            options={[
              { value: 'varimax', label: 'Varimax' },
              { value: 'quartimax', label: 'Quartimax' },
              { value: 'equamax', label: 'Equamax' },
              { value: 'none', label: 'No Rotation' },
            ]}
          />

          <Select
            label="Number of Factors"
            value={numberOfFactors}
            onChange={setNumberOfFactors}
            options={[
              { value: 'auto', label: 'Auto (Kaiser)' },
              { value: '2', label: '2 Factors' },
              { value: '3', label: '3 Factors' },
              { value: '4', label: '4 Factors' },
              { value: '5', label: '5 Factors' },
            ]}
          />
        </div>

        <Button
          className="mt-4"
          onClick={runFactorAnalysis}
        >
          Run Analysis
        </Button>
      </Card>

      {analysisResults && (
        <>
          {/* Scree Plot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScreePlot eigenvalues={analysisResults.eigenvalues} />
            <FactorLoadingPlot loadings={analysisResults.loadings} />
          </div>

          {/* Factor Rotation Interactive */}
          {rotationMethod !== 'none' && (
            <FactorRotationControls
              initialLoadings={analysisResults.loadings}
              onRotationComplete={(rotated) => {
                setAnalysisResults({
                  ...analysisResults,
                  loadings: rotated,
                });
              }}
            />
          )}

          {/* Factor Interpretation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Factor Interpretation</h3>
            <FactorInterpretationTable
              factors={analysisResults.factors}
              statements={analysisResults.statements}
            />
          </Card>
        </>
      )}
    </div>
  );
}
```

## 6.5.3 State Management Architecture

### Zustand Store Setup

```typescript
// frontend/lib/stores/study-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface StudyState {
  // Current study data
  currentStudy: Study | null;
  participants: Participant[];
  responses: Response[];

  // Analysis state
  analysisResults: AnalysisResults | null;
  correlationMatrix: number[][] | null;

  // Actions
  setCurrentStudy: (study: Study) => void;
  addParticipant: (participant: Participant) => void;
  updateAnalysis: (results: AnalysisResults) => void;

  // Async actions
  fetchStudy: (id: string) => Promise<void>;
  saveStudy: () => Promise<void>;
}

export const useStudyStore = create<StudyState>()(
  devtools(
    persist(
      (set, get) => ({
        currentStudy: null,
        participants: [],
        responses: [],
        analysisResults: null,
        correlationMatrix: null,

        setCurrentStudy: study => set({ currentStudy: study }),

        addParticipant: participant =>
          set(state => ({
            participants: [...state.participants, participant],
          })),

        updateAnalysis: results => set({ analysisResults: results }),

        fetchStudy: async id => {
          const response = await fetch(`/api/studies/${id}`);
          const study = await response.json();
          set({ currentStudy: study });
        },

        saveStudy: async () => {
          const { currentStudy } = get();
          if (!currentStudy) return;

          await fetch(`/api/studies/${currentStudy.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentStudy),
          });
        },
      }),
      {
        name: 'study-storage',
        partialize: state => ({
          currentStudy: state.currentStudy,
        }),
      }
    )
  )
);
```

### Real-time Updates Hook

```typescript
// frontend/lib/hooks/useRealtimeUpdates.ts
import { useEffect } from 'react';
import { useStudyStore } from '@/lib/stores/study-store';

export function useRealtimeUpdates(studyId: string) {
  const updateAnalysis = useStudyStore(state => state.updateAnalysis);
  const addParticipant = useStudyStore(state => state.addParticipant);

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/studies/${studyId}`
    );

    ws.onmessage = event => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'PARTICIPANT_JOINED':
          addParticipant(message.data);
          break;
        case 'RESPONSE_SUBMITTED':
          // Update response data
          break;
        case 'ANALYSIS_UPDATED':
          updateAnalysis(message.data);
          break;
      }
    };

    ws.onerror = error => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [studyId, updateAnalysis, addParticipant]);
}
```

## 🔍 Testing Checkpoint 6.5.1

- [ ] Route groups work correctly (URLs don't include group names)
- [ ] Navigation adapts to user role
- [ ] Q-Analytics UI loads all components
- [ ] State persists across page refreshes
- [ ] Real-time updates work via WebSocket
- [ ] Mobile navigation functions properly

---

# PHASE 6.6: NAVIGATION EXCELLENCE & TESTING

**Duration:** 3-4 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** Perfect navigation flows and comprehensive testing

## 6.6.1 User Journey Mapping

### Journey Documentation

```markdown
# USER_JOURNEYS.md

## Researcher Journey

### 1. First-Time Setup

- Landing → Sign Up → Email Verification
- Profile Setup → Institution Details
- Dashboard Tour → Create First Study

### 2. Study Creation Flow

- Dashboard → Create Study Button
- Basic Info → Grid Design → Stimuli Upload
- Questions Setup → Review → Publish
- Get Invite Link → Share

### 3. Analysis Journey

- Dashboard → Select Study
- View Responses → Run Analysis
- Configure Settings → View Results
- Export Data → Generate Report

## Participant Journey

### 1. Study Entry

- Receive Invite Link → Landing Page
- Enter Study Code → Welcome Screen
- Read Information → Give Consent

### 2. Q-Sort Process

- Familiarization → Pre-Sort (3 piles)
- Main Q-Sort → Drag & Drop
- Review Placement → Confirm

### 3. Completion

- Edge Commentary → Post-Survey
- Demographics → Thank You
- Download Certificate (optional)
```

### Error Recovery Component

```typescript
// frontend/components/navigation/ErrorRecovery.tsx
import { useRouter } from 'next/navigation';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';

interface ErrorRecoveryProps {
  error: Error;
  resetError: () => void;
  context?: 'study' | 'analysis' | 'general';
}

export function ErrorRecovery({ error, resetError, context }: ErrorRecoveryProps) {
  const router = useRouter();

  const recoveryPaths = {
    study: [
      { label: 'Return to Dashboard', action: () => router.push('/dashboard') },
      { label: 'View All Studies', action: () => router.push('/studies') },
      { label: 'Try Again', action: resetError },
    ],
    analysis: [
      { label: 'Refresh Data', action: () => window.location.reload() },
      { label: 'Reset Analysis', action: resetError },
      { label: 'Contact Support', action: () => router.push('/support') },
    ],
    general: [
      { label: 'Go Home', action: () => router.push('/') },
      { label: 'Try Again', action: resetError },
    ],
  };

  const paths = recoveryPaths[context || 'general'];

  return (
    <Card className="max-w-md mx-auto mt-8 p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-secondary-label mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>

        <div className="space-y-3">
          {paths.map((path, index) => (
            <Button
              key={index}
              variant={index === 0 ? 'primary' : 'secondary'}
              fullWidth
              onClick={path.action}
            >
              {path.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

## 6.6.2 Testing Infrastructure

### Mock Data Generator

```typescript
// frontend/test/generate-mock-data.ts
import { faker } from '@faker-js/faker';

export function generateMockStudy(overrides = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    researcherId: faker.string.uuid(),
    inviteCode: faker.string.alphanumeric(6).toUpperCase(),
    status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'COMPLETED']),
    configuration: {
      gridDistribution: [1, 2, 3, 4, 5, 4, 3, 2, 1],
      statements: generateStatements(30),
      preQuestions: generateQuestions(5),
      postQuestions: generateQuestions(10),
    },
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function generateStatements(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `stmt-${i + 1}`,
    text: faker.lorem.sentence(),
    type: 'text',
  }));
}

export function generateParticipantResponse() {
  return {
    id: faker.string.uuid(),
    participantId: faker.string.uuid(),
    demographics: {
      age: faker.number.int({ min: 18, max: 80 }),
      gender: faker.helpers.arrayElement(['male', 'female', 'other']),
      education: faker.helpers.arrayElement([
        'high_school',
        'bachelors',
        'masters',
        'phd',
      ]),
    },
    qSortData: generateQSortPlacement(),
    completedAt: faker.date.recent(),
  };
}

export function generateQSortPlacement() {
  const distribution = [1, 2, 3, 4, 5, 4, 3, 2, 1];
  const placements = {};
  let statementIndex = 0;

  distribution.forEach((count, column) => {
    for (let row = 0; row < count; row++) {
      placements[`${column}-${row}`] = `stmt-${++statementIndex}`;
    }
  });

  return placements;
}

// Air Pollution Study Template
export const AIR_POLLUTION_STUDY = {
  title: 'Community Perspectives on Air Pollution Solutions',
  description:
    'Understanding diverse viewpoints on addressing urban air quality',
  statements: [
    'Electric vehicles should be subsidized by the government',
    'Industrial emissions are the primary cause of air pollution',
    'Individual behavior change is more important than policy',
    'Public transportation should be free to reduce car usage',
    'Air quality monitoring apps help people make better choices',
    // ... 25 more statements
  ],
  personas: [
    { type: 'Environmental Activist', pattern: 'strong_environmental' },
    { type: 'Industry Representative', pattern: 'economic_focus' },
    { type: 'Health Professional', pattern: 'health_priority' },
    { type: 'Urban Planner', pattern: 'infrastructure_focus' },
    { type: 'Concerned Parent', pattern: 'family_safety' },
  ],
};
```

### Comprehensive Page Testing

```typescript
// frontend/test/test-all-pages.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation Flow Tests', () => {
  test('Researcher can navigate through study creation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Study');
    await expect(page).toHaveURL('/studies/create');

    // Fill study details
    await page.fill('[name="title"]', 'Test Study');
    await page.click('text=Next');

    // Design grid
    await expect(page.locator('text=Grid Design')).toBeVisible();
    await page.click('text=Use Default');
    await page.click('text=Next');

    // Add stimuli
    await expect(page.locator('text=Stimuli')).toBeVisible();
    // ... continue flow
  });

  test('Participant can complete full journey', async ({ page }) => {
    await page.goto('/join');
    await page.fill('[name="studyCode"]', 'ABC123');
    await page.click('text=Join Study');

    // Welcome
    await expect(page).toHaveURL(/\/study\/.+\/welcome/);
    await page.click('text=Continue');

    // Consent
    await page.check('[name="consent"]');
    await page.click('text=I Agree');

    // Q-Sort
    await expect(page.locator('.q-sort-grid')).toBeVisible();
    // Drag and drop simulation
    const statement = page.locator('.statement').first();
    const cell = page.locator('.grid-cell').first();
    await statement.dragTo(cell);

    // ... continue through all steps
  });

  test('Mobile navigation works correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Check mobile menu
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('.desktop-sidebar')).not.toBeVisible();

    // Test hamburger menu
    await page.click('[aria-label="Menu"]');
    await expect(page.locator('.mobile-menu')).toBeVisible();
  });
});
```

## 🔍 Testing Checkpoint 6.6.1

- [ ] All user journeys documented
- [ ] Error recovery paths work
- [ ] Mock data generates correctly
- [ ] Navigation tests pass
- [ ] Mobile flows work
- [ ] Deep links function properly

---

# PHASE 6.7: CRITICAL BACKEND INTEGRATION

**Duration:** 3-4 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** Connect frontend to backend APIs

## 6.7.1 API Client Setup

### Axios Configuration

```typescript
// frontend/lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        useAuthStore.getState().setAccessToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### API Service Layer

```typescript
// frontend/lib/api/services/study.service.ts
import { apiClient } from '../client';

export const studyService = {
  async getAll() {
    const { data } = await apiClient.get('/studies');
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/studies/${id}`);
    return data;
  },

  async create(study: CreateStudyDto) {
    const { data } = await apiClient.post('/studies', study);
    return data;
  },

  async update(id: string, updates: UpdateStudyDto) {
    const { data } = await apiClient.patch(`/studies/${id}`, updates);
    return data;
  },

  async delete(id: string) {
    await apiClient.delete(`/studies/${id}`);
  },

  async getAnalysis(id: string) {
    const { data } = await apiClient.get(`/studies/${id}/analysis`);
    return data;
  },

  async runAnalysis(id: string, options: AnalysisOptions) {
    const { data } = await apiClient.post(`/studies/${id}/analysis`, options);
    return data;
  },

  async exportData(id: string, format: string) {
    const { data } = await apiClient.get(`/studies/${id}/export/${format}`, {
      responseType: 'blob',
    });
    return data;
  },
};
```

## 6.7.2 Authentication Integration

### Login Page Integration

```typescript
// frontend/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/lib/api/services/auth.service';
import { Button } from '@/components/apple-ui/Button';
import { TextField } from '@/components/apple-ui/TextField';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await authService.login({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      });

      setAuth(response);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        name="email"
        type="email"
        label="Email"
        required
        error={error}
      />
      <TextField
        name="password"
        type="password"
        label="Password"
        required
      />
      <Button type="submit" loading={loading} fullWidth>
        Sign In
      </Button>
    </form>
  );
}
```

### Protected Route Wrapper

```typescript
// frontend/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'RESEARCHER' | 'PARTICIPANT';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user, requiredRole, router]);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
```

## 🔍 Testing Checkpoint 6.7.1

- [ ] API client connects to backend
- [ ] Authentication flow works
- [ ] Token refresh functions
- [ ] Protected routes redirect properly
- [ ] API error handling works
- [ ] Data persistence confirmed

---

# PHASE 6.8: STUDY CREATION EXCELLENCE

**Duration:** 4-5 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** Rich study creation with templates and signatures

## 6.8.1 Advanced Study Builder

### Multi-Step Wizard

```typescript
// frontend/components/researcher/StudyWizard/StudyWizard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { GridDesignStep } from './steps/GridDesignStep';
import { StimuliStep } from './steps/StimuliStep';
import { QuestionsStep } from './steps/QuestionsStep';
import { ReviewStep } from './steps/ReviewStep';

const STEPS = [
  { id: 'basic', title: 'Basic Information', component: BasicInfoStep },
  { id: 'grid', title: 'Grid Design', component: GridDesignStep },
  { id: 'stimuli', title: 'Stimuli', component: StimuliStep },
  { id: 'questions', title: 'Questions', component: QuestionsStep },
  { id: 'review', title: 'Review & Publish', component: ReviewStep },
];

export function StudyWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [studyData, setStudyData] = useState({});

  const handleNext = (stepData: any) => {
    setStudyData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handlePublish = async () => {
    const response = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studyData),
    });

    if (response.ok) {
      const study = await response.json();
      window.location.href = `/studies/${study.id}`;
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index <= currentStep ? 'text-system-blue' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  index <= currentStep
                    ? 'bg-system-blue text-white'
                    : 'bg-gray-200'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className="text-xs">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <motion.div
            className="h-full bg-system-blue rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentStepComponent
            data={studyData}
            onNext={handleNext}
            onBack={handleBack}
            onPublish={currentStep === STEPS.length - 1 ? handlePublish : undefined}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

### Grid Designer Component

```typescript
// frontend/components/researcher/StudyWizard/steps/GridDesignStep.tsx
import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { motion } from 'framer-motion';

const PRESET_DISTRIBUTIONS = [
  { name: 'Normal (9 columns)', distribution: [1, 2, 3, 4, 5, 4, 3, 2, 1] },
  { name: 'Flat (7 columns)', distribution: [3, 4, 5, 6, 5, 4, 3] },
  { name: 'Steep (11 columns)', distribution: [1, 1, 2, 3, 4, 5, 4, 3, 2, 1, 1] },
  { name: 'Custom', distribution: null },
];

export function GridDesignStep({ data, onNext, onBack }) {
  const [distribution, setDistribution] = useState(
    data.gridDistribution || [1, 2, 3, 4, 5, 4, 3, 2, 1]
  );
  const [selectedPreset, setSelectedPreset] = useState('Normal (9 columns)');

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.name);
    if (preset.distribution) {
      setDistribution(preset.distribution);
    }
  };

  const handleColumnChange = (index: number, value: number) => {
    const newDist = [...distribution];
    newDist[index] = Math.max(1, Math.min(10, value));
    setDistribution(newDist);
  };

  const totalStatements = distribution.reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Design Your Q-Sort Grid</h2>

        {/* Preset Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Choose a Template</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_DISTRIBUTIONS.map(preset => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPreset === preset.name
                    ? 'border-system-blue bg-system-blue/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Grid Preview</h3>
          <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <div className="flex justify-center gap-2 min-w-max">
              {distribution.map((count, index) => {
                const value = index - Math.floor(distribution.length / 2);
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-sm font-medium mb-2">
                      {value > 0 ? `+${value}` : value}
                    </div>
                    <div className="flex flex-col gap-1">
                      {Array.from({ length: count }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="w-16 h-16 bg-white border-2 border-gray-300 rounded"
                        />
                      ))}
                    </div>
                    {selectedPreset === 'Custom' && (
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => handleColumnChange(index, parseInt(e.target.value))}
                        className="mt-2 w-16 text-center border rounded"
                        min="1"
                        max="10"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-secondary-label mt-2">
            Total statements required: {totalStatements}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => onNext({ gridDistribution: distribution })}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

## 6.8.2 Rich Text Editor Integration

### TinyMCE Setup

```typescript
// frontend/components/editor/RichTextEditor.tsx
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

export function RichTextEditor({ value, onChange, height = 400 }: RichTextEditorProps) {
  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
          'fullscreen', 'insertdatetime', 'media', 'table', 'code',
          'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px }',
      }}
    />
  );
}
```

## 🔍 Testing Checkpoint 6.8.1

- [ ] Study wizard saves progress between steps
- [ ] Grid designer calculates correctly
- [ ] Rich text editor formats properly
- [ ] Templates load successfully
- [ ] Digital signatures work
- [ ] Study publishes correctly

---

# PHASE 6.85: UI/UX POLISH & PREVIEW EXCELLENCE

**Duration:** 3-4 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** Production-ready UI with perfect preview

## 6.85.1 Interactive Grid Builder

### Advanced Grid Customization

```typescript
// frontend/components/researcher/GridBuilder/InteractiveGridBuilder.tsx
import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

export function InteractiveGridBuilder() {
  const [grid, setGrid] = useState({
    distribution: [1, 2, 3, 4, 5, 4, 3, 2, 1],
    labels: {
      left: 'Most Disagree',
      right: 'Most Agree',
      top: '',
      bottom: '',
    },
    color: '#007AFF',
  });

  const handleDistributionChange = (index: number, delta: number) => {
    const newDist = [...grid.distribution];
    newDist[index] = Math.max(1, Math.min(10, newDist[index] + delta));
    setGrid({ ...grid, distribution: newDist });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Interactive Grid Builder</h3>

      {/* Grid Visualization */}
      <div className="relative bg-gray-50 p-8 rounded-lg">
        {/* Labels */}
        <input
          type="text"
          value={grid.labels.left}
          onChange={(e) => setGrid({
            ...grid,
            labels: { ...grid.labels, left: e.target.value }
          })}
          className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-sm"
          style={{ left: '-60px' }}
        />

        <input
          type="text"
          value={grid.labels.right}
          onChange={(e) => setGrid({
            ...grid,
            labels: { ...grid.labels, right: e.target.value }
          })}
          className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-sm"
          style={{ right: '-60px' }}
        />

        {/* Grid Cells */}
        <div className="flex justify-center gap-2">
          {grid.distribution.map((count, col) => (
            <div key={col} className="flex flex-col items-center">
              <div className="text-sm font-medium mb-2">
                {col - Math.floor(grid.distribution.length / 2)}
              </div>

              <div className="flex flex-col gap-1">
                {Array.from({ length: count }).map((_, row) => (
                  <div
                    key={row}
                    className="w-20 h-20 border-2 rounded-lg transition-all hover:scale-105"
                    style={{ borderColor: grid.color }}
                  />
                ))}
              </div>

              {/* Adjustment Buttons */}
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => handleDistributionChange(col, -1)}
                  className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-6 text-center">{count}</span>
                <button
                  onClick={() => handleDistributionChange(col, 1)}
                  className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div className="mt-4 flex items-center gap-4">
        <label className="text-sm font-medium">Grid Color:</label>
        <input
          type="color"
          value={grid.color}
          onChange={(e) => setGrid({ ...grid, color: e.target.value })}
          className="w-10 h-10 rounded cursor-pointer"
        />
      </div>
    </Card>
  );
}
```

## 6.85.2 Comprehensive Preview System

### Study Preview Component

```typescript
// frontend/components/researcher/Preview/StudyPreview.tsx
import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { TabGroup, Tab, TabList, TabPanels, TabPanel } from '@headlessui/react';

export function StudyPreview({ study }) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const deviceSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' },
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Study Preview</h3>

        {/* Device Selector */}
        <div className="flex gap-2">
          {(['desktop', 'tablet', 'mobile'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`p-2 rounded ${
                device === d ? 'bg-system-blue text-white' : 'bg-gray-100'
              }`}
            >
              {d === 'desktop' && '🖥️'}
              {d === 'tablet' && '📱'}
              {d === 'mobile' && '📱'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden transition-all"
          style={deviceSizes[device]}
        >
          <iframe
            src={`/preview/study/${study.id}?device=${device}`}
            className="w-full h-full border-0"
            title="Study Preview"
          />
        </div>
      </div>

      {/* Preview Controls */}
      <div className="mt-4 flex justify-between">
        <Button variant="secondary">Edit Study</Button>
        <Button variant="primary">Publish Study</Button>
      </div>
    </Card>
  );
}
```

## 🔍 Final Testing Checkpoint

- [ ] Interactive grid builder works smoothly
- [ ] Preview shows accurate representation
- [ ] Device switching works correctly
- [ ] All UI components polished
- [ ] Performance metrics met
- [ ] Accessibility standards achieved

---

# Summary

This Part 3 covers:

- **Phase 6.5**: Frontend Architecture with route groups and Q-Analytics UI
- **Phase 6.6**: Navigation Excellence with journey mapping and testing
- **Phase 6.7**: Critical Backend Integration with API connectivity
- **Phase 6.8**: Study Creation Excellence with rich editors
- **Phase 6.85**: UI/UX Polish with interactive builders and preview

Continue to **IMPLEMENTATION_GUIDE_PART4.md** for Phases 6.86-10.

**Document Size**: ~19,700 tokens
