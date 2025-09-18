# Phase 7.5: Research Lifecycle Navigation - Technical Implementation Guide

**Document:** Technical implementation specifications for Research Lifecycle Navigation  
**Phase:** 7.5  
**Duration:** 10-12 days  
**Reference:** [PHASE_TRACKER.md](./PHASE_TRACKER.md#phase-75-research-lifecycle-navigation-system)

---

## 1. Core Architecture

### 1.1 Navigation State Management (Zustand)

```typescript
// frontend/lib/stores/navigation.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ResearchPhase {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  progress: number;
  isLocked: boolean;
  isActive: boolean;
  children: SecondaryNavItem[];
}

interface SecondaryNavItem {
  id: string;
  label: string;
  path: string;
  description?: string;
  icon?: ComponentType;
  badge?: string;
  aiEnabled?: boolean;
  isNew?: boolean;
  shortcut?: string;
}

interface NavigationStore {
  // State
  currentPhase: ResearchPhase | null;
  currentTool: string | null;
  phaseProgress: Map<string, number>;
  isSecondaryOpen: boolean;
  userPreferences: NavigationPreferences;
  completedActions: Set<string>;
  availablePhases: Set<string>;
  
  // Actions
  setPhase: (phaseId: string) => void;
  setTool: (toolId: string) => void;
  updateProgress: (phaseId: string, progress: number) => void;
  toggleSecondary: () => void;
  completeAction: (actionId: string) => void;
  unlockPhase: (phaseId: string) => void;
  updatePreferences: (prefs: Partial<NavigationPreferences>) => void;
  
  // Computed
  getAvailablePhases: () => ResearchPhase[];
  getPhaseCompleteness: (phaseId: string) => number;
  getNextRecommendedAction: () => SecondaryNavItem | null;
}
```

### 1.2 Phase Configuration

```typescript
// frontend/lib/config/research-phases.ts
export const RESEARCH_PHASES: ResearchPhase[] = [
  {
    id: 'discover',
    label: 'Discover',
    icon: BookOpenIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    description: 'Literature review & research foundation',
    progress: 0,
    isLocked: false,
    isActive: false,
    children: [
      { id: 'literature', label: 'Literature Search', path: '/discover/literature', aiEnabled: true },
      { id: 'references', label: 'Reference Manager', path: '/discover/references' },
      { id: 'knowledge-map', label: 'Knowledge Map', path: '/discover/knowledge-map', badge: 'NEW' },
      { id: 'gaps', label: 'Research Gaps', path: '/discover/gaps', aiEnabled: true },
      { id: 'prior-studies', label: 'Prior Studies', path: '/discover/prior-studies' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    icon: LightBulbIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    description: 'Formulate questions & methodology',
    progress: 0,
    isLocked: false,
    isActive: false,
    children: [
      { id: 'questions', label: 'Research Questions', path: '/design/questions', aiEnabled: true },
      { id: 'hypothesis', label: 'Hypothesis Builder', path: '/design/hypothesis' },
      { id: 'methodology', label: 'Methodology Selection', path: '/design/methodology' },
      { id: 'protocol', label: 'Study Protocol', path: '/design/protocol' },
      { id: 'ethics', label: 'Ethics Review', path: '/design/ethics', badge: 'REQUIRED' },
    ],
  },
  // ... rest of 10 phases
];

// Phase dependencies
export const PHASE_DEPENDENCIES: Record<string, string[]> = {
  discover: [],
  design: [],
  build: ['design'],
  recruit: ['build'],
  collect: ['recruit'],
  analyze: ['collect'],
  visualize: ['analyze'],
  interpret: ['analyze'],
  report: ['interpret'],
  archive: ['report'],
};
```

## 2. Component Implementation

### 2.1 Primary Toolbar (Research Phases)

```typescript
// frontend/components/navigation/ResearchToolbar/ResearchToolbar.tsx
import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '@/lib/stores/navigation.store';
import { PhaseButton } from './PhaseButton';
import { NavigationAssistant } from './NavigationAssistant';

export function ResearchToolbar() {
  const {
    currentPhase,
    phaseProgress,
    availablePhases,
    setPhase,
    userPreferences,
  } = useNavigationStore();

  // Keyboard shortcuts
  useEffect(() => {
    if (!userPreferences.enableKeyboardShortcuts) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < RESEARCH_PHASES.length) {
          setPhase(RESEARCH_PHASES[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setPhase, userPreferences]);

  const phases = useMemo(() => {
    return RESEARCH_PHASES.map(phase => ({
      ...phase,
      progress: phaseProgress.get(phase.id) || 0,
      isLocked: !availablePhases.has(phase.id),
      isActive: currentPhase?.id === phase.id,
    }));
  }, [currentPhase, phaseProgress, availablePhases]);

  return (
    <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {phases.map((phase, index) => (
              <PhaseButton
                key={phase.id}
                phase={phase}
                index={index}
                onClick={() => setPhase(phase.id)}
              />
            ))}
          </div>
          <NavigationAssistant />
        </div>
      </div>
    </div>
  );
}
```

### 2.2 Phase Button Component

```typescript
// frontend/components/navigation/ResearchToolbar/PhaseButton.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PhaseButtonProps {
  phase: ResearchPhase;
  index: number;
  onClick: () => void;
}

export function PhaseButton({ phase, index, onClick }: PhaseButtonProps) {
  const Icon = phase.icon;
  const isComplete = phase.progress === 100;
  const shortcut = index < 9 ? `⌘${index + 1}` : index === 9 ? '⌘0' : null;

  return (
    <motion.button
      onClick={onClick}
      disabled={phase.isLocked}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        phase.isActive ? phase.bgColor : 'hover:bg-gray-100',
        phase.isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        phase.isActive ? phase.color : 'text-gray-600'
      )}
      whileHover={!phase.isLocked ? { scale: 1.02 } : {}}
      whileTap={!phase.isLocked ? { scale: 0.98 } : {}}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {phase.isLocked && (
          <LockClosedIcon className="absolute -bottom-1 -right-1 w-3 h-3 text-gray-400" />
        )}
        {isComplete && !phase.isLocked && (
          <CheckCircleIcon className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500" />
        )}
      </div>

      <span className="hidden sm:inline">{phase.label}</span>
      
      {shortcut && (
        <span className="hidden lg:inline text-xs text-gray-400">
          {shortcut}
        </span>
      )}

      {/* Progress bar */}
      {!phase.isLocked && phase.progress > 0 && phase.progress < 100 && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div 
            className={cn('h-full', phase.bgColor.replace('hover:', ''))}
            initial={{ width: 0 }}
            animate={{ width: `${phase.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </motion.button>
  );
}
```

### 2.3 Secondary Toolbar (Contextual Tools)

```typescript
// frontend/components/navigation/ContextualToolbar/ContextualToolbar.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '@/lib/stores/navigation.store';
import { ToolButton } from './ToolButton';

export function ContextualToolbar() {
  const { currentPhase, isSecondaryOpen, setTool } = useNavigationStore();

  if (!currentPhase || !isSecondaryOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={currentPhase.id}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="sticky top-28 z-20 border-b border-gray-200 bg-gray-50 shadow-sm overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto">
              {currentPhase.children.map((tool) => (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  onClick={() => setTool(tool.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

## 3. Responsive Design

### 3.1 Mobile Navigation

```typescript
// frontend/components/navigation/MobileNavigation.tsx
import React from 'react';
import { useNavigationStore } from '@/lib/stores/navigation.store';
import { RESEARCH_PHASES } from '@/lib/config/research-phases';

export function MobileNavigation() {
  const { currentPhase, setPhase } = useNavigationStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {RESEARCH_PHASES.slice(0, 5).map((phase) => {
            const Icon = phase.icon;
            const isActive = currentPhase?.id === phase.id;
            
            return (
              <button
                key={phase.id}
                onClick={() => setPhase(phase.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2',
                  isActive ? phase.color : 'text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{phase.label}</span>
              </button>
            );
          })}
          
          <button className="flex flex-col items-center gap-1 p-2 text-gray-500">
            <DotsHorizontalIcon className="w-5 h-5" />
            <span className="text-xs">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 4. Progress Tracking

### 4.1 Progress Tracker Service

```typescript
// frontend/lib/services/progress-tracker.ts
export class ProgressTracker {
  private metrics: Map<string, ProgressMetrics> = new Map();

  updateProgress(phaseId: string, actionId: string) {
    const phase = RESEARCH_PHASES.find(p => p.id === phaseId);
    if (!phase) return;

    let metrics = this.metrics.get(phaseId) || {
      phaseId,
      completedActions: [],
      totalActions: phase.children.length,
      percentComplete: 0,
      lastActivity: new Date(),
    };

    if (!metrics.completedActions.includes(actionId)) {
      metrics.completedActions.push(actionId);
    }

    metrics.percentComplete = (metrics.completedActions.length / metrics.totalActions) * 100;
    metrics.lastActivity = new Date();

    this.metrics.set(phaseId, metrics);
    
    // Update store
    useNavigationStore.getState().updateProgress(phaseId, metrics.percentComplete);
    
    // Check for phase completion
    if (metrics.percentComplete === 100) {
      this.onPhaseComplete(phaseId);
    }
  }

  private onPhaseComplete(phaseId: string) {
    const phaseIndex = RESEARCH_PHASES.findIndex(p => p.id === phaseId);
    if (phaseIndex < RESEARCH_PHASES.length - 1) {
      const nextPhase = RESEARCH_PHASES[phaseIndex + 1];
      useNavigationStore.getState().unlockPhase(nextPhase.id);
    }
  }
}
```

## 5. AI Navigation Assistant

### 5.1 Navigation Assistant Component

```typescript
// frontend/components/navigation/NavigationAssistant.tsx
import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigationStore } from '@/lib/stores/navigation.store';

export function NavigationAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { getNextRecommendedAction } = useNavigationStore();
  
  const nextAction = getNextRecommendedAction();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 relative"
      >
        <SparklesIcon className="w-5 h-5 text-purple-600" />
        {nextAction && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-sm mb-3">AI Navigation Assistant</h3>
          
          {nextAction ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">Recommended next step:</p>
              <button
                onClick={() => window.location.href = nextAction.path}
                className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                <div className="font-medium">{nextAction.label}</div>
                {nextAction.description && (
                  <div className="text-xs text-gray-600 mt-1">{nextAction.description}</div>
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Great job! You've completed all tasks in this phase.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

## 6. Route Structure

### 6.1 File System Layout

```
frontend/app/(researcher)/
├── discover/
│   ├── page.tsx                 # Discovery hub
│   ├── literature/page.tsx      # Literature search
│   ├── references/page.tsx      # Reference manager
│   ├── knowledge-map/page.tsx   # Knowledge visualization
│   ├── gaps/page.tsx            # Research gaps
│   └── prior-studies/page.tsx   # Prior studies browser
├── design/
│   ├── page.tsx                 # Design hub
│   ├── questions/page.tsx       # Research questions
│   ├── hypothesis/page.tsx      # Hypothesis builder
│   ├── methodology/page.tsx     # Methodology selection
│   ├── protocol/page.tsx        # Study protocol
│   └── ethics/page.tsx          # Ethics review
├── build/                       # Maps to existing /studies/create
├── recruit/                     # Enhanced participant management
├── collect/                     # Maps to existing /study/[token]
├── analyze/                     # Maps to existing /analysis
├── visualize/                   # Maps to existing /visualization-demo
├── interpret/                   # NEW - Interpretation tools
├── report/                      # NEW - Report generation
└── archive/                     # NEW - Study archival
```

## 7. Testing Strategy

### 7.1 Component Tests

```typescript
// frontend/components/navigation/__tests__/ResearchToolbar.test.tsx
describe('ResearchToolbar', () => {
  it('renders all 10 research phases', () => {
    render(<ResearchToolbar />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('handles phase selection', async () => {
    render(<ResearchToolbar />);
    const discoverButton = screen.getByRole('button', { name: /discover/i });
    await userEvent.click(discoverButton);
    expect(useNavigationStore.getState().currentPhase?.id).toBe('discover');
  });

  it('shows locked state for unavailable phases', () => {
    render(<ResearchToolbar />);
    const buildButton = screen.getByRole('button', { name: /build/i });
    expect(buildButton).toBeDisabled();
  });

  it('responds to keyboard shortcuts', async () => {
    render(<ResearchToolbar />);
    fireEvent.keyDown(window, { key: '1', metaKey: true });
    await waitFor(() => {
      expect(useNavigationStore.getState().currentPhase?.id).toBe('discover');
    });
  });
});
```

### 7.2 E2E Tests

```typescript
// frontend/e2e/navigation.spec.ts
test.describe('Research Lifecycle Navigation', () => {
  test('complete research journey flow', async ({ page }) => {
    await page.goto('/');
    
    // Navigate through phases
    await page.click('button:has-text("Discover")');
    await expect(page).toHaveURL('/discover');
    
    await page.click('button:has-text("Literature Search")');
    await expect(page).toHaveURL('/discover/literature');
    
    // Progress tracking
    await page.click('[data-testid="complete-action"]');
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('style', /width: \d+%/);
  });

  test('mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Check bottom navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await page.click('[data-testid="mobile-nav"] button:has-text("Discover")');
    await expect(page).toHaveURL('/discover');
  });
});
```

## 8. Performance Optimizations

### 8.1 Code Splitting

```typescript
// frontend/components/navigation/LazyPhaseLoader.tsx
import { lazy, Suspense } from 'react';

const phaseComponents = {
  discover: lazy(() => import('@/app/(researcher)/discover/page')),
  design: lazy(() => import('@/app/(researcher)/design/page')),
  // ... other phases
};

export function LazyPhaseLoader({ phaseId }: { phaseId: string }) {
  const PhaseComponent = phaseComponents[phaseId];
  
  return (
    <Suspense fallback={<PhaseLoadingState />}>
      <PhaseComponent />
    </Suspense>
  );
}
```

### 8.2 Animation Performance

```typescript
// frontend/lib/animations/navigation.ts
export const toolbarVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};
```

## 9. Migration & Rollout

### 9.1 Feature Flag Configuration

```typescript
// frontend/lib/features/flags.ts
export const featureFlags = {
  researchLifecycleNav: {
    enabled: process.env.NEXT_PUBLIC_LIFECYCLE_NAV_ENABLED === 'true',
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_LIFECYCLE_NAV_ROLLOUT || '0'),
  },
};
```

### 9.2 Progressive Rollout

```typescript
// frontend/components/navigation/NavigationWrapper.tsx
export function NavigationWrapper() {
  const isLifecycleNavEnabled = isFeatureEnabled('researchLifecycleNav');
  
  if (isLifecycleNavEnabled) {
    return (
      <>
        <ResearchToolbar />
        <ContextualToolbar />
      </>
    );
  }
  
  return <UnifiedNavigation />; // Existing navigation
}
```

## 10. Error Handling

### 10.1 Error Boundary

```typescript
// frontend/components/navigation/NavigationErrorBoundary.tsx
export class NavigationErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Navigation error:', error, errorInfo);
    // Fall back to classic navigation
  }
  
  render() {
    if (this.state.hasError) {
      return <UnifiedNavigation />; // Fallback to existing nav
    }
    
    return this.props.children;
  }
}
```

---

**Implementation Checklist:**
- [ ] Set up navigation store with Zustand
- [ ] Create phase configuration
- [ ] Build primary toolbar component
- [ ] Build secondary toolbar component
- [ ] Implement mobile navigation
- [ ] Add progress tracking
- [ ] Create AI assistant
- [ ] Set up routing structure
- [ ] Write component tests
- [ ] Implement feature flags
- [ ] Configure progressive rollout
- [ ] Add error boundaries
- [ ] Performance optimization
- [ ] Documentation
- [ ] User training materials