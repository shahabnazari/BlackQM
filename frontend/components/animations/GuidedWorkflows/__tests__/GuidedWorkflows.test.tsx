import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import {
  GuidedTour,
  createTourStep,
  researcherOnboardingSteps,
  FeatureSpotlight,
  InteractiveHint,
  StepProgress,
  LoadingPersonality,
  PersonalitySkeletonLoader,
  TypingIndicator,
  useLoadingState,
  SmartTooltip,
} from '../index';
import { renderHook } from '@testing-library/react';

// Mock react-joyride
vi.mock('react-joyride', () => ({
  default: ({ steps, run, callback, continuous, showProgress, showSkipButton, styles }: any) => (
    <div data-testid="joyride-tour">
      {run && steps.map((step: any, index: number) => (
        <div key={index} data-testid={`tour-step-${index}`}>
          <h3>{step.title}</h3>
          <p>{step.content}</p>
          {step.target && <span>{step.target}</span>}
        </div>
      ))}
      <button onClick={() => callback({ action: 'close' })}>Close Tour</button>
    </div>
  ),
  ACTIONS: {
    CLOSE: 'close',
    NEXT: 'next',
    PREV: 'prev',
    SKIP: 'skip',
    START: 'start',
    STOP: 'stop',
  },
  EVENTS: {
    TOUR_END: 'tour:end',
    STEP_AFTER: 'step:after',
    TARGET_NOT_FOUND: 'target:not_found',
  },
  STATUS: {
    READY: 'ready',
    RUNNING: 'running',
    FINISHED: 'finished',
    SKIPPED: 'skipped',
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }: any) => (
      <div data-animate={JSON.stringify(animate)} {...props}>
        {children}
      </div>
    ),
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('GuidedWorkflows Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GuidedTour Component', () => {
    const mockSteps = [
      {
        target: '.step-1',
        content: 'This is step 1',
        title: 'Welcome',
      },
      {
        target: '.step-2',
        content: 'This is step 2',
        title: 'Features',
      },
    ];

    it('renders tour when running', () => {
      render(
        <GuidedTour 
          steps={mockSteps}
          run={true}
        />
      );
      
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('This is step 1')).toBeInTheDocument();
    });

    it('does not render when not running', () => {
      render(
        <GuidedTour 
          steps={mockSteps}
          run={false}
        />
      );
      
      const steps = screen.queryAllByTestId(/tour-step/);
      expect(steps).toHaveLength(0);
    });

    it('calls onComplete when tour ends', () => {
      const handleComplete = vi.fn();
      
      render(
        <GuidedTour 
          steps={mockSteps}
          run={true}
          onComplete={handleComplete}
        />
      );
      
      const closeButton = screen.getByText('Close Tour');
      fireEvent.click(closeButton);
      
      expect(handleComplete).toHaveBeenCalledWith('close');
    });

    it('renders all steps', () => {
      render(
        <GuidedTour 
          steps={mockSteps}
          run={true}
        />
      );
      
      expect(screen.getByTestId('tour-step-0')).toBeInTheDocument();
      expect(screen.getByTestId('tour-step-1')).toBeInTheDocument();
    });

    it('applies continuous mode', () => {
      render(
        <GuidedTour 
          steps={mockSteps}
          run={true}
          continuous={true}
        />
      );
      
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });
  });

  describe('createTourStep Helper', () => {
    it('creates a valid tour step', () => {
      const step = createTourStep({
        target: '.my-element',
        title: 'Test Title',
        content: 'Test Content',
        placement: 'bottom',
      });
      
      expect(step).toEqual({
        target: '.my-element',
        title: 'Test Title',
        content: 'Test Content',
        placement: 'bottom',
        disableBeacon: true,
      });
    });

    it('includes optional properties', () => {
      const step = createTourStep({
        target: '.element',
        title: 'Title',
        content: 'Content',
        spotlightClicks: true,
        styles: { backgroundColor: 'blue' },
      });
      
      expect(step.spotlightClicks).toBe(true);
      expect(step.styles).toEqual({ backgroundColor: 'blue' });
    });
  });

  describe('researcherOnboardingSteps', () => {
    it('contains all required onboarding steps', () => {
      expect(researcherOnboardingSteps).toHaveLength(7);
      
      const targets = researcherOnboardingSteps.map(step => step.target);
      expect(targets).toContain('[data-tour="create-study"]');
      expect(targets).toContain('[data-tour="study-list"]');
      expect(targets).toContain('[data-tour="study-settings"]');
      expect(targets).toContain('[data-tour="add-statements"]');
      expect(targets).toContain('[data-tour="share-link"]');
      expect(targets).toContain('[data-tour="view-results"]');
      expect(targets).toContain('[data-tour="export-data"]');
    });

    it('has proper titles and content', () => {
      const firstStep = researcherOnboardingSteps[0];
      expect(firstStep.title).toBe('Welcome to Q-Method Research Platform');
      expect(firstStep.content).toContain('create your first study');
    });
  });

  describe('FeatureSpotlight Component', () => {
    it('renders spotlight when active', () => {
      render(
        <FeatureSpotlight 
          active={true}
          targetRef={{ current: document.createElement('div') }}
        >
          <button>Featured Button</button>
        </FeatureSpotlight>
      );
      
      expect(screen.getByText('Featured Button')).toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
      render(
        <FeatureSpotlight 
          active={true}
          targetRef={{ current: document.createElement('div') }}
          tooltip="This is a new feature!"
        >
          <button>Hover Me</button>
        </FeatureSpotlight>
      );
      
      const button = screen.getByText('Hover Me');
      fireEvent.mouseEnter(button.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText('This is a new feature!')).toBeInTheDocument();
      });
    });

    it('pulses when enabled', () => {
      const { container } = render(
        <FeatureSpotlight 
          active={true}
          targetRef={{ current: document.createElement('div') }}
          pulse={true}
        >
          <button>Pulsing Feature</button>
        </FeatureSpotlight>
      );
      
      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });

    it('calls onClick handler', () => {
      const handleClick = vi.fn();
      
      render(
        <FeatureSpotlight 
          active={true}
          targetRef={{ current: document.createElement('div') }}
          onClick={handleClick}
        >
          <button>Click Me</button>
        </FeatureSpotlight>
      );
      
      fireEvent.click(screen.getByText('Click Me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('InteractiveHint Component', () => {
    it('shows hint when visible', () => {
      render(
        <InteractiveHint 
          show={true}
          message="Click here to continue"
        />
      );
      
      expect(screen.getByText('Click here to continue')).toBeInTheDocument();
    });

    it('hides hint when not visible', () => {
      render(
        <InteractiveHint 
          show={false}
          message="Hidden hint"
        />
      );
      
      expect(screen.queryByText('Hidden hint')).not.toBeInTheDocument();
    });

    it('positions correctly', () => {
      const positions = ['top', 'bottom', 'left', 'right'] as const;
      
      positions.forEach(position => {
        const { container } = render(
          <InteractiveHint 
            show={true}
            message="Hint"
            position={position}
          />
        );
        
        const hint = container.querySelector('[class*="absolute"]');
        expect(hint).toBeInTheDocument();
      });
    });

    it('can be dismissed', () => {
      const handleDismiss = vi.fn();
      
      render(
        <InteractiveHint 
          show={true}
          message="Dismissible hint"
          onDismiss={handleDismiss}
        />
      );
      
      const dismissButton = screen.getByLabelText('Dismiss hint');
      fireEvent.click(dismissButton);
      
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows arrow pointer', () => {
      const { container } = render(
        <InteractiveHint 
          show={true}
          message="Hint with arrow"
          showArrow={true}
        />
      );
      
      // Check for arrow element
      const arrow = container.querySelector('[class*="arrow"]') || 
                    container.querySelector('[class*="triangle"]');
      expect(arrow).toBeInTheDocument();
    });
  });

  describe('StepProgress Component', () => {
    it('renders correct number of steps', () => {
      const { container } = render(
        <StepProgress 
          steps={['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']}
          currentStep={1}
        />
      );
      
      const steps = container.querySelectorAll('.flex.items-center.flex-1');
      expect(steps).toHaveLength(5);
    });

    it('highlights current step', () => {
      const { container } = render(
        <StepProgress 
          steps={['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']}
          currentStep={2}
        />
      );
      
      const activeSteps = container.querySelectorAll('.bg-blue-500');
      expect(activeSteps.length).toBeGreaterThan(0);
    });

    it('shows completed steps', () => {
      const { container } = render(
        <StepProgress 
          steps={['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']}
          currentStep={3}
        />
      );
      
      const completedSteps = container.querySelectorAll('.bg-blue-500');
      expect(completedSteps.length).toBeGreaterThan(0);
    });

    it('renders with step labels', () => {
      render(
        <StepProgress 
          steps={['Start', 'Middle', 'End']}
          currentStep={1}
          showLabels={true}
        />
      );
      
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('hides labels when showLabels is false', () => {
      render(
        <StepProgress 
          steps={['Start', 'Middle', 'End']}
          currentStep={1}
          showLabels={false}
        />
      );
      
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Middle')).not.toBeInTheDocument();
      expect(screen.queryByText('End')).not.toBeInTheDocument();
    });
  });

  describe('LoadingPersonality Component', () => {
    it('displays loading message', () => {
      render(<LoadingPersonality />);
      
      // Should display one of the loading messages
      const container = screen.getByText(/Preparing|Loading|Setting up|Fetching|Processing|Analyzing|Optimizing|Finalizing/);
      expect(container).toBeInTheDocument();
    });

    it('rotates through messages', async () => {
      render(<LoadingPersonality />);
      
      const firstMessage = screen.getByText(/Preparing|Loading|Setting up|Fetching|Processing|Analyzing|Optimizing|Finalizing/).textContent;
      
      // Advance time to trigger message rotation
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        const currentMessage = screen.getByText(/Preparing|Loading|Setting up|Fetching|Processing|Analyzing|Optimizing|Finalizing/).textContent;
        expect(currentMessage).not.toBe(firstMessage);
      });
    });

    it('shows spinner animation', () => {
      const { container } = render(<LoadingPersonality />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows progress when provided', () => {
      render(<LoadingPersonality progress={45} />);
      
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('uses custom messages when provided', () => {
      const customMessages = ['Custom message 1', 'Custom message 2'];
      
      render(<LoadingPersonality messages={customMessages} />);
      
      const message = screen.getByText(/Custom message/);
      expect(message).toBeInTheDocument();
    });
  });

  describe('PersonalitySkeletonLoader Component', () => {
    it('renders skeleton with personality', () => {
      const { container } = render(<PersonalitySkeletonLoader />);
      
      // Should have shimmer effect
      const shimmer = container.querySelector('.animate-pulse');
      expect(shimmer).toBeInTheDocument();
    });

    it('renders correct number of items', () => {
      const { container } = render(
        <PersonalitySkeletonLoader itemCount={5} />
      );
      
      const items = container.querySelectorAll('.bg-gray-200');
      expect(items.length).toBeGreaterThanOrEqual(5);
    });

    it('applies custom height', () => {
      const { container } = render(
        <PersonalitySkeletonLoader height={200} />
      );
      
      const skeleton = container.querySelector('[style*="height: 200px"]');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('TypingIndicator Component', () => {
    it('shows typing dots', () => {
      const { container } = render(<TypingIndicator />);
      
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);
    });

    it('animates dots', () => {
      const { container } = render(<TypingIndicator />);
      
      const dots = container.querySelectorAll('[class*="animate-bounce"]');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('uses custom color', () => {
      const { container } = render(
        <TypingIndicator color="bg-blue-500" />
      );
      
      const dot = container.querySelector('.bg-blue-500');
      expect(dot).toBeInTheDocument();
    });

    it('adjusts size', () => {
      const { container } = render(
        <TypingIndicator size="large" />
      );
      
      const dots = container.querySelectorAll('.w-3.h-3');
      expect(dots).toHaveLength(3);
    });
  });

  describe('useLoadingState Hook', () => {
    it('manages loading state', () => {
      const { result } = renderHook(() => useLoadingState());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadingMessage).toBe('');
      
      act(() => {
        result.current.startLoading('Fetching data...');
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingMessage).toBe('Fetching data...');
      
      act(() => {
        result.current.stopLoading();
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    it('updates loading message', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.startLoading('Initial message');
      });
      
      expect(result.current.loadingMessage).toBe('Initial message');
      
      act(() => {
        result.current.updateMessage('Updated message');
      });
      
      expect(result.current.loadingMessage).toBe('Updated message');
    });

    it('tracks loading progress', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.startLoading('Loading...', 0);
      });
      
      expect(result.current.progress).toBe(0);
      
      act(() => {
        result.current.setProgress(50);
      });
      
      expect(result.current.progress).toBe(50);
    });
  });

  describe('SmartTooltip Component', () => {
    it('shows tooltip after delay', async () => {
      render(
        <SmartTooltip content="Helpful tip">
          <button>Hover for tip</button>
        </SmartTooltip>
      );
      
      const button = screen.getByText('Hover for tip');
      
      fireEvent.mouseEnter(button);
      
      // Wait for delay
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Helpful tip')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      render(
        <SmartTooltip content="Tooltip text">
          <button>Button</button>
        </SmartTooltip>
      );
      
      const button = screen.getByText('Button');
      
      fireEvent.mouseEnter(button);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      
      fireEvent.mouseLeave(button);
      
      await waitFor(() => {
        expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      });
    });

    it('positions tooltip correctly', () => {
      const positions = ['top', 'bottom', 'left', 'right'] as const;
      
      positions.forEach(position => {
        const { container } = render(
          <SmartTooltip content="Tip" position={position}>
            <button>Button</button>
          </SmartTooltip>
        );
        
        const button = screen.getByText('Button');
        fireEvent.mouseEnter(button);
        
        act(() => {
          vi.advanceTimersByTime(500);
        });
        
        const tooltip = screen.getByText('Tip');
        expect(tooltip).toBeInTheDocument();
        
        fireEvent.mouseLeave(button);
      });
    });

    it('respects custom delay', async () => {
      render(
        <SmartTooltip content="Delayed tip" delay={1000}>
          <button>Wait longer</button>
        </SmartTooltip>
      );
      
      const button = screen.getByText('Wait longer');
      fireEvent.mouseEnter(button);
      
      // Not visible after 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(screen.queryByText('Delayed tip')).not.toBeInTheDocument();
      
      // Visible after 1000ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Delayed tip')).toBeInTheDocument();
      });
    });
  });
});