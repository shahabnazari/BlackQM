'use client';

import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Base Apple badge styling
  "inline-flex items-center rounded-md border px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "border-border bg-fill text-text hover:bg-fill-secondary",
        secondary: "border-border bg-surface-secondary text-text hover:bg-fill",
        destructive: "border-danger/20 bg-danger/10 text-danger hover:bg-danger/20",
        outline: "border-border text-text",
        success: "border-success/20 bg-success/10 text-success hover:bg-success/20",
        warning: "border-warning/20 bg-warning/10 text-warning hover:bg-warning/20",
        info: "border-info/20 bg-info/10 text-info hover:bg-info/20",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps 
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  as?: React.ElementType;
  ariaLabel?: string;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, as: Component = "div", ariaLabel, children, ...props }, ref) => {
    return (
      <Component
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        role="status"
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
