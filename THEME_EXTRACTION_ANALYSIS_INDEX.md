# Theme Extraction Workflow Analysis - Document Index

## Primary Analysis Documents (NEW)

### 1. THEME_EXTRACTION_WORKFLOW_ANALYSIS.md (23 KB, 706 lines)
**Status:** Complete comprehensive analysis  
**Last Updated:** November 23, 2025

Detailed breakdown of:
- Backend theme extraction (95% complete)
- Frontend orchestration (100% complete)
- The 6-stage backend workflow
- Integration points analysis
- API endpoints and controllers
- Critical gaps and recommendations
- Data flow architecture
- File locations reference

**Best for:** Understanding the full system architecture and completeness

---

### 2. THEME_EXTRACTION_QUICK_SUMMARY.md (5.5 KB)
**Status:** Quick reference guide  
**Last Updated:** November 23, 2025

Quick facts about:
- What the system does
- Frontend vs backend workflow stages
- Key components at a glance
- Purpose-adaptive extraction modes
- AI cost considerations
- Completeness matrix
- Integration gaps
- Quick facts and figures

**Best for:** Quick orientation and understanding scope

---

## Supporting Analysis Documents

### Previous Deep-Dives:
- `THEME_EXTRACTION_WORKFLOW_ARCHITECTURAL_REVIEW.md` (70 KB) - Earlier detailed analysis
- `THEME_EXTRACTION_STAGE1_ANALYSIS.md` (25 KB) - Stage 1 specific focus
- `THEME_EXTRACTION_EXCERPT_ANALYSIS.md` (15 KB) - Excerpt extraction deep-dive
- `THEME_EXTRACTION_ZERO_THEMES_DIAGNOSIS.md` (10 KB) - Bug diagnosis

---

## Key Findings Summary

### Architecture
- **Frontend:** 4-stage workflow (save → fetch → prepare → extract)
- **Backend:** 6-stage workflow (familiarization → coding → generation → review → definition → production)
- **Communication:** WebSocket-based real-time progress

### Completeness Assessment
| Component | Status | Completeness |
|-----------|--------|--------------|
| Backend Theme Extraction | Enterprise Grade | 95% |
| Frontend Orchestration | Complete | 100% |
| Research Output Generation | Complete | 90% |
| Knowledge Graph Integration | Partial | 20% |
| Q-Methodology Integration | Partial | 30% |

### Critical Integration Gaps
1. **Q-Statement Generation** - Missing entirely
2. **Knowledge Graph Auto-Population** - Infrastructure exists, not connected
3. **Incremental Theme Merging** - Needs reconciliation logic

---

## Implementation Details

### Backend Services (1400+ lines)

**UnifiedThemeExtractionService** (`backend/src/modules/literature/services/unified-theme-extraction.service.ts`)
- Multi-source theme extraction
- Purpose-adaptive algorithms (5 purposes)
- Full provenance tracking
- Intelligent deduplication (0.8 similarity threshold)
- AI integration (OpenAI/Groq)

**EnhancedThemeIntegrationService** (`backend/src/modules/literature/services/enhanced-theme-integration.service.ts`)
- Research question generation (SQUARE-IT framework)
- Hypothesis generation (5 types)
- Construct mapping with relationships
- Complete survey generation (5 sections)
- Template-based + AI fallback

**KnowledgeGraphService** (`backend/src/modules/literature/services/knowledge-graph.service.ts`)
- Node/edge infrastructure complete
- Bridge concept detection
- Controversy detection
- [NOT CONNECTED TO THEME RESULTS]

### Frontend Services

**ExtractionOrchestratorService**
- 4-stage workflow coordination
- Progress mapping to backend stages
- Source count validation

**ThemeExtractionService**
- Validation (pure, no side effects)
- Stale metadata detection
- Content analysis and filtering

**ThemeExtractionStore (Zustand)**
- Modular architecture (5 helper modules)
- 52% reduction in code (658 → 315 lines)
- Full theme state management

### Components

- **ThemeExtractionContainer** (~390 lines)
- **ThemeExtractionProgressModal** (real-time)
- **PurposeSelectionWizard** (modal)
- **ThemesPage** (/discover/themes)

---

## Configuration Reference

### Extraction Limits
- `MAX_SOURCES_PER_REQUEST`: 500 papers
- `MAX_THEMES_PER_EXTRACTION`: 15
- `SIMILARITY_THRESHOLD`: 0.8 (for merging)
- `CONFIDENCE_THRESHOLD`: 0.5 (0-1 scale)
- `CACHE_TTL`: 1 hour

### Purpose-Adaptive Settings
| Purpose | Themes | Focus | Rigor |
|---------|--------|-------|-------|
| Q-Methodology | 30-80 | Breadth | Rigorous |
| Survey | 5-15 | Depth | Publication-ready |
| Qualitative | 5-20 | Saturation | Rigorous |
| Synthesis | 10-25 | Comprehensive | Publication-ready |
| Hypothesis | 8-15 | Theory | Rigorous |

### AI Configuration
- **Text Generation:** Groq (FREE) or OpenAI (PAID)
- **Embeddings:** OpenAI only (PAID, no free alternative)
- **Fallback:** Template-based generation
- **Temperature:** 0.2 (coding), 0.3 (labeling)

---

## Research Output Capabilities

After theme extraction, system generates:

1. **Research Questions** (SQUARE-IT framework)
2. **Hypotheses** (5 types with variables)
3. **Construct Mappings** (clustering & relationships)
4. **Complete Surveys** (5-section, publication-ready)

---

## Next Steps (Recommended Timeline)

### Week 1: Q-Methodology Integration
- Create `ThemeToQStatementService`
- Add Q-statement generation
- Link to Q-sort workflow

### Week 2-3: Knowledge Graph Integration
- Connect KnowledgeGraphService to themes
- Build visualization component
- Add gap detection

### Week 4-6: Enhancement & Polish
- Refine saturation detection
- Add multimedia metadata
- Implement incremental merging

---

## Quick Navigation

### To Understand...
- **Full system:** Read THEME_EXTRACTION_WORKFLOW_ANALYSIS.md
- **Quick overview:** Read THEME_EXTRACTION_QUICK_SUMMARY.md
- **Specific gaps:** See Section 6 of main analysis
- **File locations:** See Appendix in main analysis

### To Find...
- **Backend services:** `/backend/src/modules/literature/services/`
- **Frontend services:** `/frontend/lib/services/theme-extraction/`
- **Stores:** `/frontend/lib/stores/theme-extraction.store.ts`
- **Components:** `/frontend/app/(researcher)/discover/literature/`

---

## Status as of November 23, 2025

**Analysis Complete:** YES  
**Recommendations:** YES  
**Implementation Plan:** YES  
**Critical Issues:** None (design is sound, gaps are in integration)

---

Generated by Claude Code - Theme Extraction Workflow Analysis  
For questions or updates, refer to main analysis documents.
