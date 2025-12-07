# Theme Data Structure - Absolute File Locations

This document lists all key theme-related files with their absolute paths for quick reference.

## Documentation Files (Generated for You)

```
/Users/shahabnazariadli/Documents/blackQmethhod/THEME_DOCUMENTATION_INDEX.md
/Users/shahabnazariadli/Documents/blackQmethhod/THEME_QUICK_REFERENCE.md
/Users/shahabnazariadli/Documents/blackQmethhod/THEME_STRUCTURE_REFERENCE.md
/Users/shahabnazariadli/Documents/blackQmethhod/THEME_IMPLEMENTATION_GUIDE.md
/Users/shahabnazariadli/Documents/blackQmethhod/THEME_FILE_LOCATIONS.md (this file)
```

## Frontend Store Files

### Main Store (RECOMMENDED)
```
/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/theme-extraction.store.ts
```
**Status:** Phase 10.91+ (Current, Modular)
**Size:** 315 lines
**What:** Main Zustand store for theme extraction
**Use:** Import useThemeExtractionStore in your components

### Legacy Store
```
/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/literature-theme.store.ts
```
**Status:** Phase 10.1 (Legacy, migrate to main store)
**What:** Older theme store implementation
**Use:** Only if maintaining legacy code

## Frontend Store Helper Modules

All in: `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/helpers/theme-extraction/`

```
types.ts                      # Shared type definitions
theme-actions.ts              # Theme CRUD (Add, Remove, Update, Clear)
selection-actions.ts          # Theme selection logic (Toggle, SelectAll)
progress-actions.ts           # Progress tracking (Analyzing, Progress updates)
results-actions.ts            # Results management (Questions, Hypotheses, Survey)
config-modal-actions.ts       # Configuration & modals
index.ts                       # Main export file
```

## Frontend API Service

```
/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/api/services/unified-theme-api.service.ts
```
**What:** Frontend API client
**Exports:** UnifiedTheme, ThemeSource, ThemeProvenance, ResearchPurpose, UserExpertiseLevel
**Methods:** extractThemesV2(), getProvenanceReport(), etc.

## Frontend Type Files

### Shared Library Types
```
/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/types/literature.types.ts
```

## Backend Files

### Type Definitions
```
/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/types/theme-extraction.types.ts
```
**What:** All theme-related TypeScript interfaces
**Exports:** PrismaUnifiedThemeWithRelations, PrismaThemeSourceRelation, PrismaThemeProvenanceRelation, type guards

### Theme Extraction Service
```
/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/services/unified-theme-extraction.service.ts
```
**What:** Business logic for theme extraction
**Responsible for:** Extracting themes from papers/videos/podcasts

### Controllers
```
/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/
```
Check for API controllers that handle theme endpoints

### Database Schema
```
/Users/shahabnazariadli/Documents/blackQmethhod/backend/prisma/schema.prisma
```
Look for: UnifiedTheme, ThemeSource, ThemeProvenance models

## How to Use These Paths

### In TypeScript Imports
```typescript
// Main store
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// Types
import type {
  UnifiedTheme,
  ExtractionProgress,
  ResearchPurpose,
} from '@/lib/stores/theme-extraction.store';

// API Service
import { UnifiedThemeAPIService } from '@/lib/api/services/unified-theme-api.service';
```

### Absolute Imports (for scripts)
```bash
# Frontend files
cat /Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/theme-extraction.store.ts

# Backend files
cat /Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/types/theme-extraction.types.ts
```

## File Directory Structure

```
/Users/shahabnazariadli/Documents/blackQmethhod/
├── frontend/
│   └── lib/
│       ├── stores/
│       │   ├── theme-extraction.store.ts          # MAIN STORE
│       │   ├── literature-theme.store.ts          # Legacy
│       │   └── helpers/theme-extraction/
│       │       ├── types.ts
│       │       ├── theme-actions.ts
│       │       ├── selection-actions.ts
│       │       ├── progress-actions.ts
│       │       ├── results-actions.ts
│       │       ├── config-modal-actions.ts
│       │       └── index.ts
│       ├── api/services/
│       │   └── unified-theme-api.service.ts       # API CLIENT
│       └── types/
│           └── literature.types.ts
│
├── backend/
│   ├── src/modules/literature/
│   │   ├── types/
│   │   │   └── theme-extraction.types.ts          # BACKEND TYPES
│   │   └── services/
│   │       └── unified-theme-extraction.service.ts
│   └── prisma/
│       └── schema.prisma
│
└── Documentation Files (NEW)
    ├── THEME_DOCUMENTATION_INDEX.md
    ├── THEME_QUICK_REFERENCE.md
    ├── THEME_STRUCTURE_REFERENCE.md
    ├── THEME_IMPLEMENTATION_GUIDE.md
    └── THEME_FILE_LOCATIONS.md (this file)
```

## Which File Should I Edit?

### I want to add a new store action
→ Edit: `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/helpers/theme-extraction/[appropriate-helper].ts`

### I want to use themes in a component
→ Import from: `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/theme-extraction.store.ts`

### I want to understand the theme data structure
→ Look at: `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/api/services/unified-theme-api.service.ts`

### I want to change theme extraction business logic
→ Edit: `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/services/unified-theme-extraction.service.ts`

### I want to add a new theme field
→ Edit: `/Users/shahabnazariadli/Documents/blackQmethhod/backend/prisma/schema.prisma`
→ Then: Create migration with `npx prisma migrate dev`

## Quick File Reference

| Task | File |
|------|------|
| Use theme store in component | `/frontend/lib/stores/theme-extraction.store.ts` |
| Add/remove/update theme | `/frontend/lib/stores/helpers/theme-extraction/theme-actions.ts` |
| Handle theme selection | `/frontend/lib/stores/helpers/theme-extraction/selection-actions.ts` |
| Track extraction progress | `/frontend/lib/stores/helpers/theme-extraction/progress-actions.ts` |
| Manage generated outputs | `/frontend/lib/stores/helpers/theme-extraction/results-actions.ts` |
| Call theme API | `/frontend/lib/api/services/unified-theme-api.service.ts` |
| Understand UnifiedTheme type | `/frontend/lib/api/services/unified-theme-api.service.ts` |
| Backend type definitions | `/backend/src/modules/literature/types/theme-extraction.types.ts` |
| Theme extraction logic | `/backend/src/modules/literature/services/unified-theme-extraction.service.ts` |
| Database models | `/backend/prisma/schema.prisma` |

## Environment Variables / Config

Check for theme-related configuration:
```
/Users/shahabnazariadli/Documents/blackQmethhod/backend/.env.example
/Users/shahabnazariadli/Documents/blackQmethhod/frontend/.env.local.example
```

## Testing Files

Look for test files:
```bash
find /Users/shahabnazariadli/Documents/blackQmethhod -name "*theme*test*" -o -name "*theme*.spec.*"
```

Current test file:
```
/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/__tests__/theme-extraction-store.integration.test.ts
```

## Git Integration

All these files are tracked in git at:
```
https://github.com/[user]/[repo]
```

View changes:
```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod
git log --oneline -- frontend/lib/stores/theme-extraction.store.ts
git diff -- backend/src/modules/literature/types/theme-extraction.types.ts
```

---

Last Updated: November 23, 2024
