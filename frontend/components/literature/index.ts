/**
 * Literature Components Barrel File
 * Phase 10 Day 5.12 - Integration
 *
 * Centralizes exports for all Day 5.12 theme-based AI components
 * Enables clean imports: import { ThemeActionPanel, ... } from '@/components/literature'
 */

// Previously implemented components
export { ThemeActionPanel } from './ThemeActionPanel';
export { AIResearchQuestionSuggestions } from './AIResearchQuestionSuggestions';

// Phase 10 Day 5.17.4: SQUARE-IT Framework Explainer
export { SquareItScoreExplainer } from './SquareItScoreExplainer';

// Day 5.12 new components
export { AIHypothesisSuggestions } from './AIHypothesisSuggestions';
export type { HypothesisSuggestion } from './AIHypothesisSuggestions';

export { ThemeConstructMap } from './ThemeConstructMap';
export type { ConstructMapping } from './ThemeConstructMap';

export { CompleteSurveyFromThemesModal } from './CompleteSurveyFromThemesModal';
export type { SurveyGenerationConfig } from './CompleteSurveyFromThemesModal';

export { GeneratedSurveyPreview } from './GeneratedSurveyPreview';
export type { GeneratedSurvey } from './GeneratedSurveyPreview';
