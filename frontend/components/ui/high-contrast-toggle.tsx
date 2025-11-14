'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AccessibleTooltip } from './accessible-tooltip';
import { announceToScreenReader } from '@/lib/accessibility/accessibility-utils';

interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function HighContrastToggle({
  className,
  showLabel = false,
}: HighContrastToggleProps) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preference
    const saved = localStorage.getItem('highContrastMode');
    if (saved === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);

    if (newValue) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrastMode', 'true');
      announceToScreenReader('High contrast mode enabled');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrastMode', 'false');
      announceToScreenReader('High contrast mode disabled');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AccessibleTooltip
      content={
        <div>
          <strong>High Contrast Mode</strong>
          <p className="mt-1">
            Enhances visibility for users with visual impairments
          </p>
        </div>
      }
      richContent
      shortcut="Alt+H"
      id="high-contrast-toggle"
    >
      <button
        onClick={toggleHighContrast}
        className={cn(
          'relative inline-flex items-center gap-2 px-3 py-2',
          'rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isHighContrast
            ? 'bg-black text-white border-2 border-white focus:ring-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
          className
        )}
        aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
        aria-pressed={isHighContrast}
      >
        {isHighContrast ? (
          <EyeSlashIcon className="w-5 h-5" aria-hidden="true" />
        ) : (
          <EyeIcon className="w-5 h-5" aria-hidden="true" />
        )}
        {showLabel && (
          <span className="text-sm font-medium">
            {isHighContrast ? 'Normal' : 'High'} Contrast
          </span>
        )}
      </button>
    </AccessibleTooltip>
  );
}

// High contrast CSS provider component
export function HighContrastStyles() {
  return (
    <style jsx global>{`
      .high-contrast {
        /* Colors */
        --color-background: #000000;
        --color-foreground: #ffffff;
        --color-muted: #000000;
        --color-muted-foreground: #ffffff;
        --color-card: #000000;
        --color-card-foreground: #ffffff;
        --color-border: #ffffff;
        --color-primary: #ffff00;
        --color-primary-foreground: #000000;
        --color-secondary: #00ffff;
        --color-secondary-foreground: #000000;
        --color-destructive: #ff0000;
        --color-destructive-foreground: #ffffff;
        --color-success: #00ff00;
        --color-warning: #ffff00;
      }

      /* High contrast specific styles */
      .high-contrast * {
        outline-width: 2px !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }

      .high-contrast a {
        text-decoration: underline !important;
        text-decoration-thickness: 2px !important;
      }

      .high-contrast button,
      .high-contrast [role='button'] {
        border: 2px solid currentColor !important;
        font-weight: 600 !important;
      }

      .high-contrast input,
      .high-contrast textarea,
      .high-contrast select {
        border: 2px solid currentColor !important;
        background-color: var(--color-background) !important;
        color: var(--color-foreground) !important;
      }

      .high-contrast :focus {
        outline: 3px solid var(--color-primary) !important;
        outline-offset: 2px !important;
      }

      .high-contrast img {
        opacity: 0.9 !important;
        filter: contrast(1.2) !important;
      }

      .high-contrast .text-muted,
      .high-contrast .text-gray-500,
      .high-contrast .text-gray-600 {
        color: var(--color-foreground) !important;
        opacity: 0.9 !important;
      }

      .high-contrast [disabled] {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
      }

      /* Phase-specific high contrast colors */
      .high-contrast .phase-discover {
        background-color: #9400d3 !important;
        color: #ffffff !important;
      }
      .high-contrast .phase-design {
        background-color: #ffff00 !important;
        color: #000000 !important;
      }
      .high-contrast .phase-build {
        background-color: #0000ff !important;
        color: #ffffff !important;
      }
      .high-contrast .phase-recruit {
        background-color: #00ff00 !important;
        color: #000000 !important;
      }
      .high-contrast .phase-collect {
        background-color: #00ffff !important;
        color: #000000 !important;
      }
      .high-contrast .phase-analyze {
        background-color: #4b0082 !important;
        color: #ffffff !important;
      }
      .high-contrast .phase-visualize {
        background-color: #ff1493 !important;
        color: #ffffff !important;
      }
      .high-contrast .phase-interpret {
        background-color: #ff8c00 !important;
        color: #000000 !important;
      }
      .high-contrast .phase-report {
        background-color: #ff0000 !important;
        color: #ffffff !important;
      }
      .high-contrast .phase-archive {
        background-color: #808080 !important;
        color: #ffffff !important;
      }
    `}</style>
  );
}
