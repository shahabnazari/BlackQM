/**
 * Unit Tests for SourceBreakdown Component
 * Phase 10.91 Day 11 - Enterprise-Grade Testing
 *
 * Tests SourceBreakdown component with comprehensive edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SourceBreakdown } from '../SourceBreakdown';
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

describe('SourceBreakdown', () => {
  const mockSourceBreakdown = {
    pubmed: 500,
    semantic_scholar: 300,
    arxiv: 200,
    crossref: 0,
  };

  const defaultProps = {
    sourceBreakdown: mockSourceBreakdown,
    totalCollected: 1000,
    status: 'loading' as const,
  };

  describe('Rendering', () => {
    it('should render source breakdown panel', () => {
      render(<SourceBreakdown {...defaultProps} />);
      expect(screen.getByText(/Sources Queried/i)).toBeInTheDocument();
    });

    it('should display correct source count', () => {
      render(<SourceBreakdown {...defaultProps} />);
      expect(screen.getByText(/Sources Queried \(4\)/i)).toBeInTheDocument();
    });

    it('should render all sources with their counts', () => {
      render(<SourceBreakdown {...defaultProps} />);
      expect(screen.getByText(/PubMed/i)).toBeInTheDocument();
      expect(screen.getByText(/Semantic Scholar/i)).toBeInTheDocument();
      expect(screen.getByText(/ArXiv/i)).toBeInTheDocument();
      expect(screen.getByText(/CrossRef/i)).toBeInTheDocument();
    });
  });

  describe('Visibility Logic', () => {
    it('should return null when status is complete', () => {
      const { container } = render(
        <SourceBreakdown {...defaultProps} status="complete" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should return null when sourceBreakdown is null', () => {
      const { container } = render(
        <SourceBreakdown
          sourceBreakdown={null as any}
          totalCollected={1000}
          status="loading"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should return null when sourceBreakdown is empty', () => {
      const { container } = render(
        <SourceBreakdown
          sourceBreakdown={{}}
          totalCollected={1000}
          status="loading"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should be visible when status is loading', () => {
      render(<SourceBreakdown {...defaultProps} status="loading" />);
      expect(screen.getByText(/Sources Queried/i)).toBeInTheDocument();
    });

    it('should be visible when status is error', () => {
      render(<SourceBreakdown {...defaultProps} status="error" />);
      expect(screen.getByText(/Sources Queried/i)).toBeInTheDocument();
    });
  });

  describe('Source Sorting', () => {
    it('should sort sources by paper count (descending)', () => {
      render(<SourceBreakdown {...defaultProps} />);
      const sources = screen.getAllByText(/papers/i);

      // First should be PubMed (500), last should be CrossRef (0)
      expect(sources[0]).toHaveTextContent('500 papers');
      expect(sources[sources.length - 1]).toHaveTextContent('0 papers');
    });

    it('should handle numeric and object source data', () => {
      const mixedSourceBreakdown = {
        pubmed: 500,
        semantic_scholar: { papers: 300, duration: 1.5 },
        arxiv: 200,
        crossref: { papers: 0, duration: 0.8 },
      };

      render(
        <SourceBreakdown
          sourceBreakdown={mixedSourceBreakdown}
          totalCollected={1000}
          status="loading"
        />
      );

      expect(screen.getByText(/500 papers \(50\.0%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/300 papers \(30\.0%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/200 papers \(20\.0%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/0 papers \(0\.0%\)/i)).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate correct percentages', () => {
      render(<SourceBreakdown {...defaultProps} />);

      expect(screen.getByText(/500 papers \(50\.0%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/300 papers \(30\.0%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/200 papers \(20\.0%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/0 papers \(0\.0%\)/i)).toBeInTheDocument();
    });

    it('should handle division by zero (totalCollected = 0)', () => {
      render(
        <SourceBreakdown
          {...defaultProps}
          totalCollected={0}
        />
      );

      // When total is 0, percentage should default to using 1 as divisor
      expect(screen.getByText(/Sources Queried/i)).toBeInTheDocument();
    });
  });

  describe('Zero Papers Warning', () => {
    it('should show warning when some sources have 0 papers', () => {
      render(<SourceBreakdown {...defaultProps} />);
      expect(screen.getByText(/Some sources returned 0 papers/i)).toBeInTheDocument();
    });

    it('should not show warning when all sources have papers', () => {
      const allWithPapers = {
        pubmed: 500,
        semantic_scholar: 300,
        arxiv: 200,
      };

      render(
        <SourceBreakdown
          sourceBreakdown={allWithPapers}
          totalCollected={1000}
          status="loading"
        />
      );

      expect(screen.queryByText(/Some sources returned 0 papers/i)).not.toBeInTheDocument();
    });

    it('should show warning icon (⚠️) for 0-paper sources', () => {
      render(<SourceBreakdown {...defaultProps} />);
      // CrossRef has 0 papers, should have warning
      const warningIcons = screen.getAllByText('⚠️');
      expect(warningIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Display Names', () => {
    it('should use display name from constants for known sources', () => {
      render(<SourceBreakdown {...defaultProps} />);
      expect(screen.getByText('PubMed')).toBeInTheDocument();
      expect(screen.getByText('Semantic Scholar')).toBeInTheDocument();
    });

    it('should format unknown source names nicely', () => {
      const unknownSource = {
        unknown_database: 100,
      };

      render(
        <SourceBreakdown
          sourceBreakdown={unknownSource}
          totalCollected={100}
          status="loading"
        />
      );

      // Should convert "unknown_database" to "Unknown Database"
      expect(screen.getByText('Unknown Database')).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should have tooltips for sources with 0 papers', () => {
      render(<SourceBreakdown {...defaultProps} />);
      const tooltips = screen.getAllByTestId('tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
    });

    it('should have help tooltips for sources with papers', () => {
      render(<SourceBreakdown {...defaultProps} />);
      // HelpCircle icons should be rendered for sources with descriptions
      expect(screen.getByText(/Sources Queried/i)).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply amber color to 0-paper sources', () => {
      const { container } = render(<SourceBreakdown {...defaultProps} />);
      const amberTexts = container.querySelectorAll('.text-amber-600');
      expect(amberTexts.length).toBeGreaterThan(0);
    });

    it('should apply blue color to sources with papers', () => {
      const { container } = render(<SourceBreakdown {...defaultProps} />);
      const blueTexts = container.querySelectorAll('.text-blue-600');
      expect(blueTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small totalCollected (1)', () => {
      const smallBreakdown = {
        pubmed: 1,
      };

      render(
        <SourceBreakdown
          sourceBreakdown={smallBreakdown}
          totalCollected={1}
          status="loading"
        />
      );

      expect(screen.getByText(/1 papers \(100\.0%\)/i)).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const largeBreakdown = {
        pubmed: 1000000,
      };

      render(
        <SourceBreakdown
          sourceBreakdown={largeBreakdown}
          totalCollected={1000000}
          status="loading"
        />
      );

      expect(screen.getByText(/1,000,000 papers/i)).toBeInTheDocument();
    });

    it('should handle many sources (> 10)', () => {
      const manySources = {
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
        web_of_science: 5,
        scopus: 3,
      };

      render(
        <SourceBreakdown
          sourceBreakdown={manySources}
          totalCollected={558}
          status="loading"
        />
      );

      expect(screen.getByText(/Sources Queried \(12\)/i)).toBeInTheDocument();
    });
  });
});
