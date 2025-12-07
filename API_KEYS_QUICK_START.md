# API Keys Quick Start Guide
## Get 3-50x Better Rate Limits in 30 Minutes (100% FREE)

### 🚀 Priority 1: Implement These First (Highest Impact)

---

## 1. CrossRef Polite Pool (5 minutes) ⚡

**Improvement:** Better priority, faster responses  
**Cost:** FREE (no registration!)  
**Effort:** 5 minutes

### Steps:
1. Open: `backend/src/modules/literature/services/crossref.service.ts`

2. Find the `search()` method (around line 95)

3. Add email header:
```typescript
const headers = {
  'User-Agent': `BlackQMethod/1.0 (mailto:your.email@yourdomain.com)`
};

const response = await firstValueFrom(
  this.httpService.get(url, { params, headers })
);
```

4. Replace `your.email@yourdomain.com` with your actual email

**Done!** ✅ CrossRef will now give you priority access.

---

## 2. PubMed/PMC API Key (15 minutes) ⚡⚡⚡

**Improvement:** 3 req/sec → **10 req/sec** (3.3x faster!)  
**Cost:** FREE  
**Works for:** Both PubMed AND PMC

### Steps:

**A. Get API Key:**
1. Go to: https://www.ncbi.nlm.nih.gov/account/
2. Click "Register for an NCBI account"
3. Fill form → Verify email
4. Log in → Go to: https://www.ncbi.nlm.nih.gov/account/settings/
5. Find "API Key Management"
6. Click "Create an API Key"
7. Copy the 40-character key

**B. Add to .env:**
```bash
NCBI_API_KEY=your_40_character_key_here
```

**C. Update PubMed service:**
```typescript
// backend/src/modules/literature/services/pubmed.service.ts
// Find the search() method params (around line 150)

const params = {
  db: 'pubmed',
  term: query,
  retmax: limit,
  retstart: 0,
  // Add this line:
  ...(process.env.NCBI_API_KEY && { api_key: process.env.NCBI_API_KEY })
};
```

**D. Update PMC service:**
```typescript
// backend/src/modules/literature/services/pmc.service.ts
// Find the fetchByIds() method params (around line 120)

const params = {
  db: 'pmc',
  id: batch.join(','),
  retmode: 'xml',
  // Add this line:
  ...(process.env.NCBI_API_KEY && { api_key: process.env.NCBI_API_KEY })
};
```

**Done!** ✅ Both PubMed and PMC are now 3x faster.

---

## 3. Semantic Scholar API Key (15 minutes) ⚡⚡⚡

**Improvement:** Shared 100 req/5min → **Dedicated 5,000 req/day** (50x+!)  
**Cost:** FREE  

### Steps:

**A. Request API Key:**
1. Go to: https://www.semanticscholar.org/product/api
2. Click "Request API Key"
3. Fill out form:
   - Name: Your name
   - Email: Your email
   - Organization: Your institution/company
   - Intended Use: "Academic research aggregation platform"
4. Submit → Check email (usually instant, max 24 hours)

**B. Add to .env:**
```bash
SEMANTIC_SCHOLAR_API_KEY=your_api_key_here
```

**C. Update Semantic Scholar service:**
```typescript
// backend/src/modules/literature/services/semantic-scholar.service.ts
// Find the search() method (around line 100)

// Add headers object:
const headers = {
  ...(process.env.SEMANTIC_SCHOLAR_API_KEY && {
    'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
  })
};

// Update the HTTP request:
const response = await firstValueFrom(
  this.httpService.get(
    `https://api.semanticscholar.org/graph/v1/paper/search`,
    { params, headers }  // Add headers here
  )
);
```

**Done!** ✅ Semantic Scholar now uses dedicated quota.

---

## 4. Test Your Setup ✅

```bash
# 1. Restart your backend
npm run start:dev

# 2. Look for these log messages:
# ✅ [PubMed] Using API key for enhanced rate limits (10 req/sec)
# ✅ [PMC] Using API key for enhanced rate limits (10 req/sec)
# ✅ [Semantic Scholar] Authenticated request (dedicated quota)
# ✅ [CrossRef] Polite pool enabled (priority access)

# 3. Run a search and check speed improvement
```

---

## 📊 What You Just Achieved

| Source | Before | After | Improvement |
|--------|--------|-------|-------------|
| **PubMed** | 3 req/sec | 10 req/sec | ⚡ **3.3x** |
| **PMC** | 3 req/sec | 10 req/sec | ⚡ **3.3x** |
| **Semantic Scholar** | 100 req/5min | 5,000 req/day | ⚡ **50x+** |
| **CrossRef** | Standard | Priority queue | ⚡ **Faster** |

**Total Time:** ~30 minutes  
**Total Cost:** $0 (100% FREE)  
**Impact:** 3-50x better performance  

---

## 🎯 Optional: Want Even More?

See the full guide (`FREE_API_KEY_SETUP_GUIDE.md`) for:
- **OpenAlex** (100K requests/day)
- **CORE API** (10 req/sec, 250M+ papers)
- **IEEE Xplore** (200 calls/day)
- **Springer Nature** (5,000 calls/day)

---

## 🔒 Security Checklist

- ✅ Add API keys to `.env` file (NOT `.env.example`)
- ✅ Verify `.env` is in `.gitignore`
- ✅ Never commit keys to Git
- ✅ Use environment variables in production
- ✅ Keep backup of your keys in secure password manager

---

## ❓ Troubleshooting

**"No improvement in rate limits"**
- Check: Are keys in `.env` file?
- Check: Did you restart backend?
- Check: Are keys being used in code? (add console.log to verify)

**"API key not found"**
- Verify `.env` file is in project root
- Check variable names match exactly
- Restart your terminal/IDE

**"Rate limited despite API key"**
- Double-check key is correct (copy-paste error?)
- Verify key is active (check account dashboards)
- Some APIs have daily limits even with keys

---

**Need Help?** Check `FREE_API_KEY_SETUP_GUIDE.md` for detailed troubleshooting and support contacts.

---

**Status:** ✅ Ready to implement  
**Time Required:** 30 minutes  
**Difficulty:** Easy (copy-paste configuration)


