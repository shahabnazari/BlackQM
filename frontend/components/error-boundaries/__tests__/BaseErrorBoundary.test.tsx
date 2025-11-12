/**
 * Base Error Boundary Unit Tests
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * @module BaseErrorBoundary.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseErrorBoundary } from '../BaseErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('BaseErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('Error Catching', () => {
    it('should render children when no error occurs', () => {
      render(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={false} />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch errors and render fallback UI', () => {
      render(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should display component name in error message', () => {
      render(
        <BaseErrorBoundary componentName="Test Component">
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('Error in Test Component')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <BaseErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback component', () => {
      render(
        <BaseErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('should render custom fallback function with error details', () => {
      const fallback = (error: Error) => <div>Error: {error.message}</div>;

      render(
        <BaseErrorBoundary fallback={fallback}>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when retry button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const { rerender } = render(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </BaseErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry button
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      // Re-render with fixed component
      rerender(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </BaseErrorBoundary>
      );

      // Should show no error
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });

    it('should call onReset callback when reset', async () => {
      const user = userEvent.setup();
      const onReset = jest.fn();
      let shouldThrow = true;

      const { rerender } = render(
        <BaseErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={shouldThrow} />
        </BaseErrorBoundary>
      );

      shouldThrow = false;

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      rerender(
        <BaseErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={shouldThrow} />
        </BaseErrorBoundary>
      );

      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('Reset Keys', () => {
    it('should auto-reset when resetKeys change', () => {
      let shouldThrow = true;

      const { rerender } = render(
        <BaseErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={shouldThrow} />
        </BaseErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Fix the error and change reset keys
      shouldThrow = false;

      rerender(
        <BaseErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={shouldThrow} />
        </BaseErrorBoundary>
      );

      // Error should be reset
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should not reset when resetKeys remain the same', () => {
      const { rerender } = render(
        <BaseErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();

      rerender(
        <BaseErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={false} />
        </BaseErrorBoundary>
      );

      // Error should still be displayed
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Error Counting', () => {
    it('should track number of errors', () => {
      const { rerender } = render(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(
        screen.getByText(/This error has occurred 1 times/i)
      ).toBeInTheDocument();

      // Reset and throw again
      rerender(
        <BaseErrorBoundary resetKeys={[1]}>
          <ThrowError shouldThrow={false} />
        </BaseErrorBoundary>
      );

      rerender(
        <BaseErrorBoundary resetKeys={[2]}>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(
        screen.getByText(/This error has occurred 1 times/i)
      ).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(
        screen.getByText('Error Details (Development Only)')
      ).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <BaseErrorBoundary>
          <ThrowError shouldThrow={true} />
        </BaseErrorBoundary>
      );

      expect(
        screen.queryByText('Error Details (Development Only)')
      ).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Isolation', () => {
    it('should isolate errors when isolate prop is true', () => {
      render(
        <BaseErrorBoundary isolate={true}>
          <ThrowError shouldThrow={false} />
        </BaseErrorBoundary>
      );

      const container = screen.getByText('No error').parentElement;
      expect(container).toHaveClass('error-boundary-isolation');
    });

    it('should not isolate when isolate prop is false', () => {
      render(
        <BaseErrorBoundary isolate={false}>
          <ThrowError shouldThrow={false} />
        </BaseErrorBoundary>
      );

      const element = screen.getByText('No error');
      expect(element.parentElement?.className).not.toContain(
        'error-boundary-isolation'
      );
    });
  });

  describe('Error Case Testing', () => {
    it('should handle render errors', () => {
      const RenderError = () => {
        throw new Error('Render failed');
      };

      render(
        <BaseErrorBoundary>
          <RenderError />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('Render failed')).toBeInTheDocument();
    });

    it('should handle different error types', () => {
      const CustomError = () => {
        throw new TypeError('Type error occurred');
      };

      render(
        <BaseErrorBoundary>
          <CustomError />
        </BaseErrorBoundary>
      );

      expect(screen.getByText('Type error occurred')).toBeInTheDocument();
    });

    it('should handle errors with detailed messages', () => {
      const DetailedError = () => {
        throw new Error('Network request failed: timeout after 30s');
      };

      render(
        <BaseErrorBoundary>
          <DetailedError />
        </BaseErrorBoundary>
      );

      expect(
        screen.getByText('Network request failed: timeout after 30s')
      ).toBeInTheDocument();
    });

    it('should reject errors properly', () => {
      expect(() => {
        render(
          <BaseErrorBoundary>
            <ThrowError shouldThrow={true} />
          </BaseErrorBoundary>
        );
      }).not.toThrow();
    });
  });
});
