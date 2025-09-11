# Frontend UI Integration Specifications

**Version:** 1.0  
**Phases:** 6.86, 7, 8  
**Purpose:** Comprehensive UI/UX specifications for AI and Hub features  
**Status:** 📋 Planning Document

## 🎨 Phase 6.86: AI Platform UI Components

### ✅ Current UI Coverage (Good)

Phase 6.86 has comprehensive UI specifications for study creation AI features.

### 🏗️ Detailed Component Specifications

#### 1. Grid Design AI Assistant

```typescript
// Location: /components/study-creation/ai/GridDesignAssistant.tsx
interface GridDesignAssistantProps {
  currentGrid?: GridConfiguration;
  onGridSelect: (grid: GridConfiguration) => void;
  studyContext: StudyContext;
}

// UI Elements:
- GridRecommendationCard (shows AI suggestions)
- GridPreviewCanvas (interactive preview)
- ScientificRationalePanel (explains reasoning)
- AlternativeOptionsCarousel (3-5 alternatives)
- LoadingSkeletons (during AI processing)
- ErrorBoundary (graceful error handling)
```

#### 2. Stimuli Generation Wizard

```typescript
// Location: /components/study-creation/ai/StimuliWizard.tsx
interface StimuliWizardProps {
  topic: string;
  perspectives: Perspective[];
  onGenerate: (stimuli: Statement[]) => void;
}

// UI Flow:
Step 1: Topic Input → Step 2: Perspective Selection → Step 3: Generation → Step 4: Review & Edit

// Components:
- TopicInputForm (with suggestions)
- PerspectiveSelector (multi-select with descriptions)
- GenerationProgress (real-time updates)
- StimuliEditor (inline editing, bulk actions)
- RegenerationPanel (refine specific statements)
```

#### 3. Bias Detection Dashboard

```typescript
// Location: /components/study-creation/ai/BiasDetection.tsx
interface BiasDetectionProps {
  statements: Statement[];
  onFix: (fixes: BiasFix[]) => void;
}

// Visual Elements:
- BiasScoreGauge (0-100 visual indicator)
- IssueCards (categorized by bias type)
- AutoFixButton (one-click improvements)
- DiversityHeatmap (visual representation)
- BeforeAfterComparison (side-by-side view)
```

### 📱 Mobile UI Adaptations

```css
/* Mobile-specific layouts for Phase 6.86 */
@media (max-width: 768px) {
  .grid-preview {
    /* Simplified grid for mobile */
  }
  .stimuli-wizard {
    /* Vertical step flow */
  }
  .bias-dashboard {
    /* Stacked cards */
  }
}
```

---

## 🎯 Phase 7: Unified Hub UI Components

### ⚠️ UI Gaps Identified

Phase 7 has basic structure but needs detailed component specifications.

### 🏗️ Enhanced Component Specifications

#### 1. Hub Layout System

```typescript
// Location: /components/hub/HubLayout.tsx
interface HubLayoutProps {
  studyId: string;
  children: React.ReactNode;
}

// Layout Structure:
<HubLayout>
  <HubSidebar /> {/* Fixed or collapsible */}
  <HubHeader />  {/* Breadcrumbs, actions */}
  <HubContent /> {/* Dynamic sections */}
  <HubFooter />  {/* Quick actions bar */}
</HubLayout>
```

#### 2. Hub Sidebar Navigation

```typescript
// Location: /components/hub/HubSidebar.tsx
interface HubSidebarProps {
  sections: HubSection[];
  activeSection: string;
  studyMetrics: StudyMetrics;
}

// Visual Design:
- Icon + Label for each section
- Progress indicators per section
- Nested subsections (collapsible)
- Quick stats preview on hover
- Keyboard navigation support (←→↑↓)
```

#### 3. Data Explorer Interface

```typescript
// Location: /components/hub/sections/DataExplorer.tsx
interface DataExplorerProps {
  responses: QSortResponse[];
  statements: Statement[];
}

// UI Components:
- ResponseGrid (virtualized for performance)
- FilterPanel (participant, date, completion)
- SearchBar (fuzzy search across responses)
- ExportOptions (CSV, JSON, Excel)
- DataVisualizationToggle (table/chart views)
```

#### 4. AI Interpretation Panel

```typescript
// Location: /components/hub/sections/AIInterpretation.tsx
interface AIInterpretationProps {
  analysis: AnalysisResults;
  onRequestInterpretation: () => void;
}

// Visual Elements:
- InterpretationCards (factor narratives)
- ConfidenceIndicator (AI certainty level)
- InsightHighlights (key findings)
- RegenerateButton (new interpretation)
- FeedbackWidget (thumbs up/down)
- ExplanationTooltips (why AI thinks this)
```

#### 5. Hub Overview Dashboard

```typescript
// Location: /components/hub/sections/Overview.tsx
interface OverviewDashboardProps {
  study: Study;
  metrics: StudyMetrics;
  recentActivity: Activity[];
}

// Dashboard Widgets:
- MetricCards (animated counters)
- CompletionChart (progress visualization)
- ActivityFeed (real-time updates)
- QuickActions (common tasks)
- InsightsSummary (AI-generated)
- NextStepsGuide (contextual help)
```

### 🎨 Visual Design System for Hub

```typescript
// Design tokens for hub
const hubTheme = {
  sidebar: {
    width: '260px',
    background: 'var(--surface-secondary)',
    borderRight: '1px solid var(--border)',
  },
  content: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  transitions: {
    sectionChange: 'fade 200ms',
    sidebarToggle: 'slide 300ms',
  },
};
```

### 📱 Responsive Hub Design

```typescript
// Breakpoint-specific layouts
const hubBreakpoints = {
  mobile: {
    sidebar: 'bottom-tabs',
    content: 'full-width',
    navigation: 'hamburger-menu',
  },
  tablet: {
    sidebar: 'collapsible',
    content: 'adjusted-padding',
    navigation: 'icon-only',
  },
  desktop: {
    sidebar: 'fixed',
    content: 'standard',
    navigation: 'full',
  },
};
```

---

## 📝 Phase 8: Advanced AI & Reporting UI

### ⚠️ UI Gaps Identified

Phase 8 needs extensive UI specifications for complex interfaces.

### 🏗️ Comprehensive Component Specifications

#### 1. Report Builder Interface

```typescript
// Location: /components/report-builder/ReportBuilder.tsx
interface ReportBuilderProps {
  analysisData: AnalysisResults;
  onPublish: (report: Report) => void;
}

// Three-Panel Layout:
┌─────────────┬─────────────┬─────────────┐
│  Section    │   Report    │   Preview   │
│  Library    │  Structure  │   (Live)    │
├─────────────┼─────────────┼─────────────┤
│ • Abstract  │ [Abstract]  │             │
│ • Intro     │ [Intro]     │   Rendered  │
│ • Methods   │ [Methods]   │   Report    │
│ • Results   │ [+Add]      │             │
│ • Discussion│             │             │
└─────────────┴─────────────┴─────────────┘
```

#### 2. Section Editor Components

```typescript
// Location: /components/report-builder/SectionEditor.tsx
interface SectionEditorProps {
  section: ReportSection;
  aiContent: string;
  onEdit: (content: string) => void;
}

// Editor Features:
- RichTextEditor (formatting toolbar)
- AIContentToggle (use AI or manual)
- CitationInserter (inline references)
- FigureManager (drag-drop images/charts)
- RegenerateButton (new AI content)
- VersionHistory (track changes)
```

#### 3. Literature Review Interface

```typescript
// Location: /components/report-builder/LiteratureReview.tsx
interface LiteratureReviewProps {
  topic: string;
  existingCitations: Citation[];
}

// UI Components:
- SearchInterface (multi-database search)
- ResultsList (with relevance scores)
- CitationCard (preview, actions)
- GapAnalysisPanel (visual gaps)
- ImportManager (BibTeX, RIS, etc.)
- CitationFormatter (APA, MLA, Chicago)
```

#### 4. Pattern Visualization Suite

```typescript
// Location: /components/insights/PatternVisualizations.tsx
interface PatternVizProps {
  patterns: CrossStudyPatterns;
  interactive: boolean;
}

// Visualization Types:
- TemporalTrendChart (time series)
- DemographicHeatmap (correlations)
- ThemeNetwork (connected themes)
- ComparisonMatrix (study vs study)
- OutlierScatter (anomaly detection)
```

#### 5. Export & Publishing Center

```typescript
// Location: /components/export/ExportCenter.tsx
interface ExportCenterProps {
  report: Report;
  formats: ExportFormat[];
}

// Export UI:
- FormatSelector (Word, PDF, LaTeX, etc.)
- PreviewPanel (format-specific preview)
- OptionsForm (formatting options)
- ProgressIndicator (export progress)
- DownloadManager (multiple formats)
- ShareDialog (collaboration links)
```

### 🎨 Advanced UI Patterns

#### Drag-and-Drop Report Building

```typescript
// Implementing DnD for report sections
const DragDropContext = {
  onDragStart: item => highlightDropZones(),
  onDragOver: zone => showPlaceholder(),
  onDrop: (item, zone) => insertSection(),
  onDragEnd: () => cleanup(),
};
```

#### Real-time Collaboration UI

```typescript
// Collaboration indicators
const CollaborationUI = {
  cursors: showOtherUsersCursors(),
  selections: highlightOtherUsersSelections(),
  comments: inlineCommentThreads(),
  presence: activeUsersAvatars(),
};
```

#### Progressive Loading States

```typescript
// Smart loading states for AI operations
const LoadingStates = {
  initial: <SkeletonLoader />,
  generating: <ProgressBar with="status" />,
  streaming: <StreamingText />,
  finalizing: <ProcessingIndicator />,
  complete: <SuccessAnimation />
};
```

---

## 🔧 Implementation Recommendations

### Priority 1: Essential UI Components (Must Have)

#### Phase 6.86

✅ All components well-specified

#### Phase 7 (Needs Implementation)

```typescript
// Priority components to build:
1. HubLayout and navigation system
2. StudyAnalysisContext provider
3. Basic section components (Overview, Data, Analysis)
4. AIInterpretationPanel with loading states
5. Mobile-responsive sidebar
```

#### Phase 8 (Needs Implementation)

```typescript
// Priority components to build:
1. Basic ReportBuilder (without DnD initially)
2. Simple SectionEditor (rich text)
3. Export to Word/PDF functionality
4. Basic pattern visualizations
5. Citation management interface
```

### Priority 2: Enhanced Features (Should Have)

#### Phase 7 Enhancements

- Animated transitions between sections
- Advanced data filtering in explorer
- Keyboard shortcuts system
- Tooltip tour for new users
- Customizable dashboard widgets

#### Phase 8 Enhancements

- Drag-and-drop report builder
- Real-time collaboration features
- Advanced pattern visualizations
- Multiple report templates
- Version control UI

### Priority 3: Delightful Features (Nice to Have)

- AI confidence animations
- Smooth streaming text effects
- Custom themes for reports
- Voice input for commands
- AR/VR data visualization

---

## 🎯 UI Testing Requirements

### Component Testing

```typescript
// Test each component in isolation
describe('HubSidebar', () => {
  test('navigates between sections');
  test('shows active state correctly');
  test('collapses on mobile');
  test('keyboard navigation works');
});
```

### Integration Testing

```typescript
// Test component interactions
describe('Hub Integration', () => {
  test('data flows between sections');
  test('AI interpretations update visualizations');
  test('export includes all sections');
});
```

### Accessibility Testing

```typescript
// WCAG AA compliance
describe('Accessibility', () => {
  test('all interactive elements keyboard accessible');
  test('screen reader announces correctly');
  test('color contrast meets standards');
  test('focus indicators visible');
});
```

### Performance Testing

```typescript
// UI performance metrics
describe('Performance', () => {
  test('hub loads in <2 seconds');
  test('section switches in <200ms');
  test('AI responses stream smoothly');
  test('large datasets virtualize properly');
});
```

---

## 📱 Mobile-First Considerations

### Phase 7 Mobile Adaptations

```css
/* Mobile hub layout */
.hub-mobile {
  --sidebar: bottom-navigation;
  --content-padding: 16px;
  --section-layout: stacked;
}
```

### Phase 8 Mobile Adaptations

```css
/* Mobile report builder */
.report-builder-mobile {
  --layout: single-column;
  --preview: modal;
  --editor: full-screen;
}
```

---

## 🚀 Implementation Timeline

### Week 1: Foundation

- Set up component library structure
- Create design system tokens
- Build basic layout components

### Week 2: Phase 7 UI

- Implement hub layout system
- Build section components
- Add AI interpretation UI

### Week 3: Phase 8 UI

- Create report builder interface
- Implement section editors
- Build export functionality

### Week 4: Polish & Testing

- Add animations and transitions
- Implement loading states
- Complete accessibility testing

---

## ✅ UI Checklist by Phase

### Phase 6.86 ✅

- [x] Grid Design AI Assistant specified
- [x] Stimuli Generation Wizard specified
- [x] Bias Detection Dashboard specified
- [x] Mobile responsive considerations
- [x] Accessibility requirements

### Phase 7 🔧

- [ ] HubLayout component
- [ ] HubSidebar navigation
- [ ] Data Explorer interface
- [ ] AI Interpretation panel
- [ ] Overview dashboard
- [ ] Mobile responsive design
- [ ] Keyboard navigation
- [ ] Loading states
- [ ] Error boundaries

### Phase 8 🔧

- [ ] Report Builder interface
- [ ] Section Editor components
- [ ] Literature Review UI
- [ ] Pattern visualizations
- [ ] Export Center
- [ ] Drag-and-drop functionality
- [ ] Collaboration features
- [ ] Template selector
- [ ] Version control UI

---

**Recommendation:** Phase 6.86 has adequate UI specifications. Phases 7 and 8 need the detailed component implementations specified in this document before development begins.
