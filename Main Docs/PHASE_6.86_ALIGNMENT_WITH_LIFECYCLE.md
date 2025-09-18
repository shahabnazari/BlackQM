# Phase 6.86 Alignment with Research Lifecycle Architecture

**Created:** September 17, 2025  
**Status:** CRITICAL - Phase 6.86 needs minor adjustments for full alignment  
**Impact:** Medium - Affects AI features integration across Research Lifecycle

## 📊 Current Analysis of Phase 6.86

### ✅ What's Already Well-Aligned

1. **Focus on BUILD Phase**
   - Grid Design Assistant → BUILD phase (Step 3)
   - Statement Generator → BUILD phase (Step 4)
   - Bias Detector → BUILD phase (quality control)

2. **No Navigation Conflicts**
   - Enhances existing UI components
   - No new navigation system
   - Works within study builder workflow

3. **Backend-First Approach**
   - Creates AI services in `/lib/services/`
   - API endpoints in `/app/api/ai/`
   - Proper separation of concerns

### ⚠️ Areas Needing Alignment

## 🔄 RECOMMENDED MODIFICATIONS FOR PHASE 6.86

### 1. Integrate with StudyContext Infrastructure (Phase 7)

**Current Issue:** Phase 6.86 creates isolated AI services without leveraging StudyContext.

**Solution:** Modify AI services to use StudyContextProvider:

```typescript
// BEFORE (Isolated):
// /frontend/lib/services/ai.service.ts
export class AIService {
  async generateGrid(topic: string) { ... }
}

// AFTER (Integrated with StudyContext):
// /frontend/lib/services/ai.service.ts
export class AIService {
  constructor(private context: StudyContext) {}
  
  async generateGrid(topic: string) {
    // Use study context for better AI responses
    const studyData = this.context.getCurrentStudy();
    const researchQuestion = studyData.researchQuestion;
    // AI can now provide more contextual recommendations
  }
}
```

### 2. Position in Research Lifecycle

**Clear Positioning:** Phase 6.86 AI features enhance MULTIPLE phases:

```
Research Lifecycle with Phase 6.86 AI:

1. DISCOVER   → [Future: AI literature search]
2. DESIGN     → [Future: AI hypothesis generation]
3. BUILD      → ✅ Phase 6.86 PRIMARY FOCUS
                 • Grid Design Assistant
                 • Statement Generator
                 • Bias Detector
4. RECRUIT    → [Future: AI participant screening]
5. COLLECT    → [Active monitoring, no AI needed]
6. ANALYZE    → [Phase 7 handles this]
7. VISUALIZE  → [Future: AI chart recommendations]
8. INTERPRET  → ✅ Phase 6.86 SECONDARY (via Phase 8)
                 • AI interpretations use same service
9. REPORT     → ✅ Phase 6.86 TERTIARY (via Phase 8)
                 • AI report generation uses same service
10. ARCHIVE   → [No AI needed]
```

### 3. Cross-Phase AI Availability

**Make AI Services Available Across Phases:**

```typescript
// /frontend/lib/services/ai.service.ts
export interface AIServiceConfig {
  phase: ResearchPhase; // Which phase is calling
  context: StudyContext; // Study data
  feature: 'grid' | 'statements' | 'bias' | 'interpret' | 'report';
}

// Available in BUILD phase
const gridAI = useAI({ phase: 'BUILD', feature: 'grid' });

// Same service available in INTERPRET phase
const interpretAI = useAI({ phase: 'INTERPRET', feature: 'interpret' });
```

### 4. Integration with Phase 7.5 Navigation

**Ensure AI Features Accessible from Correct Phases:**

```typescript
// When in BUILD phase:
ResearchToolbar: BUILD (active)
SecondaryToolbar: [Study Info | Grid Builder | Statements | Settings]
                                     ↑            ↑
                          Phase 6.86 AI here and here

// AI assistance available as overlay/panel, not separate navigation
```

## 📋 SPECIFIC CHANGES NEEDED IN PHASE 6.86

### Day 0: Add Architecture Alignment
**Add to Morning Tasks:**
- [ ] Review Phase 7 StudyContextProvider architecture
- [ ] Plan integration with Research Lifecycle phases
- [ ] Define AI service interfaces for cross-phase use

### Day 1: Modify Core AI Service
**Update Implementation:**
```typescript
// /frontend/lib/services/ai.service.ts
import { useStudyContext } from '@/providers/StudyContext'; // From Phase 7

export class AIService {
  constructor(
    private openai: OpenAI,
    private context: StudyContext // Add this
  ) {}
  
  // All methods now have access to study context
  async generateGrid() {
    const { researchQuestion, discipline, participantCount } = 
      this.context.getCurrentStudy();
    // Use context for better AI responses
  }
}
```

### Day 5: Update Hook Integration
**Modify Hooks to Use StudyContext:**
```typescript
// /frontend/hooks/useAI.ts
export function useAI(feature: AIFeature) {
  const studyContext = useStudyContext(); // From Phase 7
  const aiService = new AIService(openai, studyContext);
  
  return {
    generateGrid: () => aiService.generateGrid(),
    // ... other methods
  };
}
```

### Day 6: Ensure Phase Navigation Integration
**Update Integration Points:**
- AI features available in BUILD phase (primary)
- AI service accessible from INTERPRET phase (Phase 8 will use)
- AI service accessible from REPORT phase (Phase 8 will use)
- NO new navigation elements
- AI appears as panels/overlays within phases

## ✅ Benefits of These Alignments

1. **Contextual AI:** AI has access to full study context for better responses
2. **Reusability:** Same AI service works across multiple phases
3. **Consistency:** Follows Research Lifecycle navigation pattern
4. **Efficiency:** No duplicate AI implementations
5. **Future-Proof:** Easy to add AI to other phases later

## 📊 Updated Success Criteria for Phase 6.86

### Technical Alignment
- [ ] AI Service uses StudyContextProvider from Phase 7
- [ ] AI features accessible from BUILD phase toolbar
- [ ] AI service designed for cross-phase reuse
- [ ] No navigation conflicts with Phase 7.5
- [ ] Zero TypeScript errors maintained

### Functional Requirements (Unchanged)
- [ ] Grid AI provides 3 recommendations in <3 seconds
- [ ] Stimuli generator creates 25 statements from topic
- [ ] Bias detector identifies issues and suggests fixes
- [ ] All features accessible from study builder
- [ ] Error handling shows user-friendly messages

## 🎯 Implementation Order with Dependencies

```
Phase 7 (Days 1-7): Study Context Infrastructure
    ↓
Phase 6.86 (Days 8-19): AI Platform (uses StudyContext)
    ↓
Phase 7.5 (Days 20-31): Research Lifecycle Navigation
    ↓
Phase 8 (Days 32-38): Advanced AI (leverages 6.86's AI service)
```

**Note:** Phase 6.86 can start in parallel with Phase 7, but integration hooks (Day 5-6) should wait until StudyContext is available.

## 📝 Summary of Required Changes

### MUST CHANGE:
1. Add StudyContext integration to AI Service (Day 1)
2. Update hooks to use StudyContext (Day 5)
3. Clarify position in BUILD phase of Research Lifecycle

### SHOULD ADD:
1. Design AI service for cross-phase reuse
2. Document which phases will use AI features
3. Plan for future AI expansion to other phases

### NO CHANGE NEEDED:
1. Backend-first approach (good as-is)
2. UI components (already exist)
3. API endpoints structure (good as-is)
4. Testing strategy (comprehensive)

## Next Steps

1. **Update Phase 6.86 Day 0:** Add StudyContext review task
2. **Update Phase 6.86 Day 1:** Modify AIService to accept StudyContext
3. **Update Phase 6.86 Day 5:** Integrate with StudyContext in hooks
4. **Document:** AI service availability across phases

---

**Conclusion:** Phase 6.86 is 80% aligned with the new architecture. With these minor modifications, it will perfectly integrate with Phase 7's StudyContext infrastructure and Phase 7.5's Research Lifecycle Navigation, while providing AI capabilities that can be leveraged across multiple phases of the research journey.