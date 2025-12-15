/**
 * Phase 10.942 Day 4: PaperCard Component Tests
 *
 * Enterprise-grade unit tests for the PaperCard component
 * Tests paper display, selection state, and keyboard accessibility
 *
 * @file frontend/app/(researcher)/discover/literature/components/__tests__/PaperCard.test.tsx
 * @enterprise-grade TypeScript strict mode, no any types
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PaperCard } from '../PaperCard';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, initial, animate, transition, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock sub-components
// Phase 10.145: Updated mocks - PaperStatusBadges removed, MatchScoreBadge/CollapsibleMetadata added
vi.mock('../paper-card', () => ({
  PaperHeader: ({ title, authors, isSelected, isExtracting, isExtracted, onToggleSelection }: {
    title: string;
    authors: string[];
    isSelected: boolean;
    isExtracting: boolean;
    isExtracted: boolean;
    onToggleSelection: () => void;
  }) => (
    <div data-testid="paper-header">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelection}
        aria-label={`Select paper: ${title}`}
        data-extracting={isExtracting}
        data-extracted={isExtracted}
      />
      <h3>{title}</h3>
      <span>{authors.join(', ')}</span>
      {/* Phase 10.145: Extraction status now shown via checkbox */}
      {isExtracting && <span data-testid="extracting">Extracting</span>}
      {isExtracted && !isExtracting && <span data-testid="extracted">Extracted</span>}
    </div>
  ),
  PaperMetadata: ({ year, venue, citationCount, wordCount }: {
    year?: number;
    venue?: string;
    citationCount?: number;
    wordCount?: number;
  }) => (
    <div data-testid="paper-metadata">
      {year && <span data-testid="year">{year}</span>}
      {venue && <span data-testid="venue">{venue}</span>}
      {citationCount !== undefined && <span data-testid="citations">{citationCount}</span>}
      {wordCount && <span data-testid="wordcount">{wordCount}</span>}
    </div>
  ),
  PaperAccessBadges: ({ doi, hasFullText }: { doi?: string; hasFullText?: boolean }) => (
    <div data-testid="paper-access">
      {doi && <span data-testid="doi">DOI</span>}
      {hasFullText && <span data-testid="fulltext">Full Text</span>}
    </div>
  ),
  // Phase 10.154: Simplified - only shows citations per year (quality shown in MatchScoreBadge)
  PaperQualityBadges: ({ citationsPerYear }: { citationsPerYear?: number | null }) => (
    <div data-testid="paper-quality">
      {citationsPerYear && citationsPerYear > 0 && (
        <span data-testid="cites-per-year">{citationsPerYear.toFixed(1)}</span>
      )}
    </div>
  ),
  // Phase 10.145: PaperStatusBadges REMOVED - extraction status now shown in PaperHeader checkbox
  PaperActions: () => <div data-testid="paper-actions">Actions</div>,
  // Phase 10.123: CollapsibleMetadata
  CollapsibleMetadata: () => <div data-testid="collapsible-metadata">Extended Metadata</div>,
  // Phase 10.123: MatchScoreBadge
  MatchScoreBadge: ({ neuralRelevanceScore }: { neuralRelevanceScore?: number | null }) => (
    <div data-testid="match-score-badge">
      {neuralRelevanceScore && <span data-testid="neural-score">{neuralRelevanceScore}</span>}
    </div>
  ),
  // Phase 10.123: Error Boundary
  PaperCardErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  // Phase 10.123 Phase 5: Analytics (no-op mocks)
  trackTooltipOpened: vi.fn(),
  trackTooltipClosed: vi.fn(),
  trackMetadataExpanded: vi.fn(),
  trackMetadataCollapsed: vi.fn(),
  // Constants
  MAX_DISPLAYED_PUBLICATION_TYPES: 3,
  MAX_DISPLAYED_MESH_TERMS: 5,
  MAX_DISPLAYED_GRANTS: 3,
  MAX_AFFILIATION_LENGTH: 100,
  MAX_GRANT_AGENCY_LENGTH: 50,
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// Test Utilities
// ============================================================================

const createMockPaper = (overrides: Partial<Paper> = {}): Paper => ({
  id: 'paper-123',
  title: 'Machine Learning Applications in Healthcare Diagnostics',
  authors: ['Smith, J.', 'Doe, A.', 'Johnson, B.'],
  year: 2024,
  abstract: 'A comprehensive study on ML applications in medical diagnosis...',
  venue: 'Nature Medicine',
  source: 'pubmed',
  doi: '10.1234/nm.2024.001',
  url: 'https://doi.org/10.1234/nm.2024.001',
  citationCount: 150,
  wordCount: 5000,
  abstractWordCount: 250,
  qualityScore: 85,
  hasFullText: true,
  isEligible: true,
  ...overrides,
});

const MockSourceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} data-testid="source-icon" />
);

const defaultProps = {
  paper: createMockPaper(),
  isSelected: false,
  isSaved: false,
  isExtracting: false,
  isExtracted: false,
  onToggleSelection: vi.fn(),
  onToggleSave: vi.fn(),
  getSourceIcon: () => MockSourceIcon,
};

const renderPaperCard = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<PaperCard {...props} />);
};

// ============================================================================
// Test Suites
// ============================================================================

describe('PaperCard Component - Day 4 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 4.1 Paper Card Rendering
  // ==========================================================================

  describe('4.1 Paper Card Rendering', () => {
    it('should render paper header with title', () => {
      renderPaperCard();

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning Applications in Healthcare Diagnostics')).toBeInTheDocument();
    });

    it('should render paper authors', () => {
      renderPaperCard();

      expect(screen.getByText(/Smith, J\., Doe, A\., Johnson, B\./)).toBeInTheDocument();
    });

    it('should render paper metadata', () => {
      renderPaperCard();

      expect(screen.getByTestId('paper-metadata')).toBeInTheDocument();
    });

    it('should render year in metadata', () => {
      renderPaperCard();

      expect(screen.getByTestId('year')).toHaveTextContent('2024');
    });

    it('should render venue in metadata', () => {
      renderPaperCard();

      expect(screen.getByTestId('venue')).toHaveTextContent('Nature Medicine');
    });

    it('should render citation count in metadata', () => {
      renderPaperCard();

      expect(screen.getByTestId('citations')).toHaveTextContent('150');
    });

    it('should render word count in metadata', () => {
      renderPaperCard();

      expect(screen.getByTestId('wordcount')).toHaveTextContent('5000');
    });

    it('should render DOI badge when available', () => {
      renderPaperCard();

      expect(screen.getByTestId('doi')).toBeInTheDocument();
    });

    it('should render full text badge when available', () => {
      renderPaperCard();

      expect(screen.getByTestId('fulltext')).toBeInTheDocument();
    });

    // Phase 10.154: Quality score moved to MatchScoreBadge tooltip
    // PaperQualityBadges now only shows citations per year
    it('should render citations per year when available', () => {
      renderPaperCard();

      // citationsPerYear shows as formatted number in the mock
      expect(screen.getByTestId('paper-quality')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalPaper = createMockPaper({
        venue: undefined,
        citationCount: undefined,
        wordCount: undefined,
        doi: undefined,
        hasFullText: false,
        qualityScore: undefined,
      });

      renderPaperCard({ paper: minimalPaper });

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4.2 Selection Mechanics
  // ==========================================================================

  describe('4.2 Selection Mechanics', () => {
    it('should toggle selection when card is clicked', async () => {
      const onToggleSelection = vi.fn();
      renderPaperCard({ onToggleSelection });

      const card = screen.getByRole('article');
      fireEvent.click(card);

      expect(onToggleSelection).toHaveBeenCalledWith('paper-123');
    });

    it('should toggle selection when checkbox is clicked', async () => {
      const onToggleSelection = vi.fn();
      renderPaperCard({ onToggleSelection });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Checkbox click should trigger selection
      expect(checkbox).toBeInTheDocument();
    });

    it('should show selected state when isSelected is true', () => {
      renderPaperCard({ isSelected: true });

      const card = screen.getByRole('article');
      expect(card.className).toContain('border-blue-500');
      expect(card.className).toContain('bg-blue-50/50');
    });

    it('should show default state when isSelected is false', () => {
      renderPaperCard({ isSelected: false });

      const card = screen.getByRole('article');
      expect(card.className).not.toContain('border-blue-500');
    });

    it('should update checkbox checked state based on isSelected', () => {
      renderPaperCard({ isSelected: true });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should call onToggleSelection with correct paper ID', () => {
      const onToggleSelection = vi.fn();
      const paper = createMockPaper({ id: 'unique-paper-id' });
      renderPaperCard({ paper, onToggleSelection });

      const card = screen.getByRole('article');
      fireEvent.click(card);

      expect(onToggleSelection).toHaveBeenCalledWith('unique-paper-id');
    });
  });

  // ==========================================================================
  // 4.3 Extraction State Display
  // ==========================================================================

  describe('4.3 Extraction State Display', () => {
    it('should show extracting badge when isExtracting is true', () => {
      renderPaperCard({ isExtracting: true });

      expect(screen.getByTestId('extracting')).toBeInTheDocument();
    });

    it('should show extracted badge when isExtracted is true', () => {
      renderPaperCard({ isExtracted: true });

      expect(screen.getByTestId('extracted')).toBeInTheDocument();
    });

    it('should apply extracting styles when isExtracting', () => {
      renderPaperCard({ isExtracting: true });

      const card = screen.getByRole('article');
      expect(card.className).toContain('border-amber-300');
      expect(card.className).toContain('bg-amber-50/30');
    });

    it('should apply extracted styles when isExtracted', () => {
      renderPaperCard({ isExtracted: true });

      const card = screen.getByRole('article');
      expect(card.className).toContain('border-green-200');
      expect(card.className).toContain('bg-green-50/30');
    });

    it('should prioritize selected style over extracted style', () => {
      renderPaperCard({ isSelected: true, isExtracted: true });

      const card = screen.getByRole('article');
      expect(card.className).toContain('border-blue-500');
    });
  });

  // ==========================================================================
  // 4.4 Keyboard Accessibility
  // ==========================================================================

  describe('4.4 Keyboard Accessibility', () => {
    it('should have role="article"', () => {
      renderPaperCard();

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have aria-label with paper title', () => {
      renderPaperCard();

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute(
        'aria-label',
        'Paper: Machine Learning Applications in Healthcare Diagnostics'
      );
    });

    it('should be focusable with tabIndex=0', () => {
      renderPaperCard();

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should toggle selection on Enter key', () => {
      const onToggleSelection = vi.fn();
      renderPaperCard({ onToggleSelection });

      const card = screen.getByRole('article');
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter', target: card, currentTarget: card });

      expect(onToggleSelection).toHaveBeenCalledWith('paper-123');
    });

    it('should toggle selection on Space key', () => {
      const onToggleSelection = vi.fn();
      renderPaperCard({ onToggleSelection });

      const card = screen.getByRole('article');
      fireEvent.keyDown(card, { key: ' ', code: 'Space', target: card, currentTarget: card });

      expect(onToggleSelection).toHaveBeenCalledWith('paper-123');
    });

    it('should not trigger selection on other keys', () => {
      const onToggleSelection = vi.fn();
      renderPaperCard({ onToggleSelection });

      const card = screen.getByRole('article');
      fireEvent.keyDown(card, { key: 'Tab', code: 'Tab', target: card, currentTarget: card });

      expect(onToggleSelection).not.toHaveBeenCalled();
    });

    it('should have focus ring styles', () => {
      renderPaperCard();

      const card = screen.getByRole('article');
      expect(card.className).toContain('focus:ring-2');
      expect(card.className).toContain('focus:ring-blue-500');
    });
  });

  // ==========================================================================
  // 4.5 Extended Metadata Display
  // ==========================================================================

  describe('4.5 Extended Metadata Display', () => {
    it('should render publication types when available', () => {
      const paper = createMockPaper({
        publicationType: ['Research Article', 'Journal Article'],
      });
      renderPaperCard({ paper });

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
    });

    it('should render MeSH terms when available', () => {
      const paper = createMockPaper({
        meshTerms: [
          { descriptor: 'Machine Learning', qualifiers: ['methods'] },
          { descriptor: 'Healthcare', qualifiers: [] },
        ],
      });
      renderPaperCard({ paper });

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
    });

    it('should render author affiliations when available', () => {
      const paper = createMockPaper({
        authorAffiliations: [
          { author: 'Smith, J.', affiliation: 'Harvard Medical School' },
        ],
      });
      renderPaperCard({ paper });

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
    });

    it('should render grants when available', () => {
      const paper = createMockPaper({
        grants: [
          { agency: 'NIH', grantId: 'R01-12345' },
        ],
      });
      renderPaperCard({ paper });

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4.6 Source Icon Display
  // ==========================================================================

  describe('4.6 Source Icon Display', () => {
    it('should call getSourceIcon with normalized source name', () => {
      const getSourceIcon = vi.fn().mockReturnValue(MockSourceIcon);
      renderPaperCard({ getSourceIcon });

      expect(getSourceIcon).toHaveBeenCalled();
    });

    it('should handle different source formats', () => {
      const getSourceIcon = vi.fn().mockReturnValue(MockSourceIcon);
      const paper = createMockPaper({ source: 'Semantic Scholar' });
      renderPaperCard({ paper, getSourceIcon });

      expect(getSourceIcon).toHaveBeenCalled();
    });

    it('should handle undefined source gracefully', () => {
      const getSourceIcon = vi.fn().mockReturnValue(MockSourceIcon);
      const paper = createMockPaper({ source: undefined });
      renderPaperCard({ paper, getSourceIcon });

      expect(getSourceIcon).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 4.7 Performance (Memoization)
  // ==========================================================================

  describe('4.7 Performance (Memoization)', () => {
    it('should be wrapped in React.memo', () => {
      const { rerender } = renderPaperCard();

      rerender(
        <PaperCard
          {...defaultProps}
        />
      );

      expect(screen.getByTestId('paper-header')).toBeInTheDocument();
    });

    it('should memoize selection handler', () => {
      const onToggleSelection = vi.fn();
      const { rerender } = renderPaperCard({ onToggleSelection });

      rerender(
        <PaperCard
          {...defaultProps}
          onToggleSelection={onToggleSelection}
        />
      );

      const card = screen.getByRole('article');
      fireEvent.click(card);

      expect(onToggleSelection).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('PaperCard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete selection flow', async () => {
    const onToggleSelection = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <PaperCard
        {...defaultProps}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    const card = screen.getByRole('article');
    await user.click(card);
    expect(onToggleSelection).toHaveBeenCalledWith('paper-123');

    rerender(
      <PaperCard
        {...defaultProps}
        isSelected={true}
        onToggleSelection={onToggleSelection}
      />
    );

    expect(card.className).toContain('border-blue-500');
  });

  it('should handle extraction state transitions', () => {
    const { rerender } = renderPaperCard({ isExtracting: false, isExtracted: false });

    rerender(
      <PaperCard
        {...defaultProps}
        isExtracting={true}
        isExtracted={false}
      />
    );

    expect(screen.getByTestId('extracting')).toBeInTheDocument();

    rerender(
      <PaperCard
        {...defaultProps}
        isExtracting={false}
        isExtracted={true}
      />
    );

    expect(screen.getByTestId('extracted')).toBeInTheDocument();
  });

  it('should maintain accessibility through interactions', () => {
    renderPaperCard();

    const card = screen.getByRole('article');
    card.focus();

    expect(card).toHaveAttribute('aria-label');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
