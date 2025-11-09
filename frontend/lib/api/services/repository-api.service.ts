import { apiClient } from '../client';

/**
 * Phase 10 Days 26-27: Research Repository API Service
 *
 * Frontend service for interacting with research repository endpoints
 *
 * Features:
 * - Search and discovery
 * - Insight retrieval with full lineage
 * - Annotations (CRUD)
 * - Version history
 * - Statistics and facets
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CitationNode {
  type: 'paper' | 'gap' | 'question' | 'hypothesis' | 'theme' | 'statement' | 'factor' | 'insight';
  id: string;
  title: string;
  metadata?: Record<string, any>;
}

export interface ProvenanceMetadata {
  extractionMethod: string;
  confidence: number;
  sources: Array<{
    type: string;
    id: string;
    weight: number;
  }>;
  generatedAt: string;
  generatedBy: string;
}

export interface ResearchInsight {
  id: string;
  title: string;
  content: string;
  type: 'statement' | 'factor' | 'theme' | 'gap' | 'quote' | 'paper_finding' | 'hypothesis';
  sourceType: 'study' | 'paper' | 'response' | 'analysis' | 'literature';
  sourceId: string;
  studyId?: string;
  userId: string;
  citationChain: CitationNode[];
  provenance: ProvenanceMetadata;
  keywords: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  relatedInsights?: string[];
  relatedPapers?: string[];
  relatedThemes?: string[];
  searchVector?: string;
  isPublic: boolean;
  shareLevel: 'private' | 'team' | 'institution' | 'public';
  viewCount: number;
  citationCount: number;
  version: number;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  types?: string[];
  sourceTypes?: string[];
  studyIds?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  shareLevel?: string[];
  keywords?: string[];
}

export interface SearchResult {
  insight: ResearchInsight;
  score: number;
  highlights: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: {
    types: Record<string, number>;
    sourceTypes: Record<string, number>;
    studies: Record<string, number>;
  };
}

export interface Annotation {
  id: string;
  insightId: string;
  userId: string;
  content: string;
  type: 'note' | 'question' | 'critique' | 'extension';
  parentId?: string;
  replies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InsightVersion {
  id: string;
  insightId: string;
  version: number;
  content: string;
  metadata: Record<string, any>;
  changedBy: string;
  changeNote?: string;
  createdAt: string;
}

export interface RepositoryStats {
  totalInsights: number;
  byType: Record<string, number>;
  bySourceType: Record<string, number>;
  byStudy: Record<string, number>;
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  filters?: any;
  resultCount: number;
  createdAt: string;
}

export type AccessRole = 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'OWNER';

export interface InsightAccess {
  id: string;
  insightId: string;
  userId: string;
  role: AccessRole;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AccessCheckResult {
  hasAccess: boolean;
  role?: string;
  isOwner: boolean;
}

// ============================================================================
// API SERVICE
// ============================================================================

export class RepositoryApiService {
  /**
   * Reindex all entities for current user
   */
  async reindexAll(): Promise<{ indexed: number; message: string }> {
    const response = await apiClient.post('/repository/index');
    return response.data;
  }

  /**
   * Reindex specific study
   */
  async reindexStudy(studyId: string): Promise<{ studyId: string; indexed: number; message: string }> {
    const response = await apiClient.post(`/repository/index/study/${studyId}`);
    return response.data;
  }

  /**
   * Search repository with filters
   */
  async search(params: {
    query: string;
    filters?: SearchFilters;
    allStudies?: boolean; // Phase 10 Day 28: Cross-study search
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.query);

    if (params.filters?.types?.length) {
      queryParams.append('types', params.filters.types.join(','));
    }
    if (params.filters?.sourceTypes?.length) {
      queryParams.append('sourceTypes', params.filters.sourceTypes.join(','));
    }
    if (params.filters?.studyIds?.length) {
      queryParams.append('studyIds', params.filters.studyIds.join(','));
    }
    // Phase 10 Day 28: Cross-study search parameter
    if (params.allStudies) {
      queryParams.append('allStudies', 'true');
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params.order) {
      queryParams.append('order', params.order);
    }

    const response = await apiClient.get(`/repository/search?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get insight with full details
   */
  async getInsight(insightId: string): Promise<ResearchInsight> {
    const response = await apiClient.get(`/repository/insights/${insightId}`);
    return response.data;
  }

  /**
   * Get related insights
   */
  async getRelatedInsights(insightId: string, limit: number = 5): Promise<ResearchInsight[]> {
    const response = await apiClient.get(`/repository/insights/${insightId}/related?limit=${limit}`);
    return response.data;
  }

  /**
   * Get available facets
   */
  async getFacets(): Promise<{
    types: string[];
    sourceTypes: string[];
    shareLevels: string[];
    sortOptions: string[];
  }> {
    const response = await apiClient.get('/repository/facets');
    return response.data;
  }

  /**
   * Get repository statistics
   */
  async getStats(): Promise<RepositoryStats> {
    const response = await apiClient.get('/repository/stats');
    return response.data;
  }

  // ==========================================================================
  // ANNOTATIONS (Day 27)
  // ==========================================================================

  /**
   * Get annotations for an insight
   */
  async getAnnotations(insightId: string): Promise<Annotation[]> {
    const response = await apiClient.get(`/repository/insights/${insightId}/annotations`);
    return response.data;
  }

  /**
   * Create annotation
   */
  async createAnnotation(
    insightId: string,
    content: string,
    type: Annotation['type'],
    parentId?: string,
  ): Promise<Annotation> {
    const response = await apiClient.post(`/repository/insights/${insightId}/annotations`, {
      content,
      type,
      parentId,
    });
    return response.data;
  }

  /**
   * Update annotation
   */
  async updateAnnotation(annotationId: string, content: string): Promise<Annotation> {
    const response = await apiClient.post(`/repository/annotations/${annotationId}`, {
      content,
    });
    return response.data;
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.post(`/repository/annotations/${annotationId}/delete`);
    return response.data;
  }

  // ==========================================================================
  // VERSION HISTORY (Day 27)
  // ==========================================================================

  /**
   * Get version history for an insight
   */
  async getVersionHistory(insightId: string): Promise<InsightVersion[]> {
    const response = await apiClient.get(`/repository/insights/${insightId}/versions`);
    return response.data;
  }

  /**
   * Get specific version
   */
  async getVersion(insightId: string, version: number): Promise<InsightVersion> {
    const response = await apiClient.get(`/repository/insights/${insightId}/versions/${version}`);
    return response.data;
  }

  // ==========================================================================
  // SEARCH HISTORY (Phase 10 Day 28)
  // ==========================================================================

  /**
   * Get search history
   */
  async getSearchHistory(limit: number = 20): Promise<SearchHistoryEntry[]> {
    const response = await apiClient.get(`/repository/search-history?limit=${limit}`);
    return response.data;
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete('/repository/search-history');
    return response.data;
  }

  // ==========================================================================
  // PERMISSIONS & COLLABORATION (Phase 10 Day 29)
  // ==========================================================================

  /**
   * Update insight visibility
   */
  async updateVisibility(
    insightId: string,
    isPublic: boolean,
    shareLevel: 'private' | 'team' | 'institution' | 'public',
  ): Promise<ResearchInsight> {
    const response = await apiClient.put(`/repository/insights/${insightId}/visibility`, {
      isPublic,
      shareLevel,
    });
    return response.data;
  }

  /**
   * Grant access to a user
   */
  async grantAccess(
    insightId: string,
    userId: string,
    role: AccessRole,
    expiresAt?: string,
  ): Promise<InsightAccess> {
    const response = await apiClient.post(`/repository/insights/${insightId}/access`, {
      userId,
      role,
      expiresAt,
    });
    return response.data;
  }

  /**
   * Revoke user access
   */
  async revokeAccess(insightId: string, userId: string): Promise<{ revoked: boolean }> {
    const response = await apiClient.delete(`/repository/insights/${insightId}/access/${userId}`);
    return response.data;
  }

  /**
   * Check if current user has access
   */
  async checkAccess(insightId: string): Promise<AccessCheckResult> {
    const response = await apiClient.get(`/repository/insights/${insightId}/check-access`);
    return response.data;
  }

  /**
   * Get access list for insight
   */
  async getAccessList(insightId: string): Promise<InsightAccess[]> {
    const response = await apiClient.get(`/repository/insights/${insightId}/access`);
    return response.data;
  }

  /**
   * Grant study-level access
   */
  async grantStudyAccess(
    studyId: string,
    userId: string,
    role: 'VIEWER' | 'COMMENTER' | 'EDITOR',
  ): Promise<{ granted: number; insights: string[] }> {
    const response = await apiClient.post(`/repository/studies/${studyId}/access`, {
      userId,
      role,
    });
    return response.data;
  }

  /**
   * Revoke study-level access
   */
  async revokeStudyAccess(
    studyId: string,
    userId: string,
  ): Promise<{ revoked: number; insights: string[] }> {
    const response = await apiClient.delete(`/repository/studies/${studyId}/access/${userId}`);
    return response.data;
  }
}

// Singleton instance
export const repositoryApi = new RepositoryApiService();
