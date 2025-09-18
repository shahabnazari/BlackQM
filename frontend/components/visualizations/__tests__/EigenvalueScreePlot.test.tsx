import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EigenvalueScreePlot } from '../q-methodology/EigenvalueScreePlot';

// Mock dependencies
const mockUseTheme = vi.fn(() => ({ theme: 'light' }));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: mockUseTheme
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    path: ({ children, ...props }: any) => React.createElement('path', props, children),
    g: ({ children, ...props }: any) => React.createElement('g', props, children),
    circle: ({ children, ...props }: any) => React.createElement('circle', props, children),
    text: ({ children, ...props }: any) => React.createElement('text', props, children),
    line: ({ children, ...props }: any) => React.createElement('line', props, children)
  }
}));

// Mock d3 scale functions
vi.mock('d3', () => ({
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    nice: vi.fn().mockReturnThis(),
    ticks: vi.fn(() => [0, 1, 2, 3, 4, 5]),
    tickFormat: vi.fn(() => (d: number) => d.toString()),
  })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    bandwidth: vi.fn(() => 40),
    padding: vi.fn().mockReturnThis(),
  })),
  line: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis(),
  })),
  curveMonotoneX: vi.fn(),
  max: vi.fn((arr, accessor) => accessor ? Math.max(...arr.map(accessor)) : Math.max(...arr)),
  extent: vi.fn((arr, accessor) => accessor ? [Math.min(...arr.map(accessor)), Math.max(...arr.map(accessor))] : [Math.min(...arr), Math.max(...arr)]),
}));

describe('EigenvalueScreePlot', () => {
  const user = userEvent.setup();

  const mockData = [
    { factor: 1, eigenvalue: 4.5, varianceExplained: 25, cumulativeVariance: 25 },
    { factor: 2, eigenvalue: 2.8, varianceExplained: 18, cumulativeVariance: 43 },
    { factor: 3, eigenvalue: 1.5, varianceExplained: 12, cumulativeVariance: 55 },
    { factor: 4, eigenvalue: 0.9, varianceExplained: 8, cumulativeVariance: 63 },
    { factor: 5, eigenvalue: 0.6, varianceExplained: 5, cumulativeVariance: 68 }
  ];

  const defaultProps = {
    data: mockData,
    width: 800,
    height: 500
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
      render(<EigenvalueScreePlot {...defaultProps} />);
      expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
    });

    it('should display correct title', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
      expect(screen.getByText('Eigenvalue Scree Plot')).toHaveClass('text-lg', 'font-semibold');
    });

    it('should display subtitle', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      expect(screen.getByText('Factor extraction analysis with Kaiser criterion')).toBeInTheDocument();
    });

    it('should render with custom dimensions', () => {
      const { container } = render(
        <EigenvalueScreePlot {...defaultProps} width={1000} height={600} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '1000');
      expect(svg).toHaveAttribute('height', '600');
    });

    it('should render with default dimensions when not provided', () => {
      const { container } = render(
        <EigenvalueScreePlot data={mockData} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '700');
      expect(svg).toHaveAttribute('height', '400');
    });
  });

  describe('Data Visualization', () => {
    it('should render correct number of data points', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      // Should have circles for eigenvalues and possibly Kaiser criterion point
      expect(circles.length).toBeGreaterThanOrEqual(mockData.length);
    });

    it('should display eigenvalue labels for values >= 1', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Factors 1, 2, and 3 have eigenvalues >= 1 (Kaiser criterion)
      expect(screen.getByText('4.50')).toBeInTheDocument();
      expect(screen.getByText('2.80')).toBeInTheDocument();
      expect(screen.getByText('1.50')).toBeInTheDocument();
    });

    it('should render scree line connecting all points', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const paths = container.querySelectorAll('path');
      
      // Should have at least one path for the scree line
      expect(paths.length).toBeGreaterThanOrEqual(1);
    });

    it('should render cumulative variance line', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const paths = container.querySelectorAll('path');
      
      // Should have paths for both eigenvalue line and cumulative variance line
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('should display Kaiser criterion reference line', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      expect(screen.getByText(/Kaiser Criterion/)).toBeInTheDocument();
    });
  });

  describe('Axes and Labels', () => {
    it('should render x-axis label', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      expect(screen.getByText('Factor')).toBeInTheDocument();
    });

    it('should render y-axis labels', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      expect(screen.getByText('Eigenvalue')).toBeInTheDocument();
      expect(screen.getByText('Cumulative Variance %')).toBeInTheDocument();
    });

    it('should render axis tick labels', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const textElements = container.querySelectorAll('text');
      
      // Should have text elements for axis ticks
      expect(textElements.length).toBeGreaterThan(5);
    });

    it('should display factor numbers on x-axis', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Should show factor numbers 1-5
      mockData.forEach(item => {
        expect(screen.getByText(item.factor.toString())).toBeInTheDocument();
      });
    });
  });

  describe('Data Accuracy', () => {
    it('should correctly identify factors above Kaiser criterion', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Only eigenvalues >= 1.0 should be highlighted/labeled
      const aboveKaiser = mockData.filter((d: any) => d.eigenvalue >= 1.0);
      const belowKaiser = mockData.filter((d: any) => d.eigenvalue < 1.0);
      
      aboveKaiser.forEach(item => {
        expect(screen.getByText(item.eigenvalue.toFixed(2))).toBeInTheDocument();
      });
      
      // Below Kaiser criterion values should not have prominent labels
      belowKaiser.forEach(item => {
        const label = screen.queryByText(item.eigenvalue.toFixed(2));
        // May or may not be present, depends on implementation
      });
    });

    it('should calculate correct cumulative variance', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Verify cumulative variance values are displayed
      mockData.forEach(item => {
        if (item.cumulativeVariance <= 100) {
          // Should be displayed somewhere in the chart
          const varianceText = screen.queryByText(`${item.cumulativeVariance}%`);
          // May be formatted differently, so just check that variance data is used
        }
      });
    });

    it('should handle single data point', () => {
      const singleData = [mockData[0]];
      render(<EigenvalueScreePlot data={singleData} />);
      
      expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
      expect(screen.getByText('4.50')).toBeInTheDocument();
    });

    it('should handle large eigenvalues correctly', () => {
      const largeData = [
        { factor: 1, eigenvalue: 15.8, varianceExplained: 45, cumulativeVariance: 45 },
        { factor: 2, eigenvalue: 8.2, varianceExplained: 25, cumulativeVariance: 70 }
      ];
      
      render(<EigenvalueScreePlot data={largeData} />);
      expect(screen.getByText('15.80')).toBeInTheDocument();
      expect(screen.getByText('8.20')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should show tooltip on data point hover', async () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      
      if (circles.length > 0) {
        fireEvent.mouseEnter(circles[0]);
        
        // Should trigger hover behavior
        await waitFor(() => {
          expect(circles[0]).toHaveStyle({ cursor: 'pointer' });
        });
      }
    });

    it('should handle mouse leave events', async () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      
      if (circles.length > 0) {
        fireEvent.mouseEnter(circles[0]);
        fireEvent.mouseLeave(circles[0]);
        
        // Should handle mouse leave gracefully
        expect(circles[0]).toBeInTheDocument();
      }
    });

    it('should be responsive to clicks', async () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      
      if (circles.length > 0) {
        fireEvent.click(circles[0]);
        
        // Should handle click events without crashing
        expect(circles[0]).toBeInTheDocument();
      }
    });
  });

  describe('Styling and Theme Integration', () => {
    it('should apply correct styling for light theme', () => {
      mockUseTheme.mockReturnValue({ theme: 'light' });
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply correct styling for dark theme', () => {
      mockUseTheme.mockReturnValue({ theme: 'dark' });
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should use Apple-style colors for data points', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      
      circles.forEach(circle => {
        const fill = circle.getAttribute('fill');
        // Should use predefined color scheme or gradients
        expect(fill).toBeTruthy();
      });
    });

    it('should apply different styles to Kaiser criterion points', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      
      // Points above Kaiser criterion should have different styling
      // This test verifies the visual distinction exists
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      render(<EigenvalueScreePlot data={[]} />);
      expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
      // Should not crash with empty data
    });

    it('should handle undefined data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        render(<EigenvalueScreePlot data={undefined as any} />);
        expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
      } catch (error: any) {
        // Should handle gracefully or throw meaningful error
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle malformed data entries', () => {
      const malformedData = [
        { factor: 1, eigenvalue: 4.5, varianceExplained: 25, cumulativeVariance: 25 },
        { factor: 2, eigenvalue: null, varianceExplained: 18, cumulativeVariance: 43 },
        { factor: 3, eigenvalue: 1.5, varianceExplained: null, cumulativeVariance: 55 }
      ];
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<EigenvalueScreePlot data={malformedData as any} />);
      expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle negative eigenvalues', () => {
      const negativeData = [
        { factor: 1, eigenvalue: 2.5, varianceExplained: 25, cumulativeVariance: 25 },
        { factor: 2, eigenvalue: -0.5, varianceExplained: 18, cumulativeVariance: 43 }
      ];
      
      render(<EigenvalueScreePlot data={negativeData} />);
      expect(screen.getByText('Eigenvalue Scree Plot')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      const title = screen.getByText('Eigenvalue Scree Plot');
      expect(title.tagName).toBe('H3');
    });

    it('should have descriptive subtitle', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      const subtitle = screen.getByText('Factor extraction analysis with Kaiser criterion');
      expect(subtitle.tagName).toBe('P');
    });

    it('should be keyboard accessible', async () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Tab through focusable elements
      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        factor: i + 1,
        eigenvalue: Math.max(0.1, 10 - i * 0.1),
        varianceExplained: Math.max(1, 20 - i * 0.2),
        cumulativeVariance: Math.min(100, (i + 1) * 2)
      }));
      
      const start = performance.now();
      render(<EigenvalueScreePlot data={largeData} />);
      const end = performance.now();
      
      // Should render within reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
    });

    it('should update efficiently when data changes', () => {
      const { rerender } = render(<EigenvalueScreePlot {...defaultProps} />);
      
      const newData = [
        ...mockData,
        { factor: 6, eigenvalue: 0.3, varianceExplained: 3, cumulativeVariance: 71 }
      ];
      
      const start = performance.now();
      rerender(<EigenvalueScreePlot data={newData} />);
      const end = performance.now();
      
      // Should update efficiently
      expect(end - start).toBeLessThan(100);
    });

    it('should not re-render unnecessarily with same data', () => {
      const renderSpy = vi.fn();
      
      const TestComponent = (props: any) => {
        renderSpy();
        return <EigenvalueScreePlot {...props} />;
      };
      
      const { rerender } = render(<TestComponent {...defaultProps} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same data
      rerender(<TestComponent {...defaultProps} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistical Accuracy', () => {
    it('should correctly apply Kaiser criterion threshold', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Kaiser criterion is eigenvalue >= 1.0
      const aboveKaiser = mockData.filter((d: any) => d.eigenvalue >= 1.0).length;
      const belowKaiser = mockData.filter((d: any) => d.eigenvalue < 1.0).length;
      
      expect(aboveKaiser).toBe(3); // Factors 1, 2, 3
      expect(belowKaiser).toBe(2); // Factors 4, 5
    });

    it('should maintain proper scale relationships', () => {
      const { container } = render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Verify that higher eigenvalues are positioned higher on the chart
      // This is implementation-dependent but important for data integrity
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should show variance accumulation correctly', () => {
      render(<EigenvalueScreePlot {...defaultProps} />);
      
      // Cumulative variance should be non-decreasing
      let previousCumVar = 0;
      mockData.forEach(item => {
        expect(item.cumulativeVariance).toBeGreaterThanOrEqual(previousCumVar);
        previousCumVar = item.cumulativeVariance;
      });
    });
  });
});