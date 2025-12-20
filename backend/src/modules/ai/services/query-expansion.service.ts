/**
 * Query Expansion Service
 *
 * Phase 9 Day 21 Task 4 Implementation
 *
 * Enterprise-grade AI-powered search query expansion using GPT-4.
 * Transforms vague queries into comprehensive academic search terms.
 *
 * Features:
 * - Query expansion with academic terminology
 * - Vagueness detection
 * - Related term suggestions
 * - Domain-specific enhancement
 * - Result caching
 */

import { Injectable, Logger } from '@nestjs/common';
import { UnifiedAIService } from './unified-ai.service';

// ============================================================================
// Phase 10.185 Week 3: System Prompts for Query Expansion
// ============================================================================

const QUERY_EXPANSION_SYSTEM_PROMPT = `You are an expert academic research query optimization specialist.

Your role is to:
1. Detect and correct spelling errors in research queries
2. Expand vague queries into specific research angles
3. Suggest related academic terminology and methodological keywords
4. Transform broad topics into actionable research queries

Guidelines:
- Always prioritize academic and scholarly terminology
- Include research methodology keywords when relevant
- Consider interdisciplinary connections
- Maintain query precision while expanding coverage
- Flag overly broad queries that need narrowing

Output must be valid JSON as specified in the prompt.`;

export interface ExpandedQuery {
  expanded: string;
  suggestions: string[];
  isTooVague: boolean;
  narrowingQuestions: string[];
  confidence: number; // 0-1
  relatedTerms: string[];
  correctedQuery?: string; // NEW: Spell-corrected version of original query
  hadSpellingErrors?: boolean; // NEW: Flag if corrections were made
}

@Injectable()
export class QueryExpansionService {
  private readonly logger = new Logger(QueryExpansionService.name);
  private cache: Map<string, { result: ExpandedQuery; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

  constructor(private readonly unifiedAIService: UnifiedAIService) {}

  /**
   * Expand search query with AI
   */
  async expandQuery(
    query: string,
    domain?: 'climate' | 'health' | 'education' | 'general',
  ): Promise<ExpandedQuery> {
    const cacheKey = `${query}:${domain || 'general'}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Cache hit for query: ${query}`);
      return cached.result;
    }

    const prompt = this.buildExpansionPrompt(query, domain);

    try {
      // Phase 10.195: Use jsonMode to guarantee valid JSON response
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.4,
        maxTokens: 400,
        cache: true,
        systemPrompt: QUERY_EXPANSION_SYSTEM_PROMPT,
        jsonMode: true, // Force JSON output format
      });

      const result = this.parseExpansionResponse(response.content);

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to expand query "${query}": ${error.message}`);
      // Return original query on error
      return {
        expanded: query,
        suggestions: [],
        isTooVague: false,
        narrowingQuestions: [],
        confidence: 0.5,
        relatedTerms: [],
      };
    }
  }

  /**
   * Suggest related academic terms
   */
  async suggestTerms(
    query: string,
    field?: string,
  ): Promise<{
    terms: string[];
    confidence: number[];
  }> {
    const prompt = `Research query: "${query}"
${field ? `Field: ${field}` : ''}

Suggest 8-10 related academic terms, keywords, or synonyms that would improve search results.
Focus on:
- Academic/scholarly terminology
- Common research methods in this field
- Related theoretical frameworks
- Alternative phrasings

Return JSON: {"terms": ["term1", "term2", ...], "confidence": [0.9, 0.8, ...]}`;

    try {
      // Phase 10.195: Use jsonMode for guaranteed JSON output
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.3,
        maxTokens: 300,
        cache: true,
        systemPrompt: QUERY_EXPANSION_SYSTEM_PROMPT,
        jsonMode: true,
      });

      const parsed = JSON.parse(response.content);
      return {
        terms: parsed.terms || [],
        confidence: parsed.confidence || (parsed.terms || []).map(() => 0.7),
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to suggest terms for "${query}": ${error.message}`,
      );
      return { terms: [], confidence: [] };
    }
  }

  /**
   * Narrow overly broad query
   */
  async narrowQuery(query: string): Promise<{
    narrowed: string[];
    reasoning: string;
  }> {
    const prompt = `Query: "${query}"

This query seems too broad for effective research. Suggest 3 more specific research angles that would yield better results.

For each angle:
- Make it research-focused
- Include methodology keywords
- Keep it concise (8-15 words)

Return JSON: {"narrowed": ["angle1", "angle2", "angle3"], "reasoning": "why narrowing helps"}`;

    try {
      // Phase 10.195: Use jsonMode for guaranteed JSON output
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.5,
        maxTokens: 300,
        cache: true,
        systemPrompt: QUERY_EXPANSION_SYSTEM_PROMPT,
        jsonMode: true,
      });

      const parsed = JSON.parse(response.content);
      return {
        narrowed: parsed.narrowed || [],
        reasoning: parsed.reasoning || '',
      };
    } catch (error: any) {
      this.logger.error(`Failed to narrow query "${query}": ${error.message}`);
      return { narrowed: [], reasoning: '' };
    }
  }

  /**
   * Build query expansion prompt
   */
  private buildExpansionPrompt(query: string, domain?: string): string {
    const domainContext = domain
      ? `Research domain: ${domain}`
      : 'General academic research';

    return `${domainContext}
User query: "${query}"
Context: Academic research literature search
Goal: Find research videos, papers, and methodology discussions

**CRITICAL: First check for spelling errors in the query.**
Common research term misspellings to check:
- "litterature" → "literature"
- "reserach" → "research"
- "methology" → "methodology"
- "anaylsis" → "analysis"
- "qualitatve" → "qualitative"
- "quantitave" → "quantitative"
- "vqmethod" → "Q-methodology"
- "qmethod" → "Q-methodology"
- And any other obvious typos

Analyze this query:
1. **FIRST: Check for spelling errors and correct them**
   - If spelling errors found, set "hadSpellingErrors": true and "correctedQuery": "<corrected version>"
   - If no errors, set "hadSpellingErrors": false and omit "correctedQuery"

2. If too broad (single word like "climate", "health"):
   - Flag as vague
   - Suggest 3 specific research angles
   - Expand with methodology keywords

3. If already specific:
   - Expand with related academic terms
   - Add common research methods
   - Include theoretical frameworks

Examples:
- "climat change" → corrected to "climate change impacts on agriculture and food security research methods"
- "health care reserach" → corrected to "healthcare research methods OR health services research OR clinical research"
- "litterature review" → corrected to "literature review methodology OR systematic review OR meta-analysis"

Return JSON:
{
  "expanded": "<expanded query with corrections>",
  "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "isTooVague": <true|false>,
  "narrowingQuestions": ["<question1>", ...],
  "confidence": <0-1>,
  "relatedTerms": ["<term1>", "<term2>", ...],
  "correctedQuery": "<corrected query if spelling errors found, otherwise omit>",
  "hadSpellingErrors": <true|false>
}`;
  }

  /**
   * Convert parsed JSON to ExpandedQuery with defaults (DRY helper)
   * Phase 10.195: With jsonMode, response is guaranteed to be valid JSON
   */
  private toExpandedQuery(parsed: Record<string, unknown>): ExpandedQuery {
    return {
      expanded: (parsed.expanded as string) || '',
      suggestions: (parsed.suggestions as string[]) || [],
      isTooVague: (parsed.isTooVague as boolean) || false,
      narrowingQuestions: (parsed.narrowingQuestions as string[]) || [],
      confidence: (parsed.confidence as number) || 0.7,
      relatedTerms: (parsed.relatedTerms as string[]) || [],
      correctedQuery: (parsed.correctedQuery as string) || undefined,
      hadSpellingErrors: (parsed.hadSpellingErrors as boolean) || false,
    };
  }

  private parseExpansionResponse(content: string): ExpandedQuery {
    // Primary: Direct JSON parse (jsonMode should guarantee valid JSON)
    try {
      return this.toExpandedQuery(JSON.parse(content));
    } catch (primaryError: any) {
      // Fallback: Extract JSON from prose response (non-JSON mode providers)
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return this.toExpandedQuery(JSON.parse(jsonMatch[0]));
        }
      } catch {
        // Ignore fallback errors
      }

      this.logger.warn(`Failed to parse expansion response: ${primaryError.message}`);
      return this.toExpandedQuery({}); // Returns defaults
    }
  }

  /**
   * Clear expired cache
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}
