# VQMethod - Development Implementation Guide (Part 4 of 5)

⚠️ **DOCUMENT SIZE LIMIT:** This document follows the 22,000 token limit policy for Claude compatibility.
**Current Size:** ~11,000 tokens (Check: `wc -c Development_Implementation_Guide_Part4.md | awk '{print int($1/4)}'`)
**Part:** 4 of 5
**Previous Part:** [Part 3 - Q-Methodology Implementation](./Development_Implementation_Guide_Part3.md)
**Next Part:** [Part 5 - Authentication UI Components](./Development_Implementation_Guide_Part5.md)

## 🚀 Security, Visualization, Polish & Performance

⚠️ **CRITICAL:** Before implementing ANY code, you MUST read [REPOSITORY_STANDARDS.md](./REPOSITORY_STANDARDS.md) for mandatory file organization rules. Violations will block commits.

**Document Coverage:** This part covers Parts X-XIV of the implementation guide, focusing on security, production excellence, data visualization, professional polish, and performance optimization.

**Excellence Path Mapping (Phases 7-12):**

- **Phase 7:** Enterprise Production Excellence → Part X ✅ IN THIS DOCUMENT
- **Phase 8:** Observability & SRE → Part VIII (Monitoring) ✅ IN THIS DOCUMENT  
- **Phase 9:** Performance & Scale → Part XIII ✅ IN THIS DOCUMENT
- **Phase 10:** Quality Gates → Part XIV ✅ IN THIS DOCUMENT
- **Phase 11:** Internationalization → Future Implementation
- **Phase 12:** Growth & Monetization → Future Implementation

**Phase 6.8 Integration:**
- Rich Text Editing → Part XI (Visualization)
- Templates & Signatures → Part XII (Polish)
- Study Creation Excellence → See PHASE_6.8_STUDY_CREATION_EXCELLENCE.md

**Version:** 3.2 (Split for token limits)  
**Date:** December 2024 (Split from original Part 2)  
**Document Type:** Technical Implementation (Security & Excellence)  
**Build Approach:** Ground-up development with Apple HIG compliance + Enterprise Security

---
# PART X: SECURITY & PRODUCTION EXCELLENCE

**Implements Phase 7: Security & Production Excellence**

## 🎨 KEY EXCELLENCE FEATURES TO IMPLEMENT (Phase 7)

### Apple Performance Standards:

- ⚡ **60fps animations** using Apple's Core Animation techniques
- 🚀 **Apple-style loading optimizations** with progressive enhancement
- ♿ **Apple's accessibility-first approach** targeting WCAG AAA
- 📊 **Apple's performance monitoring** (Core Web Vitals excellence)
- 🔒 **Apple's security best practices** for enterprise deployment

### Design Quality Gates to Achieve:

- 📏 **Apple HIG compliance scoring** (≥95% target)
- 🎬 **Micro-interaction smoothness testing** (60fps requirement)
- 📈 **Data visualization clarity validation** against industry standards
- ♿ **Accessibility excellence testing** (WCAG AAA compliance)
- 💯 **Lighthouse perfect scores** (100/100 all categories)

### Performance Optimization Code

```typescript
// Apple-style 60fps animation optimization
const animationConfig = {
  willChange: 'transform',
  transform: 'translateZ(0)', // Force GPU acceleration
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Apple's curve
  contain: 'layout style paint' // Optimize repaints
}

// React performance optimization
const OptimizedComponent = React.memo(({ data }) => {
  const processedData = useMemo(() =>
    expensiveDataProcessing(data), [data]
  );

  return (
    <motion.div
      style={animationConfig}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Component content */}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for re-render optimization
  return prevProps.data.id === nextProps.data.id;
});
```

## 10. Enterprise Security & Collaboration Architecture

```typescript
// Security & Collaboration Architecture (Phase 7 - Production Excellence)
src/modules/collaboration/
├── invitation/
├── chat/
└── lifecycle/
```

### 10.2 Secure Invitation System Implementation

```typescript
// backend/src/modules/collaboration/invitation/services/invitation.service.ts
@Injectable()
export class CollaborationInvitationService {
  // Invite collaborators with multi-layer security validation,
  // time-limited token, acceptance flow, and audit logging
}
```

### 10.3 Real-time Chat Implementation

```typescript
// backend/src/modules/collaboration/chat/gateways/chat-socket.gateway.ts
@WebSocketGateway({
  namespace: '/collaboration-chat',
  cors: { origin: process.env.FRONTEND_URL },
})
export class CollaborationChatGateway {
  // WebSocket connection, presence, messaging, typing indicators
}
```

### 10.4 Survey Lifecycle Management Implementation

```typescript
// backend/src/modules/collaboration/lifecycle/services/survey-lifecycle.service.ts
@Injectable()
export class SurveyLifecycleService {
  // Status transitions, scheduling, notifications, audit logging
}
```

---

## SECURITY AND PRODUCTION READINESS INTEGRATIONS

- Multi-tenant isolation with RLS policies
- Session-based participant auth with HttpOnly cookies
- XSS-safe stimulus rendering and sandboxed HTML
- Comprehensive rate limiting (auth, API, uploads, chat, exports, etc.)
- CI/CD security scans (SAST/DAST), coverage enforcement, quality gates

---

## CROSS-REFERENCES

- HOW (Foundations/Core): ./Development_Implementation_Guide_Part1.md
- HOW (Advanced/Operations): This document
- WHAT: ./Complete_Product_Specification.md
- Phase Orchestration & Checklists: ./IMPLEMENTATION_PHASES.md

---

## EXECUTION NOTE

When following ./IMPLEMENTATION_PHASES.md:

- Phases 1–3 map primarily to Part 1 (Foundations and Core Dual Interface/Q-Method)
- Phases 4–7 map primarily to Part 2 (Media, Collaboration, Admin, Monitoring, Security/Production)

Always enforce Apple HIG, accessibility, and security baselines throughout each phase.

---

# PART XI: DATA VISUALIZATION EXCELLENCE 📊

## Tableau-Quality Analytics Implementation

**Implements Phase 4: Data Visualization & Analytics Excellence**

## 🎨 KEY DESIGN FEATURES TO IMPLEMENT (Phase 4)

### Apple Liquid Glass Design (85% → 100% Target):

**Current Achievement:** Basic Apple design system with typography and colors  
**Implementation Required:**

- ✨ **Glass morphism effects** - `backdrop-filter: blur(20px)` with 70% opacity
- 🎯 **Dynamic materials** - Context-aware translucency and depth
- 🌊 **Liquid animations** - Spring physics (tension: 170, friction: 26)
- 🔮 **Layered blur effects** - Multiple depth levels with saturate(180%)
- 🧲 **Magnetic interactions** - 30px attraction radius with easing

### Tableau-Level Visualization (70% → 100% Target):

**Current Achievement:** Interactive tooltips and export functionality defined  
**Implementation Required:**

- 📊 **Drag-drop dashboard builder** - React DnD with Apple physics engine
- 💡 **"Show Me" AI recommendations** - TensorFlow.js pattern recognition
- 🔍 **"Ask Data" NLP queries** - Web Speech API + natural language processing
- 🔗 **Cross-filtering system** - D3.js brushing with 60fps transitions
- 💬 **Smart tooltips** - Context-aware content with Apple HIG styling

### Installation & Setup

```bash
# Install visualization libraries
cd frontend
npm install @visx/visx d3 recharts framer-motion @tanstack/react-query
npm install --save-dev @types/d3

# Install Q-methodology specific libraries
npm install ml-matrix simple-statistics jstat
npm install --save-dev @types/jstat

# Install export libraries
npm install html2canvas jspdf xlsx file-saver
npm install --save-dev @types/file-saver

# Create visualization structure
mkdir -p components/visualizations/{charts,dashboards,widgets,utils}
mkdir -p components/visualizations/q-methodology
mkdir -p lib/visualization
mkdir -p lib/q-analysis
mkdir -p hooks/useVisualization
```

### Core Chart Components

#### 1. Base Chart Architecture with Apple Design

```tsx
// components/visualizations/charts/BaseChart.tsx
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// Apple-style glass morphism effect
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '20px',
};

interface BaseChartProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  width,
  height,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  children,
  className,
  animate = true,
}) => {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1], // Apple's signature easing
      }}
      whileHover={{ scale: 1.02 }} // Apple-style hover effect
      style={glassStyle}
      className={className}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>{children}</g>
      </svg>
    </motion.div>
  );
};
```

#### 2. Q-Methodology Specific Visualizations

```tsx
// components/visualizations/charts/EigenvalueScreePlot.tsx
import { scaleLinear, scaleBand } from '@visx/scale';
import { Line } from '@visx/shape';
import { BaseChart } from './BaseChart';

export const EigenvalueScreePlot = ({
  eigenvalues,
  width = 600,
  height = 400,
}) => {
  // Kaiser criterion line at eigenvalue = 1
  const kaiserLine = 1.0;

  return (
    <BaseChart width={width} height={height}>
      {/* Scree plot with Kaiser criterion line */}
      {/* Shows eigenvalues to determine factor extraction */}
    </BaseChart>
  );
};

// components/visualizations/charts/FactorArrayVisualization.tsx
export const FactorArrayVisualization = ({ factorArrays, statements }) => {
  // Visualizes idealized Q-sorts for each factor
  // Shows the "perfect" participant for each factor
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {factorArrays.map((array, factorIndex) => (
        <QSortGrid
          key={factorIndex}
          statements={statements}
          placement={array}
          title={`Factor ${factorIndex + 1}`}
          readOnly={true}
        />
      ))}
    </div>
  );
};

// components/visualizations/charts/DistinguishingStatements.tsx
export const DistinguishingStatementsChart = ({
  statements,
  factors,
  pValues,
}) => {
  // Highlights statements that distinguish between factors
  // Critical for factor interpretation
  const distinguishing = statements.filter(s => pValues[s.id] < 0.01);

  return (
    <BaseChart width={800} height={600}>
      {/* Bar chart showing z-scores across factors for distinguishing statements */}
    </BaseChart>
  );
};
```

#### 3. Real-time Data Integration

```tsx
// hooks/useVisualization/useRealtimeData.ts
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';

export function useRealtimeData<T>(endpoint: string, options = {}) {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const [data, setData] = useState<T | null>(null);

  // Initial data fetch
  const { data: initialData, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await fetch(`/api/${endpoint}`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  // WebSocket subscription
  useEffect(() => {
    const unsubscribe = subscribe(`data:${endpoint}`, update => {
      setData(update);
      queryClient.setQueryData([endpoint], update);
    });
    return unsubscribe;
  }, [endpoint]);

  return { data: data || initialData, isLoading };
}
```

### Export Functionality

```typescript
// lib/visualization/export.ts
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export class ChartExporter {
  static async exportToPNG(element: HTMLElement, filename: string) {
    const canvas = await html2canvas(element, {
      backgroundColor: 'white',
      scale: 2,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  static async exportToPDF(elements: HTMLElement[], filename: string) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    // PDF generation logic
    pdf.save(`${filename}.pdf`);
  }

  static exportToExcel(data: any[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
```

---

# PART XII: PROFESSIONAL POLISH & DELIGHT 💎

## SurveyMonkey-Level UX Excellence

**Implements Phase 5: Professional Polish & Delight**

## 🎨 KEY POLISH FEATURES TO IMPLEMENT (Phase 5)

### Apple Micro-Interactions (60% → 100% Target):

**Current Achievement:** Basic hover states and transitions  
**Implementation Required:**

- ✨ **Scale animations** - Precise 1.0 → 0.95 → 1.0 with 150ms duration
- 🧲 **Magnetic hover** - 30px attraction radius with quadratic easing
- 🎯 **Physics drag-drop** - Momentum (damping: 0.7, stiffness: 300)
- 🎉 **Particle celebrations** - Lottie/Rive with 2000 particles at 60fps
- 💀 **Shimmer skeleton** - 2s wave interval with gradient animation

### SurveyMonkey Polish (60% → 100% Target):

**Current Achievement:** Basic skeleton screens and empty states defined  
**Implementation Required:**

- 📊 **Progress visualization** - Multi-step with milestone celebrations
- ❓ **Contextual help** - Smart tooltips with 500ms delay
- 🎊 **Achievement system** - Gamification with progress tracking
- 🖼️ **Custom illustrations** - SVG animations for all empty states
- ⏳ **Loading personality** - 20+ unique loading messages with rotation

### Skeleton Screen System

```tsx
// components/ui/SkeletonScreen/SkeletonScreen.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = 'bg-fill overflow-hidden';
  const variantClasses = {
    text: 'rounded h-4',
    rect: 'rounded-lg',
    circle: 'rounded-full',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    >
      {animate && (
        <motion.div
          className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};

// Composite skeleton components
export const SkeletonCard = () => (
  <div className="bg-surface rounded-xl p-6 space-y-4">
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="rect" height={200} />
    <div className="space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  </div>
);
```

### Empty State System

```tsx
// components/ui/EmptyStates/EmptyState.tsx
import { motion } from 'framer-motion';
import { Button } from '@/components/apple-ui';

interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'error' | 'offline' | 'first-time';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        className="w-64 h-64 flex items-center justify-center"
      >
        {/* SVG illustrations based on type */}
      </motion.div>

      <h3 className="mt-6 text-xl font-semibold text-text">{title}</h3>

      {description && (
        <p className="mt-2 text-text-secondary text-center max-w-md">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};
```

### Micro-Animations & Celebrations

```tsx
// components/animations/SuccessCelebration.tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export const SuccessCelebration = ({ type = 'confetti' }) => {
  useEffect(() => {
    if (type === 'confetti') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6'],
      });
    }
  }, [type]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', bounce: 0.6 }}
      className="text-6xl"
    >
      🎉
    </motion.div>
  );
};
```

### Enhanced Drag-Drop with Physics

```tsx
// components/interactions/EnhancedDragDrop.tsx
import { motion, useMotionValue, useTransform } from 'framer-motion';

export const EnhancedDragDrop = ({ children, onDrop }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  return (
    <motion.div
      drag
      dragElastic={0.2}
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      whileDrag={{ scale: 1.1, zIndex: 1000 }}
      onDragEnd={onDrop}
      style={{ x, y, rotateX, rotateY }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
};
```

---

# PART XIII: PERFORMANCE OPTIMIZATION

## Achieving 100/100 Lighthouse Scores

**Supporting All Excellence Phases (4-7)**

### Bundle Optimization

```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@visx/visx', 'framer-motion', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  webpack: (config, { dev, isServer }) => {
    // Tree shaking
    if (!dev && !isServer) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    return config;
  },
};
```

### Service Worker for Offline Support

```javascript
// public/sw.js
const CACHE_NAME = 'vqmethod-v1';
const urlsToCache = ['/', '/styles/globals.css', '/styles/tokens.css'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### Performance Monitoring

```typescript
// lib/performance.ts
export class PerformanceMonitor {
  static measureComponentRender(componentName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${componentName}-start`);
      return () => {
        performance.mark(`${componentName}-end`);
        performance.measure(
          componentName,
          `${componentName}-start`,
          `${componentName}-end`
        );
        const measure = performance.getEntriesByName(componentName)[0];
        console.log(`${componentName} render time:`, measure.duration);
      };
    }
    return () => {};
  }

  static reportWebVitals() {
    if (typeof window !== 'undefined' && 'web-vital' in window) {
      import('web-vitals').then(
        ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        }
      );
    }
  }
}
```

---

# PART XIV: PHASE 5.5 - ADVANCED UI/UX EXCELLENCE

## 🎯 Production-Grade User Experience Implementation

**Industry Best Practices from Tableau, Qualtrics, Apple, and Netflix**

---

## 11. Intelligent Onboarding System (Netflix-Inspired)

### 11.1 Personalized Researcher Onboarding

```typescript
// components/onboarding/ResearcherOnboarding.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/apple-ui';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  skippable: boolean;
  reward?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to VQMethod',
    description: 'Let\'s get you started with world-class Q-methodology research',
    component: WelcomeStep,
    skippable: false
  },
  {
    id: 'profile-setup',
    title: 'Complete Your Profile',
    description: 'Help us personalize your experience',
    component: ProfileSetupStep,
    skippable: false,
    reward: 'Profile Badge'
  },
  {
    id: 'research-interests',
    title: 'Research Interests',
    description: 'Tell us about your research focus',
    component: ResearchInterestsStep,
    skippable: true,
    reward: 'Explorer Badge'
  },
  {
    id: 'first-study',
    title: 'Create Your First Study',
    description: 'Let\'s create your first Q-methodology study together',
    component: FirstStudyStep,
    skippable: true,
    reward: 'Pioneer Badge'
  },
  {
    id: 'collaboration',
    title: 'Collaboration Settings',
    description: 'Set up how you want to work with others',
    component: CollaborationStep,
    skippable: true,
    reward: 'Team Player Badge'
  },
  {
    id: 'tour-complete',
    title: 'You\'re All Set!',
    description: 'Start your research journey',
    component: TourCompleteStep,
    skippable: false
  }
];

export function ResearcherOnboarding() {
  const { currentStep, progress, completeStep, skipStep } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  const currentStepData = ONBOARDING_STEPS[stepIndex];
  const StepComponent = currentStepData.component;

  const handleStepComplete = async () => {
    // Award achievement
    if (currentStepData.reward) {
      setAchievements([...achievements, currentStepData.reward]);

      // Celebration animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#007AFF', '#34C759', '#FF9500']
      });
    }

    await completeStep(currentStepData.id);

    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleSkip = async () => {
    if (currentStepData.skippable) {
      await skipStep(currentStepData.id);
      setStepIndex(stepIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-system-background via-secondary-background to-system-background">
      {/* Progress Bar (Netflix-style) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-quaternary-fill z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-system-blue to-system-purple"
          initial={{ width: 0 }}
          animate={{ width: `${(stepIndex / ONBOARDING_STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step Counter */}
      <div className="fixed top-4 right-4 z-40 text-sm text-secondary-label">
        Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
      </div>

      {/* Achievement Notifications */}
      <AnimatePresence>
        {achievements.length > 0 && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-20 right-4 z-40 space-y-2"
          >
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-system-green text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
              >
                <span>🏆</span>
                <span className="font-medium">{achievement} Earned!</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <StepComponent
              onComplete={handleStepComplete}
              onSkip={handleSkip}
              canSkip={currentStepData.skippable}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual Step Components
function WelcomeStep({ onComplete }: { onComplete: () => void }) {
  const [videoWatched, setVideoWatched] = useState(false);

  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-system-blue to-system-purple bg-clip-text text-transparent mb-4">
          Welcome to VQMethod
        </h1>
        <p className="text-xl text-secondary-label">
          The world's most advanced Q-methodology platform
        </p>
      </motion.div>

      {/* Welcome Video (Optional) */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
        <video
          controls
          onEnded={() => setVideoWatched(true)}
          className="w-full h-full"
          poster="/images/video-poster.jpg"
        >
          <source src="/videos/welcome.mp4" type="video/mp4" />
        </video>

        {!videoWatched && (
          <button
            onClick={() => setVideoWatched(true)}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-sm"
          >
            Skip video →
          </button>
        )}
      </div>

      <div className="space-y-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onComplete}
          disabled={!videoWatched}
        >
          Let's Get Started
        </Button>

        {!videoWatched && (
          <p className="text-sm text-secondary-label">
            Watch the video to continue or{' '}
            <button
              onClick={() => setVideoWatched(true)}
              className="text-system-blue hover:underline"
            >
              skip it
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function ResearchInterestsStep({ onComplete, onSkip, canSkip }: any) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const interests = [
    { id: 'psychology', label: 'Psychology', icon: '🧠' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'health', label: 'Health Sciences', icon: '⚕️' },
    { id: 'social', label: 'Social Sciences', icon: '👥' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'environment', label: 'Environmental', icon: '🌍' },
    { id: 'politics', label: 'Political Science', icon: '🏛️' },
    { id: 'technology', label: 'Technology', icon: '💻' }
  ];

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-label mb-2">
          What are you researching?
        </h2>
        <p className="text-secondary-label">
          Select your areas of interest (you can change these later)
        </p>
      </div>

      {/* Interest Grid (Tableau-style visual selection) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {interests.map((interest) => (
          <motion.button
            key={interest.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleInterest(interest.id)}
            className={`p-6 rounded-2xl border-2 transition-all ${
              selectedInterests.includes(interest.id)
                ? 'border-system-blue bg-system-blue/10'
                : 'border-fill hover:border-fill-secondary'
            }`}
          >
            <div className="text-3xl mb-2">{interest.icon}</div>
            <div className="text-sm font-medium">{interest.label}</div>
          </motion.button>
        ))}
      </div>

      {/* Recommendations based on selection */}
      {selectedInterests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-system-blue/10 rounded-lg border border-system-blue/20"
        >
          <p className="text-sm text-system-blue">
            Great choices! We'll recommend templates and features tailored to{' '}
            {selectedInterests.length === 1 ? 'this field' : 'these fields'}.
          </p>
        </motion.div>
      )}

      <div className="flex justify-between">
        {canSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onComplete}
          disabled={selectedInterests.length === 0}
          className="ml-auto"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
```

---

## 12. Advanced Help Center (Qualtrics-Inspired)

### 12.1 Interactive Help Center with AI Search

```typescript
// app/help/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, PlayCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Button, TextField } from '@/components/apple-ui';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  views: number;
  helpful: number;
  content: string;
  videoUrl?: string;
  relatedArticles?: string[];
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  articleCount: number;
  popularArticles: string[];
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // AI-powered search suggestions (Tableau-style)
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of VQMethod',
      icon: '🚀',
      articleCount: 12,
      popularArticles: ['quick-start', 'first-study', 'navigation']
    },
    {
      id: 'q-methodology',
      title: 'Q-Methodology Guide',
      description: 'Deep dive into Q-methodology principles',
      icon: '📊',
      articleCount: 24,
      popularArticles: ['q-sort-basics', 'factor-analysis', 'interpretation']
    },
    {
      id: 'study-design',
      title: 'Study Design',
      description: 'Create effective research studies',
      icon: '🎯',
      articleCount: 18,
      popularArticles: ['statement-creation', 'participant-recruitment', 'grid-design']
    },
    {
      id: 'data-analysis',
      title: 'Data Analysis',
      description: 'Analyze and interpret your results',
      icon: '📈',
      articleCount: 21,
      popularArticles: ['factor-extraction', 'rotation-methods', 'reporting']
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      description: 'Work with other researchers',
      icon: '👥',
      articleCount: 9,
      popularArticles: ['invite-collaborators', 'permissions', 'shared-studies']
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Solve common issues',
      icon: '🔧',
      articleCount: 15,
      popularArticles: ['common-errors', 'browser-issues', 'data-recovery']
    }
  ];

  // Simulate AI-powered search
  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);

      // Simulate API call
      const timer = setTimeout(() => {
        // Generate smart suggestions
        setSuggestions([
          `How to ${searchQuery}`,
          `${searchQuery} best practices`,
          `Troubleshooting ${searchQuery}`,
          `${searchQuery} tutorial`
        ]);

        // Mock search results
        setSearchResults([
          {
            id: '1',
            title: `Understanding ${searchQuery} in Q-Methodology`,
            category: 'q-methodology',
            readTime: '5 min',
            views: 1234,
            helpful: 89,
            content: 'Lorem ipsum...'
          }
        ]);

        setIsSearching(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-system-background to-secondary-background">
      {/* Hero Section with Search */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-system-blue rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-system-purple rounded-full filter blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-label mb-4"
          >
            How can we help you?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-secondary-label mb-8"
          >
            Search our knowledge base or browse by category
          </motion.p>

          {/* AI-Powered Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-label" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers... (Try: 'create study', 'factor analysis', 'export data')"
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black rounded-2xl border border-quaternary-fill focus:outline-none focus:ring-2 focus:ring-system-blue text-label"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-system-blue border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Search Suggestions (Tableau-style) */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-white dark:bg-black rounded-xl shadow-xl border border-quaternary-fill overflow-hidden z-10"
                >
                  <div className="p-2">
                    <div className="text-xs text-secondary-label px-3 py-1">Suggested searches</div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-quaternary-fill rounded-lg transition-colors text-sm"
                      >
                        <MagnifyingGlassIcon className="inline-block w-4 h-4 mr-2 text-secondary-label" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            <span className="text-sm text-secondary-label">Popular:</span>
            {['Create first study', 'Import data', 'Share results', 'Collaboration'].map(link => (
              <button
                key={link}
                onClick={() => setSearchQuery(link)}
                className="px-3 py-1 text-sm bg-quaternary-fill hover:bg-tertiary-fill rounded-full transition-colors"
              >
                {link}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-label mb-8">Browse by Category</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-black rounded-2xl p-6 border border-fill cursor-pointer hover:border-system-blue transition-all"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-semibold text-label mb-1">{category.title}</h3>
                <p className="text-sm text-secondary-label mb-3">{category.description}</p>
                <div className="text-xs text-tertiary-label">
                  {category.articleCount} articles
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tutorials Section */}
      <section className="py-12 px-4 bg-quaternary-fill/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-label mb-8">Video Tutorials</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Getting Started', duration: '3:45', thumbnail: '/tutorials/getting-started.jpg' },
              { title: 'Creating Your First Study', duration: '7:22', thumbnail: '/tutorials/first-study.jpg' },
              { title: 'Understanding Factor Analysis', duration: '12:15', thumbnail: '/tutorials/factor-analysis.jpg' }
            ].map((video, index) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-black rounded-xl overflow-hidden cursor-pointer group"
              >
                <div className="relative aspect-video bg-gray-200">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <PlayCircleIcon className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-label">{video.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-label mb-4">Still need help?</h2>
          <p className="text-secondary-label mb-8">
            Our support team is here to assist you
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white dark:bg-black rounded-xl border border-quaternary-fill"
            >
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-semibold text-label mb-2">Live Chat</h3>
              <p className="text-sm text-secondary-label mb-4">Get instant help from our team</p>
              <Button variant="primary" size="sm">Start Chat</Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white dark:bg-black rounded-xl border border-quaternary-fill"
            >
              <div className="text-2xl mb-3">📧</div>
              <h3 className="font-semibold text-label mb-2">Email Support</h3>
              <p className="text-sm text-secondary-label mb-4">We'll respond within 24 hours</p>
              <Button variant="primary" size="sm">Send Email</Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white dark:bg-black rounded-xl border border-quaternary-fill"
            >
              <div className="text-2xl mb-3">👥</div>
              <h3 className="font-semibold text-label mb-2">Community Forum</h3>
              <p className="text-sm text-secondary-label mb-4">Connect with other researchers</p>
              <Button variant="primary" size="sm">Visit Forum</Button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## 13. Performance Monitoring & Analytics

### 13.1 Web Vitals Tracking

```typescript
// lib/analytics/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private analyticsEndpoint = '/api/analytics/performance';

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Custom metrics
    this.measureCustomMetrics();

    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }

  private handleMetric(metric: any) {
    const { name, value, rating } = metric;

    this.metrics.set(name, {
      name,
      value: Math.round(value),
      rating,
      timestamp: Date.now(),
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}:`, value, rating);
    }
  }

  private measureCustomMetrics() {
    // Time to Interactive
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const tti = navigation.loadEventEnd - navigation.fetchStart;
        this.handleMetric({
          name: 'TTI',
          value: tti,
          rating:
            tti < 3800 ? 'good' : tti < 7300 ? 'needs-improvement' : 'poor',
        });
      }
    }

    // First Input Delay polyfill for unsupported browsers
    if (!('PerformanceEventTiming' in window)) {
      let firstInputDelay = 0;
      let firstInputTimeStamp = 0;

      ['click', 'keydown', 'mousedown', 'pointerdown', 'touchstart'].forEach(
        type => {
          addEventListener(
            type,
            event => {
              if (!firstInputTimeStamp) {
                firstInputTimeStamp = event.timeStamp;
                firstInputDelay = performance.now() - firstInputTimeStamp;

                this.handleMetric({
                  name: 'FID-Polyfill',
                  value: firstInputDelay,
                  rating:
                    firstInputDelay < 100
                      ? 'good'
                      : firstInputDelay < 300
                        ? 'needs-improvement'
                        : 'poor',
                });
              }
            },
            { once: true, passive: true }
          );
        }
      );
    }
  }

  private async sendMetrics() {
    const metricsArray = Array.from(this.metrics.values());

    if (metricsArray.length === 0) return;

    try {
      // Use sendBeacon for reliable delivery
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.analyticsEndpoint,
          JSON.stringify({
            metrics: metricsArray,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          })
        );
      } else {
        // Fallback to fetch
        await fetch(this.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: metricsArray,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }),
        });
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  // Public API
  public measureComponentRender(componentName: string): () => void {
    const startMark = `${componentName}-start`;
    performance.mark(startMark);

    return () => {
      const endMark = `${componentName}-end`;
      const measureName = `${componentName}-render`;

      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      if (measure) {
        this.handleMetric({
          name: measureName,
          value: measure.duration,
          rating:
            measure.duration < 16
              ? 'good'
              : measure.duration < 50
                ? 'needs-improvement'
                : 'poor',
        });
      }

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    };
  }

  public reportError(error: Error, context?: any) {
    // Send error to monitoring service
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
```

---

## 14. Production Deployment Configuration

### 14.1 Docker Configuration for Phase 5.5

```dockerfile
# Dockerfile.frontend
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 14.2 Nginx Configuration

```nginx
# nginx.conf - Production configuration
server {
    listen 80;
    server_name vqmethod.com www.vqmethod.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vqmethod.com www.vqmethod.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/vqmethod.crt;
    ssl_certificate_key /etc/ssl/private/vqmethod.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Next.js app
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API backend
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=10 nodelay;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
```

---

## 15. Testing Strategy for Phase 5.5

### 15.1 E2E Testing for Critical User Flows

```typescript
// e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('Complete registration and onboarding flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/auth/register');

    // Step 1: Account details
    await page.fill('[name="email"]', 'researcher@university.edu');
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="confirmPassword"]', 'SecurePassword123!');

    // Verify password strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toHaveText(
      '100%'
    );

    await page.click('[data-testid="continue-button"]');

    // Step 2: Profile setup
    await page.fill('[name="firstName"]', 'Jane');
    await page.fill('[name="lastName"]', 'Researcher');
    await page.fill('[name="institution"]', 'Test University');
    await page.click('[data-testid="discipline-psychology"]');

    await page.click('[data-testid="continue-button"]');

    // Step 3: Preferences
    await page.click('[data-testid="interest-qualitative"]');
    await page.click('[data-testid="interest-mixed-methods"]');

    await page.click('[data-testid="continue-button"]');

    // Step 4: Terms
    await page.check('[name="termsAccepted"]');
    await page.check('[name="privacyAccepted"]');

    await page.click('[data-testid="create-account-button"]');

    // Verify email verification page
    await expect(page).toHaveURL('/auth/verify-email');
    await expect(page.locator('h1')).toContainText('Verify your email');
  });

  test('Login with SSO detection', async ({ page }) => {
    await page.goto('/auth/login');

    // Type academic email
    await page.fill('[name="email"]', 'user@harvard.edu');

    // Verify SSO suggestion appears
    await expect(page.locator('[data-testid="sso-suggestion"]')).toBeVisible();
    await expect(page.locator('[data-testid="sso-suggestion"]')).toContainText(
      'Academic Institution'
    );

    // Click SSO login
    await page.click('[data-testid="sso-microsoft"]');

    // Would redirect to Microsoft login in production
  });

  test('Navigate help center and search', async ({ page }) => {
    await page.goto('/help');

    // Search functionality
    await page.fill('[data-testid="help-search"]', 'create study');

    // Verify suggestions appear
    await expect(
      page.locator('[data-testid="search-suggestions"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="suggestion-0"]')).toContainText(
      'How to create study'
    );

    // Click on a category
    await page.click('[data-testid="category-q-methodology"]');

    // Verify category page loads
    await expect(page.locator('h2')).toContainText('Q-Methodology Guide');
  });
});
```

### 15.2 Performance Testing

```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('Login page loads under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('Core Web Vitals meet targets', async ({ page }) => {
    await page.goto('/');

    // Measure Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        let cls = 0;
        let lcp = 0;
        let fid = 0;

        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              cls += entry.value;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              fid = entry.processingStart - entry.startTime;
            }
          }
        }).observe({
          entryTypes: [
            'layout-shift',
            'largest-contentful-paint',
            'first-input',
          ],
        });

        setTimeout(() => {
          resolve({ cls, lcp, fid });
        }, 5000);
      });
    });

    // Verify metrics meet targets
    expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1 (good)
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s (good)
    expect(metrics.fid).toBeLessThan(100); // FID < 100ms (good)
  });
});
```

---

## Conclusion

Phase 5.5 implementation brings VQMethod to production-grade excellence by:

1. **Authentication Excellence**: Complete auth UI with social login, SSO detection, and biometric support
2. **User Experience**: Netflix-style onboarding, personalization, and engagement
3. **Help & Support**: Qualtrics-inspired help center with AI search and video tutorials
4. **Performance**: Sub-2s load times, 100/100 Lighthouse scores, real-time monitoring
5. **Production Ready**: Docker, Nginx, SSL, security headers, and comprehensive testing

This implementation bridges the gap between your robust backend and user-facing interface, creating a truly world-class Q-methodology research platform.
