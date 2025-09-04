/**
 * Class Name Utilities
 * Helper function for concatenating and conditionally applying class names
 */

import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 * This ensures Tailwind CSS classes are properly merged without conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}