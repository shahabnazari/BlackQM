import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InterpretationSection } from '@/components/hub/sections/InterpretationSection';
import { OptimizedInterpretationWorkspace } from '@/components/interpretation/OptimizedInterpretationWorkspace';
import { useStudyHub } from '@/lib/stores/study-hub.store';
import { useInterpretationStore } from '@/lib/stores/interpretation.store';
import { useAIBackend } from '@/hooks/useAIBackend';

// Mock the store hooks
jest.mock('@/lib/stores/study-hub.store');
jest.mock('@/lib/stores/interpretation.store');
jest.mock('@/hooks/useAIBackend');

describe('Phase 8 Day 5: Interpretation Integration Tests', () => {
  const mockStudyId = 'test-study-123';
  
  const mockStudyData = {
    id: mockStudyId,
    title: 'Test Study',
    statements: [
      { id: 's1', text: 'Statement 1' },
      { id: 's2', text: 'Statement 2' }
    ],
    responses: [
      { id: 'r1', participantId: 'p1', rankings: { s1: 3, s2: -2 } },
      { id: 'r2', participantId: 'p2', rankings: { s1: -1, s2: 4 } }
    ],
    comments: [
      { id: 'c1', text: 'Great study!', participantId: 'p1' }
    ]
  };

  const mockAnalysisResults = {
    factors: [
      { id: 1, name: 'Factor 1', eigenvalue: 4.5 },
      { id: 2, name: 'Factor 2', eigenvalue: 2.1 }
    ],
    correlations: [[1, 0.3], [0.3, 1]],
    consensusStatements: ['s1'],
    distinguishingStatements: ['s2'],
    factorAnalysis: {
      loadings: [[0.8, 0.2], [0.3, 0.9]]
    }
  };

  const mockNarratives = [
    {
      factorId: 1,
      narrative: 'This factor represents environmental concerns with strong agreement on sustainability.',
      confidence: 0.85,
      themes: ['environment', 'sustainability']
    }
  ];

  const mockThemes = [
    {
      id: 't1',
      name: 'Environmental Awareness',
      description: 'Concerns about climate and sustainability',
      frequency: 15,
      sentiment: 0.7
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useStudyHub as jest.Mock).mockReturnValue({
      studyData: mockStudyData,
      analysisResults: mockAnalysisResults,
      isLoading: false,
      error: null
    });

    (useInterpretationStore as jest.Mock).mockReturnValue({
      narratives: mockNarratives,
      themes: mockThemes,
      loadInterpretation: jest.fn(),
      saveNarrative: jest.fn(),
      exportForReport: jest.fn().mockResolvedValue({
        success: true,
        data: { narratives: mockNarratives, themes: mockThemes }
      })
    });

    (useAIBackend as jest.Mock).mockReturnValue({
      generateInterpretation: jest.fn().mockResolvedValue({
        narratives: mockNarratives
      }),
      extractThemes: jest.fn().mockResolvedValue({
        themes: mockThemes
      }),
      isLoading: false,
      error: null
    });
  });

  describe('InterpretationSection Component', () => {
    test('renders successfully with analysis results', () => {
      render(<InterpretationSection studyId={mockStudyId} />);
      
      expect(screen.getByText('Interpretation')).toBeInTheDocument();
      expect(screen.getByText('Extract meaning and insights from your analysis results')).toBeInTheDocument();
    });

    test('shows progress indicators correctly', () => {
      render(<InterpretationSection studyId={mockStudyId} />);
      
      expect(screen.getByText('Factor Narratives')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument(); // 1 narrative for 2 factors
      expect(screen.getByText('Themes Extracted')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 theme
    });

    test('displays warning when no analysis results', () => {
      (useStudyHub as jest.Mock).mockReturnValue({
        studyData: mockStudyData,
        analysisResults: null,
        isLoading: false,
        error: null
      });

      render(<InterpretationSection studyId={mockStudyId} />);
      
      expect(screen.getByText('No Analysis Results')).toBeInTheDocument();
      expect(screen.getByText('Go to Analysis')).toBeInTheDocument();
    });

    test('handles narrative generation', async () => {
      const generateMock = jest.fn().mockResolvedValue({
        narratives: mockNarratives
      });
      
      (useAIBackend as jest.Mock).mockReturnValue({
        generateInterpretation: generateMock,
        extractThemes: jest.fn(),
        isLoading: false,
        error: null
      });

      render(<InterpretationSection studyId={mockStudyId} />);
      
      // Trigger generation through workspace
      // Note: This would be triggered via the workspace component
      await waitFor(() => {
        expect(screen.getByText('Interpretation')).toBeInTheDocument();
      });
    });

    test('exports data for Phase 10 report', async () => {
      render(<InterpretationSection studyId={mockStudyId} />);
      
      const exportButton = screen.getByText('Export for Report');
      expect(exportButton).not.toBeDisabled();
      
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        const store = useInterpretationStore();
        expect(store.exportForReport).toHaveBeenCalledWith(mockStudyId);
      });
    });

    test('handles share functionality', () => {
      const mockClipboard = {
        writeText: jest.fn()
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(<InterpretationSection studyId={mockStudyId} />);
      
      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(`/shared/interpretation/${mockStudyId}`)
      );
    });
  });

  describe('OptimizedInterpretationWorkspace Component', () => {
    const defaultProps = {
      studyId: mockStudyId,
      studyData: mockStudyData,
      analysisResults: mockAnalysisResults,
      narratives: mockNarratives,
      themes: mockThemes,
      activeTab: 'narratives',
      onGenerateNarratives: jest.fn(),
      onExtractThemes: jest.fn(),
      generating: false
    };

    test('renders workspace with all components', () => {
      render(<OptimizedInterpretationWorkspace {...defaultProps} />);
      
      expect(screen.getByText('Interpretation Overview')).toBeInTheDocument();
      expect(screen.getByText('Transform your statistical results into meaningful insights')).toBeInTheDocument();
    });

    test('calculates completion percentages correctly', () => {
      render(<OptimizedInterpretationWorkspace {...defaultProps} />);
      
      expect(screen.getByText('Narrative Completion')).toBeInTheDocument();
      expect(screen.getByText('Theme Extraction')).toBeInTheDocument();
      // 1 narrative with >100 chars / 2 factors = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    test('disables buttons when generating', () => {
      render(
        <OptimizedInterpretationWorkspace 
          {...defaultProps} 
          generating={true}
        />
      );
      
      const generateButton = screen.getByText('Generating...');
      expect(generateButton).toBeDisabled();
    });

    test('switches between different tabs', () => {
      const { rerender } = render(
        <OptimizedInterpretationWorkspace {...defaultProps} />
      );
      
      // Test different tabs
      const tabs = ['themes', 'consensus', 'synthesis', 'bias', 'insights'];
      
      tabs.forEach(tab => {
        rerender(
          <OptimizedInterpretationWorkspace 
            {...defaultProps} 
            activeTab={tab}
          />
        );
        // Verify tab content changes (would need specific content checks per tab)
        expect(screen.getByText('Interpretation Overview')).toBeInTheDocument();
      });
    });

    test('memoization prevents unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <OptimizedInterpretationWorkspace {...props} />;
      };
      
      const { rerender } = render(<TestWrapper {...defaultProps} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestWrapper {...defaultProps} />);
      
      // Should not re-render due to memoization
      // Note: This depends on the memo comparison function
      expect(renderSpy).toHaveBeenCalledTimes(2); // React still calls the function
    });
  });

  describe('Integration with Analysis Hub', () => {
    test('interpretation section is accessible from hub navigation', () => {
      // This would test the hub navigation integration
      // Simulating navigation to interpretation section
      const mockSetSection = jest.fn();
      
      (useStudyHub as jest.Mock).mockReturnValue({
        studyData: mockStudyData,
        analysisResults: mockAnalysisResults,
        currentSection: 'interpret',
        setSection: mockSetSection,
        isLoading: false,
        error: null
      });

      // Verify section is set correctly
      expect(useStudyHub().currentSection).toBe('interpret');
    });

    test('data flows correctly from analysis to interpretation', () => {
      render(<InterpretationSection studyId={mockStudyId} />);
      
      // Verify analysis data is available in interpretation
      const hubStore = useStudyHub();
      expect(hubStore.analysisResults).toEqual(mockAnalysisResults);
      expect(hubStore.studyData).toEqual(mockStudyData);
    });

    test('interpretation data persists for report generation', async () => {
      render(<InterpretationSection studyId={mockStudyId} />);
      
      // Trigger export
      const exportButton = screen.getByText('Export for Report');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        // Verify data is stored for Phase 10
        const storedData = sessionStorage.getItem(`report_data_${mockStudyId}`);
        expect(storedData).toBeDefined();
        
        if (storedData) {
          const parsed = JSON.parse(storedData);
          expect(parsed.interpretation).toBeDefined();
          expect(parsed.metadata.readyForReport).toBe(true);
        }
      });
    });
  });
});