/**
 * Hub API Service - Phase 7 Day 2 Implementation
 *
 * Enterprise-grade API client for the Analysis Hub
 * Provides typed methods for all hub operations with proper error handling
 */

interface HubData {
  study: any;
  participants: {
    total: number;
    completed: number;
    inProgress: number;
    data: any[];
  };
  qsorts: {
    total: number;
    data: any[];
  };
  analysis: any;
  statistics: any;
  metadata: {
    lastUpdated: string;
    cacheExpiry: number;
  };
}

interface ResponseFilters {
  participantId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ResponseDataResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'spss';
  options?: {
    includeRawData?: boolean;
    includeAnalysis?: boolean;
    includeStatistics?: boolean;
  };
}

class HubAPIService {
  private baseUrl = '/api/analysis/hub';
  private wsConnection: WebSocket | null = null;
  private wsCallbacks: Map<string, (data: any) => void> = new Map();

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    console.error('Hub API Error:', error);
    throw error;
  }

  /**
   * Get comprehensive hub data for a study
   */
  async getHubData(studyId: string): Promise<HubData> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hub data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Get filtered response data
   */
  async getResponseData(
    studyId: string,
    filters?: ResponseFilters
  ): Promise<ResponseDataResult> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(
        `${this.baseUrl}/${studyId}/responses?${params}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch response data: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Export study data in various formats
   */
  async exportData(
    studyId: string,
    format: ExportOptions['format'],
    options?: ExportOptions['options']
  ): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}/export`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ format, options }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Download exported data
   */
  async downloadExport(
    studyId: string,
    format: ExportOptions['format'],
    options?: ExportOptions['options']
  ): Promise<void> {
    try {
      const blob = await this.exportData(studyId, format, options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-${studyId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(studyId: string, onUpdate: (data: any) => void): void {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const wsUrl = process.env['NEXT_PUBLIC_WS_URL'] || 'ws://localhost:4000';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to study updates
      this.wsConnection?.send(
        JSON.stringify({
          type: 'subscribe',
          studyId,
        })
      );
    };

    this.wsConnection.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        switch (data.type) {
          case 'hub:initial':
            onUpdate(data.data);
            break;
          case 'hub:update':
            onUpdate(data);
            break;
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }

        // Call registered callbacks
        this.wsCallbacks.forEach(callback => {
          callback(data);
        });
      } catch (error: any) {
        console.error('WebSocket message error:', error);
      }
    };

    this.wsConnection.onerror = error => {
      console.error('WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      this.wsConnection = null;

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!this.wsConnection) {
          this.connectWebSocket(studyId, onUpdate);
        }
      }, 5000);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.wsCallbacks.clear();
  }

  /**
   * Register a callback for WebSocket messages
   */
  onWebSocketMessage(id: string, callback: (data: any) => void): void {
    this.wsCallbacks.set(id, callback);
  }

  /**
   * Unregister a WebSocket callback
   */
  offWebSocketMessage(id: string): void {
    this.wsCallbacks.delete(id);
  }

  /**
   * Subscribe to study updates (alternative HTTP method)
   */
  async subscribeToUpdates(studyId: string, clientId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}/subscribe`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Unsubscribe from study updates
   */
  async unsubscribeFromUpdates(
    studyId: string,
    clientId: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}/unsubscribe`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        throw new Error(`Unsubscription failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Validate study data for analysis - Phase 7 Day 3
   */
  async validateAnalysis(studyId: string): Promise<any> {
    try {
      const response = await fetch(`/api/analysis/validate/${studyId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Run factor extraction analysis
   */
  async runFactorExtraction(studyId: string, config: any): Promise<any> {
    try {
      const response = await fetch(`/api/analysis/extract`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ studyId, ...config }),
      });

      if (!response.ok) {
        throw new Error(`Factor extraction failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Run rotation analysis
   */
  async runRotation(studyId: string, config: any): Promise<any> {
    try {
      const response = await fetch(`/api/analysis/rotate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ studyId, ...config }),
      });

      if (!response.ok) {
        throw new Error(`Rotation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Run statistical analysis
   */
  async runStatistics(studyId: string, config: any): Promise<any> {
    try {
      const response = await fetch(`/api/analysis/statistics`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ studyId, ...config }),
      });

      if (!response.ok) {
        throw new Error(
          `Statistics calculation failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Run bootstrap analysis
   */
  async runBootstrap(studyId: string, config: any): Promise<any> {
    try {
      const response = await fetch(`/api/analysis/bootstrap`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ studyId, ...config }),
      });

      if (!response.ok) {
        throw new Error(`Bootstrap analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Generate analysis report
   */
  async generateAnalysisReport(studyId: string, results: any): Promise<any> {
    try {
      const response = await fetch(`/api/analysis/report`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ studyId, results }),
      });

      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Download analysis results
   */
  async downloadResults(
    studyId: string,
    format: 'excel' | 'pqmethod'
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/analysis/download/${studyId}/${format}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'pqmethod' ? 'dat' : 'xlsx';
      a.download = `q-analysis-${studyId}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Generate factor narratives - Phase 7 Day 5
   */
  async generateFactorNarratives(
    studyId: string,
    options?: {
      includeDistinguishing?: boolean;
      includeConsensus?: boolean;
      analysisDepth?: 'basic' | 'standard' | 'comprehensive';
    }
  ): Promise<any> {
    try {
      const response = await fetch(
        `/api/interpretation/${studyId}/narratives`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(options || {}),
        }
      );

      if (!response.ok) {
        throw new Error(`Narrative generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Generate study recommendations - Phase 7 Day 5
   */
  async generateRecommendations(
    studyId: string,
    options?: {
      includeActionItems?: boolean;
      prioritize?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await fetch(
        `/api/interpretation/${studyId}/recommendations`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(options || {}),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Recommendation generation failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Analyze study bias - Phase 7 Day 5
   */
  async analyzeBias(
    studyId: string,
    options?: {
      dimensions?: string[];
      includeRecommendations?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await fetch(`/api/interpretation/${studyId}/bias`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(options || {}),
      });

      if (!response.ok) {
        throw new Error(`Bias analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Extract themes from study - Phase 7 Day 5
   */
  async extractThemes(
    studyId: string,
    options?: {
      method?: 'ai-powered' | 'statistical';
      minOccurrence?: number;
      includeQuotes?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await fetch(`/api/interpretation/${studyId}/themes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(options || {}),
      });

      if (!response.ok) {
        throw new Error(`Theme extraction failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Get comprehensive AI insights summary - Phase 7 Day 5
   */
  async getInsightsSummary(studyId: string): Promise<any> {
    try {
      const response = await fetch(`/api/interpretation/${studyId}/summary`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get insights summary: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const hubAPIService = new HubAPIService();
