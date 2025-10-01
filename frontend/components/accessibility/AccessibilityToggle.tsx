'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accessibility } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AccessibilityPanel } from './AccessibilityManager';

interface AccessibilityToggleProps {
  className?: string;
  position?: 'fixed' | 'relative';
  showLabel?: boolean;
}

/**
 * Accessibility Toggle Button
 * Provides quick access to accessibility settings panel
 * Keyboard shortcut: Alt + A
 */
export const AccessibilityToggle: React.FC<AccessibilityToggleProps> = ({
  className,
  position = 'fixed',
  showLabel = false,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A to toggle accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setIsPanelOpen(prev => !prev);
      }
      // Alt + Shift + A to hide/show the toggle button
      if (e.altKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide button after panel opens (optional)
  useEffect(() => {
    if (isPanelOpen && position === 'fixed') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isPanelOpen, position]);

  if (!isVisible && position === 'fixed') {
    // Show a small indicator when hidden
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={cn(
          'fixed bottom-4 right-4 w-2 h-8',
          'bg-primary/20 hover:bg-primary/40',
          'rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
        aria-label="Show accessibility options"
      />
    );
  }

  const buttonClasses = cn(
    position === 'fixed' && 'fixed bottom-4 right-4 z-40',
    'transition-all duration-200',
    className
  );

  return (
    <>
      <Button
        variant={isPanelOpen ? 'default' : 'outline'}
        size={showLabel ? 'default' : 'icon'}
        className={buttonClasses}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        aria-label="Accessibility settings"
        aria-expanded={isPanelOpen}
        aria-keyshortcuts="Alt+A"
        title="Accessibility Settings (Alt + A)"
      >
        <Accessibility className={cn('h-5 w-5', showLabel && 'mr-2')} />
        {showLabel && <span>Accessibility</span>}
      </Button>

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
};

/**
 * Minimal Accessibility Indicator
 * Shows current accessibility status without full toggle
 */
export const AccessibilityIndicator: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('accessibilitySettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  if (!settings) return null;

  const hasAccessibilityFeatures =
    settings.fontSize > 16 ||
    settings.contrast !== 'normal' ||
    settings.colorBlindMode !== 'none' ||
    settings.screenReaderMode ||
    settings.reducedMotion;

  if (!hasAccessibilityFeatures) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1',
        'text-xs font-medium',
        'bg-primary/10 text-primary rounded-full',
        className
      )}
      role="status"
      aria-label="Accessibility features active"
    >
      <Accessibility className="h-3 w-3" />
      <span>A11y Active</span>
    </div>
  );
};

export default AccessibilityToggle;
