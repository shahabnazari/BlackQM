/**
 * ThemeExtractionContainer Stories - Phase 10.101
 *
 * Interactive documentation for the main theme extraction container component.
 * Demonstrates all states: empty, loading, with themes, with research outputs.
 *
 * **Note**: This component is fully self-contained (zero required props)
 * and gets all data from Zustand stores.
 *
 * **⚠️ LIMITATION**: Store mocking not yet implemented. Stories document expected states
 * but currently render with real Zustand store data. See lines 28-40 for details.
 *
 * @module ThemeExtractionContainer.stories
 * @since Phase 10.101
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeExtractionContainer } from './ThemeExtractionContainer';

/**
 * Mock Zustand stores for isolated testing
 *
 * **Architecture Note**: ThemeExtractionContainer uses 3 Zustand stores:
 * - useThemeExtractionStore: Theme state, extraction progress, research outputs
 * - useLiteratureSearchStore: Paper search results, selected papers
 * - useAlternativeSourcesStore: Social media and alternative source results
 *
 * We mock these stores to provide controlled state for each story.
 */

/**
 * Mock data types imported for documentation purposes
 *
 * **Note**: Mock data will be needed when Zustand decorator is implemented.
 * For now, stories render the actual component which uses real Zustand stores.
 * The stories document expected states rather than actively mocking them.
 *
 * **Future Enhancement**: Create `.storybook/decorators/zustand-mock.tsx`
 * to provide controlled store state for each story.
 *
 * @see UnifiedTheme - from `@/lib/stores/theme-extraction.store`
 * @see Paper - from `@/lib/types/literature.types`
 */

/**
 * Component metadata for Storybook
 */
const meta = {
  title: 'Literature/ThemeExtractionContainer',
  component: ThemeExtractionContainer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Theme Extraction Container

The main container component for displaying extracted themes and managing research output generation.
This component is **fully self-contained** (zero required props) and gets all data from Zustand stores.

## Architecture

**Component Size**: 390 lines (under 400-line enterprise limit)
**Business Logic**: Extracted to \`useExtractionWorkflow\`, \`useThemeApiHandlers\`, \`useResearchOutputHandlers\` hooks
**State Management**: 3 Zustand stores (theme-extraction, literature-search, alternative-sources)

## Features

- **Theme Display**: Shows extracted themes with selection controls
- **Research Output Generation**:
  - Research questions
  - Hypotheses
  - Construct mappings
  - Survey construction
  - Q-statements (for Q-Methodology)
- **Empty State**: Guides user when no themes extracted yet
- **Loading States**: Shows extraction in progress
- **Purpose-Specific UI**: Adapts based on research purpose (Q-Methodology vs. Survey Construction)

## States

1. **Empty State**: No themes extracted yet, shows call-to-action
2. **Extracting**: Progress modal/inline display during extraction
3. **With Themes**: Themes displayed with selection UI
4. **With Research Outputs**: Themes + generated questions/hypotheses/survey
5. **Loading Outputs**: Theme displayed, research output generation in progress

## Usage

\`\`\`tsx
import { ThemeExtractionContainer } from '@/app/(researcher)/discover/literature/containers/ThemeExtractionContainer';

// Minimal usage (zero props - fully self-contained)
<ThemeExtractionContainer />

// With custom empty state message
<ThemeExtractionContainer emptyStateMessage="Select papers to start" />

// With inline progress display (Phase 10.98.3)
<ThemeExtractionContainer showProgressInline={true} />
\`\`\`

## Integration

Requires Zustand store setup in your app:
- \`useThemeExtractionStore\`: Theme state and extraction
- \`useLiteratureSearchStore\`: Paper search and selection
- \`useAlternativeSourcesStore\`: Social media sources

**⚠️ CURRENT LIMITATION**: Store mocking not yet implemented. Stories currently use real store state.
To see documented states interactively, implement \`.storybook/decorators/zustand-mock.tsx\` (see Phase 10.101 docs).
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    emptyStateMessage: {
      description: 'Custom message to show when no themes extracted (optional)',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    showProgressInline: {
      description: 'Show extraction progress inline vs. modal (Phase 10.98.3)',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof ThemeExtractionContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty State - No Themes Extracted
 *
 * Shows the default empty state when no themes have been extracted yet.
 * Displays guidance for the user to select papers and start extraction.
 *
 * **Store State**:
 * - unifiedThemes: [] (empty)
 * - extractedPapers: []
 * - No research outputs
 */
export const EmptyState_NoThemes: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Default empty state shown when no themes have been extracted yet.

**Mocked Store State:**
- \`unifiedThemes\`: Empty array
- \`papers\`: 5 papers available in search results
- \`selectedPapers\`: Empty set (user hasn't selected papers)
- \`extractionPurpose\`: null

**User Actions:**
User can click "Extract Themes" button in the empty state to start the workflow.
        `,
      },
    },
    // Mock Zustand stores for this story
    // Note: In actual implementation, we'd use a decorator to provide mocked store context
    // For now, this is documentation of what state this story represents
  },
};

/**
 * Empty State - With Custom Message
 *
 * Shows empty state with a custom message prop.
 */
export const EmptyState_CustomMessage: Story = {
  args: {
    emptyStateMessage: 'Select papers from search results above to begin theme extraction',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with custom message via props (optional feature).',
      },
    },
  },
};

/**
 * With Themes - Basic Display
 *
 * Shows 3 extracted themes with selection UI.
 * No themes selected yet, no research outputs generated.
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - selectedThemeIds: [] (none selected)
 * - extractionPurpose: 'qualitative_analysis'
 */
export const WithThemes_BasicDisplay: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Shows extracted themes with selection controls.

**Mocked Store State:**
- \`unifiedThemes\`: 3 themes (Barriers, Stakeholder Engagement, Resource Allocation)
- \`selectedThemeIds\`: Empty (no selection)
- \`extractionPurpose\`: 'qualitative_analysis'
- \`v2SaturationData\`: { totalThemes: 3, saturated: true }

**User Actions:**
- Click theme checkboxes to select themes
- Click "Generate Research Questions" to start output generation
- Click "Clear Selection" to deselect all
        `,
      },
    },
  },
};

/**
 * With Themes - Some Selected
 *
 * Shows themes with 2 out of 3 selected.
 * User can now generate research outputs from selected themes.
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - selectedThemeIds: ['theme-1', 'theme-2'] (2 selected)
 * - extractionPurpose: 'qualitative_analysis'
 */
export const WithThemes_SomeSelected: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Shows themes with partial selection (2/3 selected).

**Mocked Store State:**
- \`selectedThemeIds\`: ['theme-1', 'theme-2']
- Research output buttons now enabled for 2 selected themes

**Visual Changes:**
- 2 themes show checkmark icons
- "Clear Selection" button visible
- Research output buttons active
        `,
      },
    },
  },
};

/**
 * Q-Methodology Purpose - Shows Q-Statements Button
 *
 * When extraction purpose is 'q_methodology', shows "Generate Q-Statements" button
 * instead of standard research outputs (questions, hypotheses).
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - extractionPurpose: 'q_methodology'
 * - Target range: 30-80 themes (Q-Methodology typical)
 */
export const QMethodology_Purpose: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Purpose-specific UI for Q-Methodology research.

**Mocked Store State:**
- \`extractionPurpose\`: 'q_methodology'
- \`targetRange\`: { min: 30, max: 80 }

**UI Differences:**
- Shows "Generate Q-Statements" as primary action
- Hides research questions/hypotheses buttons
- Different empty state guidance
        `,
      },
    },
  },
};

/**
 * Survey Construction Purpose - Shows Survey Button
 *
 * When extraction purpose is 'survey_construction', shows "Generate Survey" button
 * as the primary action.
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - extractionPurpose: 'survey_construction'
 * - Target range: 5-15 themes (Survey typical)
 */
export const SurveyConstruction_Purpose: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Purpose-specific UI for Survey Construction research.

**Mocked Store State:**
- \`extractionPurpose\`: 'survey_construction'
- \`targetRange\`: { min: 5, max: 15 }

**UI Differences:**
- "Generate Survey" shown as primary action
- Research questions/hypotheses shown as secondary
        `,
      },
    },
  },
};

/**
 * With Research Questions Generated
 *
 * Shows themes with research questions already generated.
 * User can click questions to operationalize them into survey items.
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - selectedThemeIds: ['theme-1', 'theme-2']
 * - researchQuestions: [{ id, question, themes, rationale }]
 */
export const WithResearchQuestions_Generated: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Shows research questions generated from selected themes.

**Mocked Store State:**
- \`researchQuestions\`: Array of 5 research questions
- Each question linked to contributing themes

**User Actions:**
- Click "Select" on a question to save to research design
- Click "Operationalize" to convert to survey items
        `,
      },
    },
  },
};

/**
 * Loading State - Generating Research Questions
 *
 * Shows loading spinner while research questions are being generated.
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - selectedThemeIds: ['theme-1', 'theme-2']
 * - loadingQuestions: true (being generated)
 */
export const LoadingState_GeneratingQuestions: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Shows loading state during research question generation.

**Mocked Store State:**
- \`loadingQuestions\`: true
- "Generate Research Questions" button shows spinner
- User cannot click again until complete
        `,
      },
    },
  },
};

/**
 * With Survey Generated
 *
 * Shows themes with a complete survey generated.
 * User can edit survey, export to various formats, or generate a new one.
 *
 * **Store State**:
 * - unifiedThemes: 3 themes
 * - generatedSurvey: { title, sections, items, scaleType, options }
 * - extractionPurpose: 'survey_construction'
 */
export const WithSurvey_Generated: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Shows generated survey with export and edit options.

**Mocked Store State:**
- \`generatedSurvey\`: Complete survey object
- 3 sections, 12 items total
- 5-point Likert scale

**User Actions:**
- Click "Edit Survey" to modify
- Click "Export" dropdown for CSV/JSON/PDF
- Click "Generate New Survey" to recreate
        `,
      },
    },
  },
};

/**
 * Inline Progress Display (Phase 10.98.3)
 *
 * Shows extraction progress inline instead of as modal.
 * Useful for /discover/themes page where progress stays visible.
 *
 * **Props**: showProgressInline={true}
 * **Store State**: progress object with current stage and percentage
 */
export const InlineProgress_ExtractingThemes: Story = {
  args: {
    showProgressInline: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows extraction progress embedded in page content (not modal overlay).

**Props:**
- \`showProgressInline\`: true

**Store State:**
- \`progress\`: { stage: 'extracting', progress: 65, ... }
- Progress displays above theme list or empty state
        `,
      },
    },
  },
};

/**
 * Large Dataset - 50 Themes Extracted
 *
 * Shows performance with a large number of themes (50).
 * Tests UI scalability and performance.
 *
 * **Store State**:
 * - unifiedThemes: 50 themes
 * - extractionPurpose: 'q_methodology' (high theme count)
 */
export const LargeDataset_50Themes: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
Tests UI with large dataset (50 themes).

**Mocked Store State:**
- \`unifiedThemes\`: 50 themes
- \`extractionPurpose\`: 'q_methodology'
- Tests performance of theme list rendering
- Tests selection state management with large Set
        `,
      },
    },
  },
};
