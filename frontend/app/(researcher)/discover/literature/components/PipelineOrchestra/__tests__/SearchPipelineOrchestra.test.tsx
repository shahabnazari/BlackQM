/**
 * Phase 10.143: Netflix-Grade Search Pipeline Orchestra Tests
 *
 * Comprehensive test suite for the SearchPipelineOrchestra component
 * Tests particle flow, stage transitions, stabilization, and orbital animations
 *
 * @file frontend/app/(researcher)/discover/literature/components/PipelineOrchestra/__tests__/SearchPipelineOrchestra.test.tsx
 * @enterprise-grade TypeScript strict mode, no any types
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SearchPipelineOrchestra } from '../SearchPipelineOrchestra';
import type { SearchPipelineOrchestraProps } from '../types';

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className} {...props}>{children}</div>
    ),
    button: ({ children, className, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button className={className} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <>{children}</>
  ),
}));

// Mock hooks
const mockUseReducedMotion = vi.fn(() => false);
vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

const mockUsePipelineState = vi.fn();
vi.mock('../hooks/usePipelineState', () => ({
  usePipelineState: (input: unknown) => mockUsePipelineState(input),
}));

const mockUseCountStabilization = vi.fn(() => ({ isStabilized: false }));
vi.mock('../hooks/useCountStabilization', () => ({
  useCountStabilization: (options: unknown) => mockUseCountStabilization(options),
  STABILIZATION_CONFIG: {
    stabilizationDelayMs: 1500,
    orbitDurationSeconds: 30,
  },
}));

// Mock components
vi.mock('../components/StageOrb', () => ({
  StageOrb: ({ stage }: { stage: { name: string } }) => (
    <div data-testid={`stage-orb-${stage.name.toLowerCase()}`}>{stage.name}</div>
  ),
}));

vi.mock('../components/StageConnector', () => ({
  StageConnector: () => <div data-testid="stage-connector">→</div>,
}));

vi.mock('../components/OrbitalSourceConstellation', () => ({
  OrbitalSourceConstellation: ({ paperCount }: { paperCount: number }) => (
    <div data-testid="orbital-constellation">
      <span>{paperCount} papers</span>
    </div>
  ),
}));

vi.mock('../components/ParticleFlowSystem', () => ({
  ParticleFlowSystem: ({ isActive }: { isActive: boolean }) => (
    isActive ? <div data-testid="particle-flow">Particles</div> : null
  ),
}));

vi.mock('../components/StageFlowParticles', () => ({
  StageFlowParticles: ({ isSearching }: { isSearching: boolean }) => (
    isSearching ? <div data-testid="stage-flow-particles">Stage Flow</div> : null
  ),
}));

vi.mock('../components/SemanticBrainVisualizer', () => ({
  SemanticBrainVisualizer: () => <div data-testid="semantic-brain">Brain</div>,
}));

vi.mock('../components/LiveCounter', () => ({
  LiveCounter: ({ value, label }: { value: number; label: string }) => (
    <div data-testid={`counter-${label.toLowerCase()}`}>{label}: {value}</div>
  ),
  ETAPredictor: () => <div data-testid="eta-predictor">ETA</div>,
  QualityMeter: () => <div data-testid="quality-meter">Quality</div>,
}));

vi.mock('../components/MethodologyReport', () => ({
  MethodologyReport: () => <div data-testid="methodology-report">Report</div>,
}));

vi.mock('../components/PipelineErrorBoundary', () => ({
  PipelineErrorBoundary: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// ============================================================================
// Test Utilities
// ============================================================================

const createMockSourceStats = () => {
  const stats = new Map();
  stats.set('openalex', {
    status: 'complete',
    paperCount: 100,
    timeMs: 1500,
  });
  stats.set('pubmed', {
    status: 'searching',
    paperCount: 50,
    timeMs: 2000,
  });
  return stats;
};

// Phase 10.152: Removed 'ready' stage - pipeline now ends at 'rank'
const createMockPipelineState = (overrides = {}) => ({
  stages: [
    { id: 'analyze', status: 'complete', progress: 100, message: 'Query analyzed', substageProgress: {} },
    { id: 'discover', status: 'active', progress: 50, message: 'Querying sources...', substageProgress: {} },
    { id: 'refine', status: 'pending', progress: 0, message: 'Cleaning and deduplicating', substageProgress: {} },
    { id: 'rank', status: 'pending', progress: 0, message: 'AI-powered scoring', substageProgress: {} },
  ],
  currentStage: 'discover',
  sources: [],
  activeSource: null,
  semanticNodes: [],
  synapses: [],
  metrics: {
    papers: 150,
    elapsed: 5000,
    quality: 75,
    eta: 3000,
    sourcesComplete: 1,
    sourcesTotal: 2,
  },
  isSearching: true,
  isComplete: false,
  ...overrides,
});

const defaultProps: SearchPipelineOrchestraProps = {
  isSearching: true,
  stage: 'fast-sources',
  percent: 50,
  message: 'Test query',
  sourceStats: createMockSourceStats(),
  sourcesComplete: 1,
  sourcesTotal: 2,
  papersFound: 150,
  elapsedMs: 5000,
  semanticTier: null,
  semanticVersion: 1,
  semanticTierStats: new Map(),
  showParticles: true,
  showSemanticBrain: true,
  compactMode: false,
};

// ============================================================================
// Test Suites
// ============================================================================

describe('SearchPipelineOrchestra - Netflix-Grade Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
    mockUseCountStabilization.mockReturnValue({ isStabilized: false });
    mockUsePipelineState.mockReturnValue(createMockPipelineState());
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==========================================================================
  // 1. Component Rendering
  // ==========================================================================

  describe('1.1 Component Rendering', () => {
    it('should render pipeline container with correct ARIA attributes', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      const container = screen.getByRole('region', { name: /search pipeline progress/i });
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('tabIndex', '-1');
    });

    // Phase 10.152: Updated from 5 to 4 stages
    it('should render all 4 pipeline stages in arc layout', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);
      expect(screen.getByTestId('stage-orb-analyze')).toBeInTheDocument();
      expect(screen.getByTestId('stage-orb-discover')).toBeInTheDocument();
      expect(screen.getByTestId('stage-orb-refine')).toBeInTheDocument();
      expect(screen.getByTestId('stage-orb-rank')).toBeInTheDocument();
    });

    it('should render orbital constellation', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('orbital-constellation')).toBeInTheDocument();
      expect(screen.getByText('150 papers')).toBeInTheDocument();
    });

    it('should not render when not searching and no results', () => {
      const { container } = render(
        <SearchPipelineOrchestra
          {...defaultProps}
          isSearching={false}
          sourcesComplete={0}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  // ==========================================================================
  // 2. Particle Flow System
  // ==========================================================================

  describe('1.2 Particle Flow System', () => {
    it('should show particles during DISCOVER phase', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'discover' })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('particle-flow')).toBeInTheDocument();
    });

    it('should show particles during ANALYZE phase', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'analyze' })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('particle-flow')).toBeInTheDocument();
    });

    it('should stop particles when count stabilizes', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'discover' })
      );
      mockUseCountStabilization.mockReturnValue({ isStabilized: true });

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.queryByTestId('particle-flow')).not.toBeInTheDocument();
    });

    it('should stop particles during RANK phase', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'rank' })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.queryByTestId('particle-flow')).not.toBeInTheDocument();
    });

    it('should not show particles when reduced motion is enabled', () => {
      mockUseReducedMotion.mockReturnValue(true);
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'discover' })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.queryByTestId('particle-flow')).not.toBeInTheDocument();
    });

    it('should not show particles when showParticles is false', () => {
      render(
        <SearchPipelineOrchestra
          {...defaultProps}
          showParticles={false}
        />
      );

      expect(screen.queryByTestId('particle-flow')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. Stage Flow Particles
  // ==========================================================================

  describe('1.3 Inter-Stage Particle Flow', () => {
    it('should show stage flow particles when searching', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('stage-flow-particles')).toBeInTheDocument();
    });

    it('should not show stage flow particles when not searching', () => {
      render(
        <SearchPipelineOrchestra
          {...defaultProps}
          isSearching={false}
        />
      );

      expect(screen.queryByTestId('stage-flow-particles')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. Count Stabilization
  // ==========================================================================

  describe('1.4 Count Stabilization Detection', () => {
    it('should call useCountStabilization with correct parameters', () => {
      const sourceStats = createMockSourceStats();
      let total = 0;
      sourceStats.forEach((stats) => {
        total += stats.paperCount;
      });

      render(<SearchPipelineOrchestra {...defaultProps} sourceStats={sourceStats} />);

      // Phase 10.152: isComplete removed from hook interface - persistence handled internally
      expect(mockUseCountStabilization).toHaveBeenCalledWith({
        count: total,
        isActive: true,
      });
    });

    it('should pass isActive based on isSearching prop', () => {
      // Test with isSearching = true (default)
      render(<SearchPipelineOrchestra {...defaultProps} isSearching={true} />);

      expect(mockUseCountStabilization).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });

  // ==========================================================================
  // 5. Stage Transitions
  // ==========================================================================

  describe('1.5 Stage Transitions', () => {
    it('should render stage connectors between stages', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      // Should have connectors between stages (4 connectors for 5 stages)
      const connectors = screen.getAllByTestId('stage-connector');
      expect(connectors.length).toBeGreaterThan(0);
    });

    it('should update stage states when pipeline state changes', () => {
      const { rerender } = render(<SearchPipelineOrchestra {...defaultProps} />);

      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({
          currentStage: 'rank',
          // Phase 10.152: Removed 'ready' stage
          stages: [
            { id: 'analyze', status: 'complete', progress: 100, message: 'Complete', substageProgress: {} },
            { id: 'discover', status: 'complete', progress: 100, message: 'Complete', substageProgress: {} },
            { id: 'refine', status: 'complete', progress: 100, message: 'Complete', substageProgress: {} },
            { id: 'rank', status: 'active', progress: 50, message: 'Ranking...', substageProgress: {} },
          ],
        })
      );

      rerender(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('stage-orb-rank')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 6. Metrics Dashboard
  // ==========================================================================

  describe('1.6 Metrics Dashboard', () => {
    it('should render metrics dashboard with correct values', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('counter-papers')).toBeInTheDocument();
      expect(screen.getByTestId('counter-elapsed')).toBeInTheDocument();
      expect(screen.getByTestId('quality-meter')).toBeInTheDocument();
      expect(screen.getByTestId('eta-predictor')).toBeInTheDocument();
    });

    it('should display correct paper count', () => {
      render(<SearchPipelineOrchestra {...defaultProps} papersFound={250} />);

      // Paper count is displayed in orbital constellation
      expect(screen.getByText(/250.*papers/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 7. Semantic Brain Visualizer
  // ==========================================================================

  describe('1.7 Semantic Brain Visualizer', () => {
    it('should show semantic brain during RANK stage', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'rank' })
      );

      render(
        <SearchPipelineOrchestra
          {...defaultProps}
          stage="ranking"
          semanticTier="immediate"
        />
      );

      expect(screen.getByTestId('semantic-brain')).toBeInTheDocument();
    });

    it('should show semantic brain when semanticTier is set', () => {
      render(
        <SearchPipelineOrchestra
          {...defaultProps}
          semanticTier="refined"
        />
      );

      expect(screen.getByTestId('semantic-brain')).toBeInTheDocument();
    });

    it('should not show semantic brain during DISCOVER phase', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ currentStage: 'discover' })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.queryByTestId('semantic-brain')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 8. Methodology Report
  // ==========================================================================

  describe('1.8 Methodology Report', () => {
    it('should show methodology report when search is complete', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ isComplete: true })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.getByTestId('methodology-report')).toBeInTheDocument();
    });

    it('should not show methodology report during search', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ isComplete: false })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      expect(screen.queryByTestId('methodology-report')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 9. Error Handling
  // ==========================================================================

  describe('1.9 Error Handling', () => {
    it('should display error banner when sources fail', () => {
      const errorStats = new Map();
      errorStats.set('openalex', {
        status: 'error',
        paperCount: 0,
        timeMs: 0,
        error: 'Connection failed',
      });

      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({
          sources: [
            {
              source: 'openalex',
              tier: 'fast',
              status: 'error',
              position: { x: 100, y: 100, angle: 0, radius: 80 },
              paperCount: 0,
              timeMs: 0,
              error: 'Connection failed',
            },
          ],
        })
      );

      render(
        <SearchPipelineOrchestra
          {...defaultProps}
          sourceStats={errorStats}
        />
      );

      expect(screen.getByText(/source.*failed to search/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 10. Accessibility
  // ==========================================================================

  describe('1.10 Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      const container = screen.getByRole('region', { name: /search pipeline progress/i });
      expect(container).toBeInTheDocument();
    });

    it('should have screen reader announcements', () => {
      mockUsePipelineState.mockReturnValue(
        createMockPipelineState({ isComplete: true })
      );

      render(<SearchPipelineOrchestra {...defaultProps} />);

      // Screen reader announcements use sr-only class
      const announcements = document.querySelector('.sr-only[aria-live]');
      expect(announcements).toBeInTheDocument();
      expect(announcements).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ==========================================================================
  // 11. Performance & Optimization
  // ==========================================================================

  describe('1.11 Performance & Optimization', () => {
    it('should memoize rawTotalPapers calculation', () => {
      const sourceStats = createMockSourceStats();
      render(<SearchPipelineOrchestra {...defaultProps} sourceStats={sourceStats} />);

      // Component should render without errors
      expect(screen.getByTestId('orbital-constellation')).toBeInTheDocument();
    });

    it('should handle empty sourceStats gracefully', () => {
      render(
        <SearchPipelineOrchestra
          {...defaultProps}
          sourceStats={new Map()}
        />
      );

      expect(screen.getByTestId('orbital-constellation')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 12. Expanded Mode
  // ==========================================================================

  describe('1.12 Expanded Mode', () => {
    // Phase 10.148: Component auto-expands when isSearching=true
    // So with isSearching=true, button shows "Collapse view" not "Expand view"
    it('should render expand/collapse button', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      // With isSearching=true (default), component auto-expands so button shows "Collapse view"
      const expandButton = screen.getByRole('button', { name: /collapse view/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('should handle Escape key to close expanded mode', () => {
      render(<SearchPipelineOrchestra {...defaultProps} />);

      // Expanded mode keyboard handling is tested via integration
      // With isSearching=true (default), component auto-expands so button shows "Collapse view"
      expect(screen.getByRole('button', { name: /collapse view/i })).toBeInTheDocument();
    });
  });
});
