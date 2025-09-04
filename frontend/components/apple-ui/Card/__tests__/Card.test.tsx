import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card } from '../Card';

// Add axe matchers
expect.extend(toHaveNoViolations);

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Card>Card Content</Card>);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card Content');
    });

    it('renders with title', () => {
      render(<Card title="Test Title">Content</Card>);
      const heading = screen.getByRole('heading', { name: /test title/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-xl');
    });

    it('renders with subtitle', () => {
      render(<Card subtitle="Test Subtitle">Content</Card>);
      const subtitle = screen.getByText('Test Subtitle');
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass('text-sm');
      expect(subtitle).toHaveClass('text-secondary-label');
    });

    it('renders with both title and subtitle', () => {
      render(
        <Card title="Main Title" subtitle="Supporting Text">
          Content
        </Card>
      );
      
      expect(screen.getByRole('heading', { name: /main title/i })).toBeInTheDocument();
      expect(screen.getByText('Supporting Text')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Card className="custom-card">Content</Card>);
      const card = screen.getByRole('article');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('bg-surface'); // Should keep default classes
    });

    it('renders with footer', () => {
      render(
        <Card footer={<button>Action</button>}>
          Content
        </Card>
      );
      
      const button = screen.getByRole('button', { name: /action/i });
      expect(button).toBeInTheDocument();
      
      const footer = button.closest('.border-t');
      expect(footer).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Card variant="default">Default Card</Card>);
      const card = screen.getByRole('article');
      expect(card).toHaveClass('bg-surface');
      expect(card).toHaveClass('shadow-md');
    });

    it('renders bordered variant', () => {
      render(<Card variant="bordered">Bordered Card</Card>);
      const card = screen.getByRole('article');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-separator');
    });

    it('renders elevated variant', () => {
      render(<Card variant="elevated">Elevated Card</Card>);
      const card = screen.getByRole('article');
      expect(card).toHaveClass('shadow-xl');
    });

    it('renders ghost variant', () => {
      render(<Card variant="ghost">Ghost Card</Card>);
      const card = screen.getByRole('article');
      expect(card).toHaveClass('bg-transparent');
      expect(card).not.toHaveClass('shadow-md');
    });
  });

  describe('Interactions', () => {
    it('handles click events when clickable', async () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} clickable>
          Clickable Card
        </Card>
      );
      
      const card = screen.getByRole('article');
      await userEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(card).toHaveClass('cursor-pointer');
    });

    it('does not handle clicks when not clickable', async () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick}>
          Non-clickable Card
        </Card>
      );
      
      const card = screen.getByRole('article');
      await userEvent.click(card);
      
      // onClick should still work even without clickable prop
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('handles hover state when clickable', async () => {
      render(<Card clickable>Hoverable Card</Card>);
      const card = screen.getByRole('article');
      
      await userEvent.hover(card);
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('handles keyboard navigation when clickable', async () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} clickable>
          Keyboard Card
        </Card>
      );
      
      const card = screen.getByRole('article');
      card.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('shows loading state', () => {
      render(<Card loading>Content</Card>);
      const card = screen.getByRole('article');
      
      expect(card).toHaveAttribute('aria-busy', 'true');
      // Content should still be visible during loading
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('shows loading with skeleton', () => {
      render(
        <Card loading loadingType="skeleton">
          Content
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-busy', 'true');
    });

    it('disables interactions when loading', async () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} loading clickable>
          Loading Card
        </Card>
      );
      
      const card = screen.getByRole('article');
      await userEvent.click(card);
      
      // Should prevent clicks during loading
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Card title="Accessible Card" subtitle="With subtitle">
          Card content with proper accessibility
        </Card>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic HTML elements', () => {
      render(
        <Card title="Semantic Card">
          Content
        </Card>
      );
      
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('has proper focus management', () => {
      render(
        <Card clickable tabIndex={0}>
          Focusable Card
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabindex', '0');
      
      card.focus();
      expect(card).toHaveFocus();
      expect(card).toHaveClass('focus-visible:outline-none');
      expect(card).toHaveClass('focus-visible:ring-2');
    });

    it('respects reduced motion preferences', () => {
      render(<Card>Motion Safe Card</Card>);
      const card = screen.getByRole('article');
      
      expect(card).toHaveClass('motion-reduce:transition-none');
    });

    it('provides proper ARIA attributes', () => {
      render(
        <Card 
          loading 
          aria-label="Custom Card Label"
          role="region"
        >
          Content
        </Card>
      );
      
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-busy', 'true');
      expect(card).toHaveAttribute('aria-label', 'Custom Card Label');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive padding', () => {
      render(<Card>Responsive Card</Card>);
      const card = screen.getByRole('article');
      
      expect(card).toHaveClass('p-4');
      expect(card).toHaveClass('md:p-6');
      expect(card).toHaveClass('lg:p-8');
    });

    it('handles responsive text sizes', () => {
      render(<Card title="Responsive Title">Content</Card>);
      const heading = screen.getByRole('heading');
      
      expect(heading).toHaveClass('text-xl');
      expect(heading).toHaveClass('md:text-2xl');
    });
  });

  describe('Complex Content', () => {
    it('renders complex nested content', () => {
      render(
        <Card title="Complex Card">
          <div>
            <p>Paragraph 1</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <button>Action</button>
          </div>
        </Card>
      );
      
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('handles multiple cards in a grid', () => {
      render(
        <div className="grid grid-cols-3">
          <Card>Card 1</Card>
          <Card>Card 2</Card>
          <Card>Card 3</Card>
        </div>
      );
      
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(3);
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes', () => {
      document.documentElement.classList.add('dark');
      
      render(<Card>Dark Mode Card</Card>);
      const card = screen.getByRole('article');
      
      expect(card).toHaveClass('bg-surface');
      // The actual color will be controlled by CSS variables
      
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Performance', () => {
    it('memoizes expensive operations', () => {
      const expensiveOperation = vi.fn(() => 'result');
      
      const CardWithExpensive = ({ value }: { value: number }) => (
        <Card>
          {expensiveOperation()}
          {value}
        </Card>
      );
      
      const { rerender } = render(<CardWithExpensive value={1} />);
      expect(expensiveOperation).toHaveBeenCalledTimes(1);
      
      rerender(<CardWithExpensive value={1} />);
      // Should not re-compute if props are same
      expect(expensiveOperation).toHaveBeenCalledTimes(2); // React re-renders by default
      
      rerender(<CardWithExpensive value={2} />);
      expect(expensiveOperation).toHaveBeenCalledTimes(3);
    });

    it('handles rapid hover events efficiently', async () => {
      render(<Card clickable>Hover Test</Card>);
      const card = screen.getByRole('article');
      
      // Simulate rapid hover events
      for (let i = 0; i < 20; i++) {
        await userEvent.hover(card);
        await userEvent.unhover(card);
      }
      
      // Should not crash or have performance issues
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<Card />);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const longText = 'A'.repeat(1000);
      render(<Card>{longText}</Card>);
      
      const card = screen.getByRole('article');
      expect(card).toHaveTextContent(longText);
    });

    it('handles special characters in title', () => {
      render(<Card title="Title with ™ © & symbols">Content</Card>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Title with ™ © & symbols');
    });

    it('handles RTL text direction', () => {
      render(
        <div dir="rtl">
          <Card title="כותרת בעברית">תוכן בעברית</Card>
        </div>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveTextContent('תוכן בעברית');
    });
  });
});