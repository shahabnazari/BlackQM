import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";

describe("Card Component", () => {
  it("renders basic card with content", () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    );
    
    expect(screen.getByText("Card content")).toBeInTheDocument();
    const card = screen.getByText("Card content").closest("div")?.parentElement;
    expect(card).toHaveClass("bg-surface", "rounded-lg", "shadow-md");
    expect(card).toHaveClass("p-4", "md:p-6", "lg:p-8");
  });

  it("renders card with header", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders card with footer", () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("applies custom className to card", () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    );
    
    const card = screen.getByText("Content").closest("div")?.parentElement;
    expect(card).toHaveClass("custom-card");
  });

  it("renders complete card structure", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>Full structure test</CardDescription>
        </CardHeader>
        <CardContent>Main content area</CardContent>
        <CardFooter>Action buttons</CardFooter>
      </Card>
    );
    
    expect(screen.getByText("Complete Card")).toBeInTheDocument();
    expect(screen.getByText("Full structure test")).toBeInTheDocument();
    expect(screen.getByText("Main content area")).toBeInTheDocument();
    expect(screen.getByText("Action buttons")).toBeInTheDocument();
  });

  it("applies custom className to CardHeader", () => {
    render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );
    
    const header = screen.getByText("Title").closest("div");
    expect(header).toHaveClass("custom-header");
  });

  it("applies custom className to CardTitle", () => {
    render(
      <Card>
        <CardTitle className="custom-title">Title</CardTitle>
      </Card>
    );
    
    const title = screen.getByText("Title");
    expect(title).toHaveClass("custom-title");
  });

  it("applies custom className to CardDescription", () => {
    render(
      <Card>
        <CardDescription className="custom-description">Description</CardDescription>
      </Card>
    );
    
    const description = screen.getByText("Description");
    expect(description).toHaveClass("custom-description");
  });

  it("applies custom className to CardContent", () => {
    render(
      <Card>
        <CardContent className="custom-content">Content</CardContent>
      </Card>
    );
    
    const content = screen.getByText("Content");
    expect(content).toHaveClass("custom-content");
  });

  it("applies custom className to CardFooter", () => {
    render(
      <Card>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>
    );
    
    const footer = screen.getByText("Footer");
    expect(footer).toHaveClass("custom-footer");
  });
});
