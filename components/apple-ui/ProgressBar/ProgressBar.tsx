import React from "react";
import { cn } from "@/lib/utils";

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
  "aria-label": ariaLabel 
}: { 
  value: number; 
  min?: number; 
  max?: number; 
  label?: string; 
  showPercentage?: boolean; 
  size?: "sm" | "md" | "lg"; 
  variant?: "default" | "success" | "warning" | "danger"; 
  className?: string; 
  animated?: boolean; 
  striped?: boolean; 
  "aria-label"?: string; 
}) {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };
  
  const variantClasses = {
    default: "bg-fill",
    success: "bg-success/20",
    warning: "bg-warning/20",
    danger: "bg-danger/20"
  };
  
  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-text-secondary">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={ariaLabel || label}
        className={cn(
          "w-full rounded-full overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        tabIndex={0}
      >
        <div
          className={cn(
            "progress-fill h-full bg-primary",
            "transition-all duration-300 motion-reduce:transition-none",
            animated && "animate-pulse motion-reduce:animation-none",
            striped && "bg-stripes"
          )}
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
