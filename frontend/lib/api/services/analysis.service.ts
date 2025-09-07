import { apiClient, ApiResponse } from '../client';

// Types
export interface Analysis {
  id: string;
  studyId: string;
  name: string;
  description?: string;
  type: 'factor' | 'cluster' | 'correlation' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parameters: AnalysisParameters;
  results?: AnalysisResults;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface AnalysisParameters {
  method?: 'pca' | 'centroid' | 'iterative';
  numberOfFactors?: number;
  rotationMethod?: 'varimax' | 'quartimax' | 'equamax' | 'none';
  extractionThreshold?: number;
  minEigenvalue?: number;
  significanceLevel?: number;
  customSettings?: Record<string, any>;
}

export interface AnalysisResults {
  factors?: Factor[];
  correlationMatrix?: number[][];
  eigenvalues?: number[];
  variance?: VarianceData;
  loadings?: FactorLoading[];
  scores?: FactorScore[];
  statistics?: AnalysisStatistics;
  interpretation?: string;
  visualizations?: Visualization[];
}

export interface Factor {
  id: string;
  number: number;
  name?: string;
  eigenvalue: number;
  varianceExplained: number;
  cumulativeVariance: number;
  statements: FactorStatement[];
  participants: string[];
  interpretation?: string;
}

export interface FactorStatement {
  statementId: string;
  text: string;
  loading: number;
  zScore: number;
  rank: number;
  distinguishing: boolean;
  consensus?: boolean;
}

export interface FactorLoading {
  participantId: string;
  factors: Record<string, number>;
  communality: number;
  specificity: number;
}

export interface FactorScore {
  statementId: string;
  factors: Record<string, number>;
}

export interface VarianceData {
  total: number;
  explained: number;
  unexplained: number;
  byFactor: Array<{
    factor: number;
    variance: number;
    cumulative: number;
  }>;
}

export interface AnalysisStatistics {
  kmo?: number; // Kaiser-Meyer-Olkin measure
  bartlett?: {
    chiSquare: number;
    df: number;
    pValue: number;
  };
  reliability?: {
    cronbachAlpha: number;
    splitHalf: number;
  };
  correlations?: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
}

export interface Visualization {
  type: 'scree' | 'biplot' | 'heatmap' | 'network' | 'distribution';
  title: string;
  data: any;
  config?: any;
}

export interface CreateAnalysisDto {
  studyId: string;
  name: string;
  description?: string;
  type: Analysis['type'];
  parameters: AnalysisParameters;
}

export interface UpdateAnalysisDto {
  name?: string;
  description?: string;
  parameters?: Partial<AnalysisParameters>;
}

export interface AnalysisFilters {
  studyId?: string;
  type?: Analysis['type'];
  status?: Analysis['status'];
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ComparisonAnalysis {
  analysisIds: string[];
  comparisonType: 'factors' | 'statements' | 'participants';
  metrics?: string[];
}

export interface ConsensusAnalysis {
  studyId: string;
  threshold?: number;
  includeDistinguishing?: boolean;
}

class AnalysisService {
  // CRUD Operations
  async createAnalysis(data: CreateAnalysisDto): Promise<Analysis> {
    const response = await apiClient.post<Analysis>('/analysis', data);
    return response.data;
  }

  async getAnalyses(
    filters?: AnalysisFilters
  ): Promise<ApiResponse<Analysis[]>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<Analysis[]>(
      `/analysis?${params.toString()}`
    );
    return response;
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const response = await apiClient.get<Analysis>(`/analysis/${id}`);
    return response.data;
  }

  async updateAnalysis(id: string, data: UpdateAnalysisDto): Promise<Analysis> {
    const response = await apiClient.patch<Analysis>(`/analysis/${id}`, data);
    return response.data;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await apiClient.delete(`/analysis/${id}`);
  }

  // Analysis Execution
  async runAnalysis(id: string): Promise<Analysis> {
    const response = await apiClient.post<Analysis>(`/analysis/${id}/run`);
    return response.data;
  }

  async cancelAnalysis(id: string): Promise<void> {
    await apiClient.post(`/analysis/${id}/cancel`);
  }

  async retryAnalysis(id: string): Promise<Analysis> {
    const response = await apiClient.post<Analysis>(`/analysis/${id}/retry`);
    return response.data;
  }

  // Real-time Updates
  subscribeToUpdates(
    analysisId: string,
    onUpdate: (data: any) => void
  ): () => void {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(
      `ws://localhost:4000/analysis/${analysisId}/updates`
    );

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }

  // Results & Interpretation
  async getResults(analysisId: string): Promise<AnalysisResults> {
    const response = await apiClient.get<AnalysisResults>(
      `/analysis/${analysisId}/results`
    );
    return response.data;
  }

  async generateInterpretation(analysisId: string): Promise<string> {
    const response = await apiClient.post<{ interpretation: string }>(
      `/analysis/${analysisId}/interpret`
    );
    return response.data.interpretation;
  }

  async updateInterpretation(
    analysisId: string,
    interpretation: string
  ): Promise<void> {
    await apiClient.patch(`/analysis/${analysisId}/interpretation`, {
      interpretation,
    });
  }

  // Factor Analysis Specific
  async extractFactors(
    analysisId: string,
    numberOfFactors: number
  ): Promise<Factor[]> {
    const response = await apiClient.post<Factor[]>(
      `/analysis/${analysisId}/extract-factors`,
      { numberOfFactors }
    );
    return response.data;
  }

  async rotateFactors(analysisId: string, method: string): Promise<Factor[]> {
    const response = await apiClient.post<Factor[]>(
      `/analysis/${analysisId}/rotate`,
      { method }
    );
    return response.data;
  }

  async labelFactor(
    analysisId: string,
    factorId: string,
    label: string
  ): Promise<void> {
    await apiClient.patch(`/analysis/${analysisId}/factors/${factorId}`, {
      name: label,
    });
  }

  async getFactorScores(
    analysisId: string,
    factorId: string
  ): Promise<FactorScore[]> {
    const response = await apiClient.get<FactorScore[]>(
      `/analysis/${analysisId}/factors/${factorId}/scores`
    );
    return response.data;
  }

  // Consensus & Comparison
  async findConsensus(data: ConsensusAnalysis): Promise<FactorStatement[]> {
    const response = await apiClient.post<FactorStatement[]>(
      '/analysis/consensus',
      data
    );
    return response.data;
  }

  async compareAnalyses(data: ComparisonAnalysis): Promise<any> {
    const response = await apiClient.post<any>('/analysis/compare', data);
    return response.data;
  }

  async getDistinguishingStatements(
    analysisId: string
  ): Promise<FactorStatement[]> {
    const response = await apiClient.get<FactorStatement[]>(
      `/analysis/${analysisId}/distinguishing`
    );
    return response.data;
  }

  // Visualizations
  async getVisualizations(analysisId: string): Promise<Visualization[]> {
    const response = await apiClient.get<Visualization[]>(
      `/analysis/${analysisId}/visualizations`
    );
    return response.data;
  }

  async generateVisualization(
    analysisId: string,
    type: Visualization['type'],
    config?: any
  ): Promise<Visualization> {
    const response = await apiClient.post<Visualization>(
      `/analysis/${analysisId}/visualizations`,
      { type, config }
    );
    return response.data;
  }

  // Export
  async exportResults(
    analysisId: string,
    format: 'pdf' | 'csv' | 'excel' | 'spss'
  ): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .get(`/analysis/${analysisId}/export?format=${format}`, {
        responseType: 'blob',
      });
    return response.data;
  }

  async exportToPQMethod(analysisId: string): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .get(`/analysis/${analysisId}/export/pqmethod`, {
        responseType: 'blob',
      });
    return response.data;
  }

  async exportVisualization(
    analysisId: string,
    visualizationId: string,
    format: 'png' | 'svg' | 'pdf'
  ): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .get(
        `/analysis/${analysisId}/visualizations/${visualizationId}/export?format=${format}`,
        {
          responseType: 'blob',
        }
      );
    return response.data;
  }

  // Templates & Presets
  async getPresets(): Promise<AnalysisParameters[]> {
    const response =
      await apiClient.get<AnalysisParameters[]>('/analysis/presets');
    return response.data;
  }

  async saveAsPreset(analysisId: string, name: string): Promise<void> {
    await apiClient.post(`/analysis/${analysisId}/save-preset`, { name });
  }

  async applyPreset(analysisId: string, presetId: string): Promise<Analysis> {
    const response = await apiClient.post<Analysis>(
      `/analysis/${analysisId}/apply-preset`,
      { presetId }
    );
    return response.data;
  }

  // Validation
  async validateData(
    studyId: string
  ): Promise<{ valid: boolean; issues?: string[] }> {
    const response = await apiClient.post<{
      valid: boolean;
      issues?: string[];
    }>(`/analysis/validate`, { studyId });
    return response.data;
  }

  async checkAssumptions(analysisId: string): Promise<{
    passed: boolean;
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
      value?: any;
    }>;
  }> {
    const response = await apiClient.get<any>(
      `/analysis/${analysisId}/assumptions`
    );
    return response.data;
  }

  // History & Versioning
  async getHistory(analysisId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `/analysis/${analysisId}/history`
    );
    return response.data;
  }

  async revertToVersion(
    analysisId: string,
    versionId: string
  ): Promise<Analysis> {
    const response = await apiClient.post<Analysis>(
      `/analysis/${analysisId}/revert`,
      { versionId }
    );
    return response.data;
  }

  async duplicateAnalysis(analysisId: string, name: string): Promise<Analysis> {
    const response = await apiClient.post<Analysis>(
      `/analysis/${analysisId}/duplicate`,
      { name }
    );
    return response.data;
  }
}

// Export singleton instance
export const analysisService = new AnalysisService();

// Export types
export type { AnalysisService };
