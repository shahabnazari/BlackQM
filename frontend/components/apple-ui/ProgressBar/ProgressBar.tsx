import React from "react";
import { cn } from "@/lib/utils";

interface ProgressSegment {
  value: number;
  color: string;
}

export function ProgressBar({ 
  value, 
  min = 0, 
  max = 100, 
  label, 
  showPercentage = false, 
  size = "md", 
  variant = "default", 
  className = "", 
  animated = false, 
  striped = false, 
  indeterminate = false,
  animationDuration = 300,
  ariaLive = false,
  "aria-label": ariaLabel,
  ariaValueText,
  labelFunction,
  barClassName,
  segments
}: { 
  value?: number; 
  min?: number; 
  max?: number; 
  label?: string; 
  showPercentage?: boolean; 
  size?: "sm" | "md" | "lg" | "small" | "medium" | "large"; 
  variant?: "default" | "success" | "warning" | "danger" | "info"; 
  className?: string; 
  animated?: boolean; 
  striped?: boolean; 
  indeterminate?: boolean;
  animationDuration?: number;
  ariaLive?: boolean | "polite" | "assertive";
  "aria-label"?: string;
  ariaValueText?: string;
  labelFunction?: (value: number) => string;
  barClassName?: string;
  segments?: ProgressSegment[];
}) {
  // Normalize size names
  const normalizedSize = size === "small" ? "sm" : size === "medium" ? "md" : size === "large" ? "lg" : size || "md";
  
  // Handle edge cases for value
  let processedValue = value;
  if (typeof value === 'number' && isNaN(value)) {
    processedValue = 0;
  } else if (value === Infinity) {
    processedValue = max;
  } else if (value === null || value === undefined) {
    processedValue = 0;
  }
  
  // Clamp value to min/max boundaries
  const clampedValue = processedValue !== undefined 
    ? Math.min(Math.max(processedValue, min), max) 
    : indeterminate ? 0 : 0;
  
  const percentage = !indeterminate && value !== undefined
    ? Math.min(Math.max(((clampedValue - min) / (max - min)) * 100, 0), 100)
    : 0;
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };
  
  const variantClasses = {
    default: "bg-fill",
    success: "bg-success/20",
    warning: "bg-warning/20",
    danger: "bg-danger/20",
    info: "bg-info/20"
  };
  
  const fillVariantClasses = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info"
  };
  
  // Generate aria-valuetext for better screen reader support
  const computedAriaValueText = ariaValueText || (indeterminate 
    ? "indeterminate progress"
    : `${Math.round(percentage)} percent complete`);
  
  // Compute label text
  const labelText = labelFunction ? labelFunction(clampedValue) : label;

  return (
    <div className="space-y-2">
      {(labelText || (showPercentage && !indeterminate)) && (
        <div className="flex justify-between text-sm text-text-secondary">
          {labelText && <span>{labelText}</span>}
          {showPercentage && !indeterminate && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={computedAriaValueText}
        aria-label={ariaLabel || labelText}
        aria-live={typeof ariaLive === 'string' ? ariaLive : (ariaLive ? "polite" : undefined)}
        className={cn(
          "w-full rounded-full overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          variantClasses[variant],
          sizeClasses[normalizedSize],
          indeterminate && "animate-pulse",
          "motion-reduce:transition-none",
          className
        )}
        tabIndex={0}
      >
        {segments && segments.length > 0 ? (
          segments.map((segment, index) => (
            <div
              key={index}
              className={cn(
                "progress-fill h-full inline-block",
                segment.color,
                `transition-all motion-reduce:transition-none`,
                animated && "motion-reduce:animation-none"
              )}
              style={{ 
                width: `${(segment.value / max) * 100}%`,
                transitionDuration: `${animationDuration}ms` 
              }}
              aria-hidden="true"
            />
          ))
        ) : (
          <div
            className={cn(
              "progress-fill h-full",
              barClassName || fillVariantClasses[variant],
              `transition-all motion-reduce:transition-none`,
              animated && !indeterminate && "animate-pulse motion-reduce:animation-none",
              striped && "bg-stripes bg-gradient-to-r from-transparent via-white/20 to-transparent animate-stripes",
              indeterminate && "w-full"
            )}
            style={{ 
              width: indeterminate ? "100%" : `${percentage}%`,
              transitionDuration: `${animationDuration}ms` 
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
