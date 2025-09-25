'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface AccessibleTooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  persistent?: boolean;
  shortcut?: string;
  richContent?: boolean;
  delay?: number;
  id?: string;
}

export function AccessibleTooltip({
  children,
  content,
  className,
  position = 'top',
  persistent = false,
  shortcut,
  richContent = false,
  delay = 300,
  id,
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isKeyboardActivated, setIsKeyboardActivated] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [tooltipPrefs, setTooltipPrefs] = useState({
    enabled: true,
    showKeyboardHints: true,
  });

  const targetRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('tooltipPreferences');
    if (savedPrefs) {
      setTooltipPrefs(JSON.parse(savedPrefs));
    }
  }, []);

  // Calculate position
  useEffect(() => {
    if (isVisible && targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
      let y = targetRect.top - tooltipRect.height - 12;

      switch (position) {
        case 'bottom':
          y = targetRect.bottom + 12;
          break;
        case 'left':
          x = targetRect.left - tooltipRect.width - 12;
          y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = targetRect.right + 12;
          y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip in viewport
      const padding = 16;
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  const showTooltip = useCallback((isKeyboard = false) => {
    if (!tooltipPrefs.enabled && !isKeyboard) return;
    
    if (persistent && id) {
      const dismissedTooltips = JSON.parse(
        localStorage.getItem('dismissedTooltips') || '[]'
      );
      if (dismissedTooltips.includes(id)) return;
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setIsKeyboardActivated(isKeyboard);
    }, isKeyboard ? 0 : delay);
  }, [tooltipPrefs.enabled, persistent, id, delay]);

  const hideTooltip = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
    setIsKeyboardActivated(false);
  }, []);

  const dismissPersistent = useCallback(() => {
    if (persistent && id) {
      const dismissedTooltips = JSON.parse(
        localStorage.getItem('dismissedTooltips') || '[]'
      );
      dismissedTooltips.push(id);
      localStorage.setItem('dismissedTooltips', JSON.stringify(dismissedTooltips));
      hideTooltip();
    }
  }, [persistent, id, hideTooltip]);

  // Keyboard event handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) {
      hideTooltip();
      e.preventDefault();
    }
    
    // Show tooltip with F1 or ?
    if ((e.key === 'F1' || (e.key === '?' && e.shiftKey)) && !isVisible) {
      showTooltip(true);
      e.preventDefault();
    }
  }, [isVisible, showTooltip, hideTooltip]);

  const handleFocus = useCallback(() => {
    if (tooltipPrefs.showKeyboardHints) {
      showTooltip(true);
    }
  }, [tooltipPrefs.showKeyboardHints, showTooltip]);

  const handleBlur = useCallback(() => {
    if (isKeyboardActivated) {
      hideTooltip();
    }
  }, [isKeyboardActivated, hideTooltip]);

  const enrichedChildren = React.cloneElement(children, {
    ref: targetRef,
    onMouseEnter: () => showTooltip(false),
    onMouseLeave: hideTooltip,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    tabIndex: children.props.tabIndex ?? 0,
    'aria-describedby': isVisible ? `tooltip-${id}` : undefined,
    role: children.props.role ?? 'button',
  });

  return (
    <>
      {enrichedChildren}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            id={`tooltip-${id}`}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'fixed z-[100] px-4 py-3 text-sm bg-gray-900 dark:bg-gray-100',
              'text-white dark:text-gray-900 rounded-xl shadow-2xl',
              'pointer-events-none select-none',
              richContent && 'max-w-md',
              className
            )}
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
            }}
          >
            <div className="relative">
              {richContent ? (
                <div className="space-y-2">
                  {content}
                </div>
              ) : (
                content
              )}
              
              {/* Keyboard hints */}
              {isKeyboardActivated && (
                <div className="mt-2 pt-2 border-t border-gray-700 dark:border-gray-300 text-xs opacity-75">
                  Press <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 rounded">Esc</kbd> to close
                </div>
              )}

              {/* Shortcut hint */}
              {shortcut && (
                <div className="mt-2 text-xs opacity-75">
                  Shortcut: <kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-200 rounded">{shortcut}</kbd>
                </div>
              )}

              {/* Persistent dismiss */}
              {persistent && (
                <button
                  onClick={dismissPersistent}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 dark:bg-gray-300 
                             rounded-full flex items-center justify-center pointer-events-auto
                             hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors"
                  aria-label="Dismiss tooltip"
                >
                  <span className="text-white dark:text-gray-900 text-xs">×</span>
                </button>
              )}
            </div>

            {/* Arrow pointer */}
            <div
              className={cn(
                'absolute w-0 h-0 border-transparent',
                position === 'top' && 'bottom-[-8px] left-1/2 -translate-x-1/2 border-t-8 border-l-8 border-r-8 border-t-gray-900 dark:border-t-gray-100',
                position === 'bottom' && 'top-[-8px] left-1/2 -translate-x-1/2 border-b-8 border-l-8 border-r-8 border-b-gray-900 dark:border-b-gray-100',
                position === 'left' && 'right-[-8px] top-1/2 -translate-y-1/2 border-l-8 border-t-8 border-b-8 border-l-gray-900 dark:border-l-gray-100',
                position === 'right' && 'left-[-8px] top-1/2 -translate-y-1/2 border-r-8 border-t-8 border-b-8 border-r-gray-900 dark:border-r-gray-100'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Rich content tooltip components
export function TooltipTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-semibold text-base mb-1">{children}</h4>;
}

export function TooltipDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm opacity-90">{children}</p>;
}

export function TooltipImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-auto rounded-lg mt-2"
    />
  );
}

export function TooltipChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 p-2 bg-gray-800 dark:bg-gray-200 rounded">
      {children}
    </div>
  );
}