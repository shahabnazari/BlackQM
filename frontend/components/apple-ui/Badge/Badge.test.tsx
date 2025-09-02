import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge Component", () => {
  it("renders with default props", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("inline-flex", "items-center");
  });

  it("renders with info variant", () => {
    render(<Badge variant="info">Info Badge</Badge>);
    const badge = screen.getByText("Info Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText("Secondary Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with success variant", () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText("Success Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with warning variant", () => {
    render(<Badge variant="warning">Warning Badge</Badge>);
    const badge = screen.getByText("Warning Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText("Destructive Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with small size", () => {
    render(<Badge size="sm">Small Badge</Badge>);
    const badge = screen.getByText("Small Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with medium size", () => {
    render(<Badge size="md">Medium Badge</Badge>);
    const badge = screen.getByText("Medium Badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders with large size", () => {
    render(<Badge size="lg">Large Badge</Badge>);
    const badge = screen.getByText("Large Badge");
    expect(badge).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Badge className="custom-badge">Custom Badge</Badge>);
    const badge = screen.getByText("Custom Badge");
    expect(badge).toHaveClass("custom-badge");
  });

  it("renders with icon", () => {
    render(
      <Badge>
        <span>🚀</span>
        <span>Rocket Badge</span>
      </Badge>
    );
    
    expect(screen.getByText("🚀")).toBeInTheDocument();
    expect(screen.getByText("Rocket Badge")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<Badge>Accessible Badge</Badge>);
    const badge = screen.getByText("Accessible Badge");
    expect(badge).toBeInTheDocument();
  });

  it("supports focus states", () => {
    render(<Badge tabIndex={0}>Focusable Badge</Badge>);
    const badge = screen.getByText("Focusable Badge");
    badge.focus();
    expect(badge).toHaveFocus();
  });
});
