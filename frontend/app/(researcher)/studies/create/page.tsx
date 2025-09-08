'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { TextField } from '@/components/apple-ui/TextField';
import RichTextEditor from '@/components/editors/RichTextEditorV2';
import DigitalSignature from '@/components/signature/DigitalSignature';
import InfoTooltip from '@/components/tooltips/InfoTooltipV2';
import { 
  welcomeTemplates, 
  getTemplateById, 
  fillTemplate 
} from '@/lib/templates/welcome-templates';
import { 
  consentTemplates, 
  getConsentTemplateById, 
  fillConsentTemplate 
} from '@/lib/templates/consent-templates';
import { 
  studyCreationTooltips, 
  getTooltip 
} from '@/lib/tooltips/study-creation-tooltips';
import ParticipantPreview from '@/components/study-creation/ParticipantPreview';
import ResearcherSignature from '@/components/study-creation/ResearcherSignature';
import { ChevronLeft, ChevronRight, Save, Eye, Upload, Pen, Type, Check, X } from 'lucide-react';

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
  
  // Additional Features
  enablePreScreening: boolean;
  enablePostSurvey: boolean;
  enableVideoConferencing: boolean;
}

export default function EnhancedCreateStudyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  
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
    enablePreScreening: false,
    enablePostSurvey: true,
    enableVideoConferencing: false,
  });

  // Auto-save to localStorage
  useEffect(() => {
    const autoSave = setTimeout(() => {
      localStorage.setItem('study_draft', JSON.stringify(studyConfig));
    }, 1000);
    
    return () => clearTimeout(autoSave);
  }, [studyConfig]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('study_draft');
    if (draft) {
      try {
        setStudyConfig(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
  }, []);

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
          errors.description = 'Description must be at least 50 characters if provided';
        }
        break;
        
      case 2:
        if (!studyConfig.welcomeMessage || studyConfig.welcomeMessage.length < 100) {
          errors.welcomeMessage = 'Welcome message must be at least 100 characters';
        }
        if (studyConfig.welcomeMessage.length > 1000) {
          errors.welcomeMessage = 'Welcome message must be less than 1000 characters';
        }
        if (!studyConfig.consentForm || studyConfig.consentForm.length < 500) {
          errors.consentForm = 'Consent form must be at least 500 characters';
        }
        if (studyConfig.consentForm.length > 5000) {
          errors.consentForm = 'Consent form must be less than 5000 characters';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
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
          researcherBranding: studyConfig.includeResearcherSignature ? {
            researcherName: studyConfig.researcherName,
            researcherTitle: studyConfig.researcherTitle,
            researcherSignatureUrl: studyConfig.researcherSignatureUrl,
            organizationName: studyConfig.organizationName,
            organizationLogoUrl: studyConfig.organizationLogoUrl,
            brandingPosition: studyConfig.brandingPosition,
          } : undefined,
          preScreening: {
            enabled: studyConfig.enablePreScreening,
            questions: [],
          },
          qSort: {
            gridConfig: generateGridConfig(studyConfig.gridColumns, studyConfig.gridShape),
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
          totalSteps: 3 + (studyConfig.enablePreScreening ? 1 : 0) + (studyConfig.enablePostSurvey ? 1 : 0),
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
        // Bell curve distribution
        const distance = Math.abs(position);
        maxItems = Math.max(1, 5 - distance);
      } else if (shape === 'forced') {
        // Inverted bell curve
        const distance = Math.abs(position);
        maxItems = Math.min(5, 1 + distance);
      } else {
        // Free distribution - equal across all columns
        maxItems = 3;
      }
      
      config.push({ position, maxItems });
    }
    
    return config;
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(studyConfig),
      });
      
      if (response.ok) {
        const study = await response.json();
        localStorage.removeItem('study_draft');
        router.push(`/studies/${study.id}`);
      } else {
        throw new Error('Failed to create study');
      }
    } catch (error) {
      console.error('Error creating study:', error);
      alert('Failed to create study. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (field: keyof EnhancedStudyConfig, value: any) => {
    setStudyConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTemplateSelect = (type: 'welcome' | 'consent', templateId: string) => {
    // Don't do anything if selecting the empty option
    if (!templateId) return;
    
    const template = type === 'welcome' 
      ? getTemplateById(templateId)
      : getConsentTemplateById(templateId);
      
    if (template) {
      const field = type === 'welcome' ? 'welcomeMessage' : 'consentForm';
      const templateField = type === 'welcome' ? 'welcomeTemplateId' : 'consentTemplateId';
      const currentContent = type === 'welcome' ? studyConfig.welcomeMessage : studyConfig.consentForm;
      
      // Check if there's existing content that would be overwritten
      if (currentContent && currentContent.length > 50) {
        const confirmMessage = `You have existing ${type === 'welcome' ? 'welcome message' : 'consent form'} content that will be replaced by the template. Do you want to continue?`;
        
        if (!window.confirm(confirmMessage)) {
          // Reset the select to previous value or empty
          const selectElement = document.querySelector(
            `select[value="${studyConfig[templateField] || ''}"]`
          ) as HTMLSelectElement;
          if (selectElement) {
            selectElement.value = studyConfig[templateField] || '';
          }
          return;
        }
      }
      
      updateConfig(field, template.content);
      updateConfig(templateField, templateId);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const { url } = await response.json();
        updateConfig('organizationLogoUrl', url);
      } else {
        const error = await response.json();
        alert(`Failed to upload logo: ${error.error}`);
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
      alert('Failed to upload logo. Please try again.');
    }
  };
  
  const handleSignatureComplete = (signatureUrl: string) => {
    updateConfig('researcherSignatureUrl', signatureUrl);
  };
  
  const handleSignatureRemove = () => {
    updateConfig('researcherSignatureUrl', '');
  };

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-label">Create New Study</h1>
          <p className="mt-2 text-secondary-label">
            Enhanced Q-methodology research study creation
          </p>
        </div>
        
        <Button
          variant="secondary"
          size="small"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewMode ? 'Edit Mode' : 'Preview'}
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Welcome & Consent' },
            { num: 3, label: 'Q-Sort Setup' },
            { num: 4, label: 'Review' },
            { num: 5, label: 'Preview' },
          ].map((s) => (
            <div key={s.num} className="flex items-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= s.num
                    ? 'bg-system-blue text-white'
                    : 'bg-quaternary-fill text-tertiary-label'
                  }
                `}
              >
                {s.num}
              </div>
              <div className="flex-1 flex flex-col ml-2">
                <span className="text-xs text-secondary-label">{s.label}</span>
                {s.num < 5 && (
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
              <h2 className="text-xl font-semibold text-label">
                Basic Information
              </h2>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-label">
                    Study Title
                  </label>
                  <InfoTooltip {...getTooltip('studyTitle')!} />
                </div>
                <TextField
                  placeholder="Enter your study title (10-100 characters)"
                  value={studyConfig.title}
                  onChange={(e) => updateConfig('title', e.target.value)}
                  error={validationErrors.title}
                />
                <div className="text-xs text-tertiary-label mt-1">
                  {studyConfig.title.length}/100 characters
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-label">
                    Study Description (Optional)
                  </label>
                  <InfoTooltip {...getTooltip('studyDescription')!} />
                </div>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  rows={4}
                  placeholder="Describe your study's purpose and goals (50-500 characters)"
                  value={studyConfig.description}
                  onChange={(e) => updateConfig('description', e.target.value)}
                />
                <div className="text-xs text-tertiary-label mt-1">
                  {studyConfig.description.length}/500 characters
                </div>
                {validationErrors.description && (
                  <p className="text-xs text-system-red mt-1">
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
                      Welcome Message
                    </label>
                    <InfoTooltip {...getTooltip('welcomeMessage')!} />
                  </div>
                  
                  <select
                    className="text-sm px-3 py-1 rounded border border-quaternary-fill"
                    onChange={(e) => handleTemplateSelect('welcome', e.target.value)}
                    value={studyConfig.welcomeTemplateId || ''}
                  >
                    <option value="">Select Template</option>
                    {welcomeTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Template Disclaimer */}
                <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                    <span>
                      <strong>Important:</strong> These templates are suggestions only. You must ensure compliance with your institution's IRB, local laws, and regulations (GDPR, HIPAA, etc.). Always consult your legal/ethics team before use.
                    </span>
                  </p>
                </div>
                
                <RichTextEditor
                  content={studyConfig.welcomeMessage}
                  onChange={(content) => updateConfig('welcomeMessage', content)}
                  placeholder="Welcome your participants..."
                  minLength={100}
                  maxLength={1000}
                />
                
                {validationErrors.welcomeMessage && (
                  <p className="text-xs text-system-red mt-1">
                    {validationErrors.welcomeMessage}
                  </p>
                )}

                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={studyConfig.includeWelcomeVideo}
                    onChange={(e) => updateConfig('includeWelcomeVideo', e.target.checked)}
                  />
                  <span className="text-sm text-label">Include welcome video</span>
                </label>
                
                {studyConfig.includeWelcomeVideo && (
                  <TextField
                    label="Video URL"
                    placeholder="https://..."
                    value={studyConfig.welcomeVideoUrl}
                    onChange={(e) => updateConfig('welcomeVideoUrl', e.target.value)}
                  />
                )}
              </div>

              {/* Consent Form */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-label">
                      Consent Form
                    </label>
                    <InfoTooltip {...getTooltip('consentForm')!} />
                  </div>
                  
                  <select
                    className="text-sm px-3 py-1 rounded border border-quaternary-fill"
                    onChange={(e) => handleTemplateSelect('consent', e.target.value)}
                    value={studyConfig.consentTemplateId || ''}
                  >
                    <option value="">Select Template</option>
                    {consentTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Legal Compliance Disclaimer */}
                <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                    <span>
                      <strong>Legal Notice:</strong> Consent form templates are provided as examples only. You are responsible for ensuring your consent form meets all applicable ethical, legal, and regulatory requirements including IRB approval, GDPR, HIPAA, and local laws. Consult your institution's legal and ethics departments.
                    </span>
                  </p>
                </div>
                
                <RichTextEditor
                  content={studyConfig.consentForm}
                  onChange={(content) => updateConfig('consentForm', content)}
                  placeholder="Enter consent form text..."
                  minLength={500}
                  maxLength={5000}
                />
                
                {validationErrors.consentForm && (
                  <p className="text-xs text-system-red mt-1">
                    {validationErrors.consentForm}
                  </p>
                )}

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
                      onChange={(e) => updateConfig('includeResearcherSignature', e.target.checked)}
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
                        onChange={(e) => updateConfig('researcherName', e.target.value)}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <TextField
                          label="Title/Position"
                          placeholder="Professor, Lead Researcher"
                          value={studyConfig.researcherTitle}
                          onChange={(e) => updateConfig('researcherTitle', e.target.value)}
                        />
                        
                        <TextField
                          label="Organization/University"
                          placeholder="Stanford University"
                          value={studyConfig.organizationName}
                          onChange={(e) => updateConfig('organizationName', e.target.value)}
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
                          
                          {!studyConfig.organizationLogoUrl ? (
                            <label className="block">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Show loading state
                                    const loadingDiv = document.createElement('div');
                                    loadingDiv.innerHTML = 'Uploading...';
                                    loadingDiv.className = 'text-sm text-color-text-secondary text-center mt-2';
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
                                <p className="text-sm text-color-text">Click to upload logo</p>
                                <p className="text-xs text-color-text-tertiary mt-1">PNG, JPG, GIF, WebP (max 2MB)</p>
                              </div>
                            </label>
                          ) : (
                            <div className="bg-gradient-to-r from-gray-50 to-white border border-color-border rounded-lg overflow-hidden">
                              <div className="flex items-center gap-4 p-4">
                                <div className="flex-shrink-0 bg-white p-3 rounded-lg border border-color-border shadow-sm">
                                  <img 
                                    src={studyConfig.organizationLogoUrl} 
                                    alt="Organization logo" 
                                    className="h-14 w-auto object-contain"
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
                                        {studyConfig.organizationLogoUrl.split('/').pop()}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => updateConfig('organizationLogoUrl', '')}
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
                      {(studyConfig.researcherName || studyConfig.organizationLogoUrl || studyConfig.researcherSignatureUrl) && (
                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Preview - How it will appear on consent form:
                          </p>
                          
                          <div className="bg-white rounded border border-gray-300 overflow-hidden">
                            {/* Clean Professional Header */}
                            {(studyConfig.researcherName || studyConfig.organizationName || studyConfig.organizationLogoUrl) && (
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
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Principal Investigator</p>
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
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
                                    <p className="text-sm text-gray-900">
                                      {new Date().toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
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
                    onChange={(e) => updateConfig('enablePreScreening', e.target.checked)}
                  />
                  <span className="text-label">Enable pre-screening questions</span>
                  <InfoTooltip {...getTooltip('preScreening')!} />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={studyConfig.enablePostSurvey}
                    onChange={(e) => updateConfig('enablePostSurvey', e.target.checked)}
                  />
                  <span className="text-label">Enable post-sort survey</span>
                  <InfoTooltip {...getTooltip('postSurvey')!} />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={studyConfig.enableVideoConferencing}
                    onChange={(e) => updateConfig('enableVideoConferencing', e.target.checked)}
                  />
                  <span className="text-label">Enable video conferencing support</span>
                  <InfoTooltip {...getTooltip('videoConferencing')!} />
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Q-Sort Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-label">
                Q-Sort Configuration
              </h2>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-label">
                    Grid Columns
                  </label>
                  <InfoTooltip {...getTooltip('gridColumns')!} />
                </div>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={studyConfig.gridColumns}
                  onChange={(e) => updateConfig('gridColumns', parseInt(e.target.value))}
                >
                  {[5, 7, 9, 11, 13].map((cols) => (
                    <option key={cols} value={cols}>
                      {cols} columns (from -{Math.floor(cols / 2)} to +{Math.floor(cols / 2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-label">
                    Distribution Shape
                  </label>
                  <InfoTooltip {...getTooltip('distributionShape')!} />
                </div>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={studyConfig.gridShape}
                  onChange={(e) => updateConfig('gridShape', e.target.value as any)}
                >
                  <option value="forced">Forced Distribution</option>
                  <option value="quasi-normal">Quasi-Normal Distribution</option>
                  <option value="free">Free Distribution</option>
                </select>
              </div>

              <div className="p-4 bg-quaternary-fill/30 rounded-lg">
                <p className="text-sm text-secondary-label">
                  <strong>Grid Preview:</strong> Your Q-sort grid will have{' '}
                  {studyConfig.gridColumns} columns ranging from -
                  {Math.floor(studyConfig.gridColumns / 2)} to +
                  {Math.floor(studyConfig.gridColumns / 2)} with a{' '}
                  {studyConfig.gridShape} distribution pattern.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-label">
                Review & Create
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-quaternary-fill/30 rounded-lg">
                  <h3 className="font-medium text-label mb-2">Study Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-secondary-label">Title:</dt>
                      <dd className="font-medium text-label">
                        {studyConfig.title || 'Not set'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-secondary-label">Grid Columns:</dt>
                      <dd className="font-medium text-label">
                        {studyConfig.gridColumns}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-secondary-label">Distribution:</dt>
                      <dd className="font-medium text-label">
                        {studyConfig.gridShape}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-secondary-label">Principal Investigator:</dt>
                      <dd className="font-medium text-label">
                        {studyConfig.researcherName || 'Not set'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-secondary-label">Organization:</dt>
                      <dd className="font-medium text-label">
                        {studyConfig.organizationName || 'Not set'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-secondary-label">Researcher Branding:</dt>
                      <dd className="font-medium text-label">
                        {studyConfig.includeResearcherSignature ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 bg-quaternary-fill/30 rounded-lg">
                  <h3 className="font-medium text-label mb-2">
                    Enabled Features
                  </h3>
                  <ul className="space-y-1 text-sm text-label">
                    {studyConfig.enablePreScreening && (
                      <li>✓ Pre-screening questions</li>
                    )}
                    {studyConfig.enablePostSurvey && <li>✓ Post-sort survey</li>}
                    {studyConfig.enableVideoConferencing && (
                      <li>✓ Video conferencing</li>
                    )}
                    {studyConfig.includeWelcomeVideo && (
                      <li>✓ Welcome video</li>
                    )}
                    {studyConfig.includeResearcherSignature && (
                      <li>✓ Researcher signature & branding at {studyConfig.brandingPosition}</li>
                    )}
                  </ul>
                </div>

                {studyConfig.organizationLogoUrl && (
                  <div className="p-4 bg-quaternary-fill/30 rounded-lg">
                    <h3 className="font-medium text-label mb-2">Organization</h3>
                    <div className="flex items-center gap-4">
                      <img
                        src={studyConfig.organizationLogoUrl}
                        alt={studyConfig.organizationName}
                        className="h-12 object-contain"
                      />
                      <span className="text-label">{studyConfig.organizationName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 5 && previewData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-label">
                  Participant Experience Preview
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-secondary-label">
                    <span className="font-medium">Estimated time:</span> {previewData.metadata?.estimatedTime || 15} minutes
                  </div>
                  <div className="text-sm text-secondary-label">
                    <span className="font-medium">Total steps:</span> {previewData.metadata?.totalSteps || 3}
                  </div>
                </div>
              </div>

              <ParticipantPreview 
                previewData={previewData} 
                studyTitle={studyConfig.title}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Preview Features</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Interactive navigation through all study steps</li>
                    <li>• Shows exact participant experience</li>
                    <li>• Test your study flow before publishing</li>
                    <li>• Click step buttons to jump between sections</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Enabled Features</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    {previewData.metadata?.features?.digitalSignature && <li>✓ Digital Signature</li>}
                    {previewData.metadata?.features?.preScreening && <li>✓ Pre-Screening Questions</li>}
                    {previewData.metadata?.features?.postSurvey && <li>✓ Post-Survey Questions</li>}
                    {previewData.metadata?.features?.videoConferencing && <li>✓ Video Conferencing</li>}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-xl">⚠️</span>
                  <div>
                    <h3 className="font-medium text-amber-900 mb-1">Review Before Creating</h3>
                    <p className="text-sm text-amber-800">
                      This is your final chance to review the study. You can go back to make changes 
                      or proceed to create the study. Once created, some settings cannot be modified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  localStorage.setItem('study_draft', JSON.stringify(studyConfig));
                  alert('Draft saved!');
                }}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
              
              <Button 
                variant="primary" 
                onClick={handleNext}
                disabled={isSaving}
              >
                {step === 5 ? (
                  isSaving ? 'Creating...' : 'Create Study'
                ) : step === 4 ? (
                  'Preview Study'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
      </Card>
    </div>
  );
}