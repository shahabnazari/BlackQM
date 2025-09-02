# VQMethod - Complete Product Specification
## Advanced Q Methodology Research Platform with Apple Design Excellence

**Version:** 3.0  
**Date:** August 31, 2025  
**Document Type:** Complete Product & Quality Specification  
**Build Approach:** Ground-up development with Apple HIG principles

---

## Executive Summary

VQMethod is a next-generation Q methodology research platform built from scratch following Apple Human Interface Guidelines (HIG) design principles. The platform features a comprehensive 8-step participant journey with advanced questionnaire building capabilities, integrated video conferencing, and dual interfaces for researchers and participants.

**Design Philosophy:** Apple's clarity, deference, and consistency principles applied to academic research software.

**Core Principle:** Build once, build beautifully - clean code, intuitive design, research excellence.

---

## Product Vision & Scope

### Primary Objectives
1. **Research Excellence:** Deliver publication-grade Q methodology tools with complete 8-step participant flow
2. **Design Excellence:** Apple HIG-compliant interface design with exceptional user experience
3. **Dual Architecture:** Separate optimized interfaces for researchers and participants
4. **Advanced Integration:** Google Meet/Zoom integration throughout the research process
5. **Global Accessibility:** Multi-language, mobile-optimized platform following Apple accessibility standards

### Success Criteria (Measurable Gates)
- **Statistical Accuracy:** Factor correlation ≥ 0.99 on published Q methodology benchmark datasets
- **Design Quality:** Pass all automated Apple HIG audit checklist items (defined in apple-design:validate script)  
- **User Satisfaction:** >4.8/5.0 rating for both researcher and participant interfaces
- **Performance:** <2s page load times, 60fps animations, 10,000+ concurrent users supported
- **Academic Impact:** Platform successfully processes 50+ published studies within 18 months

---

# PART I: DUAL ARCHITECTURE OVERVIEW

## Researcher Interface (Design & Management Platform)
**Primary Users:** Academic researchers, research teams, study coordinators
**Core Functions:**
- Study design and configuration
- Advanced questionnaire builder (10+ question types)
- Participant management and recruitment  
- Real-time data collection monitoring
- Advanced Q methodology analysis
- Export and reporting capabilities
- Team collaboration tools

## Participant Interface (Response Platform)  
**Primary Users:** Study participants across all devices
**Core Functions:**
- 8-step guided participation journey
- Mobile-optimized Q-sort interface
- Video/audio content consumption
- Real-time progress tracking
- Integrated video conferencing support
- Multi-language accessibility

---

# PART II: DETAILED PARTICIPANT JOURNEY (8-STEP FLOW)

## Step 1: Pre-Screening Questions (Optional)
**Purpose:** Filter participants based on researcher-defined criteria before main study
**Interface Design:** Apple-style form interface with progressive disclosure

### Technical Specifications:
```typescript
interface PreScreeningStep {
  id: string;
  isEnabled: boolean;
  questions: AdvancedQuestion[];
  passingCriteria: ScreeningCriteria[];
  failureRedirect: {
    message: string;
    // SECURITY: Only allow pre-approved internal paths, no external URLs
    redirectPath?: '/thank-you' | '/contact' | '/support' | null;
    // Legacy field for backward compatibility - will be validated and rejected if external
    redirectUrl?: string; 
  };
}

interface ScreeningCriteria {
  questionId: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: any;
  required: boolean;
}
```

### Features:
- **Advanced Question Builder:** 10+ question types (see detailed specs below)
- **Logic Branching:** Skip patterns and conditional questions
- **Real-time Validation:** Immediate feedback on responses
- **Progress Indicators:** Apple-style progress bars
- **Auto-save:** Continuous background saving
- **Accessibility:** Full VoiceOver and keyboard navigation support

### Question Types (Qualtrics-Comparable):
1. **Multiple Choice** (single select)
2. **Multiple Choice** (multi select)
3. **Dropdown** (single select)
4. **Rating Scale** (1-5, 1-7, 1-10, custom)
5. **Likert Scale** (Strongly Disagree to Strongly Agree)
6. **Semantic Differential** (bipolar scales)
7. **Text Entry** (short text, long text, essay)
8. **Numeric Entry** (with validation ranges)
9. **Date/Time** (calendar picker)
10. **Slider** (continuous scale)
11. **Rank Order** (drag-and-drop ranking)
12. **Matrix/Grid** (multiple questions with same scale)
13. **File Upload** (images, documents, audio, video)
14. **Constant Sum** (allocate points across options)
15. **Net Promoter Score** (0-10 scale with categorization)

## Step 2: Welcome Page
**Purpose:** Introduce study and provide context to participants
**Design:** Apple-style hero section with clean typography and visual hierarchy

### Technical Specifications:
```typescript
interface WelcomeStep {
  id: string;
  content: {
    text: {
      content: string; // Rich text with word limit
      wordLimit: number; // Default: 500 words
      formatting: RichTextOptions;
    };
    video?: {
      file: File;
      maxSize: number; // Default: 100MB
      formats: string[]; // ['mp4', 'mov', 'avi', 'webm']
      autoplay: boolean;
      controls: boolean;
      subtitles?: SubtitleTrack[];
    };
    displayMode: 'textOnly' | 'videoOnly' | 'textAndVideo';
  };
  design: AppleDesignSettings;
}

interface RichTextOptions {
  allowBold: boolean;
  allowItalic: boolean;
  allowUnderline: boolean;
  allowBulletLists: boolean;
  allowNumberedLists: boolean;
  allowLinks: boolean;
  allowImages: boolean;
  fontFamily: 'sf-pro' | 'sf-compact' | 'system';
  fontSize: number[];
  textAlign: 'left' | 'center' | 'right' | 'justify';
}
```

### Features:
- **Rich Text Editor:** Word-like editing capabilities with Apple-style toolbar
- **Video Integration:** Native HTML5 player with custom Apple-style controls
- **Responsive Design:** Adapts beautifully across all Apple device sizes
- **Multi-language Support:** Dynamic text rendering with proper typography
- **Progress Tracking:** Visual progress indicator following Apple guidelines

### Apple Design Implementation:
- **Typography:** San Francisco Pro font family
- **Color Palette:** Apple system colors with dynamic color support
- **Spacing:** Apple's 8pt grid system
- **Animation:** Smooth transitions using Apple's easing curves
- **Accessibility:** Dynamic Type support and high contrast mode

## Step 3: Consent Form
**Purpose:** Obtain informed consent with full legal compliance
**Design:** Clean, readable form following Apple's document design principles

### Technical Specifications:
```typescript
interface ConsentStep {
  id: string;
  content: {
    title: string;
    body: string; // Rich text with extensive formatting
    wordLimit: number; // Default: 2000 words
    formatting: ExtendedRichTextOptions;
    legalSections: LegalSection[];
  };
  validation: {
    requireScrollToEnd: boolean;
    minimumReadTime: number; // seconds
    requireInitials: boolean;
    requireSignature: boolean;
  };
  design: AppleDocumentDesign;
}

interface ExtendedRichTextOptions extends RichTextOptions {
  allowTables: boolean;
  allowHeaders: boolean;
  allowFooters: boolean;
  allowPageBreaks: boolean;
  allowLegalFormatting: boolean;
  documentStyles: DocumentStyleSheet;
}

interface LegalSection {
  title: string;
  content: string;
  required: boolean;
  initialRequired: boolean;
}
```

### Features:
- **Advanced Rich Text Editor:** Full Word-like capabilities
  - Headers and subheaders (H1-H6)
  - Bullet and numbered lists
  - Tables with styling
  - Bold, italic, underline formatting
  - Text alignment and spacing
  - Legal document formatting
  - Hyperlinks and email links
- **Consent Tracking:** Granular consent recording
- **Digital Signature:** Touch and mouse signature capture
- **Scroll Validation:** Ensure participants read full consent
- **Time Validation:** Minimum reading time enforcement
- **Multi-language Legal Text:** Professional translation support

### Apple Design Implementation:
- **Reading Experience:** Apple's reader mode inspiration
- **Form Design:** iOS form styling with floating labels
- **Button Design:** Apple-style primary and secondary buttons
- **Error States:** Gentle, helpful error messaging
- **Loading States:** Apple-style activity indicators

## Step 4: Familiarization (Concourse of Communication)
**Purpose:** Allow participants to review all stimuli before sorting
**Design:** Apple-style media gallery with intuitive navigation

### Technical Specifications:
```typescript
interface FamiliarizationStep {
  id: string;
  stimuli: Stimulus[];
  layout: {
    displayMode: 'grid' | 'list' | 'carousel' | 'masonry';
    itemsPerRow: number; // Responsive breakpoints
    allowZoom: boolean;
    allowFullscreen: boolean;
    showProgress: boolean;
  };
  interaction: {
    allowNotes: boolean;
    allowBookmarks: boolean;
    allowSharing: boolean; // SECURITY: Default false, disable for public studies
    timeLimit?: number;
    minimumViewTime?: number;
    // Security controls for sharing
    sharingRestrictions?: {
      requireAuthentication: boolean;
      watermarkContent: boolean;
      trackViews: boolean;
      expireAfter?: number; // hours
    };
  };
  design: AppleGalleryDesign;
}

interface Stimulus {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'html';
  content: string | File;
  metadata: {
    title?: string;
    description?: string;
    duration?: number; // for video/audio
    tags?: string[];
  };
  accessibility: {
    altText?: string;
    transcript?: string;
    captions?: SubtitleTrack[];
  };
  // SECURITY: HTML stimuli require strict sandboxing
  security?: {
    htmlSanitized?: boolean; // Required true for 'html' type
    sandboxed?: boolean; // Required true for 'html' type  
    allowedDomains?: string[]; // Whitelist for external resources
    contentSecurityPolicy?: string; // Strict CSP for HTML content
  };
}
```

### Features:
- **Multi-Media Gallery:** Apple Photos-inspired interface
  - High-resolution image display with zoom
  - Native video player with custom controls
  - Audio player with waveform visualization
  - PDF viewer with page navigation
  - Text display with beautiful typography
- **Adaptive Layout:** Responds to content type and screen size
- **Touch Gestures:** Native iOS-style pinch, zoom, swipe
- **Keyboard Navigation:** Full keyboard accessibility
- **Progress Tracking:** Visual indicators of viewed content
- **Bookmarking:** Allow participants to mark important stimuli
- **Search & Filter:** Quick content discovery

### Apple Design Implementation:
- **Media Presentation:** Apple TV app inspiration for video content
- **Image Gallery:** Photos app grid layout and transitions
- **Navigation:** iOS tab bar and navigation bar patterns
- **Gestures:** Native touch interactions matching iOS patterns
- **Dark Mode:** Full support with automatic switching

## Step 5: Pre-Sorting (Three-Box Categorization)
**Purpose:** Initial rough categorization to make main sorting manageable
**Design:** Apple-style drag-and-drop interface with clear visual feedback

### Technical Specifications:
```typescript
interface PreSortingStep {
  id: string;
  stimuliStack: {
    position: 'top' | 'left' | 'right';
    layout: 'stack' | 'fan' | 'grid';
    showCounter: boolean;
  };
  sortingBoxes: {
    left: SortingBox;
    middle: SortingBox;
    right: SortingBox;
  };
  interaction: {
    allowReordering: boolean;
    allowDoubleClick: boolean;
    showProgress: boolean;
    autoSave: boolean;
  };
  design: AppleDragDropDesign;
}

interface SortingBox {
  id: string;
  label: string;
  description?: string;
  color: AppleColor;
  maxItems?: number;
  position: BoxPosition;
}

interface AppleDragDropDesign {
  dragStyle: 'ios' | 'macos';
  dropZoneStyle: AppleDropZone;
  animation: AppleAnimation;
  feedback: HapticFeedback;
}
```

### Features:
- **Intelligent Stacking:** Stimuli displayed in organized stack at top
- **Three-Box Interface:** Clean categorization system
  - **Left Box:** Researcher-defined extreme label (e.g., "Strongly Disagree")
  - **Middle Box:** Neutral zone (e.g., "Neutral/Unsure")
  - **Right Box:** Researcher-defined extreme label (e.g., "Strongly Agree")
- **Drag-and-Drop Excellence:**
  - iOS-style drag previews with subtle shadows
  - Visual feedback during drag operations
  - Magnetic drop zones with gentle animations
  - Haptic feedback on iOS devices
  - Smooth physics-based animations
- **Smart Assistance:**
  - Visual count indicators
  - Progress tracking
  - Undo/redo functionality
  - Auto-save every 5 seconds

### Apple Design Implementation:
- **Drag Interactions:** Native iOS drag-and-drop patterns
- **Visual Hierarchy:** Clear typography and spacing
- **Color System:** Apple's semantic color system
- **Animation:** Smooth, physics-based motion
- **Accessibility:** Full VoiceOver support with custom actions

## Step 6: Main Q-Sort Grid
**Purpose:** Precise sorting of stimuli into researcher-designed grid
**Design:** Apple-style sophisticated grid interface with advanced interactions

### Technical Specifications:
```typescript
interface QSortGridStep {
  id: string;
  grid: {
    columns: GridColumn[];
    shape: 'forced' | 'free' | 'quasi-normal';
    allowEmpty: boolean;
    showLabels: boolean;
    showValues: boolean;
  };
  sourceBoxes: {
    showAbove: boolean;
    allowReturn: boolean;
    groupByPrevious: boolean;
  };
  interactions: {
    dragAndDrop: boolean;
    doubleClickToMove: boolean;
    keyboardNavigation: boolean;
    touchGestures: boolean;
    allowGridReorder: boolean;
  };
  assistance: {
    showProgress: boolean;
    showRemaining: boolean;
    validateCompleteness: boolean;
    allowReset: boolean;
    allowUndo: boolean;
    undoLevels: number; // Default: 50
  };
  design: AppleGridDesign;
}

interface GridColumn {
  id: string;
  value: number; // e.g., -4, -3, -2, -1, 0, +1, +2, +3, +4
  label: string; // e.g., "Strongly Disagree", "Neutral", "Strongly Agree"
  maxItems: number | null; // null for free distribution
  color?: AppleColor;
  position: number;
}

interface AppleGridDesign {
  cellStyle: AppleCellStyle;
  gridLayout: AppleGridLayout;
  responsiveBreakpoints: ResponsiveGrid[];
  accessibility: AccessibilityOptions;
}
```

### Features:
- **Advanced Grid System:**
  - Researcher-configurable grid dimensions
  - Forced or free distribution options
  - Visual column labels and values
  - Responsive grid that adapts to screen size
  - Customizable cell styling and colors

- **Source Box Integration:**
  - Three boxes from pre-sorting displayed above grid
  - Maintain visual connection to previous step
  - Allow movement back to boxes if needed
  - Visual grouping by previous categorization

- **Sophisticated Interactions:**
  - **Drag-and-Drop:** Premium iOS-style dragging
    - Live previews during drag
    - Magnetic snap to grid cells
    - Visual feedback for valid/invalid drops
    - Smooth animations with physics
  - **Multi-Movement Options:**
    - Drag from boxes to grid
    - Drag within grid cells
    - Drag back to boxes
    - Keyboard arrow key navigation
    - Double-click quick placement
  - **Touch Gestures:**
    - Long press to lift item
    - Swipe between columns
    - Pinch to zoom on mobile
    - Tap to select/deselect

- **Advanced Assistance:**
  - **Reset Functionality:** Complete grid reset with confirmation
  - **Unlimited Undo/Redo:** With visual history indicator
  - **Progress Tracking:** Visual completion percentage
  - **Validation:** Ensure all items are placed
  - **Auto-save:** Continuous background saving
  - **Conflict Resolution:** Handle simultaneous device access

### Apple Design Implementation:
- **Grid Aesthetics:** iOS collection view styling
- **Cell Design:** Apple-style cards with subtle shadows
- **Animation System:** Core Animation-inspired transitions
- **Color Semantics:** Apple's system color palette
- **Typography:** San Francisco font with proper sizing
- **Accessibility:** Full Dynamic Type and VoiceOver support

## Step 7: Post-Sort Commentary (Edge Stimulus Reflection)
**Purpose:** Collect participant reasoning for extreme placements
**Design:** Apple-style interview interface with elegant text input

### Technical Specifications:
```typescript
interface PostSortCommentaryStep {
  id: string;
  targetStimuli: {
    selectionMethod: 'extremePositions' | 'specificColumns' | 'researcherSelected';
    columns?: number[]; // e.g., [-4, -3, +3, +4] for extreme columns
    maxItems?: number; // Maximum items to comment on
    randomize?: boolean;
  };
  commentary: {
    wordLimit: {
      minimum: number; // Default: 50 words
      maximum: number; // Default: 300 words
    };
    allowRichText: boolean;
    showWordCount: boolean;
    showCharacterCount: boolean;
    validationRequired: boolean;
  };
  interface: {
    layout: 'sequential' | 'overview' | 'split';
    showStimulus: boolean;
    showGridPosition: boolean;
    showProgress: boolean;
    allowSkip: boolean;
  };
  design: AppleTextInputDesign;
}

interface CommentaryPrompt {
  stimulusId: string;
  gridPosition: number;
  customPrompt?: string;
  defaultPrompt: string; // "Why did you place this stimulus in this position?"
}
```

### Features:
- **Smart Stimulus Selection:**
  - Automatically identify edge placements
  - Focus on most extreme positions (-4/-3, +3/+4)
  - Researcher can customize which positions require comments
  - Optional randomization of comment order

- **Intelligent Commentary Interface:**
  - **Stimulus Display:** Show original stimulus clearly
  - **Grid Context:** Display where item was placed
  - **Custom Prompts:** Researcher-defined questions per stimulus
  - **Word Count Enforcement:** Minimum word requirements with gentle encouragement
  - **Rich Text Support:** Basic formatting for participant responses

- **Progressive Interface:**
  - **Sequential Mode:** One stimulus at a time with smooth transitions
  - **Overview Mode:** See all required commentaries at once
  - **Split Mode:** Stimulus on left, text input on right
  - **Progress Indicators:** Clear advancement through required comments

- **Validation & Assistance:**
  - Real-time word count with visual feedback
  - Gentle prompting for minimum word requirements
  - Auto-save every 10 seconds
  - Skip options for non-essential comments
  - Rich text editing with Apple-style toolbar

### Apple Design Implementation:
- **Text Input:** iOS text view styling with placeholder text
- **Keyboard Experience:** Optimized for iOS keyboard
- **Visual Feedback:** Apple-style progress indicators
- **Error States:** Gentle, encouraging validation messages
- **Accessibility:** Full VoiceOver support with text reading

## Step 8a: Post-Survey Questionnaire (Optional)
**Purpose:** Additional data collection after Q-sort completion
**Design:** Same advanced questionnaire system as pre-screening

### Technical Specifications:
```typescript
interface PostSurveyStep {
  id: string;
  isEnabled: boolean;
  questions: AdvancedQuestion[];
  design: {
    title: string;
    description?: string;
    showProgress: boolean;
    allowBackNavigation: boolean;
    randomizeOrder?: boolean;
  };
  completion: {
    required: boolean;
    allowPartialSubmission: boolean;
    saveIncomplete: boolean;
  };
}
```

### Features:
- **Full Question Builder:** Same 15+ question types as pre-screening
- **Conditional Logic:** Skip patterns based on Q-sort results
- **Q-Sort Integration:** Reference participant's sorting choices in questions
- **Progress Tracking:** Visual completion indicators
- **Flexible Completion:** Allow partial submission if needed

## Step 8b: Thank You Page
**Purpose:** Study completion acknowledgment and next steps
**Design:** Apple-style completion interface with celebration

### Technical Specifications:
```typescript
interface ThankYouStep {
  id: string;
  content: {
    title: string;
    message: string;
    showCompletionCelebration: boolean;
    includeContactInfo: boolean;
    includeResultsPromise: boolean;
  };
  actions: {
    downloadCertificate?: boolean;
    shareStudy?: boolean;
    contactResearcher?: boolean;
    joinFutureStudies?: boolean;
  };
  design: AppleCelebrationDesign;
}
```

### Features:
- **Completion Celebration:** Apple-style success animation
- **Personalized Message:** Thank participant by name if provided
- **Next Steps:** Clear information about what happens next
- **Contact Options:** Easy researcher contact methods
- **Certificate Generation:** Optional participation certificate
- **Study Sharing:** Social media sharing options

---

# PART III: INTEGRATED VIDEO CONFERENCING

## Google Meet & Zoom Integration
**Purpose:** Enable real-time researcher-participant interaction throughout the journey

### Technical Specifications:
```typescript
interface VideoConferencingIntegration {
  providers: ('googlemeet' | 'zoom')[];
  // Note: Microsoft Teams integration planned for Phase 2
  integration: {
    stepAvailability: {
      preScreening: boolean;
      welcome: boolean;
      consent: boolean;
      familiarization: boolean;
      preSorting: boolean;
      mainSorting: boolean;
      commentary: boolean;
      postSurvey: boolean;
      thankYou: boolean;
    };
    launchOptions: {
      automatic: boolean;
      onDemand: boolean;
      scheduled: boolean;
    };
    features: {
      recording: boolean;
      screenSharing: boolean;
      chat: boolean;
      transcription: boolean;
    };
  };
}
```

### Features Per Step:
1. **Pre-Screening:** Optional researcher assistance for complex questions
2. **Welcome:** Researcher introduction and study orientation
3. **Consent:** Real-time consent discussion and clarification
4. **Familiarization:** Guided walkthrough of stimuli with researcher commentary
5. **Pre-Sorting:** Live assistance with initial categorization
6. **Main Q-Sort:** Think-aloud protocol with researcher observation
7. **Commentary:** Live interview about extreme placements
8. **Post-Survey:** Additional interview questions
9. **Thank You:** Debrief conversation and next steps discussion

### Integration Features:
- **Seamless Launch:** One-click video calling from any step
- **Session Recording:** Automatic recording with consent
- **Screen Sharing:** Researcher can share additional materials
- **Chat Integration:** Text chat during video calls
- **Transcription:** Automatic speech-to-text for interviews
- **Calendar Integration:** Schedule video sessions in advance

---

# PART IV: APPLE HUMAN INTERFACE GUIDELINES IMPLEMENTATION

## Design Philosophy Integration
**Based on Apple's HIG 2024 principles applied to research software**

### 1. Clarity (Primary Principle)
**Implementation:**
- **Typography:** San Francisco Pro font exclusively
- **Visual Hierarchy:** Clear information architecture with proper heading structures
- **Color Usage:** Apple's semantic color system for consistent meaning
- **Iconography:** SF Symbols throughout the interface
- **Layout:** Apple's 8pt grid system for precise spacing

**Applied to Q Methodology:**
- Q-sort grid uses clear, high-contrast cells
- Stimulus text sized for optimal readability (Dynamic Type support)
- Navigation clearly indicates current step and progress
- Error messages are specific and actionable

### 2. Deference (Content-First Design)
**Implementation:**
- **UI Recedes:** Interface elements support content without competing
- **Content Focus:** Stimuli and research content are always primary
- **Minimal Chrome:** Reduce unnecessary visual elements
- **Context Awareness:** UI adapts to current research phase

**Applied to Q Methodology:**
- Grid interface minimizes visual noise around stimuli
- Video and image content presented without distraction
- Text stimuli displayed with optimal reading experience
- Researcher instructions integrated naturally

### 3. Depth (Spatial Relationships)
**Implementation:**
- **Layered Interface:** Clear z-axis relationships
- **Contextual Menus:** Actions appear in context
- **Modal Presentations:** Focused task completion
- **Transition Animation:** Smooth spatial navigation

**Applied to Q Methodology:**
- Drag-and-drop uses realistic physics and shadows
- Modal dialogs for secondary tasks (settings, help)
- Smooth transitions between study steps
- 3D-inspired grid visualization for completed sorts

### 4. Consistency (Predictable Patterns)
**Implementation:**
- **Navigation Patterns:** Consistent throughout both interfaces
- **Interaction Models:** Same gestures work everywhere
- **Visual Language:** Consistent use of color, typography, spacing
- **Behavioral Patterns:** Predictable responses to user actions

**Applied to Q Methodology:**
- Same drag-and-drop behavior in pre-sort and main grid
- Consistent progress indicators across all steps
- Uniform button styling and placement
- Standard Apple form patterns for questionnaires

## Specific Apple Design Elements

### Typography System
```css
/* San Francisco Pro Font Family */
--font-family-primary: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-secondary: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

/* Apple Typography Scale */
--text-large-title: 34px;    /* Large Title */
--text-title-1: 28px;        /* Title 1 */
--text-title-2: 22px;        /* Title 2 */
--text-title-3: 20px;        /* Title 3 */
--text-headline: 17px;       /* Headline */
--text-body: 17px;           /* Body */
--text-callout: 16px;        /* Callout */
--text-subhead: 15px;        /* Subhead */
--text-footnote: 13px;       /* Footnote */
--text-caption-1: 12px;      /* Caption 1 */
--text-caption-2: 11px;      /* Caption 2 */
```

### Color System
```css
/* Apple System Colors (Light/Dark Mode) */
--color-label: light-dark(rgba(0,0,0,1), rgba(255,255,255,1));
--color-secondary-label: light-dark(rgba(60,60,67,0.6), rgba(235,235,245,0.6));
--color-tertiary-label: light-dark(rgba(60,60,67,0.3), rgba(235,235,245,0.3));

/* Apple Semantic Colors */
--color-system-blue: light-dark(rgba(0,122,255,1), rgba(10,132,255,1));
--color-system-green: light-dark(rgba(52,199,89,1), rgba(48,209,88,1));
--color-system-red: light-dark(rgba(255,59,48,1), rgba(255,69,58,1));
--color-system-orange: light-dark(rgba(255,149,0,1), rgba(255,159,10,1));

/* Apple Background Colors */
--color-system-background: light-dark(rgba(255,255,255,1), rgba(0,0,0,1));
--color-secondary-background: light-dark(rgba(242,242,247,1), rgba(28,28,30,1));
--color-tertiary-background: light-dark(rgba(255,255,255,1), rgba(44,44,46,1));
```

### Spacing System (8pt Grid)
```css
/* Apple Spacing Scale */
--spacing-xs: 4px;    /* 0.5 × base */
--spacing-sm: 8px;    /* 1 × base */
--spacing-md: 16px;   /* 2 × base */
--spacing-lg: 24px;   /* 3 × base */
--spacing-xl: 32px;   /* 4 × base */
--spacing-xxl: 48px;  /* 6 × base */
--spacing-xxxl: 64px; /* 8 × base */
```

### Animation System
```css
/* Apple Easing Functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Apple Standard Durations */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
```

## Responsive Design (Apple Device Ecosystem)

### Breakpoint System
```css
/* Apple Device Breakpoints */
@media (max-width: 428px) { /* iPhone Pro Max */ }
@media (max-width: 390px) { /* iPhone 14 */ }
@media (max-width: 375px) { /* iPhone SE */ }
@media (max-width: 820px) { /* iPad Mini */ }
@media (max-width: 1024px) { /* iPad */ }
@media (max-width: 1366px) { /* iPad Pro */ }
@media (min-width: 1367px) { /* Mac */ }
```

### Interface Adaptations:
- **iPhone:** Single-column layout with bottom sheet modals
- **iPad:** Split-view interface with adaptive layout
- **Mac:** Full multi-column layout with hover states
- **Accessibility:** Dynamic Type scaling and VoiceOver optimization

---

# PART V: RESEARCHER INTERFACE SPECIFICATIONS

## Dashboard & Study Management
**Apple-inspired research management interface**

### Main Dashboard
```typescript
interface ResearcherDashboard {
  sections: {
    recentStudies: StudyCard[];
    analytics: AnalyticsOverview;
    participants: ParticipantSummary;
    notifications: NotificationCenter;
  };
  quickActions: {
    createStudy: boolean;
    viewAnalytics: boolean;
    manageParticipants: boolean;
    exportData: boolean;
  };
  design: AppleDashboardDesign;
}
```

### Study Builder Interface
- **Step-by-step Wizard:** Apple setup assistant pattern
- **Live Preview:** Real-time participant view preview
- **Template Library:** Pre-built study templates
- **Collaboration:** Real-time multi-user editing
- **Version Control:** Study revision history

### Advanced Questionnaire Builder
**Qualtrics-level question builder with Apple design**

#### Question Types (15+ Types):
1. **Multiple Choice** (single/multi-select)
   - Visual style: iOS segmented controls or checkboxes
   - Custom answer validation
   - Image/video answer options
   - Randomization options

2. **Rating Scales** (1-5, 1-7, 1-10, custom)
   - iOS slider controls with haptic feedback
   - Star ratings with custom icons
   - Semantic anchors at endpoints

3. **Likert Scales**
   - Apple-style table view presentation
   - Multiple items with same scale
   - Matrix layout for efficiency

4. **Text Entry** (short, long, essay)
   - iOS text field styling
   - Character/word count displays
   - Rich text formatting options
   - Auto-resize text areas

5. **Dropdown Menus**
   - Native iOS picker wheels
   - Searchable dropdown for long lists
   - Multi-level dropdown support

6. **Date/Time Pickers**
   - Native iOS date/time wheels
   - Custom date ranges
   - Multiple date selection

7. **Sliders** (continuous scales)
   - iOS slider controls with custom styling
   - Dual-handle range sliders
   - Vertical orientation support

8. **Rank Order** (drag-and-drop ranking)
   - iOS list reordering interface
   - Visual drag handles
   - Automatic rank numbering

9. **Matrix Questions** (grid format)
   - Table view with multiple question rows
   - Same scale across all items
   - Horizontal scrolling for mobile

10. **File Upload**
    - iOS document picker integration
    - Multiple file type support
    - Drag-and-drop file areas
    - Upload progress indicators

11. **Semantic Differential** (bipolar scales)
    - Slider between opposing concepts
    - Multiple concept pairs in matrix
    - Visual anchors at endpoints

12. **Constant Sum** (allocate 100 points)
    - iOS stepper controls
    - Visual allocation bars
    - Real-time total validation

13. **Net Promoter Score** (0-10 with categories)
    - Horizontal 0-10 scale
    - Automatic categorization display
    - Follow-up question triggering

14. **Image Choice** (select from images)
    - Photo gallery-style selection
    - Multiple image selection
    - Image zoom and preview

15. **Video Response** (record video answers)
    - iOS camera integration
    - Video recording controls
    - Playback preview

### Question Builder Features:
- **Drag-and-Drop Builder:** Visual question arrangement
- **Logic Branching:** Skip patterns and display conditions
- **Validation Rules:** Custom validation for each question type
- **Randomization:** Question and answer randomization
- **Piping:** Use previous answers in later questions
- **Quotas:** Demographic quota management
- **Multi-Language:** Translation management system

---

# PART VI: TECHNICAL ARCHITECTURE

## Frontend Architecture
**Next.js 14+ with Apple Design System**

### Component Structure:
```typescript
// Apple Design System Components
components/
├── apple-ui/                 # Base Apple HIG components
│   ├── Button/              # iOS-style buttons
│   ├── TextField/           # iOS text inputs
│   ├── Slider/              # iOS sliders
│   ├── SegmentedControl/    # iOS segmented controls
│   ├── NavigationBar/       # iOS navigation
│   ├── TabBar/              # iOS tab bars
│   └── Modal/               # iOS modal presentations
├── researcher/              # Researcher interface components
│   ├── StudyBuilder/
│   ├── QuestionBuilder/
│   ├── Dashboard/
│   └── Analytics/
├── participant/             # Participant interface components
│   ├── QSortGrid/
│   ├── StimuliGallery/
│   ├── PreSorting/
│   └── Commentary/
└── shared/                  # Shared components
    ├── VideoConferencing/
    ├── RichTextEditor/
    └── ProgressIndicators/
```

### State Management:
```typescript
// Zustand stores following Apple patterns
stores/
├── researcher-store.ts      # Researcher interface state
├── participant-store.ts     # Participant journey state
├── study-store.ts          # Study configuration state
├── qsort-store.ts          # Q-sort interaction state
└── design-store.ts         # Apple design system state
```

## Backend Architecture
**NestJS with Q Methodology specialization**

### Module Structure:
```typescript
src/modules/
├── auth/                   # Authentication & authorization
├── studies/               # Study CRUD operations
├── questionnaires/        # Advanced questionnaire engine
├── qsort/                # Q-sort specific logic
├── stimuli/              # Media management
├── participants/         # Participant management
├── analysis/             # Q methodology analysis
├── video-conferencing/   # Google Meet/Zoom integration
├── export/               # Data export capabilities
└── notifications/        # Email/SMS notifications
```

### Advanced Questionnaire Engine:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionType,
      Answer,
      Logic,
      Validation,
      Randomization,
    ]),
  ],
  providers: [
    QuestionBuilderService,
    LogicEngineService,
    ValidationService,
    RandomizationService,
    PipingService,
  ],
  controllers: [QuestionnaireController],
})
export class QuestionnaireModule {}
```

---

# PART VII: SUCCESS METRICS & VALIDATION

## Design Quality Metrics
- **Apple HIG Compliance:** >95% across all interfaces
- **Accessibility Score:** WCAG 2.1 AA compliance >98%
- **Performance:** 60fps animations, <2s load times
- **User Experience:** >4.8/5.0 satisfaction rating

## Research Quality Metrics
- **Statistical Accuracy:** Factor analysis correlation ≥ 0.99 vs PQMethod on standard test datasets
- **Study Completion Rate:** >90% participant completion
- **Data Quality:** <2% invalid or incomplete responses
- **Academic Adoption:** 500+ researchers, 50+ published studies

## Technical Quality Metrics
- **Code Quality:** TypeScript strict mode, >95% test coverage
- **Security:** Zero critical vulnerabilities
- **Scalability:** Support 10,000+ concurrent participants
- **Reliability:** 99.9% uptime with <100ms API response times

---

This comprehensive admin dashboard, customer support system, and monitoring infrastructure ensures the VQMethod platform can scale to production with enterprise-grade reliability, support capabilities, and operational insights while maintaining the elegant Apple design principles throughout all interfaces.

---

# PART VIII: ADMIN DASHBOARD & OWNER ANALYTICS

## Executive Overview Dashboard
**Purpose:** Comprehensive production monitoring and business intelligence for platform owners
**Design:** Apple-style analytics interface with real-time metrics and actionable insights

### Core Platform Metrics
```typescript
interface AdminDashboard {
  // User Analytics
  userMetrics: {
    totalResearchers: number;
    activeUsers: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    newSignups: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    userRetention: {
      day1: number;
      day7: number;
      day30: number;
    };
    geographicDistribution: Array<{
      country: string;
      users: number;
      percentage: number;
    }>;
  };

  // Study Performance Analytics
  studyMetrics: {
    totalStudies: number;
    publishedStudies: number;
    activeStudies: number;
    studyCompletionRate: number;
    averageResponsesPerStudy: number;
    studyCreationTrend: Array<{
      date: string;
      count: number;
    }>;
  };

  // Participant Journey Analytics
  participantMetrics: {
    totalParticipants: number;
    completionRateByStep: {
      preScreening: number;
      welcome: number;
      consent: number;
      familiarization: number;
      preSorting: number;
      qSort: number;
      commentary: number;
      postSurvey: number;
      thankYou: number;
    };
    averageTimePerStep: {
      [stepName: string]: number; // in minutes
    };
    dropOffPoints: Array<{
      step: string;
      dropOffRate: number;
    }>;
  };

  // System Health Monitoring
  systemHealth: {
    uptime: number;
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
    storageUsage: {
      total: number;
      used: number;
      mediaFiles: number;
    };
  };

  // Business Intelligence
  businessMetrics: {
    revenue: {
      monthly: number;
      yearly: number;
    };
    featureAdoption: Array<{
      feature: string;
      adoptionRate: number;
    }>;
    supportTickets: {
      open: number;
      resolved: number;
      averageResolutionTime: number;
    };
  };
}
```

### Real-time System Status
- **Application Health:** Live server status, performance metrics, active sessions
- **Database Performance:** Connection status, query performance, storage usage
- **File Storage:** Media file management, backup status, orphaned file detection
- **External Services:** Video conferencing status, email delivery rates, CDN performance

---

# PART IX: CUSTOMER SUPPORT SYSTEM

## Integrated Support Platform
**Purpose:** Comprehensive customer support with admin powers for user assistance
**Design:** Apple-inspired support interface with contextual user information

### Support Ticket System
```typescript
interface SupportTicket {
  id: string;
  userId: string;
  category: 'technical' | 'billing' | 'feature_request' | 'study_help' | 'account_issue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  
  // Contextual Information
  context: {
    studyId?: string;
    studyTitle?: string;
    userAgent: string;
    browserInfo: string;
    pageUrl: string;
    errorLogs?: string[];
    userActions: string[];
  };

  // SLA Tracking
  sla: {
    responseTime: number;
    resolutionTime?: number;
    escalated: boolean;
    breachedSla: boolean;
  };
}
```

### Admin Support Powers
**Full User Account Access:**
- View and edit user profiles
- Reset passwords and manage authentication
- Suspend/reactivate user accounts
- Impersonate users for troubleshooting

**Study Management Powers:**
- Access all user studies
- Edit studies on behalf of users
- Pause/resume studies
- Export study data in multiple formats
- View and manage study responses
- Delete inappropriate responses

**Data Access & Compliance:**
- Export user data for GDPR requests
- Anonymize user data
- Generate compliance reports
- Access comprehensive audit logs
- Permanent data deletion with confirmation

### Knowledge Base & Self-Service
- **AI-Powered Help:** Contextual article suggestions, automated responses
- **Video Tutorials:** Step-by-step guides for all platform features
- **FAQ System:** Searchable knowledge base with user ratings
- **In-App Messaging:** Real-time communication between users and support

---

# PART X: COMPREHENSIVE SYSTEM MONITORING

## Production Monitoring & Alerting
**Purpose:** Proactive system health monitoring with intelligent alerting
**Design:** Apple-style monitoring dashboard with real-time status indicators

### System Health Monitoring
```typescript
interface SystemMonitoring {
  // Application Server Health
  applicationHealth: {
    serverInstances: Array<{
      id: string;
      status: 'healthy' | 'unhealthy' | 'starting' | 'stopping';
      cpu: number;
      memory: number;
      connections: number;
      lastHeartbeat: Date;
    }>;
  };

  // Database Monitoring
  databaseHealth: {
    primaryConnection: boolean;
    replicationLag: number;
    activeConnections: number;
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
  };

  // Storage Systems
  storageHealth: {
    fileStorage: {
      totalSpace: number;
      usedSpace: number;
      status: 'healthy' | 'warning' | 'critical';
    };
    backupStatus: {
      lastBackup: Date;
      status: 'success' | 'failed' | 'in_progress';
    };
  };
}
```

### Intelligent Error Tracking
- **Application Errors:** Automatic error categorization, stack trace analysis, user impact assessment
- **User Experience Errors:** Frontend error tracking, performance bottlenecks, user journey issues
- **System Errors:** Infrastructure failures, service outages, integration problems

### Advanced Alerting System
**Alert Rules:**
- High error rate (>5% over 5 minutes) → Critical alert
- Slow response time (P95 >3 seconds) → Warning alert
- Database connection failure → Immediate critical alert
- Storage space low (>85% usage) → Warning alert
- Failed backup → Critical alert

**Escalation Procedures:**
- Immediate notifications via email, Slack, SMS
- Automated escalation to senior staff if unresolved
- Integration with on-call rotation systems
- Status page updates for user communication

### Incident Management
- **Status Page:** Public system status with service health indicators
- **Incident Timeline:** Detailed incident tracking with resolution steps
- **Post-Mortem Reports:** Automated incident analysis and prevention recommendations
- **Scheduled Maintenance:** User notification system for planned downtime

### Performance Analytics
- **User Experience Monitoring:** Page load times, bounce rates, conversion funnels
- **Study Flow Analytics:** Step completion rates, time analysis, optimization recommendations
- **Resource Utilization:** API endpoint performance, database query optimization, storage access patterns
- **Device Performance:** Cross-platform performance analysis with device-specific insights

---

# PART XI: COLLABORATION & SURVEY LIFECYCLE MANAGEMENT

## Comprehensive Research Collaboration Platform
**Purpose:** Enable seamless collaboration between researchers with secure access controls and real-time communication
**Design:** Apple-inspired interface with LinkedIn-style messaging and SurveyMonkey/Qualtrics workflow patterns

### 11.1 Secure Collaboration System

#### Role-Based Access Control
```typescript
interface CollaboratorPermissions {
  // Study Management
  canEditStudyDetails: boolean;
  canEditQuestions: boolean;
  canManageStimuli: boolean;
  canEditFlow: boolean;
  
  // Data & Responses
  canViewResponses: boolean;
  canExportData: boolean;
  canDeleteResponses: boolean;
  
  // Study Lifecycle
  canActivateStudy: boolean;
  canPauseStudy: boolean;
  canScheduleStudy: boolean;
  canDeleteStudy: boolean; // Only owner
  
  // Collaboration
  canInviteCollaborators: boolean;
  canUseChat: boolean;
}
```

**Collaboration Roles:**
- **Owner/Primary Researcher**: Full access including study deletion
- **Collaborator**: Full access except study deletion
- **Viewer**: Read-only access to responses and analytics

#### Secure Invitation Process
**Multi-Layer Security Validation:**
- Email format and domain verification
- Disposable email detection
- Risk scoring (0-10 scale)
- Previous collaboration history check
- Time-limited invitation tokens (72 hours)
- Confirmation dialogs with recipient details

**Invitation Workflow:**
1. Primary researcher enters collaborator email
2. System validates email and performs security checks
3. Confirmation dialog shows recipient details and proposed role
4. Secure invitation sent with time-limited token
5. Recipient accepts/declines with email verification
6. Comprehensive audit logging of all activities

#### Real-time Chat System
**LinkedIn-Style Messaging Features:**
- Online/offline/away/busy status indicators
- Real-time typing indicators
- Message history with search functionality
- File sharing capabilities
- @mentions with push notifications
- Message reactions and threading
- Mobile-optimized interface

**Technical Implementation:**
- WebSocket connections for real-time updates
- Redis-based online presence tracking
- Message persistence with full-text search
- Push notifications for mentions and direct messages
- Heartbeat mechanism for accurate online status

### 11.2 Survey Lifecycle Management

#### Survey Status Types
```typescript
type SurveyStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
```

**Status Definitions:**
- **Draft**: Under development, not accessible to participants
- **Scheduled**: Set to activate at future date/time with countdown
- **Active**: Live and accepting responses from participants
- **Paused**: Temporarily stopped, participants see pause message
- **Ended**: Permanently closed, no new responses accepted
- **Archived**: Completed and archived for historical reference

#### Advanced Scheduling Features
**Time-Range Controls:**
- Start date/time picker with timezone support
- Optional end date/time with automatic deactivation
- Recurring schedule patterns for longitudinal studies
- Response limits and daily/hourly restrictions
- Holiday and weekend exclusions

**Manual Override Controls:**
- Toggle switch for instant activation/deactivation
- Bulk operations for multiple studies
- Status change confirmations with reason logging
- Emergency pause functionality

**What Active/Inactive Means:**
- **Active**: Participants can access and complete the study, all responses are collected
- **Paused**: Existing participants see "temporarily paused" message, no new responses accepted
- **Scheduled**: Participants see countdown timer and "notify me" option
- **Ended**: Participants see "study completed" with thank you message

### 11.3 Participant Experience & Communication

#### Status-Aware Participant Messaging
**Dynamic Status Messages:**
- **Active**: "Welcome! This study is accepting responses."
- **Paused**: "This study has been temporarily paused. Please check back later."
- **Scheduled**: "This study will be available on [date]. Get notified when it starts."
- **Ended**: "This study has ended. Thank you to all participants who contributed."

#### Participant Action Options
**Context-Sensitive Actions:**
- **Begin Study**: Direct access to active studies
- **Notify Me When Available**: Email/SMS notifications for status changes
- **Contact Researcher**: Direct messaging with optional email
- **View Schedule**: Countdown timers and availability information
- **Retry Access**: Refresh study status

#### Notification System
**Multi-Channel Participant Notifications:**
- Email notifications with unsubscribe options
- SMS notifications for immediate updates
- In-app notifications with push capabilities
- Customizable notification preferences per participant
- Batch notification processing for large participant pools

### 11.4 Advanced Collaboration Features

#### Study Co-Ownership
- Transfer primary ownership between collaborators
- Shared study templates and question libraries
- Collaborative study design with real-time editing
- Version control and change tracking
- Comment threads on study elements

#### Team Communication
- Study-specific chat rooms for each research project
- Direct messaging between collaborators
- File sharing with study context
- Integration with external communication tools
- Meeting scheduling and research session coordination

#### Access Management
- Temporary access grants with expiration dates
- IP address restrictions for sensitive studies
- Two-factor authentication for collaborators
- Session management and concurrent login limits
- Detailed access logs and security monitoring

---

This comprehensive platform combines admin dashboard capabilities, customer support systems, monitoring infrastructure, and advanced collaboration features to deliver enterprise-grade Q methodology research tools with Apple design excellence.