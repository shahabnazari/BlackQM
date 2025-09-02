import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar Component", () => {
  it("renders with default props", () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders with custom min and max values", () => {
    render(<ProgressBar value={25} min={0} max={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "25");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "50");
  });

  it("renders with label", () => {
    render(<ProgressBar value={75} label="Upload Progress" />);
    expect(screen.getByText("Upload Progress")).toBeInTheDocument();
  });

  it("renders with percentage display", () => {
    render(<ProgressBar value={60} showPercentage />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />);
    expect(screen.getByRole("progressbar")).toHaveClass("h-1");

    rerender(<ProgressBar value={50} size="md" />);
    expect(screen.getByRole("progressbar")).toHaveClass("h-2");

    rerender(<ProgressBar value={50} size="lg" />);
    expect(screen.getByRole("progressbar")).toHaveClass("h-3");
  });

  it("renders with different variants", () => {
    const { rerender } = render(<ProgressBar value={50} variant="default" />);
    expect(screen.getByRole("progressbar")).toHaveClass("bg-fill");

    rerender(<ProgressBar value={50} variant="success" />);
    expect(screen.getByRole("progressbar")).toHaveClass("bg-success/20");

    rerender(<ProgressBar value={50} variant="warning" />);
    expect(screen.getByRole("progressbar")).toHaveClass("bg-warning/20");

    rerender(<ProgressBar value={50} variant="danger" />);
    expect(screen.getByRole("progressbar")).toHaveClass("bg-danger/20");
  });

  it("applies custom className", () => {
    render(<ProgressBar value={50} className="custom-progress" />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("custom-progress");
  });

  it("renders with animated progress", () => {
    render(<ProgressBar value={50} animated />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.querySelector(".progress-fill")).toHaveClass("animate-pulse");
  });

  it("renders with striped pattern", () => {
    render(<ProgressBar value={50} striped />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.querySelector(".progress-fill")).toHaveClass("bg-stripes");
  });

  it("handles edge case values", () => {
    const { rerender } = render(<ProgressBar value={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    rerender(<ProgressBar value={100} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressBar value={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "-10");
  });

  it("renders with custom aria-label", () => {
    render(<ProgressBar value={50} aria-label="Custom progress" />);
    const progressBar = screen.getByRole("progressbar", { name: "Custom progress" });
    expect(progressBar).toBeInTheDocument();
  });
});


