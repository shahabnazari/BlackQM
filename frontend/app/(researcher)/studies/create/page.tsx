'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { TextField } from '@/components/apple-ui/TextField';
import RichTextEditor from '@/components/editors/RichTextEditorV2';
import DigitalSignature from '@/components/signature/DigitalSignature';
import InfoTooltip from '@/components/tooltips/InfoTooltipV2';
import PopupModal, { usePopup } from '@/components/ui/PopupModal';
import { ToastContainer, useToast } from '@/components/ui/ToastNotification';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { apiHealthService } from '@/lib/services/api-health.service';
import debounce from 'lodash.debounce';
import { uploadLogo, uploadSignature } from '@/lib/services/upload.service';
import { DraftService } from '@/lib/services/draft.service';
import {
  welcomeTemplates,
  getTemplateById,
  fillTemplate,
} from '@/lib/templates/welcome-templates';
import {
  consentTemplates,
  getConsentTemplateById,
  fillConsentTemplate,
} from '@/lib/templates/consent-templates';
import {
  studyCreationTooltips,
  getTooltip,
} from '@/lib/tooltips/study-creation-tooltips';
import ParticipantPreview from '@/components/study-creation/ParticipantPreview';
import ResearcherSignature from '@/components/study-creation/ResearcherSignature';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Eye,
  Upload,
  Pen,
  Type,
  Check,
  X,
  Monitor,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Sparkles,
  AlertCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  matchesPlatformShortcut,
  getAriaKeyShortcuts,
  getPlatformShortcut,
  matchesShortcut,
} from '@/lib/utils/keyboard';
import { useShortcuts } from '@/lib/hooks/useShortcut';
import { AppleUIGridBuilderV5 as AppleUIGridBuilder } from '@/components/grid/AppleUIGridBuilderV5';
import { UploadProgressTracker } from '@/components/stimuli/UploadProgressTracker';
import {
  StimuliUploadSystemV7,
  type Stimulus,
} from '@/components/stimuli/StimuliUploadSystemV7';
import { ResizableImage } from '@/components/editors/ResizableImage';
import { useStudyBuilderStore } from '@/lib/stores/study-builder-store';
import { StudyCreationErrorBoundary } from '@/components/errors/ErrorBoundary';

interface EnhancedStudyConfig {
  // Basic Information
  title: string;
  description: string;

  // Welcome Configuration
  welcomeMessage: string;
  welcomeTemplateId?: string;
  includeWelcomeVideo: boolean;
  welcomeVideoUrl?: string;

  // Consent Configuration
  consentForm: string;
  consentTemplateId?: string;

  // Researcher Branding (for formal appearance)
  includeResearcherSignature: boolean;
  researcherName?: string;
  researcherTitle?: string;
  researcherSignatureUrl?: string;
  organizationName?: string;
  organizationLogoUrl?: string;
  brandingPosition: 'top' | 'bottom';

  // Q-Sort Configuration
  gridColumns: number;
  gridShape: 'forced' | 'free' | 'quasi-normal';

  // Stimuli Data
  stimuli?: Stimulus[];

  // Additional Features
  enablePreScreening: boolean;
  enablePostSurvey: boolean;
  enableVideoConferencing: boolean;
}

export default function EnhancedCreateStudyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const shortcuts = useShortcuts();
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [stimuli, setStimuli] = useState<Stimulus[]>([]);
  const [previewDevice, setPreviewDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [apiHealth, setApiHealth] = useState<
    'healthy' | 'degraded' | 'unhealthy'
  >('healthy');
  const { popupState, closePopup, showConfirm } = usePopup();
  const {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showAutoSave,
    toasts,
    removeToast,
  } = useToast();

  const [studyConfig, setStudyConfig] = useState<EnhancedStudyConfig>({
    title: '',
    description: '',
    welcomeMessage: '',
    welcomeTemplateId: undefined,
    includeWelcomeVideo: false,
    welcomeVideoUrl: '',
    consentForm: '',
    consentTemplateId: undefined,
    includeResearcherSignature: false,
    researcherName: '',
    researcherTitle: '',
    researcherSignatureUrl: '',
    organizationName: '',
    organizationLogoUrl: '',
    brandingPosition: 'bottom',
    gridColumns: 9,
    gridShape: 'quasi-normal',
    stimuli: [],
    enablePreScreening: false,
    enablePostSurvey: true,
    enableVideoConferencing: false,
  });

  // Draft management - initialize with a draft ID immediately
  const [draftId, setDraftId] = useState<string | null>(() =>
    DraftService.generateDraftId()
  );
  const [isDraft, setIsDraft] = useState(true);

  // Auto-save configuration - memoized to prevent unnecessary re-renders
  const autoSaveConfig = React.useMemo(
    () => ({
      ...studyConfig,
      stimuli: stimuli,
      gridConfig: gridConfig,
      currentStep: step,
    }),
    [studyConfig, stimuli, gridConfig, step]
  );

  // Use auto-save hook
  const { isAutoSaving, lastSaveTime, saveNow, hasUnsavedChanges } =
    useAutoSave(autoSaveConfig, draftId, {
      enabled: true,
      delay: 30000, // Auto-save every 30 seconds
      showNotifications: false, // We'll handle notifications manually
      onSave: async data => {
        if (!draftId) return; // Should not happen now but just in case

        DraftService.saveDraft(draftId, data); // Synchronous save to localStorage
        showSuccess('Draft saved'); // Unified message for both auto and manual save
        return Promise.resolve(); // Explicitly return resolved promise
      },
      validateBeforeSave: data => {
        // Only auto-save if there's meaningful content
        return (
          data.title?.length > 0 ||
          data.description?.length > 0 ||
          data.stimuli?.length > 0
        );
      },
    });

  // Initialize new study (clear any old drafts)
  useEffect(() => {
    // Check if we're loading a specific draft from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const loadDraftId = urlParams.get('draft');

    if (loadDraftId) {
      // Load specific draft
      const draft = DraftService.getDraft(loadDraftId);
      if (draft) {
        setStudyConfig(draft.config);
        // Restore stimuli from draft
        if (draft.config.stimuli) {
          setStimuli(draft.config.stimuli);
        }
        setDraftId(loadDraftId);
        setIsDraft(true);
        showInfo(`Draft "${draft.title}" loaded`);
      } else {
        showError('Draft not found');
        router.push('/researcher/studies/create');
      }
    } else {
      // Starting a new study - clear old localStorage
      localStorage.removeItem('study_draft');
      // Migrate any old draft to new system
      const migratedId = DraftService.migrateOldDraft();
      if (migratedId) {
        showInfo('Old draft migrated. You can find it in your studies list.');
      }
    }
  }, []);

  // Initialize API health monitoring
  useEffect(() => {
    // Skip health checks if disabled via environment variable
    if (process.env.NEXT_PUBLIC_DISABLE_HEALTH_CHECKS === 'true') {
      return;
    }

    let consecutiveFailures = 0;
    let hasShownError = false;

    // Start health checks
    apiHealthService.startHealthChecks();

    // Subscribe to health status updates
    const unsubscribe = apiHealthService.subscribe(status => {
      const previousHealth = apiHealth;
      setApiHealth(status.status);

      // Track consecutive failures
      if (status.status === 'unhealthy') {
        consecutiveFailures++;
        // Only show error after 3 consecutive failures and if not already shown
        if (consecutiveFailures >= 3 && !hasShownError) {
          showError(
            'Connection issues detected. Your work is being saved locally.'
          );
          hasShownError = true;
        }
      } else {
        consecutiveFailures = 0;
        // Reset error flag when connection is restored
        if (hasShownError && status.status === 'healthy') {
          showSuccess('Connection restored');
          hasShownError = false;
        }
      }

      // Only show degraded warning once, not repeatedly
      if (status.status === 'degraded' && previousHealth !== 'degraded') {
        showWarning('Some services are running slowly.');
      }
    });

    // Don't perform initial health check immediately - let the app load first
    const initialCheckTimer = setTimeout(() => {
      apiHealthService.performHealthCheck();
    }, 5000); // Wait 5 seconds before first check

    return () => {
      clearTimeout(initialCheckTimer);
      unsubscribe();
    };
  }, [showError, showWarning, showSuccess]);

  // Unified save function - autosave and manual save are the same
  const saveDraft = saveNow; // Both autosave and manual save use the same function

  // Helper function to get text content from HTML
  const getTextFromHTML = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {};

    switch (stepNumber) {
      case 1:
        if (!studyConfig.title || studyConfig.title.length < 10) {
          errors.title = 'Title must be at least 10 characters';
        }
        if (studyConfig.title.length > 100) {
          errors.title = 'Title must be less than 100 characters';
        }
        if (studyConfig.description && studyConfig.description.length < 50) {
          errors.description =
            'Description must be at least 50 characters if provided';
        }
        break;

      case 2:
        // For welcome message - count actual text content, not HTML
        const welcomeText = getTextFromHTML(studyConfig.welcomeMessage || '');
        if (!welcomeText || welcomeText.length < 100) {
          errors.welcomeMessage = `Welcome message must be at least 100 characters (currently ${welcomeText.length})`;
        }
        if (welcomeText.length > 5000) {
          errors.welcomeMessage = `Welcome message must be less than 5000 characters (currently ${welcomeText.length})`;
        }

        // For consent form - count actual text content, not HTML
        const consentText = getTextFromHTML(studyConfig.consentForm || '');
        if (!consentText || consentText.length < 500) {
          errors.consentForm = `Consent form must be at least 500 characters (currently ${consentText.length})`;
        }
        if (consentText.length > 10000) {
          errors.consentForm = `Consent form must be less than 10000 characters (currently ${consentText.length})`;
        }
        break;

      case 3:
        if (!gridConfig) {
          errors.grid = 'Please configure the Q-sort grid';
        } else if (gridConfig.totalCells === 0) {
          errors.grid = 'Grid must have at least one cell configured';
        }
        break;

      case 4:
        const currentStimuli = studyConfig.stimuli || stimuli;
        if (!currentStimuli || currentStimuli.length === 0) {
          errors.stimuli = 'Please upload study stimuli';
        } else if (
          gridConfig &&
          currentStimuli.length !== gridConfig.totalCells
        ) {
          errors.stimuli = `Please upload exactly ${gridConfig.totalCells} stimuli (currently ${currentStimuli.length})`;
        }
        break;
    }

    setValidationErrors(errors);

    // If there are errors, scroll to the first error field
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];

      // Scroll to the error field
      setTimeout(() => {
        // Find the element with the error
        let element: HTMLElement | null = null;

        if (firstErrorField === 'title' || firstErrorField === 'description') {
          element = document.querySelector(`[name="${firstErrorField}"]`);
        } else if (firstErrorField === 'welcomeMessage') {
          element = document.querySelector('.welcome-message-section');
        } else if (firstErrorField === 'consentForm') {
          element = document.querySelector('.consent-form-section');
        } else if (firstErrorField === 'grid') {
          element = document.querySelector('.interactive-grid-builder');
        } else if (firstErrorField === 'stimuli') {
          element = document.querySelector('.stimuli-upload-system');
        }

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a highlight effect
          element.classList.add('error-highlight');
          setTimeout(() => {
            element?.classList.remove('error-highlight');
          }, 3000);
        }
      }, 100);

      // Show error message
      if (stepNumber > 2) {
        showError(Object.values(errors)[0]);
      }
    }

    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    // Auto-save before navigating
    if (hasUnsavedChanges) {
      await saveDraft();
    }

    if (!validateStep(step)) {
      return;
    }

    if (step === 4) {
      // Generate preview before moving to preview step
      await generatePreview();
      setStep(5);
    } else if (step < 5) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = async () => {
    // Auto-save before navigating
    if (hasUnsavedChanges) {
      await saveDraft();
    }

    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSaveDraft = () => {
    saveDraft();
  };

  const generatePreview = async () => {
    try {
      // Create preview data structure with researcher branding
      const previewData = {
        participantView: {
          welcome: {
            title: studyConfig.title,
            message: studyConfig.welcomeMessage,
            videoUrl: studyConfig.welcomeVideoUrl,
            includeVideo: studyConfig.includeWelcomeVideo,
          },
          consent: {
            form: studyConfig.consentForm,
          },
          researcherBranding: studyConfig.includeResearcherSignature
            ? {
                researcherName: studyConfig.researcherName,
                researcherTitle: studyConfig.researcherTitle,
                researcherSignatureUrl: studyConfig.researcherSignatureUrl,
                organizationName: studyConfig.organizationName,
                organizationLogoUrl: studyConfig.organizationLogoUrl,
                brandingPosition: studyConfig.brandingPosition,
              }
            : undefined,
          preScreening: {
            enabled: studyConfig.enablePreScreening,
            questions: [],
          },
          qSort: {
            gridConfig: generateGridConfig(
              studyConfig.gridColumns,
              studyConfig.gridShape
            ),
            gridColumns: studyConfig.gridColumns,
            gridShape: studyConfig.gridShape,
            statements: [],
          },
          postSurvey: {
            enabled: studyConfig.enablePostSurvey,
            questions: [],
          },
        },
        metadata: {
          totalSteps:
            3 +
            (studyConfig.enablePreScreening ? 1 : 0) +
            (studyConfig.enablePostSurvey ? 1 : 0),
          estimatedTime: 15,
          features: {
            videoConferencing: studyConfig.enableVideoConferencing,
            preScreening: studyConfig.enablePreScreening,
            postSurvey: studyConfig.enablePostSurvey,
            digitalSignature: false,
          },
        },
      };

      setPreviewData(previewData);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const generateGridConfig = (columns: number, shape: string) => {
    const config = [];
    const center = Math.floor(columns / 2);

    for (let i = 0; i < columns; i++) {
      const position = i - center;
      let maxItems = 1;

      if (shape === 'quasi-normal') {
        // Improved bell curve distribution
        const distance = Math.abs(position);
        const maxCells = Math.ceil(columns * 0.8);
        const bellFactor = Math.exp(-(distance * distance) / (columns / 3));
        maxItems = Math.max(1, Math.round(maxCells * bellFactor));
      } else {
        // Flat distribution - equal across all columns
        maxItems = Math.max(1, Math.floor(columns * 0.6));
      }

      config.push({ position, maxItems });
    }

    return config;
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setIsLoadingAPI(true);

    try {
      // Include stimuli in the submission
      const configToSubmit = {
        ...studyConfig,
        stimuli: stimuli,
      };

      const response = await fetch('/api/studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(configToSubmit),
      });

      if (response.ok) {
        const study = await response.json();

        // Clear draft if we were editing one
        if (draftId) {
          DraftService.deleteDraft(draftId);
        }

        // Clear any old draft format
        localStorage.removeItem('study_draft');

        showSuccess('Study created successfully! Redirecting...');
        setTimeout(() => {
          router.push(`/studies/${study.id}`);
        }, 1000);
      } else {
        throw new Error('Failed to create study');
      }
    } catch (error) {
      console.error('Error creating study:', error);
      showError('Failed to create study. Please try again.');
    } finally {
      setIsSaving(false);
      setIsLoadingAPI(false);
    }
  };

  const updateConfig = useCallback(
    (field: keyof EnhancedStudyConfig, value: any) => {
      setStudyConfig(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Memoized grid change handler to prevent infinite loops
  const handleGridChange = useCallback(
    (grid: any) => {
      setGridConfig(grid);
      updateConfig('gridColumns', grid.columns?.length || 0);
      updateConfig(
        'gridShape',
        grid.distribution === 'bell' ? 'quasi-normal' : 'free'
      );
    },
    [updateConfig]
  );

  const handleTemplateSelect = (
    type: 'welcome' | 'consent',
    templateId: string
  ) => {
    const field = type === 'welcome' ? 'welcomeMessage' : 'consentForm';
    const templateField =
      type === 'welcome' ? 'welcomeTemplateId' : 'consentTemplateId';

    // If selecting the empty option, clear the content
    if (!templateId) {
      updateConfig(field, '');
      updateConfig(templateField, undefined);
      return;
    }

    const template =
      type === 'welcome'
        ? getTemplateById(templateId)
        : getConsentTemplateById(templateId);

    if (template) {
      const currentContent =
        type === 'welcome'
          ? studyConfig.welcomeMessage
          : studyConfig.consentForm;

      // Check if there's existing content that would be overwritten
      if (currentContent && currentContent.length > 50) {
        const confirmMessage = `You have existing ${type === 'welcome' ? 'welcome message' : 'consent form'} content that will be replaced by the template. Do you want to continue?`;

        showConfirm(
          confirmMessage,
          () => {
            updateConfig(field, template.content);
            updateConfig(templateField, templateId);
          },
          {
            title: 'Replace Content?',
            onCancel: () => {
              // Reset the select to previous value
              const selectElement = document.querySelector(
                `select[data-type="${type}"]`
              ) as HTMLSelectElement;
              if (selectElement) {
                selectElement.value = studyConfig[templateField] || '';
              }
            },
          }
        );
      } else {
        updateConfig(field, template.content);
        updateConfig(templateField, templateId);
      }
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      showInfo('Uploading logo...');
      const result = await uploadLogo(file);
      console.log('Logo upload result:', result);

      // Update the state with the returned URL
      if (result && result.url) {
        updateConfig('organizationLogoUrl', result.url);
        console.log('Updated organizationLogoUrl to:', result.url);
        console.log('Current studyConfig:', studyConfig);
        showSuccess('Logo uploaded successfully!');
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error: any) {
      console.error('Logo upload failed:', error);
      showError(error.message || 'Failed to upload logo. Please try again.');
    }
  };

  const handleSignatureComplete = (signatureUrl: string) => {
    updateConfig('researcherSignatureUrl', signatureUrl);
  };

  const handleSignatureRemove = () => {
    updateConfig('researcherSignatureUrl', '');
  };

  const getCsrfToken = () => {
    return (
      document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || ''
    );
  };

  // Handle stimuli changes
  const handleStimuliChange = useCallback(
    (newStimuli: Stimulus[]) => {
      setStimuli(newStimuli);
      updateConfig('stimuli', newStimuli);
    },
    [updateConfig]
  );

  // Keyboard shortcuts - must be after function declarations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Platform-specific Next shortcut (Cmd+Right on Mac, Alt+N on Windows)
      if (matchesPlatformShortcut(e, 'next')) {
        e.preventDefault();
        handleNext();
      }
      // Platform-specific Back shortcut (Cmd+Left on Mac, Alt+B on Windows)
      if (matchesPlatformShortcut(e, 'back')) {
        e.preventDefault();
        handleBack();
      }
      // Platform-specific Save Draft shortcut (Cmd+Shift+S on Mac, Ctrl+Shift+S on Windows)
      if (matchesPlatformShortcut(e, 'saveDraft')) {
        e.preventDefault();
        saveDraft();
      }
      // Ctrl+Enter or Cmd+Enter for Submit (on last step)
      if (
        matchesShortcut(e, { meta: true, ctrl: true, key: 'Enter' }) &&
        step === 5
      ) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]); // Minimal dependencies to avoid circular refs

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      {/* Modern Save Status Indicator - Apple/Google/Qualtrics Style */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`
          cloud-save-indicator bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full border px-4 py-2.5 
          flex items-center gap-2.5 min-w-[120px]
          shadow-[0_2px_10px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.12)]
          dark:shadow-[0_2px_10px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.3)]
          ${hasUnsavedChanges && !isAutoSaving ? 'border-amber-300 dark:border-amber-700 hover:shadow-2xl cursor-pointer' : 'border-gray-200 dark:border-gray-700'}
        `}
          onClick={
            hasUnsavedChanges && !isAutoSaving ? () => saveDraft() : undefined
          }
          role={hasUnsavedChanges && !isAutoSaving ? 'button' : undefined}
          tabIndex={hasUnsavedChanges && !isAutoSaving ? 0 : undefined}
        >
          {/* Saved State - iCloud style checkmark */}
          {!hasUnsavedChanges && !isAutoSaving && lastSaveTime && (
            <>
              <div className="relative">
                <Cloud className="w-5 h-5 text-green-500" strokeWidth={2} />
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 save-success-check">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  All saved
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {lastSaveTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </>
          )}

          {/* Saving State - Animated sync */}
          {isAutoSaving && (
            <>
              <div className="relative">
                <Cloud className="w-5 h-5 text-blue-500" strokeWidth={2} />
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <RefreshCw
                    className="w-2.5 h-2.5 text-white animate-spin"
                    strokeWidth={3}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                Saving...
              </span>
            </>
          )}

          {/* Unsaved State - Click to save */}
          {hasUnsavedChanges && !isAutoSaving && (
            <>
              <div className="relative">
                <Cloud className="w-5 h-5 text-amber-500" strokeWidth={2} />
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Not saved
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Click to save
                </span>
              </div>
            </>
          )}

          {/* Initial state - Ready */}
          {!lastSaveTime && !isAutoSaving && !hasUnsavedChanges && (
            <>
              <Cloud className="w-5 h-5 text-gray-400" strokeWidth={2} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Ready
              </span>
            </>
          )}
        </div>

        {/* Auto-save timer and keyboard shortcut indicator */}
        {hasUnsavedChanges && !isAutoSaving && (
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center space-y-0.5">
            <div>Auto-saves every 30s</div>
            <div className="opacity-75">⌘+S to save now</div>
          </div>
        )}
      </div>

      {/* Upload Progress Tracker */}
      <UploadProgressTracker compact={false} showDetails={true} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-label">Create New Study</h1>
          <p className="mt-2 text-secondary-label">
            Enhanced Q-methodology research study creation
          </p>
        </div>

        {/* Placeholder for alignment - save indicator is now fixed position */}
        <div className="w-40" />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Welcome & Consent' },
          { num: 3, label: 'Grid Configuration' },
          { num: 4, label: 'Upload Stimuli' },
          { num: 5, label: 'Preview & Create' },
        ].map(s => (
          <div key={s.num} className="flex items-center flex-1">
            <div
              className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    step >= s.num
                      ? 'bg-system-blue text-white'
                      : 'bg-quaternary-fill text-tertiary-label'
                  }
                `}
            >
              {s.num}
            </div>
            <div className="flex-1 flex flex-col ml-2">
              <span className="text-xs text-secondary-label">{s.label}</span>
              {s.num < 4 && (
                <div
                  className={`
                      h-1 mt-1 mr-2
                      ${step > s.num ? 'bg-system-blue' : 'bg-quaternary-fill'}
                    `}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <Card>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-label">
                Basic Information
              </h2>
              <p className="text-xs text-secondary-label mt-1">
                <span className="text-red-500">*</span> indicates required
                fields
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label
                  htmlFor="study-title"
                  className="text-sm font-medium text-label"
                >
                  Study Title <span className="text-red-500">*</span>
                </label>
                <InfoTooltip {...getTooltip('studyTitle')!} />
              </div>
              <TextField
                id="study-title"
                name="title"
                placeholder="Enter your study title (10-100 characters)"
                value={studyConfig.title}
                onChange={e => {
                  updateConfig('title', e.target.value);
                  // Clear error when requirement is met
                  if (
                    e.target.value.length >= 10 &&
                    e.target.value.length <= 100
                  ) {
                    setValidationErrors(prev => {
                      const { title, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                error={validationErrors.title}
                aria-label="Study title"
                aria-required="true"
                aria-invalid={!!validationErrors.title}
                aria-describedby={
                  validationErrors.title ? 'title-error' : 'title-hint'
                }
              />
              <div
                id="title-hint"
                className="text-xs text-tertiary-label mt-1 flex justify-between"
              >
                <span
                  className={
                    studyConfig.title.length < 10 ||
                    studyConfig.title.length > 100
                      ? 'text-system-red'
                      : ''
                  }
                >
                  {studyConfig.title.length}/100 characters
                  {studyConfig.title.length < 10 && ' (min: 10)'}
                </span>
                <span className="text-red-500">Required field</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label
                  htmlFor="study-description"
                  className="text-sm font-medium text-label"
                >
                  Study Description{' '}
                  <span className="text-secondary-label text-xs font-normal">
                    (Optional)
                  </span>
                </label>
                <InfoTooltip {...getTooltip('studyDescription')!} />
              </div>
              <textarea
                id="study-description"
                name="description"
                className={`w-full px-4 py-3 rounded-lg border ${validationErrors.description ? 'border-system-red' : 'border-quaternary-fill'} bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                rows={4}
                placeholder="Describe your study's purpose and goals (50-500 characters if provided)"
                value={studyConfig.description}
                onChange={e => {
                  updateConfig('description', e.target.value);
                  // Clear error when requirement is met or field is empty
                  if (!e.target.value || e.target.value.length >= 50) {
                    setValidationErrors(prev => {
                      const { description, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                aria-label="Study description"
                aria-required="false"
                aria-invalid={!!validationErrors.description}
                aria-describedby={
                  validationErrors.description
                    ? 'description-error'
                    : 'description-hint'
                }
              />
              <div className="text-xs text-tertiary-label mt-1 flex justify-between">
                <span
                  className={
                    studyConfig.description &&
                    studyConfig.description.length > 0 &&
                    studyConfig.description.length < 50
                      ? 'text-system-red'
                      : ''
                  }
                >
                  {studyConfig.description.length}/500 characters
                  {studyConfig.description &&
                    studyConfig.description.length > 0 &&
                    studyConfig.description.length < 50 &&
                    ' (min: 50 if provided)'}
                </span>
                <span>Optional field</span>
              </div>
              {validationErrors.description && (
                <p className="text-xs text-system-red mt-1" role="alert">
                  {validationErrors.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Welcome & Consent */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-label">
              Welcome Message & Consent Form
            </h2>

            {/* Welcome Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-label">
                    Welcome Message <span className="text-red-500">*</span>
                  </label>
                  <InfoTooltip {...getTooltip('welcomeMessage')!} />
                </div>

                <select
                  className="text-sm px-3 py-1 rounded border border-quaternary-fill"
                  data-type="welcome"
                  onChange={e =>
                    handleTemplateSelect('welcome', e.target.value)
                  }
                  value={studyConfig.welcomeTemplateId || ''}
                >
                  <option value="">Select Template</option>
                  {welcomeTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Disclaimer - Only show when a template is selected */}
              {studyConfig.welcomeTemplateId && (
                <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠️
                    </span>
                    <span>
                      <strong>Important:</strong> These templates are
                      suggestions only. You must ensure compliance with your
                      institution's IRB, local laws, and regulations (GDPR,
                      HIPAA, etc.). Always consult your legal/ethics team before
                      use.
                    </span>
                  </p>
                </div>
              )}

              <div className="welcome-message-section">
                <RichTextEditor
                  content={studyConfig.welcomeMessage}
                  onChange={content => {
                    updateConfig('welcomeMessage', content);
                    // Clear error when requirement is met
                    const textLength = content
                      .replace(/<[^>]*>/g, '')
                      .trim().length;
                    if (textLength >= 100) {
                      setValidationErrors(prev => {
                        const { welcomeMessage, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  placeholder="Welcome your participants..."
                  minLength={100}
                  maxLength={5000}
                />
                {validationErrors.welcomeMessage && (
                  <p className="text-xs text-system-red mt-1" role="alert">
                    {validationErrors.welcomeMessage}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={studyConfig.includeWelcomeVideo}
                  onChange={e =>
                    updateConfig('includeWelcomeVideo', e.target.checked)
                  }
                />
                <span className="text-sm text-label">
                  Include welcome video
                </span>
              </label>

              {studyConfig.includeWelcomeVideo && (
                <TextField
                  label="Video URL"
                  placeholder="https://..."
                  value={studyConfig.welcomeVideoUrl}
                  onChange={e =>
                    updateConfig('welcomeVideoUrl', e.target.value)
                  }
                />
              )}
            </div>

            {/* Consent Form */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-label">
                    Consent Form <span className="text-red-500">*</span>
                  </label>
                  <InfoTooltip {...getTooltip('consentForm')!} />
                </div>

                <select
                  className="text-sm px-3 py-1 rounded border border-quaternary-fill"
                  data-type="consent"
                  onChange={e =>
                    handleTemplateSelect('consent', e.target.value)
                  }
                  value={studyConfig.consentTemplateId || ''}
                >
                  <option value="">Select Template</option>
                  {consentTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legal Compliance Disclaimer - Only show when a template is selected */}
              {studyConfig.consentTemplateId && (
                <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠️
                    </span>
                    <span>
                      <strong>Legal Notice:</strong> Consent form templates are
                      provided as examples only. You are responsible for
                      ensuring your consent form meets all applicable ethical,
                      legal, and regulatory requirements including IRB approval,
                      GDPR, HIPAA, and local laws. Consult your institution's
                      legal and ethics departments.
                    </span>
                  </p>
                </div>
              )}

              <div className="consent-form-section">
                <RichTextEditor
                  content={studyConfig.consentForm}
                  onChange={content => {
                    updateConfig('consentForm', content);
                    // Clear error when requirement is met
                    const textLength = content
                      .replace(/<[^>]*>/g, '')
                      .trim().length;
                    if (textLength >= 500) {
                      setValidationErrors(prev => {
                        const { consentForm, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  placeholder="Enter consent form text..."
                  minLength={500}
                  maxLength={10000}
                />
                {validationErrors.consentForm && (
                  <p className="text-xs text-system-red mt-1" role="alert">
                    {validationErrors.consentForm}
                  </p>
                )}
              </div>

              {/* Professional Signature Section */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Professional Signature
                  </h3>
                  <InfoTooltip
                    title="Digital Signature"
                    content="Add your professional signature and organization details to consent forms"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={studyConfig.includeResearcherSignature}
                    onChange={e =>
                      updateConfig(
                        'includeResearcherSignature',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Include researcher signature on consent form
                  </span>
                </label>

                {studyConfig.includeResearcherSignature && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {/* Principal Investigator & Organization Information */}
                    <TextField
                      label="Principal Investigator Name"
                      placeholder="Dr. John Smith"
                      value={studyConfig.researcherName}
                      onChange={e =>
                        updateConfig('researcherName', e.target.value)
                      }
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label="Title/Position"
                        placeholder="Professor, Lead Researcher"
                        value={studyConfig.researcherTitle}
                        onChange={e =>
                          updateConfig('researcherTitle', e.target.value)
                        }
                      />

                      <TextField
                        label="Organization/University"
                        placeholder="Stanford University"
                        value={studyConfig.organizationName}
                        onChange={e =>
                          updateConfig('organizationName', e.target.value)
                        }
                      />
                    </div>

                    {/* Researcher Signature (Draw, Type, or Upload) */}
                    <ResearcherSignature
                      onSignatureComplete={handleSignatureComplete}
                      currentSignatureUrl={studyConfig.researcherSignatureUrl}
                      onRemove={handleSignatureRemove}
                    />

                    {/* Organization Logo Upload */}
                    <div>
                      <label className="text-sm font-medium text-color-text mb-2 block">
                        Organization Logo
                      </label>

                      {!studyConfig.organizationLogoUrl ||
                      studyConfig.organizationLogoUrl === '' ? (
                        <label className="block">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Show loading state
                                const loadingDiv =
                                  document.createElement('div');
                                loadingDiv.innerHTML = 'Uploading...';
                                loadingDiv.className =
                                  'text-sm text-color-text-secondary text-center mt-2';
                                e.target.parentElement?.appendChild(loadingDiv);

                                await handleLogoUpload(file);

                                // Remove loading state
                                loadingDiv.remove();
                              }
                            }}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-color-border rounded-lg p-6 text-center cursor-pointer hover:bg-color-surface transition-colors">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-color-text-secondary" />
                            <p className="text-sm text-color-text">
                              Click to upload logo
                            </p>
                            <p className="text-xs text-color-text-tertiary mt-1">
                              PNG, JPG, GIF, WebP (max 2MB)
                            </p>
                          </div>
                        </label>
                      ) : (
                        <div className="bg-gradient-to-r from-gray-50 to-white border border-color-border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-4 p-4">
                            <div className="flex-shrink-0 bg-white p-3 rounded-lg border border-color-border shadow-sm">
                              <img
                                key={studyConfig.organizationLogoUrl}
                                src={studyConfig.organizationLogoUrl}
                                alt="Organization logo"
                                className="h-14 w-auto object-contain"
                                onError={e => {
                                  console.error(
                                    'Failed to load logo image:',
                                    studyConfig.organizationLogoUrl
                                  );
                                  e.currentTarget.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log(
                                    'Logo image loaded successfully:',
                                    studyConfig.organizationLogoUrl
                                  );
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  {studyConfig.researcherName && (
                                    <p className="text-sm font-semibold text-color-text">
                                      {studyConfig.researcherName}
                                    </p>
                                  )}
                                  {studyConfig.organizationName && (
                                    <p className="text-xs text-color-text-secondary mb-1">
                                      {studyConfig.organizationName}
                                    </p>
                                  )}
                                  <p className="text-xs text-color-success flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Logo uploaded successfully
                                  </p>
                                  <p className="text-xs text-color-text-tertiary mt-1 font-mono truncate max-w-xs">
                                    {studyConfig.organizationLogoUrl
                                      .split('/')
                                      .pop()}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    updateConfig('organizationLogoUrl', '')
                                  }
                                  className="text-xs text-color-danger hover:underline flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview Section */}
                    {(studyConfig.researcherName ||
                      studyConfig.organizationLogoUrl ||
                      studyConfig.researcherSignatureUrl) && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Preview - How it will appear on consent form:
                        </p>

                        <div className="bg-white rounded border border-gray-300 overflow-hidden">
                          {/* Clean Professional Header */}
                          {(studyConfig.researcherName ||
                            studyConfig.organizationName ||
                            studyConfig.organizationLogoUrl) && (
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center gap-3">
                                {studyConfig.organizationLogoUrl && (
                                  <img
                                    src={studyConfig.organizationLogoUrl}
                                    alt=""
                                    className="h-10 w-auto object-contain"
                                  />
                                )}
                                <div>
                                  {studyConfig.researcherName && (
                                    <p className="text-sm font-semibold text-gray-900">
                                      {studyConfig.researcherName}
                                    </p>
                                  )}
                                  {studyConfig.organizationName && (
                                    <p className="text-xs text-gray-600">
                                      {studyConfig.organizationName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Professional Signature Block */}
                          {studyConfig.researcherSignatureUrl && (
                            <div className="px-6 py-4 bg-white border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                    Principal Investigator
                                  </p>
                                  <img
                                    src={studyConfig.researcherSignatureUrl}
                                    alt=""
                                    className="h-10 w-auto object-contain mb-1"
                                  />
                                  <div className="w-40 border-t border-gray-400"></div>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    {studyConfig.researcherName || 'Signature'}
                                  </p>
                                  {studyConfig.researcherTitle && (
                                    <p className="text-xs text-gray-600">
                                      {studyConfig.researcherTitle}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                    Date
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {new Date().toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={studyConfig.enablePreScreening}
                  onChange={e =>
                    updateConfig('enablePreScreening', e.target.checked)
                  }
                />
                <span className="text-label">
                  Enable pre-screening questions
                </span>
                <InfoTooltip {...getTooltip('preScreening')!} />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={studyConfig.enablePostSurvey}
                  onChange={e =>
                    updateConfig('enablePostSurvey', e.target.checked)
                  }
                />
                <span className="text-label">Enable post-sort survey</span>
                <InfoTooltip {...getTooltip('postSurvey')!} />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={studyConfig.enableVideoConferencing}
                  onChange={e =>
                    updateConfig('enableVideoConferencing', e.target.checked)
                  }
                />
                <span className="text-label">
                  Enable video conferencing support
                </span>
                <InfoTooltip {...getTooltip('videoConferencing')!} />
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Interactive Grid Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-label">
              Interactive Grid Configuration
            </h2>

            {/* AI Assistant Info Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-start gap-3 border border-blue-200/50">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm text-purple-900 font-medium">
                  AI-Powered Grid Design Assistant Available
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Click the gradient AI Assistant button below to get
                  scientifically-backed grid configurations tailored to your
                  study requirements.
                </p>
              </div>
            </div>

            <AppleUIGridBuilder
              studyId={
                studyConfig.title
                  ? studyConfig.title
                      .replace(/[^a-zA-Z0-9]/g, '-')
                      .toLowerCase()
                      .substring(0, 50)
                  : `study-${Date.now()}`
              }
              onGridChange={handleGridChange}
              initialCells={30}
            />
          </div>
        )}

        {/* Step 4: Upload Stimuli */}
        {step === 4 && (
          <div className="w-full">
            {gridConfig ? (
              <StimuliUploadSystemV7
                grid={gridConfig}
                initialStimuli={stimuli}
                onStimuliChange={handleStimuliChange}
              />
            ) : (
              <Card>
                <div className="p-6 bg-yellow-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">
                        Grid configuration required
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please complete the grid configuration in Step 3 before
                        uploading stimuli.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 5: Preview & Create */}
        {step === 5 && previewData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-label">
                Participant Experience Preview
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-secondary-label">
                  <span className="font-medium">Estimated time:</span>{' '}
                  {previewData.metadata?.estimatedTime || 15} minutes
                </div>
                <div className="text-sm text-secondary-label">
                  <span className="font-medium">Total steps:</span>{' '}
                  {previewData.metadata?.totalSteps || 3}
                </div>
              </div>
            </div>

            {/* Device Preview Controls */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Device:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded-lg transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-2 rounded-lg transition-colors ${
                      previewDevice === 'tablet'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Tablet className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded-lg transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Zoom:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPreviewZoom(Math.max(0.5, previewZoom - 0.25))
                    }
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium w-12 text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    onClick={() =>
                      setPreviewZoom(Math.min(2, previewZoom + 0.25))
                    }
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className="overflow-auto"
              style={{
                transform: `scale(${previewZoom})`,
                transformOrigin: 'top center',
              }}
            >
              <ParticipantPreview
                previewData={previewData}
                studyTitle={studyConfig.title}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  Preview Features
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Interactive navigation through all study steps</li>
                  <li>• Shows exact participant experience</li>
                  <li>• Test your study flow before publishing</li>
                  <li>• Click step buttons to jump between sections</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">
                  Enabled Features
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  {previewData.metadata?.features?.digitalSignature && (
                    <li>✓ Digital Signature</li>
                  )}
                  {previewData.metadata?.features?.preScreening && (
                    <li>✓ Pre-Screening Questions</li>
                  )}
                  {previewData.metadata?.features?.postSurvey && (
                    <li>✓ Post-Survey Questions</li>
                  )}
                  {previewData.metadata?.features?.videoConferencing && (
                    <li>✓ Video Conferencing</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-xl">⚠️</span>
                <div>
                  <h3 className="font-medium text-amber-900 mb-1">
                    Review Before Creating
                  </h3>
                  <p className="text-sm text-amber-800">
                    This is your final chance to review the study. You can go
                    back to make changes or proceed to create the study. Once
                    created, some settings cannot be modified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons with Keyboard Shortcuts */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 1}
            aria-label="Go to previous step"
            aria-keyshortcuts={getAriaKeyShortcuts([
              getPlatformShortcut('back'),
            ])}
            title={`Back (${shortcuts.back})`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={isSaving || isAutoSaving}
              aria-label="Save current progress as draft"
              aria-keyshortcuts={getAriaKeyShortcuts([
                getPlatformShortcut('saveDraft'),
              ])}
              title={`Save Draft (${shortcuts.saveDraft})`}
            >
              {isAutoSaving ? (
                <>
                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Auto-saving...
                </>
              ) : isSaving ? (
                <>
                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Draft
                </>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isSaving || isLoadingAPI}
              aria-label={
                step === 5 ? 'Submit and create study' : 'Go to next step'
              }
              aria-keyshortcuts={getAriaKeyShortcuts([
                step === 5
                  ? { meta: true, ctrl: true, key: 'Enter' }
                  : getPlatformShortcut('next'),
              ])}
              title={
                step === 5
                  ? `Submit (${shortcuts.submit})`
                  : `Next (${shortcuts.next})`
              }
            >
              {isLoadingAPI ? (
                <>
                  <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : step === 5 ? (
                isSaving ? (
                  'Creating...'
                ) : (
                  'Create Study'
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-4 text-xs text-tertiary-label text-center">
          <span className="inline-flex items-center gap-4">
            <span>{shortcuts.back}: Back</span>
            <span>{shortcuts.next}: Next</span>
            <span>{shortcuts.saveDraft}: Save</span>
            {step === 5 && <span>{shortcuts.submit}: Submit</span>}
          </span>
        </div>
      </Card>

      {/* Popup Modal */}
      <PopupModal
        isOpen={popupState.isOpen}
        onClose={closePopup}
        type={popupState.type}
        title={popupState.title}
        message={popupState.message}
        onConfirm={popupState.onConfirm}
        onCancel={popupState.onCancel}
      />

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        position="top-right"
      />
    </div>
  );
}
