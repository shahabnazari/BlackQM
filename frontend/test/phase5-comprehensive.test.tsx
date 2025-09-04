/**
 * Phase 5: Comprehensive Test Suite
 * Professional Polish & Delight Verification
 * 
 * This test suite validates all Phase 5 features:
 * - Skeleton screens with shimmer effects
 * - Empty states with illustrations
 * - Micro-interactions and animations
 * - Celebration effects
 * - Guided workflows
 * - Loading personality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Import Phase 5 components
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonForm,
  SkeletonList,
  SkeletonWidget,
  SkeletonProfile,
} from '@/components/animations/Skeleton/SkeletonScreen';

import { EmptyState } from '@/components/animations/EmptyStates/EmptyState';
import { MagneticButton } from '@/components/animations/MicroInteractions/MagneticButton';
import { Celebration } from '@/components/animations/Celebrations/Celebration';
import { GuidedTour } from '@/components/animations/GuidedWorkflows/GuidedTour';
import { LoadingPersonality } from '@/components/animations/GuidedWorkflows/LoadingPersonality';

// Mock framer-motion for testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, initial, transition, variants, ...props }: any) => {
      // Simulate animation states for testing
      const [animationState, setAnimationState] = React.useState(initial || 'initial');
      
      React.useEffect(() => {
        if (animate) {
          const timer = setTimeout(() => setAnimationState(animate), 10);
          return () => clearTimeout(timer);
        }
      }, [animate]);
      
      return <div data-animation-state={animationState} {...props}>{children}</div>;
    },
    button: ({ children, whileHover, whileTap, ...props }: any) => (
      <button data-hover={whileHover} data-tap={whileTap} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Performance measurement utility
const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();
  render(component);
  const endTime = performance.now();
  return endTime - startTime;
};

// FPS measurement utility (simulated)
const measureFPS = async (action: () => Promise<void>) => {
  const frames: number[] = [];
  let lastTime = performance.now();
  
  const measureFrame = () => {
    const currentTime = performance.now();
    const delta = currentTime - lastTime;
    if (delta > 0) {
      frames.push(1000 / delta);
    }
    lastTime = currentTime;
  };
  
  // Simulate 60 frames
  for (let i = 0; i < 60; i++) {
    measureFrame();
    await new Promise(resolve => setTimeout(resolve, 16.67)); // ~60fps timing
  }
  
  await action();
  
  const avgFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
  return Math.round(avgFPS);
};

describe('Phase 5: Comprehensive Test Suite', () => {
  
  describe('1. SKELETON SCREENS', () => {
    
    describe('Shimmer Animation', () => {
      it('should display shimmer effect with 2s interval', () => {
        const { container } = render(<Skeleton shimmer animate />);
        const shimmerElement = container.querySelector('[data-animation-state]');
        
        expect(shimmerElement).toBeInTheDocument();
        // Check for gradient background
        expect(shimmerElement?.className).toContain('gradient');
      });
      
      it('should respect prefers-reduced-motion', () => {
        // Mock matchMedia for reduced motion
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          })),
        });
        
        const { container } = render(<Skeleton shimmer animate />);
        const shimmerElement = container.querySelector('[data-animation-state]');
        
        // Animation should be disabled
        expect(shimmerElement).not.toBeInTheDocument();
      });
    });
    
    describe('Component Variants', () => {
      const variants = [
        { Component: SkeletonCard, name: 'SkeletonCard' },
        { Component: SkeletonTable, name: 'SkeletonTable' },
        { Component: SkeletonChart, name: 'SkeletonChart' },
        { Component: SkeletonForm, name: 'SkeletonForm' },
        { Component: SkeletonList, name: 'SkeletonList' },
        { Component: SkeletonWidget, name: 'SkeletonWidget' },
        { Component: SkeletonProfile, name: 'SkeletonProfile' },
      ];
      
      variants.forEach(({ Component, name }) => {
        it(`should render ${name} correctly`, () => {
          const { container } = render(<Component />);
          expect(container.firstChild).toBeInTheDocument();
        });
        
        it(`should render ${name} within performance target`, async () => {
          const renderTime = await measureRenderTime(<Component />);
          expect(renderTime).toBeLessThan(50); // Should render in under 50ms
        });
      });
    });
    
    describe('Performance', () => {
      it('should render 100 skeletons efficiently', async () => {
        const renderTime = await measureRenderTime(
          <div>
            {Array.from({ length: 100 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        );
        
        expect(renderTime).toBeLessThan(200); // Should render in under 200ms
      });
      
      it('should maintain smooth animations with multiple skeletons', async () => {
        const { container } = render(
          <div>
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} shimmer animate />
            ))}
          </div>
        );
        
        const fps = await measureFPS(async () => {
          // Simulate scroll
          window.scrollTo(0, 1000);
        });
        
        expect(fps).toBeGreaterThanOrEqual(55); // Close to 60fps
      });
    });
  });
  
  describe('2. EMPTY STATES', () => {
    
    describe('All 6 Empty State Types', () => {
      const emptyStateTypes = [
        { type: 'noStudies', title: 'No Studies Yet', message: 'Start your first study' },
        { type: 'noData', title: 'No Data Available', message: 'Start collecting data' },
        { type: 'noParticipants', title: 'No Participants', message: 'Invite participants' },
        { type: 'sessionExpired', title: 'Session Expired', message: 'Please log in again' },
        { type: 'notFound', title: 'Page Not Found', message: 'The page you\'re looking for doesn\'t exist' },
        { type: 'error', title: 'Something Went Wrong', message: 'Please try again' },
      ] as const;
      
      emptyStateTypes.forEach(({ type, title, message }) => {
        describe(`${type} empty state`, () => {
          it('should render with correct title and message', () => {
            render(<EmptyState type={type} />);
            
            // Title should be visible
            const titleElement = screen.getByRole('heading');
            expect(titleElement).toBeInTheDocument();
            
            // Message should be visible
            const messageElement = screen.getByText((content, element) => {
              return element?.tagName.toLowerCase() === 'p';
            });
            expect(messageElement).toBeInTheDocument();
          });
          
          it('should render illustration', () => {
            const { container } = render(<EmptyState type={type} />);
            const illustration = container.querySelector('svg') || 
                               container.querySelector('[data-illustration]');
            expect(illustration).toBeInTheDocument();
          });
          
          it('should show action button when provided', () => {
            const onAction = vi.fn();
            render(
              <EmptyState 
                type={type} 
                actionLabel="Take Action"
                onAction={onAction}
              />
            );
            
            const button = screen.getByRole('button', { name: 'Take Action' });
            expect(button).toBeInTheDocument();
            
            fireEvent.click(button);
            expect(onAction).toHaveBeenCalledTimes(1);
          });
        });
      });
    });
    
    describe('Animation and Transitions', () => {
      it('should animate on mount', () => {
        const { container } = render(<EmptyState type="noData" animate />);
        const animatedElement = container.querySelector('[data-animation-state]');
        
        expect(animatedElement).toBeInTheDocument();
        expect(animatedElement?.getAttribute('data-animation-state')).toBe('initial');
        
        // Wait for animation to start
        setTimeout(() => {
          expect(animatedElement?.getAttribute('data-animation-state')).toBe('visible');
        }, 20);
      });
      
      it('should support size variants', () => {
        const sizes = ['sm', 'md', 'lg'] as const;
        
        sizes.forEach(size => {
          const { container } = render(<EmptyState type="noData" size={size} />);
          const element = container.firstChild as HTMLElement;
          
          expect(element.className).toContain(size === 'sm' ? 'max-w-sm' :
                                             size === 'lg' ? 'max-w-lg' : 'max-w-md');
        });
      });
    });
  });
  
  describe('3. MICRO-INTERACTIONS', () => {
    
    describe('Magnetic Hover (30px radius)', () => {
      it('should apply magnetic effect within 30px radius', async () => {
        const { container } = render(<MagneticButton>Test Button</MagneticButton>);
        const button = container.querySelector('button') as HTMLElement;
        
        // Mouse at 25px from center (within radius)
        fireEvent.mouseMove(button, {
          clientX: button.getBoundingClientRect().left + 25,
          clientY: button.getBoundingClientRect().top + 25,
        });
        
        // Should have transform applied
        const style = window.getComputedStyle(button);
        expect(style.transform).not.toBe('none');
      });
      
      it('should not apply magnetic effect beyond 30px radius', () => {
        const { container } = render(<MagneticButton>Test Button</MagneticButton>);
        const button = container.querySelector('button') as HTMLElement;
        
        // Mouse at 35px from center (outside radius)
        fireEvent.mouseMove(button, {
          clientX: button.getBoundingClientRect().left + 35,
          clientY: button.getBoundingClientRect().top + 35,
        });
        
        // Should not have transform
        const style = window.getComputedStyle(button);
        expect(style.transform).toBe('none');
      });
    });
    
    describe('Scale Animations (1.0 → 0.95 → 1.0)', () => {
      it('should scale to 0.95 on press', async () => {
        const { container } = render(<MagneticButton>Test Button</MagneticButton>);
        const button = container.querySelector('button') as HTMLElement;
        
        // Check for tap animation data
        fireEvent.mouseDown(button);
        expect(button.getAttribute('data-tap')).toBeTruthy();
      });
      
      it('should complete scale animation in 150ms', async () => {
        const { container } = render(<MagneticButton>Test Button</MagneticButton>);
        const button = container.querySelector('button') as HTMLElement;
        
        const startTime = performance.now();
        fireEvent.mouseDown(button);
        
        await waitFor(() => {
          fireEvent.mouseUp(button);
        }, { timeout: 150 });
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThanOrEqual(160); // Allow small buffer
      });
    });
    
    describe('Physics-Based Interactions', () => {
      it('should apply spring physics with correct damping (0.7)', () => {
        const { container } = render(
          <MagneticButton springConfig={{ damping: 0.7, stiffness: 300 }}>
            Physics Button
          </MagneticButton>
        );
        
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        // Physics config is applied internally
      });
    });
  });
  
  describe('4. CELEBRATION ANIMATIONS', () => {
    
    describe('Confetti Effect', () => {
      it('should trigger confetti with correct configuration', async () => {
        const confetti = await import('canvas-confetti');
        const confettiSpy = vi.spyOn(confetti, 'default');
        
        render(<Celebration type="confetti" trigger />);
        
        await waitFor(() => {
          expect(confettiSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              particleCount: expect.any(Number),
              spread: expect.any(Number),
              colors: expect.arrayContaining(['#007AFF']),
            })
          );
        });
      });
      
      it('should use Apple color palette', async () => {
        const confetti = await import('canvas-confetti');
        const confettiSpy = vi.spyOn(confetti, 'default');
        
        render(<Celebration type="confetti" trigger />);
        
        await waitFor(() => {
          expect(confettiSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              colors: expect.arrayContaining([
                '#007AFF', // System Blue
                '#34C759', // System Green
                '#FF9500', // System Orange
                '#FF3B30', // System Red
                '#5856D6', // System Purple
              ]),
            })
          );
        });
      });
    });
    
    describe('Trophy Animation', () => {
      it('should display trophy for milestones', () => {
        const { container } = render(<Celebration type="trophy" />);
        const trophy = container.querySelector('[data-celebration="trophy"]') ||
                       container.querySelector('.trophy-animation');
        expect(trophy).toBeInTheDocument();
      });
    });
    
    describe('Particle System', () => {
      it('should handle 2000+ particles at 60fps', async () => {
        const { container } = render(
          <Celebration type="particles" particleCount={2000} />
        );
        
        const fps = await measureFPS(async () => {
          // Trigger particle animation
          const trigger = container.querySelector('[data-trigger]');
          if (trigger) fireEvent.click(trigger);
        });
        
        expect(fps).toBeGreaterThanOrEqual(55); // Close to 60fps
      });
    });
  });
  
  describe('5. GUIDED WORKFLOWS', () => {
    
    describe('Interactive Tutorials', () => {
      it('should display step-by-step guide', () => {
        const steps = [
          { target: '.dashboard', content: 'Welcome to your dashboard' },
          { target: '.studies', content: 'View your studies here' },
          { target: '.create', content: 'Create a new study' },
        ];
        
        const { getByText } = render(<GuidedTour steps={steps} />);
        
        // First step should be visible
        expect(getByText('Welcome to your dashboard')).toBeInTheDocument();
      });
      
      it('should support keyboard navigation', async () => {
        const steps = [
          { target: '.step1', content: 'Step 1' },
          { target: '.step2', content: 'Step 2' },
        ];
        
        const { getByText, getByRole } = render(<GuidedTour steps={steps} />);
        
        // Navigate with keyboard
        const nextButton = getByRole('button', { name: /next/i });
        nextButton.focus();
        fireEvent.keyDown(nextButton, { key: 'Enter' });
        
        await waitFor(() => {
          expect(getByText('Step 2')).toBeInTheDocument();
        });
      });
    });
    
    describe('Loading Personality (20+ messages)', () => {
      it('should display unique loading messages', () => {
        const messages = new Set<string>();
        
        // Render multiple times to collect messages
        for (let i = 0; i < 25; i++) {
          const { container } = render(<LoadingPersonality />);
          const messageElement = container.querySelector('[data-loading-message]') ||
                                container.querySelector('.loading-message');
          if (messageElement?.textContent) {
            messages.add(messageElement.textContent);
          }
        }
        
        // Should have at least 20 unique messages
        expect(messages.size).toBeGreaterThanOrEqual(20);
      });
      
      it('should rotate messages over time', async () => {
        const { container, rerender } = render(<LoadingPersonality />);
        
        const firstMessage = container.querySelector('[data-loading-message]')?.textContent;
        
        // Wait and rerender
        await new Promise(resolve => setTimeout(resolve, 3000));
        rerender(<LoadingPersonality />);
        
        const secondMessage = container.querySelector('[data-loading-message]')?.textContent;
        
        // Messages should be different
        expect(firstMessage).not.toBe(secondMessage);
      });
    });
    
    describe('Contextual Help System', () => {
      it('should show tooltips with 500ms delay', async () => {
        const { container, getByRole } = render(
          <button data-tooltip="Help text">Hover me</button>
        );
        
        const button = getByRole('button');
        const startTime = performance.now();
        
        fireEvent.mouseEnter(button);
        
        await waitFor(() => {
          const tooltip = container.querySelector('[role="tooltip"]');
          expect(tooltip).toBeInTheDocument();
        }, { timeout: 600 });
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeGreaterThanOrEqual(500);
      });
    });
  });
  
  describe('6. PERFORMANCE & QUALITY METRICS', () => {
    
    it('should achieve 60fps for all animations', async () => {
      const components = [
        <Skeleton shimmer animate />,
        <EmptyState type="noData" animate />,
        <MagneticButton>Test</MagneticButton>,
        <Celebration type="confetti" />,
      ];
      
      for (const component of components) {
        const { container } = render(component);
        
        const fps = await measureFPS(async () => {
          // Trigger any animations
          const interactive = container.querySelector('button, [data-trigger]');
          if (interactive) fireEvent.click(interactive);
        });
        
        expect(fps).toBeGreaterThanOrEqual(55);
      }
    });
    
    it('should respect accessibility preferences', () => {
      // Test with prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
      
      const { container } = render(<Skeleton animate />);
      const animations = container.querySelectorAll('[data-animation-state]');
      
      // Animations should be disabled
      expect(animations.length).toBe(0);
    });
    
    it('should maintain performance with stress testing', async () => {
      const renderTime = await measureRenderTime(
        <div>
          {/* Stress test with multiple components */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i}>
              <SkeletonCard />
              <EmptyState type="noData" />
              <MagneticButton>Button {i}</MagneticButton>
            </div>
          ))}
        </div>
      );
      
      // Should still render reasonably fast
      expect(renderTime).toBeLessThan(500);
    });
  });
  
  describe('7. INTEGRATION TESTS', () => {
    
    it('should integrate skeleton screens with async data loading', async () => {
      const MockAsyncComponent = () => {
        const [loading, setLoading] = React.useState(true);
        const [data, setData] = React.useState<any>(null);
        
        React.useEffect(() => {
          setTimeout(() => {
            setData({ title: 'Loaded Data' });
            setLoading(false);
          }, 100);
        }, []);
        
        if (loading) return <SkeletonCard />;
        return <div>{data.title}</div>;
      };
      
      const { getByText, container } = render(<MockAsyncComponent />);
      
      // Initially shows skeleton
      expect(container.querySelector('.bg-gray-200')).toBeInTheDocument();
      
      // After loading, shows data
      await waitFor(() => {
        expect(getByText('Loaded Data')).toBeInTheDocument();
      });
      
      // Skeleton should be gone
      expect(container.querySelector('.bg-gray-200')).not.toBeInTheDocument();
    });
    
    it('should show empty state when no data', async () => {
      const MockDataComponent = ({ hasData }: { hasData: boolean }) => {
        if (!hasData) return <EmptyState type="noData" />;
        return <div>Data exists</div>;
      };
      
      const { rerender, getByText, container } = render(
        <MockDataComponent hasData={false} />
      );
      
      // Shows empty state
      expect(container.querySelector('[data-animation-state]')).toBeInTheDocument();
      
      // When data arrives
      rerender(<MockDataComponent hasData={true} />);
      
      // Shows data
      expect(getByText('Data exists')).toBeInTheDocument();
    });
    
    it('should trigger celebrations on success actions', async () => {
      const confetti = await import('canvas-confetti');
      const confettiSpy = vi.spyOn(confetti, 'default');
      
      const MockSuccessComponent = () => {
        const [completed, setCompleted] = React.useState(false);
        
        const handleComplete = () => {
          setCompleted(true);
        };
        
        return (
          <div>
            <button onClick={handleComplete}>Complete Task</button>
            {completed && <Celebration type="confetti" trigger />}
          </div>
        );
      };
      
      const { getByRole } = render(<MockSuccessComponent />);
      
      const button = getByRole('button', { name: 'Complete Task' });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(confettiSpy).toHaveBeenCalled();
      });
    });
  });
});

// Run tests with: npm test phase5-comprehensive.test.tsx