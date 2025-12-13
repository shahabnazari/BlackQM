import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProgressBar } from '../ProgressBar';

// Add axe matchers
expect.extend(toHaveNoViolations);

describe('ProgressBar Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('renders with label', () => {
      render(<ProgressBar value={75} label="Upload Progress" />);
      const label = screen.getByText('Upload Progress');
      expect(label).toBeInTheDocument();
    });

    it('renders with percentage display', () => {
      render(<ProgressBar value={33} showPercentage />);
      const percentage = screen.getByText('33%');
      expect(percentage).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<ProgressBar value={60} className="custom-progress" />);
      const container = document.querySelector('.custom-progress');
      expect(container).toBeInTheDocument();
    });

    it('renders with min and max values', () => {
      render(<ProgressBar value={50} min={0} max={200} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '200');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('calculates percentage correctly with custom min/max', () => {
      render(<ProgressBar value={150} min={100} max={200} showPercentage />);
      // (150 - 100) / (200 - 100) * 100 = 50%
      const percentage = screen.getByText('50%');
      expect(percentage).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<ProgressBar value={50} variant="default" />);
      const progressbar = screen.getByRole('progressbar');
      const fillBar = progressbar.querySelector('.bg-primary');
      expect(fillBar).toBeInTheDocument();
    });

    it('renders success variant', () => {
      render(<ProgressBar value={100} variant="success" />);
      const progressbar = screen.getByRole('progressbar');
      const fillBar = progressbar.querySelector('.bg-success');
      expect(fillBar).toBeInTheDocument();
    });

    it('renders warning variant', () => {
      render(<ProgressBar value={75} variant="warning" />);
      const progressbar = screen.getByRole('progressbar');
      const fillBar = progressbar.querySelector('.bg-warning');
      expect(fillBar).toBeInTheDocument();
    });

    it('renders danger variant', () => {
      render(<ProgressBar value={25} variant="danger" />);
      const progressbar = screen.getByRole('progressbar');
      const fillBar = progressbar.querySelector('.bg-danger');
      expect(fillBar).toBeInTheDocument();
    });

    it('renders info variant', () => {
      render(<ProgressBar value={60} variant="info" />);
      const progressbar = screen.getByRole('progressbar');
      const fillBar = progressbar.querySelector('.bg-info');
      expect(fillBar).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<ProgressBar value={50} size="small" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('h-1');
    });

    it('renders medium size', () => {
      render(<ProgressBar value={50} size="md" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('h-2');
    });

    it('renders large size', () => {
      render(<ProgressBar value={50} size="large" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('h-3');
    });
  });

  describe('Indeterminate State', () => {
    it('renders indeterminate progress', () => {
      render(<ProgressBar indeterminate />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).not.toHaveAttribute('aria-valuenow');
      expect(progressbar).toHaveClass('animate-pulse');
    });

    it('ignores value when indeterminate', () => {
      render(<ProgressBar value={50} indeterminate showPercentage />);
      
      // Should not show percentage when indeterminate
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('shows loading label when indeterminate', () => {
      render(<ProgressBar indeterminate label="Loading..." />);
      const label = screen.getByText('Loading...');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('animates progress changes', async () => {
      const { rerender } = render(<ProgressBar value={0} animated />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
      
      rerender(<ProgressBar value={100} animated />);
      
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('respects animation duration', () => {
      render(<ProgressBar value={50} animated animationDuration={500} />);
      const fillBar = document.querySelector('[style*="transition"]');
      
      expect(fillBar).toBeInTheDocument();
      // Check that transition is applied
      const style = fillBar?.getAttribute('style');
      expect(style).toContain('transition');
    });

    it('disables animation when specified', () => {
      render(<ProgressBar value={50} animated={false} />);
      const fillBar = document.querySelector('[class*="transition-none"]');
      
      expect(fillBar).toBeInTheDocument();
    });
  });

  describe('Striped Pattern', () => {
    it('renders striped pattern', () => {
      render(<ProgressBar value={50} striped />);
      const progressbar = screen.getByRole('progressbar');
      const stripedBar = progressbar.querySelector('.bg-stripes');
      
      expect(stripedBar).toBeInTheDocument();
    });

    it('animates stripes', () => {
      render(<ProgressBar value={50} striped animated />);
      const progressbar = screen.getByRole('progressbar');
      const animatedStripes = progressbar.querySelector('.animate-stripes');
      
      expect(animatedStripes).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ProgressBar value={75} label="Download Progress" />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA attributes', () => {
      render(
        <ProgressBar 
          value={60} 
          min={0} 
          max={100}
          label="Processing"
        />
      );
      
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '60');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-label', 'Processing');
    });

    it('provides aria-valuetext for better screen reader support', () => {
      render(<ProgressBar value={75} ariaValueText="75 percent complete" />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuetext', '75 percent complete');
    });

    it('supports live region updates', () => {
      render(<ProgressBar value={50} ariaLive="polite" />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-live', 'polite');
    });

    it('respects reduced motion preferences', () => {
      render(<ProgressBar value={50} animated />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Value Boundaries', () => {
    it('clamps value to min', () => {
      render(<ProgressBar value={-10} min={0} max={100} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('clamps value to max', () => {
      render(<ProgressBar value={150} min={0} max={100} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });

    it('handles zero value', () => {
      render(<ProgressBar value={0} showPercentage />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% completion', () => {
      render(<ProgressBar value={100} showPercentage />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles floating point values', () => {
      render(<ProgressBar value={33.33} showPercentage />);
      
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    it('renders custom label function', () => {
      const customLabel = (value: number) => `${value} of 100 items`;
      render(
        <ProgressBar 
          value={75} 
          labelFunction={customLabel}
        />
      );
      
      expect(screen.getByText('75 of 100 items')).toBeInTheDocument();
    });

    it('renders with custom colors', () => {
      render(
        <ProgressBar 
          value={50} 
          className="custom-colors"
          barClassName="bg-custom-primary"
        />
      );
      
      const bar = document.querySelector('.bg-custom-primary');
      expect(bar).toBeInTheDocument();
    });

    it('renders multiple segments', () => {
      render(
        <ProgressBar 
          value={50}
          segments={[
            { value: 25, color: 'bg-success' },
            { value: 25, color: 'bg-warning' }
          ]}
        />
      );
      
      const successSegment = document.querySelector('.bg-success');
      const warningSegment = document.querySelector('.bg-warning');
      
      expect(successSegment).toBeInTheDocument();
      expect(warningSegment).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = vi.fn();

      const TestProgress = React.memo(function TestProgress({ value, ...props }: any) {
        renderSpy();
        return <ProgressBar value={value} {...props} />;
      });

      const { rerender } = render(<TestProgress value={50} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same value
      rerender(<TestProgress value={50} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different value
      rerender(<TestProgress value={75} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles rapid value updates', async () => {
      const { rerender } = render(<ProgressBar value={0} />);
      
      // Simulate rapid updates
      for (let i = 1; i <= 100; i++) {
        rerender(<ProgressBar value={i} />);
      }
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Dark Mode Support', () => {
    it('adapts to dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<ProgressBar value={50} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveClass('bg-fill');
      
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value', () => {
      render(<ProgressBar value={undefined as any} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles null value', () => {
      render(<ProgressBar value={null as any} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles NaN value', () => {
      render(<ProgressBar value={NaN} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles Infinity value', () => {
      render(<ProgressBar value={Infinity} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });

    it('handles negative percentage', () => {
      render(<ProgressBar value={-50} showPercentage />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with form submission progress', async () => {
      const ProgressForm = () => {
        const [progress, setProgress] = React.useState(0);
        
        const handleSubmit = async () => {
          for (let i = 0; i <= 100; i += 10) {
            setProgress(i);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        };
        
        return (
          <div>
            <ProgressBar value={progress} label="Uploading..." />
            <button onClick={handleSubmit}>Start Upload</button>
          </div>
        );
      };
      
      render(<ProgressForm />);
      
      const button = screen.getByRole('button');
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(progressbar).toHaveAttribute('aria-valuenow', '100');
      }, { timeout: 2000 });
    });

    it('works with stepped progress', () => {
      const steps = [
        { label: 'Step 1', value: 33 },
        { label: 'Step 2', value: 66 },
        { label: 'Step 3', value: 100 }
      ];
      
      const { rerender } = render(
        <ProgressBar value={steps[0].value} label={steps[0].label} />
      );
      
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      
      rerender(<ProgressBar value={steps[1].value} label={steps[1].label} />);
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      
      rerender(<ProgressBar value={steps[2].value} label={steps[2].label} />);
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });
  });
});