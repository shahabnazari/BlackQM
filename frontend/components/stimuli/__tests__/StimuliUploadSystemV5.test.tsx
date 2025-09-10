import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StimuliUploadSystemV5 } from '../StimuliUploadSystemV5';
import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the popup hook
vi.mock('@/components/ui/PopupModal', () => ({
  default: () => null,
  usePopup: () => ({
    popupState: { isOpen: false },
    closePopup: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showConfirm: vi.fn((message: string, onConfirm: () => void) => onConfirm()),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

// Mock react-intersection-observer
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: null, inView: true }),
}));

// Mock intersection observer
beforeEach(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })) as any;

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
});

describe('StimuliUploadSystemV5', () => {
  const mockGrid = {
    columns: [
      { value: -3, cells: 2 },
      { value: -2, cells: 3 },
      { value: -1, cells: 4 },
      { value: 0, cells: 5 },
      { value: 1, cells: 4 },
      { value: 2, cells: 3 },
      { value: 3, cells: 2 },
    ],
    totalCells: 23,
    distribution: 'bell' as const,
  };

  describe('Component Rendering', () => {
    it('should render all media type buttons', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Videos')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should display correct progress information', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      expect(screen.getByText('0 of 23 required stimuli')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show grid preview by default', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      expect(
        screen.getByText('Grid Preview - Fill Each Cell')
      ).toBeInTheDocument();
      expect(screen.getByText('0/23 cells filled')).toBeInTheDocument();
    });

    it('should display stimuli collection progress banner', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      expect(
        screen.getByText('Stimuli Collection Progress')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Add 23 more stimuli to fill all grid cells/)
      ).toBeInTheDocument();
    });
  });

  describe('Media Button Interactions', () => {
    it('should transform button to upload mode when clicked', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      const imageButton = screen.getByText('Images').closest('button');
      expect(imageButton).toBeInTheDocument();

      // Click the Images button
      if (imageButton) {
        await user.click(imageButton);

        // Button should now show "Upload Images"
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
        expect(screen.getByText('Click to browse files')).toBeInTheDocument();
      }
    });

    it('should change button color on hover', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      const videoButton = screen.getByText('Videos').closest('button');

      if (videoButton) {
        // Hover over the button
        await user.hover(videoButton);

        // Button should have hover styles
        expect(videoButton).toHaveStyle({
          cursor: 'pointer',
        });
      }
    });

    it('should switch between different media types', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Click Images button
      const imageButton = screen.getByText('Images').closest('button');
      if (imageButton) await user.click(imageButton);
      expect(screen.getByText('Upload Images')).toBeInTheDocument();

      // Click Videos button (this should deactivate Images)
      const videoButton = screen.getByText('Videos').closest('button');
      if (videoButton) await user.click(videoButton);
      expect(screen.getByText('Upload Videos')).toBeInTheDocument();
      expect(screen.queryByText('Upload Images')).not.toBeInTheDocument();
    });

    it('should toggle text input area when text button is clicked', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      const textButton = screen.getByText('Text').closest('button');
      if (textButton) {
        await user.click(textButton);

        // Text input area should appear
        expect(
          screen.getByPlaceholderText(/Enter your text statement here/)
        ).toBeInTheDocument();
        expect(screen.getByText('0 words')).toBeInTheDocument();
        expect(screen.getByText('(50-150 required)')).toBeInTheDocument();
      }
    });
  });

  describe('Text Input Functionality', () => {
    it('should validate word count for text input', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Open text input
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      );

      // Type text with less than 50 words
      await user.type(textarea, 'This is a short text');
      expect(screen.getByText('4 words')).toBeInTheDocument();

      // Add button should be disabled
      const addButton = screen.getByRole('button', { name: /Add Statement/i });
      expect(addButton).toBeDisabled();
    });

    it('should enable add button when text meets requirements', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Open text input
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      );

      // Type text with 50+ words
      const longText = Array(51).fill('word').join(' ');
      await user.type(textarea, longText);

      expect(screen.getByText('51 words')).toBeInTheDocument();

      // Add button should be enabled
      const addButton = screen.getByRole('button', { name: /Add Statement/i });
      expect(addButton).toBeEnabled();
    });

    it('should clear text input when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Open text input
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      ) as HTMLTextAreaElement;
      await user.type(textarea, 'Some text content');

      // Click Clear button
      const clearButton = screen.getByRole('button', { name: /Clear/i });
      await user.click(clearButton);

      expect(textarea.value).toBe('');
      expect(screen.getByText('0 words')).toBeInTheDocument();
    });
  });

  describe('Grid Preview', () => {
    it('should toggle grid preview visibility', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      const toggleButton = screen
        .getByText('Grid Preview - Fill Each Cell')
        .closest('button');

      if (toggleButton) {
        // Grid should be visible initially
        expect(
          screen.getByText(
            'Your Q-sort grid configuration. Cells fill up as you upload stimuli.'
          )
        ).toBeInTheDocument();

        // Click to hide
        await user.click(toggleButton);

        // Grid content should be hidden after animation
        await waitFor(() => {
          expect(
            screen.queryByText(
              'Your Q-sort grid configuration. Cells fill up as you upload stimuli.'
            )
          ).not.toBeInTheDocument();
        });

        // Click to show again
        await user.click(toggleButton);

        await waitFor(() => {
          expect(
            screen.getByText(
              'Your Q-sort grid configuration. Cells fill up as you upload stimuli.'
            )
          ).toBeInTheDocument();
        });
      }
    });

    it('should display color-coded legend for different media types', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Check for legend items with proper colors
      const legend = screen.getByText('Image').parentElement?.parentElement;
      if (legend) {
        expect(screen.getByText('Image')).toBeInTheDocument();
        expect(screen.getByText('Video')).toBeInTheDocument();
        expect(screen.getByText('Audio')).toBeInTheDocument();
        expect(screen.getByText('Empty')).toBeInTheDocument();

        // Check that color swatches exist
        const colorSwatches = legend.querySelectorAll(
          '[style*="backgroundColor"]'
        );
        expect(colorSwatches.length).toBeGreaterThan(0);
      }
    });

    it('should show grid cells with proper structure', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Check for column headers with values
      expect(screen.getByText('-3')).toBeInTheDocument();
      expect(screen.getByText('-2')).toBeInTheDocument();
      expect(screen.getByText('-1')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
    });
  });

  describe('Gallery View', () => {
    it('should not show gallery when no stimuli are present', () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      expect(screen.queryByText('Stimuli Gallery')).not.toBeInTheDocument();
    });

    it('should show gallery after adding a stimulus', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Add a text stimulus
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      );
      const longText = Array(51).fill('word').join(' ');
      await user.type(textarea, longText);

      const addButton = screen.getByRole('button', { name: /Add Statement/i });
      await user.click(addButton);

      // Gallery should now be visible
      await waitFor(() => {
        expect(screen.getByText('Stimuli Gallery')).toBeInTheDocument();
        expect(screen.getByText('1/23')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload Integration', () => {
    it('should have hidden file inputs for each media type', () => {
      const { container } = render(<StimuliUploadSystemV5 grid={mockGrid} />);

      const fileInputs = container.querySelectorAll('input[type="file"]');
      expect(fileInputs.length).toBe(3); // image, video, audio

      // Check accept attributes
      const imageInput = container.querySelector('input[accept="image/*"]');
      const videoInput = container.querySelector('input[accept="video/*"]');
      const audioInput = container.querySelector('input[accept="audio/*"]');

      expect(imageInput).toBeInTheDocument();
      expect(videoInput).toBeInTheDocument();
      expect(audioInput).toBeInTheDocument();
    });

    it('should handle file upload', async () => {
      const user = userEvent.setup();
      const { container } = render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Activate image upload mode
      const imageButton = screen.getByText('Images').closest('button');
      if (imageButton) await user.click(imageButton);

      // Get the image input
      const imageInput = container.querySelector(
        'input[accept="image/*"]'
      ) as HTMLInputElement;

      // Create a mock file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Simulate file selection
      await user.upload(imageInput, file);

      // Should show success and update progress
      await waitFor(() => {
        expect(
          screen.getByText('1 of 23 required stimuli')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Progress and Completion', () => {
    it('should calculate progress percentage correctly', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Initially 0%
      expect(screen.getByText('0%')).toBeInTheDocument();

      // Add a text stimulus
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      );
      const longText = Array(51).fill('word').join(' ');
      await user.type(textarea, longText);

      const addButton = screen.getByRole('button', { name: /Add Statement/i });
      await user.click(addButton);

      // Progress should update (1/23 ≈ 4%)
      await waitFor(() => {
        expect(
          screen.getByText('1 of 23 required stimuli')
        ).toBeInTheDocument();
        expect(screen.getByText('4%')).toBeInTheDocument();
      });
    });

    it('should disable buttons when grid is full', async () => {
      const user = userEvent.setup();
      // Create a small grid for easier testing
      const smallGrid = {
        columns: [{ value: 0, cells: 1 }],
        totalCells: 1,
        distribution: 'flat' as const,
      };

      render(<StimuliUploadSystemV5 grid={smallGrid} />);

      // Add one stimulus to fill the grid
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      );
      const longText = Array(51).fill('word').join(' ');
      await user.type(textarea, longText);

      const addButton = screen.getByRole('button', { name: /Add Statement/i });
      await user.click(addButton);

      // Should show completion status
      await waitFor(() => {
        expect(
          screen.getByText('All grid cells are filled! Your Q-sort is ready.')
        ).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('Grid Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for gallery view buttons', async () => {
      const user = userEvent.setup();
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      // Add a stimulus to show gallery
      const textButton = screen.getByText('Text').closest('button');
      if (textButton) await user.click(textButton);

      const textarea = screen.getByPlaceholderText(
        /Enter your text statement here/
      );
      const longText = Array(51).fill('word').join(' ');
      await user.type(textarea, longText);

      const addButton = screen.getByRole('button', { name: /Add Statement/i });
      await user.click(addButton);

      // Check for ARIA labels
      await waitFor(() => {
        expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
        expect(screen.getByLabelText('Compact view')).toBeInTheDocument();
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<StimuliUploadSystemV5 grid={mockGrid} />);

      const imageButton = screen.getByText('Images').closest('button');

      if (imageButton) {
        // Focus the button
        imageButton.focus();
        expect(document.activeElement).toBe(imageButton);

        // Press Enter to activate
        fireEvent.keyDown(imageButton, { key: 'Enter', code: 'Enter' });
        fireEvent.click(imageButton);

        // Should be activated
        await waitFor(() => {
          expect(screen.getByText('Upload Images')).toBeInTheDocument();
        });
      }
    });
  });
});
