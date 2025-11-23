/**
 * BM25 Relevance Scoring Utility
 * 
 * Phase 10.7 Day 20 v4.0: Science-Backed Relevance Ranking
 * 
 * **Academic Foundation**:
 * - BM25 Algorithm (Robertson & Walker, 1994): Best Match 25 - gold standard for information retrieval
 * - PubMed Best Match (NCBI, 2020): Uses BM25 variant for ranking 35M+ biomedical papers
 * - Elasticsearch/Lucene (2010+): BM25 as default relevance algorithm
 * - Google Scholar (2004): TF-IDF with PageRank for academic search
 * 
 * **Why BM25?**
 * - Used by PubMed, Elasticsearch, Lucene, Solr
 * - 30+ years of research validation
 * - Handles term frequency saturation (diminishing returns)
 * - Length normalization (fair for short/long papers)
 * - Proven superior to TF-IDF in academic search
 * 
 * **Our Enhancements**:
 * - Position weighting (title 4x > keywords 3x > abstract 2x)
 * - Phrase matching bonus (exact phrases ranked higher)
 * - Term coverage penalty (<40% terms matched = penalized)
 * - Field-specific tuning (academic papers vs general documents)
 * 
 * **References**:
 * 1. Robertson, S.E., & Walker, S. (1994). "Some simple effective approximations to the 2-Poisson model for probabilistic weighted retrieval"
 * 2. Manning, C.D., Raghavan, P., & Schütze, H. (2008). "Introduction to Information Retrieval"
 * 3. NCBI (2020). "PubMed Best Match Algorithm" - https://pubmed.ncbi.nlm.nih.gov/help/#best-match-sort
 * 4. Trotman, A., et al. (2014). "Improvements to BM25 and Language Models Examined"
 */

/**
 * BM25 Parameters (tuned for academic papers)
 * 
 * Standard BM25: k1=1.2, b=0.75
 * Academic papers: k1=1.5, b=0.6 (less length penalty for comprehensive papers)
 */
const BM25_PARAMS = {
  k1: 1.5, // Term frequency saturation parameter (higher = more weight to TF)
  b: 0.6,  // Length normalization (lower = less penalty for long papers)
  avgDocLength: 250, // Average abstract length in words (academic papers)
} as const;

/**
 * Position weights for different paper sections
 * Based on information retrieval research and PubMed's approach
 */
const POSITION_WEIGHTS = {
  title: 4.0,      // Title is most important (4x weight)
  keywords: 3.0,   // Keywords are curated terms (3x weight)
  abstract: 2.0,   // Abstract is summary (2x weight)
  authors: 1.0,    // Authors are metadata (1x weight)
  venue: 0.5,      // Venue is context (0.5x weight)
} as const;

/**
 * Bonus scores for special matching patterns
 */
const BONUS_SCORES = {
  exactPhraseInTitle: 100,    // Exact query phrase in title (very high relevance)
  exactPhraseInAbstract: 40,  // Exact query phrase in abstract
  titleStartsWith: 20,        // Query term at start of title
  firstQueryTerm: 10,         // First term in query (usually most important)
  allTermsMatched: 30,        // All query terms found (comprehensive match)
} as const;

/**
 * Calculate BM25 score for a single term in a document field
 * 
 * Formula: BM25(term) = IDF(term) * (f(term) * (k1 + 1)) / (f(term) + k1 * (1 - b + b * |D|/avgdl))
 * 
 * @param termFreq - Number of times term appears in field
 * @param fieldLength - Length of field in words
 * @param avgFieldLength - Average field length across all documents
 * @param k1 - Term frequency saturation parameter
 * @param b - Length normalization parameter
 * @returns BM25 score for this term
 */
function calculateBM25TermScore(
  termFreq: number,
  fieldLength: number,
  avgFieldLength: number,
  k1: number = BM25_PARAMS.k1,
  b: number = BM25_PARAMS.b,
): number {
  if (termFreq === 0) return 0;

  // BM25 formula
  const numerator = termFreq * (k1 + 1);
  const denominator = termFreq + k1 * (1 - b + b * (fieldLength / avgFieldLength));

  return numerator / denominator;
}

/**
 * Escape special regex characters in a string
 * Phase 10.942: Security fix for ReDoS vulnerability
 *
 * @param str - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Count term frequency in text (case-insensitive)
 *
 * @param text - Text to search in
 * @param term - Term to search for
 * @returns Number of occurrences
 */
function countTermFrequency(text: string, term: string): number {
  if (!text || !term) return 0;

  // Phase 10.942: Escape regex special characters to prevent ReDoS
  const escapedTerm = escapeRegex(term);
  const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Calculate word count for a text field
 *
 * @param text - Text to count words in
 * @returns Number of words
 */
function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Calculate BM25 score for a single text field
 * Phase 10.942: Extracted helper for enterprise compliance (<100 line functions)
 *
 * @param fieldText - Text content of the field
 * @param queryTerms - Array of query terms to match
 * @param positionWeight - Weight multiplier for this field position
 * @param avgFieldLength - Average length of this field type
 * @returns Score contribution from this field
 */
function calculateFieldBM25Score(
  fieldText: string | null | undefined,
  queryTerms: string[],
  positionWeight: number,
  avgFieldLength: number,
): number {
  if (!fieldText || fieldText.length === 0) return 0;

  const fieldWords = countWords(fieldText);
  let fieldScore = 0;

  queryTerms.forEach((term) => {
    const termFreq = countTermFrequency(fieldText, term);
    if (termFreq > 0) {
      const bm25Score = calculateBM25TermScore(termFreq, fieldWords, avgFieldLength);
      fieldScore += bm25Score * positionWeight * 10; // Scale to 0-100 range
    }
  });

  return fieldScore;
}

/**
 * Calculate exact phrase matching bonuses
 * Phase 10.942: Extracted helper for enterprise compliance
 *
 * @param titleLower - Lowercase title
 * @param abstractLower - Lowercase abstract
 * @param queryLower - Lowercase query phrase
 * @returns Object with bonus score and whether all terms matched
 */
function calculateExactPhraseBonus(
  titleLower: string,
  abstractLower: string,
  queryLower: string,
): { bonus: number; allTermsMatched: boolean } {
  let bonus = 0;
  let allTermsMatched = false;

  if (titleLower.includes(queryLower)) {
    bonus += BONUS_SCORES.exactPhraseInTitle;
    allTermsMatched = true;
  }

  if (abstractLower.includes(queryLower)) {
    bonus += BONUS_SCORES.exactPhraseInAbstract;
  }

  return { bonus, allTermsMatched };
}

/**
 * Apply term coverage multiplier to score
 * Phase 10.942: Extracted helper for enterprise compliance
 *
 * @param score - Current score
 * @param matchedTermsCount - Number of terms matched
 * @param totalTerms - Total query terms
 * @returns Adjusted score with coverage multiplier applied
 */
function applyTermCoverageMultiplier(
  score: number,
  matchedTermsCount: number,
  totalTerms: number,
): number {
  const termMatchRatio = matchedTermsCount / totalTerms;

  if (termMatchRatio < 0.4) {
    return score * 0.5; // Penalty: cut in half
  }

  if (termMatchRatio >= 0.7) {
    let adjustedScore = score * 1.3; // 30% boost
    if (termMatchRatio === 1.0) {
      adjustedScore += BONUS_SCORES.allTermsMatched;
    }
    return adjustedScore;
  }

  return score; // No adjustment
}

/**
 * Calculate BM25-based relevance score for a paper
 *
 * Phase 10.942: Refactored for enterprise compliance (<100 lines)
 *
 * **Algorithm**: BM25 with position weighting and phrase matching
 * **Components**: Title (4x), Keywords (3x), Abstract (2x), Authors (1x), Venue (0.5x)
 * **Bonuses**: Exact phrase +100/+40, title start +20, first term +10, all matched +30
 * **Coverage**: <40% = 0.5x penalty, ≥70% = 1.3x boost
 *
 * @param paper - Paper object with title, abstract, keywords, etc.
 * @param query - Search query string
 * @returns Relevance score 0-200+ (higher = more relevant)
 */
export function calculateBM25RelevanceScore(
  paper: {
    title?: string | null;
    abstract?: string | null;
    keywords?: string[] | null;
    authors?: string[] | null;
    venue?: string | null;
  },
  query: string,
): number {
  if (!query || query.trim().length === 0) return 0;

  const queryLower = query.toLowerCase().trim();
  const queryTerms = queryLower.split(/\s+/).filter((term) => term.length > 2);
  if (queryTerms.length === 0) return 0;

  const titleLower = (paper.title || '').toLowerCase();
  const abstractLower = (paper.abstract || '').toLowerCase();

  // Phase 10.942: Use extracted helpers for enterprise compliance
  const phraseBonus = calculateExactPhraseBonus(titleLower, abstractLower, queryLower);
  let totalScore = phraseBonus.bonus;
  let matchedTermsCount = phraseBonus.allTermsMatched ? queryTerms.length : 0;

  // Phase 10.942: Cache word count outside loop for performance
  const titleWordCount = countWords(paper.title || '');

  // Title matching with special bonuses (4x weight)
  // Phase 10.942: Only count terms if phrase wasn't already matched (prevent double-counting)
  queryTerms.forEach((term, index) => {
    const termFreq = countTermFrequency(paper.title || '', term);
    if (termFreq > 0) {
      // Only increment if we haven't already counted all terms via phrase match
      if (!phraseBonus.allTermsMatched) {
        matchedTermsCount++;
      }
      const bm25Score = calculateBM25TermScore(termFreq, titleWordCount, 20);
      totalScore += bm25Score * POSITION_WEIGHTS.title * 10;
      if (titleLower.startsWith(term)) totalScore += BONUS_SCORES.titleStartsWith;
      if (index === 0) totalScore += BONUS_SCORES.firstQueryTerm;
    }
  });

  // Keywords matching (3x weight)
  const keywordsText = paper.keywords?.join(' ') || '';
  totalScore += calculateFieldBM25Score(keywordsText, queryTerms, POSITION_WEIGHTS.keywords, 15);

  // Abstract matching (2x weight)
  totalScore += calculateFieldBM25Score(paper.abstract, queryTerms, POSITION_WEIGHTS.abstract, BM25_PARAMS.avgDocLength);

  // Authors matching (1x weight)
  const authorsText = paper.authors?.join(' ') || '';
  totalScore += calculateFieldBM25Score(authorsText, queryTerms, POSITION_WEIGHTS.authors, 10);

  // Venue matching (0.5x weight)
  totalScore += calculateFieldBM25Score(paper.venue, queryTerms, POSITION_WEIGHTS.venue, 8);

  // Apply term coverage multiplier
  totalScore = applyTermCoverageMultiplier(totalScore, matchedTermsCount, queryTerms.length);

  return Math.round(totalScore);
}

/**
 * Calculate IDF (Inverse Document Frequency) for a term
 * 
 * **Formula**: IDF(term) = log((N - n + 0.5) / (n + 0.5))
 * 
 * Where:
 * - N = total number of documents in collection
 * - n = number of documents containing term
 * 
 * **Note**: This is a simplified version. In production, you would:
 * 1. Maintain a term frequency index (Elasticsearch/Solr)
 * 2. Calculate IDF from actual document collection
 * 3. Update IDF periodically as collection grows
 * 
 * For now, we use position weighting as a proxy for IDF.
 * 
 * @param term - Search term
 * @param totalDocs - Total documents in collection
 * @param docsWithTerm - Documents containing this term
 * @returns IDF score
 */
export function calculateIDF(
  _term: string, // Kept for API consistency, IDF is term-independent
  totalDocs: number,
  docsWithTerm: number,
): number {
  if (docsWithTerm === 0) return 0;
  if (docsWithTerm >= totalDocs) return 0;

  // BM25 IDF formula
  const idf = Math.log((totalDocs - docsWithTerm + 0.5) / (docsWithTerm + 0.5));
  
  return Math.max(0, idf); // IDF should be non-negative
}

/**
 * Normalize relevance scores to 0-100 range
 * 
 * Uses min-max normalization across all papers in result set
 * 
 * @param papers - Array of papers with relevance scores
 * @returns Papers with normalized scores (0-100)
 */
export function normalizeRelevanceScores<T extends { relevanceScore?: number }>(
  papers: T[],
): T[] {
  if (papers.length === 0) return papers;

  const scores = papers.map(p => p.relevanceScore || 0);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // If all scores are the same, return as-is
  if (maxScore === minScore) return papers;

  // Min-max normalization to 0-100
  return papers.map(paper => ({
    ...paper,
    relevanceScore: Math.round(
      ((paper.relevanceScore || 0) - minScore) / (maxScore - minScore) * 100
    ),
  }));
}

/**
 * Get relevance tier label for display
 * 
 * @param score - Relevance score (0-100)
 * @returns Tier label
 */
export function getRelevanceTier(score: number): string {
  if (score >= 90) return 'Highly Relevant';
  if (score >= 70) return 'Very Relevant';
  if (score >= 50) return 'Relevant';
  if (score >= 30) return 'Somewhat Relevant';
  return 'Low Relevance';
}

/**
 * Get relevance tier color for UI
 * 
 * @param score - Relevance score (0-100)
 * @returns Tailwind color class
 */
export function getRelevanceTierColor(score: number): string {
  if (score >= 90) return 'emerald';
  if (score >= 70) return 'green';
  if (score >= 50) return 'blue';
  if (score >= 30) return 'amber';
  return 'gray';
}

/**
 * Explain relevance score (for transparency)
 * 
 * Generates human-readable explanation of why a paper scored high/low
 * 
 * @param paper - Paper object
 * @param query - Search query
 * @param score - Calculated relevance score
 * @returns Explanation object
 */
export function explainRelevanceScore(
  paper: {
    title?: string | null;
    abstract?: string | null;
    keywords?: string[] | null;
  },
  query: string,
  score: number,
): {
  tier: string;
  reasons: string[];
  matchedTerms: string[];
  coverage: number;
} {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);
  
  const titleLower = (paper.title || '').toLowerCase();
  const abstractLower = (paper.abstract || '').toLowerCase();
  const keywordsLower = (paper.keywords || []).join(' ').toLowerCase();

  const reasons: string[] = [];
  const matchedTerms: string[] = [];

  // Check exact phrase
  if (titleLower.includes(queryLower)) {
    reasons.push('Exact query phrase found in title');
  }

  // Check term matches
  queryTerms.forEach(term => {
    if (titleLower.includes(term)) {
      matchedTerms.push(term);
      reasons.push(`"${term}" found in title`);
    } else if (keywordsLower.includes(term)) {
      matchedTerms.push(term);
      reasons.push(`"${term}" found in keywords`);
    } else if (abstractLower.includes(term)) {
      matchedTerms.push(term);
      reasons.push(`"${term}" found in abstract`);
    }
  });

  const coverage = matchedTerms.length / queryTerms.length;

  return {
    tier: getRelevanceTier(score),
    reasons: reasons.slice(0, 5), // Top 5 reasons
    matchedTerms: [...new Set(matchedTerms)], // Unique terms
    coverage: Math.round(coverage * 100),
  };
}
