'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Check,
  Eye,
  Navigation,
  Palette,
  Type,
  Volume2,
  X,
} from 'lucide-react';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

interface AccessibilitySettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  contrast: 'normal' | 'high' | 'ultra';
  colorBlindMode:
    | 'none'
    | 'protanopia'
    | 'deuteranopia'
    | 'tritanopia'
    | 'monochrome';
  reducedMotion: boolean;
  focusIndicator: 'default' | 'enhanced' | 'custom';
  keyboardNavigation: boolean;
  screenReaderMode: boolean;
  readingGuide: boolean;
  textToSpeech: boolean;
  speechRate: number;
  autoFocus: boolean;
  skipLinks: boolean;
  landmarkNavigation: boolean;
  announcements: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  customColors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
  };
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  announceToScreenReader: (
    message: string,
    priority?: 'polite' | 'assertive'
  ) => void;
  focusTrap: (element: HTMLElement | null) => void;
  releaseFocusTrap: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  contrast: 'normal',
  colorBlindMode: 'none',
  reducedMotion: false,
  focusIndicator: 'default',
  keyboardNavigation: true,
  screenReaderMode: false,
  readingGuide: false,
  textToSpeech: false,
  speechRate: 1,
  autoFocus: true,
  skipLinks: true,
  landmarkNavigation: true,
  announcements: true,
  hapticFeedback: false,
  darkMode: false,
  customColors: {
    background: '#ffffff',
    text: '#000000',
    primary: '#007bff',
    secondary: '#6c757d',
  },
};

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within AccessibilityProvider'
    );
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const ariaLiveRegion = useRef<HTMLDivElement>(null);
  const focusTrapStack = useRef<HTMLElement[]>([]);
  const originalFocusElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Apply font settings
    root.style.setProperty('--base-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--line-height', `${settings.lineHeight}`);
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);
    root.style.setProperty('--word-spacing', `${settings.wordSpacing}px`);

    // Apply contrast settings
    root.setAttribute('data-contrast', settings.contrast);

    // Apply color blind mode
    root.setAttribute('data-colorblind', settings.colorBlindMode);

    // Apply motion preferences
    root.setAttribute(
      'data-reduced-motion',
      settings.reducedMotion ? 'true' : 'false'
    );

    // Apply focus indicator style
    root.setAttribute('data-focus-indicator', settings.focusIndicator);

    // Apply dark mode
    root.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');

    // Apply custom colors if set
    if (settings.customColors) {
      root.style.setProperty(
        '--color-background',
        settings.customColors.background
      );
      root.style.setProperty('--color-text', settings.customColors.text);
      root.style.setProperty('--color-primary', settings.customColors.primary);
      root.style.setProperty(
        '--color-secondary',
        settings.customColors.secondary
      );
    }

    // Update meta viewport for mobile accessibility
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes'
    );
  };

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast.success('Accessibility settings reset to defaults');
  };

  const announceToScreenReader = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!ariaLiveRegion.current) return;

    ariaLiveRegion.current.setAttribute('aria-live', priority);
    ariaLiveRegion.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (ariaLiveRegion.current) {
        ariaLiveRegion.current.textContent = '';
      }
    }, 1000);
  };

  const focusTrap = (element: HTMLElement | null) => {
    if (!element) return;

    originalFocusElement.current = document.activeElement as HTMLElement;
    focusTrapStack.current.push(element);

    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();
  };

  const releaseFocusTrap = () => {
    const element = focusTrapStack.current.pop();
    if (element) {
      // Remove event listeners
      const newElement = element.cloneNode(true) as HTMLElement;
      element.parentNode?.replaceChild(newElement, element);
    }

    if (originalFocusElement.current) {
      originalFocusElement.current.focus();
      originalFocusElement.current = null;
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        announceToScreenReader,
        focusTrap,
        releaseFocusTrap,
      }}
    >
      {children}
      {/* Screen reader announcements region */}
      <div
        ref={ariaLiveRegion}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    </AccessibilityContext.Provider>
  );
};

interface AccessibilityPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen = false,
  onClose,
  className,
}) => {
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const [wcagLevel] = useState<'A' | 'AA' | 'AAA'>('AAA');
  const [complianceScore, setComplianceScore] = useState(0);

  useEffect(() => {
    calculateComplianceScore();
  }, [settings]);

  const calculateComplianceScore = () => {
    let score = 0;
    const checks = [
      settings.fontSize >= 16,
      settings.lineHeight >= 1.5,
      settings.contrast !== 'normal',
      settings.focusIndicator !== 'default',
      settings.keyboardNavigation,
      settings.skipLinks,
      settings.landmarkNavigation,
      settings.announcements,
    ];

    score = (checks.filter(Boolean).length / checks.length) * 100;
    setComplianceScore(score);
  };

  const presets = {
    'Low Vision': {
      fontSize: 20,
      lineHeight: 1.8,
      letterSpacing: 0.5,
      contrast: 'high' as const,
      focusIndicator: 'enhanced' as const,
    },
    Dyslexia: {
      fontSize: 18,
      lineHeight: 2,
      letterSpacing: 1,
      wordSpacing: 2,
      customColors: {
        background: '#FFFBF0',
        text: '#1A1A1A',
        primary: '#007bff',
        secondary: '#6c757d',
      },
    },
    'Keyboard Only': {
      keyboardNavigation: true,
      focusIndicator: 'enhanced' as const,
      skipLinks: true,
      autoFocus: true,
      landmarkNavigation: true,
    },
    'Screen Reader': {
      screenReaderMode: true,
      announcements: true,
      skipLinks: true,
      landmarkNavigation: true,
      textToSpeech: true,
    },
  };

  const applyPreset = (presetName: keyof typeof presets) => {
    updateSettings(presets[presetName] as Partial<AccessibilitySettings>);
    toast.success(`Applied ${presetName} preset`);
  };

  if (!isOpen) return null;

  return (
    <Card
      className={cn(
        'fixed right-4 top-20 w-96 max-h-[80vh] overflow-y-auto z-50 shadow-xl',
        className
      )}
    >
      <CardHeader className="sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility Settings
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Badge
            variant={
              complianceScore >= 80
                ? 'default'
                : complianceScore >= 60
                  ? 'secondary'
                  : 'destructive'
            }
          >
            WCAG {wcagLevel} Compliance: {Math.round(complianceScore)}%
          </Badge>
          <Button variant="outline" size="sm" onClick={resetSettings}>
            Reset All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(presets).map(preset => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset as keyof typeof presets)}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        {/* Text Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Settings
          </h3>

          <div className="space-y-2">
            <Label>Font Size: {settings.fontSize}px</Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) =>
                value !== undefined && updateSettings({ fontSize: value })
              }
              min={12}
              max={32}
              step={1}
              aria-label="Font size"
            />
          </div>

          <div className="space-y-2">
            <Label>Line Height: {settings.lineHeight}</Label>
            <Slider
              value={[settings.lineHeight]}
              onValueChange={([value]) =>
                value !== undefined && updateSettings({ lineHeight: value })
              }
              min={1}
              max={3}
              step={0.1}
              aria-label="Line height"
            />
          </div>

          <div className="space-y-2">
            <Label>Letter Spacing: {settings.letterSpacing}px</Label>
            <Slider
              value={[settings.letterSpacing]}
              onValueChange={([value]) =>
                value !== undefined && updateSettings({ letterSpacing: value })
              }
              min={0}
              max={5}
              step={0.5}
              aria-label="Letter spacing"
            />
          </div>
        </div>

        {/* Visual Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Visual Settings
          </h3>

          <div className="space-y-2">
            <Label>Contrast Level</Label>
            <select
              value={settings.contrast}
              onChange={e =>
                updateSettings({ contrast: e.target.value as any })
              }
              className="w-full border rounded px-3 py-2"
              aria-label="Contrast level"
            >
              <option value="normal">Normal</option>
              <option value="high">High (WCAG AA)</option>
              <option value="ultra">Ultra High (WCAG AAA)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Color Blind Mode</Label>
            <select
              value={settings.colorBlindMode}
              onChange={e =>
                updateSettings({ colorBlindMode: e.target.value as any })
              }
              className="w-full border rounded px-3 py-2"
              aria-label="Color blind mode"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-Green)</option>
              <option value="deuteranopia">Deuteranopia (Green-Red)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={checked => updateSettings({ darkMode: checked })}
              aria-label="Dark mode"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion">Reduced Motion</Label>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={checked =>
                updateSettings({ reducedMotion: checked })
              }
              aria-label="Reduced motion"
            />
          </div>
        </div>

        {/* Navigation Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Navigation Settings
          </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
            <Switch
              id="keyboard-nav"
              checked={settings.keyboardNavigation}
              onCheckedChange={checked =>
                updateSettings({ keyboardNavigation: checked })
              }
              aria-label="Keyboard navigation"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="skip-links">Skip Links</Label>
            <Switch
              id="skip-links"
              checked={settings.skipLinks}
              onCheckedChange={checked =>
                updateSettings({ skipLinks: checked })
              }
              aria-label="Skip links"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-focus">Auto Focus</Label>
            <Switch
              id="auto-focus"
              checked={settings.autoFocus}
              onCheckedChange={checked =>
                updateSettings({ autoFocus: checked })
              }
              aria-label="Auto focus"
            />
          </div>

          <div className="space-y-2">
            <Label>Focus Indicator</Label>
            <select
              value={settings.focusIndicator}
              onChange={e =>
                updateSettings({ focusIndicator: e.target.value as any })
              }
              className="w-full border rounded px-3 py-2"
              aria-label="Focus indicator style"
            >
              <option value="default">Default</option>
              <option value="enhanced">Enhanced (WCAG AA)</option>
              <option value="custom">Custom (WCAG AAA)</option>
            </select>
          </div>
        </div>

        {/* Screen Reader Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Screen Reader Settings
          </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="screen-reader">Screen Reader Mode</Label>
            <Switch
              id="screen-reader"
              checked={settings.screenReaderMode}
              onCheckedChange={checked =>
                updateSettings({ screenReaderMode: checked })
              }
              aria-label="Screen reader mode"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="announcements">Live Announcements</Label>
            <Switch
              id="announcements"
              checked={settings.announcements}
              onCheckedChange={checked =>
                updateSettings({ announcements: checked })
              }
              aria-label="Live announcements"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tts">Text to Speech</Label>
            <Switch
              id="tts"
              checked={settings.textToSpeech}
              onCheckedChange={checked =>
                updateSettings({ textToSpeech: checked })
              }
              aria-label="Text to speech"
            />
          </div>

          {settings.textToSpeech && (
            <div className="space-y-2">
              <Label>Speech Rate: {settings.speechRate}x</Label>
              <Slider
                value={[settings.speechRate]}
                onValueChange={([value]) =>
                  value !== undefined && updateSettings({ speechRate: value })
                }
                min={0.5}
                max={2}
                step={0.1}
                aria-label="Speech rate"
              />
            </div>
          )}
        </div>

        {/* Additional Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold">Additional Features</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="reading-guide">Reading Guide</Label>
            <Switch
              id="reading-guide"
              checked={settings.readingGuide}
              onCheckedChange={checked =>
                updateSettings({ readingGuide: checked })
              }
              aria-label="Reading guide"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="haptic">Haptic Feedback</Label>
            <Switch
              id="haptic"
              checked={settings.hapticFeedback}
              onCheckedChange={checked =>
                updateSettings({ hapticFeedback: checked })
              }
              aria-label="Haptic feedback"
            />
          </div>
        </div>

        {/* WCAG Compliance Info */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">WCAG Compliance Status</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {settings.fontSize >= 16 ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>Minimum font size (16px)</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.lineHeight >= 1.5 ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>Line height (≥1.5)</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.contrast !== 'normal' ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>Enhanced contrast</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.keyboardNavigation ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>Keyboard accessible</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.skipLinks ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>Skip navigation links</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
