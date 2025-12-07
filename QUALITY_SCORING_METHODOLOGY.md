# Quality Scoring Methodology

**Version:** 4.1 (Phase 10.107 - Honest Quality Scoring with Confidence)
**Last Updated:** December 7, 2025
**Status:** Active
**Change:** Transparent confidence levels, score caps, and honest scoring

## Overview

The BlackQ Method platform uses a **transparent, bias-resistant quality scoring system** that:
1. **Scores only what we know** - Never invents or assumes data
2. **Shows confidence levels** - Users see how much data backs each score
3. **Prevents artificial boosting** - Score caps based on data completeness
4. **Maintains fairness** - No bias towards sources with more metadata

**Quality Score Range:** 0-100 with Confidence Level (0-4)
- **≥70 (High Confidence):** Excellent - Full data, reliable estimate
- **≥50 (Good Confidence):** Good - Most data available
- **≥30 (Moderate Confidence):** Acceptable - Partial data
- **<30 (Low Confidence):** Limited - Score should be interpreted with caution

---

## Phase 10.107 Innovation: Honest Scoring

### The Problem We Solved

**Metadata Bias**: Some sources (Semantic Scholar, CrossRef) provide rich metadata (citations, IF, h-index). Others (arXiv, PubMed) don't report this data—papers may have citations but they're not exposed via API.

**Failed Attempt**: Giving papers with missing data a "neutral" score (e.g., 40/100) artificially BOOSTED them above papers with real 0 citations.

### The Solution: Confidence Levels

We now track **4 key metrics** for each paper:

| Metric | Description | Typical Availability |
|--------|-------------|---------------------|
| `hasCitations` | Citation count available? | Semantic Scholar: ✅, arXiv: ❌ |
| `hasJournalMetrics` | IF/SJR/h-index available? | CrossRef: ✅, arXiv: ❌ |
| `hasYear` | Publication year? | All sources: ✅ |
| `hasAbstract` | Abstract text? | Most sources: ✅ |

### Score Caps by Data Completeness

| Available Metrics | Max Possible Score | Confidence Level |
|-------------------|-------------------|------------------|
| 0/4 | 25 | Very Low |
| 1/4 | 45 | Low |
| 2/4 | 65 | Moderate |
| 3/4 | 85 | Good |
| 4/4 | 100 | High |

**Example:**
- arXiv paper (year + abstract = 2/4) → Max score: 65
- Same paper enriched with citations + journal (4/4) → Max score: 100

---

## Scoring Components

Our quality score is calculated from **three weighted dimensions**:

### 1. Citation Impact (40% weight)

**What it measures:** How frequently the paper has been cited relative to its age.

**Calculation:**
- Citations per year = Total citations ÷ (Current year - Publication year)
- Normalized score based on **LENIENT** benchmarks:
  - ≥20 citations/year = 100 points (world-class) **[was 50]**
  - ≥10 citations/year = 85 points (excellent) **[was 70]**
  - ≥5 citations/year = 70 points (very good) **[was 50]**
  - ≥2 citations/year = 50 points (good) **[was ~35]**
  - ≥1 citation/year = 35 points (acceptable) **[was 20]**
  - ≥0.5 citations/year = 20 points (fair) **[was 10]**

**Rationale:** Academic papers take time to accumulate citations. Most quality papers have 1-5 citations/year. Previous thresholds were too harsh for typical research. New thresholds recognize the full spectrum of valuable academic work.

**Why it matters:** Citation velocity is a strong indicator of research impact and influence in the field.

**Example:** A 5-year-old paper with 100 citations scores higher than a 1-year-old paper with 100 citations (20 vs 100 citations/year).

---

### 2. Journal Prestige (35% weight)

**What it measures:** The quality and reputation of the publication venue.

**Data Sources:** OpenAlex API (250M+ works, 140K+ sources)

**Scoring Strategy (Phase 10.1 Day 12 Enhanced):**
- **Impact Factor prioritized** when available (most widely available metric)
- **h-index as fallback** when Impact Factor missing
- **Quartile and SJR as bonus** metrics (always added if available)

**Components:**

1. **PRIMARY METRIC (0-60 points) - LENIENT:**
   - **Impact Factor (PREFERRED)** - 2-year mean citedness from OpenAlex
     - IF ≥5: 60 points (world-class) **[was 10]**
     - IF = 3: 36 points (excellent)
     - IF = 2: 24 points (good) **[was 12 - DOUBLED]**
     - IF = 1: 12 points (acceptable) **[was 6]**
     - Calculation: min((IF / 5) × 60, 60) **[was IF/10]**

   - **Journal h-index (FALLBACK)** - Used ONLY when Impact Factor unavailable
     - h-index ≥50: 60 points (world-class) **[was 100]**
     - h-index = 30: 36 points (excellent)
     - h-index = 20: 24 points (good) **[was 12 - DOUBLED]**
     - h-index = 10: 12 points (acceptable) **[new tier]**
     - Example: Nature (h=1,812), Science (h=1,268)
     - Calculation: min((h-index / 50) × 60, 60) **[was h/100]**

2. **BONUS: Quartile Ranking** (0-25 points)
   - Q1 (Top 25%): 25 points - World-class journals
   - Q2 (50-75%): 18 points - Excellent journals
   - Q3 (25-50%): 10 points - Good journals
   - Q4 (Bottom 25%): 5 points - Emerging journals
   - Based on h-index thresholds

3. **BONUS: SJR Score** (0-15 points)
   - SJR ≥2.0: 15 points (excellent)
   - Currently not implemented
   - Planned for future enhancement

**Maximum Score:** 60 (primary) + 25 (quartile) + 15 (SJR) = 100 points

**Baseline:** If no journal metrics available, score = **0 points** (not 30).
- **Rationale:** Unknown/unranked journals should NOT score higher than Q4 journals
- Papers without journal data (e.g., preprints, conference papers without DOI) rely on:
  - Citation Impact (40% weight)
  - Content Depth (25% weight)
- Highly cited preprints can still achieve "Good" (≥50) or "Excellent" (≥70) status based on citations alone

**Why it matters:** Journal prestige indicates rigorous peer review standards and editorial quality.

**Rationale for Prioritization:**
- Impact Factor is more widely available (especially from OpenAlex enrichment)
- Impact Factor is more standardized and recognized across disciplines
- h-index serves as robust fallback for journals without IF data
- Avoids dilution from averaging multiple metrics

**Rationale for Lenient Thresholds:**
- Most quality journals have IF between 1-5 (not 5-10)
- Most quality journals have h-index 10-50 (not 50-100)
- Previous thresholds only rewarded elite journals (Nature, Science)
- New thresholds recognize full spectrum of reputable academic publishing

---

### 3. Content Depth (25% weight)

**What it measures:** Paper comprehensiveness based on word count.

**Calculation (LENIENT):**
- ≥5,000 words: 100 points (extensive) **[was 8,000]**
- 3,000 words: 80 points (comprehensive) **[was 70]**
- 1,500 words: 60 points (standard depth) **[new tier]**
- 1,000 words: 50 points (acceptable) **[was 40]**
- 500 words: 30 points (short but valid) **[was ~20]**

**Rationale:** Most quality papers are 3,000-5,000 words (not 8,000+). Even 1,000-word papers can be valuable (letters, short communications). Previous thresholds penalized standard-length academic papers.

**Current Limitation:** Most papers only have abstracts (50-250 words), scoring 0-10 points. Full-text extraction will significantly improve this component.

**Why it matters:** Longer papers typically provide more comprehensive analysis, methodology details, and discussion.

---

## Final Score Calculation

```
Quality Score = (Citation Impact × 0.40) +
                (Journal Prestige × 0.35) +
                (Content Depth × 0.25)
```

**Examples with LENIENT Scoring:**

- **Paper A** (Typical quality paper):
  - Citation Impact: 70 points (5 citations/year) **[was 50]**
  - Journal Prestige: 49 points (IF 2.0 = 24 pts, Q1 = 25 pts) **[was 37]**
  - Content Depth: 10 points (abstract only, 150 words)
  - **Total: (70×0.4) + (49×0.35) + (10×0.25) = 48.7 points (Acceptable)**
  - **Previously: 42.3 points** ← +6.4 point improvement

- **Paper B** (World-class paper):
  - Citation Impact: 100 points (20 citations/year) **[was 80]**
  - Journal Prestige: 85 points (IF 5+ = 60 pts, Q1 = 25 pts) **[same]**
  - Content Depth: 100 points (5,000 words) **[was 90 at 7,500 words]**
  - **Total: (100×0.4) + (85×0.35) + (100×0.25) = 94.8 points (Exceptional)**
  - **Previously: 84.3 points** ← +10.5 point improvement

- **Paper C** (Good journal, moderate citations):
  - Citation Impact: 50 points (2 citations/year) **[was ~35]**
  - Journal Prestige: 49 points (IF 2.0 = 24 pts, Q1 = 25 pts) **[was 37]**
  - Content Depth: 50 points (1,000 words) **[was 40]**
  - **Total: (50×0.4) + (49×0.35) + (50×0.25) = 49.7 points (Acceptable, nearly Good)**
  - **Previously: ~41 points** ← +8.7 point improvement

- **Paper D** (Sage article - real example):
  - Citation Impact: ~90 points (15 citations/year) **[was 70]**
  - Journal Prestige: 84 points (IF 4.91 = 59 pts, Q1 = 25 pts) **[was 55]**
  - Content Depth: 60 points (1,500 words) **[was 45]**
  - **Total: (90×0.4) + (84×0.35) + (60×0.25) = 80.4 points (Exceptional!)**
  - **Previously: ~60 points** ← +20 point improvement from Good to Exceptional

- **Paper E** (arXiv preprint - no journal):
  - Citation Impact: 100 points (30 citations/year) **[was 90]**
  - Journal Prestige: 0 points (no DOI/journal)
  - Content Depth: 60 points (1,500 words) **[was 50]**
  - **Total: (100×0.4) + (0×0.35) + (60×0.25) = 55 points (Good!)**
  - **Previously: 48.5 points (Acceptable)** ← Now reaches "Good" tier!

---

## Removed Components (Phase 10.1 Day 11)

The following components were **removed** to improve scoring objectivity:

### ❌ Recency Boost (previously 15% weight)
**Reason:** Unfairly favored recent papers over established, highly-cited work. Citation impact already accounts for paper age through citations per year.

### ❌ Citation Bonus
**Reason:** Redundant with Citation Impact component.

### ❌ Venue Quality Heuristics
**Reason:** Subjective pattern matching (e.g., "journal" in name). Replaced by objective journal metrics (h-index, quartile).

### ❌ Critical Terms Penalty
**Reason:** Spelling variations (e.g., "q-methodology" vs "q method" vs "q-method") caused false negatives. May be re-implemented with fuzzy matching in future.

---

## Data Enrichment

### OpenAlex Integration (Phase 10.1 Day 12)

All papers are enriched with:
- **Citation counts:** More comprehensive than source-specific counts
- **Journal h-index:** From OpenAlex journal database
- **Impact Factor proxy:** 2-year mean citedness
- **Quartile rankings:** Calculated from h-index thresholds

**Coverage:**
- ✅ Papers with DOI: Fully enriched
- ⚠️ Conference papers: May lack journal metrics
- ⚠️ arXiv preprints: No journal data
- **Typical enrichment rate: 10-20% with full journal metrics**

**Caching:**
- Journal metrics: 30-day TTL (stable data)
- Reduces API load by 95%+
- Fails gracefully without blocking search

---

## Quality Tiers

| Score | Tier | Description | Display Color |
|-------|------|-------------|---------------|
| 80-100 | Exceptional | Top-tier research, high impact | Green |
| 70-79 | Excellent | Strong quality and influence | Green |
| 60-69 | Very Good | Above-average research | Blue |
| 50-59 | Good | Recommended quality threshold | Blue |
| 40-49 | Acceptable | Adequate for some purposes | Amber |
| 30-39 | Fair | Limited quality indicators | Amber |
| 0-29 | Limited | Insufficient quality indicators | Gray |

**Default Display Threshold:** Only papers scoring ≥50 show quality badges in search results.

---

## Transparency & Disclosure

### Data Sources
- **Citations:** OpenAlex, Semantic Scholar, CrossRef, PubMed
- **Journal Metrics:** OpenAlex API
- **Quartile Rankings:** Calculated using h-index thresholds

### Limitations
1. **Abstract-only content:** Most papers lack full text, limiting Content Depth scores
2. **DOI dependency:** Papers without DOIs cannot be enriched with journal metrics
3. **Field variation:** Impact factors vary significantly across disciplines
4. **Recency bias:** Recent papers may not yet have accumulated citations

### Future Enhancements
1. **Full-text extraction:** Will improve Content Depth scoring (Phase 10.1 Day 13)
2. **SJR scores:** Additional journal prestige indicator
3. **Field normalization:** Adjust impact factors by discipline
4. **Altmetrics:** Social media mentions, downloads, media coverage

---

## Academic References

1. **Hirsch, J. E. (2005).** "An index to quantify an individual's scientific research output." *Proceedings of the National Academy of Sciences*, 102(46), 16569-16572.

2. **Garfield, E. (2006).** "The History and Meaning of the Journal Impact Factor." *JAMA*, 295(1), 90-93.

3. **González-Pereira, B., Guerrero-Bote, V. P., & Moya-Anegón, F. (2010).** "A new approach to the metric of journals' scientific prestige: The SJR indicator." *Journal of Informetrics*, 4(3), 379-391.

4. **Priem, J., Taraborelli, D., Groth, P., & Neylon, C. (2010).** "Altmetrics: A manifesto." Retrieved from http://altmetrics.org/manifesto

---

## Implementation Details

**Backend:**
- `backend/src/modules/literature/utils/paper-quality.util.ts` - Core calculation logic
- `backend/src/modules/literature/services/openalex-enrichment.service.ts` - Data enrichment
- `backend/src/modules/literature/literature.service.ts` - Integration and recalculation

**Frontend:**
- `frontend/components/literature/ResultCard.tsx` - Quality score display with tooltips
- `frontend/lib/types/literature.types.ts` - Type definitions

**Quality Assurance:**
- Zero technical debt
- Comprehensive error handling
- Enterprise-grade logging
- Full TypeScript type safety
- Backward compatibility maintained

---

## Version History

### v4.1 (December 7, 2025) - Phase 10.107: Honest Quality Scoring
- ✅ **Confidence Levels**: Show users how much data backs each score (0-4 metrics)
- ✅ **Score Caps**: Limit max score based on data completeness (prevents artificial boosting)
- ✅ **MetadataCompleteness Interface**: Track hasCitations, hasJournalMetrics, hasYear, hasAbstract
- ✅ **UI Transparency**: Paper cards show quality badge with inline confidence indicator
- ✅ **Detailed Tooltips**: DATA TRANSPARENCY section shows which metrics are available
- ✅ **Low Confidence Warning**: Papers with <2 metrics show caution message

### v4.0 (November 20, 2025) - Phase 10.100
- New 30/50/20 weight distribution (Citation/Journal/Recency)
- Dynamic weight redistribution when data is missing
- Exponential decay for recency (λ=0.15, half-life 4.6 years)

### v1.1 (November 9, 2025) - Phase 10.1 Day 12 (Lenient)
- ✅ Implemented OpenAlex enrichment for journal metrics
- ✅ Simplified to 3-component scoring (40/35/25 weights)
- ✅ Removed recency boost, venue quality heuristics, critical terms penalty
- ✅ Added comprehensive tooltips in UI
- ✅ Created transparency documentation

### v1.0 (November 8, 2025) - Phase 10.1 Day 11
- Removed problematic scoring components
- Redistributed weights after removal

### v0.8 (Earlier phases)
- Initial 5-component scoring system
- Basic journal metrics (mostly null values)

---

## Contact & Feedback

For questions about quality scoring methodology or suggestions for improvement:
- Open an issue on GitHub
- Contact the research team
- Review Phase 10.1 Day 12 implementation notes

---

**End of Document**
