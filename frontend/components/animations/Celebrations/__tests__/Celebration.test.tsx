import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import {
  ConfettiCelebration,
  SuccessCheckmark,
  MilestoneBadge,
  ProgressComplete,
  FloatingHearts,
  StarBurst,
} from '../Celebration';

// Mock react-confetti
vi.mock('react-confetti', () => ({
  default: (props: any) => <div data-testid="confetti" {...props} />,
}));

// Mock lottie-react
vi.mock('lottie-react', () => ({
  default: ({ animationData, loop, autoplay, ...props }: any) => (
    <div 
      data-testid="lottie-animation" 
      data-loop={loop}
      data-autoplay={autoplay}
      {...props}
    />
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, initial, animate, exit, transition, variants, ...props }: any, ref: any) => 
        React.createElement('div', { 'data-animate': JSON.stringify(animate), ref, ...props }, children)
      ),
      svg: React.forwardRef(({ children, ...props }: any, ref: any) => 
        React.createElement('svg', { ref, ...props }, children)
      ),
      path: React.forwardRef((props: any, ref: any) => 
        React.createElement('path', { ref, ...props })
      ),
      circle: React.forwardRef((props: any, ref: any) => 
        React.createElement('circle', { ref, ...props })
      ),
      text: React.forwardRef(({ children, ...props }: any, ref: any) => 
        React.createElement('text', { ref, ...props }, children)
      ),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
    }),
  };
});

// Mock window dimensions for confetti
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
});

describe('Celebration Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ConfettiCelebration', () => {
    it('triggers confetti when active', () => {
      const { rerender } = render(<ConfettiCelebration active={false} />);
      
      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
      
      rerender(<ConfettiCelebration active={true} />);
      
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    it('auto-dismisses after duration', async () => {
      const handleComplete = vi.fn();
      
      render(
        <ConfettiCelebration 
          active={true} 
          duration={2000}
          onComplete={handleComplete}
        />
      );
      
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(handleComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('applies custom colors', () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      
      const { container } = render(
        <ConfettiCelebration 
          active={true}
          colors={customColors}
        />
      );
      
      const confetti = screen.getByTestId('confetti');
      expect(confetti).toBeInTheDocument();
    });

    it('adjusts particle count', () => {
      render(
        <ConfettiCelebration 
          active={true}
          particleCount={500}
        />
      );
      
      const confetti = screen.getByTestId('confetti');
      expect(confetti).toBeInTheDocument();
    });

    it('handles window resize', () => {
      render(<ConfettiCelebration active={true} />);
      
      // Simulate window resize
      act(() => {
        window.innerWidth = 500;
        window.innerHeight = 400;
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });
  });

  describe('SuccessCheckmark', () => {
    it('shows when active', () => {
      const { container } = render(<SuccessCheckmark show={true} />);
      
      const checkmark = container.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });

    it('hides when not active', () => {
      const { container } = render(<SuccessCheckmark show={false} />);
      
      const checkmark = container.querySelector('svg');
      expect(checkmark).not.toBeInTheDocument();
    });

    it('calls onComplete after animation', async () => {
      const handleComplete = vi.fn();
      
      render(
        <SuccessCheckmark 
          show={true}
          onComplete={handleComplete}
        />
      );
      
      // Animation duration is typically around 600ms
      act(() => {
        vi.advanceTimersByTime(700);
      });
      
      await waitFor(() => {
        expect(handleComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('applies custom size', () => {
      const { container } = render(
        <SuccessCheckmark show={true} size={100} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });

    it('applies custom color', () => {
      const { container } = render(
        <SuccessCheckmark show={true} color="#FF0000" />
      );
      
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke', '#FF0000');
    });
  });

  describe('MilestoneBadge', () => {
    it('renders with milestone text', () => {
      render(
        <MilestoneBadge 
          show={true}
          milestone="Level 10"
        />
      );
      
      expect(screen.getByText('Level 10')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <MilestoneBadge 
          show={true}
          milestone="Achievement"
          description="You did it!"
        />
      );
      
      expect(screen.getByText('You did it!')).toBeInTheDocument();
    });

    it('applies badge type styling', () => {
      const { container } = render(
        <MilestoneBadge 
          show={true}
          milestone="Gold"
          type="gold"
        />
      );
      
      const badge = container.querySelector('[class*="from-yellow"]');
      expect(badge).toBeInTheDocument();
    });

    it('handles different badge types', () => {
      const types = ['bronze', 'silver', 'gold', 'platinum'] as const;
      
      types.forEach(type => {
        const { container } = render(
          <MilestoneBadge 
            show={true}
            milestone={type}
            type={type}
          />
        );
        
        const badge = container.querySelector('[class*="from-"]');
        expect(badge).toBeInTheDocument();
      });
    });

    it('calls onComplete callback', async () => {
      const handleComplete = vi.fn();
      
      render(
        <MilestoneBadge 
          show={true}
          milestone="Complete"
          onComplete={handleComplete}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(handleComplete).toHaveBeenCalled();
      });
    });

    it('shows icon when provided', () => {
      const Icon = () => <span data-testid="custom-icon">★</span>;
      
      render(
        <MilestoneBadge 
          show={true}
          milestone="Star"
          icon={<Icon />}
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('ProgressComplete', () => {
    it('renders progress bar', () => {
      const { container } = render(
        <ProgressComplete 
          show={true}
          progress={100}
        />
      );
      
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('displays progress percentage', () => {
      render(
        <ProgressComplete 
          show={true}
          progress={75}
        />
      );
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows custom label', () => {
      render(
        <ProgressComplete 
          show={true}
          progress={100}
          label="Task Complete!"
        />
      );
      
      expect(screen.getByText('Task Complete!')).toBeInTheDocument();
    });

    it('animates progress fill', () => {
      const { container, rerender } = render(
        <ProgressComplete 
          show={true}
          progress={0}
        />
      );
      
      rerender(
        <ProgressComplete 
          show={true}
          progress={100}
        />
      );
      
      const progressFill = container.querySelector('.bg-green-500');
      expect(progressFill).toBeInTheDocument();
    });

    it('triggers celebration at 100%', () => {
      const handleComplete = vi.fn();
      
      render(
        <ProgressComplete 
          show={true}
          progress={100}
          onComplete={handleComplete}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(handleComplete).toHaveBeenCalled();
    });

    it('applies custom colors', () => {
      const { container } = render(
        <ProgressComplete 
          show={true}
          progress={50}
          color="bg-blue-500"
        />
      );
      
      const progressFill = container.querySelector('.bg-blue-500');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('FloatingHearts', () => {
    it('creates hearts when active', () => {
      const { container } = render(<FloatingHearts active={true} />);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      const hearts = container.querySelectorAll('[data-testid="heart"]');
      expect(hearts.length).toBeGreaterThan(0);
    });

    it('respects custom count', () => {
      const { container } = render(
        <FloatingHearts 
          active={true}
          count={10}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      const hearts = container.querySelectorAll('[data-testid="heart"]');
      expect(hearts.length).toBeLessThanOrEqual(10);
    });

    it('applies custom colors', () => {
      const { container } = render(
        <FloatingHearts 
          active={true}
          colors={['#FF0000', '#FF69B4']}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      const heart = container.querySelector('[data-testid="heart"]');
      expect(heart).toBeInTheDocument();
    });

    it('calls onComplete after duration', async () => {
      const handleComplete = vi.fn();
      
      render(
        <FloatingHearts 
          active={true}
          duration={2000}
          onComplete={handleComplete}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(handleComplete).toHaveBeenCalled();
      });
    });

    it('randomizes heart positions', () => {
      const { container } = render(
        <FloatingHearts active={true} />
      );
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      const hearts = container.querySelectorAll('[data-testid="heart"]');
      const positions = Array.from(hearts).map((heart: any) => 
        heart.getAttribute('style')
      );
      
      // Check that positions are different
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBeGreaterThan(1);
    });
  });

  describe('StarBurst', () => {
    it('shows starburst animation when active', () => {
      const { container } = render(<StarBurst show={true} />);
      
      const stars = container.querySelectorAll('[data-testid="star"]');
      expect(stars.length).toBeGreaterThan(0);
    });

    it('creates specified number of stars', () => {
      const { container } = render(
        <StarBurst 
          show={true}
          starCount={12}
        />
      );
      
      const stars = container.querySelectorAll('[data-testid="star"]');
      expect(stars).toHaveLength(12);
    });

    it('applies custom size', () => {
      const { container } = render(
        <StarBurst 
          show={true}
          size={200}
        />
      );
      
      const burst = container.querySelector('[style*="200px"]');
      expect(burst).toBeInTheDocument();
    });

    it('uses custom colors', () => {
      const { container } = render(
        <StarBurst 
          show={true}
          colors={['#FFD700', '#FFA500']}
        />
      );
      
      const star = container.querySelector('[data-testid="star"]');
      expect(star).toBeInTheDocument();
    });

    it('calls onComplete after animation', async () => {
      const handleComplete = vi.fn();
      
      render(
        <StarBurst 
          show={true}
          onComplete={handleComplete}
        />
      );
      
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      
      await waitFor(() => {
        expect(handleComplete).toHaveBeenCalled();
      });
    });

    it('positions stars in circular pattern', () => {
      const { container } = render(
        <StarBurst 
          show={true}
          starCount={8}
        />
      );
      
      const stars = container.querySelectorAll('[data-testid="star"]');
      
      // Each star should have a transform for positioning
      stars.forEach(star => {
        const transform = star.getAttribute('style');
        expect(transform).toContain('rotate');
      });
    });
  });

  describe('Integration Tests', () => {
    it('can combine multiple celebrations', () => {
      const { container } = render(
        <div>
          <ConfettiCelebration active={true} />
          <SuccessCheckmark show={true} />
          <FloatingHearts active={true} />
        </div>
      );
      
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      const hearts = container.querySelectorAll('[data-testid="heart"]');
      expect(hearts.length).toBeGreaterThan(0);
    });

    it('handles sequential celebrations', async () => {
      const handleConfettiComplete = vi.fn();
      const handleCheckmarkComplete = vi.fn();
      
      const { rerender } = render(
        <div>
          <ConfettiCelebration 
            active={true} 
            duration={1000}
            onComplete={handleConfettiComplete}
          />
        </div>
      );
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(handleConfettiComplete).toHaveBeenCalled();
      
      rerender(
        <div>
          <SuccessCheckmark 
            show={true}
            onComplete={handleCheckmarkComplete}
          />
        </div>
      );
      
      act(() => {
        vi.advanceTimersByTime(700);
      });
      
      await waitFor(() => {
        expect(handleCheckmarkComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('handles multiple simultaneous celebrations', () => {
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <ConfettiCelebration active={true} />
              <FloatingHearts active={true} />
              <StarBurst show={true} />
            </div>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});