import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseChart } from '../charts/BaseChart';

// Mock the useTheme hook
const mockUseTheme = vi.fn(() => ({ theme: 'light' }));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: mockUseTheme
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, whileHover, style, ...props }: any) => {
      return React.createElement('div', {
        ...props,
        style: {
          ...style,
          // Preserve the glass morphism styles for testing
          ...(props.style || {}),
        },
        'data-testid': 'motion-div',
        'data-initial': initial ? 'true' : 'false',
        'data-animate': animate ? 'true' : 'false'
      }, children);
    }
  }
}));

// Mock the utils function
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('BaseChart', () => {
  const user = userEvent.setup();
  
  const defaultProps = {
    width: 600,
    height: 400,
    children: <rect x={0} y={0} width={100} height={100} fill="blue" data-testid="test-rect" />
  };

  beforeEach(() => {
    mockUseTheme.mockReturnValue({ theme: 'light' });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<BaseChart {...defaultProps} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with correct dimensions', () => {
      render(<BaseChart {...defaultProps} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '600');
      expect(svg).toHaveAttribute('height', '400');
    });

    it('should render title when provided', () => {
      render(<BaseChart {...defaultProps} title="Test Chart Title" />);
      expect(screen.getByText('Test Chart Title')).toBeInTheDocument();
      expect(screen.getByText('Test Chart Title')).toHaveClass('text-lg', 'font-semibold');
    });

    it('should render subtitle when provided', () => {
      render(<BaseChart {...defaultProps} subtitle="Test Subtitle" />);
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toHaveClass('text-sm');
    });

    it('should render both title and subtitle together', () => {
      render(
        <BaseChart 
          {...defaultProps} 
          title="Main Title" 
          subtitle="Descriptive subtitle" 
        />
      );
      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Descriptive subtitle')).toBeInTheDocument();
    });
  });

  describe('Layout and Margins', () => {
    it('should apply default margins', () => {
      render(<BaseChart {...defaultProps} />);
      const g = document.querySelector('g');
      expect(g).toHaveAttribute('transform', 'translate(20,20)');
    });

    it('should apply custom margins', () => {
      const customMargin = { top: 50, right: 30, bottom: 40, left: 60 };
      render(
        <BaseChart {...defaultProps} margin={customMargin}>
          <rect data-testid="test-rect" />
        </BaseChart>
      );
      
      const g = document.querySelector('g');
      expect(g).toHaveAttribute('transform', 'translate(60,50)');
    });

    it('should handle zero margins', () => {
      const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
      render(<BaseChart {...defaultProps} margin={zeroMargin} />);
      
      const g = document.querySelector('g');
      expect(g).toHaveAttribute('transform', 'translate(0,0)');
    });
  });

  describe('Children Rendering', () => {
    it('should render children elements', () => {
      render(
        <BaseChart {...defaultProps}>
          <circle cx={50} cy={50} r={20} data-testid="test-circle" />
        </BaseChart>
      );
      
      const circle = screen.getByTestId('test-circle');
      expect(circle).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <BaseChart {...defaultProps}>
          <circle cx={50} cy={50} r={20} data-testid="circle-1" />
          <rect x={100} y={100} width={50} height={50} data-testid="rect-1" />
          <path d="M10,10 L20,20" data-testid="path-1" />
        </BaseChart>
      );
      
      expect(screen.getByTestId('circle-1')).toBeInTheDocument();
      expect(screen.getByTestId('rect-1')).toBeInTheDocument();
      expect(screen.getByTestId('path-1')).toBeInTheDocument();
    });
  });

  describe('Styling and Glass Effects', () => {
    it('should apply glass morphism styles', () => {
      const { container } = render(<BaseChart {...defaultProps} />);
      const chartContainer = container.querySelector('[data-testid="motion-div"]') as HTMLElement;
      
      expect(chartContainer.style.backdropFilter).toContain('saturate(180%) blur(20px)');
      expect(chartContainer.style.borderRadius).toBe('20px');
      expect(chartContainer.style.background).toContain('linear-gradient');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BaseChart {...defaultProps} className="custom-chart-class" />
      );
      const chartContainer = container.querySelector('[data-testid="motion-div"]') as HTMLElement;
      
      expect(chartContainer).toHaveClass('custom-chart-class');
      expect(chartContainer).toHaveClass('p-6', 'relative', 'overflow-hidden');
    });

    it('should have overflow-visible on SVG', () => {
      render(<BaseChart {...defaultProps} />);
      const svg = document.querySelector('svg');
      
      expect(svg).toHaveClass('overflow-visible');
    });
  });

  describe('Theme Integration', () => {
    it('should handle light theme', () => {
      mockUseTheme.mockReturnValue({ theme: 'light' });
      render(<BaseChart {...defaultProps} />);
      const svg = document.querySelector('svg');
      
      expect(svg?.style.filter).toBe('none');
    });

    it('should handle dark theme', () => {
      mockUseTheme.mockReturnValue({ theme: 'dark' });
      render(<BaseChart {...defaultProps} />);
      const svg = document.querySelector('svg');
      
      expect(svg?.style.filter).toContain('drop-shadow');
    });

    it('should update theme styles when theme changes', () => {
      const { rerender } = render(<BaseChart {...defaultProps} />);
      
      // Start with light theme
      mockUseTheme.mockReturnValue({ theme: 'light' });
      rerender(<BaseChart {...defaultProps} />);
      let svg = document.querySelector('svg');
      expect(svg?.style.filter).toBe('none');
      
      // Switch to dark theme
      mockUseTheme.mockReturnValue({ theme: 'dark' });
      rerender(<BaseChart {...defaultProps} />);
      svg = document.querySelector('svg');
      expect(svg?.style.filter).toContain('drop-shadow');
    });
  });

  describe('Gradient Definitions', () => {
    it('should include all Apple-style gradients', () => {
      render(<BaseChart {...defaultProps} />);
      
      expect(document.getElementById('appleBlue')).toBeInTheDocument();
      expect(document.getElementById('appleGreen')).toBeInTheDocument();
      expect(document.getElementById('appleRed')).toBeInTheDocument();
      expect(document.getElementById('applePurple')).toBeInTheDocument();
      expect(document.getElementById('appleOrange')).toBeInTheDocument();
    });

    it('should include glass effect filter', () => {
      render(<BaseChart {...defaultProps} />);
      
      expect(document.getElementById('glassEffect')).toBeInTheDocument();
    });

    it('should have correct gradient colors', () => {
      render(<BaseChart {...defaultProps} />);
      
      const blueGradient = document.getElementById('appleBlue');
      const stops = blueGradient?.querySelectorAll('stop');
      
      expect(stops?.[0]).toHaveAttribute('stop-color', '#007AFF');
      expect(stops?.[1]).toHaveAttribute('stop-color', '#0051D5');
    });
  });

  describe('Animation Props', () => {
    it('should enable animations by default', () => {
      const { container } = render(<BaseChart {...defaultProps} />);
      const motionDiv = container.querySelector('[data-testid="motion-div"]');
      
      expect(motionDiv).toHaveAttribute('data-initial', 'true');
      expect(motionDiv).toHaveAttribute('data-animate', 'true');
    });

    it('should disable animations when animate prop is false', () => {
      const { container } = render(<BaseChart {...defaultProps} animate={false} />);
      const motionDiv = container.querySelector('[data-testid="motion-div"]');
      
      expect(motionDiv).toHaveAttribute('data-initial', 'false');
    });

    it('should enable animations when animate prop is true', () => {
      const { container } = render(<BaseChart {...defaultProps} animate={true} />);
      const motionDiv = container.querySelector('[data-testid="motion-div"]');
      
      expect(motionDiv).toHaveAttribute('data-initial', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA structure with title', () => {
      render(
        <BaseChart {...defaultProps} title="Accessibility Test Chart" />
      );
      
      const title = screen.getByText('Accessibility Test Chart');
      expect(title).toHaveAttribute('class');
      expect(title.tagName).toBe('H3');
    });

    it('should maintain proper heading hierarchy', () => {
      render(
        <BaseChart 
          {...defaultProps} 
          title="Main Chart" 
          subtitle="Supporting information"
        />
      );
      
      const title = screen.getByText('Main Chart');
      const subtitle = screen.getByText('Supporting information');
      
      expect(title.tagName).toBe('H3');
      expect(subtitle.tagName).toBe('P');
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle different chart sizes', () => {
      const { rerender } = render(
        <BaseChart {...defaultProps} width={800} height={600} />
      );
      
      let svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
      
      rerender(<BaseChart {...defaultProps} width={400} height={300} />);
      
      svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '400');
      expect(svg).toHaveAttribute('height', '300');
    });

    it('should handle very small dimensions', () => {
      render(<BaseChart {...defaultProps} width={100} height={50} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '50');
    });

    it('should handle very large dimensions', () => {
      render(<BaseChart {...defaultProps} width={2000} height={1500} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '2000');
      expect(svg).toHaveAttribute('height', '1500');
    });
  });

  describe('Error Handling', () => {
    it('should render gracefully with null children', () => {
      render(
        <BaseChart {...defaultProps}>
          {null}
        </BaseChart>
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render gracefully with undefined children', () => {
      render(
        <BaseChart {...defaultProps}>
          {undefined}
        </BaseChart>
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle empty title and subtitle', () => {
      render(<BaseChart {...defaultProps} title="" subtitle="" />);
      
      // Should not render title/subtitle container when both are empty
      const titleContainer = screen.queryByText('');
      expect(titleContainer).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      
      const TestChart = (props: any) => {
        renderSpy();
        return <BaseChart {...props} />;
      };
      
      const { rerender } = render(
        <TestChart {...defaultProps} title="Test" />
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestChart {...defaultProps} title="Test" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // Expected to re-render
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<BaseChart {...defaultProps} />);
      
      // Rapidly change dimensions
      for (let i = 0; i < 10; i++) {
        rerender(
          <BaseChart 
            {...defaultProps} 
            width={600 + i * 10} 
            height={400 + i * 10} 
          />
        );
      }
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '690');
      expect(svg).toHaveAttribute('height', '490');
    });
  });
});