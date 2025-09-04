import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TextField } from '../TextField';

// Add axe matchers
expect.extend(toHaveNoViolations);

describe('TextField Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<TextField />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('bg-surface');
    });

    it('renders with label', () => {
      render(<TextField label="Email Address" />);
      const label = screen.getByText('Email Address');
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
    });

    it('renders with placeholder', () => {
      render(<TextField placeholder="Enter text..." />);
      const input = screen.getByPlaceholderText('Enter text...');
      expect(input).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<TextField helperText="This field is required" />);
      const helper = screen.getByText('This field is required');
      expect(helper).toBeInTheDocument();
      expect(helper).toHaveClass('text-xs');
      expect(helper).toHaveClass('text-secondary-label');
    });

    it('renders with error state', () => {
      render(<TextField error errorMessage="Invalid input" />);
      const error = screen.getByText('Invalid input');
      expect(error).toBeInTheDocument();
      expect(error).toHaveClass('text-danger');
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders with success state', () => {
      render(<TextField success />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-success');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders required indicator', () => {
      render(<TextField label="Required Field" required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-danger');
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('renders with custom className', () => {
      render(<TextField className="custom-field" />);
      const container = document.querySelector('.custom-field');
      expect(container).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<TextField ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Input Types', () => {
    it('renders as text input by default', () => {
      render(<TextField />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders as email input', () => {
      render(<TextField type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders as password input', () => {
      render(<TextField type="password" />);
      // Password inputs don't have role="textbox"
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as number input', () => {
      render(<TextField type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders as search input', () => {
      render(<TextField type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('renders as textarea when multiline', () => {
      render(<TextField multiline />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders textarea with rows', () => {
      render(<TextField multiline rows={5} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  describe('Interactions', () => {
    it('handles input changes', async () => {
      const handleChange = vi.fn();
      render(<TextField onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Hello');
      
      expect(handleChange).toHaveBeenCalledTimes(5); // Once for each character
      expect(input).toHaveValue('Hello');
    });

    it('handles focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      
      render(
        <TextField 
          onFocus={handleFocus} 
          onBlur={handleBlur} 
        />
      );
      
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('prevents input when disabled', async () => {
      const handleChange = vi.fn();
      render(<TextField disabled onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      
      await userEvent.type(input, 'Test');
      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('prevents input when readonly', async () => {
      render(<TextField readOnly value="Read Only" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      
      await userEvent.type(input, 'Test');
      expect(input).toHaveValue('Read Only');
    });

    it('handles paste events', async () => {
      const handlePaste = vi.fn();
      render(<TextField onPaste={handlePaste} />);
      
      const input = screen.getByRole('textbox');
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });
      
      fireEvent(input, pasteEvent);
      expect(handlePaste).toHaveBeenCalledTimes(1);
    });

    it('handles key events', async () => {
      const handleKeyDown = vi.fn();
      render(<TextField onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('shows character count', () => {
      render(<TextField maxLength={10} showCharCount value="Hello" />);
      const count = screen.getByText('5/10');
      expect(count).toBeInTheDocument();
    });

    it('enforces maxLength', async () => {
      render(<TextField maxLength={5} />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'HelloWorld');
      expect(input).toHaveValue('Hello');
    });

    it('shows validation on blur', async () => {
      const handleValidation = vi.fn(() => 'Error message');
      render(<TextField onValidate={handleValidation} />);
      
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'test');
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('validates pattern attribute', () => {
      render(<TextField pattern="[0-9]+" />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('pattern', '[0-9]+');
    });

    it('validates required field', () => {
      render(<TextField required />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <TextField 
          label="Accessible Field"
          helperText="Help text"
          required
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates label with input', () => {
      render(<TextField label="Email" id="email-field" />);
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email');
      
      expect(label).toHaveAttribute('for', 'email-field');
      expect(input).toHaveAttribute('id', 'email-field');
    });

    it('provides proper ARIA attributes', () => {
      render(
        <TextField
          label="Accessible Input"
          error
          errorMessage="Error text"
          helperText="Helper text"
          required
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('announces error messages', () => {
      render(<TextField error errorMessage="Invalid email format" />);
      
      const error = screen.getByText('Invalid email format');
      expect(error).toHaveAttribute('role', 'alert');
    });

    it('handles keyboard navigation', async () => {
      render(
        <div>
          <TextField label="First" />
          <TextField label="Second" />
          <TextField label="Third" />
        </div>
      );
      
      const inputs = screen.getAllByRole('textbox');
      
      userEvent.tab();
      expect(inputs[0]).toHaveFocus();
      
      userEvent.tab();
      expect(inputs[1]).toHaveFocus();
      
      userEvent.tab();
      expect(inputs[2]).toHaveFocus();
    });

    it('respects reduced motion', () => {
      render(<TextField />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Visual States', () => {
    it('shows focus state', () => {
      render(<TextField />);
      const input = screen.getByRole('textbox');
      
      input.focus();
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-primary');
    });

    it('shows disabled state', () => {
      render(<TextField disabled />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('disabled:bg-fill');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('shows hover state', async () => {
      render(<TextField />);
      const input = screen.getByRole('textbox');
      
      await userEvent.hover(input);
      expect(input).toHaveClass('hover:border-primary');
    });
  });

  describe('Icons and Addons', () => {
    it('renders with start icon', () => {
      render(
        <TextField 
          startIcon={<span data-testid="start-icon">📧</span>}
        />
      );
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('renders with end icon', () => {
      render(
        <TextField 
          endIcon={<span data-testid="end-icon">✓</span>}
        />
      );
      
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('renders with prefix', () => {
      render(<TextField prefix="$" />);
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('renders with suffix', () => {
      render(<TextField suffix=".com" />);
      expect(screen.getByText('.com')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('adapts to dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<TextField />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('bg-surface');
      expect(input).toHaveClass('text-label');
      
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Performance', () => {
    it('debounces input changes', async () => {
      vi.useFakeTimers();
      const handleChange = vi.fn();
      
      render(<TextField onChange={handleChange} debounce={300} />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'Hello');
      
      expect(handleChange).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(300);
      
      expect(handleChange).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('handles rapid typing efficiently', async () => {
      const handleChange = vi.fn();
      render(<TextField onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      const longText = 'a'.repeat(100);
      
      await userEvent.type(input, longText);
      
      expect(input).toHaveValue(longText);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      render(<TextField value={undefined} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('handles null value gracefully', () => {
      render(<TextField value={null as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('handles very long input', async () => {
      const longText = 'A'.repeat(1000);
      render(<TextField />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, longText);
      
      expect(input).toHaveValue(longText);
    });

    it('handles special characters', async () => {
      render(<TextField />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, '™©®<>{}[]');
      expect(input).toHaveValue('™©®<>{}[]');
    });

    it('handles RTL text', async () => {
      render(<TextField dir="rtl" />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'مرحبا');
      expect(input).toHaveValue('مرحبا');
    });
  });
});