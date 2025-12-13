import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from '../Badge';

// Add axe matchers
expect.extend(toHaveNoViolations);

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-white');
    });

    it('renders all variants correctly', () => {
      const variants = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const;
      
      variants.forEach(variant => {
        const { rerender } = render(<Badge variant={variant}>{variant}</Badge>);
        const badge = screen.getByText(variant);
        
        if (variant === 'primary') expect(badge).toHaveClass('bg-primary');
        if (variant === 'secondary') expect(badge).toHaveClass('bg-secondary');
        if (variant === 'success') expect(badge).toHaveClass('bg-success');
        if (variant === 'warning') expect(badge).toHaveClass('bg-warning');
        if (variant === 'danger') expect(badge).toHaveClass('bg-danger');
        if (variant === 'info') expect(badge).toHaveClass('bg-info');
        
        rerender(<div />);
      });
    });

    it('renders all sizes correctly', () => {
      const sizes = ['small', 'md', 'large'] as const;
      
      sizes.forEach(size => {
        const { rerender } = render(<Badge size={size}>{size}</Badge>);
        const badge = screen.getByText(size);
        
        if (size === 'small') {
          expect(badge).toHaveClass('text-xs');
          expect(badge).toHaveClass('px-2');
          expect(badge).toHaveClass('py-0.5');
        }
        if (size === 'md') {
          expect(badge).toHaveClass('text-sm');
          expect(badge).toHaveClass('px-2.5');
          expect(badge).toHaveClass('py-0.5');
        }
        if (size === 'large') {
          expect(badge).toHaveClass('text-base');
          expect(badge).toHaveClass('px-3');
          expect(badge).toHaveClass('py-1');
        }
        
        rerender(<div />);
      });
    });

    it('renders with dot indicator', () => {
      render(<Badge dot>With Dot</Badge>);
      const badge = screen.getByText('With Dot');
      const dot = badge.querySelector('.w-2.h-2.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('renders as removable with close button', () => {
      const onRemove = vi.fn();
      render(<Badge removable onRemove={onRemove}>Removable</Badge>);
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-badge');
    });

    it('renders with rounded variant', () => {
      render(<Badge rounded>Rounded</Badge>);
      const badge = screen.getByText('Rounded');
      expect(badge).toHaveClass('rounded-full');
    });

    it('renders with outlined variant', () => {
      render(<Badge outlined>Outlined</Badge>);
      const badge = screen.getByText('Outlined');
      expect(badge).toHaveClass('bg-transparent');
      expect(badge).toHaveClass('border');
    });
  });

  describe('Interactions', () => {
    it('handles remove click', async () => {
      const onRemove = vi.fn();
      render(
        <Badge removable onRemove={onRemove}>
          Removable Badge
        </Badge>
      );
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      await userEvent.click(closeButton);
      
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('prevents remove when disabled', async () => {
      const onRemove = vi.fn();
      render(
        <Badge removable onRemove={onRemove} disabled>
          Disabled Badge
        </Badge>
      );
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      expect(closeButton).toBeDisabled();
      
      await userEvent.click(closeButton);
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction for removal', async () => {
      const onRemove = vi.fn();
      render(
        <Badge removable onRemove={onRemove}>
          Keyboard Removable
        </Badge>
      );
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      closeButton.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Badge variant="success">Accessible Badge</Badge>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses appropriate ARIA attributes', () => {
      render(
        <Badge aria-label="Status Badge">
          Status
        </Badge>
      );
      
      const badge = screen.getByText('Status');
      const container = badge.parentElement;
      expect(container).toHaveAttribute('aria-label', 'Status Badge');
    });

    it('provides accessible remove button', () => {
      render(
        <Badge removable onRemove={() => {}}>
          Accessible Remove
        </Badge>
      );
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Remove badge');
    });

    it('handles focus correctly', () => {
      render(
        <Badge removable onRemove={() => {}}>
          Focus Test
        </Badge>
      );
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });

    it('respects reduced motion preferences', () => {
      render(<Badge>Motion Safe</Badge>);
      const badge = screen.getByText('Motion Safe');
      expect(badge).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Visual States', () => {
    it('shows disabled state', () => {
      render(<Badge disabled>Disabled</Badge>);
      const badge = screen.getByText('Disabled');
      expect(badge).toHaveClass('opacity-50');
      expect(badge).toHaveClass('cursor-not-allowed');
    });

    it('applies hover effects when interactive', async () => {
      const onClick = vi.fn();
      render(<Badge onClick={onClick}>Hoverable</Badge>);
      
      const badge = screen.getByText('Hoverable');
      await userEvent.hover(badge);
      
      // Badge should have hover classes
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('shows focus state when focusable', () => {
      render(
        <Badge tabIndex={0}>
          Focusable Badge
        </Badge>
      );
      
      const badge = screen.getByText('Focusable Badge');
      badge.focus();
      expect(badge).toHaveClass('focus-visible:outline-none');
      expect(badge).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Complex Content', () => {
    it('renders with icon and text', () => {
      render(
        <Badge>
          <span>🔔</span>
          <span>Notifications</span>
        </Badge>
      );
      
      expect(screen.getByText('🔔')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('renders with count', () => {
      render(<Badge count={99}>Messages</Badge>);
      
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('handles max count display', () => {
      render(<Badge count={100} maxCount={99}>Items</Badge>);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders empty badge (dot only)', () => {
      render(<Badge />);
      const badges = document.querySelectorAll('[class*="inline-flex"]');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Dark Mode Support', () => {
    it('adapts to dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<Badge variant="primary">Dark Mode</Badge>);
      const badge = screen.getByText('Dark Mode');
      
      // Badge should have appropriate classes for dark mode
      expect(badge).toHaveClass('bg-primary');
      
      document.documentElement.classList.remove('dark');
    });

    it('maintains contrast in dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<Badge variant="secondary">Dark Secondary</Badge>);
      const badge = screen.getByText('Dark Secondary');
      
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-label');
      
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = vi.fn();

      const TestBadge = React.memo(function TestBadge({ children, ...props }: any) {
        renderSpy();
        return <Badge {...props}>{children}</Badge>;
      });

      const { rerender } = render(<TestBadge>Test</TestBadge>);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestBadge>Test</TestBadge>);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different props
      rerender(<TestBadge variant="success">Test</TestBadge>);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', () => {
      const longText = 'A'.repeat(50);
      render(<Badge>{longText}</Badge>);
      
      const badge = screen.getByText(longText);
      expect(badge).toBeInTheDocument();
    });

    it('handles special characters', () => {
      render(<Badge>{'™ © & < > "'}</Badge>);
      const badge = screen.getByText('™ © & < > "');
      expect(badge).toBeInTheDocument();
    });

    it('handles numbers as children', () => {
      render(<Badge>{42}</Badge>);
      const badge = screen.getByText('42');
      expect(badge).toBeInTheDocument();
    });

    it('handles undefined onRemove gracefully', () => {
      render(<Badge removable>No Handler</Badge>);
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      expect(closeButton).toBeInTheDocument();
      
      // Should not throw when clicked without handler
      fireEvent.click(closeButton);
    });

    it('handles rapid clicks on remove', async () => {
      const onRemove = vi.fn();
      render(
        <Badge removable onRemove={onRemove}>
          Rapid Remove
        </Badge>
      );
      
      const closeButton = screen.getByRole('button', { name: /remove/i });
      
      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        await userEvent.click(closeButton);
      }
      
      // Should handle all clicks
      expect(onRemove).toHaveBeenCalledTimes(5);
    });
  });

  describe('Integration', () => {
    it('works in a list of badges', () => {
      render(
        <div>
          <Badge>First</Badge>
          <Badge>Second</Badge>
          <Badge>Third</Badge>
        </div>
      );
      
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('works with conditional rendering', () => {
      const { rerender } = render(
        <div>
          {true && <Badge>Visible</Badge>}
          {false && <Badge>Hidden</Badge>}
        </div>
      );
      
      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
      
      rerender(
        <div>
          {false && <Badge>Visible</Badge>}
          {true && <Badge>Hidden</Badge>}
        </div>
      );
      
      expect(screen.queryByText('Visible')).not.toBeInTheDocument();
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });
  });
});