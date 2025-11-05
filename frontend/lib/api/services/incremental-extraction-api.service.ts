/**
 * Phase 10 Day 18: Incremental Theme Extraction API Service
 *
 * Enterprise-grade API client for iterative theme extraction with:
 * - Intelligent content caching for cost optimization
 * - Theoretical saturation detection
 * - Corpus management and theme evolution tracking
 *
 * Research backing:
 * - Braun & Clarke (2006, 2019): Reflexive Thematic Analysis requires iterative refinement
 * - Glaser & Strauss (1967): Theoretical saturation - add sources until no new themes
 * - Noblit & Hare (1988): Meta-ethnography requires corpus building
 */

import { getAuthHeaders } from '../utils/auth-headers';

// ============================================================================
// TYPES & INTERFACES (matching backend DTOs)
// ============================================================================

export enum ResearchPurpose {
  EXPLORATORY = 'exploratory',
  EXPLANATORY = 'explanatory',
  EVALUATIVE = 'evaluative',
  DESCRIPTIVE = 'descriptive',
}

export enum UserExpertiseLevel {
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface ThemeChange {
  themeId: string;
  themeName: string;
  changeType: 'new' | 'strengthened' | 'weakened' | 'unchanged';
  previousConfidence?: number;
  newConfidence: number;
  contributingSources: string[]; // paper IDs
}

export interface SaturationAnalysis {
  isSaturated: boolean;
  confidenceLevel: number; // 0-1
  newThemesFound: number;
  existingThemesStrengthened: number;
  recommendation: 'add_more_sources' | 'saturation_reached' | 'refine_search' | 'continue_extraction';
  rationale: string;
}

export interface CostSavings {
  cacheHitsCount: number;
  embeddingsSaved: number;
  completionsSaved: number;
  estimatedDollarsSaved: number;
  totalPapersProcessed: number;
  newPapersProcessed: number;
  cachedPapersReused: number;
}

export interface IncrementalExtractionRequest {
  existingPaperIds: string[];
  newPaperIds: string[];
  purpose: ResearchPurpose;
  userExpertiseLevel: UserExpertiseLevel;
  corpusId?: string;
  corpusName?: string;
}

export interface IncrementalExtractionResponse {
  themes: any[]; // TODO: Type this as UnifiedTheme[]
  statistics: {
    previousThemeCount: number;
    newThemesAdded: number;
    themesStrengthened: number;
    themesWeakened: number;
    totalThemeCount: number;
    newPapersProcessed: number;
    cachedPapersReused: number;
    processingTimeMs: number;
  };
  saturation: SaturationAnalysis;
  costSavings: CostSavings;
  themeChanges: ThemeChange[];
  corpusId: string;
  corpusName: string;
}

export interface CorpusInfo {
  id: string;
  userId: string;
  name: string;
  purpose: string;
  paperIds: string[];
  themeCount: number;
  lastExtractedAt: Date;
  isSaturated: boolean;
  saturationConfidence?: number;
  costSaved: number;
  totalExtractions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorpusStats {
  totalPapers: number;
  cachedCount: number;
  totalExtractions: number;
  estimatedCostSaved: number;
  averageReuse: number;
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

export class IncrementalExtractionApiService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Extract themes incrementally from new papers added to existing corpus
   *
   * Benefits:
   * - Cost savings: Reuses cached content and embeddings
   * - Theoretical saturation: Tracks when no new themes emerge
   * - Theme evolution: Shows how themes change with new sources
   *
   * @param request Incremental extraction parameters
   * @returns Merged themes with statistics and cost savings
   */
  async extractThemesIncremental(
    request: IncrementalExtractionRequest
  ): Promise<IncrementalExtractionResponse> {
    const response = await fetch(`${this.baseUrl}/literature/themes/extract-incremental`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to extract themes incrementally');
    }

    return response.json();
  }

  /**
   * Get all corpuses for the current user
   *
   * @returns List of user's research corpuses
   */
  async getCorpusList(): Promise<CorpusInfo[]> {
    const response = await fetch(`${this.baseUrl}/literature/corpus/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch corpus list');
    }

    return response.json();
  }

  /**
   * Get corpus statistics and cost savings analytics
   *
   * @returns Aggregated statistics across all user corpuses
   */
  async getCorpusStats(): Promise<CorpusStats> {
    const response = await fetch(`${this.baseUrl}/literature/corpus/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch corpus stats');
    }

    return response.json();
  }

  /**
   * Create a new research corpus
   *
   * @param name Corpus name
   * @param purpose Research purpose
   * @param paperIds Initial paper IDs
   * @returns Created corpus information
   */
  async createCorpus(
    name: string,
    purpose: ResearchPurpose,
    paperIds: string[]
  ): Promise<CorpusInfo> {
    const response = await fetch(`${this.baseUrl}/literature/corpus/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name, purpose, paperIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create corpus');
    }

    return response.json();
  }

  /**
   * Update corpus metadata (name, purpose, etc.)
   *
   * @param corpusId Corpus ID to update
   * @param updates Partial corpus updates
   * @returns Updated corpus information
   */
  async updateCorpus(
    corpusId: string,
    updates: Partial<Pick<CorpusInfo, 'name' | 'purpose'>>
  ): Promise<CorpusInfo> {
    const response = await fetch(`${this.baseUrl}/literature/corpus/${corpusId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update corpus');
    }

    return response.json();
  }

  /**
   * Delete a research corpus
   *
   * @param corpusId Corpus ID to delete
   */
  async deleteCorpus(corpusId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/literature/corpus/${corpusId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete corpus');
    }
  }

  /**
   * Get detailed corpus information by ID
   *
   * @param corpusId Corpus ID
   * @returns Corpus information with full details
   */
  async getCorpus(corpusId: string): Promise<CorpusInfo> {
    const response = await fetch(`${this.baseUrl}/literature/corpus/${corpusId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch corpus');
    }

    return response.json();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const incrementalExtractionApi = new IncrementalExtractionApiService();
