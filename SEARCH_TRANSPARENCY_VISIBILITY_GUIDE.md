# Search Transparency Component - Visibility Guide

## 🔍 WHERE IS IT?

The SearchProcessIndicator component **only appears AFTER performing a search**.

## 📍 Location in Literature Page

**File:** `frontend/app/(researcher)/discover/literature/page.tsx` (line 1223)

**Position:** Between FilterPanel and ProgressiveLoadingIndicator

## ✅ Visibility Conditions (line 1231-1236)

The component shows when ALL three conditions are met:

```typescript
isVisible={
  searchMetadata !== null &&           // Backend returned metadata
  papers.length > 0 &&                 // Search returned results
  progressiveLoading.status !== 'loading'  // Progressive loading finished
}
```

## 🚀 How to See It

### Step 1: Navigate to Literature Page
Go to: `/discover/literature`

### Step 2: Perform a Search
1. Enter a query (e.g., "machine learning")
2. Click the Search button
3. Wait for progressive loading to complete

### Step 3: Scroll Down
After search completes, you'll see:

```
┌─────────────────────────────────────┐
│  Search Process Transparency        │
│  [Enterprise-Grade] [Download Audit]│
│                                      │
│  Sources: 8/10 returned results     │
│  Collected: 2,143 papers            │
│  Unique: 1,876 (12% duplicates)     │
│  Selected: 130 by quality           │
│                                      │
│  Top Contributing Sources:          │
│  #1 PubMed [456]                    │
│  #2 Semantic Scholar [892]          │
│  #3 Google Scholar [234]            │
│                                      │
│  [Expanded source breakdown below]  │
└─────────────────────────────────────┘
```

## 🐛 Debugging - Check Browser Console

There are debug logs at:
- **SearchProcessIndicator** (line 206-213): Shows props received
- **Literature Page** (line 303-307): Shows metadata from store

**Open browser console and look for:**
```
[SearchProcessIndicator] Received props: {
  query: "machine learning",
  hasMetadata: true,
  metadataKeys: [...],
  searchStatus: "completed",
  isVisible: true,
  willRender: true
}
```

If `willRender: false`, check which condition failed.

## ❌ Why You Don't See It (Common Issues)

### Issue 1: Haven't Performed Search Yet
**Symptom:** Blank literature page
**Solution:** Enter query and click Search

### Issue 2: searchMetadata is null
**Symptom:** Console shows `hasMetadata: false`
**Solution:** Check backend is returning metadata in response

### Issue 3: Progressive Loading Still Active
**Symptom:** Only see ProgressiveLoadingIndicator
**Solution:** Wait for all batches to complete

### Issue 4: No Papers Returned
**Symptom:** `papers.length: 0`
**Solution:** Try different search query

## 🔧 Manual Test Steps

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Literature:**
   `http://localhost:3000/discover/literature`

3. **Open Browser Console:**
   Press F12 or Cmd+Option+I

4. **Perform Search:**
   - Enter: "machine learning"
   - Click Search

5. **Watch Console:**
   Look for: `[SearchProcessIndicator] Received props`

6. **Verify Component:**
   Should see transparency panel with:
   - Download Audit Report button
   - 4 quick stats cards
   - Top Contributing Sources section
   - Expandable source breakdown (red/amber/green cards)

## ✅ Expected Behavior

### Before Search
- ❌ SearchProcessIndicator: Hidden
- ✅ Search bar: Visible
- ✅ Filters: Visible

### During Search
- ❌ SearchProcessIndicator: Hidden
- ✅ ProgressiveLoadingIndicator: Showing batches

### After Search
- ✅ SearchProcessIndicator: VISIBLE (this is where enhancements are!)
- ✅ Papers grid: Showing results
- ❌ ProgressiveLoadingIndicator: Hidden

## 📊 Component Features (Phase 10.6 Day 14.5)

When visible, you should see:

### 1. Header with Download Button ✅
- "Search Process Transparency" title
- "Download Audit Report" button (CSV export)
- Expand/collapse chevron (default: expanded)

### 2. Quick Stats (4 cards) ✅
- Sources: 8/10 returned results
- Collected: 2,143 papers
- Unique: 1,876 (12% duplicates removed)
- Selected: 130 by quality score

### 3. Top Contributing Sources ✅
- #1 PubMed [456]
- #2 Semantic Scholar [892]
- #3 Google Scholar [234]

### 4. Quality Check Badges ✅
- 40% Citation Impact
- 35% Journal Prestige
- 25% Content Depth
- OpenAlex Enrichment

### 5. Expanded Details (default: expanded) ✅
- **Processing Pipeline:** 4 stages with checkmarks
- **Source Performance:** Grid of all sources
  - Green cards: Success (papers > 0)
  - Red cards: Errors (with error message)
  - Amber cards: No matches (with reason)

## 🎯 Quick Verification Checklist

- [ ] Go to /discover/literature
- [ ] Open browser console (F12)
- [ ] Enter search query
- [ ] Click Search button
- [ ] Wait for loading to complete
- [ ] Scroll down below filters
- [ ] See "Search Process Transparency" panel
- [ ] See "Download Audit Report" button
- [ ] See 4 quick stats cards
- [ ] See "Top Contributing Sources" section
- [ ] See expanded source breakdown (colored cards)
- [ ] Click "Download Audit Report"
- [ ] Verify CSV downloads
- [ ] Open CSV in Excel/Sheets
- [ ] Verify 4 sections in CSV

## 📞 Still Don't See It?

Check these files for issues:

1. **Backend returning metadata?**
   - File: `backend/src/modules/literature/literature.service.ts` (line 495-522)
   - Should return `metadata: { totalCollected, sourceBreakdown, ... }`

2. **Frontend storing metadata?**
   - File: `frontend/lib/hooks/useProgressiveSearch.ts` (line 319)
   - Should call `setSearchMetadata(searchMetadata)`

3. **Component receiving props?**
   - Check console: `[SearchProcessIndicator] Received props`
   - Should have `hasMetadata: true`, `willRender: true`

4. **Visibility conditions met?**
   - Check: `searchMetadata !== null`
   - Check: `papers.length > 0`
   - Check: `progressiveLoading.status !== 'loading'`

---

**Summary:** The SearchProcessIndicator is **working correctly** but only shows **after search completes**. Perform a search to see the enhanced transparency UI.
