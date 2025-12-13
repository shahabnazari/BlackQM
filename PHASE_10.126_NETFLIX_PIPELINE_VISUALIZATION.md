# Phase 10.126: Netflix-Grade Pipeline Visualization

**Date**: December 12, 2025
**Status**: PLANNING
**Priority**: HIGH
**Estimated Effort**: 40-50 hours (5-6 days)

---

## Executive Summary

Complete redesign of the search pipeline visualization from basic sequential boxes to a **world-class, Apple-quality experience** that visually reveals the search architecture through:

1. **Orbital Source Constellation** - Sources orbit the search, with size/brightness indicating paper yield
2. **Particle Flow System** - Papers "flow" as animated particles from sources into the pipeline
3. **Neural Network Semantic Visualization** - AI ranking shown as neural connections
4. **Glassmorphism UI** - Modern Apple-style frosted glass aesthetic
5. **Spring Physics Animations** - Natural, delightful micro-interactions
6. **Real-time Data Streaming** - Live updates without jarring re-renders

---

## Part 1: Design Philosophy

### Inspiration Sources

| Platform | Feature | Application |
|----------|---------|-------------|
| **Apple Music** | Lyric animation flow | Paper titles flowing during discovery |
| **Netflix** | Content loading shimmer | Source card loading states |
| **Spotify** | Audio visualizer | Semantic ranking "brain waves" |
| **Linear** | Task board animations | Stage transitions |
| **Vercel** | Deployment pipeline | Stage connectivity |
| **Stripe** | Payment flow diagram | Data flow visualization |

### Core Design Principles

1. **Reveal the Magic** - Show users the sophisticated work happening behind the scenes
2. **Progressive Disclosure** - Start simple, expand on interaction
3. **Delight, Don't Distract** - Animations serve understanding, not vanity
4. **Performance First** - 60fps mandatory, GPU-accelerated
5. **Accessibility** - Reduced motion support, screen reader friendly

---

## Part 2: Component Architecture

### 2.1 Master Component: `SearchPipelineOrchestra`

```
SearchPipelineOrchestra/
├── PipelineCanvas.tsx           # Main SVG canvas for all visualizations
├── OrbitalSourceConstellation/  # Sources as orbiting nodes
│   ├── SourceOrbit.tsx          # Individual source with orbit path
│   ├── SourceNode.tsx           # Animated source bubble
│   └── OrbitPath.tsx            # SVG orbital path
├── ParticleFlowSystem/          # Paper particles
│   ├── ParticleEmitter.tsx      # Emits particles from sources
│   ├── FlowParticle.tsx         # Individual paper particle
│   └── ParticlePhysics.ts       # Physics calculations
├── SemanticBrainVisualizer/     # AI ranking visualization
│   ├── NeuralMesh.tsx           # Neural network visualization
│   ├── SynapseConnection.tsx    # Animated connections
│   └── RankingPulse.tsx         # Pulsing ranking indicator
├── PipelineStages/              # Stage nodes
│   ├── StageOrb.tsx             # Individual stage orb
│   ├── StageConnector.tsx       # Animated stage connections
│   └── StageDetail.tsx          # Expandable stage detail
├── SmartDataDisplay/            # Stats and metrics
│   ├── LiveCounter.tsx          # Animated counters
│   ├── ETAPredictor.tsx         # Intelligent time estimation
│   └── QualityMeter.tsx         # Quality score visualization
└── hooks/
    ├── useParticleSystem.ts     # Particle animation state
    ├── useOrbitalMotion.ts      # Orbital calculations
    └── usePipelineState.ts      # Pipeline state derivation
```

### 2.2 Visual Layout (Horizontal Flow)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ╔════════════════════════════════════════════╗             │
│      ●                    ║    SEARCH PIPELINE ORCHESTRA               ║             │
│    ○   ●                  ║    "machine learning healthcare"           ║             │
│  ●   ⦿   ○               ╚════════════════════════════════════════════╝             │
│    ○   ●                                                                             │
│      ●         ════════════════════════════════════════════════════════             │
│                                                                                       │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │  🧠     │───▶│  🔍     │───▶│  🧹     │───▶│  ✨     │───▶│  ✓     │           │
│  │ ANALYZE │    │ DISCOVER│    │ REFINE  │    │ RANK    │    │ READY  │           │
│  │  0.3s   │    │  ████▒  │    │  ──     │    │  ──     │    │  ──    │           │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘           │
│                      │                              │                                │
│         ╭───────────────────────╮        ╭─────────────────────╮                    │
│         │                       │        │   SEMANTIC BRAIN    │                    │
│    ◉ OpenAlex  ◉ PubMed        │        │   ┌───┐ ┌───┐ ┌───┐ │                    │
│         │  ·····papers·····▶   │        │   │ 1 │─│ 2 │─│ 3 │ │                    │
│    ◎ Crossref  ◎ arXiv         │        │   └───┘ └───┘ └───┘ │                    │
│         │                       │        │   Quick  Refined Full│                    │
│         ╰───────────────────────╯        ╰─────────────────────╯                    │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ 📄 247 papers  │  ⏱️ 3.2s elapsed  │  🎯 78% quality  │  ⚡ 2s remaining        ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Component Specifications

### 3.1 `OrbitalSourceConstellation` - The Source Galaxy

**Concept**: Sources orbit around a central "search core", with completed sources settling into position while active sources pulse and emit particles.

```typescript
interface OrbitalSourceConstellationProps {
  sources: Map<LiteratureSource, SourceStats>;
  activeSource: LiteratureSource | null;
  onSourceHover: (source: LiteratureSource | null) => void;
  onSourceClick: (source: LiteratureSource) => void;
}

// Source positioning in orbital space
const SOURCE_ORBITS = {
  fast: { radius: 80, speed: 0.02, startAngle: 0 },      // Inner orbit
  medium: { radius: 130, speed: 0.015, startAngle: 45 }, // Middle orbit
  slow: { radius: 180, speed: 0.01, startAngle: 90 },    // Outer orbit
};

// Visual states
const SOURCE_STATES = {
  pending: { opacity: 0.3, scale: 0.8, glow: false },
  searching: { opacity: 1, scale: 1, glow: true, pulse: true },
  complete: { opacity: 1, scale: 1, glow: false, showCount: true },
  error: { opacity: 0.5, scale: 0.9, glow: false, shake: true },
};
```

**Key Features**:
- Sources positioned on orbital rings by tier (fast=inner, slow=outer)
- Active sources pulse with a breathing animation
- Completed sources show paper count badge
- Hover reveals detailed stats tooltip
- Click expands source detail panel

### 3.2 `ParticleFlowSystem` - Paper Flow Animation

**Concept**: When papers are discovered, animated dots flow from the source bubble along curved paths into the pipeline funnel.

```typescript
interface ParticleFlowSystemProps {
  sourceStats: Map<LiteratureSource, SourceStats>;
  targetPosition: { x: number; y: number }; // Pipeline funnel entry
  intensity: 'low' | 'medium' | 'high';
}

interface FlowParticle {
  id: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  progress: number; // 0-1
  size: number;
  color: string;
  bezierControls: { cp1: Point; cp2: Point };
}

// Particle generation config
const PARTICLE_CONFIG = {
  particlesPerPaper: 0.5,     // 1 particle per 2 papers
  maxParticles: 100,          // Performance limit
  particleSize: { min: 2, max: 6 },
  particleSpeed: { min: 0.01, max: 0.03 },
  trailLength: 5,             // Tail effect
  colorBySource: true,        // Source-specific colors
};
```

**Animation Approach**:
1. Use `requestAnimationFrame` for smooth 60fps animation
2. Bezier curves for natural flow paths
3. Particle pooling for performance
4. Trail effect using previous positions
5. Fade out as particles reach destination

### 3.3 `SemanticBrainVisualizer` - AI Ranking Display

**Concept**: A neural network visualization showing the 3-tier semantic ranking process as interconnected nodes with pulsing synapses.

```typescript
interface SemanticBrainVisualizerProps {
  currentTier: SemanticTierName | null;
  tierStats: Map<SemanticTierName, SemanticTierStats>;
  papersProcessed: number;
  totalPapers: number;
  isProcessing: boolean;
}

// Tier visualization config
const TIER_VISUALIZATION = {
  immediate: {
    position: { x: 0, y: 0 },
    color: '#10B981',  // Green
    label: 'Quick',
    description: 'Top 50 most relevant',
    icon: Zap,
  },
  refined: {
    position: { x: 120, y: 0 },
    color: '#3B82F6',  // Blue
    label: 'Refined',
    description: 'Extended to 200',
    icon: Target,
  },
  complete: {
    position: { x: 240, y: 0 },
    color: '#8B5CF6',  // Purple
    label: 'Complete',
    description: 'Full 600 analysis',
    icon: Brain,
  },
};
```

**Visual Features**:
- Three interconnected nodes representing tiers
- Animated "synapses" (lines) showing data flow
- Pulsing glow on active tier
- Progress ring around each node
- Paper count inside completed nodes
- Cache hit indicator (lightning bolt)

### 3.4 `StageOrb` - Pipeline Stage Component

**Concept**: Each pipeline stage is a floating orb with glassmorphism styling, animated progress ring, and expandable detail panel.

```typescript
interface StageOrbProps {
  stage: PipelineStage;
  status: 'pending' | 'active' | 'complete' | 'error';
  progress: number;
  duration?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // Substage content
}

// Stage configuration
const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'analyze',
    name: 'Analyze',
    icon: Brain,
    description: 'Understanding your query',
    color: 'from-blue-500 to-cyan-400',
    substages: ['spell-check', 'methodology', 'expansion'],
  },
  {
    id: 'discover',
    name: 'Discover',
    icon: Search,
    description: 'Searching global databases',
    color: 'from-green-500 to-emerald-400',
    substages: [], // Dynamic from sources
  },
  {
    id: 'refine',
    name: 'Refine',
    icon: Filter,
    description: 'Removing duplicates',
    color: 'from-yellow-500 to-orange-400',
    substages: ['dedupe', 'quality-filter'],
  },
  {
    id: 'rank',
    name: 'Rank',
    icon: Sparkles,
    description: 'AI-powered scoring',
    color: 'from-purple-500 to-pink-400',
    substages: ['tier-1', 'tier-2', 'tier-3'],
  },
  {
    id: 'ready',
    name: 'Ready',
    icon: CheckCircle,
    description: 'Papers ready',
    color: 'from-green-500 to-teal-400',
    substages: [],
  },
];
```

**Visual Features**:
- Glassmorphism background with subtle blur
- Circular progress ring around orb
- Icon animates when active (spin/pulse)
- Checkmark badge on complete
- Shake animation on error
- Click expands substage detail

### 3.5 `LiveCounter` - Animated Statistics

**Concept**: Numbers animate smoothly when they change, using spring physics for a satisfying feel.

```typescript
interface LiveCounterProps {
  value: number;
  label: string;
  icon: LucideIcon;
  format?: 'number' | 'duration' | 'percentage';
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Animation config
const COUNTER_SPRING = {
  stiffness: 100,
  damping: 15,
  mass: 1,
};
```

**Visual Features**:
- Odometer-style number rolling
- Color flash on significant change
- Trend indicator (↑↓) with color
- Sparkline mini-chart option

---

## Part 4: Technical Implementation

### 4.1 Performance Optimization

```typescript
// GPU-accelerated transforms only
const GPU_SAFE_PROPS = ['transform', 'opacity'];

// Particle system using Web Workers
const particleWorker = new Worker('/workers/particle-physics.js');

// Canvas rendering for particles (not DOM)
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear and redraw particles
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => drawParticle(ctx, p));
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
};
```

### 4.2 Accessibility

```typescript
// Reduced motion support
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    mq.addEventListener('change', (e) => setReducedMotion(e.matches));
  }, []);

  return reducedMotion;
};

// ARIA live regions for screen readers
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {`Search progress: ${percent}%. ${sourcesComplete} of ${sourcesTotal} sources complete. ${papersFound} papers found.`}
</div>
```

### 4.3 State Management

```typescript
// Derive pipeline state from WebSocket state
const usePipelineState = (wsState: SearchStreamState) => {
  return useMemo(() => ({
    stages: deriveStageStates(wsState),
    sources: deriveSourcePositions(wsState.sourceStats),
    particles: generateParticleQueue(wsState),
    metrics: {
      papers: wsState.papersFound,
      elapsed: wsState.elapsedMs,
      quality: calculateQuality(wsState),
      eta: estimateRemaining(wsState),
    },
  }), [wsState]);
};
```

---

## Part 5: Implementation Plan

### Day 1: Foundation (8 hours)

1. **Create Component Structure**
   - [ ] `SearchPipelineOrchestra.tsx` - Main container
   - [ ] `PipelineCanvas.tsx` - SVG canvas wrapper
   - [ ] `usePipelineState.ts` - State derivation hook
   - [ ] Types and interfaces

2. **Implement StageOrb**
   - [ ] Glassmorphism styling
   - [ ] Progress ring animation
   - [ ] Status states (pending/active/complete/error)
   - [ ] Expand/collapse interaction

### Day 2: Source Constellation (8 hours)

3. **OrbitalSourceConstellation**
   - [ ] Orbital positioning algorithm
   - [ ] Source node component
   - [ ] Tier-based orbit assignment
   - [ ] Hover/click interactions

4. **Source Animations**
   - [ ] Pulse animation for searching
   - [ ] Completion celebration micro-animation
   - [ ] Error shake animation
   - [ ] Paper count badge animation

### Day 3: Particle System (10 hours)

5. **ParticleFlowSystem**
   - [ ] Canvas-based rendering
   - [ ] Bezier curve path calculation
   - [ ] Particle pooling
   - [ ] Trail effect

6. **Particle Physics**
   - [ ] Spawn rate based on paper discovery
   - [ ] Size variation
   - [ ] Color by source tier
   - [ ] Performance optimization

### Day 4: Semantic Brain (8 hours)

7. **SemanticBrainVisualizer**
   - [ ] Three-node neural network layout
   - [ ] Animated synapse connections
   - [ ] Progress rings per tier
   - [ ] Cache hit indicators

8. **Tier Transitions**
   - [ ] Tier completion celebration
   - [ ] Re-ranking visualization
   - [ ] Quality improvement indicator

### Day 5: Smart Data & Polish (8 hours)

9. **LiveCounter & Metrics**
   - [ ] Animated counter component
   - [ ] ETA predictor with context
   - [ ] Quality meter visualization

10. **Polish & Integration**
    - [ ] Connect to StreamingSearchSection
    - [ ] Accessibility audit
    - [ ] Performance profiling
    - [ ] Reduced motion fallback

### Day 6: Testing & Documentation (8 hours)

11. **Testing**
    - [ ] Unit tests for hooks
    - [ ] Visual regression tests
    - [ ] Performance benchmarks
    - [ ] Accessibility testing

12. **Documentation**
    - [ ] Component storybook stories
    - [ ] Usage documentation
    - [ ] Animation configuration guide

---

## Part 6: Visual Reference

### Color Palette

```typescript
const PIPELINE_COLORS = {
  // Stage colors
  analyze: { primary: '#3B82F6', secondary: '#93C5FD' },   // Blue
  discover: { primary: '#10B981', secondary: '#6EE7B7' },  // Green
  refine: { primary: '#F59E0B', secondary: '#FCD34D' },    // Amber
  rank: { primary: '#8B5CF6', secondary: '#C4B5FD' },      // Purple
  ready: { primary: '#06B6D4', secondary: '#67E8F9' },     // Cyan

  // Source tiers
  fast: '#22C55E',    // Green
  medium: '#EAB308',  // Yellow
  slow: '#F97316',    // Orange

  // Semantic tiers
  immediate: '#10B981',  // Green
  refined: '#3B82F6',    // Blue
  complete: '#8B5CF6',   // Purple

  // UI
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  particle: '#FFFFFF',
};
```

### Typography

```typescript
const TYPOGRAPHY = {
  stageLabel: 'text-sm font-semibold tracking-wide',
  metric: 'text-2xl font-bold tabular-nums',
  metricLabel: 'text-xs text-gray-500 uppercase tracking-wider',
  tooltip: 'text-xs',
};
```

---

## Part 7: Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Paint** | <100ms | Lighthouse |
| **Animation FPS** | 60fps | Chrome DevTools |
| **Largest Contentful Paint** | <500ms | Web Vitals |
| **Accessibility Score** | 100 | Lighthouse |
| **User Delight** | "Wow" reaction | User testing |
| **Information Clarity** | Users understand pipeline | User testing |
| **Reduced Motion Support** | Full fallback | Manual test |

---

## Part 8: File Structure

```
frontend/app/(researcher)/discover/literature/components/
└── PipelineOrchestra/
    ├── index.ts
    ├── SearchPipelineOrchestra.tsx
    ├── PipelineCanvas.tsx
    ├── components/
    │   ├── StageOrb.tsx
    │   ├── StageConnector.tsx
    │   ├── OrbitalSourceConstellation.tsx
    │   ├── SourceNode.tsx
    │   ├── ParticleFlowSystem.tsx
    │   ├── SemanticBrainVisualizer.tsx
    │   ├── LiveCounter.tsx
    │   ├── ETAPredictor.tsx
    │   └── QualityMeter.tsx
    ├── hooks/
    │   ├── usePipelineState.ts
    │   ├── useParticleSystem.ts
    │   ├── useOrbitalMotion.ts
    │   └── useReducedMotion.ts
    ├── utils/
    │   ├── bezier.ts
    │   ├── physics.ts
    │   └── colors.ts
    ├── constants.ts
    ├── types.ts
    └── __tests__/
        ├── SearchPipelineOrchestra.test.tsx
        ├── StageOrb.test.tsx
        └── ParticleFlowSystem.test.tsx
```

---

## Conclusion

This Phase 10.126 plan delivers a **truly revolutionary** pipeline visualization that:

1. **Reveals the Architecture** - Users see exactly how their search is processed
2. **Delights Users** - Apple-quality animations create a premium feel
3. **Performs Flawlessly** - 60fps animations with GPU acceleration
4. **Accessible to All** - Full reduced motion support and screen reader friendly
5. **Integrates Seamlessly** - Drops into existing WebSocket infrastructure

**Total Estimated Effort**: 40-50 hours (5-6 days)

**Key Deliverables**:
- 10+ new components
- 4 custom hooks
- Canvas-based particle system
- Full test coverage
- Storybook documentation

---

**Plan Status**: READY FOR APPROVAL
**Next Step**: Begin Day 1 implementation upon approval
