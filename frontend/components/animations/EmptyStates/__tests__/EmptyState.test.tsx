import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import {
  EmptyState,
  EmptyStudyState,
  EmptyDataState,
  EmptyParticipantState,
  NotFoundState,
  ErrorState,
  LoadingState,
} from '../EmptyState';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, whileHover, whileTap, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    path: ({ ...props }: any) => <path {...props} />,
    circle: ({ ...props }: any) => <circle {...props} />,
    rect: ({ ...props }: any) => <rect {...props} />,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the Illustrations
vi.mock('../Illustrations', () => ({
  NoStudiesIllustration: () => <div data-testid="no-studies-illustration" />,
  NoDataIllustration: () => <div data-testid="no-data-illustration" />,
  NoParticipantsIllustration: () => <div data-testid="no-participants-illustration" />,
  NotFoundIllustration: () => <div data-testid="not-found-illustration" />,
  ErrorIllustration: () => <div data-testid="error-illustration" />,
}));

describe('EmptyState Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EmptyState Base Component', () => {
    it('renders with required props', () => {
      render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="There is no data to display"
        />
      );
      
      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('There is no data to display')).toBeInTheDocument();
    });

    it('renders correct illustration for each type', () => {
      const { rerender } = render(
        <EmptyState type="no-studies" title="Test" description="Test" />
      );
      expect(screen.getByTestId('no-studies-illustration')).toBeInTheDocument();

      rerender(<EmptyState type="no-data" title="Test" description="Test" />);
      expect(screen.getByTestId('no-data-illustration')).toBeInTheDocument();

      rerender(<EmptyState type="no-participants" title="Test" description="Test" />);
      expect(screen.getByTestId('no-participants-illustration')).toBeInTheDocument();

      rerender(<EmptyState type="not-found" title="Test" description="Test" />);
      expect(screen.getByTestId('not-found-illustration')).toBeInTheDocument();

      rerender(<EmptyState type="error" title="Test" description="Test" />);
      expect(screen.getByTestId('error-illustration')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="Add some data"
          actionLabel="Add Data"
          onAction={handleAction}
        />
      );
      
      const button = screen.getByText('Add Data');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders secondary action when provided', () => {
      const handleSecondary = vi.fn();
      render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="Add some data"
          secondaryActionLabel="Learn More"
          onSecondaryAction={handleSecondary}
        />
      );
      
      const button = screen.getByText('Learn More');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleSecondary).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      const { container } = render(
        <EmptyState
          type="no-data"
          title="Test"
          description="Test"
          className="custom-class"
        />
      );
      
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('handles both actions together', () => {
      const handlePrimary = vi.fn();
      const handleSecondary = vi.fn();
      
      render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="Add some data"
          actionLabel="Add Data"
          onAction={handlePrimary}
          secondaryActionLabel="Learn More"
          onSecondaryAction={handleSecondary}
        />
      );
      
      fireEvent.click(screen.getByText('Add Data'));
      expect(handlePrimary).toHaveBeenCalledTimes(1);
      expect(handleSecondary).not.toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Learn More'));
      expect(handleSecondary).toHaveBeenCalledTimes(1);
      expect(handlePrimary).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyStudyState Component', () => {
    it('renders with correct title and description', () => {
      const handleCreate = vi.fn();
      render(<EmptyStudyState onCreateStudy={handleCreate} />);
      
      expect(screen.getByText('No Studies Yet')).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating your first Q methodology study/)).toBeInTheDocument();
    });

    it('handles create study action', () => {
      const handleCreate = vi.fn();
      render(<EmptyStudyState onCreateStudy={handleCreate} />);
      
      const button = screen.getByText('Create Your First Study');
      fireEvent.click(button);
      
      expect(handleCreate).toHaveBeenCalledTimes(1);
    });

    it('handles learn more action', () => {
      const handleCreate = vi.fn();
      const handleLearnMore = vi.fn();
      render(
        <EmptyStudyState
          onCreateStudy={handleCreate}
          onLearnMore={handleLearnMore}
        />
      );
      
      const button = screen.getByText('Learn About Q Methodology');
      fireEvent.click(button);
      
      expect(handleLearnMore).toHaveBeenCalledTimes(1);
      expect(handleCreate).not.toHaveBeenCalled();
    });
  });

  describe('EmptyDataState Component', () => {
    it('renders with correct title and description', () => {
      render(<EmptyDataState />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText(/Waiting for participants to complete sorts/)).toBeInTheDocument();
    });

    it('handles invite action', () => {
      const handleInvite = vi.fn();
      render(<EmptyDataState onInvite={handleInvite} />);
      
      const button = screen.getByText('Invite Participants');
      fireEvent.click(button);
      
      expect(handleInvite).toHaveBeenCalledTimes(1);
    });

    it('handles view guide action', () => {
      const handleGuide = vi.fn();
      render(<EmptyDataState onViewGuide={handleGuide} />);
      
      const button = screen.getByText('View Setup Guide');
      fireEvent.click(button);
      
      expect(handleGuide).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyParticipantState Component', () => {
    it('renders with correct title and description', () => {
      render(<EmptyParticipantState />);
      
      expect(screen.getByText('No Participants Yet')).toBeInTheDocument();
      expect(screen.getByText(/Share your study link to start collecting responses/)).toBeInTheDocument();
    });

    it('handles share action', () => {
      const handleShare = vi.fn();
      render(<EmptyParticipantState onShare={handleShare} />);
      
      const button = screen.getByText('Share Study Link');
      fireEvent.click(button);
      
      expect(handleShare).toHaveBeenCalledTimes(1);
    });

    it('handles preview action', () => {
      const handlePreview = vi.fn();
      render(<EmptyParticipantState onPreview={handlePreview} />);
      
      const button = screen.getByText('Preview Study');
      fireEvent.click(button);
      
      expect(handlePreview).toHaveBeenCalledTimes(1);
    });
  });

  describe('NotFoundState Component', () => {
    it('renders 404 state correctly', () => {
      render(<NotFoundState />);
      
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The page you're looking for doesn't exist/)).toBeInTheDocument();
    });

    it('handles go home action', () => {
      const handleHome = vi.fn();
      render(<NotFoundState onGoHome={handleHome} />);
      
      const button = screen.getByText('Go to Dashboard');
      fireEvent.click(button);
      
      expect(handleHome).toHaveBeenCalledTimes(1);
    });

    it('handles go back action', () => {
      const handleBack = vi.fn();
      render(<NotFoundState onGoBack={handleBack} />);
      
      const button = screen.getByText('Go Back');
      fireEvent.click(button);
      
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState Component', () => {
    it('renders error state correctly', () => {
      render(<ErrorState />);
      
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('renders custom error message', () => {
      render(<ErrorState errorMessage="Custom error occurred" />);
      
      expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
    });

    it('handles retry action', () => {
      const handleRetry = vi.fn();
      render(<ErrorState onRetry={handleRetry} />);
      
      const button = screen.getByText('Try Again');
      fireEvent.click(button);
      
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('handles contact support action', () => {
      const handleSupport = vi.fn();
      render(<ErrorState onContactSupport={handleSupport} />);
      
      const button = screen.getByText('Contact Support');
      fireEvent.click(button);
      
      expect(handleSupport).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoadingState Component', () => {
    it('renders loading state correctly', () => {
      render(<LoadingState />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we fetch your data')).toBeInTheDocument();
    });

    it('renders custom message', () => {
      render(<LoadingState message="Loading your studies..." />);
      
      expect(screen.getByText('Loading your studies...')).toBeInTheDocument();
    });

    it('shows spinner animation', () => {
      const { container } = render(<LoadingState />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      const { container } = render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="Add some data"
          actionLabel="Add Data"
        />
      );
      
      const main = container.querySelector('[role="main"]');
      expect(main).toBeInTheDocument();
    });

    it('provides proper heading hierarchy', () => {
      render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="Add some data"
        />
      );
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('No Data');
    });

    it('buttons have proper ARIA labels', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          type="no-data"
          title="No Data"
          description="Add some data"
          actionLabel="Add Data"
          onAction={handleAction}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Data' });
      expect(button).toBeInTheDocument();
    });
  });
});