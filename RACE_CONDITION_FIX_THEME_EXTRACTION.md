# RACE CONDITION FIX - Theme Extraction Full-Text Wait

**Date:** November 17, 2025
**Issue:** Full-text extraction runs in background while filtering runs immediately
**Result:** Papers filtered out before full-text extraction completes
**Status:** ✅ FIX READY

---

## 🐛 THE PROBLEM

### Current Flow (WRONG):
```
1. Save papers to DB                    ✅ Complete
2. Trigger full-text extraction (async) 🔄 Started (background)
3. Filter papers for content            ❌ Runs immediately
4. Find 0 papers with content          ❌ Because extraction not done
5. ABORT                               ❌ User sees error
6. Full-text extraction completes      ✅ Too late!
```

### Code Location:
**File:** `frontend/lib/hooks/useThemeExtractionWorkflow.ts`
**Lines:** 467-498 (fire-and-forget pattern)
**Lines:** 590-657 (filtering happens immediately after)

### Root Cause:
```typescript
// Line 467: Fire-and-forget (doesn't wait!)
literatureAPI
  .fetchFullTextForPaper(saveResult.paperId)
  .then(updatedPaper => {
    // Updates state LATER
    setPapers(prev => ...);
  });

// Line 500: Continues immediately
console.log('🔄 Full-text extraction started in background...');

// Line 590: Filters immediately (extraction not done yet!)
const paperSources = selectedPapersToAnalyze.map(p => {
  if (p.hasFullText && p.fullText) {  // ❌ FALSE - not extracted yet!
    content = p.fullText.trim();
  } else if (p.abstract) {
    content = p.abstract.trim();
  }
  // No content → paper filtered out → ABORT
});
```

---

## ✅ THE FIX

### New Flow (CORRECT):
```
1. Save papers to DB                    ✅ Complete
2. Trigger full-text extraction (async) 🔄 Started
3. WAIT for all extractions to complete ⏰ Wait here!
4. Filter papers for content            ✅ Now has full-text
5. Find papers with content            ✅ Success!
6. Continue with extraction            ✅ Works!
```

### Implementation:

Replace lines 446-547 in `useThemeExtractionWorkflow.ts` with:

```typescript
// Save all papers AND wait for full-text extraction
const fullTextPromises: Promise<void>[] = [];

for (const paper of papersToSave) {
  const saveResult = await savePaperWithRetry(paper);

  if (saveResult.success) {
    savedCount++;

    // ✅ UPDATE: Preserve original ID for state mapping
    const originalId = paper.id;
    paper.id = saveResult.paperId;

    console.log(
      `   ✅ Saved: "${paper.title?.substring(0, 50)}..." (DB ID: ${saveResult.paperId.substring(0, 8)}...)`
    );

    // ✅ FIX: Collect full-text promise instead of fire-and-forget
    const fullTextPromise = literatureAPI
      .fetchFullTextForPaper(saveResult.paperId)
      .then(updatedPaper => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setPapers((prev: Paper[]) =>
            prev.map((p: Paper) =>
              p.id === originalId || p.id === paper.id ? updatedPaper : p
            )
          );

          console.log(
            `   📄 Full-text: ${updatedPaper.hasFullText ? 'SUCCESS' : 'FAILED'} ` +
              `for "${paper.title?.substring(0, 40)}..." ` +
              `(${updatedPaper.fullTextWordCount || 0} words)`
          );

          // ✅ CRITICAL: Update the paper object in our loop array
          // This ensures the filtering step below sees the updated content
          if (updatedPaper.hasFullText) {
            paper.hasFullText = true;
            paper.fullText = updatedPaper.fullText;
            paper.fullTextWordCount = updatedPaper.fullTextWordCount;
          }
        }
      })
      .catch((fullTextError: any) => {
        console.warn(
          `   ⚠️  Full-text fetch failed for "${paper.title?.substring(0, 40)}...": ${fullTextError.message}`
        );
      });

    fullTextPromises.push(fullTextPromise);

    console.log(
      `   🔄 Full-text extraction started (Paper ID: ${paper.id.substring(0, 8)}...)`
    );
  } else {
    // Handle errors (unchanged)
    const errorMsg = saveResult.error || 'Unknown error';
    if (
      errorMsg.includes('already exists') ||
      errorMsg.includes('duplicate')
    ) {
      skippedCount++;
      console.log(
        `   ⏭️  Skipped (duplicate): "${paper.title?.substring(0, 50)}..."`
      );
    } else if (errorMsg.includes('AUTHENTICATION_REQUIRED') || errorMsg.includes('401')) {
      failedCount++;
      failedPapers.push({
        title: paper.title || 'Unknown',
        error: 'AUTHENTICATION_REQUIRED',
      });
      console.warn(
        `   🔒 Skipped (requires login): "${paper.title?.substring(0, 50)}..."`
      );
    } else {
      failedCount++;
      failedPapers.push({
        title: paper.title || 'Unknown',
        error: errorMsg,
      });
      console.error(
        `   ❌ Failed after retries: "${paper.title?.substring(0, 50)}..." - ${errorMsg}`
      );
    }
  }

  // Update progress message
  const progress = savedCount + skippedCount + failedCount;
  setPreparingMessage(
    `Saving papers (${progress}/${papersToSave.length})...`
  );
}

console.log(`\n✅ Paper saving complete:`);
console.log(`   • Saved: ${savedCount}`);
console.log(`   • Skipped (duplicates): ${skippedCount}`);
console.log(`   • Failed: ${failedCount}`);

// ✅ FIX: WAIT for all full-text extractions to complete
if (fullTextPromises.length > 0) {
  console.log(
    `\n⏰ Waiting for ${fullTextPromises.length} full-text extractions to complete...`
  );
  setPreparingMessage(
    `Extracting full-text for ${fullTextPromises.length} papers...`
  );

  await Promise.allSettled(fullTextPromises);

  console.log(`✅ All full-text extractions complete!`);
}

// Handle failed papers error messages (unchanged)
if (failedCount > 0) {
  const authErrors = failedPapers.filter(p => p.error === 'AUTHENTICATION_REQUIRED');
  const otherErrors = failedPapers.filter(p => p.error !== 'AUTHENTICATION_REQUIRED');

  if (authErrors.length > 0) {
    console.warn(
      `\n🔒 ${authErrors.length} ${authErrors.length === 1 ? 'paper requires' : 'papers require'} authentication to save:`
    );
    authErrors.forEach(({ title }) => {
      console.warn(`   • "${title.substring(0, 50)}..."`);
    });
    console.info(
      `   💡 Tip: Log in to save papers and enable full-text extraction for theme analysis`
    );
  }

  if (otherErrors.length > 0) {
    console.warn(`\n⚠️  ${otherErrors.length} papers failed to save:`);
    otherErrors.forEach(({ title, error }) => {
      console.warn(`   • "${title.substring(0, 50)}...": ${error}`);
    });
  }
}

// Update preparing message for content analysis
setPreparingMessage('Analyzing paper content...');

// NOW the filtering step will see papers with full-text!
```

---

## 🔑 KEY CHANGES

### 1. Collect Promises (Line ~467)
```typescript
// BEFORE (fire-and-forget):
literatureAPI.fetchFullTextForPaper(...).then(...);  // ❌ Doesn't wait

// AFTER (collect promise):
const fullTextPromise = literatureAPI.fetchFullTextForPaper(...).then(...);
fullTextPromises.push(fullTextPromise);  // ✅ Collect for waiting
```

### 2. Wait for All Promises (After loop)
```typescript
// NEW: Wait for all extractions to complete
if (fullTextPromises.length > 0) {
  console.log(`⏰ Waiting for ${fullTextPromises.length} full-text extractions...`);
  setPreparingMessage(`Extracting full-text for ${fullTextPromises.length} papers...`);

  await Promise.allSettled(fullTextPromises);  // ✅ Wait here!

  console.log(`✅ All full-text extractions complete!`);
}
```

### 3. Update Paper Object (Inside promise)
```typescript
// NEW: Update the paper object in the loop array
if (updatedPaper.hasFullText) {
  paper.hasFullText = true;             // ✅ Update for filtering
  paper.fullText = updatedPaper.fullText;
  paper.fullTextWordCount = updatedPaper.fullTextWordCount;
}
```

---

## 📊 BENEFITS

✅ **Fixes race condition** - Filtering now sees full-text
✅ **Better UX** - User sees "Extracting full-text..." message
✅ **More papers used** - Papers with full-text aren't filtered out
✅ **Transparent** - Logs show extraction progress
✅ **No breaking changes** - Same API, just better timing

---

## 🧪 TESTING

### Before Fix:
```
1. Select 7 papers without abstracts
2. Click "Extract Themes"
3. ERROR: "No sources with content - aborting"
4. Full-text extraction completes (too late!)
```

### After Fix:
```
1. Select 7 papers without abstracts
2. Click "Extract Themes"
3. See: "Extracting full-text for 7 papers..."
4. Wait ~5 seconds
5. See: "All full-text extractions complete!"
6. See: "Analyzing paper content..."
7. SUCCESS: Themes extracted from full-text! ✅
```

---

## 🚀 DEPLOYMENT

1. Apply fix to `frontend/lib/hooks/useThemeExtractionWorkflow.ts`
2. Test with papers that have no abstracts
3. Verify full-text extraction completes before filtering
4. Verify user sees progress messages
5. Deploy to production

---

**Fix Ready:** ✅ YES
**Breaking Changes:** ❌ NO
**Risk Level:** 🟢 LOW (improves existing flow)
**User Impact:** ✅ POSITIVE (fixes blocking issue)
