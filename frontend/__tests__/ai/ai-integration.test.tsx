/**
 * AI Integration Tests
 * Phase 6.86 - Verify AI components are properly connected
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GridDesignAssistant } from '@/components/ai/GridDesignAssistant';
import { StatementGenerator } from '@/components/ai/StatementGenerator';
import { BiasDetector } from '@/components/ai/BiasDetector';

// Mock fetch for testing
global.fetch = jest.fn();

describe('AI Component Integration', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('GridDesignAssistant', () => {
    it('renders and accepts research objective input', () => {
      render(<GridDesignAssistant />);
      
      const input = screen.getByPlaceholderText(/studying environmental attitudes/i);
      expect(input).toBeInTheDocument();
      
      fireEvent.change(input, { target: { value: 'Testing climate change perspectives' } });
      expect(input).toHaveValue('Testing climate change perspectives');
    });

    it('calls API when generate button is clicked', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          recommendation: {
            gridStructure: {
              columns: 7,
              distribution: [2, 3, 4, 5, 4, 3, 2],
              labels: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree']
            },
            reasoning: 'Test reasoning',
            recommendations: ['Test recommendation'],
            alternativeDesigns: []
          }
        })
      });

      render(<GridDesignAssistant />);
      
      const input = screen.getByPlaceholderText(/studying environmental attitudes/i);
      fireEvent.change(input, { target: { value: 'Test research' } });
      
      const button = screen.getByRole('button', { name: /generate grid design/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/grid', expect.any(Object));
      });
    });
  });

  describe('StatementGenerator', () => {
    it('renders and accepts topic input', () => {
      render(<StatementGenerator />);
      
      const input = screen.getByPlaceholderText(/climate change attitudes/i);
      expect(input).toBeInTheDocument();
      
      fireEvent.change(input, { target: { value: 'Environmental sustainability' } });
      expect(input).toHaveValue('Environmental sustainability');
    });

    it('shows academic level selector', () => {
      render(<StatementGenerator />);
      
      const selector = screen.getByDisplayValue('Intermediate');
      expect(selector).toBeInTheDocument();
      
      fireEvent.change(selector, { target: { value: 'advanced' } });
      expect(selector).toHaveValue('advanced');
    });

    it('has avoid bias checkbox', () => {
      render(<StatementGenerator />);
      
      const checkbox = screen.getByLabelText(/avoid bias/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });
  });

  describe('BiasDetector', () => {
    it('renders and accepts statement input', () => {
      render(<BiasDetector />);
      
      const textarea = screen.getByPlaceholderText(/enter your statements here/i);
      expect(textarea).toBeInTheDocument();
      
      fireEvent.change(textarea, { target: { value: 'Statement 1\nStatement 2' } });
      expect(textarea).toHaveValue('Statement 1\nStatement 2');
    });

    it('shows analysis type options', () => {
      render(<BiasDetector />);
      
      const quickCheck = screen.getByLabelText(/quick check/i);
      const comprehensive = screen.getByLabelText(/comprehensive analysis/i);
      
      expect(quickCheck).toBeInTheDocument();
      expect(comprehensive).toBeInTheDocument();
      expect(comprehensive).toBeChecked(); // Default is comprehensive
    });

    it('calls API when detect bias button is clicked', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            score: 85,
            status: 'good',
            recommendation: 'Statements appear relatively unbiased'
          }
        })
      });

      render(<BiasDetector />);
      
      const textarea = screen.getByPlaceholderText(/enter your statements here/i);
      fireEvent.change(textarea, { target: { value: 'Test statement' } });
      
      const button = screen.getByRole('button', { name: /detect bias/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ai/bias'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('all AI components render without errors', () => {
      const { container } = render(
        <div>
          <GridDesignAssistant />
          <StatementGenerator />
          <BiasDetector />
        </div>
      );
      
      expect(container).toBeInTheDocument();
      expect(screen.getByText(/AI Grid Design Assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/Statement Generator/i)).toBeInTheDocument();
      expect(screen.getByText(/Bias Detector/i)).toBeInTheDocument();
    });

    it('components handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<GridDesignAssistant />);
      
      const input = screen.getByPlaceholderText(/studying environmental attitudes/i);
      fireEvent.change(input, { target: { value: 'Test research' } });
      
      const button = screen.getByRole('button', { name: /generate grid design/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
      });
    });

    it('components require authentication (API returns 401)', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' })
      });

      render(<StatementGenerator />);
      
      const input = screen.getByPlaceholderText(/climate change attitudes/i);
      fireEvent.change(input, { target: { value: 'Test topic' } });
      
      const button = screen.getByRole('button', { name: /generate statements/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });
  });
});