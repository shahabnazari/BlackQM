import { Injectable, Logger } from '@nestjs/common';

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

export interface PhaseMetadata {
  label: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  tools: {
    id: string;
    label: string;
    path: string;
    icon: string;
  }[];
}

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);

  private readonly phaseConfig: Record<ResearchPhase, PhaseMetadata> = {
    [ResearchPhase.DISCOVER]: {
      label: 'Discover',
      description: 'Literature review & research foundation',
      icon: '📚',
      color: '#8B5CF6',
      order: 1,
      tools: [
        {
          id: 'literature',
          label: 'Literature Search',
          path: '/discover/literature',
          icon: 'BookOpen',
        },
        {
          id: 'references',
          label: 'Reference Manager',
          path: '/discover/references',
          icon: 'Library',
        },
        {
          id: 'knowledge-map',
          label: 'Knowledge Map',
          path: '/discover/knowledge-map',
          icon: 'GitBranch',
        },
        {
          id: 'gaps',
          label: 'Research Gaps',
          path: '/discover/gaps',
          icon: 'Search',
        },
      ],
    },
    [ResearchPhase.DESIGN]: {
      label: 'Design',
      description: 'Formulate questions & methodology',
      icon: '💡',
      color: '#F59E0B',
      order: 2,
      tools: [
        {
          id: 'questions',
          label: 'Research Questions',
          path: '/design/questions',
          icon: 'HelpCircle',
        },
        {
          id: 'hypothesis',
          label: 'Hypothesis Builder',
          path: '/design/hypothesis',
          icon: 'Target',
        },
        {
          id: 'methodology',
          label: 'Methodology',
          path: '/design/methodology',
          icon: 'Compass',
        },
        {
          id: 'protocol',
          label: 'Study Protocol',
          path: '/design/protocol',
          icon: 'FileText',
        },
      ],
    },
    [ResearchPhase.BUILD]: {
      label: 'Build',
      description: 'Create study instruments',
      icon: '🛠️',
      color: '#3B82F6',
      order: 3,
      tools: [
        {
          id: 'study-setup',
          label: 'Study Setup',
          path: '/studies/create',
          icon: 'Settings',
        },
        {
          id: 'statements',
          label: 'Statement Generator',
          path: '/studies/statements',
          icon: 'List',
        },
        {
          id: 'q-grid',
          label: 'Q-Grid Designer',
          path: '/studies/grid',
          icon: 'Grid',
        },
        {
          id: 'questionnaire',
          label: 'Questionnaire',
          path: '/questionnaire/builder',
          icon: 'FileQuestion',
        },
      ],
    },
    [ResearchPhase.RECRUIT]: {
      label: 'Recruit',
      description: 'Find & manage participants',
      icon: '👥',
      color: '#10B981',
      order: 4,
      tools: [
        {
          id: 'participants',
          label: 'Participants',
          path: '/recruit/participants',
          icon: 'Users',
        },
        {
          id: 'screening',
          label: 'Screening',
          path: '/recruit/screening',
          icon: 'UserCheck',
        },
        {
          id: 'scheduling',
          label: 'Scheduling',
          path: '/recruit/scheduling',
          icon: 'Calendar',
        },
        {
          id: 'compensation',
          label: 'Compensation',
          path: '/recruit/compensation',
          icon: 'DollarSign',
        },
      ],
    },
    [ResearchPhase.COLLECT]: {
      label: 'Collect',
      description: 'Gather participant data',
      icon: '📊',
      color: '#EF4444',
      order: 5,
      tools: [
        {
          id: 'sessions',
          label: 'Active Sessions',
          path: '/collect/sessions',
          icon: 'Play',
        },
        {
          id: 'monitoring',
          label: 'Live Monitoring',
          path: '/collect/monitoring',
          icon: 'Activity',
        },
        {
          id: 'progress',
          label: 'Progress Tracking',
          path: '/collect/progress',
          icon: 'TrendingUp',
        },
        {
          id: 'exports',
          label: 'Data Export',
          path: '/collect/exports',
          icon: 'Download',
        },
      ],
    },
    [ResearchPhase.ANALYZE]: {
      label: 'Analyze',
      description: 'Statistical analysis & extraction',
      icon: '📈',
      color: '#06B6D4',
      order: 6,
      tools: [
        {
          id: 'hub',
          label: 'Analysis Hub',
          path: '/analyze/hub',
          icon: 'BarChart',
        },
        {
          id: 'extraction',
          label: 'Factor Extraction',
          path: '/analyze/extraction',
          icon: 'GitMerge',
        },
        {
          id: 'rotation',
          label: 'Factor Rotation',
          path: '/analyze/rotation',
          icon: 'RotateCw',
        },
        {
          id: 'statistics',
          label: 'Statistics',
          path: '/analyze/statistics',
          icon: 'Calculator',
        },
      ],
    },
    [ResearchPhase.VISUALIZE]: {
      label: 'Visualize',
      description: 'Create charts & graphics',
      icon: '📊',
      color: '#EC4899',
      order: 7,
      tools: [
        {
          id: 'charts',
          label: 'Chart Builder',
          path: '/visualize/charts',
          icon: 'PieChart',
        },
        {
          id: 'factor-arrays',
          label: 'Factor Arrays',
          path: '/visualize/factor-arrays',
          icon: 'Grid3x3',
        },
        {
          id: 'heatmaps',
          label: 'Correlation Heatmaps',
          path: '/visualize/heatmaps',
          icon: 'Map',
        },
        {
          id: 'interactive',
          label: 'Interactive Plots',
          path: '/visualize/interactive',
          icon: 'MousePointer',
        },
      ],
    },
    [ResearchPhase.INTERPRET]: {
      label: 'Interpret',
      description: 'Explain findings & insights',
      icon: '🔍',
      color: '#8B5CF6',
      order: 8,
      tools: [
        {
          id: 'workspace',
          label: 'Interpretation Workspace',
          path: '/interpret/workspace',
          icon: 'Brain',
        },
        {
          id: 'narratives',
          label: 'Factor Narratives',
          path: '/interpret/narratives',
          icon: 'BookOpen',
        },
        {
          id: 'themes',
          label: 'Theme Analysis',
          path: '/interpret/themes',
          icon: 'Tag',
        },
        {
          id: 'consensus',
          label: 'Consensus Analysis',
          path: '/interpret/consensus',
          icon: 'Users',
        },
      ],
    },
    [ResearchPhase.REPORT]: {
      label: 'Report',
      description: 'Documentation & dissemination',
      icon: '📝',
      color: '#F59E0B',
      order: 9,
      tools: [
        {
          id: 'editor',
          label: 'Report Editor',
          path: '/report/editor',
          icon: 'Edit',
        },
        {
          id: 'templates',
          label: 'Templates',
          path: '/report/templates',
          icon: 'FileTemplate',
        },
        {
          id: 'export',
          label: 'Export Options',
          path: '/report/export',
          icon: 'Download',
        },
        {
          id: 'publish',
          label: 'Publish',
          path: '/report/publish',
          icon: 'Upload',
        },
      ],
    },
    [ResearchPhase.ARCHIVE]: {
      label: 'Archive',
      description: 'Preserve & share',
      icon: '📦',
      color: '#6B7280',
      order: 10,
      tools: [
        {
          id: 'repository',
          label: 'Study Repository',
          path: '/archive/repository',
          icon: 'Database',
        },
        {
          id: 'versions',
          label: 'Version Control',
          path: '/archive/versions',
          icon: 'GitBranch',
        },
        {
          id: 'metadata',
          label: 'Metadata',
          path: '/archive/metadata',
          icon: 'Info',
        },
        {
          id: 'sharing',
          label: 'Data Sharing',
          path: '/archive/sharing',
          icon: 'Share2',
        },
      ],
    },
  };

  getPhases() {
    return Object.entries(this.phaseConfig).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  }

  getPhaseTools(phase: string) {
    const phaseKey = phase.toLowerCase() as ResearchPhase;
    const config = this.phaseConfig[phaseKey];

    if (!config) {
      return { error: 'Phase not found' };
    }

    return {
      phase: phaseKey,
      label: config.label,
      tools: config.tools,
    };
  }

  getCurrentPhase(studyId?: string) {
    // This would normally check the database for the current phase
    // For now, return a mock response
    return {
      currentPhase: ResearchPhase.BUILD,
      studyId,
      progress: {
        completedPhases: [ResearchPhase.DISCOVER, ResearchPhase.DESIGN],
        currentPhaseCompletion: 0.5,
      },
    };
  }

  updatePhaseProgress(data: {
    phase: string;
    studyId?: string;
    completed?: boolean;
  }) {
    // This would normally update the database
    this.logger.log(`Updating phase progress: ${JSON.stringify(data)}`);
    return { success: true, ...data };
  }

  getPhaseCompletion(studyId: string) {
    // This would normally check the database
    return {
      studyId,
      phases: Object.values(ResearchPhase).map((phase) => ({
        phase,
        completed: [ResearchPhase.DISCOVER, ResearchPhase.DESIGN].includes(
          phase,
        ),
        completionPercentage:
          phase === ResearchPhase.BUILD
            ? 50
            : phase === ResearchPhase.DISCOVER || phase === ResearchPhase.DESIGN
              ? 100
              : 0,
      })),
    };
  }

  getPhaseMetadata(phase: ResearchPhase): PhaseMetadata {
    return this.phaseConfig[phase];
  }

  // Additional methods for controller compatibility
  async getNavigationState(userId: string, studyId?: string) {
    // This would normally query the database for user-specific navigation state
    return {
      userId,
      studyId,
      currentPhase: ResearchPhase.BUILD,
      completedPhases: [ResearchPhase.DISCOVER, ResearchPhase.DESIGN],
      phaseProgress: {
        [ResearchPhase.DISCOVER]: 100,
        [ResearchPhase.DESIGN]: 100,
        [ResearchPhase.BUILD]: 50,
      },
      lastActivity: new Date().toISOString(),
    };
  }

  async updateCurrentPhase(
    userId: string,
    phase: ResearchPhase,
    studyId?: string,
  ) {
    // This would normally update the database
    this.logger.log(
      `Updating phase for user ${userId} to ${phase}${studyId ? ` for study ${studyId}` : ''}`,
    );
    return {
      success: true,
      userId,
      phase,
      studyId,
      updatedAt: new Date().toISOString(),
    };
  }

  async trackActionCompletion(
    userId: string,
    studyId: string,
    phase: ResearchPhase,
    action: string,
  ) {
    // This would normally record the action in the database
    this.logger.log(
      `Tracking action completion: ${action} in ${phase} for study ${studyId} by user ${userId}`,
    );
    return {
      success: true,
      userId,
      studyId,
      phase,
      action,
      completedAt: new Date().toISOString(),
    };
  }
}

// Also export as NavigationStateService for compatibility
export { NavigationService as NavigationStateService };
