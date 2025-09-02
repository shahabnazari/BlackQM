import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { StatementService } from '../study/statement.service';
import { SurveyStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ParticipantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statementService: StatementService,
  ) {}

  async startSession(
    studyId: string,
    invitationCode?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    // Verify study exists and is active
    const study = await this.prisma.survey.findUnique({
      where: { id: studyId },
      include: {
        _count: {
          select: { 
            responses: true,
            statements: true,
          },
        },
      },
    });

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    if (study.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('Study is not currently active');
    }

    if (study._count.statements === 0) {
      throw new BadRequestException('Study has no statements');
    }

    // Check if max responses reached
    if (study.maxResponses && study.currentResponses >= study.maxResponses) {
      throw new BadRequestException('Study has reached maximum number of responses');
    }

    // Generate unique session code
    const sessionCode = this.generateSessionCode();

    // Create response record
    const response = await this.prisma.response.create({
      data: {
        surveyId: studyId,
        sessionCode,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    // Create progress record
    await this.prisma.participantProgress.create({
      data: {
        responseId: response.id,
        currentStep: 'welcome',
        completedSteps: [],
      },
    });

    // Increment response counter
    await this.prisma.survey.update({
      where: { id: studyId },
      data: {
        currentResponses: {
          increment: 1,
        },
      },
    });

    return {
      sessionCode,
      studyId,
      studyTitle: study.title,
      studyDescription: study.description,
      gridColumns: study.gridColumns,
      gridShape: study.gridShape,
      gridConfig: study.gridConfig,
    };
  }

  async getSession(sessionCode: string) {
    const response = await this.prisma.response.findUnique({
      where: { sessionCode },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
            description: true,
            gridColumns: true,
            gridShape: true,
            gridConfig: true,
            enablePreScreening: true,
            enablePostSurvey: true,
            enableVideoConferencing: true,
          },
        },
        progress: true,
      },
    });

    if (!response) {
      throw new NotFoundException('Session not found');
    }

    return response;
  }

  async getStudyInfo(sessionCode: string) {
    const response = await this.getSession(sessionCode);
    
    return {
      study: response.survey,
      welcomeMessage: (response.survey as any).welcomeMessage || '',
      consentText: (response.survey as any).consentText || '',
      settings: {
        enablePreScreening: response.survey.enablePreScreening,
        enablePostSurvey: response.survey.enablePostSurvey,
        enableVideoConferencing: response.survey.enableVideoConferencing,
      },
    };
  }

  async getStatements(sessionCode: string) {
    const response = await this.getSession(sessionCode);
    
    // Get randomized statements
    const statements = await this.statementService.randomize(response.survey.id);
    
    // Cache the randomized order in session data if needed
    await this.prisma.participantProgress.update({
      where: { responseId: response.id },
      data: {
        stepData: {
          ...((response.progress?.stepData as any) || {}),
          statementOrder: statements.map(s => s.id),
        },
      },
    });

    return statements;
  }

  async saveDemographics(sessionCode: string, demographics: any) {
    const response = await this.getSession(sessionCode);

    await this.prisma.response.update({
      where: { id: response.id },
      data: {
        demographics,
      },
    });

    // Update progress
    await this.prisma.participantProgress.update({
      where: { responseId: response.id },
      data: {
        currentStep: 'thank-you',
        completedSteps: {
          push: 'post-survey',
        },
      },
    });

    return { success: true };
  }

  async completeSession(sessionCode: string) {
    const response = await this.getSession(sessionCode);
    
    // Calculate time spent
    const startTime = new Date(response.createdAt).getTime();
    const endTime = Date.now();
    const timeSpent = Math.floor((endTime - startTime) / 1000); // in seconds

    await this.prisma.response.update({
      where: { id: response.id },
      data: {
        completedAt: new Date(),
        timeSpent,
      },
    });

    // Update progress
    await this.prisma.participantProgress.update({
      where: { responseId: response.id },
      data: {
        currentStep: 'thank-you',
        completedSteps: {
          push: 'thank-you',
        },
      },
    });

    return {
      success: true,
      timeSpent,
      completedAt: new Date(),
    };
  }

  private generateSessionCode(): string {
    // Generate a unique session code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`.toUpperCase();
  }
}