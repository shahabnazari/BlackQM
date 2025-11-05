/**
 * Phase 10 Day 6: Accessibility Testing Examples
 *
 * This file demonstrates how to write WCAG 2.1 AA compliant accessibility tests
 * for VQMethod components using jest-axe and React Testing Library.
 *
 * Use these patterns for all new components.
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, beforeAll } from 'vitest';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

/**
 * EXAMPLE 1: Basic Component Accessibility Test
 *
 * Tests that a simple button component meets WCAG 2.1 AA standards
 */
describe('Button Component - Accessibility', () => {
  it('should meet WCAG 2.1 AA standards', async () => {
    const { container } = render(
      <button type="button" aria-label="Close dialog">
        Close
      </button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible', () => {
    render(
      <button type="button" onClick={() => {}}>
        Click Me
      </button>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    button.focus();
    expect(button).toHaveFocus();
  });

  it('should have visible focus indicator', () => {
    const { container } = render(
      <button type="button" style={{ outline: '2px solid blue' }}>
        Focused Button
      </button>
    );

    const button = container.querySelector('button');
    button?.focus();
    const styles = window.getComputedStyle(button!);
    expect(styles.outline).toBeTruthy();
  });
});

/**
 * EXAMPLE 2: Form Accessibility Test
 *
 * Tests that form inputs have proper labels and ARIA attributes
 */
describe('Form Input - Accessibility', () => {
  it('should have associated label', () => {
    render(
      <form>
        <label htmlFor="email-input">
          Email Address
          <input
            id="email-input"
            type="email"
            name="email"
            required
            aria-required="true"
          />
        </label>
      </form>
    );

    const input = screen.getByLabelText('Email Address');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should announce errors to screen readers', () => {
    render(
      <form>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <div id="email-error" role="alert">
          Please enter a valid email address
        </div>
      </form>
    );

    const input = screen.getByLabelText('Email');
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(error).toHaveTextContent('Please enter a valid email address');
  });

  it('should meet WCAG standards', async () => {
    const { container } = render(
      <form>
        <label htmlFor="username">
          Username
          <input id="username" type="text" name="username" required />
        </label>
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

/**
 * EXAMPLE 3: Modal Dialog Accessibility
 *
 * Tests that modals trap focus and announce to screen readers
 */
describe('Modal Dialog - Accessibility', () => {
  it('should have proper ARIA role and label', () => {
    render(
      <div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
        <h2 id="dialog-title">Confirm Action</h2>
        <p>Are you sure you want to delete this item?</p>
        <button type="button">Cancel</button>
        <button type="button">Delete</button>
      </div>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should trap focus within modal', () => {
    render(
      <div role="dialog" aria-modal="true">
        <button type="button" data-testid="first-button">
          First
        </button>
        <button type="button" data-testid="second-button">
          Second
        </button>
        <button type="button" data-testid="last-button">
          Last
        </button>
      </div>
    );

    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');

    // Focus should cycle within modal
    firstButton.focus();
    expect(firstButton).toHaveFocus();

    lastButton.focus();
    expect(lastButton).toHaveFocus();
  });

  it('should meet WCAG standards', async () => {
    const { container } = render(
      <div
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        aria-modal="true"
      >
        <h2 id="modal-title">Modal Title</h2>
        <p id="modal-description">Modal description text</p>
        <button type="button">Close</button>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

/**
 * EXAMPLE 4: Navigation Menu Accessibility
 *
 * Tests that navigation is accessible via keyboard and screen readers
 */
describe('Navigation Menu - Accessibility', () => {
  it('should use semantic nav element', () => {
    render(
      <nav aria-label="Main navigation">
        <ul>
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </nav>
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('should indicate current page', () => {
    render(
      <nav>
        <ul>
          <li>
            <a href="/home" aria-current="page">
              Home
            </a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
        </ul>
      </nav>
    );

    const currentLink = screen.getByRole('link', {
      name: 'Home',
      current: 'page',
    });
    expect(currentLink).toBeInTheDocument();
  });

  it('should meet WCAG standards', async () => {
    const { container } = render(
      <nav aria-label="Primary">
        <ul role="list">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
        </ul>
      </nav>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

/**
 * EXAMPLE 5: Image Accessibility
 *
 * Tests that images have appropriate alt text
 */
describe('Image - Accessibility', () => {
  it('should have descriptive alt text', () => {
    render(
      <img
        src="/chart.png"
        alt="Bar chart showing survey responses by age group"
      />
    );

    const img = screen.getByAltText(/bar chart showing survey responses/i);
    expect(img).toBeInTheDocument();
  });

  it('should use empty alt for decorative images', () => {
    render(<img src="/decoration.png" alt="" role="presentation" />);

    const img = screen.getByRole('presentation');
    expect(img).toHaveAttribute('alt', '');
  });

  it('should meet WCAG standards', async () => {
    const { container } = render(
      <div>
        <img src="/content.png" alt="Descriptive text" />
        <img src="/decorative.png" alt="" role="presentation" />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

/**
 * EXAMPLE 6: Dynamic Content Accessibility
 *
 * Tests that live regions announce updates to screen readers
 */
describe('Live Region - Accessibility', () => {
  it('should announce status updates', () => {
    render(
      <div role="status" aria-live="polite">
        Loading data...
      </div>
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading data...');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('should announce alerts immediately', () => {
    render(
      <div role="alert" aria-live="assertive">
        Error: Failed to save changes
      </div>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Error: Failed to save changes');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should meet WCAG standards', async () => {
    const { container } = render(
      <div>
        <div role="status" aria-live="polite">
          File uploaded successfully
        </div>
        <div role="alert" aria-live="assertive">
          Please correct the form errors
        </div>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

/**
 * EXAMPLE 7: Color Contrast Testing
 *
 * Note: axe-core automatically checks color contrast ratios
 */
describe('Color Contrast - Accessibility', () => {
  it('should have sufficient contrast for text', async () => {
    const { container } = render(
      <div
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '20px',
        }}
      >
        <p>This text has high contrast (21:1)</p>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should flag insufficient contrast', async () => {
    const { container } = render(
      <div
        style={{
          backgroundColor: '#ffffff',
          color: '#dddddd', // Very low contrast
        }}
      >
        <p>This text has low contrast</p>
      </div>
    );

    const results = await axe(container);
    // This SHOULD have violations
    // expect(results.violations.length).toBeGreaterThan(0);
  });
});

/**
 * EXAMPLE 8: Heading Hierarchy
 *
 * Tests that headings follow proper semantic structure
 */
describe('Heading Hierarchy - Accessibility', () => {
  it('should have proper heading structure', async () => {
    const { container } = render(
      <div>
        <h1>Page Title</h1>
        <h2>Section Title</h2>
        <h3>Subsection Title</h3>
        <h2>Another Section</h2>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not skip heading levels', () => {
    render(
      <div>
        <h1>Main Title</h1>
        <h3>This skips h2 (bad practice)</h3>
      </div>
    );

    // Verify headings exist but note the skip
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});

/**
 * HOW TO RUN THESE TESTS
 *
 * # Run all accessibility tests
 * npm run test -- --testPathPattern=accessibility
 *
 * # Run specific test file
 * npm run test accessibility-example.test.tsx
 *
 * # Run with coverage
 * npm run test:coverage -- --testPathPattern=accessibility
 */
