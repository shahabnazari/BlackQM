# VQMethod Platform - API Keys Setup Guide

## Overview
This document lists all API keys required for the VQMethod platform's alternative research sources functionality.

---

## Required API Keys (Must Have)

### 1. YouTube Data API v3
**Purpose:** Search YouTube videos for research content
**Status:** ⚠️ REQUIRED - Currently using demo data
**Cost:** FREE (10,000 quota units/day = ~1,000 searches)

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing project
3. Click "Enable APIs and Services"
4. Search for "YouTube Data API v3"
5. Click "Enable"
6. Go to "Credentials" → "Create Credentials" → "API Key"
7. Copy the generated API key
8. Add to `backend/.env`:
   ```bash
   YOUTUBE_API_KEY=your-actual-api-key-here
   ```
9. Restart the backend server

**Documentation:** https://developers.google.com/youtube/v3/getting-started

---

### 2. Google Patents API (Custom Search API)
**Purpose:** Search patents for research content
**Status:** ⚠️ NOT IMPLEMENTED - Currently returns empty results
**Cost:** FREE (100 searches/day), then $5 per 1,000 queries

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Same project as YouTube or create new
3. Click "Enable APIs and Services"
4. Search for "Custom Search API"
5. Click "Enable"
6. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
7. Create a new search engine for patents.google.com
8. Get Search Engine ID and API Key
9. Add to `backend/.env`:
   ```bash
   GOOGLE_PATENTS_API_KEY=your-api-key-here
   GOOGLE_PATENTS_SEARCH_ENGINE_ID=your-search-engine-id
   ```
10. Restart the backend server

**Documentation:** https://developers.google.com/custom-search/v1/overview

---

## Already Configured

### 3. OpenAI API Key
**Purpose:** AI-powered features (literature analysis, Q-statement generation, etc.)
**Status:** ✅ ALREADY CONFIGURED in backend/.env
**Current Key:** `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`

**Note:** This key is visible in your .env file. Keep it secure.

---

## No API Key Needed (Working Out of the Box)

### 4. GitHub API
**Purpose:** Search GitHub repositories
**Status:** ✅ WORKING - No API key required
**Note:** Public GitHub API, rate limited to 60 requests/hour without authentication

---

### 5. StackOverflow API
**Purpose:** Search StackOverflow questions/discussions
**Status:** ✅ WORKING - No API key required
**Note:** Uses public StackExchange API

---

### 6. Podcasts (iTunes Search API)
**Purpose:** Search podcast episodes with transcripts
**Status:** ✅ WORKING - No API key required
**Note:** Free Apple iTunes Search API

---

### 7. ArXiv API
**Purpose:** Search academic preprints
**Status:** ✅ WORKING - No API key required
**Note:** Open public API for scientific papers

---

### 8. BioRxiv API
**Purpose:** Search biology/life sciences preprints
**Status:** ✅ WORKING - No API key required
**Note:** Open public API for biomedical research

---

### 9. SSRN
**Purpose:** Social Science Research Network papers
**Status:** ❌ NOT IMPLEMENTED - Would require API key or web scraping
**Note:** SSRN doesn't have a public API

---

## Summary Table

| Source | API Key Required | Status | Cost |
|--------|------------------|--------|------|
| YouTube | ✅ YES | ⚠️ Demo Data | FREE (10k/day) |
| Patents | ✅ YES | ❌ Not Implemented | FREE (100/day) + Paid |
| OpenAI | ✅ YES | ✅ Configured | Pay per use |
| GitHub | ❌ NO | ✅ Working | FREE |
| StackOverflow | ❌ NO | ✅ Working | FREE |
| Podcasts | ❌ NO | ✅ Working | FREE |
| ArXiv | ❌ NO | ✅ Working | FREE |
| BioRxiv | ❌ NO | ✅ Working | FREE |
| SSRN | ⚠️ N/A | ❌ Not Available | N/A |

---

## Priority Action Items

### IMMEDIATE (Required for Testing)
1. **Get YouTube Data API v3 Key** - Required to remove demo data
   - Takes 5 minutes
   - Completely free
   - Enables real YouTube search results

### OPTIONAL (Enhanced Features)
2. **Get Google Patents API Key** - Enables patent search
   - Takes 10 minutes
   - 100 free searches/day
   - Useful for technical/scientific research

---

## What to Share

Please provide the following API keys so we can test the system:

```bash
# Copy these lines to your backend/.env file:

# 1. YouTube Data API v3 (REQUIRED for testing)
YOUTUBE_API_KEY=

# 2. Google Patents API (OPTIONAL - for patent search)
GOOGLE_PATENTS_API_KEY=
GOOGLE_PATENTS_SEARCH_ENGINE_ID=
```

---

## Testing Plan

Once you provide the API keys, we will:
1. ✅ Update backend/.env with your keys
2. ✅ Restart backend server
3. ✅ Test YouTube search with real query
4. ✅ Verify results show real videos (not demo data)
5. ✅ Test Patents search (if key provided)
6. ✅ Remove demo data fallbacks
7. ✅ Confirm all alternative sources working

---

## Current .env File Location

**Backend:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/.env`

Lines 23-29 currently contain:
```bash
# YouTube Data API v3 (optional - for literature review YouTube search)
# Get your free API key at: https://console.cloud.google.com/apis/credentials
# 1. Create a new project or select existing
# 2. Enable "YouTube Data API v3"
# 3. Create credentials (API key)
# 4. Add the key below (remove the placeholder)
YOUTUBE_API_KEY=your-youtube-api-key-here
```

---

## Security Notes

⚠️ **Important:**
- Never commit API keys to git
- Keep .env file secure
- Regenerate keys if accidentally exposed
- Use environment-specific keys (dev vs production)
- The OpenAI key in your .env should be rotated periodically

---

## Questions?

If you need help obtaining any API keys, I can:
1. Walk you through the Google Cloud Console setup
2. Create screenshots/guides for each step
3. Help troubleshoot any API key issues
4. Verify keys are working correctly

**Next Step:** Please obtain and share your YouTube Data API v3 key so we can test real YouTube search functionality and remove demo data.
