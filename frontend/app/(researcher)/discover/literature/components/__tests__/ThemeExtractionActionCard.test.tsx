/**
 * ThemeExtractionActionCard Unit Tests
 * Phase 10.942 Day 5: Theme Extraction Initiation Testing
 *
 * Test Coverage:
 * - 5.1 Extract Themes Button
 *   - Disabled when no sources available
 *   - Shows correct source count (papers + videos)
 *   - Low source warning (<3 sources)
 *   - Opens Purpose Wizard on click
 *   - Loading state during extraction
 *
 * Enterprise Standards:
 * - ✅ TypeScript strict mode
 * - ✅ RTL best practices
 * - ✅ Accessibility testing
 * - ✅ Store mocking with Zustand
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeExtractionActionCard } from '../ThemeExtractionActionCard';

// ============================================================================
// Mock Stores
// ============================================================================

interface MockLiteratureSearchStore {
  papers: Array<{ id: string; title: string }>;
  selectedPapers: Set<string>;
}

interface MockThemeExtractionStore {
  unifiedThemes: Array<{ id: string; label: string }>;
  analyzingThemes: boolean;
  setShowPurposeWizard: jest.Mock;
}

interface MockVideoManagementStore {
  transcribedVideos: Set<string>;
}

let mockLiteratureSearchStore: MockLiteratureSearchStore;
let mockThemeExtractionStore: MockThemeExtractionStore;
let mockVideoManagementStore: MockVideoManagementStore;

// Mock useLiteratureSearchStore
jest.mock('@/lib/stores/literature-search.store', () => ({
  useLiteratureSearchStore: () => mockLiteratureSearchStore,
}));

// Mock useThemeExtractionStore
jest.mock('@/lib/stores/theme-extraction.store', () => ({
  useThemeExtractionStore: () => mockThemeExtractionStore,
}));

// Mock useVideoManagementStore
jest.mock('@/lib/stores/video-management.store', () => ({
  useVideoManagementStore: () => mockVideoManagementStore,
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ============================================================================
// Test Setup
// ============================================================================

describe('ThemeExtractionActionCard', () => {
  const mockSetShowPurposeWizard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default store state
    mockLiteratureSearchStore = {
      papers: [
        { id: 'paper-1', title: 'Test Paper 1' },
        { id: 'paper-2', title: 'Test Paper 2' },
        { id: 'paper-3', title: 'Test Paper 3' },
        { id: 'paper-4', title: 'Test Paper 4' },
        { id: 'paper-5', title: 'Test Paper 5' },
      ],
      selectedPapers: new Set(['paper-1', 'paper-2', 'paper-3', 'paper-4', 'paper-5']),
    };

    mockThemeExtractionStore = {
      unifiedThemes: [],
      analyzingThemes: false,
      setShowPurposeWizard: mockSetShowPurposeWizard,
    };

    mockVideoManagementStore = {
      transcribedVideos: new Set(),
    };
  });

  // ==========================================================================
  // 5.1 Extract Themes Button Tests
  // ==========================================================================

  describe('5.1 Extract Themes Button', () => {
    it('should be disabled when no sources are available', () => {
      // Arrange: No papers or videos
      mockLiteratureSearchStore.papers = [];
      mockLiteratureSearchStore.selectedPapers = new Set();
      mockVideoManagementStore.transcribedVideos = new Set();

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      const button = screen.getByRole('button', { name: /extract themes/i });
      expect(button).toBeDisabled();
    });

    it('should show correct source count for papers only', () => {
      // Arrange: 5 papers, no videos
      mockLiteratureSearchStore.selectedPapers = new Set(['paper-1', 'paper-2', 'paper-3', 'paper-4', 'paper-5']);
      mockVideoManagementStore.transcribedVideos = new Set();

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/papers selected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /extract themes from 5 sources/i })).toBeInTheDocument();
    });

    it('should show correct source count for papers and videos combined', () => {
      // Arrange: 5 papers + 3 videos = 8 sources
      mockLiteratureSearchStore.selectedPapers = new Set(['paper-1', 'paper-2', 'paper-3', 'paper-4', 'paper-5']);
      mockVideoManagementStore.transcribedVideos = new Set(['video-1', 'video-2', 'video-3']);

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/papers selected/i)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/videos transcribed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /extract themes from 8 sources/i })).toBeInTheDocument();
    });

    it('should show low source warning when fewer than 3 sources are available', () => {
      // Arrange: Only 2 papers (below MIN_SOURCES_BASIC)
      mockLiteratureSearchStore.papers = [
        { id: 'paper-1', title: 'Test Paper 1' },
        { id: 'paper-2', title: 'Test Paper 2' },
      ];
      mockLiteratureSearchStore.selectedPapers = new Set(['paper-1', 'paper-2']);
      mockVideoManagementStore.transcribedVideos = new Set();

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText(/low source count warning/i)).toBeInTheDocument();
      expect(screen.getByText(/you have 2 source\(s\) available/i)).toBeInTheDocument();
      expect(screen.getByText(/minimum: 3-5 sources/i)).toBeInTheDocument();
    });

    it('should NOT show low source warning when 3+ sources are available', () => {
      // Arrange: 5 papers (above MIN_SOURCES_BASIC)
      mockLiteratureSearchStore.selectedPapers = new Set(['paper-1', 'paper-2', 'paper-3', 'paper-4', 'paper-5']);

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.queryByText(/low source count warning/i)).not.toBeInTheDocument();
    });

    it('should open Purpose Wizard when button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<ThemeExtractionActionCard />);
      const button = screen.getByRole('button', { name: /extract themes from/i });
      await user.click(button);

      // Assert
      expect(mockSetShowPurposeWizard).toHaveBeenCalledWith(true);
    });

    it('should show loading state during extraction', () => {
      // Arrange: Set analyzingThemes to true
      mockThemeExtractionStore.analyzingThemes = true;

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText(/extracting themes/i)).toBeInTheDocument();
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have proper aria-label for accessibility', () => {
      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      const button = screen.getByRole('button', { name: /extract themes from 5 sources/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('should show extracting aria-label when analyzing', () => {
      // Arrange
      mockThemeExtractionStore.analyzingThemes = true;

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      const button = screen.getByRole('button', { name: /extracting themes in progress/i });
      expect(button).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Theme Count Display Tests
  // ==========================================================================

  describe('Theme Count Display', () => {
    it('should show extracted theme count when themes exist', () => {
      // Arrange
      mockThemeExtractionStore.unifiedThemes = [
        { id: 'theme-1', label: 'Theme 1' },
        { id: 'theme-2', label: 'Theme 2' },
        { id: 'theme-3', label: 'Theme 3' },
      ];

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/themes extracted/i)).toBeInTheDocument();
    });

    it('should NOT show theme count when no themes extracted', () => {
      // Arrange: No themes
      mockThemeExtractionStore.unifiedThemes = [];

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.queryByText(/themes extracted/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('should render the card with correct title', () => {
      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText('Extract Research Themes')).toBeInTheDocument();
    });

    it('should render Purpose-Driven AI badge', () => {
      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText('Purpose-Driven AI')).toBeInTheDocument();
    });

    it('should render description text', () => {
      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText(/select your research purpose/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty Set for selectedPapers gracefully', () => {
      // Arrange
      mockLiteratureSearchStore.selectedPapers = new Set();
      mockLiteratureSearchStore.papers = [];

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert: Should show 0 papers selected
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/papers selected/i)).toBeInTheDocument();
    });

    it('should handle video-only sources correctly', () => {
      // Arrange: Only videos, no papers
      mockLiteratureSearchStore.papers = [];
      mockLiteratureSearchStore.selectedPapers = new Set();
      mockVideoManagementStore.transcribedVideos = new Set(['video-1', 'video-2', 'video-3', 'video-4']);

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText(/videos transcribed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /extract themes from 4 sources/i })).toBeInTheDocument();
    });

    it('should show no sources warning when both papers and videos are empty', () => {
      // Arrange
      mockLiteratureSearchStore.papers = [];
      mockLiteratureSearchStore.selectedPapers = new Set();
      mockVideoManagementStore.transcribedVideos = new Set();

      // Act
      render(<ThemeExtractionActionCard />);

      // Assert
      expect(screen.getByText(/search for papers above or transcribe videos/i)).toBeInTheDocument();
    });
  });
});
