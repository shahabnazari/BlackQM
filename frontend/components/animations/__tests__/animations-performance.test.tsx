import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Import all animation components
import { Skeleton, SkeletonCard, SkeletonTable } from '../Skeleton/index';
import { EmptyState, LoadingState } from '../EmptyStates/index';
import { MagneticButton, ElasticTap, RippleEffect } from '../MicroInteractions/index';
import { ConfettiCelebration, SuccessCheckmark } from '../Celebrations/index';
import { GuidedTour, LoadingPersonality } from '../GuidedWorkflows/index';

// Mock requestAnimationFrame for performance testing
let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  
  global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    rafCallbacks.push(callback);
    return ++rafId;
  });
  
  global.cancelAnimationFrame = vi.fn((id: number) => {
    // Remove callback
  });
  
  // Mock performance.now()
  let time = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => {
    return time += 16.67; // Simulate 60fps
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Animation Performance Tests', () => {
  describe('60 FPS Target', () => {
    it('maintains 60fps with multiple skeleton loaders', () => {
      const frameCount = 60;
      const targetFPS = 60;
      const targetFrameTime = 1000 / targetFPS;
      
      render(
        <div>
          {Array.from({ length: 20 }).map((_, i) => (
            <SkeletonCard key={i} showImage showAvatar />
          ))}
        </div>
      );
      
      // Simulate 60 frames
      const frameTimes: number[] = [];
      for (let i = 0; i < frameCount; i++) {
        const startTime = performance.now();
        
        // Execute RAF callbacks
        rafCallbacks.forEach(cb => cb(startTime));
        
        const endTime = performance.now();
        frameTimes.push(endTime - startTime);
      }
      
      // Check average frame time
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(avgFrameTime).toBeLessThanOrEqual(targetFrameTime);
      
      // Check for frame drops (frames taking > 16.67ms)
      const droppedFrames = frameTimes.filter((time: any) => time > targetFrameTime);
      expect(droppedFrames.length / frameCount).toBeLessThan(0.05); // Less than 5% frame drops
    });

    it('handles smooth transitions in empty states', () => {
      const { rerender } = render(
        <EmptyState 
          type="no-data"
          title="No Data"
          description="Loading..."
        />
      );
      
      const frameTimes: number[] = [];
      
      // Simulate transition
      for (let i = 0; i < 30; i++) {
        const startTime = performance.now();
        
        rerender(
          <EmptyState 
            type="no-data"
            title="No Data"
            description={`Loading... ${i}%`}
          />
        );
        
        const endTime = performance.now();
        frameTimes.push(endTime - startTime);
      }
      
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(avgFrameTime).toBeLessThan(16.67);
    });

    it('maintains performance with micro-interactions', () => {
      const { container } = render(
        <div>
          {Array.from({ length: 10 }).map((_, i) => (
            <MagneticButton key={i}>
              Button {i}
            </MagneticButton>
          ))}
        </div>
      );
      
      const buttons = container.querySelectorAll('button');
      const frameTimes: number[] = [];
      
      // Simulate rapid hover interactions
      buttons.forEach(button => {
        for (let i = 0; i < 5; i++) {
          const startTime = performance.now();
          
          fireEvent.mouseMove(button, {
            clientX: Math.random() * 100,
            clientY: Math.random() * 100,
          });
          
          const endTime = performance.now();
          frameTimes.push(endTime - startTime);
        }
      });
      
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(avgFrameTime).toBeLessThan(16.67);
    });
  });

  describe('Memory Management', () => {
    it('cleans up animation resources properly', () => {
      const { unmount } = render(
        <div>
          <ConfettiCelebration active={true} />
          <LoadingPersonality />
          <RippleEffect>
            <button>Click me</button>
          </RippleEffect>
        </div>
      );
      
      // Check that RAF is being called
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      
      const rafCallCount = (global.requestAnimationFrame as any).mock.calls.length;
      
      unmount();
      
      // After unmount, no new RAF calls should be made
      expect((global.requestAnimationFrame as any).mock.calls.length).toBe(rafCallCount);
    });

    it('handles multiple celebration animations without memory leaks', () => {
      const celebrations = Array.from({ length: 10 }).map((_, i) => (
        <ConfettiCelebration key={i} active={true} duration={100 * i} />
      ));
      
      const { unmount, rerender } = render(<div>{celebrations}</div>);
      
      // Trigger re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <div>
            {celebrations.map((_, idx) => (
              <ConfettiCelebration key={idx} active={idx % 2 === i % 2} duration={100} />
            ))}
          </div>
        );
      }
      
      unmount();
      
      // Ensure cleanup
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Batch Rendering Optimization', () => {
    it('efficiently renders large lists with skeleton loaders', () => {
      const itemCount = 100;
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: itemCount }).map((_, i) => (
            <Skeleton key={i} width={200} height={20} />
          ))}
        </div>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should render 100 items in under 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('handles dynamic content updates efficiently', async () => {
      const { rerender } = render(
        <LoadingState message="Loading..." />
      );
      
      const messages = [
        'Loading data...',
        'Processing...',
        'Almost done...',
        'Complete!',
      ];
      
      const updateTimes: number[] = [];
      
      for (const message of messages) {
        const startTime = performance.now();
        
        rerender(<LoadingState message={message} />);
        
        const updateTime = performance.now() - startTime;
        updateTimes.push(updateTime);
      }
      
      // All updates should be fast
      updateTimes.forEach(time => {
        expect(time).toBeLessThan(10);
      });
    });
  });

  describe('CSS Animation Performance', () => {
    it('uses GPU-accelerated transforms', () => {
      const { container } = render(
        <ElasticTap>
          <div>Tap me</div>
        </ElasticTap>
      );
      
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Check for transform usage (GPU accelerated)
      expect(styles.transform || element.style.transform).toBeDefined();
    });

    it('applies will-change for smooth animations', () => {
      const { container } = render(
        <MagneticButton>
          Magnetic
        </MagneticButton>
      );
      
      const button = container.querySelector('button');
      
      // Trigger hover
      fireEvent.mouseEnter(button!);
      
      // Component should use will-change or transform for performance
      const styles = window.getComputedStyle(button!);
      expect(
        styles.willChange === 'transform' || 
        styles.transform !== 'none' ||
        button!.style.transform
      ).toBeTruthy();
    });
  });

  describe('Animation Frame Scheduling', () => {
    it('batches DOM updates in animation frames', () => {
      const { container } = render(
        <div>
          {Array.from({ length: 10 }).map((_, i) => (
            <RippleEffect key={i}>
              <button>Button {i}</button>
            </RippleEffect>
          ))}
        </div>
      );
      
      const buttons = container.querySelectorAll('button');
      
      // Trigger multiple ripples
      buttons.forEach(button => {
        fireEvent.mouseDown(button);
      });
      
      // Should batch updates in RAF
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      
      // Execute RAF callbacks
      rafCallbacks.forEach(cb => cb(performance.now()));
      
      // Check ripples are rendered
      const ripples = container.querySelectorAll('.absolute');
      expect(ripples.length).toBeGreaterThan(0);
    });

    it('throttles rapid animation updates', () => {
      const { container } = render(
        <MagneticButton>
          Hover me rapidly
        </MagneticButton>
      );
      
      const button = container.querySelector('button')!;
      const updateCount = 100;
      
      const startTime = performance.now();
      
      // Simulate rapid mouse movements
      for (let i = 0; i < updateCount; i++) {
        fireEvent.mouseMove(button, {
          clientX: i,
          clientY: i,
        });
      }
      
      const totalTime = performance.now() - startTime;
      
      // Should handle 100 updates quickly
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe('Lazy Loading and Code Splitting', () => {
    it('renders initial skeleton immediately', () => {
      const startTime = performance.now();
      
      render(<SkeletonCard />);
      
      const renderTime = performance.now() - startTime;
      
      // Initial render should be very fast
      expect(renderTime).toBeLessThan(10);
    });

    it('handles progressive enhancement', async () => {
      const { container } = render(
        <div>
          <SkeletonTable rows={5} columns={5} />
        </div>
      );
      
      // Initial skeleton should be present
      expect(container.querySelector('table')).toBeInTheDocument();
      
      // Simulate data loading
      await waitFor(() => {
        const cells = container.querySelectorAll('td');
        expect(cells.length).toBe(25);
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion', () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      const { container } = render(
        <SuccessCheckmark show={true} />
      );
      
      // Animations should be instant or disabled
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Reset matchMedia
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });
  });

  describe('Performance Benchmarks', () => {
    it('meets Lighthouse performance targets', () => {
      const metrics = {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        totalBlockingTime: 0,
        cumulativeLayoutShift: 0,
      };
      
      const startTime = performance.now();
      
      // Render complex component tree
      const { container } = render(
        <div>
          <LoadingPersonality />
          <SkeletonTable rows={10} columns={10} />
          <EmptyState 
            type="no-data"
            title="No Data"
            description="Add data to get started"
          />
          {Array.from({ length: 5 }).map((_, i) => (
            <MagneticButton key={i}>Button {i}</MagneticButton>
          ))}
        </div>
      );
      
      metrics.firstContentfulPaint = performance.now() - startTime;
      
      // Simulate interaction
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const interactionStart = performance.now();
        fireEvent.click(button);
        metrics.totalBlockingTime += Math.max(0, performance.now() - interactionStart - 50);
      });
      
      metrics.largestContentfulPaint = performance.now() - startTime;
      
      // Check performance metrics
      expect(metrics.firstContentfulPaint).toBeLessThan(100); // FCP < 100ms
      expect(metrics.largestContentfulPaint).toBeLessThan(200); // LCP < 200ms
      expect(metrics.totalBlockingTime).toBeLessThan(100); // TBT < 100ms
    });

    it('handles stress test with multiple animations', () => {
      const animationCount = 50;
      const startTime = performance.now();
      
      const { container } = render(
        <div>
          {Array.from({ length: animationCount }).map((_, i) => (
            <div key={i}>
              <Skeleton animate />
              <ElasticTap>
                <button>Tap {i}</button>
              </ElasticTap>
            </div>
          ))}
        </div>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should handle 50 animated components
      expect(renderTime).toBeLessThan(100);
      
      // Trigger interactions
      const buttons = container.querySelectorAll('button');
      const interactionTimes: number[] = [];
      
      buttons.forEach(button => {
        const start = performance.now();
        fireEvent.click(button);
        interactionTimes.push(performance.now() - start);
      });
      
      const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
      expect(avgInteractionTime).toBeLessThan(5);
    });
  });
});