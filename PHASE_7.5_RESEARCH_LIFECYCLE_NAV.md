# PHASE 7.5: Research Lifecycle Navigation System

**Duration:** 10-12 days  
**Priority:** CRITICAL (Improves entire UX)  
**Type Safety:** MANDATORY ZERO ERRORS  
**Status:** 🔴 Not Started  
**Prerequisites:** None (Can run parallel with other phases)

## 🎯 Phase Success Criteria

### MUST HAVE (Days 1-8)
✅ Double toolbar navigation working  
✅ All 10 research phases implemented  
✅ Secondary toolbar contextual display  
✅ Existing features mapped correctly  
✅ Mobile responsive navigation  
✅ Zero TypeScript errors maintained  
✅ 40 tests passing  

### NICE TO HAVE (Days 9-12)
✅ AI navigation assistant  
✅ Guided workflows  
✅ Progress tracking  
✅ Keyboard shortcuts  
✅ Rich animations  
✅ User preferences  

## 📅 Implementation Timeline

### Day 0: Planning & Setup
**Morning:**
- [ ] Review navigation architecture document
- [ ] Create Figma/design mockups
- [ ] Set up feature flags
- [ ] Create type definitions

**Afternoon:**
- [ ] Set up navigation state store
- [ ] Create base component structure
- [ ] Configure routing strategy
- [ ] Run baseline typecheck

**Day 0 Deliverable:** ✅ Design approved, types defined

---

### Days 1-2: Core Navigation Components

#### Day 1: Primary Toolbar
**Morning:**
- [ ] Create `/frontend/components/navigation/ResearchToolbar.tsx`
```typescript
interface ResearchPhase {
  id: string;
  label: string;
  icon: ComponentType;
  color: string;
  description: string;
  children: NavItem[];
  progress?: number;
  isLocked?: boolean;
}
```
- [ ] Implement phase buttons with icons
- [ ] Add color theming system
- [ ] Create hover states and tooltips

**Afternoon:**
- [ ] Add progress indicators
- [ ] Implement phase locking logic
- [ ] Create responsive breakpoints
- [ ] Write 5 unit tests

**Day 1 EOD Check:**
```bash
npm run typecheck | grep "ResearchToolbar"
# Fix any type errors immediately
```

#### Day 2: Secondary Toolbar
**Morning:**
- [ ] Create `/frontend/components/navigation/ContextualToolbar.tsx`
- [ ] Implement slide-down animation
- [ ] Add tool buttons and badges
- [ ] Create AI indicator badges

**Afternoon:**
- [ ] Wire phase-to-tools mapping
- [ ] Add keyboard navigation
- [ ] Implement quick actions section
- [ ] Write 5 unit tests

**Day 2 EOD Check:**
```bash
npm run typecheck | grep "navigation"
# Must maintain ≤47 errors
```

---

### Days 3-5: Phase Implementation

#### Day 3: Discovery & Design Phases
**Morning - DISCOVER Phase:**
- [ ] Create `/frontend/app/(researcher)/discover/page.tsx`
- [ ] Build Literature Search UI
- [ ] Add Reference Manager
- [ ] Create Knowledge Map component

**Afternoon - DESIGN Phase:**
- [ ] Create `/frontend/app/(researcher)/design/page.tsx`
- [ ] Build Research Question wizard
- [ ] Add Hypothesis Builder
- [ ] Create Methodology selector

**Day 3 Deliverable:** ✅ First 2 phases functional

#### Day 4: Build & Recruit Phases
**Morning - BUILD Phase:**
- [ ] Integrate existing study creation
- [ ] Map grid builder to Build phase
- [ ] Connect questionnaire builder
- [ ] Wire AI tools

**Afternoon - RECRUIT Phase:**
- [ ] Create participant pool view
- [ ] Build invitation system
- [ ] Add screening setup
- [ ] Create scheduling interface

**Day 4 Deliverable:** ✅ 4 phases connected

#### Day 5: Collect & Analyze Phases
**Morning - COLLECT Phase:**
- [ ] Map participant flow
- [ ] Create session monitor
- [ ] Add progress tracker
- [ ] Build quality control panel

**Afternoon - ANALYZE Phase:**
- [ ] Connect Q-methodology analysis
- [ ] Wire statistical tools
- [ ] Add AI insights
- [ ] Create comparison tools

**Day 5 Deliverable:** ✅ 6 phases integrated

---

### Days 6-7: Remaining Phases

#### Day 6: Visualize & Interpret
**Morning - VISUALIZE Phase:**
- [ ] Connect visualization components
- [ ] Add dashboard builder
- [ ] Wire chart library
- [ ] Create export options

**Afternoon - INTERPRET Phase:**
- [ ] Build interpretation wizard
- [ ] Add AI narratives
- [ ] Create theme extraction
- [ ] Wire consensus analysis

**Day 6 Deliverable:** ✅ 8 phases complete

#### Day 7: Report & Archive
**Morning - REPORT Phase:**
- [ ] Create `/frontend/app/(researcher)/report/page.tsx`
- [ ] Build report generator
- [ ] Add export formats
- [ ] Create collaboration tools

**Afternoon - ARCHIVE Phase:**
- [ ] Create `/frontend/app/(researcher)/archive/page.tsx`
- [ ] Build study archive
- [ ] Add versioning system
- [ ] Create sharing options

**Day 7 Deliverable:** ✅ All 10 phases implemented

---

### Day 8: Integration & Polish

**Morning:**
- [ ] Complete phase-to-phase navigation
- [ ] Add breadcrumb system
- [ ] Implement user preferences
- [ ] Create onboarding flow

**Afternoon:**
- [ ] Polish animations
- [ ] Optimize performance
- [ ] Add loading states
- [ ] Fix any UI issues

**Day 8 EOD Master Check:**
```bash
# Full navigation system check
npm run typecheck
npm run test:navigation
npm run build

# Must pass all checks
```

---

### Days 9-10: Advanced Features (If Time)

#### Day 9: AI & Smart Features
**Morning:**
- [ ] Create Navigation Assistant
- [ ] Add smart suggestions
- [ ] Build guided workflows
- [ ] Create template system

**Afternoon:**
- [ ] Add collaborative features
- [ ] Implement shortcuts
- [ ] Create help system
- [ ] Add analytics tracking

#### Day 10: Mobile & Accessibility
**Morning:**
- [ ] Perfect mobile navigation
- [ ] Add gesture support
- [ ] Create compact views
- [ ] Test on devices

**Afternoon:**
- [ ] WCAG AAA compliance
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] High contrast mode

---

### Days 11-12: Testing & Deployment

#### Day 11: Comprehensive Testing
**Morning:**
- [ ] Run E2E tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Cross-browser testing

**Afternoon:**
- [ ] Fix critical bugs
- [ ] Update documentation
- [ ] Create training materials
- [ ] Prepare rollout plan

#### Day 12: Gradual Rollout
**Morning:**
- [ ] Deploy with feature flag (5% users)
- [ ] Monitor metrics
- [ ] Gather feedback
- [ ] Fix urgent issues

**Afternoon:**
- [ ] Expand to 25% users
- [ ] Create feedback form
- [ ] Document lessons learned
- [ ] Plan full rollout

---

## 🏗️ Technical Implementation

### State Management
```typescript
// frontend/lib/stores/navigation.store.ts
interface NavigationStore {
  currentPhase: ResearchPhase;
  currentTool: string;
  phaseProgress: Map<string, number>;
  isSecondaryOpen: boolean;
  userPreferences: NavPreferences;
  
  // Actions
  setPhase: (phase: string) => void;
  setTool: (tool: string) => void;
  updateProgress: (phase: string, progress: number) => void;
  toggleSecondary: () => void;
}
```

### Component Structure
```
frontend/components/navigation/
├── ResearchToolbar/
│   ├── ResearchToolbar.tsx
│   ├── PhaseButton.tsx
│   ├── ProgressIndicator.tsx
│   └── PhaseIcon.tsx
├── ContextualToolbar/
│   ├── ContextualToolbar.tsx
│   ├── ToolButton.tsx
│   ├── QuickActions.tsx
│   └── AIBadge.tsx
├── NavigationAssistant/
│   ├── Assistant.tsx
│   ├── Suggestions.tsx
│   └── GuidedMode.tsx
└── index.ts
```

### Routing Structure
```
app/(researcher)/
├── discover/
│   ├── literature/
│   ├── references/
│   └── knowledge-map/
├── design/
│   ├── questions/
│   ├── hypothesis/
│   └── methodology/
├── build/
│   ├── study-setup/
│   ├── grid-design/
│   └── questionnaires/
├── recruit/
│   ├── participants/
│   ├── invitations/
│   └── screening/
├── collect/
│   ├── sessions/
│   ├── progress/
│   └── quality/
├── analyze/
│   ├── q-analysis/
│   ├── statistics/
│   └── insights/
├── visualize/
│   ├── charts/
│   ├── dashboards/
│   └── export/
├── interpret/
│   ├── narratives/
│   ├── themes/
│   └── synthesis/
├── report/
│   ├── generator/
│   ├── formats/
│   └── collaboration/
└── archive/
    ├── studies/
    ├── versions/
    └── sharing/
```

## 🎨 UI Components Needed

### New Components to Build
1. **ResearchToolbar** - Main phase navigation
2. **ContextualToolbar** - Secondary tools
3. **PhaseButton** - Individual phase button
4. **ProgressRing** - Circular progress indicator
5. **ToolButton** - Secondary toolbar button
6. **NavigationAssistant** - AI helper
7. **PhaseTransition** - Animation wrapper
8. **MobileNavSheet** - Mobile navigation
9. **KeyboardShortcuts** - Shortcut handler
10. **OnboardingOverlay** - First-time user guide

### Existing Components to Update
1. **UnifiedNavigation** - Add toggle for new/old nav
2. **Breadcrumbs** - Integrate with phases
3. **CommandPalette** - Add phase commands
4. **GlobalSearch** - Index phase content

## 📊 Success Metrics

### Technical Metrics
- Zero new TypeScript errors
- 40+ tests passing
- <100ms navigation transitions
- <2s page load time
- 95% code coverage

### User Metrics
- 90% task completion rate
- <3 clicks to any feature
- 50% reduction in navigation time
- 80% user satisfaction score

## 🚨 Risk Mitigation

### If Behind Schedule
1. Drop Days 9-10 advanced features
2. Simplify to single toolbar initially
3. Launch with 5 core phases only
4. Use existing navigation as fallback

### If Users Confused
1. Add prominent toggle switch
2. Create video tutorials
3. Show guided tour on first use
4. Provide classic mode option

### If Performance Issues
1. Lazy load secondary toolbars
2. Use virtual scrolling for long lists
3. Implement aggressive caching
4. Reduce animation complexity

## 📝 Daily Error Prevention

### Type Safety Checklist
- [ ] All props interfaces defined
- [ ] No `any` types used
- [ ] All async functions typed
- [ ] Event handlers properly typed
- [ ] Store actions typed
- [ ] API responses typed

### Common Patterns to Use
```typescript
// Always type navigation props
interface NavProps {
  phase: ResearchPhase;
  onPhaseChange: (phase: ResearchPhase) => void;
  isLocked?: boolean;
}

// Type route parameters
interface PhaseParams {
  phase: string;
  tool?: string;
  action?: string;
}

// Type store selectors
const useNavigation = (): NavigationStore => {
  return useStore(state => state.navigation);
};
```

## ✅ Definition of Done

### Functionality
- [ ] All 10 research phases accessible
- [ ] Secondary toolbar shows correct tools
- [ ] Navigation works on all devices
- [ ] Keyboard shortcuts functional
- [ ] Progress tracking accurate

### Quality
- [ ] Zero new TypeScript errors
- [ ] 40+ tests passing
- [ ] WCAG AA compliant
- [ ] Performance budgets met
- [ ] Documentation complete

### User Experience
- [ ] Intuitive phase progression
- [ ] Clear visual hierarchy
- [ ] Smooth animations
- [ ] Helpful tooltips
- [ ] No dead ends

## 🎯 Impact

This navigation system will:
1. **Transform UX** - From feature-hunting to guided journey
2. **Increase Adoption** - Users discover features naturally
3. **Reduce Support** - Self-explanatory interface
4. **Enable Growth** - Easy to add new features
5. **Competitive Edge** - Industry-leading research platform UX

**Recommendation:** Add this as Phase 7.5 in PHASE_TRACKER.md immediately after Phase 7 (Unified Analysis Hub) as it provides the foundational navigation for all features.