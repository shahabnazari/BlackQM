import apiClient from './config';

export interface StartSessionResponse {
  sessionCode: string;
  studyId: string;
  studyTitle: string;
  studyDescription?: string;
  gridColumns: number;
  gridShape: string;
  gridConfig: any;
}

export interface StudyInfo {
  study: any;
  welcomeMessage?: string;
  consentText?: string;
  settings: {
    enablePreScreening: boolean;
    enablePostSurvey: boolean;
    enableVideoConferencing: boolean;
  };
}

export interface Statement {
  id: string;
  text: string;
  order: number;
}

export interface Progress {
  currentStep: string;
  completedSteps: string[];
  progress: number;
}

export const participantApi = {
  // Start a new participant session
  async startSession(studyId: string, invitationCode?: string): Promise<StartSessionResponse> {
    const { data } = await apiClient.post('/api/participant/session/start', {
      studyId,
      invitationCode,
    });
    return data;
  },

  // Get session information
  async getSession(sessionCode: string) {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}`);
    return data;
  },

  // Get study information
  async getStudyInfo(sessionCode: string): Promise<StudyInfo> {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}/study`);
    return data;
  },

  // Get randomized statements
  async getStatements(sessionCode: string): Promise<Statement[]> {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}/statements`);
    return data;
  },

  // Update progress
  async updateProgress(sessionCode: string, progressData: {
    currentStep: string;
    completedStep?: string;
    stepData?: any;
  }): Promise<Progress> {
    const { data } = await apiClient.put(`/participant/session/${sessionCode}/progress`, progressData);
    return data;
  },

  // Get current progress
  async getProgress(sessionCode: string): Promise<Progress> {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}/progress`);
    return data;
  },

  // Record consent
  async recordConsent(sessionCode: string, consentData: {
    consented: boolean;
    timestamp: string;
  }) {
    const { data } = await apiClient.post(`/participant/session/${sessionCode}/consent`, consentData);
    return data;
  },

  // Submit pre-sort
  async submitPreSort(sessionCode: string, preSortData: {
    disagree: string[];
    neutral: string[];
    agree: string[];
  }) {
    const { data } = await apiClient.post(`/participant/session/${sessionCode}/presort`, preSortData);
    return data;
  },

  // Get pre-sort data
  async getPreSort(sessionCode: string) {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}/presort`);
    return data;
  },

  // Submit Q-sort
  async submitQSort(sessionCode: string, qSortData: {
    grid: Array<{
      position: number;
      statementIds: string[];
    }>;
  }) {
    const { data } = await apiClient.post(`/participant/session/${sessionCode}/qsort`, qSortData);
    return data;
  },

  // Get Q-sort data
  async getQSort(sessionCode: string) {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}/qsort`);
    return data;
  },

  // Submit commentary
  async submitCommentary(sessionCode: string, commentaryData: {
    commentaries: Array<{
      statementId: string;
      position: number;
      comment: string;
    }>;
  }) {
    const { data } = await apiClient.post(`/participant/session/${sessionCode}/commentary`, commentaryData);
    return data;
  },

  // Submit demographics
  async submitDemographics(sessionCode: string, demographics: any) {
    const { data } = await apiClient.post(`/participant/session/${sessionCode}/demographics`, demographics);
    return data;
  },

  // Complete session
  async completeSession(sessionCode: string) {
    const { data } = await apiClient.post(`/participant/session/${sessionCode}/complete`);
    return data;
  },

  // Validate Q-sort
  async validateQSort(sessionCode: string) {
    const { data } = await apiClient.get(`/participant/session/${sessionCode}/validate`);
    return data;
  },
};