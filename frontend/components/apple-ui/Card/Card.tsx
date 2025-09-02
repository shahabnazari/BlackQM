import React from "react";
import { cn } from "@/lib/utils";

export function Card({ 
  children, 
  className = "",
  role,
  ariaLabel 
}: { 
  children: React.ReactNode; 
  className?: string;
  role?: string;
  ariaLabel?: string;
}) {
  return (
    <div 
      className={cn(
        "bg-surface rounded-lg shadow-md",
        "p-4 md:p-6 lg:p-8",
        "transition-shadow motion-reduce:transition-none",
        "hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      role={role || "article"}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 md:mb-4 lg:mb-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn(
      "text-lg md:text-xl lg:text-2xl font-semibold text-text",
      "motion-reduce:transition-none",
      className
    )}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(
      "text-sm md:text-base text-text-secondary",
      "mt-1 md:mt-2",
      className
    )}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("py-2 md:py-3", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "mt-3 md:mt-4 lg:mt-5",
      "pt-3 md:pt-4 lg:pt-5",
      "border-t border-border",
      "flex items-center gap-2 md:gap-3",
      className
    )}>
      {children}
    </div>
  );
}
