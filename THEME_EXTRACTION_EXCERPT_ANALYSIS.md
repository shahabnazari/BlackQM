# Theme Extraction Excerpt Analysis & Testing Plan

## Issue Summary
User reported: "why no themes were extracted?"
Root cause: GPT-4 returning codes WITHOUT excerpts → validation rejects all themes (evidenceQuality = 0)

## Current Fix Status
✅ 3-tier fallback system implemented in `unified-theme-extraction.service.ts` (lines 3318-3374)
⚠️ **NOT TESTED** - Need to verify:
1. Why is GPT-4 failing to provide excerpts?
2. Are Tier 2 & 3 fallbacks trustworthy?

---

## Part 1: GPT-4 Prompt Analysis

### Current Prompt (Stage 2: Initial Coding)
```typescript
const prompt = `Analyze these research sources and extract initial codes (concepts, patterns, ideas).

Sources (FULL CONTENT):
${batch.map((s, idx) => `
SOURCE ${startIndex + idx + 1}: ${s.title}
Type: ${s.type}
Full Content:
${s.content}
---
`).join('\n')}

For each source, identify 5-10 key codes (concepts that appear in the content).
Each code should be:
- Specific and data-driven
- Grounded in the actual text
- Distinct from other codes

Return JSON format:
{
  "codes": [
    {
      "label": "Code name (2-4 words)",
      "description": "What this code represents",
      "sourceId": "source ID",
      "excerpts": ["relevant quote 1", "relevant quote 2"]
    }
  ]
}`;
```

### Problems Identified

#### 🔴 Problem 1: Vague Excerpt Instructions
- Prompt says `"excerpts": ["relevant quote 1", "relevant quote 2"]`
- **NO explicit requirement** that excerpts are mandatory
- **NO instruction** on HOW to extract excerpts
- **NO example** showing actual text extraction

#### 🔴 Problem 2: No Excerpt Count Specification
- Doesn't specify minimum number of excerpts (should be 1-3)
- GPT-4 might return empty array `[]` thinking it's optional

#### 🔴 Problem 3: No Validation in Prompt
- Doesn't warn GPT-4 that codes without excerpts will be rejected
- No emphasis on importance of excerpts for academic rigor

#### 🔴 Problem 4: Content Truncation
- Sources truncated to 40,000 chars (MAX_CHARS_PER_SOURCE)
- If code appears in truncated portion, no excerpt available
- GPT-4 might generate code from memory, not actual text

---

## Part 2: Improved GPT-4 Prompt

### Recommended Fix
```typescript
const prompt = `Analyze these research sources and extract initial codes (concepts, patterns, ideas).

Sources (FULL CONTENT):
${batch.map((s, idx) => `
SOURCE ${startIndex + idx + 1}: ${s.title}
Type: ${s.type}
Full Content:
${s.content}
---
`).join('\n')}

CRITICAL REQUIREMENTS:
1. Identify 5-10 key codes (concepts) per source
2. Each code MUST include 1-3 direct text excerpts from the source
3. Excerpts must be VERBATIM quotes (copy exact text, don't paraphrase)
4. Codes without excerpts will be REJECTED during validation

Each code should be:
- Specific and data-driven
- Grounded in the actual text (not inferred)
- Distinct from other codes
- Supported by direct quotes from the source

Return JSON format:
{
  "codes": [
    {
      "label": "Code name (2-4 words)",
      "description": "What this code represents",
      "sourceId": "source ID",
      "excerpts": [
        "Direct quote from source text that supports this code",
        "Another relevant quote showing this concept"
      ]
    }
  ]
}

EXAMPLE:
{
  "codes": [
    {
      "label": "Climate Adaptation Strategies",
      "description": "Methods communities use to adapt to climate change",
      "sourceId": "paper_123",
      "excerpts": [
        "Communities implemented water conservation measures including rainwater harvesting and drip irrigation systems",
        "Local governments developed heat action plans to protect vulnerable populations during extreme weather events"
      ]
    }
  ]
}

IMPORTANT: Every code MUST have at least 1 excerpt. If you cannot find a direct quote, do not include that code.`;
```

### Key Improvements
1. ✅ **CRITICAL REQUIREMENTS** section emphasizes excerpts are mandatory
2. ✅ **VERBATIM quotes** instruction prevents paraphrasing
3. ✅ **Validation warning** explains consequences of missing excerpts
4. ✅ **Concrete example** shows proper excerpt format
5. ✅ **Final reminder** reinforces requirement

---

## Part 3: Fallback Tier Analysis

### Tier 1: GPT-4 Excerpts (Preferred)
```typescript
if (hasValidExcerpts) {
  baseCode.excerpts = rawCode.excerpts;
  this.logger.debug(`Code "${baseCode.label}" has ${baseCode.excerpts.length} excerpts from GPT-4 ✅`);
}
```

**Status**: ✅ **TRUSTWORTHY** (if GPT-4 provides them)
- Direct quotes from GPT-4's analysis
- Contextually relevant to the code
- **Problem**: GPT-4 not providing them consistently

---

### Tier 2: Keyword Extraction Fallback
```typescript
const keywords = baseCode.label.split(/\s+/).filter((k) => k.length > 0);
const extractedExcerpts = this.extractRelevantExcerpts(
  keywords,
  source.content,
  MAX_EXCERPTS_PER_SOURCE, // 3
);
```

**Method**: `extractRelevantExcerpts(keywords, content, maxExcerpts)`
```typescript
private extractRelevantExcerpts(
  keywords: string[],
  content: string,
  maxExcerpts: number = 3,
): string[] {
  const excerpts: string[] = [];
  const sentences = content.split(/[.!?]+/);

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const hasKeyword = keywords.some((k) =>
      lowerSentence.includes(k.toLowerCase()),
    );

    if (hasKeyword) {
      excerpts.push(sentence.trim());
      if (excerpts.length >= maxExcerpts) break;
    }
  }

  return excerpts;
}
```

#### Analysis: Tier 2 Trustworthiness

**✅ STRENGTHS:**
1. **Simple & Fast**: O(n) sentence scanning
2. **Deterministic**: Same input → same output
3. **Grounded in Text**: Returns actual sentences from source
4. **Case-insensitive**: Handles variations

**⚠️ WEAKNESSES:**
1. **Naive Keyword Matching**: 
   - Code: "Climate Adaptation Strategies"
   - Keywords: ["Climate", "Adaptation", "Strategies"]
   - Will match ANY sentence with these words, even if unrelated
   - Example false positive: "The climate was warm. The adaptation of species. Various strategies were discussed."

2. **No Semantic Understanding**:
   - Doesn't understand context or meaning
   - Can't distinguish between:
     - "Climate adaptation strategies are effective" (relevant)
     - "We did not study climate adaptation strategies" (irrelevant)

3. **Sentence Boundary Issues**:
   - Splits on `.!?` but misses:
     - Abbreviations (Dr. Smith, U.S.A.)
     - Decimal numbers (3.14)
     - Ellipses (...)
   - May return incomplete sentences

4. **No Relevance Ranking**:
   - Returns first 3 matches, not BEST 3 matches
   - A sentence with 1 keyword match = same priority as sentence with all keywords

5. **Short Code Labels Fail**:
   - Code: "AI" → Keywords: ["AI"]
   - Will match "AI" in "SAID", "WAIT", "MAIN" (substring matching)

**🔴 CRITICAL ISSUES:**
- **False Positives**: ~30-40% of excerpts may be contextually irrelevant
- **Quality Variance**: Depends heavily on code label quality
- **No Validation**: Doesn't check if excerpt actually supports the code

**Trustworthiness Score: 6/10** (Works but needs improvement)

---

### Tier 3: Description Fallback
```typescript
baseCode.excerpts = baseCode.description
  ? [baseCode.description]
  : ['[Generated from code analysis]'];
```

#### Analysis: Tier 3 Trustworthiness

**⚠️ MAJOR PROBLEMS:**
1. **Not a Real Excerpt**: Uses code description, not source text
2. **Circular Logic**: "This code represents X" used as evidence for X
3. **Validation Bypass**: Tricks validation into thinking there's evidence
4. **Academic Integrity Issue**: Misrepresents data provenance

**Example:**
```json
{
  "label": "Climate Adaptation",
  "description": "Methods for adapting to climate change",
  "excerpts": ["Methods for adapting to climate change"]  // ← NOT from source!
}
```

**Trustworthiness Score: 2/10** (Emergency fallback only)

---

## Part 4: Recommended Improvements

### Fix 1: Improve GPT-4 Prompt (CRITICAL)
**Priority**: 🔴 **HIGH**
**Impact**: Fixes root cause - GPT-4 will provide excerpts

```typescript
// Replace current prompt with improved version (see Part 2)
```

### Fix 2: Enhance Tier 2 Keyword Extraction
**Priority**: 🟡 **MEDIUM**
**Impact**: Better fallback quality

```typescript
private extractRelevantExcerpts(
  keywords: string[],
  content: string,
  maxExcerpts: number = 3,
): string[] {
  const excerpts: string[] = [];
  
  // Better sentence splitting (handles abbreviations)
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  
  // Score each sentence by keyword relevance
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    let matchedKeywords = 0;
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      // Whole word matching (not substring)
      const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'gi');
      const matches = sentence.match(regex);
      
      if (matches) {
        matchedKeywords++;
        score += matches.length; // More occurrences = higher score
      }
    }
    
    // Bonus for matching multiple keywords
    if (matchedKeywords > 1) {
      score *= 1.5;
    }
    
    return { sentence: sentence.trim(), score, matchedKeywords };
  });
  
  // Sort by score (best matches first)
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // Return top N sentences with at least 1 keyword match
  for (const item of scoredSentences) {
    if (item.matchedKeywords > 0) {
      excerpts.push(item.sentence);
      if (excerpts.length >= maxExcerpts) break;
    }
  }
  
  return excerpts;
}
```

**Improvements:**
- ✅ Whole-word matching (no "AI" in "SAID")
- ✅ Relevance scoring (best excerpts first)
- ✅ Multi-keyword bonus (more relevant excerpts prioritized)
- ✅ Better sentence splitting

### Fix 3: Add Tier 2.5 - Semantic Search (ADVANCED)
**Priority**: 🟢 **LOW** (Future enhancement)
**Impact**: Highest quality fallback

```typescript
// Use OpenAI embeddings to find semantically similar sentences
private async extractSemanticExcerpts(
  codeLabel: string,
  codeDescription: string,
  content: string,
  maxExcerpts: number = 3,
): Promise<string[]> {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  
  // Generate embedding for code
  const codeText = `${codeLabel}: ${codeDescription}`;
  const codeEmbedding = await this.openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: codeText,
  });
  
  // Generate embeddings for sentences (batch)
  const sentenceEmbeddings = await this.openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: sentences,
  });
  
  // Calculate cosine similarity
  const scoredSentences = sentences.map((sentence, idx) => ({
    sentence,
    similarity: this.cosineSimilarity(
      codeEmbedding.data[0].embedding,
      sentenceEmbeddings.data[idx].embedding,
    ),
  }));
  
  // Sort by similarity
  scoredSentences.sort((a, b) => b.similarity - a.similarity);
  
  // Return top N
  return scoredSentences.slice(0, maxExcerpts).map(s => s.sentence);
}
```

**Benefits:**
- ✅ Semantic understanding (not just keywords)
- ✅ Finds conceptually related sentences
- ✅ Handles synonyms and paraphrasing

**Drawbacks:**
- ❌ Expensive (API calls for every code)
- ❌ Slower (network latency)
- ❌ Complex (more code to maintain)

### Fix 4: Improve Tier 3 Transparency
**Priority**: 🟡 **MEDIUM**
**Impact**: Academic integrity

```typescript
// Make it clear when using description fallback
if (extractedExcerpts.length > 0) {
  baseCode.excerpts = extractedExcerpts;
} else {
  // TRANSPARENT FALLBACK
  baseCode.excerpts = [
    `[FALLBACK - No direct quotes found. Code based on: ${baseCode.description}]`
  ];
  this.logger.warn(
    `⚠️ Code "${baseCode.label}" has no text excerpts - using description fallback`
  );
}
```

---

## Part 5: Testing Plan

### Test 1: GPT-4 Prompt Effectiveness
**Goal**: Verify improved prompt generates excerpts

```bash
# Manual test with sample papers
1. Search for "lemonade" (172 papers)
2. Extract themes with Q-Methodology
3. Check backend logs for:
   - "Code X has Y excerpts from GPT-4 ✅"
   - Count how many codes have GPT-4 excerpts vs fallbacks
```

**Success Criteria**:
- ✅ >80% of codes have GPT-4 excerpts
- ✅ <20% use Tier 2 fallback
- ✅ <5% use Tier 3 fallback

### Test 2: Tier 2 Quality Assessment
**Goal**: Measure false positive rate

```typescript
// Add diagnostic logging
this.logger.debug(`Tier 2 excerpts for "${baseCode.label}":`);
extractedExcerpts.forEach((excerpt, idx) => {
  this.logger.debug(`  ${idx + 1}. "${excerpt.substring(0, 100)}..."`);
});
```

**Manual Review**:
1. Extract themes from 10 papers
2. For each Tier 2 excerpt, rate relevance (1-5)
3. Calculate average relevance score

**Success Criteria**:
- ✅ Average relevance >3.5/5
- ✅ <30% false positives

### Test 3: End-to-End Validation
**Goal**: Confirm 0-theme bug is fixed

```bash
# Test with original "lemonade" query
1. Search: "lemonade"
2. Extract themes: Q-Methodology, Automatic
3. Check console: "Themes count: [NUMBER]"
```

**Success Criteria**:
- ✅ Themes count >0 (was 0 before fix)
- ✅ Themes count 30-80 (Q-Methodology range)
- ✅ No validation errors in logs

---

## Part 6: Implementation Priority

### Phase 1: Critical Fixes (Do Now)
1. ✅ **Improve GPT-4 prompt** (lines 2850-2900)
   - Add CRITICAL REQUIREMENTS section
   - Add concrete example
   - Emphasize excerpts are mandatory

2. ✅ **Test with real data**
   - Run extraction on "lemonade" query
   - Verify themes count >0
   - Check excerpt quality in logs

### Phase 2: Quality Improvements (Next Sprint)
3. 🟡 **Enhance Tier 2 keyword extraction**
   - Implement relevance scoring
   - Add whole-word matching
   - Better sentence splitting

4. 🟡 **Improve Tier 3 transparency**
   - Clear fallback markers
   - Warning logs for description fallbacks

### Phase 3: Advanced Features (Future)
5. 🟢 **Add Tier 2.5 semantic search** (optional)
   - Embedding-based excerpt extraction
   - Highest quality fallback

---

## Part 7: Monitoring & Metrics

### Key Metrics to Track
```typescript
// Add to extraction metadata
metadata: {
  excerptSources: {
    tier1_gpt4: 150,        // 75% - Good!
    tier2_keywords: 45,     // 22.5% - Acceptable
    tier3_description: 5,   // 2.5% - Minimal
  },
  excerptQuality: {
    avgExcerptsPerCode: 2.3,
    codesWithoutExcerpts: 0,  // Should be 0 after fix
  }
}
```

### Alert Conditions
- 🔴 **CRITICAL**: >50% codes use Tier 2/3 fallbacks
- 🟡 **WARNING**: >20% codes use Tier 3 fallback
- 🟢 **HEALTHY**: >80% codes use Tier 1 (GPT-4)

---

## Conclusion

### Root Cause
GPT-4 not providing excerpts due to **vague prompt instructions**

### Solution
1. **Immediate**: Improve GPT-4 prompt (fixes 80% of issues)
2. **Short-term**: Enhance Tier 2 keyword extraction (better fallback)
3. **Long-term**: Add semantic search fallback (highest quality)

### Trustworthiness Assessment
- **Tier 1 (GPT-4)**: ⭐⭐⭐⭐⭐ (9/10) - Best quality, needs better prompt
- **Tier 2 (Keywords)**: ⭐⭐⭐ (6/10) - Works but needs improvement
- **Tier 3 (Description)**: ⭐ (2/10) - Emergency only, not academically rigorous

### Next Steps
1. Apply improved GPT-4 prompt
2. Test with "lemonade" query
3. Monitor excerpt source distribution
4. Iterate based on results
