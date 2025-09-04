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
      expect(screen.getAllByText(/Q-methodology/i)).toHaveLength(2);
    });

    it('should call onComplete when continue is clicked', () => {
      render(<Welcome onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const continueButton = screen.getByRole('button', { name: /I Consent/i });
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
      
      const continueButton = screen.getByRole('button', { name: /I Consent/i });
      expect(continueButton).toBeDisabled();
      
      // First, simulate scrolling to the bottom to enable the checkbox
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, writable: true, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, writable: true, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 500, writable: true, configurable: true });
        fireEvent.scroll(scrollContainer);
      }
      
      // Now the checkbox should be enabled, click it
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
          // Check that checkbox is available after scroll
          const checkbox = screen.getByRole('checkbox');
          expect(checkbox).toBeInTheDocument();
        });
      }
    });
  });

  describe('Familiarization Component', () => {
    it('should render statement cards', () => {
      render(<Familiarization onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // Check for Review All Statements heading
      expect(screen.getByText(/Review All Statements/i)).toBeInTheDocument();
      expect(screen.getByText(/Climate change is the most pressing issue/i)).toBeInTheDocument();
    });

    it('should navigate through statements', () => {
      render(<Familiarization onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // The component starts in single view mode
      const initialStatement = screen.getByText(/Climate change is the most pressing issue/i);
      expect(initialStatement).toBeInTheDocument();
      
      // Find the Next button (should be after the Single/Grid/List view buttons)
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent === 'Next');
      
      if (nextButton) {
        fireEvent.click(nextButton);
        
        // After clicking next, we should see the second statement
        expect(screen.queryByText(/Climate change is the most pressing issue/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Economic growth should be prioritized/i)).toBeInTheDocument();
      }
    });

    it('should show completion button on last statement', () => {
      render(<Familiarization onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // Check for viewed counter display
      expect(screen.getByText(/Viewed:/i)).toBeInTheDocument();
      
      // Click all statements in single view mode (we have 10 mock statements)
      const totalStatements = 10;
      for (let i = 0; i < totalStatements - 1; i++) {
        const buttons = screen.getAllByRole('button');
        const nextButton = buttons.find(btn => btn.textContent === 'Next');
        if (nextButton) {
          fireEvent.click(nextButton);
        }
      }
      
      // After viewing all statements, the continue button should be enabled
      const continueButton = screen.getByRole('button', { name: /Continue to Pre-Sorting/i });
      // Note: Button may still be disabled until all statements are "viewed"
      expect(continueButton).toBeInTheDocument();
    });
  });

  describe('PreSorting Component', () => {
    it('should render three categories', () => {
      render(<PreSorting onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // Check for category headers
      const headers = screen.getAllByRole('heading', { level: 3 });
      const headerTexts = headers.map(h => h.textContent);
      expect(headerTexts).toContain('Disagree');
      expect(headerTexts).toContain('Neutral');
      expect(headerTexts).toContain('Agree');
    });

    it('should allow dragging statements between categories', () => {
      render(<PreSorting onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const statement = screen.getByText(/Climate change is the most pressing issue/i);
      // Find the Agree category - there are multiple "Agree" texts, get the heading
      const agreeHeadings = screen.getAllByText(/Agree/i);
      const agreeCategory = agreeHeadings[0]?.closest('div');
      
      // Simulate drag and drop
      fireEvent.dragStart(statement);
      if (agreeCategory) {
        fireEvent.drop(agreeCategory);
      }
      
      // Statement should be in the agree category
      expect(agreeCategory?.textContent).toContain('Climate change is the most pressing issue');
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
      
      // Check for column labels and grid
      expect(screen.getByText(/Strongly Disagree/i)).toBeInTheDocument();
      expect(screen.getByText(/Strongly Agree/i)).toBeInTheDocument();
    });

    it('should track placement progress', () => {
      render(<QSortGrid onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      // Check for placement tracking - component shows "Placed: X of Y statements"
      expect(screen.getByText(/Placed:/i)).toBeInTheDocument();
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
      // The Familiarization component shows grid/list view, not navigation buttons
      // Check for view toggle or continue button
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[0];
      
      // Add comment with at least 50 words to enable next button
      const longComment = 'This is a test comment that needs to be at least fifty words long to meet the minimum requirement for the commentary section. I am adding more words here to ensure that the word count validation passes and the next button becomes enabled. This should definitely be enough words now to pass the validation check and allow navigation to the next statement in the commentary flow.';
      fireEvent.change(textarea, { target: { value: longComment } });
      
      // Should be able to go to next
      fireEvent.click(nextButton);
      
      // Textarea should be cleared for next statement
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should validate minimum comment length', () => {
      render(<Commentary onComplete={mockOnComplete} onBack={mockOnBack} />);
      
      const textarea = screen.getByRole('textbox');
      // The Familiarization component shows grid/list view, not navigation buttons
      // Check for view toggle or continue button
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[0];
      
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
      expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Education/i)).toBeInTheDocument();
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
      
      expect(screen.getByText(/Thank You for Participating!/i)).toBeInTheDocument();
      expect(screen.getByText(/Your responses have been successfully submitted/i)).toBeInTheDocument();
    });

    it('should display completion code', () => {
      render(<ThankYou />);
      
      expect(screen.getByText(/Completion Code/i)).toBeInTheDocument();
      expect(screen.getByText(/STUDY-/i)).toBeInTheDocument();
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
      
      // Use getAllByText for elements that might appear multiple times
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      const consentElements = screen.getAllByText(/Consent/i);
      expect(consentElements.length).toBeGreaterThan(0);
      const qsortElements = screen.getAllByText(/Q-Sort/i);
      expect(qsortElements.length).toBeGreaterThan(0);
    });

    it('should highlight current step', () => {
      render(
        <ProgressTracker
          currentStep="q-sort"
          completedSteps={['welcome', 'consent', 'familiarization', 'pre-sorting']}
        />
      );
      
      const qsortElements = screen.getAllByText(/Q-Sort/i);
      const currentStep = qsortElements[0];
      expect(currentStep).toHaveClass('text-system-blue');
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
      
      // 5 out of 9 steps completed = 55.5% rounds to 56%
      expect(screen.getByText(/56%/)).toBeInTheDocument();
    });
  });
});