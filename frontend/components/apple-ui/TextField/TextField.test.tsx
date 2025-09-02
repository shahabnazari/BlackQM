import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TextField } from "./TextField";

describe("TextField Component", () => {
  it("renders with default props", () => {
    render(<TextField placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("w-full", "px-4", "py-3");
  });

  it("renders with label", () => {
    render(<TextField label="Email" placeholder="Enter email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(
      <TextField 
        label="Password" 
        description="Must be at least 8 characters" 
        placeholder="Enter password" 
      />
    );
    
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Must be at least 8 characters")).toBeInTheDocument();
  });

  it("renders with error state", () => {
    render(
      <TextField 
        label="Email" 
        error="Invalid email format" 
        placeholder="Enter email" 
      />
    );
    
    expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    expect(screen.getByText("Invalid email format")).toHaveClass("text-danger");
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(
      <TextField 
        value="initial" 
        onChange={handleChange} 
        placeholder="Enter text" 
      />
    );
    
    const input = screen.getByPlaceholderText("Enter text");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    render(<TextField disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText("Disabled input");
    expect(input).toBeDisabled();
  });

  it("can be read-only", () => {
    render(<TextField readOnly placeholder="Read-only input" />);
    const input = screen.getByPlaceholderText("Read-only input");
    expect(input).toHaveAttribute("readonly");
  });

  it("applies custom className", () => {
    render(<TextField className="custom-input" placeholder="Custom input" />);
    const input = screen.getByPlaceholderText("Custom input");
    expect(input).toHaveClass("custom-input");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<TextField size="sm" placeholder="Small" />);
    expect(screen.getByPlaceholderText("Small")).toHaveClass("px-3", "py-3", "text-sm");

    rerender(<TextField size="md" placeholder="Medium" />);
    expect(screen.getByPlaceholderText("Medium")).toHaveClass("px-4", "py-3", "text-xl");

    rerender(<TextField size="lg" placeholder="Large" />);
    expect(screen.getByPlaceholderText("Large")).toHaveClass("px-4", "py-3", "text-lg");
  });

  it("renders with icon", () => {
    render(
      <TextField 
        leftIcon={<span>🔍</span>}
        placeholder="Search with icon" 
      />
    );
    
    expect(screen.getByText("🔍")).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextField ref={ref} placeholder="Ref test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});



// Additional tests for complete coverage
describe("TextField Additional Coverage", () => {
  it("handles focus and blur events", () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(
      <TextField 
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Focus test" 
      />
    );
    
    const input = screen.getByPlaceholderText("Focus test");
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("renders with right icon", () => {
    render(
      <TextField 
        rightIcon={<span>✓</span>}
        placeholder="With right icon" 
      />
    );
    
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows floating label on focus", () => {
    const { container } = render(<TextField placeholder="Floating label test" />);
    const input = screen.getByPlaceholderText("Floating label test");
    
    fireEvent.focus(input);
    // Floating label appears when focused
    const floatingLabel = container.querySelector('.absolute.-top-2.left-3.bg-surface');
    expect(floatingLabel).toBeInTheDocument();
  });

  it("shows floating label with value", () => {
    const { container } = render(<TextField placeholder="Floating label test" value="Some value" onChange={() => {}} />);
    // Floating label appears when there's a value
    const floatingLabel = container.querySelector('.absolute.-top-2.left-3.bg-surface');
    expect(floatingLabel).toBeInTheDocument();
  });

  it("renders helper text without error", () => {
    render(
      <TextField 
        helperText="This is helper text"
        placeholder="Helper text test" 
      />
    );
    
    const helperText = screen.getByText("This is helper text");
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass("text-text-secondary");
    expect(helperText).not.toHaveAttribute("role", "alert");
  });

  it("renders success variant", () => {
    render(<TextField variant="success" placeholder="Success variant" />);
    const input = screen.getByPlaceholderText("Success variant");
    expect(input).toHaveClass("border-success");
  });
});
