# Quality Indicator & Stage Arrows Explanation

## 1. Quality Indicator (Circular Progress Ring)

### What It Shows
The **Quality Indicator** is a circular progress meter that displays a **quality score (0-100)** that **increases dynamically** as the search progresses.

### How It Increases

The quality score is calculated based on **three factors**:

#### Factor 1: Source Coverage (0-30 points)
```
Score = (sourcesComplete / sourcesTotal) × 30
```
- As more academic databases finish querying, this increases
- Example: 5/10 sources complete = 15 points

#### Factor 2: Paper Count (0-30 points)
```
Score = min(papersFound / 200, 1) × 30
```
- Increases as papers are discovered
- Capped at 200 papers for scoring (so 200+ papers = 30 points)
- Example: 100 papers found = 15 points

#### Factor 3: Semantic Ranking Tier (0-40 points)
```
- 'immediate' tier: +15 points
- 'refined' tier: +30 points  
- 'complete' tier: +40 points
```
- Increases as semantic ranking progresses through tiers
- Maximum points when full semantic analysis completes

### Visual States

| Score Range | Label | Color | Meaning |
|------------|-------|-------|---------|
| 80-100 | "Excellent" | Green | High-quality search with good coverage |
| 60-79 | "Good" | Blue | Solid search progress |
| 40-59 | "Fair" | Yellow | Search in progress |
| 0-39 | "Building..." | White/Gray | Early stage, still collecting data |

### Example Progression

**Start of Search:**
- 0 sources complete, 0 papers → **0/100** ("Building...")

**Mid Search:**
- 7/10 sources complete (21 points)
- 50 papers found (7.5 points)
- 'immediate' semantic tier (15 points)
- **Total: 43.5 → 44/100** ("Fair")

**Near Complete:**
- 10/10 sources complete (30 points)
- 150 papers found (22.5 points)
- 'refined' semantic tier (30 points)
- **Total: 82.5 → 83/100** ("Excellent")

**Fully Complete:**
- 10/10 sources complete (30 points)
- 250 papers found (30 points - capped)
- 'complete' semantic tier (40 points)
- **Total: 100/100** ("Excellent")

---

## 2. Chevron-Down Arrows (Stage Expand/Collapse)

### What They Are
The **chevron-down arrows (▼)** are **expand/collapse buttons** that appear on pipeline stages that have **substages**.

### Purpose
When clicked, they expand to show **detailed substage progress** for that pipeline stage.

### How They Work

1. **Collapsed State (▼)**:
   - Arrow points down
   - Click to expand and see substages

2. **Expanded State (▲)**:
   - Arrow rotates 180° (points up)
   - Shows detailed substage list with progress indicators

### Example: "Discover" Stage Substages

When you click the chevron on the **"Discover"** stage, it expands to show:
- ✅ openalex (complete - green dot)
- 🔵 crossref (in progress - blue pulsing dot)
- ⚪ pubmed (pending - gray dot)
- ✅ arxiv (complete - green dot)
- ... etc. for all sources

### Visual Feedback

- **Green dot**: Substage complete
- **Blue pulsing dot**: Substage in progress
- **Gray dot**: Substage pending

---

## Code Location

**Quality Indicator:**
- Component: `QualityMeter` in `LiveCounter.tsx`
- Calculation: `calculateQualityScore()` in `usePipelineState.ts`

**Chevron Arrows:**
- Component: `StageOrb.tsx` (lines 485-497)
- Expand/collapse functionality for pipeline stage substages

---

## Why These Features Exist

### Quality Indicator Purpose:
- **User Feedback**: Shows search progress and quality in real-time
- **Transparency**: Users understand how well their search is performing
- **Motivation**: Visual feedback keeps users engaged during long searches

### Chevron Arrows Purpose:
- **Detail on Demand**: Users can drill down into stage details when needed
- **Clean UI**: Keeps interface uncluttered, shows details only when requested
- **Progress Tracking**: See individual source/substage status

---

## Technical Details

### Quality Score Formula:
```typescript
let score = 0;

// Source coverage (0-30)
score += (sourcesComplete / sourcesTotal) * 30;

// Paper count (0-30, capped at 200 papers)
score += Math.min(papersFound / 200, 1) * 30;

// Semantic tier (0-40)
if (semanticTier === 'immediate') score += 15;
else if (semanticTier === 'refined') score += 30;
else if (semanticTier === 'complete') score += 40;

return Math.round(score); // 0-100
```

### Animation:
- Uses Framer Motion for smooth score transitions
- Spring physics for natural feeling updates
- Color changes based on score thresholds

