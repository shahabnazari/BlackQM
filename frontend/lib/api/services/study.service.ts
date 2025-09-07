import { apiClient, ApiResponse } from '../client';

// Types
export interface Study {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  createdBy: string;
  organizationId?: string;
  settings: StudySettings;
  statistics: StudyStatistics;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
}

export interface StudySettings {
  requireAuth: boolean;
  allowAnonymous: boolean;
  maxParticipants?: number;
  customInstructions?: string;
  sortingMethod: 'grid' | 'free' | 'hybrid';
  gridSize?: {
    rows: number;
    columns: number;
  };
  statements: Statement[];
  emailNotifications?: boolean;
  autoClose?: boolean;
  closeDate?: string;
}

export interface Statement {
  id: string;
  text: string;
  category?: string;
  order: number;
}

export interface StudyStatistics {
  totalParticipants: number;
  completedSorts: number;
  averageCompletionTime: number;
  responseRate: number;
  lastResponseAt?: string;
}

export interface CreateStudyDto {
  title: string;
  description: string;
  settings: Partial<StudySettings>;
  startDate?: string;
  endDate?: string;
}

export interface UpdateStudyDto extends Partial<CreateStudyDto> {
  status?: Study['status'];
}

export interface StudyParticipant {
  id: string;
  studyId: string;
  userId?: string;
  email?: string;
  name?: string;
  status: 'invited' | 'started' | 'completed' | 'abandoned';
  startedAt?: string;
  completedAt?: string;
  completionTime?: number;
  sortData?: any;
}

export interface StudyInvitation {
  emails: string[];
  customMessage?: string;
  sendReminder?: boolean;
  reminderDays?: number;
}

export interface StudyExport {
  format: 'csv' | 'excel' | 'spss' | 'pqmethod';
  includeMetadata?: boolean;
  includeStatistics?: boolean;
  includeParticipantData?: boolean;
}

export interface StudyFilters {
  status?: Study['status'];
  createdBy?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class StudyService {
  // CRUD Operations
  async createStudy(data: CreateStudyDto): Promise<Study> {
    const response = await apiClient.post<Study>('/studies', data);
    return response.data;
  }

  async getStudies(filters?: StudyFilters): Promise<ApiResponse<Study[]>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<Study[]>(
      `/studies?${params.toString()}`
    );
    return response;
  }

  async getStudy(id: string): Promise<Study> {
    const response = await apiClient.get<Study>(`/studies/${id}`);
    return response.data;
  }

  async updateStudy(id: string, data: UpdateStudyDto): Promise<Study> {
    const response = await apiClient.patch<Study>(`/studies/${id}`, data);
    return response.data;
  }

  async deleteStudy(id: string): Promise<void> {
    await apiClient.delete(`/studies/${id}`);
  }

  // Study Management
  async duplicateStudy(id: string, newTitle: string): Promise<Study> {
    const response = await apiClient.post<Study>(`/studies/${id}/duplicate`, {
      title: newTitle,
    });
    return response.data;
  }

  async archiveStudy(id: string): Promise<Study> {
    const response = await apiClient.post<Study>(`/studies/${id}/archive`);
    return response.data;
  }

  async restoreStudy(id: string): Promise<Study> {
    const response = await apiClient.post<Study>(`/studies/${id}/restore`);
    return response.data;
  }

  async publishStudy(id: string): Promise<Study> {
    const response = await apiClient.post<Study>(`/studies/${id}/publish`);
    return response.data;
  }

  async pauseStudy(id: string): Promise<Study> {
    const response = await apiClient.post<Study>(`/studies/${id}/pause`);
    return response.data;
  }

  async resumeStudy(id: string): Promise<Study> {
    const response = await apiClient.post<Study>(`/studies/${id}/resume`);
    return response.data;
  }

  // Statements Management
  async addStatements(
    studyId: string,
    statements: Omit<Statement, 'id'>[]
  ): Promise<Statement[]> {
    const response = await apiClient.post<Statement[]>(
      `/studies/${studyId}/statements`,
      { statements }
    );
    return response.data;
  }

  async updateStatement(
    studyId: string,
    statementId: string,
    data: Partial<Statement>
  ): Promise<Statement> {
    const response = await apiClient.patch<Statement>(
      `/studies/${studyId}/statements/${statementId}`,
      data
    );
    return response.data;
  }

  async deleteStatement(studyId: string, statementId: string): Promise<void> {
    await apiClient.delete(`/studies/${studyId}/statements/${statementId}`);
  }

  async reorderStatements(
    studyId: string,
    statementIds: string[]
  ): Promise<Statement[]> {
    const response = await apiClient.post<Statement[]>(
      `/studies/${studyId}/statements/reorder`,
      { statementIds }
    );
    return response.data;
  }

  async importStatements(studyId: string, file: File): Promise<Statement[]> {
    const response = await apiClient.uploadFile(
      `/studies/${studyId}/statements/import`,
      file
    );
    return response.data;
  }

  // Participants Management
  async getParticipants(studyId: string): Promise<StudyParticipant[]> {
    const response = await apiClient.get<StudyParticipant[]>(
      `/studies/${studyId}/participants`
    );
    return response.data;
  }

  async inviteParticipants(
    studyId: string,
    invitation: StudyInvitation
  ): Promise<void> {
    await apiClient.post(`/studies/${studyId}/invite`, invitation);
  }

  async removeParticipant(
    studyId: string,
    participantId: string
  ): Promise<void> {
    await apiClient.delete(`/studies/${studyId}/participants/${participantId}`);
  }

  async getParticipantData(
    studyId: string,
    participantId: string
  ): Promise<StudyParticipant> {
    const response = await apiClient.get<StudyParticipant>(
      `/studies/${studyId}/participants/${participantId}`
    );
    return response.data;
  }

  async resendInvitation(
    studyId: string,
    participantId: string
  ): Promise<void> {
    await apiClient.post(
      `/studies/${studyId}/participants/${participantId}/resend`
    );
  }

  // Statistics & Analytics
  async getStatistics(studyId: string): Promise<StudyStatistics> {
    const response = await apiClient.get<StudyStatistics>(
      `/studies/${studyId}/statistics`
    );
    return response.data;
  }

  async getAnalytics(studyId: string): Promise<any> {
    const response = await apiClient.get<any>(`/studies/${studyId}/analytics`);
    return response.data;
  }

  async getCompletionRate(
    studyId: string
  ): Promise<{ rate: number; trend: string }> {
    const response = await apiClient.get<{ rate: number; trend: string }>(
      `/studies/${studyId}/completion-rate`
    );
    return response.data;
  }

  // Export & Import
  async exportStudy(studyId: string, options: StudyExport): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .post(`/studies/${studyId}/export`, options, {
        responseType: 'blob',
      });
    return response.data;
  }

  async exportResults(
    studyId: string,
    format: StudyExport['format']
  ): Promise<Blob> {
    const response = await apiClient
      .getClient()
      .get(`/studies/${studyId}/results/export?format=${format}`, {
        responseType: 'blob',
      });
    return response.data;
  }

  async importStudy(file: File): Promise<Study> {
    const response = await apiClient.uploadFile('/studies/import', file);
    return response.data;
  }

  // Collaboration
  async shareStudy(
    studyId: string,
    emails: string[],
    permissions: string[]
  ): Promise<void> {
    await apiClient.post(`/studies/${studyId}/share`, {
      emails,
      permissions,
    });
  }

  async getCollaborators(studyId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `/studies/${studyId}/collaborators`
    );
    return response.data;
  }

  async updateCollaboratorPermissions(
    studyId: string,
    collaboratorId: string,
    permissions: string[]
  ): Promise<void> {
    await apiClient.patch(
      `/studies/${studyId}/collaborators/${collaboratorId}`,
      {
        permissions,
      }
    );
  }

  async removeCollaborator(
    studyId: string,
    collaboratorId: string
  ): Promise<void> {
    await apiClient.delete(
      `/studies/${studyId}/collaborators/${collaboratorId}`
    );
  }

  // Public Access
  async getPublicStudy(accessCode: string): Promise<Study> {
    const response = await apiClient.get<Study>(
      `/studies/public/${accessCode}`
    );
    return response.data;
  }

  async generateAccessLink(
    studyId: string,
    expiresIn?: number
  ): Promise<{ link: string; code: string }> {
    const response = await apiClient.post<{ link: string; code: string }>(
      `/studies/${studyId}/access-link`,
      { expiresIn }
    );
    return response.data;
  }

  async revokeAccessLink(studyId: string, code: string): Promise<void> {
    await apiClient.delete(`/studies/${studyId}/access-link/${code}`);
  }

  // Templates
  async getTemplates(): Promise<Study[]> {
    const response = await apiClient.get<Study[]>('/studies/templates');
    return response.data;
  }

  async createFromTemplate(templateId: string, title: string): Promise<Study> {
    const response = await apiClient.post<Study>('/studies/from-template', {
      templateId,
      title,
    });
    return response.data;
  }

  async saveAsTemplate(
    studyId: string,
    name: string,
    description: string
  ): Promise<void> {
    await apiClient.post(`/studies/${studyId}/save-template`, {
      name,
      description,
    });
  }
}

// Export singleton instance
export const studyService = new StudyService();

// Export types
export type { StudyService };
