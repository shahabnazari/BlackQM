/**
 * SearchSection Components Index
 * Barrel exports for cleaner imports
 * Phase 10 Day 31 - Enterprise Refactoring
 * Phase 10.113 Week 10 - Added WebSocket streaming components
 * Phase 10.115 - Added Search Intelligence Report
 */

export { SearchBar } from './SearchBar';
export { FilterPanel } from './FilterPanel';
export { ActiveFiltersChips } from './ActiveFiltersChips';
export { SearchResultsDisplay } from './SearchResultsDisplay';

// Phase 10.113 Week 10: WebSocket streaming components
export { QueryIntelligencePanel } from './QueryIntelligencePanel';
export { LiveSearchProgress } from './LiveSearchProgress';

// Phase 10.115: Search Intelligence Report
export { SearchIntelligenceReport } from './SearchIntelligenceReport';

// Note: QueryOptimizationPanel removed in Week 9 redesign
// Smart Search toggle is now integrated directly into SearchBar
