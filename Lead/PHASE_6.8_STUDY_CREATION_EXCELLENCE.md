# PHASE 6.8: STUDY CREATION EXCELLENCE & PARTICIPANT EXPERIENCE 🎨

**Duration:** 4-5 days  
**Priority:** HIGH - Enhances user experience and research quality  
**Purpose:** World-class study creation with rich editing, templates, and IRB compliance  
**Status:** ⚠️ PARTIALLY COMPLETE (60% - Frontend Ready, Backend Missing)

## ⚠️ IMPLEMENTATION STATUS NOTICE

**IMPORTANT:** This phase is 60% complete. The frontend components are fully implemented and functional in isolation, but require backend API integration to persist data and function in production.

### What's Complete ✅
- Rich text editor component with formatting
- Template selection and fill-in-blanks UI
- Digital signature capture (3 modes)
- Tooltips and help system
- Enhanced study creation page UI

### What's Missing ❌
- ParticipantPreview component (state exists but unused)
- All backend API endpoints (specifications exist, code doesn't)
- DOMPurify sanitization (not installed)
- Image upload validation
- Database persistence

**See PHASE_6.8_FINAL_COMPLETION_REPORT.md for detailed gap analysis**

## 🎯 OBJECTIVES

Transform the study creation experience to match world-class platforms like Qualtrics, SurveyMonkey, and Typeform with:

1. **Rich Text Editing** - Advanced formatting for welcome & consent forms
2. **Smart Templates** - IRB-compliant templates with fill-in-the-blanks
3. **Professional Signatures** - Digital signature and logo capabilities
4. **Intuitive Guidance** - Context-aware tooltips and documentation
5. **Word Limits** - Enforced character/word limits for optimal engagement
6. **Multi-Page Flow** - Separate pages for welcome and consent in participant view

## 📊 RESEARCH INSIGHTS FROM INDUSTRY LEADERS

### Qualtrics Best Practices
- **Forced Response on Consent** - Requires explicit agreement before proceeding
- **Block-Based Flow** - Separate consent from survey content
- **Skip Logic** - Automatically end survey for non-consenting participants
- **Professional Templates** - Pre-built IRB-compliant consent forms

### SurveyMonkey Approach
- **Intro Pages** - Dedicated welcome and consent pages
- **Privacy Notices** - Built-in GDPR/privacy compliance
- **Clear Purpose Statements** - Explain survey goals and data usage
- **Time Estimates** - Show expected completion time upfront

### Typeform Excellence
- **Conversational Design** - Two-way conversation feel
- **Beautiful Forms** - 34% higher completion rates with good design
- **Mobile-First** - Responsive layouts for all devices
- **Brand Customization** - Fonts, colors, logos throughout

## 🚀 IMPLEMENTATION PLAN

### Day 1: Rich Text Editor & Enhanced UI

#### 1.1 Install Rich Text Editor Dependencies
```bash
cd frontend
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-link @tiptap/extension-image @tiptap/extension-text-align @tiptap/extension-placeholder @tiptap/extension-character-count
```

#### 1.2 Create RichTextEditor Component
```typescript
// frontend/components/editors/RichTextEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  showToolbar?: boolean;
  allowImages?: boolean;
  allowLinks?: boolean;
  allowVideos?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  minLength,
  showToolbar = true,
  allowImages = true,
  allowLinks = true,
  allowVideos = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Color,
      TextStyle,
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href), // Security: validate URLs
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rich-text-image',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="rich-text-editor">
      {showToolbar && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
      {maxLength && (
        <div className="character-count">
          {editor?.storage.characterCount.characters()}/{maxLength} characters
        </div>
      )}
    </div>
  );
};
```

#### 1.3 Enhanced Study Creation Form
```typescript
// frontend/app/(researcher)/studies/create/enhanced-page.tsx
interface EnhancedStudyConfig extends StudyConfig {
  titleCharLimit: number;
  descriptionCharLimit: number;
  welcomeMessageConfig: {
    content: string;
    charLimit: number;
    includeVideo: boolean;
    videoUrl?: string;
    template?: 'standard' | 'academic' | 'market-research' | 'custom';
  };
  consentFormConfig: {
    content: string;
    charLimit: number;
    template?: 'irb-standard' | 'hipaa' | 'gdpr' | 'minimal' | 'custom';
    requireSignature: boolean;
    includeLogo: boolean;
    logoUrl?: string;
    organizationName?: string;
    signatureType: 'typed' | 'drawn' | 'upload';
  };
}
```

### Day 2: Templates & Smart Content

#### 2.1 Welcome Message Templates
```typescript
// frontend/lib/templates/welcome-templates.ts
export const welcomeTemplates = {
  standard: {
    name: 'Standard Welcome',
    content: `
      <h2>Welcome to Our Research Study</h2>
      <p>Thank you for your interest in participating in this study about [TOPIC].</p>
      <p>This study will take approximately [TIME] minutes to complete.</p>
      <p>Your responses will help us understand [PURPOSE].</p>
      <ul>
        <li>All responses are confidential</li>
        <li>You may withdraw at any time</li>
        <li>Your data will be securely stored</li>
      </ul>
      <p>Click "Continue" to proceed to the consent form.</p>
    `,
    fields: ['TOPIC', 'TIME', 'PURPOSE'],
  },
  academic: {
    name: 'Academic Research',
    content: `
      <h2>University Research Study: [STUDY_TITLE]</h2>
      <p><strong>Principal Investigator:</strong> [PI_NAME], [DEPARTMENT]</p>
      <p><strong>Institution:</strong> [UNIVERSITY]</p>
      <p><strong>IRB Protocol #:</strong> [IRB_NUMBER]</p>
      
      <h3>Study Overview</h3>
      <p>You are invited to participate in a research study examining [RESEARCH_TOPIC]. 
      This study has been approved by the [UNIVERSITY] Institutional Review Board.</p>
      
      <h3>Time Commitment</h3>
      <p>Participation will require approximately [DURATION] minutes of your time.</p>
      
      <h3>What You'll Do</h3>
      <p>[STUDY_ACTIVITIES]</p>
      
      <p>Your participation is voluntary and you may discontinue at any time without penalty.</p>
    `,
    fields: ['STUDY_TITLE', 'PI_NAME', 'DEPARTMENT', 'UNIVERSITY', 'IRB_NUMBER', 'RESEARCH_TOPIC', 'DURATION', 'STUDY_ACTIVITIES'],
  },
  marketResearch: {
    name: 'Market Research',
    content: `
      <h2>Share Your Opinion About [PRODUCT/SERVICE]</h2>
      <p>Hello! We value your opinion and would love to hear your thoughts.</p>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
        <p><strong>🎯 Purpose:</strong> [RESEARCH_PURPOSE]</p>
        <p><strong>⏱️ Time:</strong> [DURATION] minutes</p>
        <p><strong>🎁 Incentive:</strong> [INCENTIVE_DESCRIPTION]</p>
      </div>
      
      <h3>Why Your Opinion Matters</h3>
      <p>[VALUE_PROPOSITION]</p>
      
      <p>All information you provide will be kept strictly confidential and used only for research purposes.</p>
    `,
    fields: ['PRODUCT/SERVICE', 'RESEARCH_PURPOSE', 'DURATION', 'INCENTIVE_DESCRIPTION', 'VALUE_PROPOSITION'],
  },
};
```

#### 2.2 Consent Form Templates (IRB Compliant)
```typescript
// frontend/lib/templates/consent-templates.ts
export const consentTemplates = {
  irbStandard: {
    name: 'IRB Standard Consent',
    content: `
      <h2>INFORMED CONSENT TO PARTICIPATE IN RESEARCH</h2>
      
      <p><strong>Study Title:</strong> [STUDY_TITLE]</p>
      <p><strong>Principal Investigator:</strong> [PI_NAME], [PI_CREDENTIALS]</p>
      <p><strong>Institution:</strong> [INSTITUTION]</p>
      <p><strong>IRB Protocol Number:</strong> [IRB_NUMBER]</p>
      <p><strong>Date:</strong> [DATE]</p>
      
      <h3>1. PURPOSE OF THE STUDY</h3>
      <p>[STUDY_PURPOSE]</p>
      
      <h3>2. PROCEDURES</h3>
      <p>If you agree to participate, you will be asked to:</p>
      <ul>
        <li>[PROCEDURE_1]</li>
        <li>[PROCEDURE_2]</li>
        <li>[PROCEDURE_3]</li>
      </ul>
      <p>The total time commitment is approximately [DURATION].</p>
      
      <h3>3. RISKS AND BENEFITS</h3>
      <p><strong>Risks:</strong> [RISKS_DESCRIPTION]</p>
      <p><strong>Benefits:</strong> [BENEFITS_DESCRIPTION]</p>
      
      <h3>4. CONFIDENTIALITY</h3>
      <p>[CONFIDENTIALITY_STATEMENT]</p>
      
      <h3>5. VOLUNTARY PARTICIPATION</h3>
      <p>Your participation is voluntary. You may refuse to participate or withdraw at any time without penalty.</p>
      
      <h3>6. CONTACT INFORMATION</h3>
      <p>If you have questions about this research, contact:</p>
      <p>[PI_NAME] at [PI_EMAIL] or [PI_PHONE]</p>
      <p>For questions about your rights as a research participant, contact the IRB at [IRB_CONTACT].</p>
      
      <h3>7. CONSENT</h3>
      <p>By clicking "I Agree" below, you confirm that:</p>
      <ul>
        <li>You have read and understood the information above</li>
        <li>You voluntarily agree to participate</li>
        <li>You are at least 18 years of age</li>
      </ul>
    `,
    fields: ['STUDY_TITLE', 'PI_NAME', 'PI_CREDENTIALS', 'INSTITUTION', 'IRB_NUMBER', 'DATE', 'STUDY_PURPOSE', 'PROCEDURE_1', 'PROCEDURE_2', 'PROCEDURE_3', 'DURATION', 'RISKS_DESCRIPTION', 'BENEFITS_DESCRIPTION', 'CONFIDENTIALITY_STATEMENT', 'PI_EMAIL', 'PI_PHONE', 'IRB_CONTACT'],
  },
  hipaa: {
    name: 'HIPAA Compliant Consent',
    content: `
      <h2>AUTHORIZATION TO USE AND DISCLOSE PROTECTED HEALTH INFORMATION FOR RESEARCH</h2>
      
      <p>This form complies with HIPAA Privacy Rule (45 CFR 164.508)</p>
      
      <h3>RESEARCH INFORMATION</h3>
      <p><strong>Study Title:</strong> [STUDY_TITLE]</p>
      <p><strong>Sponsor:</strong> [SPONSOR]</p>
      <p><strong>Principal Investigator:</strong> [PI_NAME]</p>
      
      <h3>PROTECTED HEALTH INFORMATION (PHI)</h3>
      <p>The following PHI may be used or disclosed:</p>
      <ul>
        <li>[PHI_TYPE_1]</li>
        <li>[PHI_TYPE_2]</li>
        <li>[PHI_TYPE_3]</li>
      </ul>
      
      <h3>PURPOSE OF USE/DISCLOSURE</h3>
      <p>[PURPOSE]</p>
      
      <h3>AUTHORIZATION EXPIRATION</h3>
      <p>This authorization expires on [EXPIRATION_DATE] or when the research ends.</p>
      
      <h3>RIGHT TO REVOKE</h3>
      <p>You may revoke this authorization at any time by written notice to [REVOCATION_CONTACT].</p>
      
      <h3>SIGNATURE</h3>
      <p>I have read this form and authorize the use and disclosure of my PHI for this research.</p>
    `,
    fields: ['STUDY_TITLE', 'SPONSOR', 'PI_NAME', 'PHI_TYPE_1', 'PHI_TYPE_2', 'PHI_TYPE_3', 'PURPOSE', 'EXPIRATION_DATE', 'REVOCATION_CONTACT'],
  },
  gdpr: {
    name: 'GDPR Compliant Consent',
    content: `
      <h2>CONSENT FOR DATA PROCESSING - GDPR COMPLIANT</h2>
      
      <h3>DATA CONTROLLER</h3>
      <p><strong>Organization:</strong> [ORGANIZATION]</p>
      <p><strong>Contact:</strong> [DPO_CONTACT]</p>
      
      <h3>PURPOSE OF PROCESSING</h3>
      <p>[PROCESSING_PURPOSE]</p>
      
      <h3>LEGAL BASIS</h3>
      <p>Processing is based on your explicit consent (Article 6(1)(a) GDPR).</p>
      
      <h3>DATA TO BE COLLECTED</h3>
      <ul>
        <li>[DATA_TYPE_1]</li>
        <li>[DATA_TYPE_2]</li>
        <li>[DATA_TYPE_3]</li>
      </ul>
      
      <h3>DATA RETENTION</h3>
      <p>Your data will be retained for [RETENTION_PERIOD] and then securely deleted.</p>
      
      <h3>YOUR RIGHTS</h3>
      <p>Under GDPR, you have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Rectify inaccurate data</li>
        <li>Request erasure ("right to be forgotten")</li>
        <li>Restrict processing</li>
        <li>Data portability</li>
        <li>Object to processing</li>
        <li>Withdraw consent at any time</li>
      </ul>
      
      <h3>INTERNATIONAL TRANSFERS</h3>
      <p>[TRANSFER_STATEMENT]</p>
      
      <h3>CONSENT</h3>
      <p>By clicking "I Consent," you freely give your informed consent to the processing of your personal data as described above.</p>
    `,
    fields: ['ORGANIZATION', 'DPO_CONTACT', 'PROCESSING_PURPOSE', 'DATA_TYPE_1', 'DATA_TYPE_2', 'DATA_TYPE_3', 'RETENTION_PERIOD', 'TRANSFER_STATEMENT'],
  },
};
```

### Day 3: Digital Signature & Logo Implementation

#### 3.1 Signature Component
```typescript
// frontend/components/signature/DigitalSignature.tsx
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface DigitalSignatureProps {
  onSignatureComplete: (signature: string) => void;
  signatureType: 'typed' | 'drawn' | 'upload';
  organizationLogo?: string;
  organizationName?: string;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureComplete,
  signatureType,
  organizationLogo,
  organizationName,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [typedName, setTypedName] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);

  const handleDrawnSignature = () => {
    if (sigCanvas.current) {
      const signature = sigCanvas.current.toDataURL();
      onSignatureComplete(signature);
    }
  };

  const handleTypedSignature = () => {
    // Convert typed name to stylized signature font
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 400;
      canvas.height = 100;
      ctx.font = 'italic 30px Brush Script MT, cursive';
      ctx.fillText(typedName, 10, 60);
      onSignatureComplete(canvas.toDataURL());
    }
  };

  return (
    <div className="signature-container">
      {organizationLogo && (
        <div className="organization-header">
          <img src={organizationLogo} alt={organizationName} className="h-16" />
          <h3>{organizationName}</h3>
        </div>
      )}

      {signatureType === 'drawn' && (
        <div className="drawn-signature">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: 'signature-canvas',
              width: 500,
              height: 200,
            }}
          />
          <div className="signature-actions">
            <Button onClick={() => sigCanvas.current?.clear()}>Clear</Button>
            <Button onClick={handleDrawnSignature}>Save Signature</Button>
          </div>
        </div>
      )}

      {signatureType === 'typed' && (
        <div className="typed-signature">
          <TextField
            label="Type your full name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="John Doe"
          />
          <div className="signature-preview" style={{ fontFamily: 'cursive', fontSize: '24px' }}>
            {typedName}
          </div>
          <Button onClick={handleTypedSignature}>Use as Signature</Button>
        </div>
      )}

      {signatureType === 'upload' && (
        <div className="upload-signature">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setUploadedSignature(e.target?.result as string);
                  onSignatureComplete(e.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          {uploadedSignature && (
            <img src={uploadedSignature} alt="Uploaded signature" className="h-20" />
          )}
        </div>
      )}

      <div className="consent-agreement">
        <p className="text-sm text-secondary-label">
          By providing your signature above, you agree to the terms and conditions outlined in this consent form.
        </p>
        <p className="text-xs text-tertiary-label">
          Date: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
```

### Day 4: Tooltips, Validation & Participant Preview

#### 4.1 Informational Tooltips
```typescript
// frontend/components/tooltips/InfoTooltip.tsx
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/Tooltip';

interface InfoTooltipProps {
  title: string;
  content: string;
  link?: {
    text: string;
    href: string;
  };
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, content, link }) => {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm">{content}</p>
          {link && (
            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-system-blue text-sm mt-2 inline-block">
              {link.text} →
            </a>
          )}
        </div>
      }
    >
      <InformationCircleIcon className="w-5 h-5 text-secondary-label hover:text-label cursor-help" />
    </Tooltip>
  );
};
```

#### 4.2 Tooltip Content Configuration
```typescript
// frontend/lib/tooltips/study-creation-tooltips.ts
export const studyCreationTooltips = {
  preScreening: {
    title: 'Pre-screening Questions',
    content: 'Pre-screening questions help filter participants based on specific criteria. Participants who don\'t meet your requirements will be politely excluded from the study.',
    examples: [
      'Age requirements (e.g., 18+ years)',
      'Geographic location',
      'Professional background',
      'Experience with specific topics',
    ],
    link: {
      text: 'Learn more about pre-screening',
      href: '/docs/pre-screening',
    },
  },
  postSurvey: {
    title: 'Post-Survey Questions',
    content: 'Post-survey questions gather additional context after the Q-sort is complete. These help interpret the sorting patterns.',
    questionTypes: [
      'Demographics (age, gender, education)',
      'Open-ended reflection questions',
      'Likert scales for attitudes',
      'Multiple choice for categorization',
      'Ranking questions for priorities',
    ],
    link: {
      text: 'View question type examples',
      href: '/docs/question-types',
    },
  },
  studyTitle: {
    title: 'Study Title Best Practices',
    content: 'Keep your title concise (50-100 characters) and descriptive. Avoid jargon and make it appealing to potential participants.',
    tips: [
      'Use action words',
      'Be specific about the topic',
      'Avoid technical terms',
      'Consider your target audience',
    ],
  },
  welcomeMessage: {
    title: 'Welcome Message Guidelines',
    content: 'Your welcome message sets the tone. Include: purpose, time estimate, what participants will do, and why their input matters.',
    characterLimit: 500,
    optionalVideo: true,
  },
  consentForm: {
    title: 'Consent Form Requirements',
    content: 'Consent forms must meet ethical and legal standards. Use templates for IRB, HIPAA, or GDPR compliance.',
    requirements: [
      'Study purpose and procedures',
      'Risks and benefits',
      'Confidentiality statement',
      'Voluntary participation',
      'Contact information',
      'Right to withdraw',
    ],
  },
};
```

#### 4.3 Participant View Preview
```typescript
// frontend/components/preview/ParticipantPreview.tsx
interface ParticipantPreviewProps {
  welcomeMessage: string;
  consentForm: string;
  includeVideo?: boolean;
  videoUrl?: string;
  requireSignature?: boolean;
  organizationLogo?: string;
}

export const ParticipantPreview: React.FC<ParticipantPreviewProps> = ({
  welcomeMessage,
  consentForm,
  includeVideo,
  videoUrl,
  requireSignature,
  organizationLogo,
}) => {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'consent' | 'start'>('welcome');

  return (
    <div className="participant-preview">
      <div className="preview-header">
        <span className="text-sm text-secondary-label">Participant View Preview</span>
        <div className="preview-navigation">
          <button 
            className={currentPage === 'welcome' ? 'active' : ''}
            onClick={() => setCurrentPage('welcome')}
          >
            Welcome
          </button>
          <button 
            className={currentPage === 'consent' ? 'active' : ''}
            onClick={() => setCurrentPage('consent')}
          >
            Consent
          </button>
          <button 
            className={currentPage === 'start' ? 'active' : ''}
            onClick={() => setCurrentPage('start')}
          >
            Start Study
          </button>
        </div>
      </div>

      <div className="preview-content">
        {currentPage === 'welcome' && (
          <div className="welcome-page">
            {includeVideo && videoUrl && (
              <div className="video-container mb-6">
                <video controls src={videoUrl} className="w-full rounded-lg" />
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: welcomeMessage }} />
            <Button onClick={() => setCurrentPage('consent')}>
              Continue to Consent Form
            </Button>
          </div>
        )}

        {currentPage === 'consent' && (
          <div className="consent-page">
            {organizationLogo && (
              <img src={organizationLogo} alt="Organization" className="h-16 mb-4" />
            )}
            <div dangerouslySetInnerHTML={{ __html: consentForm }} />
            {requireSignature && (
              <DigitalSignature 
                onSignatureComplete={() => {}}
                signatureType="typed"
              />
            )}
            <div className="consent-actions">
              <Button variant="secondary" onClick={() => setCurrentPage('welcome')}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentPage('start')}>
                I Agree & Continue
              </Button>
            </div>
          </div>
        )}

        {currentPage === 'start' && (
          <div className="start-page">
            <h2>Ready to Begin</h2>
            <p>Thank you for agreeing to participate. Click below to start the study.</p>
            <Button variant="primary" size="large">
              Start Q-Sort
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Day 5: Integration & Testing

#### 5.1 Updated Study Creation Page Integration
```typescript
// Update frontend/app/(researcher)/studies/create/page.tsx
// Add rich text editor, templates, signature, and preview functionality
```

#### 5.2 Validation Rules
```typescript
// frontend/lib/validation/study-validation.ts
export const studyValidation = {
  title: {
    min: 10,
    max: 100,
    pattern: /^[a-zA-Z0-9\s\-:,.'!?]+$/,
    message: 'Title must be 10-100 characters, alphanumeric with basic punctuation',
  },
  description: {
    min: 50,
    max: 500,
    message: 'Description must be 50-500 characters',
  },
  welcomeMessage: {
    min: 100,
    max: 1000,
    requiresPurpose: true,
    requiresTimeEstimate: true,
    message: 'Welcome message must include purpose and time estimate (100-1000 chars)',
  },
  consentForm: {
    min: 500,
    max: 5000,
    requiredSections: ['purpose', 'procedures', 'risks', 'benefits', 'confidentiality', 'voluntary', 'contact'],
    message: 'Consent form must include all required sections (500-5000 chars)',
  },
};
```

## 📊 SUCCESS METRICS

### User Experience Metrics
- [ ] Study creation time reduced by 40%
- [ ] Template usage rate > 70%
- [ ] Form completion rate > 85%
- [ ] Error rate < 5%

### Compliance Metrics
- [ ] IRB template compliance 100%
- [ ] GDPR/HIPAA template availability
- [ ] Signature capture success rate > 95%
- [ ] Consent acceptance tracking 100%

### Technical Metrics
- [ ] Rich text editor performance < 50ms response
- [ ] Character count accuracy 100%
- [ ] Template loading time < 200ms
- [ ] Preview rendering < 100ms

## 🔍 TESTING CHECKLIST

### Functional Testing
- [ ] Rich text editor formats correctly
- [ ] Links are validated for security
- [ ] Images upload and display properly
- [ ] Character limits enforce correctly
- [ ] Templates populate all fields
- [ ] Signature captures work on all devices
- [ ] Logo uploads maintain aspect ratio
- [ ] Preview shows accurate participant view

### Compliance Testing
- [ ] IRB template meets standards
- [ ] HIPAA template includes all requirements
- [ ] GDPR template has all rights listed
- [ ] Consent tracking logs properly
- [ ] Signature timestamps recorded

### User Experience Testing
- [ ] Tooltips display on hover
- [ ] Documentation links work
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Error messages are helpful

## 📚 DELIVERABLES

1. **Enhanced Components**
   - RichTextEditor with full formatting
   - DigitalSignature with three modes
   - ParticipantPreview with page flow
   - InfoTooltip with contextual help

2. **Template Library**
   - 3+ Welcome message templates
   - 4+ Consent form templates (IRB, HIPAA, GDPR, minimal)
   - Field replacement system
   - Template customization

3. **Validation System**
   - Character/word limits
   - Required field checking
   - URL validation for security
   - Content sanitization

4. **Documentation**
   - User guide for study creation
   - Template customization guide
   - Compliance checklist
   - API documentation updates

## 🎯 IMPLEMENTATION STATUS

### Completed ✅
- [x] Research industry best practices
- [x] Design enhanced UI/UX flow
- [x] Plan rich text editor integration
- [x] Create template library structure
- [x] Design signature component

### In Progress 🔄
- [ ] Implement RichTextEditor component
- [ ] Create template system
- [ ] Build signature functionality
- [ ] Add participant preview
- [ ] Integrate with existing page

### Pending ⏳
- [ ] Testing and validation
- [ ] Documentation updates
- [ ] Performance optimization
- [ ] Accessibility testing
- [ ] Deploy to production

## 🚀 NEXT STEPS

1. **Immediate Actions**
   - Install rich text editor dependencies
   - Create base components
   - Implement template system

2. **Testing Phase**
   - Unit tests for all components
   - Integration testing
   - User acceptance testing

3. **Documentation**
   - Update user guides
   - Create video tutorials
   - Update API docs

4. **Deployment**
   - Stage deployment
   - Production rollout
   - Monitor metrics

---

**Phase 6.8 transforms VQMethod into a world-class research platform with professional study creation capabilities matching industry leaders while maintaining our focus on Q-methodology excellence.**