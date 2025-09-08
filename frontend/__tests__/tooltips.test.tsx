import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfoTooltipV2 from '@/components/tooltips/InfoTooltipV2';
import '@testing-library/jest-dom';

describe('InfoTooltipV2', () => {
  const defaultProps = {
    title: 'Test Title',
    content: 'Test content description',
    examples: ['Example 1', 'Example 2'],
    link: {
      text: 'Learn more',
      href: 'https://example.com'
    }
  };

  beforeEach(() => {
    // Clear any existing portals
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders the trigger button', () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      expect(button).toBeInTheDocument();
    });

    it('does not show tooltip content initially', () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders tooltip content when clicked', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test content description')).toBeInTheDocument();
      });
    });

    it('renders examples when provided', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Example 1')).toBeInTheDocument();
        expect(screen.getByText('Example 2')).toBeInTheDocument();
      });
    });

    it('renders link when provided', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /learn more/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Interactions', () => {
    it('shows tooltip on hover after delay', async () => {
      render(<InfoTooltipV2 {...defaultProps} delay={100} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.mouseEnter(button);
      
      // Should not show immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      
      // Should show after delay
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('hides tooltip on mouse leave', async () => {
      render(<InfoTooltipV2 {...defaultProps} delay={0} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(button);
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('toggles tooltip on click', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      // Show on click
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      // Hide on second click
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('closes tooltip on Escape key', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(button, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('keeps tooltip open when hovering over tooltip content', async () => {
      render(<InfoTooltipV2 {...defaultProps} delay={0} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      const tooltip = screen.getByRole('tooltip');
      fireEvent.mouseEnter(tooltip);
      fireEvent.mouseLeave(button);
      
      // Tooltip should stay open
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      // Initially
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-describedby');
      
      // When open
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveAttribute('aria-describedby');
      });
    });

    it('is keyboard navigable', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
      
      // Should open on Enter/Space
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('has focus ring when focused', () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      button.focus();
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Positioning', () => {
    it('respects position prop', async () => {
      const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
      
      for (const position of positions) {
        const { rerender } = render(<InfoTooltipV2 {...defaultProps} position={position} />);
        const button = screen.getByRole('button', { name: /more information/i });
        
        fireEvent.click(button);
        
        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });
        
        // Clean up for next iteration
        fireEvent.click(button);
        await waitFor(() => {
          expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });
        
        rerender(<></>);
      }
    });

    it('uses auto positioning when specified', async () => {
      render(<InfoTooltipV2 {...defaultProps} position="auto" />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        // Auto positioning should select best position
        expect(tooltip).toHaveStyle({ position: 'fixed' });
      });
    });
  });

  describe('Portal Rendering', () => {
    it('renders tooltip in document body', async () => {
      const { container } = render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        // Tooltip should be in body, not in component container
        expect(container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
        expect(document.body.querySelector('[role="tooltip"]')).toBeInTheDocument();
      });
    });
  });

  describe('Animation', () => {
    it('has smooth transition classes', async () => {
      render(<InfoTooltipV2 {...defaultProps} />);
      const button = screen.getByRole('button', { name: /more information/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('transition-all', 'duration-200');
      });
    });
  });
});

describe('Tooltip Usability', () => {
  const defaultProps = {
    title: 'Test Title',
    content: 'Test content description'
  };

  it('prevents accidental trigger on quick mouse pass', async () => {
    render(<InfoTooltipV2 {...defaultProps} delay={300} />);
    const button = screen.getByRole('button', { name: /more information/i });
    
    // Quick mouse enter and leave
    fireEvent.mouseEnter(button);
    setTimeout(() => fireEvent.mouseLeave(button), 50);
    
    // Wait for potential tooltip appearance
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Tooltip should not appear
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('provides sufficient reading time before auto-hide', async () => {
    render(<InfoTooltipV2 {...defaultProps} delay={0} />);
    const button = screen.getByRole('button', { name: /more information/i });
    
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
    
    fireEvent.mouseLeave(button);
    
    // Should have a small delay before hiding
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });
});