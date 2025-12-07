# Performance Analysis - Quick Reference

**Full Report**: `PHASE_10.100_PERFORMANCE_ANALYSIS.md`

---

## 🚨 CRITICAL ISSUES (Fix Immediately)

### 1. Levenshtein in Spell-Check Loop
**File**: `literature-utils.service.ts:421-434`
**Impact**: 100-200ms overhead per query
**Fix**: Implement early termination with threshold
**Expected Improvement**: 5x faster

```typescript
// CURRENT: O(words × 150 × word_length²)
for (const commonWord of commonWords) {
  const distance = this.levenshteinDistance(wordLower, commonWord);
}

// OPTIMIZED: Early termination + two-row DP
levenshteinDistanceWithThreshold(str1, str2, maxDistance) {
  // Length-based early exit
  if (Math.abs(str1.length - str2.length) > maxDistance) {
    return maxDistance + 1;
  }
  // Two-row DP instead of full table
  // Early termination when row exceeds threshold
}
```

### 2. Array.includes() in Filter
**File**: `search-quality-diversity.service.ts:136, 390`
**Impact**: 50-100ms with 1000 papers
**Fix**: Use Set for O(1) lookup
**Expected Improvement**: 20x faster

```typescript
// CURRENT: O(n*m) quadratic
const remaining = papers.filter((p) => !sampled.includes(p));

// OPTIMIZED: O(n) linear
const sampledSet = new Set(sampled);
const remaining = papers.filter((p) => !sampledSet.has(p));
```

---

## 🟡 MEDIUM PRIORITY

### 3. Incorrect Shuffle Algorithm
**File**: `search-quality-diversity.service.ts:125`
**Issue**: Biased distribution + O(n log n)
**Fix**: Fisher-Yates shuffle

```typescript
// CURRENT: Wrong + slow
const shuffled = [...papers].sort(() => Math.random() - 0.5);

// CORRECT: Uniform + fast
private fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## 🟢 MINOR OPTIMIZATIONS

### 4. Dictionary as Set
**File**: `literature-utils.service.ts:259-408, 413`
**Fix**: Convert array to Set for O(1) lookup

```typescript
// CURRENT: O(n) array includes
if (commonWords.includes(wordLower)) { ... }

// OPTIMIZED: O(1) Set has
private readonly COMMON_WORDS_SET = new Set([...]);
if (this.COMMON_WORDS_SET.has(wordLower)) { ... }
```

### 5. Query Preprocessing Cache
**Impact**: Instant for repeated queries
**Implementation**: Add Map cache with 1000-entry limit

### 6. DOI Normalization Extraction
**File**: `literature-utils.service.ts:109-115`
**Fix**: Normalize once before filter, not inside filter

---

## ✅ WELL-OPTIMIZED (No Changes Needed)

- **HttpClientConfigService**: Perfect O(1) Map operations
- **SearchAnalyticsService**: Simple operations, not bottleneck

---

## 📊 EXPECTED IMPROVEMENT

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Query Processing | 300-500ms | 50-80ms | **6x faster** |
| 1000 Paper Sampling | 100ms | 5ms | **20x faster** |
| Spell-checking | 200ms | 40ms | **5x faster** |
| Shuffle | 10ms | 3ms | **3x faster** |

**Overall**: 6x faster query processing with large datasets

---

## 🎯 IMPLEMENTATION PRIORITY

1. **P0** (Do First): Issues #1, #2 - Critical performance
2. **P1** (Do Next): Issue #3, #4 - Correctness + medium gains
3. **P2** (Polish): Issues #5, #6 - Incremental improvements

---

## 📝 FILES TO MODIFY

```
backend/src/modules/literature/services/
├── literature-utils.service.ts (Issues #1, #4, #5, #6)
└── search-quality-diversity.service.ts (Issues #2, #3)
```

---

## 🧪 TESTING REQUIREMENTS

- [ ] Benchmark: 10-word query < 50ms
- [ ] Benchmark: 1000 paper sampling < 10ms
- [ ] Correctness: Levenshtein matches original for small distances
- [ ] Correctness: Fisher-Yates produces uniform distribution

---

**See `PHASE_10.100_PERFORMANCE_ANALYSIS.md` for**:
- Detailed code examples
- Algorithm explanations
- Testing strategies
- Performance benchmarks
- Academic references
