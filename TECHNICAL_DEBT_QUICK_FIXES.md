# Literature Page - Quick Fixes Checklist
**Priority actions you can complete in 1 day**

## ✅ 5-Minute Fixes

### 1. Fix Syntax Error in Dynamic Import
**File:** `frontend/app/(researcher)/discover/literature/page.tsx`  
**Line:** 41-44

```typescript
// BEFORE (broken):
const PurposeSelectionWizard = dynamic(() => import('@/components/literature/PurposeSelectionWizard'), {
  loading: () => <div className="flex items-center justify-center p-8">
  ssr: false
;

// AFTER (fixed):
const PurposeSelectionWizard = dynamic(
  () => import('@/components/literature/PurposeSelectionWizard'), 
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
    ssr: false
  }
);
```

## ✅ 30-Minute Fixes

### 2. Add WebSocket Cleanup
**File:** `frontend/app/(researcher)/discover/literature/page.tsx`  
**After line:** 418

```typescript
// Add cleanup effect
useEffect(() => {
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    userIdRef.current = null;
  };
}, []);
```

### 3. Hide Unimplemented Social Media Features
**File:** `frontend/app/(researcher)/discover/literature/components/SocialMediaPanel.tsx`

```typescript
// Lines 155, 180, 193, 205, 219 - add disabled state
<Button 
  onClick={handleTikTokTranscribe}
  disabled={true}
  title="Coming soon - TikTok transcription"
>
  Transcribe
</Button>
```

## ✅ 2-Hour Fixes

### 4. Remove Debug Console Logs
**Command to find all:**
```bash
cd /Users/shahabnazariadli/.cursor/worktrees/blackQmethhod/LoGR3/frontend
rg "console\.log" app/\(researcher\)/discover/literature/ --type tsx
```

**Remove these:**
- `page.tsx` lines 338-346, 674-676
- `AcademicResourcesPanel.tsx` lines 239-248
- `PaperCard.tsx` (check for any)

**Replace with:**
```typescript
// Only for development
if (process.env.NODE_ENV === 'development') {
  // Debug info here
}
```

### 5. Delete Commented Code
**Files to clean:**
- `frontend/app/(researcher)/discover/literature/page.tsx`

**Delete lines:**
- 11, 77, 92, 98, 110, 115, 124, 145
- 167-169 (commented constants)
- 217 (commented selectedView)
- 267 (commented handlers)
- 413 (commented useWaitForFullText)

**Rule:** If it's commented, delete it. Git has the history.

### 6. Create Logger Service
**File:** `frontend/lib/utils/logger.ts` (create new)

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};
```

Then replace all `console.log` with `logger.debug`.

## ✅ 4-Hour Fixes

### 7. Extract API Configuration
**File:** `frontend/config/api.config.ts` (create new)

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 30000,
  endpoints: {
    literature: '/api/literature',
    themes: '/api/themes',
    // ... more endpoints
  },
} as const;

// Runtime validation
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('⚠️  NEXT_PUBLIC_API_URL not set, using localhost');
}
```

**Update usage in:**
- `page.tsx` line 739
- `PaperCard.tsx` line 848

```typescript
// BEFORE:
const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';

// AFTER:
import { API_CONFIG } from '@/config/api.config';
const apiUrl = API_CONFIG.baseURL;
```

### 8. Add Error Boundaries
**File:** `frontend/components/common/ErrorBoundary.tsx` (create new)

```typescript
'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-gray-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap critical sections:**
```typescript
// In page.tsx
<ErrorBoundary>
  <ThemeExtractionContainer />
</ErrorBoundary>

<ErrorBoundary>
  <GapAnalysis />
</ErrorBoundary>
```

## ✅ Full Day Project

### 9. Create Component Architecture Diagram
**File:** `frontend/app/(researcher)/discover/literature/ARCHITECTURE.md`

```markdown
# Literature Page Architecture

## Current Structure (Anti-Pattern)
```
page.tsx (3,188 lines) 
  ├── All search logic
  ├── All theme extraction
  ├── All gap analysis
  ├── All paper management
  ├── All social media
  └── All state management
```

## Proposed Structure (Clean Architecture)
```
page.tsx (200-300 lines - orchestration only)
  ├── SearchContainer (300 lines)
  │   ├── SearchBar
  │   ├── FilterPanel
  │   └── SearchResults
  ├── ThemeExtractionContainer (400 lines)
  │   ├── ThemeList
  │   ├── ThemeActions
  │   └── ExtractionProgress
  ├── PaperManagementContainer (300 lines)
  │   ├── PaperLibrary
  │   ├── PaperSelection
  │   └── BulkActions
  ├── GapAnalysisContainer (250 lines)
  │   └── GapVisualization
  └── SocialMediaContainer (existing)
```

## State Management Strategy
- **Zustand Stores** for global state (search, papers, themes)
- **Local useState** for UI-only state (modals, expanded panels)
- **Hooks** for business logic (thin wrappers around stores)
```

### 10. Set Up ESLint Rules
**File:** `.eslintrc.js`

```javascript
module.exports = {
  // ... existing config
  rules: {
    // Prevent large files
    'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    
    // Prevent large functions
    'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
    
    // No console in production
    'no-console': ['error', { allow: ['warn', 'error'] }],
    
    // Prefer logger service
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='console'][callee.property.name!=/^(warn|error)$/]",
        message: 'Use logger service instead of console.log',
      },
    ],
    
    // TypeScript strict
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    
    // React best practices
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-max-depth': ['warn', { max: 6 }],
  },
};
```

---

## Testing Your Fixes

### After Each Fix:
```bash
# 1. Run TypeScript check
npm run type-check

# 2. Run linter
npm run lint

# 3. Test the page
npm run dev
# Visit: http://localhost:3000/discover/literature

# 4. Check browser console (should be clean)
```

### Smoke Test Checklist:
- [ ] Page loads without errors
- [ ] Search works
- [ ] Paper selection works
- [ ] Theme extraction works
- [ ] No console errors
- [ ] No console.log spam

---

## Git Workflow

```bash
# Create feature branch
git checkout -b fix/literature-tech-debt

# Make fixes one at a time
git add frontend/app/\(researcher\)/discover/literature/page.tsx
git commit -m "fix: syntax error in PurposeSelectionWizard dynamic import"

git add frontend/components/literature/
git commit -m "chore: remove debug console.log statements"

git add frontend/app/\(researcher\)/discover/literature/page.tsx
git commit -m "chore: delete commented-out code"

# Push when done
git push origin fix/literature-tech-debt
```

---

## Next Steps After Quick Fixes

1. **Review full report:** `LITERATURE_TECHNICAL_DEBT_REPORT.md`
2. **Prioritize remaining issues:** Focus on God Component and State Management
3. **Plan refactoring sprint:** 2-3 weeks for major architecture changes
4. **Set up monitoring:** Track component size and complexity over time

---

## Questions?

If you're unsure about any fix:
1. Check the full report for context
2. Look at the "Recommended Fix" section
3. Test in development first
4. Ask for review before committing large changes

**Remember:** Small, incremental fixes are better than one massive refactor!

