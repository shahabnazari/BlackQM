# Phase 10.107: Honest Quality Scoring with Confidence Levels

## Overview

Phase 10.107 introduces a transparent, bias-resistant quality scoring system that:
1. **Scores only what we know** - Never invents or assumes data
2. **Shows confidence levels** - Users see how much data backs each score
3. **Prevents artificial boosting** - Score caps based on data completeness
4. **Maintains fairness** - No bias towards sources with more metadata

## The Problem We Solved

### Previous Issue: Metadata Bias
Some academic sources (like Semantic Scholar, CrossRef) provide rich metadata:
- Citation counts
- Journal impact factors
- h-index, SJR scores
- Quartile rankings

Other sources (like arXiv, PubMed, CORE) don't report:
- Citation counts (papers may have citations, just not reported)
- Journal metrics (preprints don't have journals)

**The old system unfairly penalized papers from sources with less metadata.**

### Failed Attempt: Neutral Scores
We tried giving papers with missing data a "neutral" score (e.g., 40/100 for citations).

**Problem:** This artificially BOOSTED papers with unknown data above papers with real 0 citations!

A paper with unknown citations shouldn't score higher than a paper we KNOW has 0 citations.

## The Solution: Honest Scoring with Confidence

### Core Principles

1. **HONESTY**: Score only what we actually know
2. **TRANSPARENCY**: Show users data completeness alongside scores
3. **SEPARATION**: Quality ≠ Relevance (different concepts, both displayed)

### Two Distinct Scores

```
┌─────────────────────────────────────────────────────────────────────────┐
│ RELEVANCE SCORE (0-100)                                                 │
│ "How well does this paper match your search query?"                     │
│                                                                         │
│ Components:                                                             │
│ - BM25 Lexical Match (30%): Exact keyword matching                     │
│ - Semantic Similarity (50%): Conceptual/meaning match via embeddings   │
│ - Recency (20%): Newer papers weighted slightly higher                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ QUALITY SCORE (0-100) with CONFIDENCE LEVEL                            │
│ "How impactful/prestigious is this paper based on available metrics?"  │
│                                                                         │
│ Components (ONLY when data exists):                                     │
│ - Citation Impact: Citations per year, normalized by field             │
│ - Journal Prestige: Impact factor, h-index, quartile                   │
│ - Open Access Bonus: +10 if freely available                           │
│                                                                         │
│ DATA COMPLETENESS shown alongside:                                      │
│ - "Quality: 72 (4/4)" = High confidence - all data available           │
│ - "Quality: 45 (2/4)" = Moderate confidence - partial data             │
│ - "Quality: 25 (1/4)" = Low confidence - minimal data                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Metadata Completeness Tracking

We track 4 key metrics:

| Metric | Description | Example Sources |
|--------|-------------|-----------------|
| `hasCitations` | Do we have citation count? | Semantic Scholar: Yes, arXiv: No |
| `hasJournalMetrics` | Do we have IF/SJR/h-index? | CrossRef: Some, arXiv: No |
| `hasYear` | Do we have publication year? | All sources: Usually Yes |
| `hasAbstract` | Do we have abstract text? | Most sources: Yes |

### Score Caps by Data Completeness

To prevent papers with limited data from appearing artificially high-quality:

| Available Metrics | Maximum Possible Score |
|-------------------|------------------------|
| 0/4 | 25 |
| 1/4 | 45 |
| 2/4 | 65 |
| 3/4 | 85 |
| 4/4 | 100 |

**Example:**
- arXiv paper (year + abstract only = 2/4) → Maximum score: 65
- Same paper with citations + journal data (4/4) → Maximum score: 100

### Confidence Levels

| Level | Metrics | Color | Meaning |
|-------|---------|-------|---------|
| High | 4/4 | Emerald | Full data - reliable quality estimate |
| Good | 3/4 | Green | Most data - good estimate |
| Moderate | 2/4 | Amber | Partial data - moderate confidence |
| Low | 1/4 | Orange | Limited data - low confidence |
| Very Low | 0/4 | Gray | No metrics - score unreliable |

## UI Implementation

### Paper Card Quality Badge

The quality badge now shows:
```
┌─────────────────────────────────┐
│ 🏆 72 Good [3/4]  ℹ️            │
└─────────────────────────────────┘
        ↑      ↑    ↑
     Score  Label  Confidence
```

### Expanded Tooltip

Hovering reveals full transparency:
```
┌──────────────────────────────────────────────────────────────┐
│ QUALITY SCORE v4.1                    Good Confidence (3/4) │
│                                                              │
│ SCORE: 72/100                                                │
│ (capped at 85 with 3/4 metrics)                             │
│                                                              │
│ DATA TRANSPARENCY                                            │
│ ✓ Citations         ✓ Journal Metrics                       │
│ ✓ Year              ✗ Abstract (not available)              │
│                                                              │
│ Most data available - reliable quality estimate              │
│                                                              │
│ CITATION IMPACT                                    30%       │
│ Score: 45.0                                                  │
│ Total citations: 120                                         │
│                                                              │
│ JOURNAL PRESTIGE                                   50%       │
│ Score: 60.0                                                  │
│                                                              │
│ v4.1 methodology: Honest scoring - only scores what we know │
└──────────────────────────────────────────────────────────────┘
```

### Low Confidence Warning

For papers with < 2 metrics, a warning appears:
```
⚠️ Limited Data: This source doesn't provide complete metadata.
   The quality score is based on minimal metrics and should be
   interpreted with caution.
```

## Files Modified

### Backend
- [paper-quality.util.ts](backend/src/modules/literature/utils/paper-quality.util.ts)
  - Added `MetadataCompleteness` interface
  - Added `calculateMetadataCompleteness()` function
  - Updated `calculateQualityScore()` with score caps
  - Updated `QualityScoreComponents` to include metadata

### Frontend
- [literature.types.ts](frontend/lib/types/literature.types.ts)
  - Added `MetadataCompleteness` interface
  - Updated `Paper` interface with `metadataCompleteness`

- [constants.ts](frontend/app/(researcher)/discover/literature/components/paper-card/constants.ts)
  - Added `CONFIDENCE_THRESHOLDS`
  - Added `SCORE_CAPS_BY_METRICS`
  - Added helper functions: `getConfidenceLabel()`, `getConfidenceColorClasses()`, etc.

- [PaperQualityBadges.tsx](frontend/app/(researcher)/discover/literature/components/paper-card/PaperQualityBadges.tsx)
  - Complete rewrite for Phase 10.107
  - Shows confidence inline in badge
  - Expanded tooltip with data transparency section
  - Low confidence warning for papers with limited data

- [PaperCard.tsx](frontend/app/(researcher)/discover/literature/components/PaperCard.tsx)
  - Passes `metadataCompleteness` prop to `PaperQualityBadges`

## Why This Design

1. **A highly relevant paper with low quality is still useful**
   - It matches your topic, even if we don't know its impact

2. **A high quality paper with low relevance is NOT useful**
   - It's about something else entirely

3. **Users see BOTH scores and understand what each means**
   - Relevance = topic match
   - Quality = impact/prestige

4. **No artificial boosting of papers with missing data**
   - Users can see exactly what data is available
   - Score caps prevent unrealistic rankings

## Academic References

- Hirsch, J. E. (2005). An index to quantify an individual's scientific research output
- Garfield, E. (2006). The History and Meaning of the Journal Impact Factor
- González-Pereira et al. (2010). A new approach to the metric of journals' scientific prestige: The SJR indicator
- Waltman & van Eck (2019). Field normalization of scientometric indicators

## Version History

- **v4.0**: Original quality scoring with fixed weights
- **v4.1 (Phase 10.107)**: Honest scoring with confidence levels and score caps
