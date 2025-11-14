# Round 2: UI Text Audit & Consistency Check

## Test Date: 2025-11-14
## Objective: Check all UI text for clarity, consistency, and professionalism

---

## Round 1 Fixes Applied: ✅
1. ✅ Changed "AI-Refined Questions" → "AI-Suggested Searches"
2. ✅ Removed duplicate Stage 2 message
3. ✅ Standardized to "top 350-500 papers"
4. ✅ Changed "returned results" → "databases with papers"
5. ✅ Changed "Discovering Research Papers" → "Searching Academic Databases"

---

## Comprehensive UI Text Inventory

### Search Bar & Input
1. **Placeholder**: "Search academic literature..."
2. **AI Suggestions Header**: "AI-Suggested Searches" ✅ FIXED
3. **Button States**:
   - Default: "Search"
   - Loading: "Loading..." or "Searching..."

### Progress Indicator - Stage 1
1. **Title**: "Searching Academic Databases" ✅ FIXED
2. **Subtitle**: "Loading X papers from academic databases"
3. **Stage 1 Message**: "Stage 1: Collecting from all sources"
4. **Stage 1 Subtext**: "Querying 7 academic databases"

### Progress Indicator - Stage 2
1. **Stage 2 Message**: "Stage 2: Filtering & ranking by quality"
2. **Dynamic Subtexts**:
   - "Removing duplicates by DOI and title"
   - "Enriching with citation and impact data"
   - "Scoring relevance to your query"
   - "Ranking by quality metrics (citations, impact)"
   - "Selecting top 350-500 papers" ✅ STANDARDIZED
3. **Progress Message**: "From X collected"
4. **Target Message**: "Target: top 350-500 papers" ✅ FIXED

### Progress Indicator - Completion
1. **Title**: "✨ Search Complete!"
2. **Subtitle**: "X papers selected from Y collected"

### Search Process Transparency
1. **Header**: "How We Found These Papers"
2. **Badge**: "Details"
3. **Tooltip**: "Complete transparency showing how papers were collected, filtered, and ranked from academic databases."
4. **Query Display**: "Query: \"X\" • Searched Y research databases (Z found relevant papers)"

### Stats Cards
1. **Sources**: 
   - Label: "Sources"
   - Subtext: "databases with papers" ✅ FIXED
2. **Collected**:
   - Label: "Collected"
   - Subtext: "from all sources"
3. **Unique**:
   - Label: "Unique"
   - Subtext: "X% duplicates removed"
4. **Selected**:
   - Label: "Selected"
   - Subtext: "by quality score"

---

## Issues Found in Round 2

### 🐛 ISSUE #9: Inconsistent Loading Messages
**Severity**: LOW
**Location**: Progress bar subtitle
**Problem**: Sometimes says "Loading X papers", other times might say different things
**Current**: "Loading X papers from academic databases"
**Note**: Check if this is consistent across all states

### 🐛 ISSUE #10: "Research databases" vs "Academic databases"
**Severity**: MEDIUM
**Location**: Multiple places
**Problem**: Inconsistent terminology:
  - SearchProcessIndicator: "research databases"
  - ProgressIndicator: "academic databases"
**Recommended**: Pick ONE and use everywhere
**Suggestion**: "academic databases" (more precise)

### 🐛 ISSUE #11: Redundant "from academic databases" in subtitle
**Severity**: LOW
**Location**: Progress indicator subtitle
**Problem**: Main title is "Searching Academic Databases", subtitle says "Loading X papers from academic databases"
**Recommended**: Simplify subtitle to "Loading X papers"
**Reason**: "Academic databases" is already in the title

### 🐛 ISSUE #12: "DOI and title" - Technical Jargon
**Severity**: LOW
**Location**: Stage 2 filtering step
**Problem**: "Removing duplicates by DOI and title" - "DOI" is technical jargon
**Current**: "Removing duplicates by DOI and title"
**Recommended**: "Removing duplicate papers"
**Reason**: Users don't need to know the technical method

### 🐛 ISSUE #13: "(citations, impact)" - Redundant Parenthetical
**Severity**: LOW
**Location**: Stage 2 filtering step
**Problem**: "Ranking by quality metrics (citations, impact)" - redundant explanation
**Current**: "Ranking by quality metrics (citations, impact)"
**Recommended**: "Ranking by quality metrics"
**Reason**: Users trust the process, don't need specifics in progress bar

---

## Terminology Consistency Audit

### ✅ GOOD - Consistent Terms:
- "papers" (not "research papers" or "academic papers")
- "collected" (used consistently)
- "selected" (used consistently)
- "top 350-500 papers" (now standardized)

### ⚠️ NEEDS FIXING - Inconsistent Terms:

1. **"Academic databases" vs "Research databases"**
   - ProgressIndicator: "academic databases"
   - SearchProcessIndicator: "research databases"
   - **Fix**: Use "academic databases" everywhere

2. **"From all sources" vs "From academic databases"**
   - Stage 1: "from all sources"
   - Subtitle: "from academic databases"
   - Stats card: "from all sources"
   - **Decision**: Both are OK in different contexts, but could be clearer

---

## Grammar & Professionalism Check

### ✅ GOOD:
- All sentences properly capitalized
- No typos found
- Professional tone maintained
- Clear and concise wording

### ⚠️ COULD IMPROVE:
- Some messages could be shorter
- Some technical details could be simplified

---

## Summary: Round 2 Issues Found

### New Issues: 5
- Issue #9: Loading message consistency
- Issue #10: "Research databases" vs "Academic databases"  
- Issue #11: Redundant "from academic databases" in subtitle
- Issue #12: Technical jargon "DOI" in progress message
- Issue #13: Redundant parenthetical in quality metrics

### Priority Fixes:
1. **High**: Issue #10 - Standardize database terminology
2. **Medium**: Issue #11 - Remove redundancy in subtitle
3. **Low**: Issue #12, #13 - Simplify technical language

---

## Fixes to Implement Now:

1. Change "research databases" → "academic databases" everywhere
2. Remove "from academic databases" from subtitle
3. Simplify "Removing duplicates by DOI and title" → "Removing duplicate papers"
4. Simplify "Ranking by quality metrics (citations, impact)" → "Ranking by quality metrics"

---

Status: ✅ Round 2 Complete - Implementing fixes, then moving to Round 3

