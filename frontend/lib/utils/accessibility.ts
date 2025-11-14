/**
 * Accessibility Utilities
 * Phase 10.8 Day 3: WCAG AA Compliance
 * 
 * Enterprise-grade accessibility helpers for keyboard navigation,
 * screen readers, and WCAG AA compliance.
 * 
 * @since Phase 10.8 Day 3
 */

/**
 * Handle keyboard navigation for lists with arrow keys
 * 
 * @param event - Keyboard event
 * @param currentIndex - Current focused item index
 * @param totalItems - Total number of items in list
 * @param onIndexChange - Callback when index changes
 * @param orientation - List orientation (vertical/horizontal)
 */
export function handleListKeyNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onIndexChange: (newIndex: number) => void,
  orientation: 'vertical' | 'horizontal' = 'vertical'
): void {
  const isVertical = orientation === 'vertical';
  const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
  const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

  switch (event.key) {
    case nextKey:
      event.preventDefault();
      if (currentIndex < totalItems - 1) {
        onIndexChange(currentIndex + 1);
      }
      break;
    case prevKey:
      event.preventDefault();
      if (currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
      break;
    case 'Home':
      event.preventDefault();
      onIndexChange(0);
      break;
    case 'End':
      event.preventDefault();
      onIndexChange(totalItems - 1);
      break;
  }
}

/**
 * Handle keyboard activation for interactive elements
 * Supports Enter and Space keys (WCAG 2.1.1)
 * 
 * @param event - Keyboard event
 * @param onActivate - Callback when element is activated
 */
export function handleKeyboardActivation(
  event: React.KeyboardEvent,
  onActivate: () => void
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
}

/**
 * Handle Escape key for dismissing modals/dialogs
 * 
 * @param event - Keyboard event
 * @param onEscape - Callback when Escape is pressed
 */
export function handleEscapeKey(
  event: React.KeyboardEvent,
  onEscape: () => void
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onEscape();
  }
}

/**
 * Generate accessible label for search results count
 * 
 * @param count - Number of results
 * @param type - Type of results (papers, videos, etc.)
 * @returns Accessible announcement text
 */
export function getSearchResultsAnnouncement(
  count: number,
  type: string = 'results'
): string {
  if (count === 0) {
    return `No ${type} found`;
  }
  if (count === 1) {
    return `1 ${type.replace(/s$/, '')} found`;
  }
  return `${count} ${type} found`;
}

/**
 * Generate accessible label for loading states
 * 
 * @param isLoading - Whether content is loading
 * @param itemType - Type of content being loaded
 * @returns Accessible announcement text
 */
export function getLoadingAnnouncement(
  isLoading: boolean,
  itemType: string = 'content'
): string {
  return isLoading ? `Loading ${itemType}, please wait` : `${itemType} loaded`;
}

/**
 * Generate accessible label for pagination
 * 
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @returns Accessible announcement text
 */
export function getPaginationAnnouncement(
  currentPage: number,
  totalPages: number
): string {
  return `Page ${currentPage} of ${totalPages}`;
}

/**
 * Focus trap handler for modals
 * Returns cleanup function to be called in useEffect
 * 
 * USAGE:
 * ```tsx
 * useEffect(() => {
 *   if (!isOpen) return;
 *   return setupFocusTrap(modalRef, isOpen);
 * }, [isOpen]);
 * ```
 * 
 * @param containerRef - Ref to container element
 * @param isActive - Whether trap is active
 * @returns Cleanup function
 */
export function setupFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
): (() => void) | undefined {
  if (typeof window === 'undefined') return;
  if (!isActive) return;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!containerRef.current) return;
    if (event.key !== 'Tab') return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Auto-focus element when component mounts
 * Call this in a useEffect
 * 
 * USAGE:
 * ```tsx
 * const inputRef = useRef<HTMLInputElement>(null);
 * useEffect(() => {
 *   autoFocusElement(inputRef, shouldFocus);
 * }, [shouldFocus]);
 * ```
 * 
 * @param ref - Ref to element to focus
 * @param shouldFocus - Whether to focus (default: true)
 */
export function autoFocusElement(
  ref: React.RefObject<HTMLElement>,
  shouldFocus: boolean = true
): void {
  if (typeof window === 'undefined') return;
  if (!shouldFocus || !ref.current) return;

  // Small delay to ensure DOM is ready
  setTimeout(() => {
    ref.current?.focus();
  }, 10);
}

/**
 * Generate unique ID for form labels
 * Ensures label-input association for screen readers
 * 
 * USAGE:
 * ```tsx
 * const id = useMemo(() => generateUniqueId('input'), []);
 * <label htmlFor={id}>Name</label>
 * <input id={id} />
 * ```
 * 
 * @param prefix - Prefix for ID
 * @returns Unique ID
 */
let idCounter = 0;
export function generateUniqueId(prefix: string = 'a11y'): string {
  if (typeof window === 'undefined') return `${prefix}-ssr`;
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Check if element has sufficient color contrast (WCAG AA)
 * Minimum ratio: 4.5:1 for normal text, 3:1 for large text
 * 
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast is sufficient
 */
export function hassufficientContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const minRatio = isLargeText ? 3 : 4.5;
  return ratio >= minRatio;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula
 * 
 * @param color1 - First color (hex)
 * @param color2 - Second color (hex)
 * @returns Contrast ratio
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 * 
 * @param hex - Color in hex format
 * @returns Relative luminance (0-1)
 */
function getRelativeLuminance(hex: string): number {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Screen reader only text (visually hidden but accessible)
 * Use with CSS class .sr-only
 */
export const SR_ONLY_CLASS = 'sr-only';

/**
 * Get ARIA role for component type
 * 
 * @param type - Component type
 * @returns ARIA role
 */
export function getAriaRole(type: 'list' | 'listitem' | 'dialog' | 'alert' | 'status' | 'navigation' | 'search' | 'main' | 'complementary' | 'form' | 'button' | 'link'): string {
  return type;
}

/**
 * Generate ARIA label for button with action and context
 * 
 * @param action - Action (e.g., "Delete", "Edit")
 * @param itemType - Type of item (e.g., "paper", "theme")
 * @param itemName - Name of item (optional)
 * @returns Accessible label
 */
export function generateButtonAriaLabel(
  action: string,
  itemType: string,
  itemName?: string
): string {
  if (itemName) {
    return `${action} ${itemType}: ${itemName}`;
  }
  return `${action} ${itemType}`;
}

/**
 * Announce dynamic content to screen readers
 * Uses ARIA live region
 * 
 * @param message - Message to announce
 * @param priority - Priority level (polite/assertive)
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof window === 'undefined') return;

  // Create or get live region
  let liveRegion = document.getElementById('a11y-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Update live region (with small delay to ensure screen readers catch it)
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);

  // Clear after 3 seconds
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 3100);
}

/**
 * Skip to main content link
 * Should be first focusable element on page
 * 
 * @param targetId - ID of main content element
 * @returns Props for skip link
 */
export function getSkipLinkProps(targetId: string = 'main-content') {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded',
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
  };
}

