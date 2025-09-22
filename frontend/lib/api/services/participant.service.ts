import { apiClient } from '../client';

// Types
export interface ParticipantSession {
  id: string;
  studyId: string;
  participantId?: string;
  accessCode: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  currentStep: number;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  completionTime?: number;
  deviceInfo?: DeviceInfo;
  responses?: ParticipantResponses;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export interface ParticipantResponses {
  demographics?: Record<string, any>;
  consent?: {
    agreed: boolean;
    timestamp: string;
  };
  preSort?: {
    categories: Record<string, string[]>;
    timestamp: string;
  };
  qSort?: QSortData;
  postSort?: {
    comments: Record<string, string>;
    ratings: Record<string, number>;
    timestamp: string;
  };
  feedback?: {
    difficulty: number;
    clarity: number;
    comments: string;
    timestamp: string;
  };
}

export interface QSortData {
  grid: GridPosition[];
  completedAt: string;
  timeSpent: number;
  moves: number;
  undoCount: number;
}

export interface GridPosition {
  statementId: string;
  position: {
    column: number;
    row: number;
  };
  value: number;
  timestamp: string;
}

export interface ParticipantRegistration {
  studyId: string;
  accessCode?: string;
  email?: string;
  name?: string;
  demographics?: Record<string, any>;
}

export interface SortingState {
  sessionId: string;
  grid: GridPosition[];
  unsortedStatements: string[];
  currentStep: 'initial' | 'sorting' | 'review';
  canUndo: boolean;
  canRedo: boolean;
}

export interface ParticipantProgress {
  sessionId: string;
  currentStep: number;
  completedSteps: string[];
  nextStep?: string;
  canProceed: boolean;
  validationErrors?: string[];
}

export interface StudyAccessResponse {
  study: {
    id: string;
    title: string;
    description: string;
    instructions?: string;
    settings: any;
  };
  session: ParticipantSession;
  statements: Array<{
    id: string;
    text: string;
    category?: string;
  }>;
  gridConfig: {
    columns: number[];
    distribution: number[];
  };
}

class ParticipantService {
  // Session Management
  async startSession(
    data: ParticipantRegistration
  ): Promise<ParticipantSession> {
    const response = await apiClient.post<ParticipantSession>(
      '/participant/start',
      data
    );
    return response.data;
  }

  async getSession(sessionId: string): Promise<ParticipantSession> {
    const response = await apiClient.get<ParticipantSession>(
      `/participant/sessions/${sessionId}`
    );
    return response.data;
  }

  async resumeSession(sessionId: string): Promise<ParticipantSession> {
    const response = await apiClient.post<ParticipantSession>(
      `/participant/sessions/${sessionId}/resume`
    );
    return response.data;
  }

  async abandonSession(sessionId: string, reason?: string): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/abandon`, {
      reason,
    });
  }

  // Study Access
  async accessStudy(accessCode: string): Promise<StudyAccessResponse> {
    const response = await apiClient.get<StudyAccessResponse>(
      `/participant/study/${accessCode}`
    );
    return response.data;
  }

  async checkAccess(
    studyId: string,
    accessCode?: string
  ): Promise<{ hasAccess: boolean; requiresAuth: boolean }> {
    const response = await apiClient.post<{
      hasAccess: boolean;
      requiresAuth: boolean;
    }>('/participant/check-access', { studyId, accessCode });
    return response.data;
  }

  // Progress Tracking
  async getProgress(sessionId: string): Promise<ParticipantProgress> {
    const response = await apiClient.get<ParticipantProgress>(
      `/participant/sessions/${sessionId}/progress`
    );
    return response.data;
  }

  async updateProgress(
    sessionId: string,
    step: number,
    data?: any
  ): Promise<ParticipantProgress> {
    const response = await apiClient.patch<ParticipantProgress>(
      `/participant/sessions/${sessionId}/progress`,
      { step, data }
    );
    return response.data;
  }

  async saveProgress(
    sessionId: string,
    data: Partial<ParticipantResponses>
  ): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/save`, data);
  }

  // Consent
  async submitConsent(
    sessionId: string,
    agreed: boolean,
    signature?: string
  ): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/consent`, {
      agreed,
      signature,
      timestamp: new Date().toISOString(),
    });
  }

  async getConsentForm(
    studyId: string
  ): Promise<{ content: string; version: string }> {
    const response = await apiClient.get<{ content: string; version: string }>(
      `/participant/study/${studyId}/consent`
    );
    return response.data;
  }

  // Demographics
  async submitDemographics(
    sessionId: string,
    demographics: Record<string, any>
  ): Promise<void> {
    await apiClient.post(
      `/participant/sessions/${sessionId}/demographics`,
      demographics
    );
  }

  async getDemographicQuestions(studyId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `/participant/study/${studyId}/demographics`
    );
    return response.data;
  }

  // Q-Sort Process
  async getStatements(
    sessionId: string
  ): Promise<Array<{ id: string; text: string; category?: string }>> {
    const response = await apiClient.get<
      Array<{ id: string; text: string; category?: string }>
    >(`/participant/sessions/${sessionId}/statements`);
    return response.data;
  }

  async savePreSort(
    sessionId: string,
    categories: Record<string, string[]>
  ): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/pre-sort`, {
      categories,
      timestamp: new Date().toISOString(),
    });
  }

  async getSortingState(sessionId: string): Promise<SortingState> {
    const response = await apiClient.get<SortingState>(
      `/participant/sessions/${sessionId}/sorting-state`
    );
    return response.data;
  }

  async updateSortingState(
    sessionId: string,
    state: Partial<SortingState>
  ): Promise<SortingState> {
    const response = await apiClient.patch<SortingState>(
      `/participant/sessions/${sessionId}/sorting-state`,
      state
    );
    return response.data;
  }

  async placeStatement(
    sessionId: string,
    statementId: string,
    position: { column: number; row: number }
  ): Promise<SortingState> {
    const response = await apiClient.post<SortingState>(
      `/participant/sessions/${sessionId}/place-statement`,
      { statementId, position }
    );
    return response.data;
  }

  async removeStatement(
    sessionId: string,
    statementId: string
  ): Promise<SortingState> {
    const response = await apiClient.post<SortingState>(
      `/participant/sessions/${sessionId}/remove-statement`,
      { statementId }
    );
    return response.data;
  }

  async undoAction(sessionId: string): Promise<SortingState> {
    const response = await apiClient.post<SortingState>(
      `/participant/sessions/${sessionId}/undo`
    );
    return response.data;
  }

  async redoAction(sessionId: string): Promise<SortingState> {
    const response = await apiClient.post<SortingState>(
      `/participant/sessions/${sessionId}/redo`
    );
    return response.data;
  }

  async submitQSort(sessionId: string, sortData: QSortData): Promise<void> {
    await apiClient.post(
      `/participant/sessions/${sessionId}/submit-sort`,
      sortData
    );
  }

  // Post-Sort
  async submitPostSortComments(
    sessionId: string,
    comments: Record<string, string>,
    ratings?: Record<string, number>
  ): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/post-sort`, {
      comments,
      ratings,
      timestamp: new Date().toISOString(),
    });
  }

  async getPostSortQuestions(studyId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `/participant/study/${studyId}/post-sort-questions`
    );
    return response.data;
  }

  // Feedback
  async submitFeedback(sessionId: string, feedback: any): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/feedback`, {
      ...feedback,
      timestamp: new Date().toISOString(),
    });
  }

  // Completion
  async completeSession(sessionId: string): Promise<{
    completionCode?: string;
    certificate?: string;
    nextSteps?: string;
  }> {
    const response = await apiClient.post<{
      completionCode?: string;
      certificate?: string;
      nextSteps?: string;
    }>(`/participant/sessions/${sessionId}/complete`);
    return response.data;
  }

  async getCompletionCertificate(sessionId: string): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .get(`/participant/sessions/${sessionId}/certificate`, {
        responseType: 'blob',
      });
    return response.data;
  }

  // Data Export
  async exportResponses(
    sessionId: string,
    format: 'json' | 'csv'
  ): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .get(`/participant/sessions/${sessionId}/export?format=${format}`, {
        responseType: 'blob',
      });
    return response.data;
  }

  async requestDataDeletion(sessionId: string, email: string): Promise<void> {
    await apiClient.post(`/participant/sessions/${sessionId}/delete-request`, {
      email,
    });
  }

  // Validation
  async validateSort(
    sessionId: string,
    grid: GridPosition[]
  ): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const response = await apiClient.post<{
      valid: boolean;
      errors?: string[];
    }>(`/participant/sessions/${sessionId}/validate-sort`, { grid });
    return response.data;
  }

  async validateDemographics(
    sessionId: string,
    demographics: Record<string, any>
  ): Promise<{
    valid: boolean;
    errors?: Record<string, string>;
  }> {
    const response = await apiClient.post<{
      valid: boolean;
      errors?: Record<string, string>;
    }>(
      `/participant/sessions/${sessionId}/validate-demographics`,
      demographics
    );
    return response.data;
  }

  // Real-time Updates
  subscribeToSessionUpdates(
    sessionId: string,
    onUpdate: (data: any) => void
  ): () => void {
    const ws = new WebSocket(
      `ws://localhost:4000/participant/sessions/${sessionId}/updates`
    );

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    return () => {
      ws.close();
    };
  }

  // Helper Methods
  calculateProgress(responses: ParticipantResponses): number {
    const steps = [
      'consent',
      'demographics',
      'preSort',
      'qSort',
      'postSort',
      'feedback',
    ];
    const completed = steps.filter(
      step => responses[step as keyof ParticipantResponses]
    ).length;
    return (completed / steps.length) * 100;
  }

  formatCompletionTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

// Export singleton instance
export const participantService = new ParticipantService();

// Export types
export type { ParticipantService };
