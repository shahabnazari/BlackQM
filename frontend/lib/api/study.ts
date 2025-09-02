import apiClient from './config';

export interface Study {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
  gridColumns: number;
  gridShape: string;
  gridConfig?: any;
  welcomeMessage?: string;
  consentText?: string;
  enablePreScreening: boolean;
  enablePostSurvey: boolean;
  enableVideoConferencing: boolean;
  _count?: {
    responses: number;
    statements: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyDto {
  title: string;
  description?: string;
  welcomeMessage?: string;
  consentText?: string;
  gridColumns?: number;
  gridShape?: string;
  enablePreScreening?: boolean;
  enablePostSurvey?: boolean;
  enableVideoConferencing?: boolean;
  maxResponses?: number;
  settings?: any;
}

export interface Statement {
  id: string;
  text: string;
  order: number;
}

export interface StudyStatistics {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  averageTimeSpent: number;
  statementCount: number;
  questionCount: number;
}

export const studyApi = {
  // Create a new study
  async createStudy(studyData: CreateStudyDto): Promise<Study> {
    const { data } = await apiClient.post('/studies', studyData);
    return data;
  },

  // Get all studies for the current user
  async getStudies(status?: string): Promise<Study[]> {
    const params = status ? { status } : {};
    const { data } = await apiClient.get('/studies', { params });
    return data;
  },

  // Get a specific study
  async getStudy(id: string): Promise<Study> {
    const { data } = await apiClient.get(`/studies/${id}`);
    return data;
  },

  // Update a study
  async updateStudy(id: string, studyData: Partial<CreateStudyDto>): Promise<Study> {
    const { data } = await apiClient.put(`/studies/${id}`, studyData);
    return data;
  },

  // Delete a study
  async deleteStudy(id: string): Promise<void> {
    await apiClient.delete(`/studies/${id}`);
  },

  // Update study status
  async updateStudyStatus(id: string, status: Study['status']): Promise<Study> {
    const { data } = await apiClient.put(`/studies/${id}/status`, { status });
    return data;
  },

  // Add statements to a study
  async addStatements(studyId: string, statements: Array<{ text: string; order?: number }>): Promise<Statement[]> {
    const { data } = await apiClient.post(`/studies/${studyId}/statements`, statements);
    return data;
  },

  // Get all statements for a study
  async getStatements(studyId: string): Promise<Statement[]> {
    const { data } = await apiClient.get(`/studies/${studyId}/statements`);
    return data;
  },

  // Update a statement
  async updateStatement(studyId: string, statementId: string, updateData: { text?: string; order?: number }): Promise<Statement> {
    const { data } = await apiClient.put(`/studies/${studyId}/statements/${statementId}`, updateData);
    return data;
  },

  // Delete a statement
  async deleteStatement(studyId: string, statementId: string): Promise<void> {
    await apiClient.delete(`/studies/${studyId}/statements/${statementId}`);
  },

  // Get study statistics
  async getStatistics(id: string): Promise<StudyStatistics> {
    const { data } = await apiClient.get(`/studies/${id}/statistics`);
    return data;
  },
};