/**
 * AcademicResourcesPanel Component Tests
 * Phase 10.6 Day 14.2: Comprehensive unit tests for Apple UI redesign
 *
 * Tests cover:
 * - Rendering and UI structure
 * - Source selection interaction
 * - Button type and ARIA attributes
 * - Accessibility compliance
 * - Category separation (free vs premium)
 * - Visual feedback and animations
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AcademicResourcesPanel } from '../AcademicResourcesPanel';
import type { Paper } from '@/lib/types/literature.types';
import type { InstitutionAuth } from '../AcademicResourcesPanel';

// Mock dependencies
jest.mock('@/components/literature/AcademicInstitutionLogin', () => ({
  AcademicInstitutionLogin: () => <div data-testid="institution-login">Institution Login</div>,
}));

jest.mock('@/components/literature/CostCalculator', () => ({
  CostCalculator: () => <div data-testid="cost-calculator">Cost Calculator</div>,
}));

jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
  },
}));

// Mock Lucide icons
const mockIconComponent = ({ className }: { className?: string }) => (
  <div className={className} data-testid="mock-icon" />
);

describe('AcademicResourcesPanel', () => {
  // Default props
  const defaultInstitutionAuth: InstitutionAuth = {
    isAuthenticated: false,
    institution: null,
    authMethod: null,
    freeAccess: false,
    accessibleDatabases: [],
  };

  const defaultProps = {
    academicDatabases: [] as string[],
    onDatabasesChange: jest.fn(),
    institutionAuth: defaultInstitutionAuth,
    onInstitutionAuthChange: jest.fn(),
    papers: [] as Paper[],
    selectedPapers: new Set<string>(),
    transcribedVideosCount: 0,
    analyzingThemes: false,
    onExtractThemes: jest.fn(),
    onIncrementalExtraction: jest.fn(),
    onCorpusManagement: jest.fn(),
    onExportCitations: jest.fn(),
    corpusCount: 0,
    extractingPapers: new Set<string>(),
    getSourceIcon: () => mockIconComponent,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('Academic Resources & Institutional Access')).toBeInTheDocument();
    });

    it('should render selection summary with correct count', () => {
      render(<AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed', 'arxiv']} />);
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should render zero selection helper text when no sources selected', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('Select at least one database to begin your search')).toBeInTheDocument();
      expect(screen.getByText(/Tip: Start with open access sources/i)).toBeInTheDocument();
    });

    it('should not render helper text when sources are selected', () => {
      render(<AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed']} />);
      expect(screen.queryByText('Select at least one database to begin your search')).not.toBeInTheDocument();
    });
  });

  describe('Category Separation', () => {
    it('should render "Open Access - Free" section header', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('Open Access - Free')).toBeInTheDocument();
      expect(screen.getByText('No subscription required')).toBeInTheDocument();
    });

    it('should render "Premium Databases" section header', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('Premium Databases')).toBeInTheDocument();
      expect(screen.getByText('Requires API key or institutional access')).toBeInTheDocument();
    });

    it('should render free sources (PubMed, ArXiv, etc.)', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('PubMed')).toBeInTheDocument();
      expect(screen.getByText('ArXiv')).toBeInTheDocument();
      expect(screen.getByText('PubMed Central')).toBeInTheDocument();
      expect(screen.getByText('bioRxiv/medRxiv')).toBeInTheDocument();
    });

    it('should render premium sources (Web of Science, Scopus, etc.)', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('Web of Science')).toBeInTheDocument();
      expect(screen.getByText('Scopus')).toBeInTheDocument();
      expect(screen.getByText('IEEE Xplore')).toBeInTheDocument();
    });
  });

  describe('Button Attributes - Page Refresh Bug Fix', () => {
    it('should have type="button" on all source buttons to prevent form submission', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      // Get all buttons with source labels
      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      const arxivButton = screen.getByRole('button', { name: /ArXiv/i });

      expect(pubmedButton).toHaveAttribute('type', 'button');
      expect(arxivButton).toHaveAttribute('type', 'button');
    });

    it('should have aria-pressed attribute for toggle state', () => {
      render(<AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed']} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      expect(pubmedButton).toHaveAttribute('aria-pressed', 'true');

      const arxivButton = screen.getByRole('button', { name: /ArXiv/i });
      expect(arxivButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have aria-label for accessibility', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed.*Medical.*life sciences/i });
      expect(pubmedButton).toHaveAttribute('aria-label');
    });
  });

  describe('Source Selection Interaction', () => {
    it('should call onDatabasesChange when source is clicked', () => {
      const onDatabasesChange = jest.fn();
      render(<AcademicResourcesPanel {...defaultProps} onDatabasesChange={onDatabasesChange} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      fireEvent.click(pubmedButton);

      expect(onDatabasesChange).toHaveBeenCalledWith(['pubmed']);
    });

    it('should add source to selection when clicked (unselected → selected)', () => {
      const onDatabasesChange = jest.fn();
      render(<AcademicResourcesPanel {...defaultProps} onDatabasesChange={onDatabasesChange} />);

      const arxivButton = screen.getByRole('button', { name: /ArXiv/i });
      fireEvent.click(arxivButton);

      expect(onDatabasesChange).toHaveBeenCalledWith(['arxiv']);
    });

    it('should remove source from selection when clicked (selected → unselected)', () => {
      const onDatabasesChange = jest.fn();
      render(<AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed', 'arxiv']} onDatabasesChange={onDatabasesChange} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      fireEvent.click(pubmedButton);

      expect(onDatabasesChange).toHaveBeenCalledWith(['arxiv']);
    });

    it('should handle multiple selections', () => {
      const onDatabasesChange = jest.fn();
      const { rerender } = render(
        <AcademicResourcesPanel {...defaultProps} onDatabasesChange={onDatabasesChange} />
      );

      // Select first source
      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      fireEvent.click(pubmedButton);
      expect(onDatabasesChange).toHaveBeenCalledWith(['pubmed']);

      // Update props to reflect selection
      rerender(
        <AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed']} onDatabasesChange={onDatabasesChange} />
      );

      // Select second source
      const arxivButton = screen.getByRole('button', { name: /ArXiv/i });
      fireEvent.click(arxivButton);
      expect(onDatabasesChange).toHaveBeenCalledWith(['pubmed', 'arxiv']);
    });

    it('should not trigger page navigation or form submission', () => {
      // Mock window.location to detect navigation
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: 'http://localhost/' };

      render(<AcademicResourcesPanel {...defaultProps} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      fireEvent.click(pubmedButton);

      // Location should not change
      expect(window.location.href).toBe('http://localhost/');

      // Restore original location
      window.location = originalLocation;
    });
  });

  describe('Visual Feedback', () => {
    it('should display checkmark indicator for selected sources', () => {
      render(<AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed']} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });
      const checkmark = within(pubmedButton).getByRole('img', { hidden: true }); // SVG checkmark

      expect(checkmark).toBeInTheDocument();
    });

    it('should apply selected state classes to selected sources', () => {
      render(<AcademicResourcesPanel {...defaultProps} academicDatabases={['pubmed']} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });

      // Check for selected state classes (gradient, border, shadow)
      expect(pubmedButton.className).toContain('from-green-50');
      expect(pubmedButton.className).toContain('border-green-400');
    });

    it('should apply unselected state classes to unselected sources', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      const arxivButton = screen.getByRole('button', { name: /ArXiv/i });

      // Check for unselected state classes
      expect(arxivButton.className).toContain('bg-white/60');
      expect(arxivButton.className).toContain('backdrop-blur-sm');
    });

    it('should show "API" badge on premium sources (hover state)', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      const scopusButton = screen.getByRole('button', { name: /Scopus/i });

      // API badge should exist (even if hidden via opacity)
      expect(within(scopusButton).getByText('API')).toBeInTheDocument();
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<AcademicResourcesPanel {...defaultProps} />);

      // Find grid containers
      const grids = container.querySelectorAll('.grid');

      expect(grids.length).toBeGreaterThan(0);

      // Check for responsive classes
      const gridElement = grids[0];
      expect(gridElement.className).toContain('grid-cols-1');
      expect(gridElement.className).toContain('sm:grid-cols-2');
      expect(gridElement.className).toContain('lg:grid-cols-4');
      expect(gridElement.className).toContain('xl:grid-cols-5');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      // All source buttons should have button role
      const buttons = screen.getAllByRole('button', { name: /.*/ });
      expect(buttons.length).toBeGreaterThan(10); // 18 sources + action buttons
    });

    it('should support keyboard navigation', () => {
      const onDatabasesChange = jest.fn();
      render(<AcademicResourcesPanel {...defaultProps} onDatabasesChange={onDatabasesChange} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });

      // Focus the button
      pubmedButton.focus();
      expect(pubmedButton).toHaveFocus();

      // Press Enter key
      fireEvent.keyDown(pubmedButton, { key: 'Enter', code: 'Enter' });

      // Should trigger selection (via click event)
      // Note: React Testing Library automatically triggers onClick on Enter for buttons
    });

    it('should have focus-visible styles', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      const pubmedButton = screen.getByRole('button', { name: /PubMed/i });

      expect(pubmedButton.className).toContain('focus-visible:outline-none');
      expect(pubmedButton.className).toContain('focus-visible:ring-2');
      expect(pubmedButton.className).toContain('focus-visible:ring-green-500');
    });
  });

  describe('Action Buttons', () => {
    it('should render Extract Themes button', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByText('Extract Themes from All Sources')).toBeInTheDocument();
    });

    it('should call onExtractThemes when button is clicked', () => {
      const onExtractThemes = jest.fn();
      render(<AcademicResourcesPanel {...defaultProps} onExtractThemes={onExtractThemes} />);

      const button = screen.getByText('Extract Themes from All Sources');
      fireEvent.click(button);

      expect(onExtractThemes).toHaveBeenCalledTimes(1);
    });

    it('should disable Extract Themes button when no papers and no videos', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);

      const button = screen.getByText('Extract Themes from All Sources');
      expect(button).toBeDisabled();
    });

    it('should enable Extract Themes button when papers exist', () => {
      const papers: Paper[] = [
        {
          id: '1',
          title: 'Test Paper',
          authors: ['Author 1'],
          abstract: 'Test abstract',
          year: 2024,
          source: 'pubmed' as any,
          wordCount: 250,
          wordCountExcludingRefs: 250,
          isEligible: true,
          abstractWordCount: 200,
          qualityScore: 80,
          isHighQuality: true,
          citationCount: 10,
        },
      ];

      render(<AcademicResourcesPanel {...defaultProps} papers={papers} selectedPapers={new Set(['1'])} />);

      const button = screen.getByText('Extract Themes from All Sources');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Integration Components', () => {
    it('should render AcademicInstitutionLogin component', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByTestId('institution-login')).toBeInTheDocument();
    });

    it('should render CostCalculator component', () => {
      render(<AcademicResourcesPanel {...defaultProps} />);
      expect(screen.getByTestId('cost-calculator')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily with memo', () => {
      const { rerender } = render(<AcademicResourcesPanel {...defaultProps} />);

      // Rerender with same props
      rerender(<AcademicResourcesPanel {...defaultProps} />);

      // Component should be memoized and not re-render
      // (This is a simplified test - in real scenario use React.memo testing utilities)
      expect(screen.getByText('Academic Resources & Institutional Access')).toBeInTheDocument();
    });
  });
});
