import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProgress(sessionCode: string, progressData: UpdateProgressDto) {
    const response = await this.getResponse(sessionCode);
    
    const progress = await this.prisma.participantProgress.findUnique({
      where: { responseId: response.id },
    });

    if (!progress) {
      throw new NotFoundException('Progress record not found');
    }

    const completedSteps = progress.completedSteps as string[] || [];
    
    // Add completed step if provided
    if (progressData.completedStep && !completedSteps.includes(progressData.completedStep)) {
      completedSteps.push(progressData.completedStep);
    }

    // Update step data if provided
    const stepData = (progress.stepData as any) || {};
    if (progressData.stepData) {
      stepData[progressData.currentStep] = progressData.stepData;
    }

    await this.prisma.participantProgress.update({
      where: { responseId: response.id },
      data: {
        currentStep: progressData.currentStep,
        completedSteps,
        stepData,
        lastActiveAt: new Date(),
      },
    });

    return {
      currentStep: progressData.currentStep,
      completedSteps,
      progress: this.calculateProgress(completedSteps),
    };
  }

  async getProgress(sessionCode: string) {
    const response = await this.getResponse(sessionCode);
    
    const progress = await this.prisma.participantProgress.findUnique({
      where: { responseId: response.id },
    });

    if (!progress) {
      throw new NotFoundException('Progress record not found');
    }

    const completedSteps = progress.completedSteps as string[] || [];

    return {
      currentStep: progress.currentStep,
      completedSteps,
      stepData: progress.stepData,
      lastActiveAt: progress.lastActiveAt,
      progress: this.calculateProgress(completedSteps),
    };
  }

  async recordConsent(sessionCode: string, consentData: any) {
    const response = await this.getResponse(sessionCode);
    
    const progress = await this.prisma.participantProgress.findUnique({
      where: { responseId: response.id },
    });

    const stepData = (progress?.stepData as any) || {};
    stepData.consent = consentData;

    const completedSteps = progress?.completedSteps as string[] || [];
    if (!completedSteps.includes('consent')) {
      completedSteps.push('consent');
    }

    await this.prisma.participantProgress.update({
      where: { responseId: response.id },
      data: {
        currentStep: 'familiarization',
        completedSteps,
        stepData,
        lastActiveAt: new Date(),
      },
    });

    return { success: true };
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

  private calculateProgress(completedSteps: string[]): number {
    const totalSteps = [
      'pre-screening',
      'welcome',
      'consent',
      'familiarization',
      'pre-sorting',
      'q-sort',
      'commentary',
      'post-survey',
      'thank-you',
    ];

    const completedCount = totalSteps.filter(step => 
      completedSteps.includes(step)
    ).length;

    return Math.round((completedCount / totalSteps.length) * 100);
  }
}