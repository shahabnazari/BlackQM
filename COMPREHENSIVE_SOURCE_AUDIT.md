# Comprehensive Literature Source Audit
## Paywall Detection Verification - Phase 10.6 Day 8.3.1

**Date:** 2025-11-10
**Status:** IN PROGRESS
**Purpose:** Verify paywall detection works correctly across all 14 implemented literature sources

---

## Executive Summary

**Implemented Sources:** 14 academic literature databases
**Open Access Sources:** 8 (57%)
**Paywalled Sources:** 3 (21%)
**Mixed/Requires Verification:** 3 (21%)

---

## Source Classification

### 🟢 Category 1: Verified Open Access (Always Free)

#### 1. **arXiv** ✅
- **URL Pattern:** `arxiv.org/abs/`, `arxiv.org/pdf/`
- **Coverage:** 2.3M+ preprints (physics, math, CS, biology, economics)
- **Access:** 100% open access, full PDF
- **Paywall Detection:** ✅ CORRECTLY HANDLED (not in paywall list)
- **Badge Expected:** 🔓 Open Access OR ✅ Full-Text Available

#### 2. **bioRxiv** ✅
- **URL Pattern:** `biorxiv.org/content/`
- **Coverage:** Biology preprints
- **Access:** 100% open access, full PDF
- **Paywall Detection:** ⚠️ NOT IN CURRENT LIST
- **Badge Expected:** 🔓 Open Access OR ✅ Full-Text Available
- **Action Required:** ADD to open access verification

#### 3. **ChemRxiv** ✅
- **URL Pattern:** `chemrxiv.org/engage/`
- **Coverage:** Chemistry preprints
- **Access:** 100% open access
- **Paywall Detection:** ⚠️ NOT IN CURRENT LIST
- **Badge Expected:** 🔓 Open Access OR ✅ Full-Text Available
- **Action Required:** ADD to open access verification

#### 4. **PubMed Central (PMC)** ✅
- **URL Pattern:** `ncbi.nlm.nih.gov/pmc/`
- **Coverage:** 7M+ full-text articles
- **Access:** 100% open access, full HTML/PDF
- **Paywall Detection:** ✅ CORRECTLY HANDLED (`fullTextSource === 'pmc'`)
- **Badge Expected:** 🔓 Open Access

#### 5. **ERIC** ✅
- **URL Pattern:** `eric.ed.gov`
- **Coverage:** Education research
- **Access:** 100% open access (U.S. Department of Education)
- **Paywall Detection:** ⚠️ NOT IN CURRENT LIST
- **Badge Expected:** 🔓 Open Access OR ✅ Full-Text Available
- **Action Required:** ADD to open access verification

#### 6. **SSRN** (Partial Open Access) ⚠️
- **URL Pattern:** `ssrn.com/abstract/`
- **Coverage:** Social science working papers
- **Access:** Most open access, some restricted
- **Paywall Detection:** ⚠️ NOT IN CURRENT LIST - NEEDS INVESTIGATION
- **Badge Expected:** Mixed (depends on paper)
- **Action Required:** INVESTIGATE access model

#### 7. **Unpaywall API** ✅
- **URL Pattern:** N/A (metadata service, provides URLs to various publishers)
- **Coverage:** 30M+ open access articles
- **Access:** 100% verified open access
- **Paywall Detection:** ✅ CORRECTLY HANDLED (`fullTextSource === 'unpaywall'`)
- **Badge Expected:** 🔓 Open Access

#### 8. **Semantic Scholar** (Metadata + Links) ✅
- **URL Pattern:** `semanticscholar.org/paper/`
- **Coverage:** 200M+ papers (metadata aggregator)
- **Access:** Links to various publishers (mixed)
- **Paywall Detection:** ✅ CORRECTLY HANDLED (uses DOI links, checked against publisher URL)
- **Badge Expected:** Mixed (depends on linked publisher)

---

### 🔴 Category 2: Paywalled Publishers (Require Subscription)

#### 9. **IEEE Xplore** 🔒
- **URL Pattern:** `ieeexplore.ieee.org/document/`
- **Coverage:** 5M+ engineering/CS papers
- **Access:** Subscription required (except open access articles)
- **Paywall Detection:** ✅ CORRECTLY HANDLED (in paywall list)
- **Badge Expected:** 🔒 Subscription Required
- **Verified:** YES - User reported IEEE article showing incorrect badge

#### 10. **Scopus** 🔒
- **URL Pattern:** `scopus.com`, uses DOIs to Elsevier journals
- **Coverage:** 84M+ abstracts
- **Access:** Subscription required
- **Paywall Detection:** ⚠️ PARTIAL (only sciencedirect.com detected)
- **Badge Expected:** 🔒 Subscription Required
- **Action Required:** ADD scopus.com to paywall list

#### 11. **Web of Science** 🔒
- **URL Pattern:** Uses DOIs, clarivate.com
- **Coverage:** 90M+ records
- **Access:** Subscription required
- **Paywall Detection:** ⚠️ NOT IN CURRENT LIST
- **Badge Expected:** 🔒 Subscription Required
- **Action Required:** ADD webofknowledge.com, webofscience.com to paywall list

---

### 🟡 Category 3: Metadata Services (No Direct Access)

#### 12. **CrossRef**
- **URL Pattern:** N/A (DOI resolver, redirects to publishers)
- **Coverage:** 134M+ DOI records
- **Access:** Redirects to publisher (mixed)
- **Paywall Detection:** ✅ CORRECTLY HANDLED (uses DOI → publisher URL is checked)
- **Badge Expected:** Depends on publisher

#### 13. **PubMed**
- **URL Pattern:** `pubmed.ncbi.nlm.nih.gov/`
- **Coverage:** 35M+ citations
- **Access:** Abstracts free, links to PMC or publisher
- **Paywall Detection:** ✅ CORRECTLY HANDLED (uses PMC links or DOI)
- **Badge Expected:** Mixed (depends on PMC availability)

#### 14. **Google Scholar** ⚠️
- **URL Pattern:** Not directly used (search aggregator)
- **Coverage:** Billions of scholarly documents
- **Access:** Links to various publishers (mixed)
- **Paywall Detection:** N/A (would use linked URL)
- **Badge Expected:** Mixed

---

## Current Paywall Detection Logic

### ✅ Currently Detected Paywalled Publishers (12):

```typescript
paper.url.includes('ieeexplore.ieee.org')         // IEEE ✅
paper.url.includes('sciencedirect.com')           // Elsevier ✅
paper.url.includes('springer.com')                // Springer ✅
paper.url.includes('springerlink.com')            // Springer Link ✅
paper.url.includes('wiley.com')                   // Wiley ✅
paper.url.includes('onlinelibrary.wiley.com')     // Wiley Online Library ✅
paper.url.includes('nature.com')                  // Nature ✅
paper.url.includes('science.org')                 // Science (AAAS) ✅
paper.url.includes('acs.org')                     // ACS ✅
paper.url.includes('tandfonline.com')             // Taylor & Francis ✅
paper.url.includes('sagepub.com')                 // SAGE ✅
paper.url.includes('journals.lww.com')            // Wolters Kluwer ✅
```

### ❌ Missing Paywalled Publishers:

**High Priority:**
- `webofknowledge.com` - Web of Science (Clarivate)
- `webofscience.com` - Web of Science (Clarivate)
- `scopus.com` - Scopus (Elsevier, already have sciencedirect)
- `oxfordjournals.org` - Oxford University Press
- `academic.oup.com` - Oxford University Press
- `cambridge.org` - Cambridge University Press
- `bmj.com` - BMJ
- `jamanetwork.com` - JAMA (American Medical Association)
- `nejm.org` - New England Journal of Medicine
- `thelancet.com` - The Lancet

**Medium Priority:**
- `jstor.org` - JSTOR
- `emerald.com` - Emerald
- `sciencemag.org` - Science (alternative domain)
- `pnas.org` - PNAS
- `cell.com` - Cell Press (Elsevier)
- `plos.org` - PLOS (actually open access!)

### ✅ Verified Open Access Sources (Should NOT be in paywall list):

**Preprint Servers:**
- `arxiv.org` ✅ (not in list)
- `biorxiv.org` ✅ (not in list)
- `medrxiv.org` ✅ (not in list - medical preprints)
- `chemrxiv.org` ✅ (not in list)
- `ssrn.com` ⚠️ (not in list, but some papers restricted)

**Institutional Repositories:**
- `ncbi.nlm.nih.gov/pmc/` ✅ (handled via fullTextSource)
- `eric.ed.gov` ✅ (not in list)
- `europepmc.org` ✅ (not in list)

**Open Access Publishers:**
- `plos.org` ✅ (MUST NOT be in paywall list!)
- `frontiersin.org` ✅ (not in list)
- `mdpi.com` ✅ (not in list)
- `biomedcentral.com` ✅ (not in list)
- `doaj.org` ✅ (not in list - Directory of Open Access Journals)

---

## Issues Found

### 🔴 Critical Issue: Missing Major Paywalled Publishers

**Impact:** Users see "Full-Text Available" for paywalled sources
**Examples:**
- Web of Science articles (webofknowledge.com)
- JAMA articles (jamanetwork.com)
- Oxford journals (academic.oup.com)
- Cambridge journals (cambridge.org)

**Fix Required:** Add 10+ major paywalled publishers to detection list

### 🟡 Medium Issue: Open Access Preprints Not Explicitly Verified

**Impact:** Preprints show "Full-Text Available" instead of "Open Access"
**Examples:**
- bioRxiv articles
- ChemRxiv articles
- ERIC articles

**Fix Required:** Add logic to detect and verify open access sources

### 🟢 Working Correctly:

- ✅ IEEE Xplore (reported by user, now detected)
- ✅ Elsevier/ScienceDirect
- ✅ Springer, Wiley, Nature, Science, ACS
- ✅ PubMed Central (via fullTextSource)
- ✅ Unpaywall (via fullTextSource)

---

## Recommended Fixes

### Fix 1: Add Missing Paywalled Publishers (High Priority)

```typescript
const isPaywalledPublisher = paper.url && (
  // Existing (12)
  paper.url.includes('ieeexplore.ieee.org') ||
  paper.url.includes('sciencedirect.com') ||
  paper.url.includes('springer.com') ||
  paper.url.includes('springerlink.com') ||
  paper.url.includes('wiley.com') ||
  paper.url.includes('onlinelibrary.wiley.com') ||
  paper.url.includes('nature.com') ||
  paper.url.includes('science.org') ||
  paper.url.includes('acs.org') ||
  paper.url.includes('tandfonline.com') ||
  paper.url.includes('sagepub.com') ||
  paper.url.includes('journals.lww.com') ||

  // NEW - High Priority (10)
  paper.url.includes('webofknowledge.com') ||
  paper.url.includes('webofscience.com') ||
  paper.url.includes('scopus.com') ||
  paper.url.includes('oxfordjournals.org') ||
  paper.url.includes('academic.oup.com') ||
  paper.url.includes('cambridge.org') ||
  paper.url.includes('bmj.com') ||
  paper.url.includes('jamanetwork.com') ||
  paper.url.includes('nejm.org') ||
  paper.url.includes('thelancet.com')
);
```

### Fix 2: Verify Open Access Sources (Medium Priority)

```typescript
const isVerifiedOpenAccess =
  // Existing
  (paper.fullTextSource === 'unpaywall' || paper.fullTextSource === 'pmc') ||

  // NEW - Preprint servers
  (paper.url && (
    paper.url.includes('arxiv.org') ||
    paper.url.includes('biorxiv.org') ||
    paper.url.includes('medrxiv.org') ||
    paper.url.includes('chemrxiv.org') ||
    paper.url.includes('eric.ed.gov') ||
    paper.url.includes('europepmc.org')
  )) ||

  // NEW - Open access publishers
  (paper.url && (
    paper.url.includes('plos.org') ||
    paper.url.includes('frontiersin.org') ||
    paper.url.includes('mdpi.com') ||
    paper.url.includes('biomedcentral.com')
  )) &&
  !isPaywalledPublisher; // Safety check
```

---

## Testing Matrix

| Source | Expected Badge | Current Badge | Status |
|--------|----------------|---------------|--------|
| arXiv | 🔓 Open Access | ✅ Full-Text Available | ✅ OK (can improve) |
| bioRxiv | 🔓 Open Access | ✅ Full-Text Available | ✅ OK (can improve) |
| PMC | 🔓 Open Access | 🔓 Open Access | ✅ CORRECT |
| Unpaywall | 🔓 Open Access | 🔓 Open Access | ✅ CORRECT |
| IEEE | 🔒 Subscription Required | 🔒 Subscription Required | ✅ FIXED |
| Elsevier | 🔒 Subscription Required | 🔒 Subscription Required | ✅ CORRECT |
| Web of Science | 🔒 Subscription Required | ❌ Full-Text Available | ❌ BROKEN |
| JAMA | 🔒 Subscription Required | ❌ Full-Text Available | ❌ BROKEN |
| Oxford | 🔒 Subscription Required | ❌ Full-Text Available | ❌ BROKEN |
| Cambridge | 🔒 Subscription Required | ❌ Full-Text Available | ❌ BROKEN |

---

## Action Items

### Immediate (Critical):
- [ ] Add 10 missing paywalled publishers
- [ ] Test with Web of Science article
- [ ] Test with JAMA article
- [ ] Test with Oxford journal article

### Short Term (Important):
- [ ] Add open access preprint detection
- [ ] Verify bioRxiv, ChemRxiv, ERIC show Open Access badge
- [ ] Add PLOS, Frontiers, MDPI to verified open access

### Long Term (Enhancement):
- [ ] Create centralized publisher classification database
- [ ] Add Unpaywall API call to verify OA status in real-time
- [ ] Implement publisher detection via DOI prefix
- [ ] Add institutional access detection via ORCID

---

## Conclusion

**Current Coverage:**
✅ 12 paywalled publishers detected
❌ 10+ major paywalled publishers missing
✅ 2 verified open access sources (PMC, Unpaywall)
⚠️ 6+ open access sources not explicitly verified

**Priority:** HIGH - Add missing paywalled publishers immediately to prevent misleading users.

**Status:** AUDIT COMPLETE - FIXES REQUIRED
