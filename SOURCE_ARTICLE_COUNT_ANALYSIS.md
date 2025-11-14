# Academic Database Article Count Analysis - Phase 10.7 Day 5

## 🎯 Objective: Remove sources with <500k papers, order by article count

## 📊 Article Count Research (November 2025)

### Tier 1: Premium Sources

| Source | Article Count | Status | Priority |
|--------|---------------|--------|----------|
| **Semantic Scholar** | 220M+ | ✅ KEEP | 1 (highest) |
| **Scopus** | 90M+ | ✅ KEEP | 2 |
| **Web of Science** | 100M+ | ✅ KEEP | 3 |
| **PubMed** | 36M+ | ✅ KEEP | 4 |
| **PMC** | 10M+ | ✅ KEEP | 5 |
| **Springer** | 10M+ | ✅ KEEP | 6 |
| **Nature** | 500k+ | ✅ KEEP | 7 (threshold) |

### Tier 2: Good Sources

| Source | Article Count | Status | Priority |
|--------|---------------|--------|----------|
| **Wiley** | 6M+ | ✅ KEEP | 1 |
| **IEEE Xplore** | 5M+ | ✅ KEEP | 2 |
| **Taylor & Francis** | 2.5M+ | ✅ KEEP | 3 |
| **SAGE** | 1.2M+ | ✅ KEEP | 4 |

### Tier 3: Preprint Sources

| Source | Article Count | Status | Priority |
|--------|---------------|--------|----------|
| **ArXiv** | 2.4M+ | ✅ KEEP | 1 |
| **SSRN** | 1.1M+ | ✅ KEEP | 2 |
| **bioRxiv** | 220k | ❌ REMOVE | - |
| **medRxiv** | 45k | ❌ REMOVE | - |
| **ChemRxiv** | 35k | ❌ REMOVE | - |

### Tier 4: Aggregator Sources

| Source | Article Count | Status | Priority |
|--------|---------------|--------|----------|
| **Google Scholar** | 400M+ | ✅ KEEP | 1 (highest) |
| **CrossRef** | 145M+ | ✅ KEEP | 2 |
| **ERIC** | 1.7M+ | ✅ KEEP | 3 |

## 🗑️ Sources to Remove (< 500k papers)

1. **bioRxiv**: 220k papers (biology preprints)
2. **medRxiv**: 45k papers (medical preprints)
3. **ChemRxiv**: 35k papers (chemistry preprints)

**Rationale:**
- Too few papers for comprehensive research
- Coverage gaps compared to established sources
- Not worth API quota allocation
- ArXiv provides better preprint coverage (2.4M papers)

## 📈 Revised Source Allocations (Within Tiers)

### Tier 1: Premium (by article count)
1. Semantic Scholar: 220M → 600 papers
2. Scopus: 90M → 600 papers
3. Web of Science: 100M → 600 papers
4. PubMed: 36M → 600 papers
5. PMC: 10M → 600 papers
6. Springer: 10M → 600 papers
7. Nature: 500k → 600 papers

### Tier 2: Good (by article count)
1. Wiley: 6M → 450 papers
2. IEEE: 5M → 450 papers
3. Taylor & Francis: 2.5M → 450 papers
4. SAGE: 1.2M → 450 papers

### Tier 3: Preprint (by article count)
1. ArXiv: 2.4M → 350 papers
2. SSRN: 1.1M → 350 papers
~~3. bioRxiv: 220k → REMOVED~~
~~4. medRxiv: 45k → REMOVED~~
~~5. ChemRxiv: 35k → REMOVED~~

### Tier 4: Aggregator (by article count)
1. Google Scholar: 400M → 400 papers
2. CrossRef: 145M → 400 papers
3. ERIC: 1.7M → 400 papers

## 🎯 Total Sources: 16 (down from 19)

**Before:** 19 sources (6 Tier 1, 5 Tier 2, 5 Tier 3, 3 Tier 4)
**After:** 16 sources (7 Tier 1, 4 Tier 2, 2 Tier 3, 3 Tier 4)

**Impact:**
- ✅ Higher quality sources only
- ✅ Better API quota utilization
- ✅ Faster searches (fewer sources to query)
- ✅ More comprehensive coverage per source

## 📝 Implementation Notes

1. **Move Semantic Scholar to Tier 1**
   - 220M papers > many "premium" sources
   - AI-powered quality filtering
   - Should be prioritized higher

2. **Search Order Within Tiers**
   - Search highest article count first
   - Better chance of hitting target quickly
   - More efficient resource utilization

3. **Remove Small Preprint Servers**
   - ArXiv (2.4M) provides sufficient preprint coverage
   - SSRN (1.1M) covers social sciences
   - Small servers not worth the complexity
