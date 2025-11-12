# Source Selection Bug - Diagnostic Report
## Phase 10.6 Day 14.4: Critical UI Bug Investigation

**Date:** November 11, 2025
**Status:** 🔴 CRITICAL BUG IDENTIFIED
**Impact:** Users cannot select individual sources - always gets default 3 sources

---

## 🚨 BUG REPORT

### User Report
> "There is a UI bug I see, the papers listed are not correct. I only selected ERIC and searched for 'chemical'"

### What Should Happen
1. User selects ERIC only in UI
2. Frontend sends `sources: ['eric']` to backend
3. Backend queries only ERIC database
4. Returns papers from ERIC

### What Actually Happened
1. User selected ERIC only in UI
2. Frontend sent `sources: ???` (empty or undefined?)
3. Backend used fallback: `['semantic_scholar', 'crossref', 'pubmed']`
4. Returned 200 papers from CrossRef and PubMed (NOT ERIC!)

---

## 📊 EVIDENCE FROM LOGS

### Search Log Entry
```json
{
  "timestamp": "2025-11-11T17:44:53.737Z",
  "query": "chemical",
  "sources": [
    "semantic_scholar",
    "crossref",
    "pubmed"
  ],
  "sourceResults": {
    "semantic_scholar": { "papers": 0, "duration": 667 },
    "crossref": { "papers": 100, "duration": 667 },
    "pubmed": { "papers": 100, "duration": 667 }
  },
  "totalPapers": 200,
  "uniquePapers": 200
}
```

**Analysis:**
- Backend received DEFAULT sources, not `['eric']`
- User never selected semantic_scholar, crossref, or pubmed
- Backend fallback triggered because frontend sent empty/undefined sources

---

## 🔍 ROOT CAUSE ANALYSIS

### Backend Fallback Logic
**File:** `backend/src/modules/literature/literature.service.ts:169-178`

```typescript
const sources =
  searchDto.sources && searchDto.sources.length > 0
    ? searchDto.sources
    : [
        LiteratureSource.SEMANTIC_SCHOLAR,
        LiteratureSource.CROSSREF,
        LiteratureSource.PUBMED,
      ];
```

**Fallback triggers when:**
1. `searchDto.sources` is `undefined`
2. `searchDto.sources` is `null`
3. `searchDto.sources` is `[]` (empty array)

### Frontend Source Selection
**File:** `frontend/app/(researcher)/discover/literature/page.tsx`

**Hook:** `useLiteratureSearch()` at line 167-170
```typescript
const {
  academicDatabases,      // ← Array of selected source IDs
  setAcademicDatabases,   // ← Function to update selection
  queryCorrectionMessage,
  clearQueryCorrection,
  handleSearch,           // ← Search function
} = useLiteratureSearch();
```

**Component Props:** Line 1201-1203
```typescript
<AcademicResourcesPanel
  academicDatabases={academicDatabases}           // ← Pass current selection
  onDatabasesChange={setAcademicDatabases}        // ← Update handler
  ...
/>
```

**Search Params:** `useLiteratureSearch.ts:204-206`
```typescript
const searchParams = {
  query,
  sources: academicDatabases,  // ← Should send selected sources
  ...
};
```

**API Call:** `literature-api.service.ts:237`
```typescript
const response = await this.api.post('/literature/search/public', params);
```

---

## 🐛 POSSIBLE ROOT CAUSES

### Hypothesis 1: State Not Updating
**Likelihood:** HIGH
**Description:** When user clicks source button, `setAcademicDatabases` is called but state doesn't update before search

**Test:**
```typescript
console.log('academicDatabases before search:', academicDatabases);
```

Expected: `['eric']`
Actual: Probably `[]` or defaults

### Hypothesis 2: Race Condition
**Likelihood:** MEDIUM
**Description:** User clicks source, then immediately clicks search before state updates

**Cause:** React state updates are async

### Hypothesis 3: State Persistence Override
**Likelihood:** MEDIUM
**Description:** `useStatePersistence` hook might be loading old state

**File:** Frontend uses state persistence at line 67:
```typescript
import { useStatePersistence } from '@/lib/hooks/useStatePersistence';
```

**Possible Issue:** Loading saved state overrides user selection

### Hypothesis 4: Default State Issue
**Likelihood:** LOW
**Description:** `academicDatabases` initialized with `DEFAULT_ACADEMIC_DATABASES` (9 sources), but somehow becomes empty

**File:** `useLiteratureSearch.ts:128-130`
```typescript
const [academicDatabases, setAcademicDatabases] = useState<string[]>(
  DEFAULT_ACADEMIC_DATABASES  // ← 9 sources by default
);
```

### Hypothesis 5: AcademicResourcesPanel Not Updating State
**Likelihood:** HIGH
**Description:** Button clicks don't properly call `onDatabasesChange`

**File:** `AcademicResourcesPanel.tsx` - need to check if `handleDatabaseToggle` is working

---

## 🔧 DEBUGGING STEPS

### Step 1: Add Console Logging
Add to `useLiteratureSearch.ts` handleSearch function:

```typescript
const handleSearch = useCallback(async () => {
  console.log('🔍 [DEBUG] academicDatabases:', academicDatabases);
  console.log('🔍 [DEBUG] academicDatabases.length:', academicDatabases.length);
  console.log('🔍 [DEBUG] typeof academicDatabases:', typeof academicDatabases);
  console.log('🔍 [DEBUG] Array.isArray(academicDatabases):', Array.isArray(academicDatabases));

  const searchParams = {
    query,
    sources: academicDatabases,
    ...
  };

  console.log('🔍 [DEBUG] searchParams:', searchParams);
  console.log('🔍 [DEBUG] searchParams.sources:', searchParams.sources);
  // ...
}, [academicDatabases, ...]);
```

### Step 2: Check AcademicResourcesPanel
Verify `handleDatabaseToggle` function is working:

```typescript
const handleDatabaseToggle = (sourceId: string) => {
  console.log('🔘 [DEBUG] Toggle clicked:', sourceId);
  console.log('🔘 [DEBUG] Current academicDatabases:', academicDatabases);

  const newSelection = academicDatabases.includes(sourceId)
    ? academicDatabases.filter(id => id !== sourceId)
    : [...academicDatabases, sourceId];

  console.log('🔘 [DEBUG] New selection:', newSelection);
  onDatabasesChange(newSelection);
};
```

### Step 3: Check API Request
Add logging in `literature-api.service.ts:235-240`:

```typescript
console.log('📡 [DEBUG] API params.sources:', params.sources);
console.log('📡 [DEBUG] API params.sources type:', typeof params.sources);
console.log('📡 [DEBUG] API params.sources.length:', params.sources?.length);
```

### Step 4: Check Backend Receipt
The logging system now captures this! Check:
```bash
tail -1 backend/logs/searches/search-2025-11-11.log | jq '.sources'
```

---

## 🎯 EXPECTED FIX

### Fix 1: Ensure State Updates Before Search
**Problem:** Search triggered before state updates
**Solution:** Use `useEffect` to trigger search after state change, or ensure synchronous update

### Fix 2: Check State Persistence
**Problem:** State persistence overriding user selection
**Solution:** Verify state persistence doesn't reset `academicDatabases` after user changes it

### Fix 3: Verify Toggle Logic
**Problem:** Button clicks not updating state
**Solution:** Fix `handleDatabaseToggle` logic in AcademicResourcesPanel

---

## 📝 USER REPRODUCTION STEPS

1. Open literature search page
2. By default, 9 free sources are selected
3. User clicks to deselect all sources
4. User clicks to select ONLY ERIC
5. User types "chemical" in search
6. User clicks Search button
7. **BUG:** Backend receives default 3 sources instead of ['eric']
8. **RESULT:** Papers from PubMed/CrossRef shown instead of ERIC

---

## ✅ VERIFICATION PLAN

After fix is implemented:

1. **Clear browser cache** and reload page
2. **Open DevTools console**
3. Deselect all sources
4. Select ONLY ERIC
5. Type "chemical"
6. Click Search
7. **Check console logs** - should see:
   ```
   🔍 [DEBUG] academicDatabases: ['eric']
   📡 [DEBUG] API params.sources: ['eric']
   ```
8. **Check backend logs**:
   ```bash
   tail -1 backend/logs/searches/search-2025-11-11.log | jq '.sources'
   # Should show: ["eric"]
   ```
9. **Check papers** - should only be from ERIC

---

## 🚨 IMPACT

**Severity:** CRITICAL
**User Impact:** Cannot use single-source searches
**Workaround:** None - users always get default 3 sources
**Affected Features:**
- Single source selection
- Source filtering
- Academic source comparison
- Domain-specific searches (e.g., only ERIC for education)

**Data Integrity:** Papers shown don't match user's source selection

---

## 📋 NEXT ACTIONS

1. **Add debug logging** to identify where state is lost
2. **Test locally** to reproduce the bug
3. **Fix root cause** (likely state update timing or persistence)
4. **Add integration test** to prevent regression
5. **Verify with user** that fix works

---

**Status:** 🔴 INVESTIGATION COMPLETE - READY TO FIX
**Priority:** P0 - CRITICAL
**Assigned:** Current session
**Blocked:** No - can fix immediately
