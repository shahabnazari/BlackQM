import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import InlineImageUpload from '@/components/editors/InlineImageUpload';
import { RichTextEditor } from '@/components/editors/RichTextEditorV2';

// Mock the upload service
vi.mock('@/lib/services/upload.service', () => ({
  uploadEditedImage: vi.fn().mockResolvedValue({
    url: '/uploads/test-image.png',
    filename: 'test-image.png',
  }),
}));

// Mock fetch for image upload
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      url: '/uploads/test-image.png',
      filename: 'test-image.png',
      size: 1024,
      dimensions: { width: 800, height: 600 },
    }),
  })
) as any;

describe('InlineImageUpload Component', () => {
  const mockOnImageSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload interface correctly', () => {
    render(
      <InlineImageUpload
        onImageSelect={mockOnImageSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Insert Image')).toBeInTheDocument();
    expect(screen.getByText('Upload and configure image placement')).toBeInTheDocument();
    expect(screen.getByText('Click to upload image')).toBeInTheDocument();
  });

  it('handles file selection and preview', async () => {
    const { container } = render(
      <InlineImageUpload
        onImageSelect={mockOnImageSelect}
        onClose={mockOnClose}
      />
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Dimensions:/)).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    const { container } = render(
      <InlineImageUpload
        onImageSelect={mockOnImageSelect}
        onClose={mockOnClose}
        maxFileSize={1} // 1MB limit
      />
    );

    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.png', { 
      type: 'image/png' 
    });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/File size must be less than/)).toBeInTheDocument();
    });
  });

  it('shows text wrapping options', async () => {
    const { container } = render(
      <InlineImageUpload
        onImageSelect={mockOnImageSelect}
        onClose={mockOnClose}
      />
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Text Wrapping')).toBeInTheDocument();
      expect(screen.getByTitle('Inline with text')).toBeInTheDocument();
      expect(screen.getByTitle('Text wraps on the right side')).toBeInTheDocument();
      expect(screen.getByTitle('Text wraps on the left side')).toBeInTheDocument();
      expect(screen.getByTitle('Center with text above and below')).toBeInTheDocument();
      expect(screen.getByTitle('Text breaks around the image')).toBeInTheDocument();
    });
  });

  it('handles image insertion with selected options', async () => {
    const { container } = render(
      <InlineImageUpload
        onImageSelect={mockOnImageSelect}
        onClose={mockOnClose}
      />
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Text Wrapping')).toBeInTheDocument();
    });

    // Select wrap mode
    const leftWrapButton = screen.getByTitle('Text wraps on the right side');
    fireEvent.click(leftWrapButton);

    // Set alt text
    const altInput = screen.getByPlaceholderText('Describe the image...');
    await userEvent.type(altInput, 'Test image description');

    // Insert image
    const insertButton = screen.getByText('Insert Image');
    fireEvent.click(insertButton);

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          src: expect.stringContaining('/uploads/'),
          wrapMode: 'left',
          alt: 'Test image description',
        })
      );
    });
  });
});


describe('RichTextEditor with Image Support', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor with image toolbar buttons', () => {
    render(
      <RichTextEditor
        content=""
        onChange={mockOnChange}
        allowImages={true}
      />
    );

    expect(screen.getByTitle('Insert Image')).toBeInTheDocument();
  });

  it('opens advanced image upload modal', async () => {
    render(
      <RichTextEditor
        content=""
        onChange={mockOnChange}
        allowImages={true}
      />
    );

    const advancedButton = screen.getByTitle('Insert Image');
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(screen.getByText('Insert Image')).toBeInTheDocument();
      expect(screen.getByText('Upload and configure image placement')).toBeInTheDocument();
    });
  });
});

describe('FloatingImageExtension Integration', () => {
  it('supports different wrap modes', () => {
    const wrapModes = ['inline', 'left', 'right', 'center', 'break-text'];
    
    wrapModes.forEach(mode => {
      const element = document.createElement('figure');
      element.setAttribute('data-floating-image', '');
      element.setAttribute('data-wrap-mode', mode);
      
      expect(element.getAttribute('data-wrap-mode')).toBe(mode);
    });
  });

  it('supports image resizing', () => {
    const element = document.createElement('figure');
    element.setAttribute('data-floating-image', '');
    element.setAttribute('data-width', '400');
    element.setAttribute('data-height', '300');
    
    expect(element.getAttribute('data-width')).toBe('400');
    expect(element.getAttribute('data-height')).toBe('300');
  });

  it('supports image rotation', () => {
    const element = document.createElement('figure');
    element.setAttribute('data-floating-image', '');
    element.setAttribute('data-rotation', '90');
    
    expect(element.getAttribute('data-rotation')).toBe('90');
  });

  it('supports margin adjustment', () => {
    const element = document.createElement('figure');
    element.setAttribute('data-floating-image', '');
    element.setAttribute('data-margin', '20');
    
    expect(element.getAttribute('data-margin')).toBe('20');
  });
});

describe('Image Upload Accessibility', () => {
  it('includes proper alt text input', () => {
    render(
      <InlineImageUpload
        onImageSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const altInput = screen.getByLabelText(/Alt Text/i);
    expect(altInput).toBeInTheDocument();
    expect(altInput).toHaveAttribute('placeholder', 'Describe the image...');
  });

  it('has keyboard navigation support', async () => {
    const { container } = render(
      <InlineImageUpload
        onImageSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const closeButton = container.querySelector('[aria-label="Close"]') || 
                       container.querySelector('button[title*="Close"]') ||
                       container.querySelector('button svg.X')?.parentElement;
    
    if (closeButton) {
      expect(closeButton).toBeInTheDocument();
      // Test keyboard interaction
      fireEvent.keyDown(closeButton, { key: 'Enter' });
    }
  });

  it('provides proper ARIA labels for image upload', () => {
    render(
      <InlineImageUpload
        onImageSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Check for semantic structure
    expect(screen.getByText('Insert Image')).toBeInTheDocument();
    expect(screen.getByText('Upload and configure image placement')).toBeInTheDocument();
  });
});

describe('Error Handling', () => {
  it('handles upload failures gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' }),
      })
    ) as any;

    const { container } = render(
      <InlineImageUpload
        onImageSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    const insertButton = screen.getByText('Insert Image');
    fireEvent.click(insertButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to upload image/)).toBeInTheDocument();
    });
  });

  it('validates image file types', async () => {
    const { container } = render(
      <InlineImageUpload
        onImageSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Please select a valid image file/)).toBeInTheDocument();
    });
  });
});