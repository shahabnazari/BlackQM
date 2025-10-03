import { useEffect, useRef, useCallback, useState } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  arrowKeys?: boolean;
  tabbing?: boolean;
  shortcuts?: Record<string, () => void>;
  focusTrap?: boolean;
  escapeDeactivates?: boolean;
  announceNavigation?: boolean;
  wrapAround?: boolean;
  skipDisabled?: boolean;
  rememberLastFocus?: boolean;
}

interface NavigableElement {
  element: HTMLElement;
  index: number;
  groupId?: string;
  label?: string;
}

export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const {
    enabled = true,
    arrowKeys = true,
    tabbing = true,
    shortcuts = {},
    focusTrap = false,
    escapeDeactivates = true,
    announceNavigation = true,
    wrapAround = true,
    skipDisabled = true,
    rememberLastFocus = true
  } = options;

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isActive, setIsActive] = useState(false);
  const navigableElements = useRef<NavigableElement[]>([]);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const announceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get all navigable elements within container
  const updateNavigableElements = useCallback(() => {
    if (!containerRef.current) return;

    const selector = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[role="checkbox"]:not([disabled])',
      '[role="radio"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
      '[role="option"]:not([disabled])',
      '[role="switch"]:not([disabled])'
    ].join(', ');

    const elements = Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector));
    
    // Filter out disabled elements if skipDisabled is true
    const filtered = skipDisabled 
      ? elements.filter(el => {
          const isDisabled = el.getAttribute('aria-disabled') === 'true' ||
                           el.hasAttribute('disabled') ||
                           el.classList.contains('disabled');
          const isHidden = el.getAttribute('aria-hidden') === 'true' ||
                          window.getComputedStyle(el).display === 'none' ||
                          window.getComputedStyle(el).visibility === 'hidden';
          return !isDisabled && !isHidden;
        })
      : elements;

    navigableElements.current = filtered.map((element, index) => ({
      element,
      index,
      groupId: element.getAttribute('data-group-id') || '',
      label: element.getAttribute('aria-label') || 
             element.textContent?.trim().substring(0, 50) || 
             'Unnamed element'
    }));
  }, [containerRef, skipDisabled]);

  // Announce to screen reader
  const announce = useCallback((message: string) => {
    if (!announceNavigation) return;

    // Clear previous announcement timeout
    if (announceTimeout.current) {
      clearTimeout(announceTimeout.current);
    }

    // Create or update aria-live region
    let liveRegion = document.getElementById('keyboard-nav-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'keyboard-nav-announcer';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;

    // Clear after announcement
    announceTimeout.current = setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [announceNavigation]);

  // Focus element at index
  const focusElement = useCallback((index: number) => {
    const element = navigableElements.current[index];
    if (!element) return;

    element.element.focus();
    setCurrentIndex(index);

    if (rememberLastFocus) {
      lastFocusedElement.current = element.element;
    }

    // Announce navigation
    if (announceNavigation) {
      const message = `Navigated to ${element.label}, ${index + 1} of ${navigableElements.current.length}`;
      announce(message);
    }

    // Scroll into view if needed
    element.element.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth'
    });
  }, [announceNavigation, announce, rememberLastFocus]);

  // Navigate to next element
  const navigateNext = useCallback(() => {
    updateNavigableElements();
    if (navigableElements.current.length === 0) return;

    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= navigableElements.current.length) {
      nextIndex = wrapAround ? 0 : navigableElements.current.length - 1;
    }

    focusElement(nextIndex);
  }, [currentIndex, wrapAround, updateNavigableElements, focusElement]);

  // Navigate to previous element
  const navigatePrevious = useCallback(() => {
    updateNavigableElements();
    if (navigableElements.current.length === 0) return;

    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = wrapAround ? navigableElements.current.length - 1 : 0;
    }

    focusElement(prevIndex);
  }, [currentIndex, wrapAround, updateNavigableElements, focusElement]);

  // Navigate to first element
  const navigateFirst = useCallback(() => {
    updateNavigableElements();
    if (navigableElements.current.length === 0) return;
    focusElement(0);
  }, [updateNavigableElements, focusElement]);

  // Navigate to last element
  const navigateLast = useCallback(() => {
    updateNavigableElements();
    if (navigableElements.current.length === 0) return;
    focusElement(navigableElements.current.length - 1);
  }, [updateNavigableElements, focusElement]);

  // Navigate by group
  const navigateToGroup = useCallback((groupId: string, direction: 'next' | 'prev' = 'next') => {
    updateNavigableElements();
    
    const groups = navigableElements.current.filter(el => el.groupId === groupId);
    if (groups.length === 0) return;

    const currentGroupIndex = groups.findIndex(el => el.index === currentIndex);
    
    let targetIndex: number;
    if (direction === 'next') {
      targetIndex = currentGroupIndex + 1 >= groups.length ? 0 : currentGroupIndex + 1;
    } else {
      targetIndex = currentGroupIndex - 1 < 0 ? groups.length - 1 : currentGroupIndex - 1;
    }

    const targetGroup = groups[targetIndex];
    if (targetGroup) {
      focusElement(targetGroup.index);
    }
  }, [currentIndex, updateNavigableElements, focusElement]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    // Check for custom shortcuts first
    const shortcutKey = Object.keys(shortcuts).find(key => {
      const parts = key.toLowerCase().split('+');
      const hasCtrl = parts.includes('ctrl') || parts.includes('cmd');
      const hasAlt = parts.includes('alt');
      const hasShift = parts.includes('shift');
      const mainKey = parts[parts.length - 1];

      return (
        (!hasCtrl || (e.ctrlKey || e.metaKey)) &&
        (!hasAlt || e.altKey) &&
        (!hasShift || e.shiftKey) &&
        e.key.toLowerCase() === mainKey
      );
    });

    if (shortcutKey) {
      const shortcutFn = shortcuts[shortcutKey];
      if (shortcutFn) {
        e.preventDefault();
        shortcutFn();
        return;
      }
    }

    // Handle arrow key navigation
    if (arrowKeys) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          if (containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            navigateNext();
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          if (containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            navigatePrevious();
          }
          break;
        case 'Home':
          if (containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            navigateFirst();
          }
          break;
        case 'End':
          if (containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            navigateLast();
          }
          break;
      }
    }

    // Handle tab navigation with focus trap
    if (tabbing && focusTrap && e.key === 'Tab') {
      updateNavigableElements();
      if (navigableElements.current.length === 0) return;

      const firstNavElement = navigableElements.current[0];
      const lastNavElement = navigableElements.current[navigableElements.current.length - 1];
      if (!firstNavElement || !lastNavElement) return;

      const firstElement = firstNavElement.element;
      const lastElement = lastNavElement.element;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Handle escape key
    if (escapeDeactivates && e.key === 'Escape') {
      setIsActive(false);
      if (lastFocusedElement.current) {
        lastFocusedElement.current.blur();
      }
      announce('Navigation deactivated');
    }

    // Quick search by typing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const char = e.key.toLowerCase();
      updateNavigableElements();
      
      // Find next element starting with typed character
      const startIndex = currentIndex + 1;
      let foundIndex = -1;

      for (let i = 0; i < navigableElements.current.length; i++) {
        const index = (startIndex + i) % navigableElements.current.length;
        const element = navigableElements.current[index];
        if (element && element.label?.toLowerCase().startsWith(char)) {
          foundIndex = index;
          break;
        }
      }

      if (foundIndex !== -1) {
        focusElement(foundIndex);
      }
    }
  }, [
    enabled,
    containerRef,
    shortcuts,
    arrowKeys,
    tabbing,
    focusTrap,
    escapeDeactivates,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    updateNavigableElements,
    currentIndex,
    focusElement,
    announce
  ]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Initial setup
    updateNavigableElements();
    setIsActive(true);

    // Add keyboard event listener
    const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
    container.addEventListener('keydown', handleKeyDownWrapper);

    // Handle focus events
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!container.contains(target)) return;

      const index = navigableElements.current.findIndex(el => el.element === target);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    };

    container.addEventListener('focusin', handleFocus);

    // Mutation observer to update navigable elements when DOM changes
    const observer = new MutationObserver(() => {
      updateNavigableElements();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'aria-hidden', 'hidden']
    });

    return () => {
      container.removeEventListener('keydown', handleKeyDownWrapper);
      container.removeEventListener('focusin', handleFocus);
      observer.disconnect();
      
      if (announceTimeout.current) {
        clearTimeout(announceTimeout.current);
      }
    };
  }, [enabled, containerRef, handleKeyDown, updateNavigableElements]);

  return {
    currentIndex,
    isActive,
    navigableCount: navigableElements.current.length,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    navigateToGroup,
    focusElement,
    activate: () => setIsActive(true),
    deactivate: () => setIsActive(false),
    getCurrentElement: () => navigableElements.current[currentIndex],
    getAllElements: () => navigableElements.current,
    refreshElements: updateNavigableElements
  };
};