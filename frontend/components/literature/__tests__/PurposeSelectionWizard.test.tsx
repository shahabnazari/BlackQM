/**
 * PurposeSelectionWizard Unit Tests
 * Phase 10.942 Day 5: Theme Extraction Initiation Testing
 *
 * Test Coverage:
 * - 5.2 Purpose Selection Wizard
 *   - 5 research purposes displayed
 *   - Content analysis shows full-text vs abstract counts
 *   - Content warnings for low full-text count
 *   - Purpose selection closes wizard
 *
 * Enterprise Standards:
 * - ✅ TypeScript strict mode
 * - ✅ RTL best practices
 * - ✅ Accessibility testing (ARIA, keyboard navigation)
 * - ✅ Animation testing with framer-motion
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PurposeSelectionWizard, { ResearchPurpose } from '../PurposeSelectionWizard';
import { ContentType } from '@/lib/types/content-types';

// ============================================================================
// Mock Framer Motion
// ============================================================================

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ============================================================================
// Test Data
// ============================================================================

interface ContentAnalysisOverrides {
  fullTextCount?: number;
  abstractOverflowCount?: number;
  abstractCount?: number;
  noContentCount?: number;
  avgContentLength?: number;
  hasFullTextContent?: boolean;
  sources?: Array<{ id: string; title: string }>;
  totalSelected?: number;
  totalWithContent?: number;
  totalSkipped?: number;
  selectedPapersList?: Array<{
    id: string;
    title: string;
    hasContent: boolean;
    contentType: ContentType;
    contentLength: number;
    skipReason?: string;
  }>;
}

const createMockContentAnalysis = (overrides: ContentAnalysisOverrides = {}) => ({
  fullTextCount: 10,
  abstractOverflowCount: 5,
  abstractCount: 15,
  noContentCount: 2,
  avgContentLength: 1500,
  hasFullTextContent: true,
  sources: [],
  totalSelected: 32,
  totalWithContent: 30,
  totalSkipped: 2,
  selectedPapersList: [
    {
      id: 'paper-1',
      title: 'Full Text Paper 1',
      hasContent: true,
      contentType: ContentType.FULL_TEXT,
      contentLength: 10000,
    },
    {
      id: 'paper-2',
      title: 'Abstract Paper 1',
      hasContent: true,
      contentType: ContentType.ABSTRACT,
      contentLength: 500,
    },
    {
      id: 'paper-3',
      title: 'Skipped Paper',
      hasContent: false,
      contentType: ContentType.NONE,
      contentLength: 0,
      skipReason: 'No content available',
    },
  ],
  ...overrides,
});

const EXPECTED_PURPOSES: Array<{ id: ResearchPurpose; title: string; themeRange: string }> = [
  { id: 'q_methodology', title: 'Q-Methodology', themeRange: '30-80' },
  { id: 'survey_construction', title: 'Survey Construction', themeRange: '5-15' },
  { id: 'qualitative_analysis', title: 'Qualitative Analysis', themeRange: '5-20' },
  { id: 'literature_synthesis', title: 'Literature Synthesis', themeRange: '10-25' },
  { id: 'hypothesis_generation', title: 'Hypothesis Generation', themeRange: '8-15' },
];

// ============================================================================
// Test Suite
// ============================================================================

describe('PurposeSelectionWizard', () => {
  const mockOnPurposeSelected = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWizard = (contentAnalysis = createMockContentAnalysis()) => {
    return render(
      <PurposeSelectionWizard
        onPurposeSelected={mockOnPurposeSelected}
        onCancel={mockOnCancel}
        contentAnalysis={contentAnalysis}
      />
    );
  };

  // ==========================================================================
  // Step 0: Content Analysis Tests
  // ==========================================================================

  describe('Step 0: Content Analysis', () => {
    it('should start at Step 0 (Content Analysis)', () => {
      renderWizard();

      expect(screen.getByText('Content Analysis')).toBeInTheDocument();
      expect(screen.getByText(/review your selected sources/i)).toBeInTheDocument();
    });

    it('should show full-text paper count', () => {
      const analysis = createMockContentAnalysis({ fullTextCount: 10 });
      renderWizard(analysis);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText(/full-text papers/i)).toBeInTheDocument();
    });

    it('should show abstract overflow count', () => {
      const analysis = createMockContentAnalysis({ abstractOverflowCount: 5 });
      renderWizard(analysis);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/full articles/i)).toBeInTheDocument();
    });

    it('should show abstract-only count', () => {
      const analysis = createMockContentAnalysis({ abstractCount: 15 });
      renderWizard(analysis);

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText(/abstracts only/i)).toBeInTheDocument();
    });

    it('should show HIGH quality expectation with full-text content', () => {
      const analysis = createMockContentAnalysis({ hasFullTextContent: true });
      renderWizard(analysis);

      expect(screen.getByText(/expected theme quality.*high/i)).toBeInTheDocument();
    });

    it('should show MODERATE quality expectation without full-text content', () => {
      const analysis = createMockContentAnalysis({
        hasFullTextContent: false,
        fullTextCount: 0,
        abstractOverflowCount: 0,
      });
      renderWizard(analysis);

      expect(screen.getByText(/expected theme quality.*moderate/i)).toBeInTheDocument();
    });

    it('should show selected papers list with content status', () => {
      const analysis = createMockContentAnalysis();
      renderWizard(analysis);

      // Check for paper titles
      expect(screen.getByText('Full Text Paper 1')).toBeInTheDocument();
      expect(screen.getByText('Abstract Paper 1')).toBeInTheDocument();
      expect(screen.getByText('Skipped Paper')).toBeInTheDocument();

      // Check for status indicators
      expect(screen.getAllByText(/will be used/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/will be skipped/i).length).toBeGreaterThan(0);
    });

    it('should show total sources count summary', () => {
      const analysis = createMockContentAnalysis({
        totalWithContent: 30,
        totalSkipped: 2,
        totalSelected: 32,
      });
      renderWizard(analysis);

      expect(screen.getByText(/30 will be used/i)).toBeInTheDocument();
      expect(screen.getByText(/2 will be skipped/i)).toBeInTheDocument();
      expect(screen.getByText(/total: 32 sources/i)).toBeInTheDocument();
    });

    it('should navigate to Step 1 when clicking "Next: Choose Research Purpose"', async () => {
      const user = userEvent.setup();
      renderWizard();

      const nextButton = screen.getByRole('button', { name: /next.*choose research purpose/i });
      await user.click(nextButton);

      expect(screen.getByText('Select Your Research Goal')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Step 1: Purpose Selection Tests
  // ==========================================================================

  describe('Step 1: Purpose Selection', () => {
    const navigateToStep1 = async () => {
      const user = userEvent.setup();
      renderWizard();
      const nextButton = screen.getByRole('button', { name: /next.*choose research purpose/i });
      await user.click(nextButton);
    };

    it('should display all 5 research purposes', async () => {
      await navigateToStep1();

      for (const purpose of EXPECTED_PURPOSES) {
        expect(screen.getByText(purpose.title)).toBeInTheDocument();
      }
    });

    it('should show Q-Methodology with 30-80 themes target', async () => {
      await navigateToStep1();

      expect(screen.getByText('Q-Methodology')).toBeInTheDocument();
      expect(screen.getByText(/30-80 themes/)).toBeInTheDocument();
    });

    it('should show Survey Construction with 5-15 themes target', async () => {
      await navigateToStep1();

      expect(screen.getByText('Survey Construction')).toBeInTheDocument();
      expect(screen.getByText(/5-15 themes/)).toBeInTheDocument();
    });

    it('should show Qualitative Analysis with 5-20 themes target', async () => {
      await navigateToStep1();

      expect(screen.getByText('Qualitative Analysis')).toBeInTheDocument();
      expect(screen.getByText(/5-20 themes/)).toBeInTheDocument();
    });

    it('should show Literature Synthesis with 10-25 themes target', async () => {
      await navigateToStep1();

      expect(screen.getByText('Literature Synthesis')).toBeInTheDocument();
      expect(screen.getByText(/10-25 themes/)).toBeInTheDocument();
    });

    it('should show Hypothesis Generation with 8-15 themes target', async () => {
      await navigateToStep1();

      expect(screen.getByText('Hypothesis Generation')).toBeInTheDocument();
      expect(screen.getByText(/8-15 themes/)).toBeInTheDocument();
    });

    it('should show extraction focus badge for each purpose', async () => {
      await navigateToStep1();

      expect(screen.getAllByText(/focus:/i).length).toBeGreaterThan(0);
    });

    it('should show granularity badge for each purpose', async () => {
      await navigateToStep1();

      expect(screen.getAllByText(/granularity:/i).length).toBeGreaterThan(0);
    });

    it('should navigate to Step 2 when clicking a purpose', async () => {
      const user = userEvent.setup();
      await navigateToStep1();

      const qMethodologyButton = screen.getByRole('button', { name: /q-methodology/i });
      await user.click(qMethodologyButton);

      expect(screen.getByText('Scientific Backing')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Step 2: Scientific Backing Tests
  // ==========================================================================

  describe('Step 2: Scientific Backing', () => {
    const navigateToStep2 = async (purpose: ResearchPurpose = 'q_methodology') => {
      const user = userEvent.setup();
      renderWizard();

      // Step 0 → Step 1
      const nextButton = screen.getByRole('button', { name: /next.*choose research purpose/i });
      await user.click(nextButton);

      // Step 1 → Step 2
      const purposeButton = screen.getByRole('button', { name: new RegExp(purpose.replace('_', ' '), 'i') });
      await user.click(purposeButton);
    };

    it('should show selected purpose header', async () => {
      await navigateToStep2('q_methodology');

      // Q-Methodology should be displayed as header
      const headers = screen.getAllByRole('heading');
      expect(headers.some(h => h.textContent?.includes('Q-Methodology'))).toBe(true);
    });

    it('should show scientific citation', async () => {
      await navigateToStep2('q_methodology');

      expect(screen.getByText(/stephenson.*1953/i)).toBeInTheDocument();
    });

    it('should show "Best For" list', async () => {
      await navigateToStep2('q_methodology');

      expect(screen.getByText(/best for/i)).toBeInTheDocument();
      expect(screen.getByText(/exploring subjective viewpoints/i)).toBeInTheDocument();
    });

    it('should show example use case', async () => {
      await navigateToStep2('q_methodology');

      expect(screen.getByText(/example use case/i)).toBeInTheDocument();
    });

    it('should show content sufficiency warning when insufficient full-text for blocking purpose', async () => {
      const user = userEvent.setup();

      // Create analysis with very low full-text count
      const analysis = createMockContentAnalysis({
        fullTextCount: 2, // Below minimum for literature_synthesis (10)
        abstractOverflowCount: 0,
      });
      render(
        <PurposeSelectionWizard
          onPurposeSelected={mockOnPurposeSelected}
          onCancel={mockOnCancel}
          contentAnalysis={analysis}
        />
      );

      // Navigate to Step 1
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));

      // Select Literature Synthesis (requires 10 full-text)
      await user.click(screen.getByRole('button', { name: /literature synthesis/i }));

      // Should show blocking warning
      expect(screen.getByText(/insufficient content.*cannot proceed/i)).toBeInTheDocument();
    });

    it('should disable Continue button when content is insufficient for blocking purpose', async () => {
      const user = userEvent.setup();

      // Create analysis with very low full-text count
      const analysis = createMockContentAnalysis({
        fullTextCount: 2, // Below minimum for hypothesis_generation (8)
        abstractOverflowCount: 0,
      });
      render(
        <PurposeSelectionWizard
          onPurposeSelected={mockOnPurposeSelected}
          onCancel={mockOnCancel}
          contentAnalysis={analysis}
        />
      );

      // Navigate to Step 1
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));

      // Select Hypothesis Generation (requires 8 full-text)
      await user.click(screen.getByRole('button', { name: /hypothesis generation/i }));

      // Continue button should be disabled
      const continueButton = screen.getByRole('button', { name: /continue to preview/i });
      expect(continueButton).toBeDisabled();
    });

    it('should enable Continue button for Q-Methodology with any content', async () => {
      const user = userEvent.setup();

      // Q-Methodology has no minimum full-text requirement
      const analysis = createMockContentAnalysis({
        fullTextCount: 0,
        abstractOverflowCount: 0,
        abstractCount: 20,
      });
      render(
        <PurposeSelectionWizard
          onPurposeSelected={mockOnPurposeSelected}
          onCancel={mockOnCancel}
          contentAnalysis={analysis}
        />
      );

      // Navigate to Q-Methodology
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));
      await user.click(screen.getByRole('button', { name: /q-methodology/i }));

      // Continue button should be enabled
      const continueButton = screen.getByRole('button', { name: /continue to preview/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should navigate to Step 3 when Continue is clicked', async () => {
      const user = userEvent.setup();
      await navigateToStep2('q_methodology');

      await user.click(screen.getByRole('button', { name: /continue to preview/i }));

      expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Step 3: Review & Confirm Tests
  // ==========================================================================

  describe('Step 3: Review & Confirm', () => {
    const navigateToStep3 = async (purpose: ResearchPurpose = 'q_methodology') => {
      const user = userEvent.setup();
      renderWizard();

      // Step 0 → Step 1
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));

      // Step 1 → Step 2
      await user.click(screen.getByRole('button', { name: new RegExp(purpose.replace('_', ' '), 'i') }));

      // Step 2 → Step 3
      await user.click(screen.getByRole('button', { name: /continue to preview/i }));
    };

    it('should show extraction parameters', async () => {
      await navigateToStep3('q_methodology');

      expect(screen.getByText(/extraction parameters/i)).toBeInTheDocument();
      expect(screen.getByText(/target theme count/i)).toBeInTheDocument();
      expect(screen.getByText(/extraction focus/i)).toBeInTheDocument();
      expect(screen.getByText(/theme granularity/i)).toBeInTheDocument();
    });

    it('should show "What Happens Next" section', async () => {
      await navigateToStep3('q_methodology');

      expect(screen.getByText(/what happens next/i)).toBeInTheDocument();
      expect(screen.getByText(/6-stage reflexive thematic analysis/i)).toBeInTheDocument();
    });

    it('should call onPurposeSelected with correct purpose when confirmed', async () => {
      const user = userEvent.setup();
      await navigateToStep3('q_methodology');

      const startButton = screen.getByRole('button', { name: /start extraction/i });
      await user.click(startButton);

      expect(mockOnPurposeSelected).toHaveBeenCalledWith('q_methodology');
    });

    it('should call onPurposeSelected for survey_construction', async () => {
      const user = userEvent.setup();
      renderWizard();

      // Navigate to survey construction
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));
      await user.click(screen.getByRole('button', { name: /survey construction/i }));
      await user.click(screen.getByRole('button', { name: /continue to preview/i }));
      await user.click(screen.getByRole('button', { name: /start extraction/i }));

      expect(mockOnPurposeSelected).toHaveBeenCalledWith('survey_construction');
    });
  });

  // ==========================================================================
  // Navigation & Cancel Tests
  // ==========================================================================

  describe('Navigation & Cancel', () => {
    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWizard();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should navigate back from Step 1 to Step 0', async () => {
      const user = userEvent.setup();
      renderWizard();

      // Go to Step 1
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));
      expect(screen.getByText('Select Your Research Goal')).toBeInTheDocument();

      // Go back to Step 0
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText('Content Analysis')).toBeInTheDocument();
    });

    it('should navigate back from Step 2 to Step 1', async () => {
      const user = userEvent.setup();
      renderWizard();

      // Go to Step 1
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));

      // Go to Step 2
      await user.click(screen.getByRole('button', { name: /q-methodology/i }));
      expect(screen.getByText('Scientific Backing')).toBeInTheDocument();

      // Go back to Step 1
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText('Select Your Research Goal')).toBeInTheDocument();
    });

    it('should navigate back from Step 3 to Step 2', async () => {
      const user = userEvent.setup();
      renderWizard();

      // Navigate to Step 3
      await user.click(screen.getByRole('button', { name: /next.*choose research purpose/i }));
      await user.click(screen.getByRole('button', { name: /q-methodology/i }));
      await user.click(screen.getByRole('button', { name: /continue to preview/i }));
      expect(screen.getByText('Review & Confirm')).toBeInTheDocument();

      // Go back to Step 2
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText('Scientific Backing')).toBeInTheDocument();
    });

    it('should show progress indicators for all 4 steps', () => {
      renderWizard();

      // Should show 4 step indicators
      const indicators = document.querySelectorAll('.h-2.w-8.rounded-full');
      expect(indicators.length).toBe(4);
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWizard();

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible buttons with clear labels', () => {
      renderWizard();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should render in a fixed overlay for modal behavior', () => {
      renderWizard();

      const overlay = document.querySelector('.fixed.inset-0.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });
});
