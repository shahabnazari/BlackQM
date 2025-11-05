/**
 * Type Definitions for Questionnaire Import System
 * Phase 10 Day 5.9 - Enterprise Grade Types
 */

import { ReactNode } from 'react';

// Base question type that matches existing questionnaire system
export interface Question {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'likert'
    | 'scale'
    | 'matrix'
    | 'ranking';
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[];
  settings?: QuestionSettings;
  metadata?: QuestionMetadata;
  validation?: QuestionValidation;
}

export interface QuestionSettings {
  scaleType?:
    | '1-5'
    | '1-7'
    | '1-10'
    | 'agree-disagree'
    | 'frequency'
    | 'satisfaction';
  leftPole?: string;
  rightPole?: string;
  construct?: string;
  showLabels?: boolean;
  randomizeOptions?: boolean;
}

export interface QuestionMetadata {
  source:
    | 'manual'
    | 'theme-extraction'
    | 'research-question'
    | 'hypothesis'
    | 'ai-generated';
  themeId?: string;
  themeName?: string;
  confidence?: number;
  reversed?: boolean;
  generationMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  customValidator?: (value: any) => boolean;
}

// Questionnaire data structure
export interface QuestionnaireData {
  id?: string;
  title: string;
  description?: string;
  questions: Question[];
  sections?: QuestionnaireSection[];
  settings?: QuestionnaireSettings;
  metadata?: QuestionnaireMetadata;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
  conditional?: SectionCondition;
}

export interface SectionCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: any;
}

export interface QuestionnaireSettings {
  shuffleQuestions?: boolean;
  showProgressBar?: boolean;
  allowBackNavigation?: boolean;
  autoSave?: boolean;
  responseValidation?: boolean;
}

export interface QuestionnaireMetadata {
  createdBy?: string;
  createdAt?: string;
  lastModified?: string;
  version?: number;
  tags?: string[];
}

// Import-specific types
export interface ImportableItem extends Question {
  selected?: boolean;
  preview?: boolean;
}

// Event handler types
export interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

export interface ImportChangeEvent {
  target: {
    value: string;
    checked?: boolean;
    type?: string;
  };
}

// Error types
export interface ImportError extends Error {
  code?: string;
  details?: any;
  timestamp?: string;
}

// Builder reference type
export interface QuestionnaireBuilderRef {
  addQuestions: (questions: Question[]) => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  getQuestions: () => Question[];
  clearQuestions: () => void;
}

// Props types for components
export interface QuestionnaireBuilderWithImportProps {
  studyId?: string;
  initialData?: QuestionnaireData;
  onSave?: (data: QuestionnaireData) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export interface ImportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ImportableItem[]) => void;
}

export interface ThemeImportModalProps {
  onClose: () => void;
  onImport: (items: ImportableItem[]) => void;
}

// =======================
// Phase 10 Day 5.10: Research Question Operationalization Types
// =======================

export interface ResearchQuestionConstruct {
  id: string;
  name: string;
  definition: string;
  type:
    | 'independent_variable'
    | 'dependent_variable'
    | 'moderator'
    | 'mediator'
    | 'control'
    | 'outcome';
  confidence: number;
  source: 'extracted' | 'inferred' | 'user_defined';
  relatedConcepts: string[];
}

export interface OperationalizedVariable {
  id: string;
  constructId: string;
  variableName: string;
  operationalDefinition: string;
  measurementLevel: 'nominal' | 'ordinal' | 'interval' | 'ratio';
  measurementApproach: string;
  suggestedItems: SurveyMeasurementItem[];
  reliability: {
    targetAlpha: number;
    expectedAlpha: number;
    itemCount: number;
  };
}

export interface SurveyMeasurementItem {
  id: string;
  text: string;
  variableId: string;
  constructId: string;
  itemNumber: number;
  scaleType:
    | 'likert_5'
    | 'likert_7'
    | 'semantic_differential'
    | 'frequency'
    | 'agreement'
    | 'satisfaction'
    | 'importance';
  scaleLabels: string[];
  reversed: boolean;
  psychometricNote: string;
  researchBacking: string;
}

export interface StatisticalAnalysisPlan {
  primaryAnalysis: {
    method: string;
    description: string;
    assumptions: string[];
    sampleSizeRecommendation: number;
  };
  secondaryAnalyses: Array<{
    method: string;
    purpose: string;
    when: string;
  }>;
  reliabilityChecks: Array<{
    construct: string;
    method: string;
    threshold: number;
  }>;
  validityChecks: Array<{
    type: string;
    description: string;
  }>;
}

export interface OperationalizationRequest {
  researchQuestion: string;
  studyType:
    | 'exploratory'
    | 'explanatory'
    | 'evaluative'
    | 'predictive'
    | 'descriptive';
  methodology?: 'survey' | 'experiment' | 'mixed_methods';
  targetPopulation?: string;
  existingConstructs?: ResearchQuestionConstruct[];
  itemsPerVariable?: number;
  includeReverseItems?: boolean;
}

export interface OperationalizationResult {
  id: string;
  researchQuestion: string;
  constructs: ResearchQuestionConstruct[];
  variables: OperationalizedVariable[];
  measurementItems: SurveyMeasurementItem[];
  statisticalPlan: StatisticalAnalysisPlan;
  methodology: {
    approach: string;
    justification: string;
    sampleSize: number;
    dataCollection: string;
  };
  qualityMetrics: {
    constructCoverage: number;
    reliabilityExpectation: number;
    validityIndicators: string[];
  };
  recommendations: {
    pilotTesting: string;
    validationStrategy: string;
    improvementSuggestions: string[];
  };
  createdAt: Date | string;
}

export interface ResearchQuestionToItemsModalProps {
  onClose: () => void;
  onImport: (items: ImportableItem[]) => void;
}

// ============================================================================
// Day 5.11: Hypothesis to Survey Items Types
// ============================================================================

export interface HypothesisVariable {
  id: string;
  name: string;
  definition: string;
  role: 'independent' | 'dependent' | 'moderator' | 'mediator' | 'covariate';
  measurementLevel: 'nominal' | 'ordinal' | 'interval' | 'ratio';
  confidence: number;
  relatedConcepts: string[];
}

export interface HypothesisRelationship {
  from: string;
  to: string;
  type: 'direct' | 'moderated' | 'mediated' | 'interaction';
  direction: 'positive' | 'negative' | 'unspecified';
  moderatorId?: string;
  mediatorId?: string;
}

export interface HypothesisMeasurementScale {
  id: string;
  variableId: string;
  scaleName: string;
  items: HypothesisSurveyItem[];
  reliability: {
    targetAlpha: number;
    expectedAlpha: number;
    itemCount: number;
    itemTotalCorrelations: number[];
  };
  validity: {
    contentValidity: string;
    constructValidity: string;
    criterionValidity: string;
  };
}

export interface HypothesisSurveyItem {
  id: string;
  text: string;
  variableId: string;
  itemNumber: number;
  scaleType:
    | 'likert_5'
    | 'likert_7'
    | 'semantic_differential'
    | 'frequency'
    | 'agreement'
    | 'satisfaction';
  scaleLabels: string[];
  reversed: boolean;
  purpose: string;
  psychometricNote: string;
  researchBacking: string;
}

export interface HypothesisTestBattery {
  primaryTest: {
    method: string;
    description: string;
    assumptions: string[];
    requiredSampleSize: number;
    expectedPower: number;
  };
  alternativeTests: Array<{
    method: string;
    when: string;
    description: string;
  }>;
  reliabilityChecks: Array<{
    scale: string;
    method: string;
    threshold: number;
  }>;
  validityChecks: Array<{
    type: string;
    description: string;
    procedure: string;
  }>;
}

export interface HypothesisToItemRequest {
  hypothesis: string;
  hypothesisType?:
    | 'correlational'
    | 'causal'
    | 'interaction'
    | 'mediation'
    | 'moderation';
  itemsPerVariable?: number;
  targetReliability?: number;
  includeReverseItems?: boolean;
  studyContext?: string;
  targetPopulation?: string;
}

export interface HypothesisToItemResult {
  hypothesis: string;
  hypothesisType: string;
  variables: HypothesisVariable[];
  relationships: HypothesisRelationship[];
  scales: HypothesisMeasurementScale[];
  allItems: HypothesisSurveyItem[];
  testBattery: HypothesisTestBattery;
  qualityMetrics: {
    overallReliability: number;
    constructCoverage: number;
    validityScore: number;
  };
  recommendations: string[];
  researchPath: {
    visualDiagram: string;
    statisticalModel: string;
  };
}

export interface HypothesisToItemsModalProps {
  onClose: () => void;
  onImport: (items: ImportableItem[]) => void;
}
