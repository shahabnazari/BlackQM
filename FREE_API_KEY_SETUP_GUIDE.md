# Free API Key Setup Guide
## Academic Sources with Enhanced Rate Limits

This guide identifies all academic sources that offer **FREE** API key registration with improved rate limits or access. These are sources where signing up for a free account can significantly boost your data retrieval capabilities.

---

## 🟢 Tier 1: HIGH PRIORITY - Currently Used Sources

These sources are in our default list and offer significant rate limit improvements with free API keys.

### 1. **PubMed / PMC (NCBI E-utilities)** ⭐⭐⭐

**Current Status:** ✅ Active in defaults  
**Current Rate Limit:** 3 requests/second (no API key)  
**With FREE API Key:** **10 requests/second** (3.3x improvement)

**Coverage:**
- **PubMed:** 36M+ biomedical citations  
- **PMC:** 11M+ full-text articles (3M+ open access)

**How to Get Free API Key:**

1. **Register for NCBI Account:**
   - Visit: https://www.ncbi.nlm.nih.gov/account/
   - Click "Register for an NCBI account"
   - Fill out registration form (name, email, institution)
   - Verify email address

2. **Create API Key:**
   - Log into your NCBI account
   - Go to: https://www.ncbi.nlm.nih.gov/account/settings/
   - Scroll to "API Key Management" section
   - Click "Create an API Key"
   - Copy your API key (40-character string)

3. **Add to Environment:**
   ```bash
   # .env file
   NCBI_API_KEY=your_40_character_api_key_here
   ```

4. **Usage in Code:**
   ```typescript
   // backend/src/modules/literature/services/pubmed.service.ts
   // backend/src/modules/literature/services/pmc.service.ts
   
   // Add api_key parameter to requests:
   const params = {
     db: 'pubmed',
     term: query,
     retmax: limit,
     api_key: process.env.NCBI_API_KEY  // Add this line
   };
   ```

**Benefits:**
- ✅ 3x faster rate limit (3 → 10 req/sec)
- ✅ Works for both PubMed AND PMC
- ✅ No cost, no restrictions
- ✅ Instant activation
- ✅ Biomedical/health sciences coverage

**Official Documentation:**
- NCBI API Key Info: https://ncbiinsights.ncbi.nlm.nih.gov/2024/10/08/new-api-key-system-coming-ncbi-datasets/
- E-utilities API: https://www.ncbi.nlm.nih.gov/books/NBK25501/

---

### 2. **Semantic Scholar** ⭐⭐⭐

**Current Status:** ✅ Active in defaults  
**Current Rate Limit:** 100 requests per 5 minutes (shared pool)  
**With FREE API Key:** **5,000 requests/day + dedicated limits** (50x+ improvement)

**Coverage:**
- 200M+ research papers across all disciplines
- AI-powered relevance ranking
- Citation counts, influential papers
- Open access detection

**How to Get Free API Key:**

1. **Register for API Key:**
   - Visit: https://www.semanticscholar.org/product/api
   - Click "Request API Key" or "Get Started"
   - Fill out form:
     - Name
     - Email
     - Institution/Organization
     - Intended use (e.g., "Academic research aggregation platform")
   - Submit request

2. **Receive API Key:**
   - Check email (usually instant to 24 hours)
   - API key will be sent to your email
   - Format: 40-character alphanumeric string

3. **Add to Environment:**
   ```bash
   # .env file
   SEMANTIC_SCHOLAR_API_KEY=your_api_key_here
   ```

4. **Update Code:**
   ```typescript
   // backend/src/modules/literature/services/semantic-scholar.service.ts
   
   // Add to request headers:
   const headers = {
     'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
   };
   
   // Modify search() method to include headers
   ```

**Benefits:**
- ✅ 50x+ higher rate limits
- ✅ Dedicated quota (not shared pool)
- ✅ Priority access during high traffic
- ✅ Access to bulk API endpoints
- ✅ Better support for academic projects

**Official Documentation:**
- API Homepage: https://www.semanticscholar.org/product/api
- API Docs: https://api.semanticscholar.org/api-docs/

---

### 3. **CrossRef** ⭐⭐

**Current Status:** ✅ Active in defaults  
**Current Rate Limit:** 50 requests/second (anonymous)  
**With "Polite Pool" (Free):** **Improved priority + better performance**

**Coverage:**
- 140M+ DOI records
- All academic disciplines
- Citation counts
- Publisher metadata

**How to Access Polite Pool (No Registration Required!):**

1. **Add Contact Email to User-Agent:**
   ```typescript
   // backend/src/modules/literature/services/crossref.service.ts
   
   // Update User-Agent header:
   const headers = {
     'User-Agent': 'YourAppName/1.0 (mailto:your.email@institution.edu)'
     // Format: AppName/Version (mailto:email)
   };
   ```

2. **Benefits of Polite Pool:**
   - ✅ Higher priority in queue
   - ✅ More efficient rate limiting
   - ✅ Better connection handling
   - ✅ CrossRef will contact you if issues arise
   - ✅ NO registration or API key needed!

3. **Optional: CrossRef Plus (Also Free!):**
   - Register at: https://www.crossref.org/services/metadata-delivery/plus-service/
   - Get API token for faster metadata access
   - Enhanced metadata fields
   - Add to `.env` as `CROSSREF_PLUS_TOKEN=your_token`

**Benefits:**
- ✅ No registration needed (just add email)
- ✅ Better performance immediately
- ✅ Professional communication channel
- ✅ Optional Plus service for more features

**Official Documentation:**
- REST API Docs: https://github.com/CrossRef/rest-api-doc
- Polite Pool: https://github.com/CrossRef/rest-api-doc#good-manners--more-reliable-service
- Plus Service: https://www.crossref.org/services/metadata-delivery/plus-service/

---

### 4. **OpenAlex** ⭐⭐⭐

**Current Status:** ❌ Not currently integrated  
**Potential:** Currently used for enrichment only  
**With Email in Requests:** **100,000 requests/day + 10 req/sec**

**Coverage:**
- 250M+ works (papers, books, datasets)
- 130M+ authors
- 250K+ institutions
- 250K+ sources (journals, repositories)

**How to Get Better Access (No API Key Needed!):**

1. **Add Email to Requests:**
   ```typescript
   // Already implemented in openalex-enrichment.service.ts
   const params = {
     mailto: 'your.email@institution.edu'  // Add this
   };
   ```

2. **For Academic Researchers (Optional - FREE):**
   - Request premium access: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication
   - Email: support@openalex.org
   - Mention: "Academic research project"
   - Get: Unlimited requests + higher rate limits

**Benefits:**
- ✅ 100K requests/day (already very high!)
- ✅ 10 req/sec (sustained)
- ✅ No authentication required
- ✅ Academic upgrade available (FREE)
- ✅ Comprehensive coverage

**Official Documentation:**
- API Docs: https://docs.openalex.org/
- Rate Limits: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication

---

## 🟡 Tier 2: MEDIUM PRIORITY - Free but Limited

These sources offer free API keys with reasonable limits for moderate use.

### 5. **IEEE Xplore** ⭐

**Current Status:** ⚠️ Requires API key (not in defaults)  
**FREE Tier:** **200 calls/day**  
**Paid Tier:** 10,000 calls/day ($0)

**Coverage:**
- 5.5M+ technical papers
- Engineering, computer science, electronics
- IEEE conference papers and journals

**How to Get Free API Key:**

1. **Register for IEEE Account:**
   - Visit: https://developer.ieee.org/
   - Click "Get Started" or "Request API Access"
   - Create IEEE account (free)

2. **Request API Key:**
   - Log in to IEEE Developer Portal
   - Navigate to "My Applications"
   - Create new application
   - Select "Metadata API" access
   - Agree to terms
   - Receive API key (instant)

3. **Add to Environment:**
   ```bash
   # .env file
   IEEE_API_KEY=your_api_key_here
   ```

**Benefits:**
- ✅ 200 free calls/day
- ✅ Excellent for technical/engineering fields
- ✅ High-quality IEEE publications
- ✅ Conference proceedings included

**Limitations:**
- ⚠️ 200 calls/day limit (low for bulk searches)
- ⚠️ Focused on engineering/CS only
- ⚠️ Paid tier required for higher volume

**Official Documentation:**
- Developer Portal: https://developer.ieee.org/
- API Docs: https://developer.ieee.org/docs

---

### 6. **Springer Nature (Open Access API)** ⭐

**Current Status:** ⚠️ Requires API key (not in defaults)  
**FREE Tier:** **5,000 requests/day**  
**Rate Limit:** 100 requests/minute

**Coverage:**
- 15M+ documents
- Includes Springer, Nature journals
- Open access subset available for free

**How to Get Free API Key:**

1. **Register for Developer Account:**
   - Visit: https://dev.springernature.com/
   - Click "Sign Up" or "Request Access"
   - Fill out registration form
   - Choose "Basic" plan (FREE)

2. **Create Application:**
   - Log into developer portal
   - Create new application
   - Select "Springer Open Access" or "Meta API"
   - Receive API key

3. **Add to Environment:**
   ```bash
   # .env file
   SPRINGER_API_KEY=your_api_key_here
   ```

**Benefits:**
- ✅ 5,000 requests/day (good for moderate use)
- ✅ High-quality Springer/Nature content
- ✅ Open access subset included
- ✅ 100 req/min rate limit

**Limitations:**
- ⚠️ Open access only (free tier)
- ⚠️ Full access requires subscription
- ⚠️ Daily limit can be restrictive for bulk

**Official Documentation:**
- Developer Portal: https://dev.springernature.com/
- API Docs: https://docs.springernature.com/

---

### 7. **CORE API** ⭐⭐

**Current Status:** ❌ Not currently integrated  
**FREE Tier:** **10 requests/second**  
**Coverage:** 250M+ open access papers

**How to Get Free API Key:**

1. **Register for API Key:**
   - Visit: https://core.ac.uk/services/api
   - Click "Get API Key"
   - Fill out form (name, email, purpose)
   - Receive key instantly

2. **Add to Environment:**
   ```bash
   # .env file
   CORE_API_KEY=your_api_key_here
   ```

**Benefits:**
- ✅ 10 req/sec (excellent rate)
- ✅ 250M+ papers (massive coverage)
- ✅ Open access focus
- ✅ Full-text access when available
- ✅ FREE forever

**Official Documentation:**
- API Homepage: https://core.ac.uk/services/api
- API Docs: https://core.ac.uk/docs/

---

## 🔴 Tier 3: PREMIUM/PAID (Not Recommended for Free Setup)

These require paid subscriptions or institutional access.

### ❌ **Scopus** (Elsevier)
- **Cost:** Paid only (requires Elsevier subscription)
- **Coverage:** 87M+ records
- **Not recommended:** No free tier

### ❌ **Web of Science** (Clarivate)
- **Cost:** Paid only (requires institutional license)
- **Coverage:** 159M+ records  
- **Not recommended:** No free tier

### ❌ **Wiley, SAGE, Taylor & Francis**
- **Cost:** Requires publisher subscriptions
- **Not recommended:** No substantial free APIs

---

## 📋 SOURCES WITH NO API KEY NEEDED (Already Optimal)

These sources work well without API keys and don't offer improved free tiers:

### ✅ **ArXiv**
- **Rate Limit:** 3 requests/second
- **Coverage:** 2.3M+ preprints
- **No API Key Available:** Rate limit is the same for everyone
- **Status:** Already optimal

### ✅ **ERIC (US Dept of Education)**
- **Rate Limit:** Unspecified (generous)
- **Coverage:** 1.5M+ education papers
- **No API Key Available:** Public API, no authentication
- **Status:** Already optimal

### ❌ **Google Scholar**
- **Status:** No official API
- **Access:** Web scraping only (unreliable)
- **Not Recommended:** Rate limited, blocks scraping

---

## 🎯 RECOMMENDED IMPLEMENTATION PRIORITY

Based on **impact vs. effort**, implement in this order:

### Priority 1: HIGH IMPACT, LOW EFFORT ⭐⭐⭐
1. **CrossRef Polite Pool** (5 minutes)
   - Just add email to User-Agent header
   - Immediate improved performance
   - No registration required

2. **PubMed/PMC API Key** (15 minutes)
   - 3x rate limit improvement
   - Simple NCBI registration
   - Works for 2 sources

3. **Semantic Scholar API Key** (15 minutes)
   - 50x improvement
   - Quick registration
   - Huge coverage boost

### Priority 2: GOOD IMPACT, MODERATE EFFORT ⭐⭐
4. **OpenAlex Email Parameter** (10 minutes)
   - Already implemented for enrichment
   - Extend to primary search
   - 100K requests/day

5. **CORE API Integration** (2-3 hours)
   - New source to add
   - 250M+ papers
   - 10 req/sec
   - Strong open access focus

### Priority 3: OPTIONAL ENHANCEMENTS ⭐
6. **IEEE Xplore API** (1 hour)
   - Only if engineering/CS focus
   - 200 calls/day (limited)
   - Already has service file

7. **Springer Nature API** (1 hour)
   - Only for Springer/Nature content
   - 5,000/day limit
   - Already has service file

---

## 🛠️ IMPLEMENTATION CHECKLIST

### Step 1: Update Environment Variables
```bash
# .env
NCBI_API_KEY=your_ncbi_key_here
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key_here
CROSSREF_CONTACT_EMAIL=your.email@institution.edu

# Optional:
IEEE_API_KEY=your_ieee_key_here
SPRINGER_API_KEY=your_springer_key_here
CORE_API_KEY=your_core_key_here
```

### Step 2: Update Service Files

**PubMed Service:**
```typescript
// backend/src/modules/literature/services/pubmed.service.ts

// Add API key to params (line ~150)
const params = {
  db: 'pubmed',
  term: query,
  retmax: limit,
  ...(process.env.NCBI_API_KEY && { api_key: process.env.NCBI_API_KEY })
};
```

**PMC Service:**
```typescript
// backend/src/modules/literature/services/pmc.service.ts

// Add API key to params (line ~120)
const params = {
  db: 'pmc',
  term: query,
  retmax: limit,
  ...(process.env.NCBI_API_KEY && { api_key: process.env.NCBI_API_KEY })
};
```

**Semantic Scholar Service:**
```typescript
// backend/src/modules/literature/services/semantic-scholar.service.ts

// Add API key header (line ~100)
const headers = {
  ...(process.env.SEMANTIC_SCHOLAR_API_KEY && {
    'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
  })
};

// Add to HTTP request
const response = await firstValueFrom(
  this.httpService.get(url, { params, headers })
);
```

**CrossRef Service:**
```typescript
// backend/src/modules/literature/services/crossref.service.ts

// Update User-Agent (line ~95)
const headers = {
  'User-Agent': `BlackQMethod/1.0 (mailto:${process.env.CROSSREF_CONTACT_EMAIL || 'dev@example.com'})`
};

// Add to HTTP request
const response = await firstValueFrom(
  this.httpService.get(url, { params, headers })
);
```

### Step 3: Test Implementation
```bash
# Test each source individually
npm run test:e2e -- literature.service.spec.ts

# Check logs for API key usage:
# ✅ [PubMed] Using API key for enhanced rate limits
# ✅ [Semantic Scholar] Authenticated request (dedicated quota)
# ✅ [CrossRef] Polite pool access enabled
```

---

## 📊 EXPECTED IMPROVEMENTS

| Source | Before | After | Improvement |
|--------|--------|-------|-------------|
| PubMed | 3 req/sec | 10 req/sec | **3.3x faster** |
| PMC | 3 req/sec | 10 req/sec | **3.3x faster** |
| Semantic Scholar | 100 req/5min (shared) | 5,000 req/day (dedicated) | **50x+ more** |
| CrossRef | 50 req/sec | Higher priority | **Better performance** |
| OpenAlex | 10 req/sec | 10 req/sec + 100K/day | **Better tracking** |

**Total Impact:**
- ✅ **3-50x improvement** in rate limits for biomedical/general sources
- ✅ **No cost** - all improvements are FREE
- ✅ **15-30 minutes** total setup time for Priority 1 items
- ✅ **Production-ready** - no trial periods or expiration

---

## 🚨 IMPORTANT NOTES

1. **Never commit API keys to Git:**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use environment variables:**
   - Development: `.env` file
   - Production: Server environment variables
   - Never hardcode keys in source code

3. **Graceful fallback:**
   - Code should work WITHOUT keys (degraded performance)
   - Check for key existence before using
   - Log warnings if keys are missing

4. **Monitor usage:**
   - Track API calls per source
   - Log rate limit errors
   - Set up alerts for quota exhaustion

5. **Compliance:**
   - Read each API's terms of service
   - Respect rate limits even with keys
   - Include proper attribution when required

---

## 📧 SUPPORT CONTACTS

If you need help getting API keys or have questions:

- **PubMed/NCBI:** support@ncbi.nlm.nih.gov
- **Semantic Scholar:** api@semanticscholar.org
- **CrossRef:** support@crossref.org
- **OpenAlex:** support@openalex.org
- **IEEE:** developer-support@ieee.org
- **Springer Nature:** developers@springernature.com
- **CORE:** contact@core.ac.uk

---

**Last Updated:** 2025-11-14  
**Status:** Ready for implementation  
**Estimated Setup Time:** 30-60 minutes for all Priority 1 items

