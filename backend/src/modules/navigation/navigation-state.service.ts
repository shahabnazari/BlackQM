import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export enum ResearchPhase {
  DISCOVER = 'discover',
  DESIGN = 'design',
  BUILD = 'build',
  RECRUIT = 'recruit',
  COLLECT = 'collect',
  ANALYZE = 'analyze',
  VISUALIZE = 'visualize',
  INTERPRET = 'interpret',
  REPORT = 'report',
  ARCHIVE = 'archive',
}

export interface PhaseProgress {
  phase: ResearchPhase;
  progress: number; // 0-100
  completedActions: string[];
  availableActions: string[];
  lastUpdated: Date;
}

export interface NavigationState {
  userId: string;
  studyId?: string;
  currentPhase: ResearchPhase;
  currentTool?: string;
  phaseProgress: Record<ResearchPhase, number>;
  completedPhases: ResearchPhase[];
  availablePhases: ResearchPhase[];
  preferences: {
    compactMode?: boolean;
    showShortcuts?: boolean;
    theme?: string;
  };
}

@Injectable()
@WebSocketGateway({ namespace: 'navigation' })
export class NavigationStateService {
  @WebSocketServer()
  server: Server = null as any;

  constructor(private prisma: PrismaService) {}

  /**
   * Get navigation state for a user
   */
  async getNavigationState(
    userId: string,
    studyId?: string,
  ): Promise<NavigationState> {
    // Get user's current study context
    const study = studyId
      ? await this.prisma.survey.findUnique({
          where: { id: studyId },
          include: {
            statements: true,
            questions: true,
            responses: true,
          },
        })
      : null;

    // Calculate available phases based on study progress
    const availablePhases = await this.calculateAvailablePhases(userId, study);

    // Calculate phase progress
    const phaseProgress = await this.calculatePhaseProgress(userId, study);

    // Get user preferences
    const preferences = await this.getUserNavigationPreferences(userId);

    return {
      userId,
      studyId,
      currentPhase: await this.getCurrentPhase(userId, study),
      phaseProgress,
      completedPhases: Object.entries(phaseProgress)
        .filter(([_, progress]) => progress === 100)
        .map(([phase]) => phase as ResearchPhase),
      availablePhases,
      preferences,
    };
  }

  /**
   * Update current phase for a user
   */
  async updateCurrentPhase(
    userId: string,
    phase: ResearchPhase,
    studyId?: string,
  ): Promise<void> {
    // Store in database (extend User model with navigation state)
    // For now, emit through WebSocket
    this.server.emit('phaseChanged', {
      userId,
      studyId,
      phase,
      timestamp: new Date(),
    });
  }

  /**
   * Calculate available phases based on study progress
   */
  private async calculateAvailablePhases(
    userId: string,
    study: any,
  ): Promise<ResearchPhase[]> {
    const available: ResearchPhase[] = [
      ResearchPhase.DISCOVER,
      ResearchPhase.DESIGN,
    ];

    if (study) {
      // Has study design
      if (study.title && study.description) {
        available.push(ResearchPhase.BUILD);
      }

      // Has instruments (statements/questions)
      if (study.statements?.length > 0 || study.questions?.length > 0) {
        available.push(ResearchPhase.RECRUIT);
        available.push(ResearchPhase.COLLECT);
      }

      // Has data
      if (study.responses?.length > 0) {
        available.push(ResearchPhase.ANALYZE);
        available.push(ResearchPhase.VISUALIZE);
      }

      // Has analysis (check for analysis records)
      const hasAnalysis = await this.checkAnalysisExists(study.id);
      if (hasAnalysis) {
        available.push(ResearchPhase.INTERPRET);
        available.push(ResearchPhase.REPORT);
      }

      // Is complete
      if (study.status === 'COMPLETED') {
        available.push(ResearchPhase.ARCHIVE);
      }
    }

    return available;
  }

  /**
   * Calculate progress for each phase
   */
  private async calculatePhaseProgress(
    userId: string,
    study: any,
  ): Promise<Record<ResearchPhase, number>> {
    const progress: Record<ResearchPhase, number> = {
      [ResearchPhase.DISCOVER]: 0,
      [ResearchPhase.DESIGN]: 0,
      [ResearchPhase.BUILD]: 0,
      [ResearchPhase.RECRUIT]: 0,
      [ResearchPhase.COLLECT]: 0,
      [ResearchPhase.ANALYZE]: 0,
      [ResearchPhase.VISUALIZE]: 0,
      [ResearchPhase.INTERPRET]: 0,
      [ResearchPhase.REPORT]: 0,
      [ResearchPhase.ARCHIVE]: 0,
    };

    if (!study) return progress;

    // DISCOVER: Check for literature searches
    // (Will be implemented in Phase 9)

    // DESIGN: Check for research questions and methodology
    if (study.researchQuestion) progress[ResearchPhase.DESIGN] += 50;
    if (study.methodology) progress[ResearchPhase.DESIGN] += 50;

    // BUILD: Check for statements and grid configuration
    if (study.statements?.length > 0) progress[ResearchPhase.BUILD] += 33;
    if (study.gridConfig) progress[ResearchPhase.BUILD] += 33;
    if (study.questions?.length > 0) progress[ResearchPhase.BUILD] += 34;

    // RECRUIT: Check for participants
    const participants = await this.prisma.participant.count({
      where: { studyId: study.id },
    });
    if (participants > 0) {
      progress[ResearchPhase.RECRUIT] = Math.min(
        100,
        (participants / (study.targetParticipants || 30)) * 100,
      );
    }

    // COLLECT: Check for responses
    const responses = study.responses?.length || 0;
    if (responses > 0) {
      progress[ResearchPhase.COLLECT] = Math.min(
        100,
        (responses / (study.targetParticipants || 30)) * 100,
      );
    }

    // ANALYZE: Check for analysis completion
    const hasAnalysis = await this.checkAnalysisExists(study.id);
    if (hasAnalysis) progress[ResearchPhase.ANALYZE] = 100;

    // VISUALIZE: Check for generated visualizations
    const hasVisualizations = await this.checkVisualizationsExist(study.id);
    if (hasVisualizations) progress[ResearchPhase.VISUALIZE] = 100;

    // INTERPRET: Check for interpretations
    const hasInterpretation = await this.checkInterpretationExists(study.id);
    if (hasInterpretation) progress[ResearchPhase.INTERPRET] = 100;

    // REPORT: Check for generated reports
    const hasReport = await this.checkReportExists(study.id);
    if (hasReport) progress[ResearchPhase.REPORT] = 100;

    // ARCHIVE: Check if study is archived
    if (study.isArchived) progress[ResearchPhase.ARCHIVE] = 100;

    return progress;
  }

  /**
   * Get current phase based on study progress
   */
  private async getCurrentPhase(
    userId: string,
    study: any,
  ): Promise<ResearchPhase> {
    if (!study) return ResearchPhase.DISCOVER;

    // Check phases in order and return the first incomplete one
    const phaseOrder: ResearchPhase[] = [
      ResearchPhase.DISCOVER,
      ResearchPhase.DESIGN,
      ResearchPhase.BUILD,
      ResearchPhase.RECRUIT,
      ResearchPhase.COLLECT,
      ResearchPhase.ANALYZE,
      ResearchPhase.VISUALIZE,
      ResearchPhase.INTERPRET,
      ResearchPhase.REPORT,
      ResearchPhase.ARCHIVE,
    ];

    const progress = await this.calculatePhaseProgress(userId, study);

    for (const phase of phaseOrder) {
      if (progress[phase] < 100) {
        return phase;
      }
    }

    return ResearchPhase.ARCHIVE;
  }

  /**
   * Get user navigation preferences
   */
  private async getUserNavigationPreferences(userId: string): Promise<any> {
    // TODO: Implement user preferences storage
    return {
      compactMode: false,
      showShortcuts: true,
      theme: 'light',
    };
  }

  /**
   * Check if analysis exists for a study
   */
  private async checkAnalysisExists(studyId: string): Promise<boolean> {
    // TODO: Check actual analysis records
    return false;
  }

  /**
   * Check if visualizations exist for a study
   */
  private async checkVisualizationsExist(studyId: string): Promise<boolean> {
    // TODO: Check actual visualization records
    return false;
  }

  /**
   * Check if interpretation exists for a study
   */
  private async checkInterpretationExists(studyId: string): Promise<boolean> {
    // TODO: Check actual interpretation records
    return false;
  }

  /**
   * Check if report exists for a study
   */
  private async checkReportExists(studyId: string): Promise<boolean> {
    // TODO: Check actual report records
    return false;
  }

  /**
   * Track action completion
   */
  async trackActionCompletion(
    userId: string,
    studyId: string,
    phase: ResearchPhase,
    action: string,
  ): Promise<void> {
    // Track user actions for progress calculation
    this.server.emit('actionCompleted', {
      userId,
      studyId,
      phase,
      action,
      timestamp: new Date(),
    });

    // Recalculate and broadcast updated state
    const newState = await this.getNavigationState(userId, studyId);
    this.server.emit('stateUpdated', newState);
  }

  /**
   * Get phase metadata
   */
  getPhaseMetadata(phase: ResearchPhase): any {
    const metadata = {
      [ResearchPhase.DISCOVER]: {
        label: 'Discover',
        description: 'Literature review & research foundation',
        icon: 'BookOpenIcon',
        color: '#8B5CF6',
        tools: [
          'Literature Search',
          'Reference Manager',
          'Knowledge Map',
          'Research Gaps',
          'Prior Studies',
        ],
      },
      [ResearchPhase.DESIGN]: {
        label: 'Design',
        description: 'Formulate questions & methodology',
        icon: 'LightBulbIcon',
        color: '#F59E0B',
        tools: [
          'Research Questions',
          'Hypothesis Builder',
          'Methodology Selection',
          'Study Protocol',
          'Ethics Review',
        ],
      },
      [ResearchPhase.BUILD]: {
        label: 'Build',
        description: 'Create study instruments',
        icon: 'WrenchIcon',
        color: '#3B82F6',
        tools: [
          'Study Setup',
          'Q-Grid Designer',
          'Statement Generator',
          'Questionnaire Builder',
          'Consent Forms',
        ],
      },
      [ResearchPhase.RECRUIT]: {
        label: 'Recruit',
        description: 'Find & manage participants',
        icon: 'UsersIcon',
        color: '#10B981',
        tools: [
          'Participant Pool',
          'Invitations',
          'Pre-Screening',
          'Scheduling',
          'Compensation',
        ],
      },
      [ResearchPhase.COLLECT]: {
        label: 'Collect',
        description: 'Gather research data',
        icon: 'ClipboardDocumentListIcon',
        color: '#14B8A6',
        tools: [
          'Active Sessions',
          'Q-Sort Interface',
          'Post-Survey',
          'Progress Tracker',
          'Quality Control',
        ],
      },
      [ResearchPhase.ANALYZE]: {
        label: 'Analyze',
        description: 'Statistical analysis & patterns',
        icon: 'BeakerIcon',
        color: '#6366F1',
        tools: [
          'Analysis Hub',
          'Q-Analysis',
          'Statistical Tests',
          'Factor Rotation',
          'AI Insights',
        ],
      },
      [ResearchPhase.VISUALIZE]: {
        label: 'Visualize',
        description: 'Create charts & visualizations',
        icon: 'ChartBarIcon',
        color: '#EC4899',
        tools: [
          'Factor Arrays',
          'Loading Plots',
          'Heat Maps',
          'Distribution Charts',
          'Custom Dashboards',
        ],
      },
      [ResearchPhase.INTERPRET]: {
        label: 'Interpret',
        description: 'Extract meaning & insights',
        icon: 'DocumentTextIcon',
        color: '#FB923C',
        tools: [
          'Factor Interpretation',
          'Consensus Analysis',
          'Theme Extraction',
          'Quote Mining',
          'Synthesis',
        ],
      },
      [ResearchPhase.REPORT]: {
        label: 'Report',
        description: 'Document & share findings',
        icon: 'DocumentIcon',
        color: '#EF4444',
        tools: [
          'Report Generator',
          'Executive Summary',
          'Publication Export',
          'Presentation Mode',
          'Collaboration',
        ],
      },
      [ResearchPhase.ARCHIVE]: {
        label: 'Archive',
        description: 'Store & share research',
        icon: 'ArchiveBoxIcon',
        color: '#6B7280',
        tools: [
          'Study Archive',
          'Data Repository',
          'DOI Assignment',
          'Public Sharing',
          'Version Control',
        ],
      },
    };

    return metadata[phase];
  }
}
