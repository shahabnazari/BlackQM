/**
 * Unit Tests for SearchTransparencySummary Component
 * Phase 10.91 Day 11 - Enterprise-Grade Testing
 *
 * Tests SearchTransparencySummary component with comprehensive edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchTransparencySummary } from '../SearchTransparencySummary';
import { vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>{children}</span>
    ),
  },
}));

// Mock Tooltip component
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" data-content={typeof content === 'string' ? content : 'complex-content'}>
      {children}
    </div>
  ),
}));

describe('SearchTransparencySummary', () => {
  const mockSearchMetadata = {
    sourcesQueried: 6,
    sourcesWithResults: 5,
    totalCollected: 1500,
    uniqueAfterDedup: 1200,
    finalSelected: 200,
    sourceBreakdown: {
      pubmed: 500,
      semantic_scholar: 400,
      arxiv: 300,
      crossref: 200,
      eric: 100,
      core: 0,
    },
  };

  const defaultProps = {
    searchMetadata: mockSearchMetadata,
    status: 'complete' as const,
  };

  describe('Visibility Logic', () => {
    it('should return null when status is not complete', () => {
      const { container } = render(
        <SearchTransparencySummary {...defaultProps} status="loading" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should return null when searchMetadata is undefined', () => {
      const { container } = render(
        <SearchTransparencySummary
          searchMetadata={undefined as any}
          status="complete"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when status is complete and metadata exists', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      expect(screen.getByText('How We Found These Papers')).toBeInTheDocument();
    });
  });

  describe('Stats Grid', () => {
    it('should display all 4 stat cards', () => {
      render(<SearchTransparencySummary {...defaultProps} />);

      expect(screen.getByText('Sources')).toBeInTheDocument();
      expect(screen.getByText('Collected')).toBeInTheDocument();
      expect(screen.getByText('Unique')).toBeInTheDocument();
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should display correct sources ratio', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      expect(screen.getByText('5/6')).toBeInTheDocument();
      expect(screen.getByText('databases with papers')).toBeInTheDocument();
    });

    it('should display total collected count', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('from all sources')).toBeInTheDocument();
    });

    it('should display unique count', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      expect(screen.getByText('1,200')).toBeInTheDocument();
    });

    it('should display final selected count', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      // Check for final selected count - use getAllByText since "200" appears in source breakdown too
      const elements = screen.getAllByText('200');
      expect(elements.length).toBeGreaterThan(0);
      expect(screen.getByText('by quality score')).toBeInTheDocument();
    });
  });

  describe('Duplicate Percentage Calculation', () => {
    it('should calculate duplicate percentage correctly', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      // (1500 - 1200) / 1500 * 100 = 20%
      expect(screen.getByText('20% duplicates removed')).toBeInTheDocument();
    });

    it('should handle 0% duplicates', () => {
      const noDuplicates = {
        ...mockSearchMetadata,
        totalCollected: 1200,
        uniqueAfterDedup: 1200,
      };

      render(
        <SearchTransparencySummary
          searchMetadata={noDuplicates}
          status="complete"
        />
      );

      expect(screen.getByText('0% duplicates removed')).toBeInTheDocument();
    });

    it('should handle 100% duplicates', () => {
      const allDuplicates = {
        ...mockSearchMetadata,
        totalCollected: 1000,
        uniqueAfterDedup: 0,
      };

      render(
        <SearchTransparencySummary
          searchMetadata={allDuplicates}
          status="complete"
        />
      );

      expect(screen.getByText('100% duplicates removed')).toBeInTheDocument();
    });

    it('should handle division by zero (totalCollected = 0)', () => {
      const zeroCollected = {
        ...mockSearchMetadata,
        totalCollected: 0,
        uniqueAfterDedup: 0,
      };

      render(
        <SearchTransparencySummary
          searchMetadata={zeroCollected}
          status="complete"
        />
      );

      expect(screen.getByText('0% duplicates removed')).toBeInTheDocument();
    });
  });

  describe('Source Breakdown', () => {
    it('should render source breakdown when provided', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      expect(screen.getByText('Papers per source:')).toBeInTheDocument();
    });

    it('should not render source breakdown when not provided', () => {
      const noBreakdown = {
        ...mockSearchMetadata,
        sourceBreakdown: undefined,
      };

      render(
        <SearchTransparencySummary
          searchMetadata={noBreakdown}
          status="complete"
        />
      );

      expect(screen.queryByText('Papers per source:')).not.toBeInTheDocument();
    });

    it('should not render source breakdown when empty', () => {
      const emptyBreakdown = {
        ...mockSearchMetadata,
        sourceBreakdown: {},
      };

      render(
        <SearchTransparencySummary
          searchMetadata={emptyBreakdown}
          status="complete"
        />
      );

      expect(screen.queryByText('Papers per source:')).not.toBeInTheDocument();
    });

    it('should display all sources from breakdown', () => {
      render(<SearchTransparencySummary {...defaultProps} />);

      expect(screen.getByText('PubMed')).toBeInTheDocument();
      expect(screen.getByText('Semantic Scholar')).toBeInTheDocument();
      expect(screen.getByText('ArXiv')).toBeInTheDocument();
      expect(screen.getByText('CrossRef')).toBeInTheDocument();
      expect(screen.getByText('ERIC')).toBeInTheDocument();
      expect(screen.getByText('CORE')).toBeInTheDocument();
    });
  });

  describe('Source Sorting and Percentages', () => {
    it('should sort sources by count (descending)', () => {
      const { container } = render(<SearchTransparencySummary {...defaultProps} />);
      // Query only source count elements (text-xs font-bold)
      const sourceCounts = Array.from(container.querySelectorAll('.text-xs.font-bold'))
        .filter(el => el.textContent?.match(/^\d+$/))
        .map(el => parseInt(el.textContent || '0'));

      // Should be sorted: 500, 400, 300, 200, 100, 0
      expect(sourceCounts[0]).toBe(500);
      expect(sourceCounts[sourceCounts.length - 1]).toBe(0);
    });

    it('should calculate correct percentages for each source', () => {
      render(<SearchTransparencySummary {...defaultProps} />);

      // PubMed: 500/1500 = 33.33% ≈ 33%
      expect(screen.getByText('33%')).toBeInTheDocument();

      // Semantic Scholar: 400/1500 = 26.67% ≈ 27%
      expect(screen.getByText('27%')).toBeInTheDocument();

      // ArXiv: 300/1500 = 20%
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('should handle numeric and object source data', () => {
      const mixedBreakdown = {
        ...mockSearchMetadata,
        sourceBreakdown: {
          pubmed: 500,
          semantic_scholar: { papers: 400, duration: 1.5 },
          arxiv: 200,
        },
      };

      render(
        <SearchTransparencySummary
          searchMetadata={mixedBreakdown}
          status="complete"
        />
      );

      expect(screen.getByText('PubMed')).toBeInTheDocument();
      expect(screen.getByText('Semantic Scholar')).toBeInTheDocument();
      expect(screen.getByText('ArXiv')).toBeInTheDocument();
    });
  });

  describe('Zero Papers Handling', () => {
    it('should show 0% for sources with 0 papers', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      const zeroPercentages = screen.getAllByText('0%');
      expect(zeroPercentages.length).toBeGreaterThan(0);
    });

    it('should apply gray styling to zero-paper sources', () => {
      const { container } = render(<SearchTransparencySummary {...defaultProps} />);
      const grayTexts = container.querySelectorAll('.text-gray-400');
      expect(grayTexts.length).toBeGreaterThan(0);
    });

    it('should show gray bar for zero-paper sources', () => {
      const { container } = render(<SearchTransparencySummary {...defaultProps} />);
      const grayBars = container.querySelectorAll('.bg-gray-300');
      expect(grayBars.length).toBeGreaterThan(0);
    });
  });

  describe('Display Names', () => {
    it('should use display name from constants for known sources', () => {
      render(<SearchTransparencySummary {...defaultProps} />);
      expect(screen.getByText('PubMed')).toBeInTheDocument();
      expect(screen.getByText('Semantic Scholar')).toBeInTheDocument();
    });

    it('should format unknown source names', () => {
      const unknownSource = {
        ...mockSearchMetadata,
        sourceBreakdown: {
          unknown_database: 100,
        },
      };

      render(
        <SearchTransparencySummary
          searchMetadata={unknownSource}
          status="complete"
        />
      );

      expect(screen.getByText('Unknown Database')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers with commas', () => {
      const largeNumbers = {
        sourcesQueried: 10,
        sourcesWithResults: 10,
        totalCollected: 1234567,
        uniqueAfterDedup: 987654,
        finalSelected: 12345,
      };

      render(
        <SearchTransparencySummary
          searchMetadata={largeNumbers}
          status="complete"
        />
      );

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('987,654')).toBeInTheDocument();
      expect(screen.getByText('12,345')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all sources with 0 papers', () => {
      const allZero = {
        ...mockSearchMetadata,
        totalCollected: 0,
        uniqueAfterDedup: 0,
        finalSelected: 0,
        sourceBreakdown: {
          pubmed: 0,
          arxiv: 0,
        },
      };

      render(
        <SearchTransparencySummary
          searchMetadata={allZero}
          status="complete"
        />
      );

      // Multiple "0" values in stats grid - use getAllByText
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
      expect(screen.getByText('0% duplicates removed')).toBeInTheDocument();
    });

    it('should handle single source', () => {
      const singleSource = {
        ...mockSearchMetadata,
        sourceBreakdown: {
          pubmed: 1000,
        },
      };

      render(
        <SearchTransparencySummary
          searchMetadata={singleSource}
          status="complete"
        />
      );

      expect(screen.getByText('PubMed')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument(); // 1000/1500
    });

    it('should handle many sources (> 10)', () => {
      const manySources = {
        ...mockSearchMetadata,
        sourceBreakdown: {
          pubmed: 100,
          pmc: 90,
          arxiv: 80,
          semantic_scholar: 70,
          crossref: 60,
          eric: 50,
          core: 40,
          springer: 30,
          ssrn: 20,
          google_scholar: 10,
        },
      };

      render(
        <SearchTransparencySummary
          searchMetadata={manySources}
          status="complete"
        />
      );

      expect(screen.getByText('Papers per source:')).toBeInTheDocument();
    });
  });
});
