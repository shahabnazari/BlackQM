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


