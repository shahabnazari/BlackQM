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

// Phase 10.8 Day 7: Instagram Integration Components
export { InstagramUploadModal } from './InstagramUploadModal';
export type { InstagramUploadData, InstagramUploadModalProps } from './InstagramUploadModal';

export { InstagramVideoCard } from './InstagramVideoCard';
export type { InstagramVideo, InstagramVideoCardProps } from './InstagramVideoCard';

export { InstagramResultsGrid } from './InstagramResultsGrid';
export type { InstagramResultsGridProps } from './InstagramResultsGrid';

export { SocialMediaResultsDisplay } from './SocialMediaResultsDisplay';
export type { SocialMediaResult, SocialMediaResultsDisplayProps } from './SocialMediaResultsDisplay';

// Phase 10.8 Day 8: TikTok Integration Components
export { TikTokSearchForm } from './TikTokSearchForm';
export type { TikTokSearchFormProps, TikTokSearchParams } from './TikTokSearchForm';

export { TikTokVideoCard } from './TikTokVideoCard';
export type { TikTokVideo, TikTokVideoCardProps } from './TikTokVideoCard';

export { TikTokTrendsGrid } from './TikTokTrendsGrid';
export type { TikTokTrendsGridProps } from './TikTokTrendsGrid';

// Phase 10.8 Day 9: Citation Generator
export { CitationModal } from './CitationModal';
export type { CitationModalProps, CitationFormat } from './CitationModal';

// Phase 10.97 Day 2: Theme to Statement modal
export { ThemeToStatementModal } from './ThemeToStatementModal';

// Phase 10.175: Thematization Configuration
export { ThematizationConfigModal } from './ThematizationConfigModal';
export type { ThematizationConfig, ThematizationConfigModalProps } from './ThematizationConfigModal';
