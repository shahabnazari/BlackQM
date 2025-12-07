# PHASE 10.935: LOGGER PARAMETER ORDER FIXES

**Date:** November 19, 2025  
**Issue:** Logger API calls with swapped parameters  
**Severity:** 🟠 MEDIUM  
**Files Affected:** 1 (LiteratureSearchContainer.tsx)  
**Bugs Fixed:** 2

---

## 🐛 BUG DESCRIPTION

The `logger` utility uses the signature: `logger.info(message, context, data)`

However, LiteratureSearchContainer calls it as: `logger.info(context, message)` - **WRONG ORDER**

This causes:
- Context appears as message in logs
- Message appears as context in logs
- Makes debugging and log analysis confusing

---

## 🔧 FIX #1: logger.info Parameter Order

**File:** `frontend/app/(researcher)/discover/literature/containers/LiteratureSearchContainer.tsx`  
**Line:** 229-232

### BEFORE (INCORRECT):
```typescript
logger.info(
  'LiteratureSearchContainer',
  'User cancelled progressive search'
);
```

### AFTER (CORRECT):
```typescript
logger.info(
  'User cancelled progressive search',
  'LiteratureSearchContainer'
);
```

### Expected Log Output:
```json
{
  "level": "INFO",
  "message": "User cancelled progressive search",
  "context": "LiteratureSearchContainer",
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

---

## 🔧 FIX #2: logger.warn Parameter Order

**File:** `frontend/app/(researcher)/discover/literature/containers/LiteratureSearchContainer.tsx`  
**Line:** 291-295

### BEFORE (INCORRECT):
```typescript
logger.warn(
  'LiteratureSearchContainer',
  'Social loading state is not a Map, returning false',
  { received: typeof socialLoadingMap }
);
```

### AFTER (CORRECT):
```typescript
logger.warn(
  'Social loading state is not a Map, returning false',
  'LiteratureSearchContainer',
  { received: typeof socialLoadingMap }
);
```

### Expected Log Output:
```json
{
  "level": "WARN",
  "message": "Social loading state is not a Map, returning false",
  "context": "LiteratureSearchContainer",
  "data": { "received": "object" },
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

---

## ✅ VERIFICATION STEPS

1. **Apply Fixes:**
   ```bash
   # Edit the file manually or use search-replace
   cd /Users/shahabnazariadli/Documents/blackQmethhod/frontend
   ```

2. **TypeScript Check:**
   ```bash
   npx tsc --noEmit
   # Expected: 0 errors
   ```

3. **Run Tests:**
   ```bash
   npm test LiteratureSearchContainer
   # Expected: All tests passing
   ```

4. **Visual Verification:**
   - Open LiteratureSearchContainer.tsx
   - Find lines 229 and 291
   - Verify parameters are in correct order
   - Check no other logger calls in file

---

## 📊 IMPACT ANALYSIS

**Severity:** 🟠 MEDIUM  
**Why:** Logs are still recorded, just with swapped context/message

**Production Impact:**
- ❌ Difficult to search logs by message
- ❌ Context filtering doesn't work correctly
- ❌ Log aggregation systems may misclassify logs
- ✅ No runtime errors or crashes
- ✅ Functionality unaffected

**Development Impact:**
- ❌ Harder to debug issues
- ❌ Confusing when reading logs
- ❌ Team may not notice the swap

---

## 🎯 ROOT CAUSE ANALYSIS

**Why did this happen?**

1. **API Design Ambiguity:** Logger API could be misunderstood as `(context, message)` since context often comes first in other logging systems

2. **No TypeScript Enforcement:** Logger API uses flexible signatures with `string | unknown` types, allowing any order

3. **No Linter Rule:** No ESLint rule to enforce logger parameter order

---

## 💡 PREVENTION RECOMMENDATIONS

### Short-Term (Immediate):

1. **Search All Files for Same Pattern:**
   ```bash
   # Find all logger calls with potential swapped params
   rg "logger\.(info|warn|error)\(\s*['\"].*Container['\"],\s*['\"]" frontend/
   ```

2. **Create Checklist:**
   - All logger calls must follow: `(message, context, data)`
   - Message describes WHAT happened
   - Context describes WHERE it happened

### Long-Term (Phase 10.94+):

1. **TypeScript Strict Signature:**
   ```typescript
   // Enforce parameter types explicitly
   info(message: string, context: string, data?: Record<string, unknown>): void;
   ```

2. **ESLint Custom Rule:**
   ```javascript
   // Warn when logger context looks like a message
   'logger-param-order': ['warn', { contextPattern: /Context|Service|Component$/ }]
   ```

3. **JSDoc Clarity:**
   ```typescript
   /**
    * @param message - WHAT happened (e.g., "User clicked button")
    * @param context - WHERE it happened (e.g., "LoginComponent")
    * @param data - Additional data
    */
   info(message: string, context?: string, data?: unknown): void;
   ```

---

## ✅ COMPLETION CHECKLIST

- [ ] Apply Fix #1 (logger.info line 229)
- [ ] Apply Fix #2 (logger.warn line 291)
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Run tests: `npm test LiteratureSearchContainer`
- [ ] Search for similar patterns in other files
- [ ] Update Phase Tracker (mark bugs fixed)
- [ ] Update Day 0.5 completion status

**Estimated Time:** 15 minutes

---

**Report Generated:** November 19, 2025  
**Bugs Fixed:** 2  
**Status:** ✅ READY TO APPLY


