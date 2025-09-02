import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document class
    document.documentElement.classList.remove("dark");
    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders with default props", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("renders with custom size", () => {
    render(<ThemeToggle size="lg" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-12", "w-12");
  });

  it("renders with custom className", () => {
    render(<ThemeToggle className="custom-toggle" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-toggle");
  });

  it("shows moon icon when in light mode", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("shows sun icon when in dark mode", async () => {
    // Set initial dark mode
    localStorageMock.getItem.mockReturnValue("dark");
    document.documentElement.classList.add("dark");
    
    render(<ThemeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });
  });

  it("toggles theme when clicked", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    
    // Get initial state
    const initialLabel = button.getAttribute("aria-label");
    const isInitiallyDark = initialLabel === "Switch to light mode";
    
    // Click to toggle
    fireEvent.click(button);
    
    await waitFor(() => {
      const newLabel = button.getAttribute("aria-label");
      expect(newLabel).not.toBe(initialLabel);
      
      if (isInitiallyDark) {
        expect(newLabel).toBe("Switch to dark mode");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
      } else {
        expect(newLabel).toBe("Switch to light mode");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
      }
    });
  });

  it("persists theme preference in localStorage", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    
    // Toggle to dark mode
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light");
    });
    
    // Toggle back to light mode
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light");
    });
  });

  it("loads theme from localStorage on mount", async () => {
    localStorageMock.getItem.mockReturnValue("dark");
    
    render(<ThemeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });
  });

  it("uses system preference when no localStorage value", async () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    render(<ThemeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });
  });

  it("handles missing localStorage gracefully", () => {
    // Mock localStorage as undefined
    Object.defineProperty(window, "localStorage", {
      value: undefined,
    });
    
    expect(() => render(<ThemeToggle />)).not.toThrow();
  });

  it("applies proper focus styles", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    
    button.focus();
    expect(button).toHaveClass("focus:outline-none", "focus:ring-2");
  });
});


