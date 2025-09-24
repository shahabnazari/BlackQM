import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Save,
  Eye,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Sheet components since they may not exist
const Sheet = ({ open, children }: any) => {
  if (!open) return null;
  return <>{children}</>;
};
const SheetTrigger = ({ asChild, children }: any) => {
  if (asChild) return children;
  return <>{children}</>;
};
const SheetContent = ({ side, className, children }: any) => (
  <div
    className={`fixed inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-80 bg-background border-r p-6 z-50 ${className}`}
  >
    {children}
  </div>
);
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MobileQuestionnaireWrapperProps {
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  questionnaireName?: string;
  questionnaireId?: string;
  onSave?: () => void;
  onPreview?: () => void;
  isOffline?: boolean;
  className?: string;
}

export const MobileQuestionnaireWrapper: React.FC<
  MobileQuestionnaireWrapperProps
> = ({
  children,
  currentStep = 1,
  totalSteps = 1,
  onStepChange,
  questionnaireName = 'Questionnaire',
  questionnaireId,
  onSave,
  onPreview,
  isOffline = false,
  className,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect device type and orientation
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    // Check accessibility preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchStartX(e.targetTouches[0].clientX);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchEndX(e.targetTouches[0].clientX);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentStep < totalSteps) {
      onStepChange?.(currentStep + 1);
    }
    if (isRightSwipe && currentStep > 1) {
      onStepChange?.(currentStep - 1);
    }
  }, [touchStartX, touchEndX, currentStep, totalSteps, onStepChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (currentStep > 1 && onStepChange) onStepChange(currentStep - 1);
          break;
        case 'ArrowRight':
          if (currentStep < totalSteps && onStepChange)
            onStepChange(currentStep + 1);
          break;
        case 'Escape':
          setIsMenuOpen(false);
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyboardMode, currentStep, totalSteps, onStepChange]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || isOffline) return;

    autoSaveTimerRef.current = setInterval(() => {
      handleSave();
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, isOffline]);

  const handleSave = useCallback(() => {
    if (isOffline) {
      // Save to localStorage for offline mode
      const offlineData = {
        questionnaireId,
        questionnaireName,
        currentStep,
        timestamp: new Date().toISOString(),
        data: {}, // Add actual form data here
      };
      localStorage.setItem(
        `offline_questionnaire_${questionnaireId}`,
        JSON.stringify(offlineData)
      );
      toast.success('Saved locally (offline mode)');
    } else {
      onSave?.();
      setLastSaveTime(new Date());
      toast.success('Questionnaire saved');
    }
  }, [isOffline, questionnaireId, questionnaireName, currentStep, onSave]);

  const progress = (currentStep / totalSteps) * 100;

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'min-h-screen bg-background transition-all duration-300',
        fontSizeClasses[fontSize as keyof typeof fontSizeClasses],
        highContrast && 'contrast-150',
        reducedMotion && 'motion-reduce',
        className
      )}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <nav
                className="space-y-4"
                role="navigation"
                aria-label="Main menu"
              >
                <h2 className="text-lg font-semibold">{questionnaireName}</h2>

                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleSave}
                    disabled={isOffline}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Progress
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onPreview}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">Accessibility</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Font Size</span>
                      <select
                        value={fontSize}
                        onChange={e => setFontSize(e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                        aria-label="Font size"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">Extra Large</option>
                      </select>
                    </div>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={e => setHighContrast(e.target.checked)}
                        aria-label="High contrast mode"
                      />
                      <span className="text-sm">High Contrast</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={e => setReducedMotion(e.target.checked)}
                        aria-label="Reduced motion"
                      />
                      <span className="text-sm">Reduced Motion</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={keyboardMode}
                        onChange={e => setKeyboardMode(e.target.checked)}
                        aria-label="Keyboard navigation"
                      />
                      <span className="text-sm">Keyboard Navigation</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={e => setAutoSaveEnabled(e.target.checked)}
                        aria-label="Auto-save"
                      />
                      <span className="text-sm">Auto-save</span>
                    </label>
                  </div>
                </div>

                {lastSaveTime && (
                  <div className="text-xs text-muted-foreground">
                    Last saved: {lastSaveTime.toLocaleTimeString()}
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold truncate px-4">
              {questionnaireName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOffline ? (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <Progress
          value={progress}
          className="h-1"
          aria-label={`Progress: ${Math.round(progress)}%`}
        />
      </header>

      {/* Main content area */}
      <main
        className={cn(
          'flex-1',
          isMobile ? 'px-4 py-6' : 'container mx-auto px-6 py-8',
          orientation === 'landscape' && isMobile && 'py-4'
        )}
        role="main"
        aria-live="polite"
      >
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      {/* Mobile navigation footer */}
      {isMobile && (
        <footer className="sticky bottom-0 bg-background border-t p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => onStepChange?.(currentStep - 1)}
              disabled={currentStep === 1}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm font-medium" aria-live="polite">
              {currentStep} / {totalSteps}
            </span>

            <Button
              variant="default"
              onClick={() => onStepChange?.(currentStep + 1)}
              disabled={currentStep === totalSteps}
              aria-label="Next step"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Touch gesture hint */}
          {isMobile && currentStep === 1 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Swipe left or right to navigate
            </p>
          )}
        </footer>
      )}

      {/* Skip to main content link for screen readers */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-background p-2 rounded"
      >
        Skip to main content
      </a>
    </div>
  );
};
