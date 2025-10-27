import { CreateStudyDto, Statement, Study, studyService } from './services';

// Re-export types from service for backward compatibility
export type { CreateStudyDto, Statement, Study };

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
    return await studyService.createStudy(studyData);
  },

  // Get all studies for the current user
  async getStudies(status?: string): Promise<Study[]> {
    const response = await studyService.getStudies({
      status: status as Study['status'],
    });
    return response.data || [];
  },

  // Get a specific study
  async getStudy(id: string): Promise<Study> {
    return await studyService.getStudy(id);
  },

  // Update a study
  async updateStudy(
    id: string,
    studyData: Partial<CreateStudyDto>
  ): Promise<Study> {
    return await studyService.updateStudy(id, studyData);
  },

  // Delete a study
  async deleteStudy(id: string): Promise<void> {
    await studyService.deleteStudy(id);
  },

  // Update study status
  async updateStudyStatus(id: string, status: Study['status']): Promise<Study> {
    return await studyService.updateStudy(id, { status });
  },

  // Add statements to a study
  async addStatements(
    studyId: string,
    statements: Array<{ text: string; order?: number }>
  ): Promise<Statement[]> {
    const statementsToAdd = statements.map((s, index) => ({
      text: s.text,
      order: s.order ?? index,
      category: '',
    }));
    return await studyService.addStatements(studyId, statementsToAdd);
  },

  // Get all statements for a study
  async getStatements(studyId: string): Promise<Statement[]> {
    const study = await studyService.getStudy(studyId);
    return study.settings?.statements || [];
  },

  // Update a statement
  async updateStatement(
    studyId: string,
    statementId: string,
    updateData: { text?: string; order?: number }
  ): Promise<Statement> {
    return await studyService.updateStatement(
      studyId,
      statementId,
      updateData as Partial<Statement>
    );
  },

  // Delete a statement
  async deleteStatement(studyId: string, statementId: string): Promise<void> {
    await studyService.deleteStatement(studyId, statementId);
  },

  // Get study statistics
  async getStatistics(id: string): Promise<StudyStatistics> {
    const stats = await studyService.getStatistics(id);
    return {
      totalResponses: stats.totalParticipants,
      completedResponses: stats.completedSorts,
      completionRate: stats.responseRate,
      averageTimeSpent: stats.averageCompletionTime,
      statementCount: 0, // This will need to be calculated from the study settings
      questionCount: 0, // This will need to be calculated from the study settings
    };
  },
};
