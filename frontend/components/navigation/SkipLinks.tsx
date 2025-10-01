import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skip Links Component for Accessibility
 * Provides keyboard users quick navigation to main content areas
 * WCAG 2.1 Level A - Criterion 2.4.1 Bypass Blocks
 */
export const SkipLinks: React.FC = () => {
  return (
    <nav
      aria-label="Skip links"
      className="skip-links-container"
    >
      {/* Skip links are visually hidden but become visible on focus */}
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-4 focus-within:left-4 focus-within:z-[9999]">
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          <li>
            <a
              href="#main-content"
              className={cn(
                "skip-link",
                "inline-block px-4 py-2 bg-primary text-primary-foreground",
                "rounded-md shadow-lg",
                "hover:bg-primary/90 focus:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-all duration-200",
                "no-underline font-medium"
              )}
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a
              href="#primary-navigation"
              className={cn(
                "skip-link",
                "inline-block px-4 py-2 bg-primary text-primary-foreground",
                "rounded-md shadow-lg",
                "hover:bg-primary/90 focus:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-all duration-200",
                "no-underline font-medium"
              )}
            >
              Skip to navigation
            </a>
          </li>
          <li>
            <a
              href="#search"
              className={cn(
                "skip-link",
                "inline-block px-4 py-2 bg-primary text-primary-foreground",
                "rounded-md shadow-lg",
                "hover:bg-primary/90 focus:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-all duration-200",
                "no-underline font-medium"
              )}
            >
              Skip to search
            </a>
          </li>
          <li>
            <a
              href="#footer"
              className={cn(
                "skip-link",
                "inline-block px-4 py-2 bg-primary text-primary-foreground",
                "rounded-md shadow-lg",
                "hover:bg-primary/90 focus:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-all duration-200",
                "no-underline font-medium"
              )}
            >
              Skip to footer
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

// Export a simpler version for minimal layouts
export const MinimalSkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
        "inline-block px-4 py-2",
        "bg-primary text-primary-foreground",
        "rounded-md shadow-lg",
        "hover:bg-primary/90 focus:bg-primary/90",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all duration-200",
        "no-underline font-medium"
      )}
    >
      Skip to main content
    </a>
  );
};

export default SkipLinks;