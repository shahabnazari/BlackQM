import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SubmitPreSortDto } from './dto/submit-presort.dto';
import { SubmitQSortDto } from './dto/submit-qsort.dto';
import { SubmitCommentaryDto } from './dto/submit-commentary.dto';

@Injectable()
export class QSortService {
  constructor(private readonly prisma: PrismaService) {}

  async savePreSort(sessionCode: string, preSortData: SubmitPreSortDto) {
    const response = await this.getResponse(sessionCode);

    // Check if pre-sort already exists
    const existing = await this.prisma.preSort.findUnique({
      where: { responseId: response.id },
    });

    if (existing) {
      // Update existing pre-sort
      await this.prisma.preSort.update({
        where: { id: existing.id },
        data: {
          disagree: preSortData.disagree,
          neutral: preSortData.neutral,
          agree: preSortData.agree,
          completedAt: new Date(),
        },
      });
    } else {
      // Create new pre-sort
      await this.prisma.preSort.create({
        data: {
          responseId: response.id,
          disagree: preSortData.disagree,
          neutral: preSortData.neutral,
          agree: preSortData.agree,
        },
      });
    }

    // Update progress
    await this.updateProgress(response.id, 'q-sort', 'pre-sorting');

    return { success: true };
  }

  async getPreSort(sessionCode: string) {
    const response = await this.getResponse(sessionCode);
    
    const preSort = await this.prisma.preSort.findUnique({
      where: { responseId: response.id },
    });

    if (!preSort) {
      return null;
    }

    // Get statement details for the IDs
    const allStatementIds = [
      ...(preSort.disagree as string[]),
      ...(preSort.neutral as string[]),
      ...(preSort.agree as string[]),
    ];

    const statements = await this.prisma.statement.findMany({
      where: {
        id: { in: allStatementIds },
      },
    });

    const statementMap = new Map(statements.map(s => [s.id, s]));

    return {
      disagree: (preSort.disagree as string[]).map(id => statementMap.get(id)),
      neutral: (preSort.neutral as string[]).map(id => statementMap.get(id)),
      agree: (preSort.agree as string[]).map(id => statementMap.get(id)),
    };
  }

  async saveQSort(sessionCode: string, qSortData: SubmitQSortDto) {
    const response = await this.getResponse(sessionCode);

    // Validate grid configuration
    const study = await this.prisma.survey.findUnique({
      where: { id: response.surveyId },
      select: { gridConfig: true, statements: true },
    });

    if (!study) {
      throw new BadRequestException('Study not found');
    }

    // Validate all statements are placed
    const placedStatementIds = new Set(qSortData.grid.flatMap(col => col.statementIds));
    if (placedStatementIds.size !== study.statements.length) {
      throw new BadRequestException('All statements must be placed in the grid');
    }

    // Delete existing Q-sort data
    await this.prisma.qSort.deleteMany({
      where: { responseId: response.id },
    });

    // Save new Q-sort data
    const qSortRecords = [];
    for (const column of qSortData.grid) {
      for (const statementId of column.statementIds) {
        qSortRecords.push({
          responseId: response.id,
          statementId,
          position: column.position,
        });
      }
    }

    await this.prisma.qSort.createMany({
      data: qSortRecords,
    });

    // Update progress
    await this.updateProgress(response.id, 'commentary', 'q-sort');

    return { success: true };
  }

  async getQSort(sessionCode: string) {
    const response = await this.getResponse(sessionCode);
    
    const qSorts = await this.prisma.qSort.findMany({
      where: { responseId: response.id },
      include: {
        statement: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Group by position
    const grid = new Map<number, any[]>();
    for (const qSort of qSorts) {
      if (!grid.has(qSort.position)) {
        grid.set(qSort.position, []);
      }
      grid.get(qSort.position)?.push({
        id: qSort.statement.id,
        text: qSort.statement.text,
        position: qSort.position,
      });
    }

    return Array.from(grid.entries()).map(([position, statements]) => ({
      position,
      statements,
    }));
  }

  async saveCommentary(sessionCode: string, commentaryData: SubmitCommentaryDto) {
    const response = await this.getResponse(sessionCode);

    // Save each commentary
    for (const comment of commentaryData.commentaries) {
      const wordCount = comment.comment.split(/\s+/).filter(Boolean).length;
      
      await this.prisma.commentary.create({
        data: {
          responseId: response.id,
          statementId: comment.statementId,
          position: comment.position,
          comment: comment.comment,
          wordCount,
        },
      });
    }

    // Update progress
    await this.updateProgress(response.id, 'post-survey', 'commentary');

    return { success: true };
  }

  async validateQSort(sessionCode: string) {
    const response = await this.getResponse(sessionCode);
    
    const [study, qSortCount, preSort] = await Promise.all([
      this.prisma.survey.findUnique({
        where: { id: response.surveyId },
        select: {
          gridConfig: true,
          _count: {
            select: { statements: true },
          },
        },
      }),
      this.prisma.qSort.count({
        where: { responseId: response.id },
      }),
      this.prisma.preSort.findUnique({
        where: { responseId: response.id },
      }),
    ]);

    if (!study) {
      throw new BadRequestException('Study not found');
    }

    const expectedStatements = study._count.statements;
    const isComplete = qSortCount === expectedStatements;
    const hasPreSort = !!preSort;

    // Check column constraints
    const qSorts = await this.prisma.qSort.findMany({
      where: { responseId: response.id },
    });

    const columnCounts = new Map<number, number>();
    for (const qSort of qSorts) {
      columnCounts.set(qSort.position, (columnCounts.get(qSort.position) || 0) + 1);
    }

    const gridConfig = study.gridConfig as any[];
    const violations = [];
    
    for (const column of gridConfig) {
      const count = columnCounts.get(column.position) || 0;
      if (count > column.maxItems) {
        violations.push({
          position: column.position,
          maxAllowed: column.maxItems,
          current: count,
        });
      }
    }

    return {
      isValid: isComplete && violations.length === 0,
      isComplete,
      hasPreSort,
      placedStatements: qSortCount,
      expectedStatements,
      violations,
    };
  }

  private async getResponse(sessionCode: string) {
    const response = await this.prisma.response.findUnique({
      where: { sessionCode },
    });

    if (!response) {
      throw new NotFoundException('Session not found');
    }

    return response;
  }

  private async updateProgress(responseId: string, nextStep: string, completedStep: string) {
    const progress = await this.prisma.participantProgress.findUnique({
      where: { responseId },
    });

    const completedSteps = progress?.completedSteps as string[] || [];
    if (!completedSteps.includes(completedStep)) {
      completedSteps.push(completedStep);
    }

    await this.prisma.participantProgress.update({
      where: { responseId },
      data: {
        currentStep: nextStep,
        completedSteps,
        lastActiveAt: new Date(),
      },
    });
  }
}