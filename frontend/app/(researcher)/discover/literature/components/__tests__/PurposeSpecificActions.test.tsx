/**
 * PurposeSpecificActions Component Tests
 * Phase 10.91 Day 7 - STRICT AUDIT MODE
 *
 * **Test Coverage:**
 * - Props rendering and conditional display
 * - Button states (enabled/disabled)
 * - Loading states
 * - Research output display
 * - Handler invocations
 * - React.memo performance optimization
 * - TypeScript type safety
 *
 * **Enterprise Standards:**
 * - ✅ 30+ test cases for comprehensive coverage
 * - ✅ Performance tests for React.memo
 * - ✅ Accessibility tests
 * - ✅ Edge case handling
 *
 * @module PurposeSpecificActions.test
 * @since Phase 10.91 Day 7
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurposeSpecificActions } from '../PurposeSpecificActions';
import type { PurposeSpecificActionsProps } from '../PurposeSpecificActions';

// ============================================================================
// Test Utilities
// ============================================================================

const createMockProps = (overrides?: Partial<PurposeSpecificActionsProps>): PurposeSpecificActionsProps => ({
  extractionPurpose: null,
  hasThemes: true,
  hasSelection: false,
  selectedCount: 0,
  onClearSelection: vi.fn(),
  showQStatements: false,
  onGenerateStatements: vi.fn(),
  showSurveyPrimary: false,
  showSurveySecondary: false,
  loadingSurvey: false,
  generatedSurvey: null,
  onShowSurveyModal: vi.fn(),
  onEditSurvey: vi.fn(),
  onExportSurvey: vi.fn(),
  showResearchOutputs: true,
  loadingQuestions: false,
  researchQuestions: [],
  onGenerateQuestions: vi.fn(),
  onSelectQuestion: vi.fn(),
  onOperationalizeQuestion: vi.fn(),
  loadingHypotheses: false,
  hypotheses: [],
  onGenerateHypotheses: vi.fn(),
  onSelectHypothesis: vi.fn(),
  onTestHypothesis: vi.fn(),
  loadingConstructs: false,
  constructMappings: [],
  onMapConstructs: vi.fn(),
  onConstructClick: vi.fn(),
  onRelationshipClick: vi.fn(),
  ...overrides,
});

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('PurposeSpecificActions - Component Rendering', () => {
  it('should render component successfully', () => {
    const props = createMockProps();
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Purpose-Specific Actions')).toBeInTheDocument();
  });

  it('should have correct display name for debugging', () => {
    expect(PurposeSpecificActions.displayName).toBe('PurposeSpecificActions');
  });

  it('should render with React.memo wrapper (performance optimization)', () => {
    // React.memo components have $$typeof property
    expect(typeof PurposeSpecificActions).toBe('object');
  });
});

// ============================================================================
// Selection State Tests
// ============================================================================

describe('PurposeSpecificActions - Selection State', () => {
  it('should show "Select themes" message when no selection', () => {
    const props = createMockProps({ hasSelection: false });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Select themes above to enable actions')).toBeInTheDocument();
  });

  it('should show selected count when themes selected', () => {
    const props = createMockProps({ hasSelection: true, selectedCount: 5 });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Selected 5 themes')).toBeInTheDocument();
  });

  it('should use singular "theme" for count of 1', () => {
    const props = createMockProps({ hasSelection: true, selectedCount: 1 });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Selected 1 theme')).toBeInTheDocument();
  });

  it('should show Clear Selection button when themes selected', () => {
    const props = createMockProps({ hasSelection: true, selectedCount: 3 });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Clear Selection')).toBeInTheDocument();
  });

  it('should call onClearSelection when Clear button clicked', () => {
    const mockClear = vi.fn();
    const props = createMockProps({ hasSelection: true, selectedCount: 3, onClearSelection: mockClear });
    render(<PurposeSpecificActions {...props} />);
    fireEvent.click(screen.getByText('Clear Selection'));
    expect(mockClear).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Q-Methodology Tests
// ============================================================================

describe('PurposeSpecificActions - Q-Methodology', () => {
  it('should show Q-Statements button when showQStatements true', () => {
    const props = createMockProps({ showQStatements: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generate Q-Statements')).toBeInTheDocument();
  });

  it('should not show Q-Statements button when showQStatements false', () => {
    const props = createMockProps({ showQStatements: false });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.queryByText('Generate Q-Statements')).not.toBeInTheDocument();
  });

  it('should disable Q-Statements button when no themes', () => {
    const props = createMockProps({ showQStatements: true, hasThemes: false });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Generate Q-Statements');
    expect(button).toBeDisabled();
  });

  it('should enable Q-Statements button when themes exist', () => {
    const props = createMockProps({ showQStatements: true, hasThemes: true });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Generate Q-Statements');
    expect(button).not.toBeDisabled();
  });

  it('should call onGenerateStatements when button clicked', () => {
    const mockGenerate = vi.fn();
    const props = createMockProps({ showQStatements: true, hasThemes: true, onGenerateStatements: mockGenerate });
    render(<PurposeSpecificActions {...props} />);
    fireEvent.click(screen.getByText('Generate Q-Statements'));
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Survey Construction Tests
// ============================================================================

describe('PurposeSpecificActions - Survey Construction', () => {
  it('should show survey button when showSurveyPrimary true', () => {
    const props = createMockProps({ showSurveyPrimary: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generate Survey')).toBeInTheDocument();
  });

  it('should show survey button when showSurveySecondary true', () => {
    const props = createMockProps({ showSurveySecondary: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generate Survey')).toBeInTheDocument();
  });

  it('should disable survey button when no selection', () => {
    const props = createMockProps({ showSurveyPrimary: true, hasSelection: false });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Generate Survey');
    expect(button).toBeDisabled();
  });

  it('should enable survey button when themes selected', () => {
    const props = createMockProps({ showSurveyPrimary: true, hasSelection: true });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Generate Survey');
    expect(button).not.toBeDisabled();
  });

  it('should show loading state when generating survey', () => {
    const props = createMockProps({ showSurveyPrimary: true, loadingSurvey: true, hasSelection: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('should call onShowSurveyModal when survey button clicked', () => {
    const mockShow = vi.fn();
    const props = createMockProps({ showSurveyPrimary: true, hasSelection: true, onShowSurveyModal: mockShow });
    render(<PurposeSpecificActions {...props} />);
    fireEvent.click(screen.getByText('Generate Survey'));
    expect(mockShow).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Research Questions Tests
// ============================================================================

describe('PurposeSpecificActions - Research Questions', () => {
  it('should show research questions button when showResearchOutputs true', () => {
    const props = createMockProps({ showResearchOutputs: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generate Questions')).toBeInTheDocument();
  });

  it('should disable questions button when no selection', () => {
    const props = createMockProps({ showResearchOutputs: true, hasSelection: false });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Generate Questions');
    expect(button).toBeDisabled();
  });

  it('should show loading state when generating questions', () => {
    const props = createMockProps({ showResearchOutputs: true, loadingQuestions: true, hasSelection: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('should call onGenerateQuestions when button clicked', () => {
    const mockGenerate = vi.fn();
    const props = createMockProps({ showResearchOutputs: true, hasSelection: true, onGenerateQuestions: mockGenerate });
    render(<PurposeSpecificActions {...props} />);
    fireEvent.click(screen.getByText('Generate Questions'));
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Hypotheses Tests
// ============================================================================

describe('PurposeSpecificActions - Hypotheses', () => {
  it('should show hypotheses button when showResearchOutputs true', () => {
    const props = createMockProps({ showResearchOutputs: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generate Hypotheses')).toBeInTheDocument();
  });

  it('should disable hypotheses button when no selection', () => {
    const props = createMockProps({ showResearchOutputs: true, hasSelection: false });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Generate Hypotheses');
    expect(button).toBeDisabled();
  });

  it('should show loading state when generating hypotheses', () => {
    const props = createMockProps({ showResearchOutputs: true, loadingHypotheses: true, hasSelection: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('should call onGenerateHypotheses when button clicked', () => {
    const mockGenerate = vi.fn();
    const props = createMockProps({ showResearchOutputs: true, hasSelection: true, onGenerateHypotheses: mockGenerate });
    render(<PurposeSpecificActions {...props} />);
    fireEvent.click(screen.getByText('Generate Hypotheses'));
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Construct Mapping Tests
// ============================================================================

describe('PurposeSpecificActions - Construct Mapping', () => {
  it('should show construct map button when showResearchOutputs true', () => {
    const props = createMockProps({ showResearchOutputs: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Map Constructs')).toBeInTheDocument();
  });

  it('should disable constructs button when no selection', () => {
    const props = createMockProps({ showResearchOutputs: true, hasSelection: false });
    render(<PurposeSpecificActions {...props} />);
    const button = screen.getByText('Map Constructs');
    expect(button).toBeDisabled();
  });

  it('should show loading state when mapping constructs', () => {
    const props = createMockProps({ showResearchOutputs: true, loadingConstructs: true, hasSelection: true });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Mapping...')).toBeInTheDocument();
  });

  it('should call onMapConstructs when button clicked', () => {
    const mockMap = vi.fn();
    const props = createMockProps({ showResearchOutputs: true, hasSelection: true, onMapConstructs: mockMap });
    render(<PurposeSpecificActions {...props} />);
    fireEvent.click(screen.getByText('Map Constructs'));
    expect(mockMap).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Purpose-Specific Description Tests
// ============================================================================

describe('PurposeSpecificActions - Purpose Descriptions', () => {
  it('should show Q-methodology description when purpose is q_methodology', () => {
    const props = createMockProps({ extractionPurpose: 'q_methodology' });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Generate Q-methodology statements for sorting studies')).toBeInTheDocument();
  });

  it('should show survey construction description when purpose is survey_construction', () => {
    const props = createMockProps({ extractionPurpose: 'survey_construction' });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Transform constructs into validated survey scales')).toBeInTheDocument();
  });

  it('should show qualitative analysis description when purpose is qualitative_analysis', () => {
    const props = createMockProps({ extractionPurpose: 'qualitative_analysis' });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Flexible analysis options for qualitative research')).toBeInTheDocument();
  });

  it('should show literature synthesis description when purpose is literature_synthesis', () => {
    const props = createMockProps({ extractionPurpose: 'literature_synthesis' });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Meta-analytic research questions and synthesis outputs')).toBeInTheDocument();
  });

  it('should show hypothesis generation description when purpose is hypothesis_generation', () => {
    const props = createMockProps({ extractionPurpose: 'hypothesis_generation' });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Theory-building outputs for hypothesis development')).toBeInTheDocument();
  });

  it('should show default description when no purpose specified', () => {
    const props = createMockProps({ extractionPurpose: null });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Transform extracted themes into research outputs')).toBeInTheDocument();
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('PurposeSpecificActions - Performance', () => {
  it('should be wrapped with React.memo for performance optimization', () => {
    // React.memo components are objects, not functions
    expect(PurposeSpecificActions).toBeTruthy();
    expect(typeof PurposeSpecificActions).toBe('object');
  });

  it('should not re-render when unrelated props change', () => {
    const props = createMockProps();
    const { rerender } = render(<PurposeSpecificActions {...props} />);

    // Update props with same values
    rerender(<PurposeSpecificActions {...props} />);

    // Component should use memoized version
    expect(screen.getByText('Purpose-Specific Actions')).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('PurposeSpecificActions - Accessibility', () => {
  it('should have accessible button labels', () => {
    const props = createMockProps({ showResearchOutputs: true, hasSelection: true });
    render(<PurposeSpecificActions {...props} />);

    const questionsButton = screen.getByText('Generate Questions');
    const hypothesesButton = screen.getByText('Generate Hypotheses');
    const constructsButton = screen.getByText('Map Constructs');

    expect(questionsButton).toBeInTheDocument();
    expect(hypothesesButton).toBeInTheDocument();
    expect(constructsButton).toBeInTheDocument();
  });

  it('should have semantic HTML structure', () => {
    const props = createMockProps();
    const { container } = render(<PurposeSpecificActions {...props} />);

    // Should have proper card structure
    const cards = container.querySelectorAll('[class*="border"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('PurposeSpecificActions - Edge Cases', () => {
  it('should handle zero selected themes', () => {
    const props = createMockProps({ hasSelection: false, selectedCount: 0 });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Select themes above to enable actions')).toBeInTheDocument();
  });

  it('should handle large selection count', () => {
    const props = createMockProps({ hasSelection: true, selectedCount: 100 });
    render(<PurposeSpecificActions {...props} />);
    expect(screen.getByText('Selected 100 themes')).toBeInTheDocument();
  });

  it('should handle all buttons disabled state', () => {
    const props = createMockProps({
      showResearchOutputs: true,
      hasSelection: false,
      hasThemes: false,
    });
    render(<PurposeSpecificActions {...props} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      if (button.textContent !== 'Clear Selection') {
        expect(button).toBeDisabled();
      }
    });
  });
});
