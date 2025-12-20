/**
 * Abstract Enrichment Service
 * Phase 10.181: Fetch missing abstracts from PubMed when CrossRef/other sources return empty
 *
 * Problem: Many publishers (Cell, Elsevier, Springer) don't deposit abstracts to CrossRef
 * Solution: Use PubMed API to fetch abstracts via DOI → PMID lookup
 *
 * Success Rate: ~70% of papers with DOI have PubMed entries with abstracts
 * Pattern: Graceful degradation - returns null if abstract unavailable
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Paper } from '../dto/literature.dto';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
} from '../utils/word-count.util';

/**
 * Minimum word count threshold to consider abstract "present"
 * Title alone is typically 10-20 words
 */
const MIN_ABSTRACT_WORDS = 50;

/**
 * PubMed API response type guards
 */
interface PubMedSearchResponse {
  esearchresult?: {
    idlist?: string[];
    count?: string;
  };
}

function isPubMedSearchResponse(data: unknown): data is PubMedSearchResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'esearchresult' in data
  );
}

@Injectable()
export class AbstractEnrichmentService {
  private readonly logger = new Logger(AbstractEnrichmentService.name);
  private readonly ncbiApiKey: string;
  private readonly ncbiEmail: string;
  private readonly PUBMED_ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  private readonly PUBMED_EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ncbiApiKey = this.configService.get<string>('NCBI_API_KEY') || '';
    this.ncbiEmail = this.configService.get<string>('NCBI_EMAIL') || 'noreply@vqmethod.com';
  }

  /**
   * Check if paper needs abstract enrichment
   * Returns true if word count suggests abstract is missing/empty
   */
  needsAbstractEnrichment(paper: Paper): boolean {
    // Already has substantial abstract
    if (paper.abstractWordCount && paper.abstractWordCount >= MIN_ABSTRACT_WORDS) {
      return false;
    }

    // Check actual word count (title + abstract)
    const wordCount = paper.wordCount || 0;
    if (wordCount >= MIN_ABSTRACT_WORDS) {
      return false;
    }

    // Needs enrichment if:
    // 1. No abstract at all
    // 2. Abstract is very short (likely just title)
    return !paper.abstract || paper.abstract.length < 200;
  }

  /**
   * Fetch abstract from PubMed using DOI
   * Flow: DOI → PMID lookup → Fetch article XML → Extract abstract
   *
   * @param doi - Paper DOI (e.g., "10.1016/j.cub.2019.08.042")
   * @returns Abstract text or null if not found
   */
  async fetchAbstractByDOI(doi: string): Promise<string | null> {
    if (!doi) {
      return null;
    }

    try {
      // Step 1: Convert DOI to PMID
      const pmid = await this.doiToPmid(doi);
      if (!pmid) {
        this.logger.debug(`[AbstractEnrich] No PMID found for DOI: ${doi}`);
        return null;
      }

      // Step 2: Fetch abstract from PubMed
      const abstract = await this.fetchAbstractByPmid(pmid);
      if (abstract) {
        this.logger.log(`[AbstractEnrich] ✅ Enriched abstract for DOI ${doi} (${abstract.length} chars)`);
      }

      return abstract;
    } catch (error) {
      this.logger.error(`[AbstractEnrich] Failed to fetch abstract for DOI ${doi}`, error);
      return null;
    }
  }

  /**
   * Convert DOI to PMID using PubMed esearch API
   */
  private async doiToPmid(doi: string): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<unknown>(this.PUBMED_ESEARCH_URL, {
          params: {
            db: 'pubmed',
            term: `${doi}[DOI]`,
            retmode: 'json',
            retmax: 1,
            api_key: this.ncbiApiKey,
            email: this.ncbiEmail,
          },
          timeout: 10000,
        }),
      );

      if (!isPubMedSearchResponse(response.data)) {
        return null;
      }

      const idlist = response.data.esearchresult?.idlist || [];
      return idlist.length > 0 ? idlist[0] : null;
    } catch (error) {
      this.logger.debug(`[AbstractEnrich] DOI→PMID lookup failed for ${doi}`);
      return null;
    }
  }

  /**
   * Fetch abstract from PubMed by PMID
   * Uses XML format and parses AbstractText element
   */
  private async fetchAbstractByPmid(pmid: string): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.PUBMED_EFETCH_URL, {
          params: {
            db: 'pubmed',
            id: pmid,
            retmode: 'xml',
            api_key: this.ncbiApiKey,
            email: this.ncbiEmail,
          },
          timeout: 10000,
          responseType: 'text',
        }),
      );

      const xml = response.data;
      return this.extractAbstractFromXml(xml);
    } catch (error) {
      this.logger.debug(`[AbstractEnrich] PMID fetch failed for ${pmid}`);
      return null;
    }
  }

  /**
   * Extract abstract text from PubMed XML response
   * Handles both simple and structured abstracts
   */
  private extractAbstractFromXml(xml: string): string | null {
    if (!xml) return null;

    // Match all AbstractText elements (handles structured abstracts with multiple sections)
    const abstractMatches = xml.match(/<AbstractText[^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]+>[^<]*)*)<\/AbstractText>/g);

    if (!abstractMatches || abstractMatches.length === 0) {
      return null;
    }

    // Combine all abstract sections
    const abstractParts: string[] = [];
    for (const match of abstractMatches) {
      // Extract label if present (e.g., "BACKGROUND:", "METHODS:")
      const labelMatch = match.match(/Label="([^"]+)"/);
      const label = labelMatch ? `${labelMatch[1]}: ` : '';

      // Extract text content, removing inner tags
      const textMatch = match.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      if (textMatch && textMatch[1]) {
        let text = textMatch[1]
          .replace(/<[^>]+>/g, '') // Remove HTML/XML tags
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#xa9;/g, '©')
          .replace(/\s+/g, ' ')
          .trim();

        if (text) {
          abstractParts.push(label + text);
        }
      }
    }

    if (abstractParts.length === 0) {
      return null;
    }

    return abstractParts.join(' ').trim();
  }

  /**
   * Enrich paper with abstract if missing
   * Returns updated paper with abstract and recalculated word counts
   */
  async enrichPaperAbstract(paper: Paper): Promise<Paper> {
    // Check if enrichment is needed
    if (!this.needsAbstractEnrichment(paper)) {
      return paper;
    }

    // Need DOI for PubMed lookup
    if (!paper.doi) {
      return paper;
    }

    // Fetch abstract from PubMed
    const abstract = await this.fetchAbstractByDOI(paper.doi);
    if (!abstract) {
      return paper;
    }

    // Update paper with enriched abstract and recalculate word counts
    const enrichedPaper: Paper = {
      ...paper,
      abstract,
      abstractWordCount: calculateAbstractWordCount(abstract),
      wordCount: calculateComprehensiveWordCount(paper.title, abstract),
    };

    // Update eligibility based on new word count
    enrichedPaper.isEligible = (enrichedPaper.wordCount || 0) >= 150;

    return enrichedPaper;
  }

  /**
   * Batch enrich papers with missing abstracts
   * Limits concurrency to avoid rate limiting
   *
   * @param papers - Papers to enrich
   * @param maxConcurrent - Max parallel requests (default: 5)
   * @returns Enriched papers
   */
  async enrichPapersAbstracts(
    papers: Paper[],
    maxConcurrent: number = 5,
  ): Promise<Paper[]> {
    const needsEnrichment = papers.filter(p => this.needsAbstractEnrichment(p) && p.doi);

    if (needsEnrichment.length === 0) {
      return papers;
    }

    this.logger.log(`[AbstractEnrich] Enriching ${needsEnrichment.length}/${papers.length} papers with missing abstracts`);

    // Process in batches to avoid rate limiting
    const enrichedMap = new Map<string, Paper>();
    const batches: Paper[][] = [];

    for (let i = 0; i < needsEnrichment.length; i += maxConcurrent) {
      batches.push(needsEnrichment.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(paper => this.enrichPaperAbstract(paper)),
      );

      for (const enrichedPaper of results) {
        if (enrichedPaper.id) {
          enrichedMap.set(enrichedPaper.id, enrichedPaper);
        }
      }

      // Small delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Merge enriched papers back into original array
    return papers.map(paper => {
      if (paper.id && enrichedMap.has(paper.id)) {
        return enrichedMap.get(paper.id)!;
      }
      return paper;
    });
  }
}
