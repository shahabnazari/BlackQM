/**
 * E2E Tests for AI Workflows
 * Tests complete AI feature integration from frontend to backend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import AI Components
import { BiasDetector } from '@/components/ai/BiasDetector';
import { ResponseAnalyzer } from '@/components/ai/ResponseAnalyzer';
import { ParticipantAssistant } from '@/components/ai/ParticipantAssistant';
import { SmartValidator } from '@/components/ai/SmartValidator';
import { StatementGenerator } from '@/components/ai/StatementGenerator';
import { AIGridDesignAssistant } from '@/components/grid/AIGridDesignAssistant';

// Mock the AI backend service
vi.mock('@/lib/services/ai-backend.service', () => ({
  aiBackendService: {
    generateStatements: vi.fn().mockResolvedValue({
      success: true,
      statements: [
        { id: '1', text: 'Climate change is real', perspective: 'scientific' },
        { id: '2', text: 'Economic growth matters', perspective: 'economic' }
      ]
    }),
    detectBias: vi.fn().mockResolvedValue({
      success: true,
      analysis: {
        overallBiasScore: 75,
        biasedStatements: ['Statement 1'],
        biasTypes: { language: 20, perspective: 10 },
        recommendations: ['Consider rephrasing'],
        alternatives: { 'Statement 1': 'Alternative text' }
      }
    }),
    analyzeResponses: vi.fn().mockResolvedValue({
      patterns: { clusters: [], trends: [], commonalities: [] },
      quality: { overallScore: 85, completenessScore: 90, consistencyScore: 80, engagementScore: 85, issues: [] }
    }),
    getParticipantAssistance: vi.fn().mockResolvedValue({
      success: true,
      assistance: {
        message: 'I can help you with that',
        stage: 'qsort',
        participantId: 'test-user'
      }
    }),
    validateSmartly: vi.fn().mockResolvedValue({
      success: true,
      valid: true,
      errors: {},
      suggestions: { email: 'Consider using a business email' }
    }),
    getGridRecommendations: vi.fn().mockResolvedValue({
      success: true,
      recommendations: [{
        columns: 7,
        distribution: [1, 2, 3, 4, 3, 2, 1],
        labels: ['Strongly Disagree', '', '', 'Neutral', '', '', 'Strongly Agree'],
        reasoning: 'Standard distribution for 16 statements',
        complexity: 'moderate'
      }]
    })
  }
}));

// Mock auth utilities
vi.mock('@/lib/auth/auth-utils', () => ({
  getAuthToken: vi.fn().mockResolvedValue('test-token')
}));

describe('AI Workflows E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow 1: Statement Generation with Bias Check', () => {
    it('should generate statements and check for bias', async () => {
      const user = userEvent.setup();
      
      // Render statement generator
      const { rerender } = render(
        <StatementGenerator
          onStatementsGenerated={(statements) => {
            expect(statements).toHaveLength(2);
          }}
        />
      );

      // Enter topic
      const topicInput = screen.getByPlaceholderText(/enter.*topic/i);
      await user.type(topicInput, 'Climate change');

      // Generate statements
      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Wait for statements to be generated
      await waitFor(() => {
        expect(screen.getByText(/Climate change is real/i)).toBeInTheDocument();
      });

      // Now check for bias
      const statements = ['Climate change is real', 'Economic growth matters'];
      rerender(
        <BiasDetector
          initialStatements={statements}
          onBiasDetected={(issues, score) => {
            expect(score).toBe(75);
            expect(issues).toHaveLength(1);
          }}
        />
      );

      // Click detect bias button
      const detectButton = screen.getByRole('button', { name: /detect bias/i });
      await user.click(detectButton);

      // Wait for bias analysis
      await waitFor(() => {
        expect(screen.getByText(/75/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 2: Response Analysis Pipeline', () => {
    it('should analyze participant responses', async () => {
      const responses = [
        {
          participantId: 'p1',
          qsort: [1, 2, 3, 4, 5],
          completionTime: 600
        },
        {
          participantId: 'p2',
          qsort: [5, 4, 3, 2, 1],
          completionTime: 450
        }
      ];

      render(
        <ResponseAnalyzer
          responses={responses}
          onAnalysisComplete={(result) => {
            expect(result.quality?.overallScore).toBe(85);
          }}
        />
      );

      // Check that analysis auto-starts
      await waitFor(() => {
        expect(screen.getByText(/2 responses/i)).toBeInTheDocument();
      });

      // Verify quality score is displayed
      await waitFor(() => {
        expect(screen.getByText(/85/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 3: Participant Assistance Journey', () => {
    it('should provide assistance through study stages', async () => {
      const user = userEvent.setup();
      
      // Test consent stage
      render(
        <ParticipantAssistant
          participantId="test-user"
          currentStage="consent"
          studyContext={{ topic: 'Climate attitudes' }}
        />
      );

      // Should show welcome message for consent
      expect(screen.getByText(/understand the study/i)).toBeInTheDocument();

      // Ask a question
      const input = screen.getByPlaceholderText(/type your question/i);
      await user.type(input, 'Can I withdraw?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Wait for AI response
      await waitFor(() => {
        expect(screen.getByText(/I can help you with that/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 4: Smart Form Validation', () => {
    it('should validate form with AI assistance', async () => {
      const user = userEvent.setup();
      
      const fields = [
        {
          name: 'email',
          label: 'Email',
          type: 'email' as const,
          value: '',
          required: true,
          validation: [
            { field: 'email', rule: 'required' as const, message: 'Email is required' },
            { field: 'email', rule: 'email' as const, message: 'Invalid email' }
          ]
        }
      ];

      const formData = { email: 'test@example.com' };

      render(
        <SmartValidator
          fields={fields}
          formData={formData}
          onValidation={(result) => {
            expect(result.valid).toBe(true);
          }}
          adaptiveMode={true}
        />
      );

      // Click validate button
      const validateButton = screen.getByRole('button', { name: /validate/i });
      await user.click(validateButton);

      // Should show validation result
      await waitFor(() => {
        expect(screen.getByText(/Consider using a business email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 5: Grid Design Assistance', () => {
    it('should recommend optimal grid configuration', async () => {
      const user = userEvent.setup();
      
      render(
        <AIGridDesignAssistant
          statementCount={16}
          onRecommendationSelect={(grid) => {
            expect(grid.columns).toBe(7);
            expect(grid.distribution).toEqual([1, 2, 3, 4, 3, 2, 1]);
          }}
        />
      );

      // Get recommendations button
      const getRecommendationsBtn = screen.getByRole('button', { name: /get.*recommendations/i });
      await user.click(getRecommendationsBtn);

      // Wait for recommendations
      await waitFor(() => {
        expect(screen.getByText(/Standard distribution/i)).toBeInTheDocument();
      });

      // Select a recommendation
      const selectButton = screen.getByRole('button', { name: /use this/i });
      await user.click(selectButton);
    });
  });

  describe('Integration: Full Study Creation Flow', () => {
    it('should complete full study creation with AI assistance', async () => {
      const user = userEvent.setup();
      
      // Step 1: Generate statements
      const { container } = render(
        <div>
          <StatementGenerator />
          <AIGridDesignAssistant statementCount={20} />
          <BiasDetector />
        </div>
      );

      // Generate statements for the study
      const topicInput = container.querySelector('input[placeholder*="topic"]');
      if (topicInput) {
        await user.type(topicInput, 'Environmental attitudes');
      }

      const generateBtn = screen.getAllByRole('button').find(btn => 
        btn.textContent?.includes('Generate')
      );
      if (generateBtn) {
        await user.click(generateBtn);
      }

      // Wait for statements
      await waitFor(() => {
        const statements = container.querySelectorAll('[data-statement]');
        expect(statements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Get grid recommendations
      const gridBtn = screen.getAllByRole('button').find(btn => 
        btn.textContent?.includes('recommendation')
      );
      if (gridBtn) {
        await user.click(gridBtn);
      }

      // Check for bias in statements
      const biasBtn = screen.getAllByRole('button').find(btn => 
        btn.textContent?.includes('Detect')
      );
      if (biasBtn) {
        await user.click(biasBtn);
      }

      // Verify all components worked together
      await waitFor(() => {
        // Should have statements, grid config, and bias analysis
        expect(container.querySelector('[data-statement]')).toBeInTheDocument();
        expect(screen.queryByText(/distribution/i)).toBeInTheDocument();
        expect(screen.queryByText(/bias.*score/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      // Mock a failure
      const { aiBackendService } = await import('@/lib/services/ai-backend.service');
      aiBackendService.generateStatements = vi.fn().mockRejectedValue(
        new Error('API Error: Rate limit exceeded')
      );

      const user = userEvent.setup();
      
      render(<StatementGenerator />);

      const topicInput = screen.getByPlaceholderText(/enter.*topic/i);
      await user.type(topicInput, 'Test topic');

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/rate limit/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should show loading states during AI operations', async () => {
      // Mock slow response
      const { aiBackendService } = await import('@/lib/services/ai-backend.service');
      aiBackendService.detectBias = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          analysis: {
            overallBiasScore: 80,
            biasedStatements: [],
            biasTypes: {},
            recommendations: []
          }
        }), 1000))
      );

      render(<BiasDetector initialStatements={['Test statement']} />);

      const detectButton = screen.getByRole('button', { name: /detect bias/i });
      fireEvent.click(detectButton);

      // Should show loading state
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/analyzing/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});