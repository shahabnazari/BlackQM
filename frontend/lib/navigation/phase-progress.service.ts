/**
 * Phase Progress Tracking Service
 * World-class implementation for tracking research phase completion
 * Part of Phase 8.5 Day 5 Implementation
 */

import { ResearchPhase } from '@/components/navigation/PrimaryToolbar';

export interface PhaseTask {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  weight: number; // Contribution to overall phase progress (0-1)
}

export interface PhaseProgress {
  phase: ResearchPhase;
  progress: number; // 0-100
  tasks: PhaseTask[];
  startedAt?: Date;
  completedAt?: Date;
  lastActivity?: Date;
  blockers: string[];
  dependencies: ResearchPhase[];
}

export interface StudyProgress {
  studyId: string;
  phases: Map<ResearchPhase, PhaseProgress>;
  overallProgress: number;
  currentPhase: ResearchPhase;
  nextRecommendedPhase?: ResearchPhase;
}

/**
 * Define phase tasks and their weights for progress calculation
 */
const PHASE_TASKS: Record<ResearchPhase, Omit<PhaseTask, 'completed'>[]> = {
  discover: [
    {
      id: 'lit-search',
      label: 'Literature Search',
      description: 'Search for relevant papers',
      required: true,
      weight: 0.3,
    },
    {
      id: 'refs-import',
      label: 'Import References',
      description: 'Import and organize citations',
      required: true,
      weight: 0.2,
    },
    {
      id: 'knowledge-map',
      label: 'Create Knowledge Map',
      description: 'Map research concepts',
      required: false,
      weight: 0.15,
    },
    {
      id: 'gaps-analysis',
      label: 'Identify Research Gaps',
      description: 'Analyze gaps in literature',
      required: true,
      weight: 0.25,
    },
    {
      id: 'framework',
      label: 'Theoretical Framework',
      description: 'Build theoretical foundation',
      required: false,
      weight: 0.1,
    },
  ],
  design: [
    {
      id: 'research-questions',
      label: 'Formulate Questions',
      description: 'Define research questions',
      required: true,
      weight: 0.3,
    },
    {
      id: 'hypotheses',
      label: 'Build Hypotheses',
      description: 'Create testable hypotheses',
      required: false,
      weight: 0.2,
    },
    {
      id: 'methodology',
      label: 'Select Methodology',
      description: 'Choose research method',
      required: true,
      weight: 0.25,
    },
    {
      id: 'protocol',
      label: 'Study Protocol',
      description: 'Design study protocol',
      required: true,
      weight: 0.15,
    },
    {
      id: 'ethics',
      label: 'Ethics Review',
      description: 'Complete IRB checklist',
      required: false,
      weight: 0.1,
    },
  ],
  build: [
    {
      id: 'study-setup',
      label: 'Study Configuration',
      description: 'Basic study setup',
      required: true,
      weight: 0.2,
    },
    {
      id: 'grid-design',
      label: 'Q-Grid Design',
      description: 'Configure Q-sort grid',
      required: true,
      weight: 0.25,
    },
    {
      id: 'statements',
      label: 'Create Statements',
      description: 'Generate Q-statements',
      required: true,
      weight: 0.25,
    },
    {
      id: 'pre-screening',
      label: 'Pre-Screening Questions',
      description: 'Design qualification survey',
      required: false,
      weight: 0.1,
    },
    {
      id: 'post-survey',
      label: 'Post-Survey Questions',
      description: 'Create follow-up questions',
      required: false,
      weight: 0.1,
    },
    {
      id: 'consent',
      label: 'Consent Forms',
      description: 'Prepare consent documents',
      required: true,
      weight: 0.1,
    },
  ],
  recruit: [
    {
      id: 'participant-pool',
      label: 'Build Pool',
      description: 'Create participant database',
      required: true,
      weight: 0.25,
    },
    {
      id: 'invitations',
      label: 'Send Invitations',
      description: 'Invite participants',
      required: true,
      weight: 0.25,
    },
    {
      id: 'screening',
      label: 'Screen Participants',
      description: 'Review qualifications',
      required: true,
      weight: 0.2,
    },
    {
      id: 'scheduling',
      label: 'Schedule Sessions',
      description: 'Book appointments',
      required: false,
      weight: 0.15,
    },
    {
      id: 'compensation',
      label: 'Manage Compensation',
      description: 'Track payments',
      required: false,
      weight: 0.15,
    },
  ],
  collect: [
    {
      id: 'launch-study',
      label: 'Launch Study',
      description: 'Make study live',
      required: true,
      weight: 0.2,
    },
    {
      id: 'monitor-progress',
      label: 'Monitor Progress',
      description: 'Track completion rates',
      required: true,
      weight: 0.2,
    },
    {
      id: 'q-sorts',
      label: 'Collect Q-Sorts',
      description: 'Gather participant sorts',
      required: true,
      weight: 0.3,
    },
    {
      id: 'survey-responses',
      label: 'Collect Surveys',
      description: 'Gather questionnaire data',
      required: false,
      weight: 0.15,
    },
    {
      id: 'quality-check',
      label: 'Quality Control',
      description: 'Verify data quality',
      required: true,
      weight: 0.15,
    },
  ],
  analyze: [
    {
      id: 'data-prep',
      label: 'Prepare Data',
      description: 'Clean and format data',
      required: true,
      weight: 0.15,
    },
    {
      id: 'factor-extraction',
      label: 'Extract Factors',
      description: 'Run factor analysis',
      required: true,
      weight: 0.25,
    },
    {
      id: 'rotation',
      label: 'Rotate Factors',
      description: 'Apply rotation method',
      required: true,
      weight: 0.2,
    },
    {
      id: 'statistics',
      label: 'Statistical Tests',
      description: 'Run significance tests',
      required: true,
      weight: 0.2,
    },
    {
      id: 'correlation',
      label: 'Correlation Analysis',
      description: 'Analyze relationships',
      required: false,
      weight: 0.2,
    },
  ],
  visualize: [
    {
      id: 'factor-arrays',
      label: 'Factor Arrays',
      description: 'Create array visualizations',
      required: true,
      weight: 0.25,
    },
    {
      id: 'loading-plots',
      label: 'Loading Plots',
      description: 'Generate loading charts',
      required: true,
      weight: 0.25,
    },
    {
      id: 'heatmaps',
      label: 'Heat Maps',
      description: 'Create correlation heatmaps',
      required: false,
      weight: 0.15,
    },
    {
      id: 'distributions',
      label: 'Distributions',
      description: 'Plot response distributions',
      required: true,
      weight: 0.2,
    },
    {
      id: 'dashboards',
      label: 'Custom Dashboards',
      description: 'Build custom visualizations',
      required: false,
      weight: 0.15,
    },
  ],
  interpret: [
    {
      id: 'factor-narrative',
      label: 'Factor Narratives',
      description: 'Write factor interpretations',
      required: true,
      weight: 0.3,
    },
    {
      id: 'consensus',
      label: 'Consensus Analysis',
      description: 'Identify agreements',
      required: true,
      weight: 0.2,
    },
    {
      id: 'distinguishing',
      label: 'Distinguishing Views',
      description: 'Identify unique perspectives',
      required: true,
      weight: 0.2,
    },
    {
      id: 'themes',
      label: 'Extract Themes',
      description: 'Identify qualitative themes',
      required: false,
      weight: 0.15,
    },
    {
      id: 'synthesis',
      label: 'Cross-Factor Synthesis',
      description: 'Synthesize findings',
      required: false,
      weight: 0.15,
    },
  ],
  report: [
    {
      id: 'exec-summary',
      label: 'Executive Summary',
      description: 'Write summary',
      required: true,
      weight: 0.2,
    },
    {
      id: 'methodology-section',
      label: 'Methods Section',
      description: 'Document methodology',
      required: true,
      weight: 0.2,
    },
    {
      id: 'results-section',
      label: 'Results Section',
      description: 'Present findings',
      required: true,
      weight: 0.25,
    },
    {
      id: 'discussion',
      label: 'Discussion',
      description: 'Discuss implications',
      required: true,
      weight: 0.25,
    },
    {
      id: 'formatting',
      label: 'Academic Formatting',
      description: 'Apply citation style',
      required: false,
      weight: 0.1,
    },
  ],
  archive: [
    {
      id: 'finalize-data',
      label: 'Finalize Dataset',
      description: 'Prepare final data package',
      required: true,
      weight: 0.25,
    },
    {
      id: 'documentation',
      label: 'Complete Documentation',
      description: 'Document all materials',
      required: true,
      weight: 0.25,
    },
    {
      id: 'doi-assignment',
      label: 'Assign DOI',
      description: 'Get persistent identifier',
      required: false,
      weight: 0.15,
    },
    {
      id: 'repository',
      label: 'Upload to Repository',
      description: 'Store in data repository',
      required: true,
      weight: 0.2,
    },
    {
      id: 'replication',
      label: 'Replication Package',
      description: 'Create reproducibility materials',
      required: false,
      weight: 0.15,
    },
  ],
};

/**
 * Phase dependencies - which phases must be completed before others
 */
const PHASE_DEPENDENCIES: Record<ResearchPhase, ResearchPhase[]> = {
  discover: [],
  design: ['discover'],
  build: ['design'],
  recruit: ['build'],
  collect: ['recruit'],
  analyze: ['collect'],
  visualize: ['analyze'],
  interpret: ['analyze', 'visualize'],
  report: ['interpret'],
  archive: ['report'],
};

export class PhaseProgressService {
  private static instance: PhaseProgressService;
  private progressCache: Map<string, StudyProgress> = new Map();

  private constructor() {}

  static getInstance(): PhaseProgressService {
    if (!PhaseProgressService.instance) {
      PhaseProgressService.instance = new PhaseProgressService();
    }
    return PhaseProgressService.instance;
  }

  /**
   * Initialize progress tracking for a study
   */
  initializeStudyProgress(studyId: string): StudyProgress {
    const phases = new Map<ResearchPhase, PhaseProgress>();

    // Initialize all phases with their tasks
    (Object.keys(PHASE_TASKS) as ResearchPhase[]).forEach(phase => {
      phases.set(phase, {
        phase,
        progress: 0,
        tasks: PHASE_TASKS[phase].map(task => ({
          ...task,
          completed: false,
        })),
        blockers: [],
        dependencies: PHASE_DEPENDENCIES[phase],
      });
    });

    const studyProgress: StudyProgress = {
      studyId,
      phases,
      overallProgress: 0,
      currentPhase: 'discover',
      nextRecommendedPhase: 'design',
    };

    this.progressCache.set(studyId, studyProgress);
    return studyProgress;
  }

  /**
   * Update task completion status
   */
  updateTaskStatus(
    studyId: string,
    phase: ResearchPhase,
    taskId: string,
    completed: boolean
  ): PhaseProgress {
    const studyProgress = this.getStudyProgress(studyId);
    const phaseProgress = studyProgress.phases.get(phase);

    if (!phaseProgress) {
      throw new Error(`Phase ${phase} not found`);
    }

    const task = phaseProgress.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in phase ${phase}`);
    }

    task.completed = completed;
    phaseProgress.lastActivity = new Date();

    // Recalculate phase progress
    const totalWeight = phaseProgress.tasks
      .filter(t => t.required || t.completed)
      .reduce((sum, t) => sum + t.weight, 0);

    const completedWeight = phaseProgress.tasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.weight, 0);

    phaseProgress.progress = Math.round((completedWeight / totalWeight) * 100);

    // Check if phase is complete
    const requiredComplete = phaseProgress.tasks
      .filter(t => t.required)
      .every(t => t.completed);

    if (requiredComplete && phaseProgress.progress >= 80) {
      phaseProgress.completedAt = new Date();
    }

    // Update overall progress
    this.updateOverallProgress(studyId);

    return phaseProgress;
  }

  /**
   * Calculate overall study progress
   */
  private updateOverallProgress(studyId: string): number {
    const studyProgress = this.getStudyProgress(studyId);
    const phases = Array.from(studyProgress.phases.values());

    const totalProgress = phases.reduce(
      (sum, phase) => sum + phase.progress,
      0
    );
    studyProgress.overallProgress = Math.round(totalProgress / phases.length);

    // Determine next recommended phase
    studyProgress.nextRecommendedPhase =
      this.getNextRecommendedPhase(studyProgress);

    return studyProgress.overallProgress;
  }

  /**
   * Get next recommended phase based on dependencies and completion
   */
  private getNextRecommendedPhase(
    studyProgress: StudyProgress
  ): ResearchPhase | undefined {
    const phases = Object.keys(PHASE_TASKS) as ResearchPhase[];

    for (const phase of phases) {
      const phaseProgress = studyProgress.phases.get(phase)!;

      // Skip if already complete
      if (phaseProgress.progress >= 80) continue;

      // Check if dependencies are met
      const dependenciesMet = phaseProgress.dependencies.every(dep => {
        const depProgress = studyProgress.phases.get(dep);
        return depProgress && depProgress.progress >= 80;
      });

      if (dependenciesMet) {
        return phase;
      }
    }

    return undefined;
  }

  /**
   * Get study progress
   */
  getStudyProgress(studyId: string): StudyProgress {
    let progress = this.progressCache.get(studyId);
    if (!progress) {
      progress = this.initializeStudyProgress(studyId);
    }
    return progress;
  }

  /**
   * Get available phases based on dependencies
   */
  getAvailablePhases(studyId: string): ResearchPhase[] {
    const studyProgress = this.getStudyProgress(studyId);
    const available: ResearchPhase[] = [];

    studyProgress.phases.forEach((phaseProgress, phase) => {
      const dependenciesMet = phaseProgress.dependencies.every(dep => {
        const depProgress = studyProgress.phases.get(dep);
        return depProgress && depProgress.progress >= 50; // 50% threshold for unlocking
      });

      if (dependenciesMet) {
        available.push(phase);
      }
    });

    return available;
  }

  /**
   * Get phase blockers
   */
  getPhaseBlockers(studyId: string, phase: ResearchPhase): string[] {
    const studyProgress = this.getStudyProgress(studyId);
    const phaseProgress = studyProgress.phases.get(phase);

    if (!phaseProgress) return [];

    const blockers: string[] = [];

    // Check dependencies
    phaseProgress.dependencies.forEach(dep => {
      const depProgress = studyProgress.phases.get(dep);
      if (!depProgress || depProgress.progress < 50) {
        blockers.push(
          `Complete ${dep} phase first (currently ${depProgress?.progress || 0}%)`
        );
      }
    });

    // Check required tasks
    const incompleteTasks = phaseProgress.tasks
      .filter(t => t.required && !t.completed)
      .map(t => t.label);

    if (incompleteTasks.length > 0) {
      blockers.push(`Required tasks: ${incompleteTasks.join(', ')}`);
    }

    return blockers;
  }

  /**
   * Export progress data for persistence
   */
  exportProgress(studyId: string): string {
    const progress = this.getStudyProgress(studyId);
    return JSON.stringify({
      studyId,
      phases: Array.from(progress.phases.entries()).map(([phase, data]) => ({
        phase,
        progress: data.progress,
        tasks: data.tasks,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        lastActivity: data.lastActivity,
      })),
      overallProgress: progress.overallProgress,
      currentPhase: progress.currentPhase,
    });
  }

  /**
   * Import progress data
   */
  importProgress(data: string): StudyProgress {
    const parsed = JSON.parse(data);
    const progress = this.initializeStudyProgress(parsed.studyId);

    parsed.phases.forEach((phaseData: any) => {
      const phase = progress.phases.get(phaseData.phase);
      if (phase) {
        phase.progress = phaseData.progress;
        phase.tasks = phaseData.tasks;
        phase.startedAt = phaseData.startedAt
          ? new Date(phaseData.startedAt)
          : undefined;
        phase.completedAt = phaseData.completedAt
          ? new Date(phaseData.completedAt)
          : undefined;
        phase.lastActivity = phaseData.lastActivity
          ? new Date(phaseData.lastActivity)
          : undefined;
      }
    });

    progress.overallProgress = parsed.overallProgress;
    progress.currentPhase = parsed.currentPhase;

    return progress;
  }
}

export const phaseProgressService = PhaseProgressService.getInstance();
