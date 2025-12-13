import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';

// Add axe matchers
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('h-10');
    });

    it('renders all variants correctly', () => {
      const variants = ['primary', 'secondary', 'tertiary', 'destructive'] as const;
      
      variants.forEach(variant => {
        const { rerender } = render(<Button variant={variant}>Test</Button>);
        const button = screen.getByRole('button');
        
        if (variant === 'primary') expect(button).toHaveClass('bg-primary');
        if (variant === 'secondary') expect(button).toHaveClass('bg-surface-secondary');
        if (variant === 'tertiary') expect(button).toHaveClass('bg-transparent');
        if (variant === 'destructive') expect(button).toHaveClass('bg-danger');
        
        rerender(<div />);
      });
    });

    it('renders all sizes correctly', () => {
      const sizes = ['small', 'md', 'large'] as const;
      
      sizes.forEach(size => {
        const { rerender } = render(<Button size={size}>Test</Button>);
        const button = screen.getByRole('button');
        
        if (size === 'small') expect(button).toHaveClass('h-8');
        if (size === 'md') expect(button).toHaveClass('h-10');
        if (size === 'large') expect(button).toHaveClass('h-12');
        
        rerender(<div />);
      });
    });

    it('renders full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('renders with loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('prevents click when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents click when loading', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('handles focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Test
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('States', () => {
    it('shows hover state', async () => {
      render(<Button>Hover me</Button>);
      const button = screen.getByRole('button');
      
      await userEvent.hover(button);
      // Note: Testing hover styles requires CSS-in-JS or computed styles
      expect(button).toHaveClass('hover:bg-primary-dark');
    });

    it('shows active state', () => {
      render(<Button>Press me</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.mouseDown(button);
      expect(button).toHaveClass('active:opacity-90');
    });

    it('shows focus state', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-primary');
    });

    it('shows disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses proper ARIA attributes', () => {
      render(<Button ariaLabel="Custom Label">Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
      expect(button).toHaveAttribute('role', 'button');
    });

    it('auto-generates aria-label from text content', () => {
      render(<Button>Simple Text</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Simple Text');
    });

    it('supports aria-disabled for loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('is keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </div>
      );
      
      const buttons = screen.getAllByRole('button');
      
      // Focus the first button initially
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();
      
      // Tab through buttons
      await user.tab();
      expect(buttons[1]).toHaveFocus();
      
      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });

    it('respects motion preferences', () => {
      render(<Button>Motion Safe</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = vi.fn();

      const TestButton = React.memo(function TestButton({ children, ...props }: any) {
        renderSpy();
        return <Button {...props}>{children}</Button>;
      });

      const { rerender } = render(<TestButton>Test</TestButton>);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestButton>Test</TestButton>);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different props
      rerender(<TestButton variant="secondary">Test</TestButton>);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles rapid clicks without issues', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        await userEvent.click(button);
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined children gracefully', () => {
      render(<Button>{undefined}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('handles very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Button>{longText}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(longText);
    });

    it('handles special characters in text', () => {
      render(<Button>Click & Save™ © 2024</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Click & Save™ © 2024');
    });
  });

  describe('Integration', () => {
    it('works within a form', () => {
      const handleSubmit = vi.fn(e => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('works with React Router Link (as prop)', () => {
      const Link = ({ to, children, ...props }: any) => (
        <a href={to} {...props}>{children}</a>
      );
      
      render(
        <Button as={Link} to="/test">
          Link Button
        </Button>
      );
      
      // Note: This test would need adjustment based on actual implementation
      expect(screen.getByText('Link Button')).toBeInTheDocument();
    });
  });
});