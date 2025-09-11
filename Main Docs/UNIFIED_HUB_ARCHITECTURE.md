# Unified Analysis Hub Architecture

**Version:** 1.0  
**Phase:** 7  
**Purpose:** Consolidate post-data collection workflow into a single, integrated hub  
**Status:** 🔴 Not Started

## 🎯 Overview

The Unified Analysis Hub transforms the fragmented post-collection experience into a seamless, integrated workflow. Instead of jumping between multiple disconnected pages, researchers access all analysis, visualization, and reporting tools from a single study-centric hub.

## 📊 Current vs. Future Architecture

### Current State (Fragmented)

```
/dashboard → /studies/[id] → /analysis/q-methodology → /visualization-demo → /analytics
    ↓             ↓                    ↓                        ↓                ↓
Overview    Study Details    Standalone Analysis    Separate Visuals    Platform Metrics
```

### Future State (Unified)

```
/studies/[id]/hub
        ↓
┌──────────────────────────────────────────┐
│         Study Analysis Hub               │
├──────────────────────────────────────────┤
│ • Overview    • Analysis    • Report     │
│ • Data        • Visualize   • Export     │
│ • Insights    • Collaborate • Settings   │
└──────────────────────────────────────────┘
```

## 🏗️ Hub Architecture Components

### 1. Route Structure

```typescript
/studies/[id]/hub
├── /overview      // Study status, metrics, quick insights
├── /data          // Raw data explorer, responses, participants
├── /analyze       // All analysis tools (Q-methodology, factor, cluster)
├── /visualize     // All visualizations with data pre-loaded
├── /insights      // AI interpretations and recommendations
├── /report        // Report builder and generation
└── /export        // Export center for all formats
```

### 2. Data Context Architecture

```typescript
// StudyAnalysisContext.tsx
interface StudyAnalysisContext {
  // Core Data (loaded once)
  studyId: string;
  studyMetadata: StudyMetadata;
  participantResponses: QSortResponse[];
  statements: Statement[];

  // Analysis Results (cached)
  correlationMatrix: number[][];
  factorAnalysis: FactorAnalysisResult | null;
  distinguishingStatements: Statement[];
  consensusStatements: Statement[];

  // Visualizations (generated)
  activeCharts: ChartConfig[];
  chartData: Map<string, any>;

  // AI Insights (Phase 7-8)
  interpretations: AIInterpretation | null;
  narratives: Narrative[];
  recommendations: Recommendation[];

  // Report Building
  reportDraft: ReportDraft | null;
  exportQueue: ExportJob[];

  // Actions
  loadStudyData: (id: string) => Promise<void>;
  runAnalysis: (type: AnalysisType) => Promise<void>;
  generateVisualization: (config: ChartConfig) => Promise<void>;
  requestAIInterpretation: () => Promise<void>;
  buildReport: (sections: ReportSection[]) => Promise<void>;
}
```

### 3. State Management (Zustand)

```typescript
// stores/study-hub.store.ts
export const useStudyHub = create<StudyHubState>((set, get) => ({
  // State
  currentSection: 'overview',
  isLoading: false,
  error: null,

  // Data
  studyData: null,
  analysisResults: null,
  visualizations: [],
  aiInsights: null,

  // Actions
  setSection: section => set({ currentSection: section }),

  loadStudy: async id => {
    set({ isLoading: true });
    try {
      // Load all data once
      const [study, responses, analysis] = await Promise.all([
        api.getStudy(id),
        api.getResponses(id),
        api.getAnalysis(id),
      ]);

      set({
        studyData: { study, responses },
        analysisResults: analysis,
        isLoading: false,
      });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  // Other actions...
}));
```

### 4. Hub Layout Component

```typescript
// components/hub/StudyHub.tsx
export function StudyHub({ studyId }: { studyId: string }) {
  const { currentSection, setSection } = useStudyHub();

  return (
    <div className="flex h-screen">
      {/* Sidebar Navigation */}
      <HubSidebar
        sections={hubSections}
        currentSection={currentSection}
        onSectionChange={setSection}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <HubHeader studyId={studyId} />

        {/* Dynamic Section Content */}
        <Suspense fallback={<HubSkeleton />}>
          {currentSection === 'overview' && <OverviewSection />}
          {currentSection === 'data' && <DataExplorer />}
          {currentSection === 'analyze' && <AnalysisSection />}
          {currentSection === 'visualize' && <VisualizationSection />}
          {currentSection === 'insights' && <AIInsightsSection />}
          {currentSection === 'report' && <ReportBuilder />}
          {currentSection === 'export' && <ExportCenter />}
        </Suspense>
      </div>
    </div>
  );
}
```

## 🔄 Data Flow Architecture

### Loading Strategy

1. **Initial Load**: When entering hub, load all core data once
2. **Lazy Analysis**: Run analysis on-demand, cache results
3. **Progressive Enhancement**: Add AI insights as optional layer
4. **Smart Caching**: Cache expensive operations (factor analysis, AI)

### Data Flow Diagram

```
Entry Point → Load Study Data → Display Overview
                    ↓
            User Navigates to Section
                    ↓
         Section Uses Cached Data
                    ↓
         User Triggers Analysis
                    ↓
         Results Cached & Shared
                    ↓
         AI Enhancement (Optional)
```

## 🎨 UI/UX Patterns

### 1. Progressive Disclosure

```
Level 1: Quick Overview (auto-loaded)
  → Basic stats, completion rates, participant count

Level 2: Standard Analysis (on-demand)
  → Factor analysis, correlations, distributions

Level 3: AI Enhancement (optional)
  → Interpretations, narratives, recommendations

Level 4: Report Generation (final step)
  → Combine all insights into publication
```

### 2. Sidebar Navigation Pattern

```
┌─────────────┬──────────────────────────┐
│   Sidebar   │     Main Content         │
├─────────────┼──────────────────────────┤
│ ▼ Overview  │                          │
│ ▷ Data      │   Dynamic content        │
│ ▷ Analyze   │   based on sidebar       │
│ ▷ Visualize │   selection              │
│ ▷ Insights  │                          │
│ ▷ Report    │                          │
│ ▷ Export    │                          │
└─────────────┴──────────────────────────┘
```

### 3. Responsive Design

- **Desktop**: Full sidebar + content
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation tabs

## 🔌 Integration Points

### Existing Components Integration

| Component                | Current Location                     | Hub Integration   |
| ------------------------ | ------------------------------------ | ----------------- |
| QAnalysisService         | `/analysis/q-methodology`            | Analyze section   |
| FactorLoadingChart       | `/visualizations/q-methodology`      | Visualize section |
| DistinguishingStatements | `/visualizations/q-methodology`      | Visualize section |
| ExportPanel              | `/analysis/q-methodology/components` | Export section    |
| DashboardBuilder         | `/visualizations/dashboards`         | Overview section  |

### New Components (Phase 7-8)

| Component             | Purpose             | Location                    |
| --------------------- | ------------------- | --------------------------- |
| StudyHub              | Main hub container  | `/components/hub/`          |
| HubSidebar            | Navigation sidebar  | `/components/hub/`          |
| DataExplorer          | Raw data viewer     | `/components/hub/sections/` |
| AIInterpretationPanel | AI insights display | `/components/hub/sections/` |
| ReportBuilder         | Report generation   | `/components/hub/sections/` |

## 🚀 Implementation Strategy

### Phase 7: Hub Foundation + Basic AI (6-7 days)

1. **Days 1-2**: Hub infrastructure and routing
2. **Days 3-4**: Basic AI interpretation engine
3. **Days 5-6**: Hub UI and navigation
4. **Day 7**: Testing and integration

### Phase 8: Advanced AI + Reporting (6-7 days)

1. **Days 1-2**: Advanced AI analysis features
2. **Days 3-4**: Report generation system
3. **Day 5**: Recommendations engine
4. **Day 6**: Report builder UI
5. **Day 7**: Quality control and testing

## 📊 Success Metrics

### Technical Metrics

- **Load Time**: Hub loads in <2 seconds
- **Data Efficiency**: Load data once, use everywhere
- **Cache Hit Rate**: >80% for repeated operations
- **AI Response Time**: <3 seconds for interpretations

### User Experience Metrics

- **Task Completion**: 50% reduction in clicks to complete analysis
- **Time to Insight**: 70% faster from data to insights
- **User Satisfaction**: >4.5/5 rating for hub experience
- **Feature Adoption**: 80% use AI interpretations

## 🔍 Testing Strategy

### Unit Testing

- Test each hub section independently
- Test data context providers
- Test state management actions

### Integration Testing

- Test data flow between sections
- Test component integration in hub
- Test AI service integration

### E2E Testing

- Complete researcher workflow
- Data collection → Analysis → Report
- Mobile responsiveness testing

## 🎯 Key Benefits

1. **Unified Experience**: Single location for all post-collection work
2. **Context Preservation**: No need to re-upload or reload data
3. **Progressive Enhancement**: Basic features work, AI adds value
4. **Efficient Workflows**: Reduced clicks and navigation
5. **Scalability**: Easy to add new analysis tools or AI features
6. **Performance**: Smart caching and lazy loading

## 📝 Migration Plan

### Step 1: Create Hub Infrastructure

- Set up routes and navigation
- Implement data context
- Create hub layout

### Step 2: Migrate Existing Components

- Move analysis components
- Integrate visualizations
- Connect export functionality

### Step 3: Add AI Layer

- Implement interpretation service
- Add AI overlays to visualizations
- Create narrative generation

### Step 4: Build Report System

- Create report builder
- Implement templates
- Add export formats

## 🚫 Common Pitfalls to Avoid

1. **Don't** create separate pages for each tool
2. **Don't** require data re-upload between sections
3. **Don't** make AI features mandatory
4. **Don't** break existing functionality
5. **Don't** ignore mobile users

## ✅ Implementation Checklist

### Phase 7 Prerequisites

- [ ] Phase 6.86 complete (AI Platform for study creation)
- [ ] All existing analysis components working
- [ ] Visualization components tested

### Phase 7 Deliverables

- [ ] Hub infrastructure implemented
- [ ] Existing components migrated
- [ ] Basic AI interpretation working
- [ ] Hub navigation functional
- [ ] Data context implemented
- [ ] Mobile responsive design

### Phase 8 Deliverables

- [ ] Advanced AI analysis features
- [ ] Report generation system
- [ ] Recommendation engine
- [ ] Report builder UI
- [ ] Export functionality
- [ ] Quality control systems

---

**Next Steps:** After Phase 6.86 is complete, begin Phase 7 implementation following this architecture guide.
