# Research Lifecycle Double Toolbar Navigation Architecture

## 🎯 Vision
Create an intuitive, research-lifecycle-driven navigation system that guides users through their entire research journey while integrating all platform features seamlessly.

## 📊 Standard Research Lifecycle Phases

Based on academic research methodology, the complete research lifecycle consists of:

1. **Literature Review & Background Research**
2. **Research Question/Hypothesis Formation**
3. **Study Design & Methodology Selection**
4. **Data Collection Instrument Design**
5. **Participant Recruitment & Sampling**
6. **Data Collection & Field Work**
7. **Data Processing & Cleaning**
8. **Data Analysis & Statistics**
9. **Data Visualization & Exploration**
10. **Interpretation & Findings**
11. **Report Writing & Dissemination**
12. **Archive & Share**

## 🏗️ Double Toolbar Architecture

### Primary Toolbar (Research Phases)
The main navigation bar shows umbrella research lifecycle phases. Each phase is an actionable gateway to related tools and features.

### Secondary Toolbar (Phase-Specific Tools)
When a primary phase is selected, a contextual secondary toolbar appears below with specific tools and actions for that phase.

## 📱 Navigation Structure

### 🔍 1. DISCOVER
**Primary Label:** "Discover"  
**Description:** Literature review & research foundation  
**Icon:** 📚 BookOpenIcon  
**Color Accent:** Purple (#8B5CF6)
**Coverage:** 70% after Phase 9 implementation

**Secondary Toolbar Items:**
- **Literature Search** → AI-powered paper search
- **Reference Manager** → Import/organize citations
- **Knowledge Map** → Visual concept mapping
- **Research Gaps** → AI gap analysis tool
- **Prior Studies** → Browse existing Q-studies
- **Theoretical Framework** → Framework builder

**Backend Services (Phase 9):**
- `literature.service.ts` - Paper search & caching
- `literature.module.ts` - Module configuration
- PostgreSQL caching for papers

**Frontend Route:**
- `/app/(researcher)/literature/` - Main interface

---

### 💡 2. DESIGN
**Primary Label:** "Design"  
**Description:** Formulate questions & methodology  
**Icon:** 💡 LightBulbIcon  
**Color Accent:** Yellow (#F59E0B)

**Secondary Toolbar Items:**
- **Research Questions** → Question formulation wizard
- **Hypothesis Builder** → Interactive hypothesis tool
- **Methodology Selection** → Q-method vs others comparison
- **Study Protocol** → Protocol designer
- **Ethics Review** → IRB checklist & templates
- **Power Analysis** → Sample size calculator

**Current Features to Integrate:**
- Part of `/studies/create` (Step 1)

---

### 🛠️ 3. BUILD
**Primary Label:** "Build"  
**Description:** Create study instruments  
**Icon:** 🛠️ WrenchIcon  
**Color Accent:** Blue (#3B82F6)
**Coverage:** 90% (Well established)

**Secondary Toolbar Items:**
- **Study Setup** → Basic study configuration
- **Q-Grid Designer** → Grid configuration tool
- **Statement Generator** → AI-powered stimuli creation
- **Questionnaire Builder Pro** → Advanced 3-column builder (Phase 8.3)
- **Pre-Screening Designer** → Qualification questionnaire (Phase 8.2)
- **Post-Survey Builder** → Post Q-sort questions (Phase 8.2)
- **Consent Forms** → Digital consent creator
- **Instructions** → Participant guidance editor

**Backend Services (Existing):**
- `study.service.ts` - Core study management
- `statement.service.ts` - Statement handling
- `ai/statement-generator.service.ts` - AI generation
- `ai/questionnaire-generator.service.ts` - Survey AI
- `screening.service.ts` - Pre-screening logic (Phase 8.2)
- `post-survey.service.ts` - Post-survey data (Phase 8.2)

**Frontend Routes:**
- `/app/(researcher)/studies/create/` - Main builder
- `/app/(researcher)/questionnaire/builder-pro/` - Advanced builder (Phase 8.3)
- ~~`/ai-tools`~~ - DEPRECATED (redistributed to phases)

---

### 👥 4. RECRUIT
**Primary Label:** "Recruit"  
**Description:** Find & manage participants  
**Icon:** 👥 UsersIcon  
**Color Accent:** Green (#10B981)
**Coverage:** 95% after Phase 8.2 implementation

**Secondary Toolbar Items:**
- **Participant Pool** → Manage participant database
- **Invitations** → Send study invites
- **Pre-Screening Questionnaire** → Qualification screening (Phase 8.2)
- **Screening Results** → View pass/fail outcomes
- **Scheduling** → Session scheduling
- **Compensation** → Payment tracking
- **Demographics** → Participant analytics

**Backend Services:**
- `participant.service.ts` - Core participant management
- `screening.service.ts` - Pre-screening qualification (Phase 8.2)
- `scheduling.service.ts` - Appointments (Phase 7 Day 7)
- `email.service.ts` - Invitations & reminders

**Frontend Routes:**
- `/app/(researcher)/recruitment/` - Enhanced center (Phase 7)
- `/app/(researcher)/participants/` - Current basic list
- `/app/(participant)/study/pre-screening/` - Screening questionnaire (Phase 8.2)

---

### 📊 5. COLLECT
**Primary Label:** "Collect"  
**Description:** Gather research data  
**Icon:** 📊 ClipboardDocumentListIcon  
**Color Accent:** Teal (#14B8A6)
**Coverage:** 95% after Phase 8.2 implementation

**Secondary Toolbar Items:**
- **Active Sessions** → Live data collection monitor
- **Q-Sort Interface** → Participant sorting view
- **Post-Q-Sort Survey** → Supplementary data collection (Phase 8.2)
- **Survey Responses** → Track all questionnaires
- **Progress Tracker** → Completion statistics
- **Quality Control** → Data quality checks
- **Export Raw Data** → Download options

**Backend Services:**
- `post-survey.service.ts` - Post-survey responses (Phase 8.2)
- `session.service.ts` - Active session management
- `qsort.service.ts` - Q-sort data collection

**Frontend Routes:**
- `/study/[token]` - Participant flow
- `/join` - Study entry
- `/app/(participant)/study/post-survey/` - Post-Q-sort questionnaire (Phase 8.2)
- `/app/(researcher)/data/collection/` - Monitor active collection

---

### 🔬 6. ANALYZE
**Primary Label:** "Analyze"  
**Description:** Statistical analysis & patterns  
**Icon:** 🔬 BeakerIcon  
**Color Accent:** Indigo (#6366F1)
**Coverage:** 98% (Excellent - Hub architecture complete)

**Secondary Toolbar Items:**
- **Analysis Hub** → Unified analysis center (PRIMARY)
- **Q-Analysis** → Factor analysis suite
- **Statistical Tests** → Significance testing
- **Factor Rotation** → Rotation tools
- **Correlation Matrix** → Relationship analysis
- **AI Insights** → Pattern detection

**Backend Services (Comprehensive):**
- `analysis/q-analysis.service.ts` - Core Q-methodology
- `analysis/factor-extraction.service.ts` - Factor analysis
- `analysis/rotation-engine.service.ts` - Rotation tools
- `analysis/statistics.service.ts` - Statistical tests
- `analysis/hub.service.ts` - Unified data access (Phase 7)
- `ai/response-analyzer.service.ts` - AI insights

**Frontend Routes (Consolidated):**
- `/app/(researcher)/analysis/hub/[id]/` - PRIMARY entry point
- `/app/(researcher)/analysis/q-methodology/` - Specialized tools
- `/app/(researcher)/analysis/metrics/` - Renamed from /analytics
- ~~`/analysis`~~ - DEPRECATED (redirect to hub)
- ~~`/analytics`~~ - DEPRECATED (moved to /analysis/metrics)

---

### 📈 7. VISUALIZE
**Primary Label:** "Visualize"  
**Description:** Create charts & visualizations  
**Icon:** 📈 ChartBarIcon  
**Color Accent:** Pink (#EC4899)
**Coverage:** 85% after Phase 7 Day 4

**Secondary Toolbar Items:**
- **Factor Arrays** → Array visualizations
- **Loading Plots** → Factor loading charts
- **Scree Plot** → Eigenvalue visualization
- **Heat Maps** → Correlation heat maps
- **Distribution Charts** → Response distributions
- **Custom Dashboards** → Dashboard builder

**Backend Services:**
- `visualization.service.ts` - Server-side rendering (Phase 7 Day 4)
- `analysis/cache.service.ts` - Chart caching
- WebSocket for real-time updates

**Frontend Routes:**
- `/app/(researcher)/visualize/` - Main visualization center
- Part of `/analysis/hub/[id]/` - Integrated in hub
- ~~`/visualization-demo`~~ - DEPRECATED (moved to /visualize)

---

### 📝 8. INTERPRET
**Primary Label:** "Interpret"  
**Description:** Extract meaning & insights  
**Icon:** 📝 DocumentTextIcon  
**Color Accent:** Orange (#FB923C)
**Coverage:** 80% after Phase 8 implementation

**Secondary Toolbar Items:**
- **Factor Interpretation** → AI-assisted narratives
- **Consensus Analysis** → Agreement patterns
- **Distinguishing Views** → Unique perspectives
- **Theme Extraction** → Qualitative themes
- **Quote Mining** → Participant comments
- **Synthesis** → Cross-factor synthesis

**Backend Services (Phase 8):**
- `interpretation.service.ts` - Wrapper for AI services
- `ai/bias-detector.service.ts` - Bias analysis
- `ai/response-analyzer.service.ts` - Pattern detection
- Integration with existing AI services

**Frontend Routes:**
- `/app/(researcher)/interpretation/[studyId]/` - Workspace (Phase 8)
- `InterpretationWorkspace` component
- `interpretation.store.ts` for state management

---

### 📄 9. REPORT
**Primary Label:** "Report"  
**Description:** Document & share findings  
**Icon:** 📄 DocumentIcon  
**Color Accent:** Red (#EF4444)
**Coverage:** 70% after Phase 10 implementation

**Secondary Toolbar Items:**
- **Report Generator** → Automated reports
- **Executive Summary** → AI-generated summary
- **Publication Export** → Journal formats (APA, MLA, Chicago)
- **Presentation Mode** → Slide generator
- **Infographics** → Visual summaries
- **Collaboration** → Co-author tools

**Backend Services (Phase 10):**
- `report-generator.service.ts` - Report generation engine
- `report.module.ts` - Module configuration
- PDF generation with puppeteer
- Integration with `literature.service.ts` for references
- Integration with `analysis.service.ts` for results

**Frontend Routes:**
- `/app/(researcher)/reports/[studyId]/` - Report builder (Phase 10)
- `ReportBuilder` component with drag-and-drop
- `report.store.ts` for state management

---

### 🗄️ 10. ARCHIVE
**Primary Label:** "Archive"  
**Description:** Store & share research  
**Icon:** 🗄️ ArchiveBoxIcon  
**Color Accent:** Gray (#6B7280)
**Coverage:** 75% after Phase 11 implementation

**Secondary Toolbar Items:**
- **Study Archive** → Completed studies
- **Data Repository** → Long-term storage
- **DOI Assignment** → Persistent identifiers
- **Public Sharing** → Open data options
- **Replication Package** → Reproducibility tools
- **Version Control** → Study versioning

**Backend Services (Phase 11):**
- `archive.service.ts` - Archive management
- `version-control.service.ts` - Git-like versioning
- `archive.module.ts` - Module configuration
- S3/MinIO for snapshot storage
- Integration with `study.service.ts`

**Frontend Routes:**
- `/app/(researcher)/archive/[studyId]/` - Archive manager (Phase 11)
- `ArchiveManager` component with version timeline
- `archive.store.ts` for state management
- JSON diff viewer for study changes

---

## 🎨 UI/UX Implementation Details

### Visual Design

```typescript
// Primary Toolbar Component Structure
interface PrimaryNavItem {
  id: string;
  label: string;
  icon: IconComponent;
  color: string;
  phase: ResearchPhase;
  description: string;
  progress?: number; // 0-100 completion
  isActive: boolean;
  isAvailable: boolean;
  children: SecondaryNavItem[];
}

// Secondary Toolbar Component Structure  
interface SecondaryNavItem {
  id: string;
  label: string;
  path: string;
  icon?: IconComponent;
  badge?: string; // "NEW", "BETA", count
  shortcut?: string; // Keyboard shortcut
  aiEnabled?: boolean;
  requiredFeatures?: string[];
}
```

### Layout Structure

```jsx
<NavigationContainer>
  {/* Primary Research Lifecycle Bar */}
  <PrimaryToolbar>
    {phases.map(phase => (
      <PhaseButton
        key={phase.id}
        onClick={() => setActivePhase(phase)}
        className={activePhase === phase ? 'active' : ''}
      >
        <PhaseIcon />
        <PhaseLabel>{phase.label}</PhaseLabel>
        <ProgressIndicator value={phase.progress} />
      </PhaseButton>
    ))}
  </PrimaryToolbar>

  {/* Secondary Contextual Bar */}
  {activePhase && (
    <SecondaryToolbar>
      <ToolbarSection>
        {activePhase.children.map(tool => (
          <ToolButton
            key={tool.id}
            onClick={() => navigateTo(tool.path)}
          >
            {tool.icon && <ToolIcon />}
            <ToolLabel>{tool.label}</ToolLabel>
            {tool.aiEnabled && <AIBadge />}
            {tool.badge && <Badge>{tool.badge}</Badge>}
          </ToolButton>
        ))}
      </ToolbarSection>
      <QuickActions>
        <SearchButton />
        <HelpButton />
        <SettingsButton />
      </QuickActions>
    </SecondaryToolbar>
  )}

  {/* Breadcrumb Trail */}
  <BreadcrumbBar>
    <Breadcrumb>
      {currentPhase} › {currentTool} › {currentAction}
    </Breadcrumb>
    <ContextualHelp />
  </BreadcrumbBar>
</NavigationContainer>
```

### Interactive Behaviors

1. **Phase Selection:**
   - Click primary toolbar item → Secondary toolbar slides down
   - Smooth transition animation (200ms)
   - Phase color theme applies to secondary bar

2. **Progress Tracking:**
   - Visual progress bar under each phase
   - Automatic calculation based on completed actions
   - Green checkmark when phase complete

3. **Smart Navigation:**
   - Keyboard shortcuts (Cmd+1-9 for phases)
   - Tab navigation between secondary items
   - Escape key collapses secondary toolbar

4. **Responsive Design:**
   - Desktop: Full double toolbar
   - Tablet: Collapsible sidebar with phases
   - Mobile: Bottom tab navigation with modal for secondary

### State Management

```typescript
// Navigation State Store
interface NavigationState {
  currentPhase: ResearchPhase;
  currentTool: string;
  phaseProgress: Map<string, number>;
  completedActions: Set<string>;
  availablePhases: Set<string>;
  userPreferences: NavigationPreferences;
}

// Smart Phase Availability
const getAvailablePhases = (studyState: StudyState): Set<string> => {
  const available = new Set(['discover', 'design']); // Always available
  
  if (studyState.hasDesign) {
    available.add('build');
  }
  if (studyState.hasInstruments) {
    available.add('recruit');
    available.add('collect');
  }
  if (studyState.hasData) {
    available.add('analyze');
    available.add('visualize');
  }
  if (studyState.hasAnalysis) {
    available.add('interpret');
    available.add('report');
  }
  if (studyState.isComplete) {
    available.add('archive');
  }
  
  return available;
};
```

## ⚠️ Conflict Resolution & Service Integration

### Route Consolidation Map
| Old Routes | Action | New Route | Notes |
|------------|--------|-----------|-------|
| `/analysis` | REDIRECT | `/analysis/hub/[id]` | Primary analysis entry |
| `/analytics` | RENAME | `/analysis/metrics` | Avoid confusion |
| `/ai-tools` | REDISTRIBUTE | Various phases | AI integrated per context |
| `/visualization-demo` | MOVE | `/visualize` | Under VISUALIZE phase |

### Backend Service Architecture
```
├── Core Services (Existing)
│   ├── auth.service.ts (shared by all)
│   ├── study.service.ts (core data)
│   └── participant.service.ts
├── Analysis Services (8+ existing)
│   ├── hub.service.ts (Phase 7 Day 2)
│   └── visualization.service.ts (Phase 7 Day 4)
├── AI Services (6+ existing)
│   └── interpretation.service.ts (Phase 8 wrapper)
└── New Phase Services
    ├── literature.service.ts (Phase 9)
    ├── report-generator.service.ts (Phase 10)
    ├── archive.service.ts (Phase 11)
    └── navigation-state.service.ts (Phase 8.5)
```

### Testing Requirements Per Phase

#### Daily Testing Standards (All Phases):
- **3:00 PM:** Integration Testing
- **4:00 PM:** Performance Testing
- **5:00 PM:** TypeScript Error Check (≤587 errors)
- **5:30 PM:** Security Audit
- **5:45 PM:** Dependency Check
- **6:00 PM:** Test Coverage Report (>80%)

#### Phase-Specific Requirements:
- **Backend Services:** Unit tests >90%, Integration tests, Load tests
- **Frontend Components:** Component tests >85%, E2E tests, Accessibility
- **AI Features:** Accuracy tests, Cost monitoring, Rate limit tests
- **Data Processing:** Integrity tests, Transaction tests, Backup verification

## 🚀 Implementation Phases

### Phase 8.5: Research Lifecycle Navigation (Updated)
**Duration:** 8 days (aligned with Phase Tracker)  
**Priority:** CRITICAL - Unifies all features  
**Dependencies:** Phase 8 Complete

#### Implementation Steps (Enhanced):

**Days 1-2: Core Navigation Architecture & Backend**
- [ ] Create `navigation-state.service.ts` in backend
- [ ] Build `navigation.module.ts` with WebSocket support
- [ ] Create NavigationStateManager (frontend)
- [ ] Build PrimaryToolbar component (10 phases)
- [ ] Build SecondaryToolbar component
- [ ] Implement phase availability logic
- [ ] Add phase progress tracking to database

**Day 3: Feature Consolidation & Mapping**
- [ ] Consolidate `/analysis` routes per conflict map
- [ ] Merge `/visualization-demo` into `/visualize`
- [ ] Redistribute `/ai-tools` features
- [ ] Create unified routing structure
- [ ] Map all participant routes to COLLECT

**Day 4: Phase-Specific Implementation**
- [ ] Implement DISCOVER phase tools stub
- [ ] Enhance DESIGN phase with methodology tools
- [ ] Wire RECRUIT phase with scheduling service
- [ ] Unify ANALYZE phase with hub architecture
- [ ] Connect VISUALIZE to new route structure

**Day 5: Missing Phase Implementation**
- [ ] Create INTERPRET phase interface
- [ ] Build REPORT generation UI stubs
- [ ] Implement ARCHIVE phase features
- [ ] Add phase progress tracking
- [ ] Create contextual help system

**Day 6: Advanced UI Features**
- [ ] Add progress indicators for each phase
- [ ] Implement color-coded phase themes
- [ ] Create hover tooltips
- [ ] Add quick action shortcuts
- [ ] Implement search across phases

**Day 7: Mobile & Responsive**
- [ ] Build mobile navigation (bottom tabs)
- [ ] Create tablet sidebar navigation
- [ ] Implement gesture controls
- [ ] Add swipe between phases
- [ ] Optimize touch interactions

**Day 8: Integration & Polish**
- [ ] Connect all existing features
- [ ] Remove old navigation system
- [ ] Performance optimization
- [ ] Complete E2E testing suite
- [ ] Final security audit

## 🎯 Success Metrics

### Phase Coverage Targets (ACTUAL STATUS - Jan 2025)
| Phase | Current | Target | Services Status |
|-------|---------|--------|-----------------|
| DISCOVER | 0% | 70% | ❌ literature.service.ts NOT CREATED |
| DESIGN | 60% | 75% | 🟡 Partial in study creation |
| BUILD | 90% | 98% | ✅ Statement & AI services working, 🔴 Phase 8.3 builder pending |
| RECRUIT | 70% | 95% | ❌ screening.service.ts NOT CREATED (Phase 8.2) |
| COLLECT | 90% | 95% | ✅ QSort services, ❌ post-survey.service.ts NOT CREATED (Phase 8.2) |
| ANALYZE | 98% | 100% | ✅ hub.service.ts CREATED (Phase 7 Day 2) |
| VISUALIZE | 85% | 85% | ✅ visualization.service.ts CREATED (Phase 7 Day 4) |
| INTERPRET | 85% | 85% | ✅ interpretation.service.ts CREATED (Phase 8 Day 1) |
| REPORT | 15% | 70% | 🟡 report.service.ts CREATED (Phase 7 Day 6) - basic foundation |
| ARCHIVE | 40% | 75% | ❌ archive.service.ts NOT CREATED |

### User Experience Metrics
- **Task Completion Time:** 30% reduction in navigation time
- **Feature Discovery:** 50% increase in feature usage
- **User Satisfaction:** >90% approval in user testing
- **Error Rate:** <5% navigation errors

### Technical Metrics
- **Performance:** <100ms navigation transitions
- **TypeScript Errors:** Maintain ≤587 errors
- **Test Coverage:** >80% for new code, >95% overall
- **Accessibility:** WCAG AAA compliance
- **Mobile Usage:** 40% of users successfully complete tasks on mobile
- **Daily Testing:** 100% compliance with testing standards

## 🔄 Migration Strategy

### From Current Navigation to Lifecycle Navigation

1. **Parallel Implementation:**
   - Keep existing navigation initially
   - Add toggle for "Classic" vs "Lifecycle" view
   - Gather usage metrics

2. **Gradual Migration:**
   - Week 1-2: Soft launch to 10% users
   - Week 3-4: Expand to 50% users
   - Week 5-6: Full rollout with opt-out
   - Week 7-8: Remove legacy navigation

3. **User Communication:**
   - In-app announcements
   - Email campaign
   - Tutorial overlays
   - Help documentation

## 💡 Advanced Features

### AI-Powered Navigation Assistant
```typescript
interface NavigationAssistant {
  suggestNextStep(): PhaseAction;
  explainPhase(phase: ResearchPhase): string;
  recommendTools(context: StudyContext): Tool[];
  detectBlockers(): NavigationBlocker[];
  provideGuidance(): Guidance;
}
```

### Smart Workflows
- **Guided Mode:** Step-by-step wizard for beginners
- **Expert Mode:** Quick access shortcuts for power users
- **Template Mode:** Pre-configured workflows for common studies
- **Collaborative Mode:** Real-time multi-user navigation

### Contextual Intelligence
- Show relevant tools based on study type
- Hide unavailable phases until prerequisites met
- Suggest optimal next actions
- Warn about incomplete dependencies

## 🏆 Expected Outcomes

### For Researchers
- **Clear Path:** Always know where they are in research process
- **No Missing Steps:** Comprehensive coverage of all research phases
- **Better Organization:** Logical grouping of related tools
- **Faster Workflow:** Direct access to needed tools

### For Participants
- **Simplified Experience:** Clear, focused interface
- **Progress Visibility:** See their journey progress
- **Help When Needed:** Contextual assistance available

### For Platform
- **Increased Engagement:** Users discover and use more features
- **Reduced Support:** Self-explanatory navigation reduces confusion
- **Competitive Advantage:** Industry-leading UX for research platforms
- **Scalability:** Easy to add new features in appropriate phases

## 📋 Checklist for Implementation

- [ ] Stakeholder approval on navigation structure
- [ ] Design mockups for all screen sizes
- [ ] Technical architecture review
- [ ] Create Phase 7.5 in PHASE_TRACKER.md
- [ ] Assign development team
- [ ] Set up feature flags for rollout
- [ ] Create analytics tracking plan
- [ ] Prepare user communication materials
- [ ] Schedule user testing sessions
- [ ] Plan rollback strategy

## 🎨 Visual Mockup Description

```
┌────────────────────────────────────────────────────────────────┐
│ VQMethod  [Discover][Design][Build][Recruit][Collect][Analyze] │
├────────────────────────────────────────────────────────────────┤
│ [Literature][References][Knowledge Map][Gaps][Prior Studies]    │
├────────────────────────────────────────────────────────────────┤
│ Discover › Literature Search › Advanced Filters                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     Main Content Area                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Color Coding:** Each phase has a distinct color for visual orientation
**Progress Bars:** Subtle progress indicators under each phase
**Hover States:** Rich tooltips with phase descriptions and progress
**Active States:** Clear visual indication of current phase/tool
**Transitions:** Smooth animations between phases

This architecture transforms your platform from a feature-based navigation to a research-journey-based navigation, making it the most intuitive Q-methodology platform available.

## 📋 Questionnaire Integration in Research Lifecycle (Phase 8.2-8.3)

### Participant Journey with Questionnaires:
1. **RECRUIT Phase:** Participant receives invitation
2. **Pre-Screening:** Takes qualification questionnaire
   - Pass → Continue to study
   - Fail → Redirect to disqualification page
3. **COLLECT Phase:** 
   - Welcome & Consent
   - Q-Sort Activity
   - **Post-Q-Sort Survey:** Demographic & experience questions
4. **Thank You:** Study complete

### Researcher Workflow:
1. **BUILD Phase:** 
   - Design pre-screening questions with qualification logic
   - Create post-survey questions for demographics/feedback
   - Use Advanced Questionnaire Builder Pro (3-column layout)
2. **RECRUIT Phase:** Monitor screening results
3. **COLLECT Phase:** Track survey responses
4. **ANALYZE Phase:** Integrate questionnaire data with Q-sort analysis

### Technical Implementation:
- **Phase 8.2:** Pre/Post questionnaire pages and flow integration
- **Phase 8.3:** Advanced 3-column builder with professional features
- **Backend Services:** screening.service.ts, post-survey.service.ts
- **Frontend Routes:** 
  - /study/pre-screening/ (participant)
  - /study/post-survey/ (participant)
  - /questionnaire/builder-pro/ (researcher)
