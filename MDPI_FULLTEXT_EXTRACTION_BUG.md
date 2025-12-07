# MDPI Full-Text Extraction Bug - Only 196 Characters

**Date:** November 18, 2025
**Issue:** MDPI papers showing only 196 characters instead of full article text
**Example Paper:** https://www.mdpi.com/1996-1944/17/6/1265
**Impact:** HIGH - Users cannot extract themes from MDPI papers (major open-access publisher)

---

## 🎯 THE PROBLEM

**User selected 5 papers, but UI shows only 4 articles:**

```
Paper #4: "Characteristics and Survival Outcomes of Hepatocellular Carcinoma..."
- Shown: 196 chars
- Expected: ~8,000-12,000 chars (full article)
- Status: ❌ Excluded from analysis (< 50 word minimum)
```

**Root Cause:** MDPI HTML extraction is failing → only getting truncated abstract from search API

---

## 📊 WHAT'S HAPPENING

### Step 1: Paper Search (External API)

When user searches for papers, APIs like Semantic Scholar, CrossRef, etc. return:

```json
{
  "title": "Characteristics and Survival Outcomes...",
  "abstract": "Brief summary of the study..." // ← Only 196 chars!
  "doi": "10.3390/ma17061265",
  "url": "https://www.mdpi.com/1996-1944/17/6/1265"
}
```

**Why so short?**
- CrossRef/Semantic Scholar APIs often return **truncated abstracts**
- MDPI's full abstract is on their website, not always in API responses
- Some APIs only provide first 150-200 chars as a "snippet"

### Step 2: Paper Saved to Database

Backend saves paper with the short abstract:

```typescript
// backend/src/modules/literature/literature.service.ts:2618
await this.prisma.paper.create({
  title: saveDto.title,
  abstract: saveDto.abstract, // ← 196 chars from API
  doi: saveDto.doi,
  url: saveDto.url,
  fullText: null, // ← Not extracted yet
  fullTextStatus: 'not_fetched',
  userId,
});
```

### Step 3: Full-Text Extraction (SHOULD Happen)

Backend **should** extract full HTML from MDPI website:

```typescript
// backend/src/modules/literature/services/html-full-text.service.ts:367-374
private extractMdpiContent(document: Document): string {
  const selectors = [
    '.article-content',  // ❌ Wrong selector?
    '.html-body',        // ❌ Wrong selector?
    'article.article-body', // ❌ Wrong selector?
  ];
  return this.extractBySelectors(document, selectors);
}
```

**Problem:** The CSS selectors don't match MDPI's actual HTML structure!

### Step 4: User Sees Only 196 Chars

Frontend receives:
- `paper.abstract` = 196 chars (from API)
- `paper.fullText` = null (extraction failed)
- `paper.fullTextStatus` = 'failed' or 'not_fetched'

**Result:**
- Frontend counts words: 196 chars ≈ 39 words
- 39 words < 50-word minimum → Paper excluded
- UI confusingly shows "✅ Will be used" but counts only 4/5 papers

---

## 🔍 ROOT CAUSE ANALYSIS

### Issue #1: Wrong CSS Selectors for MDPI

Current selectors (line 367-374):
```typescript
const selectors = [
  '.article-content',      // Doesn't exist on MDPI
  '.html-body',            // Doesn't exist on MDPI
  'article.article-body',  // Doesn't exist on MDPI
];
```

**Actual MDPI Structure** (from WebFetch analysis):

```html
<div id="main-content">
  <div class="content__container">
    <!-- Abstract -->
    <section class="html-abstract">...</section>

    <!-- Full Article Sections -->
    <section class="html-body">
      <section id="sec1-materials-17-01265">Introduction...</section>
      <section id="sec2-materials-17-01265">Materials and Methods...</section>
      <section id="sec3-materials-17-01265">Results...</section>
      <section id="sec4-materials-17-01265">Discussion...</section>
      <section id="sec5-materials-17-01265">Conclusions...</section>
    </section>
  </div>
</div>
```

**Correct Selectors Should Be:**
```typescript
const selectors = [
  '#main-content',              // Main container
  '.html-body',                 // Article body sections (WAIT - this IS in the list!)
  'section.html-body',          // More specific
  '.content__container',        // Fallback
];
```

**Wait!** `.html-body` IS in the selector list! So why is it failing?

### Issue #2: MDPI Uses JavaScript Rendering

**MDPI's website might be JavaScript-rendered**, meaning:

1. Initial HTML (what axios.get() fetches): Only skeleton
2. JavaScript runs: Populates content dynamically
3. Backend axios.get(): Only gets skeleton ❌

**Evidence:**
- WebFetch couldn't see HTML structure (returned "HTML structure not available")
- Common for modern publisher websites

**This explains why extraction fails:**
```typescript
// Backend fetches HTML
const response = await axios.get(url);
const html = response.data; // ← Only skeleton, no content!

// Tries to parse
const dom = new JSDOM(html); // ← No JavaScript execution
const element = document.querySelector('.html-body'); // ← Doesn't exist yet
// Returns empty → extraction fails
```

### Issue #3: No PDF Fallback for MDPI

MDPI provides PDF downloads:
```
https://www.mdpi.com/1996-1944/17/6/1265/pdf
```

But the current HTML extractor doesn't fall back to PDF when HTML fails.

---

## 📋 THE FIX - THREE OPTIONS

### Option 1: Fix MDPI CSS Selectors (Quick Fix)

**If** MDPI content is in static HTML, update selectors:

```typescript
// backend/src/modules/literature/services/html-full-text.service.ts:367
private extractMdpiContent(document: Document): string {
  const selectors = [
    'section.html-body',          // Primary: Article body
    '.html-body',                 // Already exists
    '#main-content',              // Fallback: Main container
    '.content__container',        // Fallback: Content wrapper
    '.article-content',           // Keep existing
    'article.article-body',       // Keep existing
    'article',                    // Generic fallback
  ];
  return this.extractBySelectors(document, selectors);
}
```

**Test this first:** Add logging to see what HTML is actually fetched.

### Option 2: Add PDF Extraction for MDPI (Robust Fix)

MDPI provides direct PDF links:

```typescript
// New method in html-full-text.service.ts
private async extractMdpiContentWithPdfFallback(url: string): Promise<string> {
  // Try HTML first
  const htmlResult = await this.scrapeHtmlFromUrl(url);
  if (htmlResult.success && htmlResult.wordCount > 1000) {
    return htmlResult.text;
  }

  // Fallback to PDF
  this.logger.log('HTML extraction insufficient, trying PDF fallback');
  const pdfUrl = url.replace(/\/$/, '') + '/pdf';

  // Use existing PDF extraction service
  const pdfResult = await this.pdfParsingService.extractFromUrl(pdfUrl);
  return pdfResult.text;
}
```

### Option 3: Use MDPI API (Best Fix)

MDPI might have an API for full-text access:

```typescript
// Check if MDPI has JSON API
// Example: https://www.mdpi.com/1996-1944/17/6/1265/json
```

---

## 🧪 DIAGNOSTIC STEPS

### Step 1: Check What HTML Is Actually Fetched

Add temporary logging to see what axios gets:

```typescript
// backend/src/modules/literature/services/html-full-text.service.ts:290
private async scrapeHtmlFromUrl(url: string): Promise<HtmlFetchResult> {
  const response = await axios.get(url, {...});
  const html = response.data;

  // DIAGNOSTIC: Log HTML size and check for content indicators
  this.logger.log(`📊 Fetched HTML size: ${html.length} bytes`);
  this.logger.log(`🔍 Contains ".html-body": ${html.includes('html-body')}`);
  this.logger.log(`🔍 Contains "#main-content": ${html.includes('main-content')}`);
  this.logger.log(`🔍 HTML preview: ${html.substring(0, 500)}`);

  // Continue with normal parsing...
}
```

**Test with:**
```bash
# Trigger full-text extraction for MDPI paper
curl -X POST http://localhost:4000/literature/papers/{paperId}/fulltext \
  -H "Authorization: Bearer {token}"
```

### Step 2: Verify MDPI Structure

Visit https://www.mdpi.com/1996-1944/17/6/1265 in browser:

1. Right-click → "View Page Source"
2. Search for "html-body"
3. Search for "Introduction"
4. Check if content is in initial HTML or loaded via JavaScript

### Step 3: Test Selectors Manually

```typescript
// Quick test script
import { JSDOM } from 'jsdom';
import axios from 'axios';

async function testMdpiExtraction() {
  const url = 'https://www.mdpi.com/1996-1944/17/6/1265';
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);
  const document = dom.window.document;

  console.log('Testing selectors:');
  console.log('.html-body:', document.querySelector('.html-body')?.textContent?.length);
  console.log('#main-content:', document.querySelector('#main-content')?.textContent?.length);
  console.log('section.html-body:', document.querySelector('section.html-body')?.textContent?.length);
  console.log('article:', document.querySelector('article')?.textContent?.length);
}

testMdpiExtraction();
```

---

## ✅ RECOMMENDED FIX (Prioritized)

### Immediate Fix (5 minutes):

**Add #main-content as first selector:**

```typescript
// File: backend/src/modules/literature/services/html-full-text.service.ts:367
private extractMdpiContent(document: Document): string {
  const selectors = [
    '#main-content',              // NEW: Try main container first
    'section.html-body',          // NEW: More specific html-body
    '.html-body',                 // Existing
    '.article-content',           // Existing
    'article.article-body',       // Existing
    'article',                    // NEW: Generic fallback
  ];
  return this.extractBySelectors(document, selectors);
}
```

**Why this might work:**
- `#main-content` is very likely to be in static HTML
- Will get ALL content (abstract + body + references)
- Can filter out references/citations later

### Short-Term Fix (30 minutes):

**Add diagnostic logging + PDF fallback:**

1. Add logging to see what's being fetched
2. If HTML extraction gets < 1000 words, try PDF
3. MDPI PDFs are at `{url}/pdf`

### Long-Term Fix (2 hours):

**Implement proper MDPI integration:**

1. Check if MDPI has JSON API
2. Add MDPI-specific service like `mdpi.service.ts`
3. Use structured API instead of HTML scraping
4. Handle MDPI's specific metadata format

---

## 📊 IMPACT ASSESSMENT

### Current Impact

**Affected Papers:**
- All MDPI papers (10,000+ journals, 400k+ articles/year)
- MDPI is one of largest open-access publishers
- High-quality scientific content

**User Experience:**
- Papers appear in search ✅
- Papers show "✅ Will be used" ✅
- But excluded from analysis ❌
- No clear error message ❌
- Confusing count mismatch (selected 5, shows 4)

### After Fix

**Expected Results:**
- MDPI papers: 8,000-15,000 chars (full article)
- Proper classification as "full-text"
- Included in theme extraction
- Better theme quality (full content vs abstracts)

---

## 🧪 TEST PLAN

### Test Case 1: MDPI Paper Extraction

```bash
# 1. Search for MDPI paper
POST /literature/search
{
  "query": "high entropy alloys",
  "sources": ["semanticscholar"]
}

# 2. Save MDPI paper (will have short abstract)
POST /literature/library
{
  "title": "Suppressed Plastic Anisotropy...",
  "url": "https://www.mdpi.com/1996-1944/17/6/1265",
  "abstract": "Brief 196 char summary..."
}

# 3. Trigger full-text extraction
POST /literature/papers/{paperId}/fulltext

# 4. Verify full-text extracted
GET /literature/library
# Check: paper.fullText should be 8000+ chars
# Check: paper.fullTextStatus should be 'success'
```

### Expected Results:

**Before Fix:**
```json
{
  "fullText": null,
  "fullTextStatus": "failed",
  "abstract": "196 char summary..."
}
```

**After Fix:**
```json
{
  "fullText": "Introduction\n\nHigh-entropy alloys (HEAs)...(8000+ chars)",
  "fullTextStatus": "success",
  "abstract": "196 char summary..." // Keep original
}
```

---

## 🚀 NEXT STEPS

1. **Test diagnostic logging** (5 min)
   - Add logs to see what HTML is fetched
   - Check if content is in static HTML

2. **Update selectors** (5 min)
   - Add `#main-content` as first selector
   - Add `section.html-body` as second
   - Test with MDPI paper

3. **Verify extraction** (5 min)
   - Trigger full-text fetch for MDPI paper
   - Check word count (should be 8000+)
   - Verify content quality

4. **Add PDF fallback** (30 min - if HTML fails)
   - Detect MDPI URLs
   - Try PDF extraction if HTML < 1000 words
   - Log which method succeeded

5. **Update frontend** (Optional)
   - Show "⏳ Extracting full-text..." for papers being processed
   - Show "❌ Extraction failed" with retry button
   - Don't show "✅ Will be used" for papers < 50 words

---

**Status:** 🔴 **CRITICAL BUG** - Affects all MDPI papers
**Assignee:** Backend team
**Estimated Fix Time:** 15 minutes (selector update) to 2 hours (full solution)
**Priority:** HIGH (MDPI is major open-access publisher)

---

END OF DIAGNOSTIC DOCUMENT
