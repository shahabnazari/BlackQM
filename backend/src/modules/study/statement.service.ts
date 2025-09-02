import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateStatementDto } from './dto/create-statement.dto';

@Injectable()
export class StatementService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(surveyId: string, statements: CreateStatementDto[]) {
    // Create statements with order
    const statementsWithOrder = statements.map((statement, index) => ({
      ...statement,
      surveyId,
      order: statement.order ?? index + 1,
    }));

    // Use transaction to ensure all statements are created
    return this.prisma.$transaction(
      statementsWithOrder.map((statement) =>
        this.prisma.statement.create({
          data: statement,
        })
      )
    );
  }

  async findByStudy(surveyId: string) {
    return this.prisma.statement.findMany({
      where: { surveyId },
      orderBy: { order: 'asc' },
    });
  }

  async update(id: string, data: { text?: string; order?: number }) {
    return this.prisma.statement.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.prisma.statement.delete({
      where: { id },
    });
  }

  async reorder(surveyId: string, statementIds: string[]) {
    // Update order for all statements
    return this.prisma.$transaction(
      statementIds.map((id, index) =>
        this.prisma.statement.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );
  }

  async randomize(surveyId: string): Promise<any[]> {
    const statements = await this.findByStudy(surveyId);
    
    // Fisher-Yates shuffle algorithm
    const shuffled = [...statements];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
}