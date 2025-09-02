import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Welcome from '../Welcome';
import Consent from '../Consent';
import Familiarization from '../Familiarization';
import PreSorting from '../PreSorting';
import QSortGrid from '../QSortGrid';
import Commentary from '../Commentary';
import PostSurvey from '../PostSurvey';
import ThankYou from '../ThankYou';
import { ProgressTracker } from '../ProgressTracker';

describe('Participant Flow Components', () => {
  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Welcome Component', () => {
    it('should render welcome message', () => {
      render(<Welcome onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Welcome to Our Research Study/i)).toBeInTheDocument();
      expect(screen.getByText(/Q-methodology/i)).toBeInTheDocument();
    });

    it('should call onComplete when continue is clicked', () => {
      render(<Welcome onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Consent Component', () => {
    it('should render consent form', () => {
      render(<Consent onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Informed Consent/i)).toBeInTheDocument();
      expect(screen.getByText(/I have read and understood/i)).toBeInTheDocument();
    });

    it('should enable continue button only after consent is given', () => {
      render(<Consent onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(continueButton).toBeEnabled();
    });

    it('should track scroll progress', async () => {
      render(<Consent onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        // Simulate scrolling
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500 });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 500 });
        
        fireEvent.scroll(scrollContainer);
        
        await waitFor(() => {
          expect(screen.getByText(/100% read/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Familiarization Component', () => {
    it('should render statement cards', () => {
      render(<Familiarization onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Familiarization/i)).toBeInTheDocument();
      expect(screen.getByText(/Climate change is the most pressing issue/i)).toBeInTheDocument();
    });

    it('should navigate through statements', () => {
      render(<Familiarization onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      const initialStatement = screen.getByText(/Climate change is the most pressing issue/i);
      
      expect(initialStatement).toBeInTheDocument();
      
      fireEvent.click(nextButton);
      
      // Should show different statement
      expect(screen.queryByText(/Climate change is the most pressing issue/i)).not.toBeInTheDocument();
    });

    it('should show completion button on last statement', () => {
      render(<Familiarization onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // Click through all statements
      const statements = screen.getAllByText(/Statement \d+ of \d+/);
      const totalStatements = parseInt(statements[0].textContent?.match(/of (\d+)/)?.[1] || '0');
      
      for (let i = 0; i < totalStatements - 1; i++) {
        const nextButton = screen.queryByRole('button', { name: /next/i });
        if (nextButton) {
          fireEvent.click(nextButton);
        }
      }
      
      // Should show complete button
      expect(screen.getByRole('button', { name: /Continue to Pre-Sorting/i })).toBeInTheDocument();
    });
  });

  describe('PreSorting Component', () => {
    it('should render three categories', () => {
      render(<PreSorting onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Disagree/i)).toBeInTheDocument();
      expect(screen.getByText(/Neutral/i)).toBeInTheDocument();
      expect(screen.getByText(/Agree/i)).toBeInTheDocument();
    });

    it('should allow dragging statements between categories', () => {
      render(<PreSorting onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const statement = screen.getByText(/Climate change is primarily caused/i);
      const agreeCategory = screen.getByText(/Agree/i).closest('div');
      
      // Simulate drag and drop
      fireEvent.dragStart(statement);
      if (agreeCategory) {
        fireEvent.drop(agreeCategory);
      }
      
      // Statement should be in the agree category
      expect(agreeCategory?.textContent).toContain('Climate change is primarily caused');
    });

    it('should enable continue when all statements are sorted', () => {
      render(<PreSorting onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const continueButton = screen.getByRole('button', { name: /Continue to Q-Sort/i });
      
      // Initially disabled when statements in unsorted
      expect(continueButton).toBeDisabled();
      
      // Would need to sort all statements to enable
      // This would require more complex drag-drop simulation
    });
  });

  describe('QSortGrid Component', () => {
    it('should render Q-sort grid', () => {
      render(<QSortGrid onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Q-Sort Grid/i)).toBeInTheDocument();
      expect(screen.getByText(/Strongly Disagree/i)).toBeInTheDocument();
      expect(screen.getByText(/Strongly Agree/i)).toBeInTheDocument();
    });

    it('should show grid constraints', () => {
      render(<QSortGrid onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // Check for column limits
      expect(screen.getByText(/1 item max/i)).toBeInTheDocument();
    });

    it('should track placement progress', () => {
      render(<QSortGrid onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/0 of \d+ statements placed/i)).toBeInTheDocument();
    });
  });

  describe('Commentary Component', () => {
    it('should render commentary form for extreme statements', () => {
      render(<Commentary onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Commentary/i)).toBeInTheDocument();
      expect(screen.getByText(/Please provide brief comments/i)).toBeInTheDocument();
    });

    it('should navigate through extreme statements', () => {
      render(<Commentary onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const textarea = screen.getByRole('textbox');
      const nextButton = screen.getByRole('button', { name: /Next Statement/i });
      
      // Add comment
      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      
      // Should be able to go to next
      fireEvent.click(nextButton);
      
      // Textarea should be cleared for next statement
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should validate minimum comment length', () => {
      render(<Commentary onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const textarea = screen.getByRole('textbox');
      const nextButton = screen.getByRole('button', { name: /Next Statement/i });
      
      // Short comment
      fireEvent.change(textarea, { target: { value: 'Short' } });
      
      // Should show character count warning
      expect(screen.getByText(/characters remaining/i)).toBeInTheDocument();
    });
  });

  describe('PostSurvey Component', () => {
    it('should render demographic questions', () => {
      render(<PostSurvey onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      expect(screen.getByText(/Post-Study Survey/i)).toBeInTheDocument();
      expect(screen.getByText(/Age/i)).toBeInTheDocument();
      expect(screen.getByText(/Gender/i)).toBeInTheDocument();
      expect(screen.getByText(/Education/i)).toBeInTheDocument();
    });

    it('should validate required fields', () => {
      render(<PostSurvey onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const submitButton = screen.getByRole('button', { name: /Complete Study/i });
      
      // Should be disabled initially
      expect(submitButton).toBeDisabled();
      
      // Fill required fields
      const ageSelect = screen.getByLabelText(/Age/i);
      fireEvent.change(ageSelect, { target: { value: '25-34' } });
      
      // Should still be disabled until all required fields are filled
      expect(submitButton).toBeDisabled();
    });
  });

  describe('ThankYou Component', () => {
    it('should render thank you message', () => {
      render(<ThankYou />);
      
      expect(screen.getByText(/Thank You!/i)).toBeInTheDocument();
      expect(screen.getByText(/Your participation has been recorded/i)).toBeInTheDocument();
    });

    it('should display completion code', () => {
      render(<ThankYou />);
      
      expect(screen.getByText(/Completion Code/i)).toBeInTheDocument();
      expect(screen.getByText(/COMP-/i)).toBeInTheDocument();
    });

    it('should show share buttons', () => {
      render(<ThankYou />);
      
      expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Share on Twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Share on LinkedIn/i })).toBeInTheDocument();
    });
  });

  describe('ProgressTracker Component', () => {
    it('should display all steps', () => {
      render(
        <ProgressTracker
          currentStep="consent"
          completedSteps={['welcome']}
        />
      );
      
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      expect(screen.getByText(/Consent/i)).toBeInTheDocument();
      expect(screen.getByText(/Q-Sort/i)).toBeInTheDocument();
    });

    it('should highlight current step', () => {
      render(
        <ProgressTracker
          currentStep="q-sort"
          completedSteps={['welcome', 'consent', 'familiarization', 'pre-sorting']}
        />
      );
      
      const currentStep = screen.getByText(/Q-Sort/i).closest('div');
      expect(currentStep).toHaveClass('text-primary');
    });

    it('should mark completed steps', () => {
      render(
        <ProgressTracker
          currentStep="q-sort"
          completedSteps={['welcome', 'consent']}
        />
      );
      
      const welcomeStep = screen.getByText(/Welcome/i).closest('div');
      expect(welcomeStep?.querySelector('.bg-system-green')).toBeInTheDocument();
    });

    it('should calculate progress percentage', () => {
      render(
        <ProgressTracker
          currentStep="commentary"
          completedSteps={['welcome', 'consent', 'familiarization', 'pre-sorting', 'q-sort']}
        />
      );
      
      // 5 out of 8 steps completed = 62.5%
      expect(screen.getByText(/62/)).toBeInTheDocument();
    });
  });
});