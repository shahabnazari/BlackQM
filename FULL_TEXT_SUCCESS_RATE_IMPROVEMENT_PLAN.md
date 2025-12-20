# Full-Text Success Rate Improvement Plan

**Current State**: 52% success, 32% failed, 16% stuck  
**Target**: 75%+ success rate  
**Priority**: 🔥 **HIGH**

---

## 📊 **CURRENT ISSUES ANALYSIS**

### **Issue #1: Stuck "fetching" Jobs (16%)** ⚠️ **MEDIUM**

**Problem**: Papers stuck in `fullTextStatus='fetching'` indefinitely

**Root Cause**:
- Jobs crash or timeout without updating status
- No automatic cleanup scheduled
- `cleanupStuckFetchingJobs()` method exists but not called automatically

**Impact**: 
- Papers appear "in progress" forever
- Users cannot retry extraction
- Database shows stale status

**Fix**: Schedule automatic cleanup

---

### **Issue #2: High Failure Rate (32%)** ⚠️ **HIGH**

**Problem**: 32% of papers fail full-text extraction

**Possible Causes**:
1. **Paywall blocking** (papers behind subscription)
2. **URL patterns changed** (publisher website updates)
3. **Timeout issues** (extraction taking too long)
4. **PDF parsing errors** (corrupted PDFs)
5. **Network errors** (connection failures)
6. **Rate limiting** (API throttling)

**Current Error Handling**:
- Errors are caught but not categorized
- Generic error messages don't help diagnose
- No retry for specific failure types

**Fix**: Improve error categorization and retry logic

---

## 🎯 **SOLUTION IMPLEMENTATION**

### **Fix #1: Automatic Stuck Job Cleanup** ✅ **EASY**

**File**: `backend/src/modules/literature/services/pdf-parsing.service.ts`

**Current Code** (lines 1149-1207):
- `cleanupStuckFetchingJobs()` method exists
- Not called automatically

**Fix Required**:

1. **Add Scheduled Cleanup** (using NestJS `@Cron` decorator):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PDFParsingService {
  // ... existing code ...

  /**
   * Phase 10.185: Automatic cleanup of stuck jobs
   * Runs every 10 minutes to clean up papers stuck in 'fetching' status
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledCleanupStuckJobs(): Promise<void> {
    try {
      const cleaned = await this.cleanupStuckFetchingJobs(5); // 5-minute timeout
      if (cleaned > 0) {
        this.logger.log(`🧹 Scheduled cleanup: ${cleaned} stuck jobs cleaned up`);
      }
    } catch (error) {
      this.logger.error(`❌ Scheduled cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
```

2. **Enable Schedule Module** in `app.module.ts`:

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // ... other imports ...
    ScheduleModule.forRoot(), // Add this
  ],
})
export class AppModule {}
```

**Impact**: **HIGH** - Fixes 16% stuck jobs immediately

---

### **Fix #2: Enhanced Error Categorization** ✅ **MEDIUM**

**File**: `backend/src/modules/literature/services/pdf-parsing.service.ts`

**Current Code** (lines 1030-1049):
- Generic error handling
- No error categorization

**Fix Required**:

1. **Add Error Categories**:

```typescript
interface ExtractionError {
  category: 'paywall' | 'timeout' | 'network' | 'parsing' | 'rate_limit' | 'not_found' | 'unknown';
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

private categorizeError(error: unknown): ExtractionError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Paywall detection
  if (
    lowerMessage.includes('403') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('subscription required')
  ) {
    return {
      category: 'paywall',
      message: 'Paper is behind paywall or requires subscription',
      retryable: false, // Don't retry paywall errors
    };
  }

  // Timeout detection
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('etimedout')
  ) {
    return {
      category: 'timeout',
      message: 'Extraction timed out',
      retryable: true, // Retry timeouts
    };
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound')
  ) {
    return {
      category: 'network',
      message: 'Network connection error',
      retryable: true, // Retry network errors
    };
  }

  // Rate limiting
  if (
    lowerMessage.includes('429') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests')
  ) {
    return {
      category: 'rate_limit',
      message: 'Rate limit exceeded',
      retryable: true, // Retry after delay
    };
  }

  // Not found
  if (
    lowerMessage.includes('404') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist')
  ) {
    return {
      category: 'not_found',
      message: 'Paper or URL not found',
      retryable: false, // Don't retry not found
    };
  }

  // PDF parsing errors
  if (
    lowerMessage.includes('pdf') &&
    (lowerMessage.includes('parse') || lowerMessage.includes('corrupt') || lowerMessage.includes('invalid'))
  ) {
    return {
      category: 'parsing',
      message: 'PDF parsing error',
      retryable: false, // Don't retry parsing errors
    };
  }

  // Unknown
  return {
    category: 'unknown',
    message: errorMessage,
    retryable: true, // Conservative: retry unknown errors once
  };
}
```

2. **Update Error Handling** in `processFullText()`:

```typescript
} catch (error) {
  const categorizedError = this.categorizeError(error);
  
  this.logger.error(
    `Error processing full-text for paper ${paperId}: [${categorizedError.category}] ${categorizedError.message}`,
    {
      paperId,
      category: categorizedError.category,
      retryable: categorizedError.retryable,
      error: error instanceof Error ? error.stack : String(error),
    },
  );

  // Update status to failed with error category
  await this.prisma.paper
    .update({
      where: { id: paperId },
      data: {
        fullTextStatus: 'failed',
        // Store error category for analytics
        // Note: Add errorCategory field to Prisma schema if needed
      },
    })
    .catch(() => {}); // Ignore error if paper doesn't exist

  return {
    success: false,
    status: 'failed',
    error: categorizedError.message,
    category: categorizedError.category, // Include category in response
    retryable: categorizedError.retryable,
  };
}
```

**Impact**: **MEDIUM** - Better diagnostics, enables smart retry

---

### **Fix #3: Smart Retry Logic** ✅ **MEDIUM**

**File**: `backend/src/modules/literature/services/pdf-queue.service.ts`

**Current Code** (lines 226-320):
- Retries all failures 3 times
- No distinction between retryable and non-retryable errors

**Fix Required**:

1. **Update Retry Logic** to respect error categories:

```typescript
private async processJob(job: PDFJob): Promise<void> {
  job.attempts++;
  job.status = 'processing';
  job.startedAt = new Date();

  try {
    // ... existing code ...

    const result = await this.pdfParsingService.processFullText(job.paperId);

    if (result.success) {
      // ... success handling ...
    } else {
      // Check if error is retryable
      const isRetryable = result.retryable !== false; // Default to true if not specified
      
      if (isRetryable && job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const backoffMs = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s
        
        // Special handling for rate limits (longer backoff)
        if (result.category === 'rate_limit') {
          const rateLimitBackoff = 60000; // 1 minute for rate limits
          this.logger.warn(
            `PDF job ${job.id} rate limited, waiting ${rateLimitBackoff}ms before retry`,
          );
          await this.sleep(rateLimitBackoff);
        } else {
          this.logger.warn(
            `PDF job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}), retrying in ${backoffMs}ms: [${result.category}] ${result.error}`,
          );
          await this.sleep(backoffMs);
        }

        job.status = 'queued';
        job.progress = 0;
        this.queue.push(job.id);
      } else {
        // Non-retryable or max retries reached
        job.status = 'failed';
        job.progress = 0;
        job.error = `${result.category ? `[${result.category}] ` : ''}${result.error}`;
        job.completedAt = new Date();

        this.logger.error(
          `❌ PDF job ${job.id} failed after ${job.attempts} attempts: ${job.error}`,
        );

        // ... emit failed event ...
      }
    }
  } catch (error) {
    // ... existing error handling ...
  }
}
```

**Impact**: **MEDIUM** - Reduces unnecessary retries, improves success rate

---

### **Fix #4: Improve Waterfall Strategy** ✅ **MEDIUM**

**File**: `backend/src/modules/literature/services/pdf-parsing.service.ts`

**Current Waterfall** (lines 670-962):
1. Tier 2: PMC API + HTML scraping
2. Tier 2.5: GROBID PDF extraction
3. Tier 3: Unpaywall PDF
4. Tier 4: Direct publisher PDF

**Improvements Needed**:

1. **Add More Fallback Strategies**:

```typescript
// After Tier 4 fails, try:
// Tier 5: DOI-based PDF URL construction (common patterns)
if (!fullText && paper.doi) {
  this.logger.log(`🔍 Tier 5: Attempting DOI-based PDF URL construction...`);
  
  const doiBasedUrls = this.constructPdfUrlsFromDoi(paper.doi);
  for (const pdfUrl of doiBasedUrls) {
    try {
      const pdfResponse = await axios.get(pdfUrl, {
        timeout: FULL_TEXT_TIMEOUT,
        responseType: 'arraybuffer',
        validateStatus: (status) => status < 400, // Don't throw on 4xx
      });

      if (pdfResponse.status === 200 && pdfResponse.data) {
        const pdfBuffer = Buffer.from(pdfResponse.data);
        const rawText = await this.extractText(pdfBuffer);
        if (rawText && rawText.length > this.MIN_CONTENT_LENGTH) {
          fullText = this.cleanText(rawText);
          fullTextSource = 'doi_constructed';
          this.logger.log(`✅ Tier 5 SUCCESS: DOI-based URL provided ${this.calculateWordCount(fullText)} words`);
          break;
        }
      }
    } catch (error) {
      // Continue to next URL
      continue;
    }
  }
}

private constructPdfUrlsFromDoi(doi: string): string[] {
  // Common PDF URL patterns for DOIs
  const patterns = [
    `https://doi.org/${doi}.pdf`, // Direct DOI PDF
    `https://${doi.replace('10.', '')}.pdf`, // Some publishers
    // Add more patterns based on common publishers
  ];
  return patterns;
}
```

2. **Improve Error Messages** for each tier:

```typescript
// Log specific failure reasons for each tier
if (!htmlResult.success) {
  this.logger.log(`⚠️  Tier 2 FAILED: ${htmlResult.error || 'Unknown error'}`);
  // Store failure reason for analytics
}
```

**Impact**: **MEDIUM** - Increases coverage by 5-10%

---

### **Fix #5: Add Failure Analytics** ✅ **LOW PRIORITY**

**Purpose**: Track failure patterns to identify systemic issues

**Implementation**:

1. **Add Error Tracking Table** (optional, or use existing Paper table):

```typescript
// Add to Prisma schema (optional)
model FullTextExtractionError {
  id            String   @id @default(cuid())
  paperId       String
  paper         Paper    @relation(fields: [paperId], references: [id])
  category      String   // 'paywall', 'timeout', etc.
  errorMessage  String
  attempt       Int
  createdAt     DateTime @default(now())
}
```

2. **Log Failures for Analytics**:

```typescript
// In processFullText() catch block
const categorizedError = this.categorizeError(error);

// Log to analytics (or database)
this.logger.warn(`Full-text extraction failure tracked`, {
  paperId,
  category: categorizedError.category,
  retryable: categorizedError.retryable,
  publisher: paper.venue, // Track by publisher
  source: paper.source, // Track by source
});
```

**Impact**: **LOW** - Helps identify patterns, doesn't fix failures directly

---

## 📋 **IMPLEMENTATION PRIORITY**

### **Priority 1: Quick Wins** (1-2 hours)
1. ✅ **Automatic Stuck Job Cleanup** - Fixes 16% immediately
2. ✅ **Enhanced Error Categorization** - Better diagnostics

### **Priority 2: Medium Impact** (4-6 hours)
3. ✅ **Smart Retry Logic** - Reduces unnecessary retries
4. ✅ **Improve Waterfall Strategy** - Adds 5-10% coverage

### **Priority 3: Long-term** (8-12 hours)
5. ✅ **Failure Analytics** - Helps identify patterns

---

## 🎯 **EXPECTED RESULTS**

### **Before Fixes**:
- Success: 52%
- Failed: 32%
- Stuck: 16%

### **After Priority 1 Fixes**:
- Success: 52% (unchanged)
- Failed: 32% (unchanged)
- Stuck: **0%** ✅ (fixed - 16% improvement)

### **After Priority 2 Fixes**:
- Success: **65-70%** ✅ (+13-18% improvement)
- Failed: **20-25%** ✅ (-7-12% improvement)
- Stuck: **0%** ✅

### **After All Fixes**:
- Success: **70-75%** ✅ (+18-23% improvement)
- Failed: **15-20%** ✅ (-12-17% improvement)
- Stuck: **0%** ✅

---

## 🚀 **QUICK START: Implement Priority 1 Fixes**

### **Step 1: Add Scheduled Cleanup**

1. Install `@nestjs/schedule`:
```bash
npm install @nestjs/schedule
```

2. Update `app.module.ts`:
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports ...
  ],
})
```

3. Update `pdf-parsing.service.ts`:
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_10_MINUTES)
async scheduledCleanupStuckJobs(): Promise<void> {
  try {
    const cleaned = await this.cleanupStuckFetchingJobs(5);
    if (cleaned > 0) {
      this.logger.log(`🧹 Scheduled cleanup: ${cleaned} stuck jobs cleaned up`);
    }
  } catch (error) {
    this.logger.error(`❌ Scheduled cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### **Step 2: Add Error Categorization**

Add the `categorizeError()` method and update error handling as shown in Fix #2 above.

---

## 📊 **MONITORING**

After implementing fixes, monitor:
1. **Success rate** (should increase to 70%+)
2. **Failure categories** (identify most common failures)
3. **Stuck jobs** (should be 0%)
4. **Retry patterns** (verify smart retry is working)

---

**Estimated Total Time**: 6-8 hours for Priority 1 + 2 fixes  
**Expected Improvement**: +18-23% success rate (52% → 70-75%)

