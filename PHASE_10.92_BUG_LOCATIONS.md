# PHASE 10.92: BUG LOCATIONS QUICK REFERENCE
## Exact File Paths and Line Numbers for All Bugs

**Purpose:** Jump directly to each bug location and fix it
**Format:** File → Line → Problem → Fix

---

## 🔴 BUG #1: Full-Text Never Fetched

### Frontend: `frontend/lib/hooks/useThemeExtractionWorkflow.ts`

**Line 389-424:** Paper saving loop (MISSING: full-text fetch)

```typescript
// 📍 LOCATION: Lines 389-424
// ❌ CURRENT CODE:
for (const paper of papersToSave) {
  const saveResult = await savePaperWithRetry(paper);

  if (saveResult.success) {
    savedCount++;
    console.log(`✅ Saved: "${paper.title?.substring(0, 50)}..."`);
  }
  // ❌ MISSING: Full-text fetch!
}

// ✅ ADD AFTER LINE 395 (inside if block):
// Trigger full-text extraction
try {
  setPreparingMessage(
    `Extracting full-text (${savedCount}/${papersToSave.length})...`
  );

  const updatedPaper = await literatureAPI.fetchFullTextForPaper(paper.id);

  // Update paper in local state with full-text
  setPapers(prev =>
    prev.map(p => p.id === paper.id ? updatedPaper : p)
  );

  console.log(
    `   📄 Full-text: ${updatedPaper.hasFullText ? 'SUCCESS' : 'FAILED'} ` +
    `(${updatedPaper.fullTextWordCount || 0} words)`
  );
} catch (error) {
  console.warn(
    `   ⚠️  Full-text fetch failed for ${paper.id}: ${error.message}`
  );
}
```

---

## 🔴 BUG #2: Content Validation Incorrectly Counts Abstracts

### Frontend: `frontend/lib/hooks/useThemeExtractionHandlers.ts`

**Line 327-338:** Content requirement validation (WRONG: counts abstract overflow as full-text)

```typescript
// 📍 LOCATION: Lines 327-338
// ❌ CURRENT CODE (Line 328):
const fullTextCount =
  contentAnalysis.fullTextCount + contentAnalysis.abstractOverflowCount;
  // ❌ WRONG! Abstract overflow is NOT full-text

console.log(
  `📊 Full-text count (including overflow): ${fullTextCount}`
);

// ✅ REPLACE WITH:
const fullTextCount = contentAnalysis.fullTextCount;
const abstractOverflowCount = contentAnalysis.abstractOverflowCount;
const abstractCount = contentAnalysis.abstractCount;

console.log(`📊 Content Breakdown:`);
console.log(`   • Full-text papers: ${fullTextCount}`);
console.log(`   • Abstract overflow (>250 words): ${abstractOverflowCount}`);
console.log(`   • Abstract-only (<250 words): ${abstractCount}`);
console.log(`   • No content: ${contentAnalysis.noContentCount}`);
```

**Line 341-373:** Purpose requirement validations (UPDATE to use fullTextCount only)

```typescript
// 📍 LOCATION: Lines 341-356
// ✅ UPDATE validation for Literature Synthesis:
if (purpose === 'literature_synthesis' && fullTextCount < 10) {
  if (abstractOverflowCount >= 5) {
    // Soft warning - can proceed but quality may suffer
    toast.warning(
      `Literature Synthesis works best with 10+ full-text papers. ` +
      `You have ${fullTextCount} full-text and ${abstractOverflowCount} abstract overflow. ` +
      `Theme extraction will proceed, but quality may be lower than expected.`,
      { duration: 8000 }
    );
  } else {
    // Hard error - block extraction
    toast.error(
      `Cannot extract themes: Literature Synthesis requires at least 10 full-text papers ` +
      `for methodologically sound meta-ethnography. You have ${fullTextCount} full-text.`,
      { duration: 8000 }
    );
    setShowPurposeWizard(false);
    setAnalyzingThemes(false);
    return;
  }
}
```

---

## 🔴 BUG #3: Metadata Refresh Fails "Paper has no title"

### Backend: `backend/src/modules/literature/literature.service.ts`

**Line 4586-4593:** Metadata refresh function (MISSING: defensive title access)

```typescript
// 📍 LOCATION: Lines 4586-4593
// ❌ CURRENT CODE:
const dbPaper = await this.prisma.paper.findUnique({
  where: { id: paperId },
  select: { title: true, authors: true, year: true },
});

if (!dbPaper || !dbPaper.title) {
  throw new Error('Paper has no title for title-based search');
}

const searchQuery = encodeURIComponent(dbPaper.title.trim());

// ✅ REPLACE WITH:
const dbPaper = await this.prisma.paper.findUnique({
  where: { id: paperId },
  select: {
    title: true,
    authors: true,
    year: true,
    metadata: true,  // ← ADD THIS
  },
});

// Defensive title access with fallbacks
const paperTitle =
  dbPaper?.title ||
  (dbPaper?.metadata as any)?.title ||
  (dbPaper?.metadata as any)?.alternativeTitle;

if (!dbPaper) {
  throw new Error(`Paper ${paperId} not found in database`);
}

if (!paperTitle) {
  this.logger.error(
    `❌ Paper ${paperId} missing title in all locations`,
    {
      hasTopLevelTitle: !!dbPaper.title,
      hasMetadataTitle: !!(dbPaper.metadata as any)?.title,
      hasAlternativeTitle: !!(dbPaper.metadata as any)?.alternativeTitle,
      source: (dbPaper as any).source,
    }
  );
  throw new Error(
    `Paper ${paperId} has no title in checked locations ` +
    `(title, metadata.title, metadata.alternativeTitle)`
  );
}

// Use paperTitle for search (guaranteed to be non-null)
const searchQuery = encodeURIComponent(paperTitle.trim());
```

---

## 🔴 BUG #4: Database Title Field Inconsistency

### Backend: Database Migration (NEW FILE)

**File to create:** `backend/prisma/migrations/YYYYMMDD_normalize_paper_titles/migration.sql`

```sql
-- 📍 CREATE NEW MIGRATION FILE
-- Purpose: Normalize all paper titles to top-level title field

-- Step 1: Copy metadata.title to title field for papers with null title
UPDATE papers
SET title = metadata->>'title'
WHERE (title IS NULL OR title = '')
  AND metadata->>'title' IS NOT NULL;

-- Step 2: Copy metadata.alternativeTitle to title field for papers still with null title
UPDATE papers
SET title = metadata->>'alternativeTitle'
WHERE (title IS NULL OR title = '')
  AND metadata->>'alternativeTitle' IS NOT NULL;

-- Step 3: Log papers that still have no title (these need manual intervention)
SELECT
  id,
  source,
  doi,
  url,
  metadata
FROM papers
WHERE title IS NULL OR title = '';

-- Step 4: Add NOT NULL constraint (after verifying all papers have titles)
-- ALTER TABLE papers ALTER COLUMN title SET NOT NULL;
-- (Uncomment after verifying all papers have titles)
```

**Run migration:**
```bash
cd backend
npx prisma migrate dev --name normalize_paper_titles
```

---

## 🟡 BUG #5: Missing /api/logs Endpoint

### Frontend: `frontend/lib/utils/logger.ts`

**Line 70:** Backend endpoint configuration (404 errors)

```typescript
// 📍 LOCATION: Line 70
// ❌ CURRENT CODE:
this.config = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableBuffer: true,
  bufferSize: 100,
  batchInterval: 5000,
  maskSensitiveData: true,
  backendEndpoint: '/api/logs',  // ❌ Endpoint doesn't exist!
  ...config,
};

// ✅ REPLACE WITH:
this.config = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableBuffer: true,
  bufferSize: 100,
  batchInterval: 5000,
  maskSensitiveData: true,
  backendEndpoint: undefined,  // ✅ Disabled until backend implemented
  ...config,
};
```

**Line 356-370:** Flush buffer function (ADD: warning for missing endpoint)

```typescript
// 📍 LOCATION: Lines 356-370
// ✅ ADD after line 357 (inside flushBuffer method):
async flushBuffer(): Promise<void> {
  if (this.buffer.length === 0) {
    return;
  }

  const logsToSend = [...this.buffer];
  this.buffer = [];

  // Send to backend if endpoint configured
  if (this.config.backendEndpoint) {
    try {
      await fetch(this.config.backendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      // ✅ ADD: Only log once, not every 5 seconds
      if (!this.backendLoggingFailed) {
        console.warn('Backend logging unavailable - logs kept in browser only');
        this.backendLoggingFailed = true;
      }
      this.buffer = [...logsToSend, ...this.buffer];
    }
  }
}

// ✅ ADD class property at top of EnterpriseLogger class:
class EnterpriseLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private performanceMarks: Map<string, number> = new Map();
  private backendLoggingFailed = false;  // ← ADD THIS
  // ...
}
```

---

## 🟡 BUG #6: Inconsistent Content Type Definitions

### Frontend: `frontend/lib/types/content-types.ts` (NEW FILE)

**Create new file:** Shared content type definitions

```typescript
// 📍 CREATE NEW FILE: frontend/lib/types/content-types.ts

/**
 * Content Type Enum - Single source of truth
 *
 * DEFINITIONS:
 * - FULL_TEXT: Complete article text (3000-15000 words)
 * - ABSTRACT_OVERFLOW: Long abstract (250-500 words)
 * - ABSTRACT: Normal abstract (<250 words)
 * - NONE: No content available
 */
export enum ContentType {
  FULL_TEXT = 'full_text',
  ABSTRACT_OVERFLOW = 'abstract_overflow',
  ABSTRACT = 'abstract',
  NONE = 'none',
}

/**
 * Content Type Constants
 */
export const MIN_FULL_TEXT_WORDS = 3000;
export const MIN_ABSTRACT_OVERFLOW_WORDS = 250;
export const MIN_ABSTRACT_WORDS = 50;

/**
 * Type Guards
 */
export function isFullText(contentType: ContentType): boolean {
  return contentType === ContentType.FULL_TEXT;
}

export function isAbstractOverflow(contentType: ContentType): boolean {
  return contentType === ContentType.ABSTRACT_OVERFLOW;
}

export function isAbstract(contentType: ContentType): boolean {
  return contentType === ContentType.ABSTRACT;
}

export function hasContent(contentType: ContentType): boolean {
  return contentType !== ContentType.NONE;
}

/**
 * Content Type Classifier
 */
export function classifyContentType(
  text: string | undefined,
  hasFullText: boolean
): ContentType {
  if (!text || text.trim().length === 0) {
    return ContentType.NONE;
  }

  if (hasFullText) {
    return ContentType.FULL_TEXT;
  }

  const wordCount = text.split(/\s+/).length;

  if (wordCount >= MIN_ABSTRACT_OVERFLOW_WORDS) {
    return ContentType.ABSTRACT_OVERFLOW;
  }

  if (wordCount >= MIN_ABSTRACT_WORDS) {
    return ContentType.ABSTRACT;
  }

  return ContentType.NONE;
}

/**
 * Content Analysis Helper
 */
export interface ContentStats {
  fullTextCount: number;
  abstractOverflowCount: number;
  abstractCount: number;
  noContentCount: number;
  totalCount: number;
}

export function analyzeContentTypes(
  contents: Array<{ contentType: ContentType }>
): ContentStats {
  return contents.reduce(
    (stats, item) => {
      switch (item.contentType) {
        case ContentType.FULL_TEXT:
          stats.fullTextCount++;
          break;
        case ContentType.ABSTRACT_OVERFLOW:
          stats.abstractOverflowCount++;
          break;
        case ContentType.ABSTRACT:
          stats.abstractCount++;
          break;
        case ContentType.NONE:
          stats.noContentCount++;
          break;
      }
      stats.totalCount++;
      return stats;
    },
    {
      fullTextCount: 0,
      abstractOverflowCount: 0,
      abstractCount: 0,
      noContentCount: 0,
      totalCount: 0,
    }
  );
}
```

**Update imports in all files using content types:**

```typescript
// ✅ ADD to useThemeExtractionWorkflow.ts
import {
  ContentType,
  classifyContentType,
  MIN_ABSTRACT_OVERFLOW_WORDS,
} from '@/lib/types/content-types';

// ✅ UPDATE Line 459 in useThemeExtractionWorkflow.ts:
// BEFORE:
contentType = wordCount > 250 ? 'abstract_overflow' : 'abstract';

// AFTER:
contentType = wordCount >= MIN_ABSTRACT_OVERFLOW_WORDS
  ? ContentType.ABSTRACT_OVERFLOW
  : ContentType.ABSTRACT;
```

---

## 🔴 BUG #7: Missing Full-Text Fetch API Method

### Frontend: `frontend/lib/services/literature-api.service.ts`

**Add new method:** `fetchFullTextForPaper` (after line 500)

```typescript
// 📍 ADD AFTER LINE 500 (after exportCitations method)

/**
 * Fetch full-text for a single paper
 *
 * WORKFLOW:
 * 1. Call backend endpoint to trigger full-text fetch job
 * 2. Poll for completion (max 30 seconds)
 * 3. Return updated paper with full-text
 *
 * @param paperId - Paper ID
 * @returns Updated paper with full-text (if available)
 * @throws Error if fetch fails or times out
 */
async fetchFullTextForPaper(paperId: string): Promise<Paper> {
  try {
    console.log(`📄 [Full-Text Fetch] Starting for paper ${paperId}...`);

    // Trigger full-text extraction job
    const triggerResponse = await this.api.post(
      `/literature/fetch-fulltext/${paperId}`
    );

    console.log(`✅ [Full-Text Fetch] Job triggered for ${paperId}`);

    // Poll for completion (max 30 seconds, check every 3 seconds)
    const maxAttempts = 10;
    const pollInterval = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      console.log(
        `🔄 [Full-Text Fetch] Polling attempt ${attempt}/${maxAttempts} for ${paperId}...`
      );

      // Check paper status
      const statusResponse = await this.api.get(
        `/literature/library/${paperId}`
      );

      const updatedPaper = statusResponse.data.paper || statusResponse.data;

      // Check if full-text fetch completed (success or failed)
      if (
        updatedPaper.fullTextStatus === 'success' ||
        updatedPaper.fullTextStatus === 'failed'
      ) {
        console.log(
          `✅ [Full-Text Fetch] Completed for ${paperId}: ${updatedPaper.fullTextStatus}`
        );
        console.log(
          `   • Has full-text: ${updatedPaper.hasFullText ? 'YES' : 'NO'}`
        );
        console.log(
          `   • Word count: ${updatedPaper.fullTextWordCount || 0} words`
        );

        return updatedPaper;
      }
    }

    // Timeout - return paper as-is
    console.warn(
      `⚠️ [Full-Text Fetch] Timeout after ${maxAttempts * pollInterval / 1000}s for ${paperId}`
    );

    const finalResponse = await this.api.get(
      `/literature/library/${paperId}`
    );

    return finalResponse.data.paper || finalResponse.data;
  } catch (error: any) {
    console.error(
      `❌ [Full-Text Fetch] Failed for ${paperId}:`,
      error.message
    );

    // If paper not in database, return error
    if (error.response?.status === 404) {
      throw new Error(
        `Paper ${paperId} not found in database - save it first`
      );
    }

    // For other errors, re-throw
    throw error;
  }
}
```

**Backend endpoint (if missing):** `backend/src/modules/literature/literature.controller.ts`

```typescript
// 📍 ADD to LiteratureController class (if endpoint doesn't exist)

/**
 * Trigger full-text extraction for a single paper
 *
 * POST /api/literature/fetch-fulltext/:paperId
 */
@Post('fetch-fulltext/:paperId')
async fetchFullTextForPaper(
  @Param('paperId') paperId: string,
  @Request() req
): Promise<{ success: boolean; message: string }> {
  try {
    // Queue PDF extraction job
    await this.pdfQueueService.queuePaperForExtraction(paperId);

    return {
      success: true,
      message: `Full-text extraction queued for paper ${paperId}`,
    };
  } catch (error) {
    this.logger.error(
      `Failed to queue full-text extraction for ${paperId}`,
      error.stack
    );

    throw new HttpException(
      `Failed to queue full-text extraction: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

---

## 📋 CHECKLIST: Fix Each Bug Sequentially

Use this checklist to track your progress:

### Day 1: Full-Text Pipeline (Bugs #1, #7)
- [ ] Bug #7: Create `fetchFullTextForPaper()` in `literature-api.service.ts`
- [ ] Bug #7: Add backend endpoint (if missing)
- [ ] Bug #1: Add full-text fetch after paper save in `useThemeExtractionWorkflow.ts`
- [ ] Test: Save 3 papers, verify full-text fetched
- [ ] Verify: No "not_fetched" status after save

### Day 2: Content Validation (Bugs #2, #6)
- [ ] Bug #6: Create `frontend/lib/types/content-types.ts`
- [ ] Bug #2: Fix content counting in `useThemeExtractionHandlers.ts:328`
- [ ] Bug #2: Update validation logic (lines 341-393)
- [ ] Update: All imports to use shared types
- [ ] Test: Verify content counts are accurate

### Day 3: Metadata & Database (Bugs #3, #4)
- [ ] Bug #3: Fix title access in `literature.service.ts:4586-4593`
- [ ] Bug #4: Create database migration
- [ ] Bug #4: Run migration on dev database
- [ ] Bug #4: Verify all papers have titles
- [ ] Test: Refresh metadata for 10 papers

### Day 4: API Integration (Bug #5)
- [ ] Bug #5: Disable backend endpoint in `logger.ts:70`
- [ ] Bug #5: Add warning in `flushBuffer()`
- [ ] Test: Verify no 404 errors
- [ ] Optional: Implement backend endpoint

### Day 5: Integration Testing
- [ ] Create end-to-end test script
- [ ] Test Scenario 1: 10 papers with DOIs
- [ ] Test Scenario 2: 10 papers without DOIs
- [ ] Test Scenario 3: Mixed papers
- [ ] Test Scenario 4: Metadata refresh

### Day 6: Documentation
- [ ] Update Phase Tracker
- [ ] Create bug fix summary
- [ ] Update implementation guides

---

## 🎯 QUICK TIPS

### Finding the Bug Location:
1. Open file in VS Code
2. Press `Cmd+G` (Mac) or `Ctrl+G` (Windows)
3. Type line number
4. Press Enter

### Testing Your Fix:
1. Save changes
2. Rebuild: `npm run build`
3. Run dev server: `npm run dev`
4. Test the specific workflow affected by that bug

### Verifying Success:
- Bug #1: Check console for "Full-text: SUCCESS"
- Bug #2: Verify content counts don't include abstract overflow
- Bug #3: No "Paper has no title" errors
- Bug #4: All papers have non-null titles in DB
- Bug #5: No 404 errors in console
- Bug #6: TypeScript compiles with no errors
- Bug #7: `fetchFullTextForPaper` method exists and works

---

**End of Bug Locations Quick Reference**
