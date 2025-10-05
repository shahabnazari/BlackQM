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
import { OpenAIService } from './openai.service';

export interface ExpandedQuery {
  expanded: string;
  suggestions: string[];
  isTooVague: boolean;
  narrowingQuestions: string[];
  confidence: number; // 0-1
  relatedTerms: string[];
}

@Injectable()
export class QueryExpansionService {
  private readonly logger = new Logger(QueryExpansionService.name);
  private cache: Map<string, { result: ExpandedQuery; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

  constructor(private readonly openaiService: OpenAIService) {}

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
      const response = await this.openaiService.generateCompletion(prompt, {
        model: 'fast', // GPT-3.5 is sufficient for this
        temperature: 0.4,
        maxTokens: 400,
        cache: false,
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
  async suggestTerms(query: string, field?: string): Promise<{
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
      const response = await this.openaiService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.3,
        maxTokens: 300,
        cache: true,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { terms: [], confidence: [] };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        terms: parsed.terms || [],
        confidence: parsed.confidence || parsed.terms.map(() => 0.7),
      };
    } catch (error: any) {
      this.logger.error(`Failed to suggest terms for "${query}": ${error.message}`);
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
      const response = await this.openaiService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.5,
        maxTokens: 300,
        cache: true,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { narrowed: [], reasoning: '' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
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

Analyze this query:
1. If too broad (single word like "climate", "health"):
   - Flag as vague
   - Suggest 3 specific research angles
   - Expand with methodology keywords

2. If already specific:
   - Expand with related academic terms
   - Add common research methods
   - Include theoretical frameworks

Examples:
- "climate" → "climate change impacts on agriculture and food security research methods"
- "health" → "public health research methods OR mental health interventions OR healthcare policy"

Return JSON:
{
  "expanded": "<expanded query>",
  "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "isTooVague": <true|false>,
  "narrowingQuestions": ["<question1>", ...],
  "confidence": <0-1>,
  "relatedTerms": ["<term1>", "<term2>", ...]
}`;
  }

  /**
   * Parse AI expansion response
   */
  private parseExpansionResponse(content: string): ExpandedQuery {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        expanded: parsed.expanded || '',
        suggestions: parsed.suggestions || [],
        isTooVague: parsed.isTooVague || false,
        narrowingQuestions: parsed.narrowingQuestions || [],
        confidence: parsed.confidence || 0.7,
        relatedTerms: parsed.relatedTerms || [],
      };
    } catch (error: any) {
      this.logger.warn(`Failed to parse expansion response: ${error.message}`);
      return {
        expanded: '',
        suggestions: [],
        isTooVague: false,
        narrowingQuestions: [],
        confidence: 0.5,
        relatedTerms: [],
      };
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
