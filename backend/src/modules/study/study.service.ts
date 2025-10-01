import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
import { SurveyStatus, Prisma } from '@prisma/client';

@Injectable()
export class StudyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStudyDto & { createdBy: string }) {
    // Generate default grid configuration for Q-sort
    const gridConfig = this.generateGridConfig(
      data.gridColumns || 9,
      data.gridShape || 'quasi-normal',
    );

    // Extract DTO fields and properly set creator
    const {
      createdBy,
      consentForm,
      includeWelcomeVideo,
      welcomeVideoUrl,
      requireSignature,
      signatureType,
      organizationName,
      organizationLogoUrl,
      ...studyData
    } = data;

    // Build settings object for additional fields
    const settings = {
      includeWelcomeVideo,
      welcomeVideoUrl,
      requireSignature,
      signatureType,
      organizationName,
      organizationLogoUrl,
    };

    return this.prisma.survey.create({
      data: {
        ...studyData,
        consentText: consentForm || data.consentText,
        gridConfig,
        settings,
        status: SurveyStatus.DRAFT,
        creator: {
          connect: { id: createdBy },
        },
      },
      include: {
        statements: true,
        _count: {
          select: {
            responses: true,
            statements: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, status?: SurveyStatus) {
    const where: Prisma.SurveyWhereInput = {
      createdBy: userId,
      ...(status && { status }),
    };

    return this.prisma.survey.findMany({
      where,
      include: {
        _count: {
          select: {
            responses: true,
            statements: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const study = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        statements: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            responses: true,
            statements: true,
            questions: true,
          },
        },
      },
    });

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    // Check if user has access to this study
    if (study.createdBy !== userId) {
      // Check if user is a collaborator
      const collaboration = await this.prisma.collaboration.findFirst({
        where: {
          studyId: id,
          userId,
        },
      });

      if (!collaboration) {
        throw new ForbiddenException('Access denied to this study');
      }
    }

    return study;
  }

  async update(id: string, updateData: UpdateStudyDto, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    // If grid configuration is being updated, regenerate the config
    let gridConfig = undefined;
    if (updateData.gridColumns || updateData.gridShape) {
      const study = await this.prisma.survey.findUnique({
        where: { id },
        select: { gridColumns: true, gridShape: true },
      });

      if (!study) {
        throw new NotFoundException(`Study with ID ${id} not found`);
      }

      gridConfig = this.generateGridConfig(
        updateData.gridColumns || study.gridColumns,
        updateData.gridShape || study.gridShape,
      );
    }

    return this.prisma.survey.update({
      where: { id },
      data: {
        ...updateData,
        ...(gridConfig && { gridConfig }),
      },
      include: {
        statements: true,
        _count: {
          select: {
            responses: true,
            statements: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    const study = await this.findOne(id, userId);

    if (study.createdBy !== userId) {
      throw new ForbiddenException('Only the study owner can delete it');
    }

    await this.prisma.survey.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: SurveyStatus, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    // Validate status transition
    const study = await this.prisma.survey.findUnique({
      where: { id },
      select: { status: true, statements: true },
    });

    if (!study) {
      throw new NotFoundException(`Study with ID ${id} not found`);
    }

    // Don't allow activating without statements
    if (status === SurveyStatus.ACTIVE && study.statements.length === 0) {
      throw new ForbiddenException('Cannot activate study without statements');
    }

    return this.prisma.survey.update({
      where: { id },
      data: {
        status,
        ...(status === SurveyStatus.ACTIVE && {
          scheduledStart: new Date(),
        }),
      },
    });
  }

  async getStatistics(id: string, userId: string) {
    const study = await this.findOne(id, userId);

    const [responses, completedResponses, avgTimeSpent] = await Promise.all([
      // Total responses
      this.prisma.response.count({
        where: { surveyId: id },
      }),
      // Completed responses
      this.prisma.response.count({
        where: {
          surveyId: id,
          completedAt: { not: null },
        },
      }),
      // Average time spent
      this.prisma.response.aggregate({
        where: {
          surveyId: id,
          timeSpent: { not: null },
        },
        _avg: {
          timeSpent: true,
        },
      }),
    ]);

    const completionRate =
      responses > 0 ? Math.round((completedResponses / responses) * 100) : 0;

    return {
      totalResponses: responses,
      completedResponses,
      completionRate,
      averageTimeSpent: avgTimeSpent._avg.timeSpent || 0,
      statementCount: study._count.statements,
      questionCount: study._count.questions,
    };
  }

  private generateGridConfig(columns: number, shape: string) {
    // Generate grid configuration based on shape
    const configs = {
      'quasi-normal': {
        5: [1, 2, 3, 2, 1],
        7: [1, 2, 3, 4, 3, 2, 1],
        9: [1, 2, 3, 3, 4, 3, 3, 2, 1],
        11: [1, 2, 3, 4, 4, 5, 4, 4, 3, 2, 1],
        13: [1, 2, 3, 4, 5, 5, 6, 5, 5, 4, 3, 2, 1],
      },
      forced: {
        5: [2, 3, 4, 3, 2],
        7: [2, 3, 4, 5, 4, 3, 2],
        9: [2, 3, 4, 5, 6, 5, 4, 3, 2],
        11: [2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2],
        13: [2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2],
      },
      free: {
        5: [10, 10, 10, 10, 10],
        7: [10, 10, 10, 10, 10, 10, 10],
        9: [10, 10, 10, 10, 10, 10, 10, 10, 10],
        11: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        13: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      },
    };

    const distribution =
      (configs as any)[shape]?.[columns] || configs['quasi-normal'][9];

    // Create column configuration
    const gridColumns = [];
    const midPoint = Math.floor(columns / 2);

    for (let i = 0; i < columns; i++) {
      gridColumns.push({
        position: i - midPoint,
        maxItems: distribution[i],
        label: this.getColumnLabel(i - midPoint),
      });
    }

    return gridColumns;
  }

  private getColumnLabel(position: number): string {
    const labels = {
      '-4': 'Strongly Disagree',
      '-3': 'Disagree',
      '-2': 'Somewhat Disagree',
      '-1': 'Slightly Disagree',
      '0': 'Neutral',
      '1': 'Slightly Agree',
      '2': 'Somewhat Agree',
      '3': 'Agree',
      '4': 'Strongly Agree',
    };
    return (labels as any)[position.toString()] || `Position ${position}`;
  }

  async generatePreview(studyData: CreateStudyDto, userId: string) {
    // Generate grid configuration for preview
    const gridConfig = this.generateGridConfig(
      studyData.gridColumns || 9,
      studyData.gridShape || 'quasi-normal',
    );

    // Create preview object that shows how the study will appear to participants
    const preview = {
      participantView: {
        welcome: {
          title: studyData.title,
          message: studyData.welcomeMessage || studyData.consentText || '',
          videoUrl: studyData.welcomeVideoUrl || '',
          includeVideo: studyData.includeWelcomeVideo || false,
        },
        consent: {
          form: studyData.consentForm || studyData.consentText || '',
          requireSignature: studyData.requireSignature || false,
          signatureType: studyData.signatureType || 'typed',
          organizationName: studyData.organizationName || '',
          organizationLogoUrl: studyData.organizationLogoUrl || '',
        },
        preScreening: {
          enabled: studyData.enablePreScreening || false,
          questions: [], // Will be populated when pre-screening questions are added
        },
        qSort: {
          gridConfig,
          gridColumns: studyData.gridColumns || 9,
          gridShape: studyData.gridShape || 'quasi-normal',
          statements: [], // Will be populated with actual statements
        },
        postSurvey: {
          enabled: studyData.enablePostSurvey !== false,
          questions: [], // Will be populated when post-survey questions are added
        },
      },
      metadata: {
        totalSteps: this.calculateTotalSteps(studyData),
        estimatedTime: this.estimateCompletionTime(studyData),
        features: {
          videoConferencing: studyData.enableVideoConferencing || false,
          preScreening: studyData.enablePreScreening || false,
          postSurvey: studyData.enablePostSurvey !== false,
          digitalSignature: studyData.requireSignature || false,
        },
      },
    };

    return preview;
  }

  async getPreview(id: string, userId: string) {
    // Get the study with all related data
    const study = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        statements: {
          orderBy: { order: 'asc' },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!study) {
      throw new NotFoundException(`Study with ID ${id} not found`);
    }

    if (study.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to preview this study',
      );
    }

    // Parse settings for additional configuration
    const settings = (study.settings as any) || {};
    const preScreeningQuestions = study.questions.filter(
      (q: any) => q.type === 'PRE_SCREENING',
    );
    const postSurveyQuestions = study.questions.filter(
      (q: any) => q.type === 'POST_SURVEY',
    );

    // Generate preview with actual data
    const preview = {
      participantView: {
        welcome: {
          title: study.title,
          message: study.welcomeMessage || '',
          videoUrl: settings.welcomeVideoUrl || '',
          includeVideo: settings.includeWelcomeVideo || false,
        },
        consent: {
          form: study.consentText || '',
          requireSignature: settings.requireSignature || false,
          signatureType: settings.signatureType || 'typed',
          organizationName: settings.organizationName || '',
          organizationLogoUrl: settings.organizationLogoUrl || '',
        },
        preScreening: {
          enabled: study.enablePreScreening,
          questions: preScreeningQuestions,
        },
        qSort: {
          gridConfig: study.gridConfig,
          gridColumns: study.gridColumns,
          gridShape: study.gridShape,
          statements: study.statements.map((s: any) => ({
            id: s.id,
            text: s.text,
            order: s.order,
          })),
        },
        postSurvey: {
          enabled: study.enablePostSurvey,
          questions: postSurveyQuestions,
        },
      },
      metadata: {
        studyId: study.id,
        status: study.status,
        totalSteps: this.calculateTotalSteps(study),
        estimatedTime: this.estimateCompletionTime(study),
        features: {
          videoConferencing: study.enableVideoConferencing,
          preScreening: study.enablePreScreening,
          postSurvey: study.enablePostSurvey,
          digitalSignature: settings.requireSignature || false,
        },
      },
    };

    return preview;
  }

  private calculateTotalSteps(studyData: any): number {
    let steps = 3; // Welcome, Consent, Q-Sort (minimum)
    if (studyData.enablePreScreening) steps++;
    if (studyData.enablePostSurvey) steps++;
    if (studyData.requireSignature) steps++;
    return steps;
  }

  private estimateCompletionTime(studyData: any): number {
    let minutes = 15; // Base time for Q-Sort
    if (studyData.enablePreScreening) minutes += 5;
    if (studyData.enablePostSurvey) minutes += 10;
    if (studyData.includeWelcomeVideo) minutes += 5;
    return minutes;
  }

  /**
   * Create a study from literature review
   */
  async createFromLiterature(dto: {
    literatureReviewId: string;
    basedOnPapers: string[];
    researchGapId?: string;
    autoGenerate: {
      statements: boolean;
      methodology: boolean;
      gridConfig: boolean;
    };
    userId: string;
  }): Promise<any> {
    // For now, return a mock study to get the server running
    return {
      id: 'mock-study-id',
      statements: dto.autoGenerate.statements
        ? ['Statement 1', 'Statement 2']
        : [],
      methodology: dto.autoGenerate.methodology
        ? 'Q-Methodology approach'
        : null,
      gridConfig: dto.autoGenerate.gridConfig ? { columns: 9, rows: 5 } : null,
      literatureReviewId: dto.literatureReviewId,
      basedOnPapers: dto.basedOnPapers,
      researchGapId: dto.researchGapId,
      userId: dto.userId,
    };
  }
}
