# Theme Data Structure Documentation Index

This document serves as the central index for all theme extraction documentation. Use this to navigate the comprehensive theme data structure guides.

## Quick Navigation

### For Quick Lookups
- **THEME_QUICK_REFERENCE.md** - Start here! Concise reference with core types, state structure, and basic usage
- **Key Info:** Data structure examples, main store actions, persistence overview

### For Comprehensive Understanding
- **THEME_STRUCTURE_REFERENCE.md** - Deep dive into complete data structures
- **Key Info:** All interfaces, fields with descriptions, all available actions, persistence details, design patterns

### For Implementation
- **THEME_IMPLEMENTATION_GUIDE.md** - Practical guide with real-world examples
- **Key Info:** File locations, imports, state reading/writing, complete component example, patterns, error handling

---

## Full Document Descriptions

### THEME_QUICK_REFERENCE.md
**Length:** ~3 pages | **Read Time:** 5-10 minutes

Perfect for developers who need to:
- Understand the basic UnifiedTheme structure
- See the core store state
- Get code snippets for common operations
- Know where files are located

**Contains:**
- Key file paths
- UnifiedTheme interface with example data
- Store state compact view
- Basic store actions grouped by category
- Persistence overview
- Constraints & limits
- Quick code snippets for common operations

---

### THEME_STRUCTURE_REFERENCE.md
**Length:** ~8 pages | **Read Time:** 20-30 minutes

Perfect for developers who need to:
- Understand all theme-related types and interfaces
- Know every field in UnifiedTheme and its meaning
- Learn about ThemeSource and ThemeProvenance
- Understand all store actions in detail
- Learn about persistence and selectors
- Understand backend types
- See usage examples
- Understand design patterns

**Contains:**
- UnifiedTheme with detailed field descriptions
- ThemeSource interface (supporting sources)
- ThemeProvenance interface (source statistics)
- Complete ThemeExtractionState interface
- ExtractionProgress, ContentAnalysis, SaturationData interfaces
- ResearchPurpose and UserExpertiseLevel types
- All store actions grouped by category
- Persistence configuration details
- Built-in selectors
- Legacy store comparison
- Backend Prisma types
- Usage example with React component
- Design patterns explanation
- File structure summary

---

### THEME_IMPLEMENTATION_GUIDE.md
**Length:** ~10 pages | **Read Time:** 25-40 minutes

Perfect for developers who need to:
- Implement theme extraction features
- Integrate the store into components
- Understand real-world usage patterns
- Handle errors properly
- Learn persistence behavior
- Optimize performance

**Contains:**
- Detailed file paths and descriptions
- Import examples
- State reading patterns (subscriptions)
- Action dispatching patterns
- Complete React component example
- Theme relationship diagrams
- State update patterns (immutable)
- Persistence behavior details
- Common patterns with code examples
- Error handling strategies
- Type safety tips

---

## File Location Quick Reference

### Frontend Files

| File | Purpose | Recommended? |
|------|---------|--------------|
| `/frontend/lib/stores/theme-extraction.store.ts` | Main theme store (315 lines, modular) | **YES - Use this** |
| `/frontend/lib/stores/literature-theme.store.ts` | Legacy theme store | No - Migrate to above |
| `/frontend/lib/stores/helpers/theme-extraction/types.ts` | Shared type definitions | Reference |
| `/frontend/lib/stores/helpers/theme-extraction/theme-actions.ts` | Theme CRUD operations | Reference |
| `/frontend/lib/stores/helpers/theme-extraction/selection-actions.ts` | Selection logic | Reference |
| `/frontend/lib/stores/helpers/theme-extraction/progress-actions.ts` | Progress tracking | Reference |
| `/frontend/lib/stores/helpers/theme-extraction/results-actions.ts` | Results management | Reference |
| `/frontend/lib/stores/helpers/theme-extraction/config-modal-actions.ts` | Configuration & modals | Reference |
| `/frontend/lib/api/services/unified-theme-api.service.ts` | API client for theme endpoints | Reference |

### Backend Files

| File | Purpose |
|------|---------|
| `/backend/src/modules/literature/types/theme-extraction.types.ts` | Backend type definitions |
| `/backend/src/modules/literature/services/unified-theme-extraction.service.ts` | Theme extraction business logic |

---

## Key Types Quick Reference

### Core Data Structure
```typescript
UnifiedTheme {
  id: string
  label: string
  description?: string
  keywords: string[]
  weight: number (0-1)
  controversial: boolean
  confidence: number (0-1)
  sources: ThemeSource[]
  provenance: ThemeProvenance
  extractedAt: Date
  extractionModel: string
}
```

### Research Purpose Options
```typescript
'q_methodology'          // Q-sort studies
'survey_construction'    // Building surveys
'qualitative_analysis'   // Qualitative research
'literature_synthesis'   // Literature reviews
'hypothesis_generation'  // Generating hypotheses
```

### Expertise Levels
```typescript
'novice'        // Basic guidance
'intermediate'  // Standard features (default)
'advanced'      // Advanced options
'expert'        // Full feature access
```

### Source Types
```typescript
'paper'      // Academic papers
'youtube'    // YouTube videos
'podcast'    // Podcasts
'tiktok'     // TikTok videos
'instagram'  // Instagram posts
```

---

## What Each Document Is Best For

### I want to...

**...quickly understand theme structure**
→ Read THEME_QUICK_REFERENCE.md (5-10 minutes)

**...implement a feature using themes**
→ Read THEME_IMPLEMENTATION_GUIDE.md (20-30 minutes)

**...understand all the details**
→ Read THEME_STRUCTURE_REFERENCE.md (30-40 minutes)

**...debug a theme-related issue**
→ Read THEME_IMPLEMENTATION_GUIDE.md + THEME_STRUCTURE_REFERENCE.md

**...integrate theme extraction into a component**
→ Go to THEME_IMPLEMENTATION_GUIDE.md > "Real-World Example: Theme Extraction Component"

**...understand theme relationships**
→ Go to THEME_STRUCTURE_REFERENCE.md > "UnifiedTheme Core Interface"

**...see common code patterns**
→ Go to THEME_IMPLEMENTATION_GUIDE.md > "Common Patterns"

**...understand persistence behavior**
→ Go to THEME_IMPLEMENTATION_GUIDE.md > "Persistence Behavior"

---

## Document Organization

All three documents follow consistent organization:

1. **Overview/Summary** - High-level context
2. **Core Types** - Data structure definitions
3. **Store Structure** - State and actions
4. **Usage** - How to use in code
5. **Patterns** - Common approaches
6. **Examples** - Real-world code
7. **Details** - Deep dives into specific topics

---

## Key Concepts to Understand

### 1. UnifiedTheme Structure
A theme is extracted from multiple sources. Each theme has:
- **Basic metadata:** id, label, description, keywords, confidence
- **Source information:** Which papers/videos/podcasts contributed to this theme
- **Provenance data:** Statistics about source breakdown (papers vs. videos, etc.)

### 2. Theme Store (useThemeExtractionStore)
Single source of truth for:
- What themes exist in the system
- Which themes user has selected
- Current extraction progress
- Research purpose and expertise level
- Generated outputs (questions, hypotheses, survey)

### 3. Persistence
- Themes are automatically persisted to browser localStorage
- User selections are NOT persisted (safety feature)
- Progress state is NOT persisted (transient)
- Themes are restored when page reloads

### 4. Design Pattern: Modular Actions
Instead of monolithic store, functionality split across:
- `theme-actions.ts` - Add/remove/update themes
- `selection-actions.ts` - User selections
- `progress-actions.ts` - Progress tracking
- `results-actions.ts` - Generated outputs
- `config-modal-actions.ts` - Configuration

This makes the code more maintainable and testable.

---

## Common Workflows

### Workflow 1: Extract Themes from Papers
1. User selects papers
2. Component calls API: `extractThemesV2(sources, purpose)`
3. Store updates: `setAnalyzingThemes(true)`
4. Progress updates: `setExtractionProgress(progress)`
5. Store receives themes: `setUnifiedThemes(themes)`
6. User sees themed list in component

### Workflow 2: Select Themes for Export
1. User clicks theme checkbox
2. Component calls: `toggleThemeSelection(themeId)`
3. Selected themes are tracked in `selectedThemeIds`
4. Export uses: `selectedThemes = unifiedThemes.filter(t => selectedThemeIds.includes(t.id))`

### Workflow 3: Generate Survey from Themes
1. User confirms selected themes
2. Component calls: `generateSurvey(selectedThemeIds)`
3. Store receives survey: `setGeneratedSurvey(survey)`
4. User sees survey in preview component

---

## Architecture Overview

```
Frontend
├── React Components
│   └── Use: useThemeExtractionStore (Zustand)
│
├── Zustand Store (useThemeExtractionStore)
│   ├── State: themes, selections, progress, results
│   ├── Actions: spread from 5 helper modules
│   └── Persistence: localStorage via persist middleware
│
├── Store Helpers
│   ├── theme-actions.ts (CRUD)
│   ├── selection-actions.ts (Selection)
│   ├── progress-actions.ts (Progress)
│   ├── results-actions.ts (Results)
│   └── config-modal-actions.ts (Config)
│
└── API Service (UnifiedThemeAPIService)
    └── Calls: /api/themes/extract-v2 (WebSocket progress)
                /api/themes/provenance (Get details)

Backend
├── API Endpoints
│   ├── POST /api/themes/extract-v2 (WebSocket)
│   └── GET /api/themes/provenance/:themeId
│
├── Services
│   └── UnifiedThemeExtractionService
│       └── Extracts themes from papers/videos/podcasts
│
└── Database (Prisma)
    ├── UnifiedTheme (themes table)
    ├── ThemeSource (source tracking)
    └── ThemeProvenance (statistics)
```

---

## Version History

- **Phase 10.91** - Modular store architecture (current)
- **Phase 10.1** - Legacy store (useLiteratureThemeStore)
- **Phase 9** - Initial theme extraction

**Recommendation:** Use Phase 10.91+ (useThemeExtractionStore) for all new code.

---

## Getting Help

If you can't find what you need:

1. **Quick question?** → THEME_QUICK_REFERENCE.md
2. **How do I implement X?** → THEME_IMPLEMENTATION_GUIDE.md (search for "X")
3. **What's the structure of Y?** → THEME_STRUCTURE_REFERENCE.md (search for "Y")
4. **Need example code?** → THEME_IMPLEMENTATION_GUIDE.md > "Real-World Example"

---

## Contributing

When updating theme structure:
1. Update the actual TypeScript files
2. Update THEME_STRUCTURE_REFERENCE.md with new types
3. Update THEME_QUICK_REFERENCE.md with new actions
4. Update THEME_IMPLEMENTATION_GUIDE.md with new examples

---

Last Updated: November 23, 2024
Documentation Status: Complete
