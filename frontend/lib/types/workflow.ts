/**
 * Workflow Type Definitions
 * Enterprise-grade workflow management types
 */

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  order: number;
  requiredFields?: string[];
  validationRules?: ValidationRule[];
}

export interface WorkflowState {
  currentStage: string;
  stages: WorkflowStage[];
  completedStages: string[];
  stageData: Record<string, any>;
  isComplete: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface WorkflowStore extends WorkflowState {
  initializeWorkflow: (stages: WorkflowStage[]) => void;
  transitionTo: (stageId: string) => void;
  canTransitionTo: (stageId: string) => boolean;
  updateStageData: (stageId: string, data: any) => void;
  getStageData: (stageId: string) => any;
  validateStage: (stageId: string) => boolean;
  recordAIServiceUse: (service: string, tokens: number) => void;
  reset: () => void;
  save: () => Promise<void>;
  load: () => Promise<void>;
}

// Create a default implementation
export function createWorkflowStore(): WorkflowStore {
  return {
    currentStage: '',
    stages: [],
    completedStages: [],
    stageData: {},
    isComplete: false,
    initializeWorkflow: () => {},
    transitionTo: () => {},
    canTransitionTo: () => false,
    updateStageData: () => {},
    getStageData: () => ({}),
    validateStage: () => true,
    recordAIServiceUse: () => {},
    reset: () => {},
    save: async () => {},
    load: async () => {}
  }
}

export const useWorkflowStore = createWorkflowStore;
