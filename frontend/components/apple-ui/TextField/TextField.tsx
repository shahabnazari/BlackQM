'use client';

import React, { forwardRef, InputHTMLAttributes, useState, useId } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textFieldVariants = cva(
  // Apple iOS text field styling
  "w-full rounded-lg border bg-surface px-4 py-3 text-xl text-text placeholder:text-text-tertiary transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "border-border hover:border-border-secondary",
        error: "border-danger focus:border-danger focus:ring-danger/20",
        success: "border-success focus:border-success focus:ring-success/20",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-xl", // iOS standard
        lg: "h-13 px-4 text-lg", // Apple standard height for large text fields
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  helperText?: string;
  error?: string;
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, description, helperText, error, variant, size, leftIcon, rightIcon, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(props.value || props.defaultValue);
    
    const currentVariant = error ? 'error' : variant || 'default';
    const generatedId = useId();
    const inputId = id || `text-field-${generatedId}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        {description && (
          <p id={`${inputId}-description`} className="text-sm text-text-secondary">
            {description}
          </p>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            className={cn(
              textFieldVariants({ variant: currentVariant, size }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={
              [
                description && `${inputId}-description`,
                error && errorId,
                helperText && !error && helperId
              ].filter(Boolean).join(' ') || undefined
            }
            aria-label={!label ? props.placeholder : undefined}
            onFocus={(e: any) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e: any) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true">
              {rightIcon}
            </div>
          )}
          {/* iOS-style floating label */}
          {props.placeholder && (isFocused || hasValue) && (
            <div className="absolute -top-2 left-3 bg-surface px-1 text-xs text-text-secondary" aria-hidden="true">
              {props.placeholder}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p 
            id={error ? errorId : helperId}
            className={cn(
              "text-sm",
              error ? "text-danger" : "text-text-secondary"
            )}
            role={error ? "alert" : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";

export { TextField };
