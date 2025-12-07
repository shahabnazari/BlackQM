# Generator Features - Quick Reference Guide

## At a Glance

```
BACKEND:     ████████████████████ 100% (All 5 generators complete)
FRONTEND:    ████████░░░░░░░░░░░░  40% (Only Research Question complete)
```

## 1. STATEMENT GENERATOR

| Aspect | Status | Details |
|--------|--------|---------|
| Backend | ✓ Complete | 30+ statements, 7+ perspectives, bias checking, cultural sensitivity |
| Frontend | ⚠️ Partial | Basic UI exists, missing validation/enhancement/variation displays |
| Key Files | Backend: `statement-generator.service.ts` | Frontend: `StatementGenerator.tsx` |
| AI Provider | OpenAI GPT-4 | Temperature: 0.6-0.8, 2000 tokens |
| Advanced Features | Multimedia provenance, cultural sensitivity, enhancement modes | None exposed to UI |
| Market Impact | Q-Methodology specific | ~5% of survey market |

**Missing in Frontend:**
- Validation results display
- Enhancement modes UI (clarity/balance/diversity)
- Variation generation interface
- Multimedia source visualization
- Statement library/history

---

## 2. QUESTIONNAIRE GENERATOR

| Aspect | Status | Details |
|--------|--------|---------|
| Backend | ✓ Complete | 5 question types, skip logic, quality validation |
| Frontend | 🔴 Missing | No UI component exists |
| Key Files | Backend: `questionnaire-generator.service.ts` | Frontend: None (API service only) |
| AI Provider | OpenAI GPT-4 | Temperature: 0.8, 2000 tokens |
| Question Types | Likert, Multiple Choice, Open-Ended, Ranking, Demographic | All supported but not exposed |
| Advanced Features | Skip logic, follow-up suggestions, audience targeting | Not in UI |

**What's Missing:**
- Entire UI component for generation
- Question editor interface
- Skip logic visual builder
- Question type selector
- Preview/test mode
- Export to Qualtrics/SurveyMonkey

---

## 3. RESEARCH QUESTION GENERATOR

| Aspect | Status | Details |
|--------|--------|---------|
| Backend | ✓ Complete | SQUARE-IT framework (8 dimensions), sub-questions, gap mapping |
| Frontend | ✓ Complete | 6-step wizard with full UI |
| Key Files | Backend: `research-question.service.ts` | Frontend: `/app/(researcher)/design/questions/page.tsx` |
| AI Provider | OpenAI GPT-4 | Temperature: 0.3-0.7, 1500 tokens |
| Wizard Steps | 6 steps | Topic → Type → Components → Refinement → Validation → Summary |
| SQUARE-IT Score | 8 dimensions | Specific, Quantifiable, Usable, Accurate, Restricted, Eligible, Investigable, Timely |

**✓ Fully Implemented Features:**
- Multi-step wizard with progress bar
- AI suggestions and templates
- Validation checklist
- Q-Methodology guidance
- Export options

---

## 4. HYPOTHESIS GENERATOR

| Aspect | Status | Details |
|--------|--------|---------|
| Backend | ✓ Complete | 3 sources (contradictions/gaps/trends), theory diagrams, methodology recommendations |
| Frontend | ⚠️ Partial | Display-only, missing advanced visualizations |
| Key Files | Backend: `hypothesis-generator.service.ts` | Frontend: Multiple files (HypothesisBuilderPanel, page) |
| AI Provider | OpenAI GPT-4 | Temperature: 0.4-0.7 |
| Hypothesis Sources | 3 types | From contradictions, gaps, trends |
| Advanced Features | Theory diagrams, methodology recommendations | Built but not visualized |

**Missing in Frontend:**
- Theory diagram visualization (network graph)
- Methodology recommendation display
- Alternative methodology comparison
- Hypothesis comparison tools
- Hypothesis editing from results

---

## 5. THEME-TO-SURVEY-ITEM GENERATOR

| Aspect | Status | Details |
|--------|--------|---------|
| Backend | ✓ Complete | 5 item types, DeVellis compliance, Cronbach's alpha calculation |
| Frontend | 🔴 Missing | API service exists, no UI component |
| Key Files | Backend: `theme-to-survey-item.service.ts` | Frontend: Service only, no component |
| AI Provider | Groq (FREE) + OpenAI fallback | Temperature: 0.7, 400-800 tokens |
| Item Types | 5 types | Likert, MC, Semantic Differential, Matrix/Grid, Rating |
| Psychometric Backing | DeVellis 2016, Osgood 1957, Haladyna 2013 | All built into backend |

**Missing (Entire UI Layer):**
- Theme input interface
- Item type selector
- Likert scale builder
- Multiple choice editor
- Semantic differential previewer
- Matrix grid designer
- Cronbach's alpha visualization
- Preview/test interface

---

## File Locations Quick Map

### Backend Services (Complete)
```
/backend/src/modules/
├── ai/services/
│   ├── statement-generator.service.ts          ✓
│   └── questionnaire-generator.service.ts      ✓
└── research-design/services/
    ├── research-question.service.ts            ✓
    ├── hypothesis-generator.service.ts         ✓
    └── hypothesis-to-item.service.ts
└── literature/services/
    └── theme-to-survey-item.service.ts         ✓
```

### Frontend Components (40% complete)
```
/frontend/
├── components/
│   ├── ai/
│   │   └── StatementGenerator.tsx              ⚠️ (Partial)
│   ├── research-design/
│   │   ├── HypothesisBuilderPanel.tsx          ⚠️ (Partial)
│   │   └── TheoryDiagramBuilder.tsx            (Stub)
│   └── questionnaire/
│       └── ResearchQuestionToItemsModal.tsx    ⚠️ (Limited)
└── app/(researcher)/design/
    ├── questions/page.tsx                       ✓ (Complete)
    └── hypothesis/page.tsx                      ⚠️ (Partial)
```

---

## Integration Status by User Journey

### Scenario 1: Creating Q-Study Statements
1. Research Question Generation → ✓ Full UI
2. Statement Generation → ⚠️ Basic UI (missing advanced features)
3. Statement Validation → 🔴 Missing UI
4. Statement Enhancement → 🔴 Missing UI

### Scenario 2: Creating Traditional Survey
1. Research Question Generation → ✓ Full UI
2. Theme Extraction → (Separate feature, not generator)
3. Theme to Survey Items → 🔴 Missing UI entirely
4. Item Validation → 🔴 Missing UI

### Scenario 3: Building from Contradictions/Gaps
1. Literature Review → (Separate feature)
2. Hypothesis Generation from Gaps → ⚠️ Partial UI
3. Theory Diagram Visualization → 🔴 Missing
4. Methodology Recommendation → 🔴 Missing

---

## Critical Gaps by Priority

### MUST HAVE (Business Impact)
1. Theme-to-Survey UI (95% market targets traditional surveys)
2. Hypothesis theory diagram visualization
3. Questionnaire question builder
4. Generation history/versioning

### SHOULD HAVE (Polish)
1. Statement enhancement UI
2. Cultural sensitivity display
3. AI cost dashboard
4. Hypothesis comparison tools

### NICE TO HAVE (Differentiation)
1. Multimedia provenance visualization
2. Multi-language generation
3. Batch operations
4. Advanced export formats

---

## Code Quality Assessment

| Aspect | Score | Notes |
|--------|-------|-------|
| Backend Completeness | 10/10 | All features implemented, tested |
| Frontend Completeness | 4/10 | Research Question: 10/10, Others: 2-5/10 |
| Type Safety | 7/10 | Some `any` types in components |
| Error Handling | 6/10 | Inconsistent patterns |
| Documentation | 8/10 | Good backend, missing frontend |
| Test Coverage | 5/10 | Backend specs exist, frontend limited |

---

## Next Steps (Recommended Order)

### Week 1-2: Critical
- [ ] Build Theme-to-Survey UI component (3 days)
- [ ] Add hypothesis theory diagram viz (2 days)

### Week 3: High Priority
- [ ] Implement questionnaire question builder (4 days)
- [ ] Add generation history feature (2 days)

### Week 4: Polish
- [ ] Statement enhancement UI (2 days)
- [ ] Comparison tools (2 days)

---

## Notes

- Research Question Generator is the **only** fully implemented generator UI
- All backends are production-ready and well-tested
- Theme-to-Survey has the highest market relevance (95% target market)
- Hypothesis Generator backend is sophisticated but frontend only displays results
- Statement Generator UI doesn't expose any of the advanced backend features

