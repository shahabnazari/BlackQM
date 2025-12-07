/**
 * ThemeExtractionProgressModal Stories - Phase 10.101
 *
 * Interactive documentation for the theme extraction progress modal component.
 * Demonstrates all 7 extraction stages (Stage 0: Preparing + Stages 1-6: Braun & Clarke)
 * with transparent messaging and real-time statistics.
 *
 * @module ThemeExtractionProgressModal.stories
 * @since Phase 10.101
 */

import type { Meta, StoryObj } from '@storybook/react';
import ThemeExtractionProgressModal from './ThemeExtractionProgressModal';
import type { TransparentProgressMessage } from './EnhancedThemeExtractionProgress';

/**
 * Component metadata for Storybook
 */
const meta = {
  title: 'Literature/ThemeExtractionProgressModal',
  component: ThemeExtractionProgressModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Theme Extraction Progress Modal

A full-screen modal displaying transparent progress through the 7-stage Braun & Clarke (2006)
Reflexive Thematic Analysis methodology with enterprise-grade 4-part messaging.

## Features

- **7-Stage Workflow**: Stage 0 (Preparing Data) + Stages 1-6 (Braun & Clarke methodology)
- **4-Part Transparent Messaging**: Stage name + What we're doing + Why it matters + Live stats
- **Real-Time Statistics**: Sources analyzed, codes generated, themes identified
- **Accessibility**: Full ARIA support, keyboard navigation (ESC to close when complete)
- **Animation**: Smooth transitions with framer-motion
- **Auto-Close**: Modal auto-closes on completion or can be manually closed after finish

## Stages

1. **Stage 0**: Preparing Data (0-40%) - Saving papers + fetching full-text
2. **Stage 1**: Familiarization (40%+) - Reading and semantic embeddings
3. **Stage 2**: Coding - Systematic code generation
4. **Stage 3**: Theme Generation - Clustering codes into candidate themes
5. **Stage 4**: Theme Review - Quality control and validation
6. **Stage 5**: Theme Definition - Naming and defining themes
7. **Stage 6**: Report Production - Final assembly with provenance

## Usage

\`\`\`tsx
import ThemeExtractionProgressModal from '@/components/literature/ThemeExtractionProgressModal';

<ThemeExtractionProgressModal
  progress={progress}
  onClose={() => console.log('Modal closed')}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    progress: {
      description: 'Extraction progress state with stage, percentage, and optional transparent message',
      control: 'object',
    },
    onClose: {
      description: 'Callback when modal is closed (ESC key or backdrop click when complete)',
      action: 'closed',
    },
  },
} satisfies Meta<typeof ThemeExtractionProgressModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper function to create transparent message for a specific stage
 */
function createTransparentMessage(
  stageNumber: number,
  percentage: number,
  totalSources: number = 15
): TransparentProgressMessage {
  const stageConfigs: Array<{
    stageName: string;
    whatWeAreDoing: string;
    whyItMatters: string;
    currentOperation: string;
  }> = [
    {
      stageName: 'Preparing Data',
      whatWeAreDoing: `Saving ${totalSources} papers to the database and fetching full-text content where available.`,
      whyItMatters: 'Data preparation creates a permanent record of your corpus and enables full-text fetching.',
      currentOperation: 'Preparing data for analysis...',
    },
    {
      stageName: 'Familiarization with Data',
      whatWeAreDoing: 'Converting source content into semantic embeddings using local AI models (FREE, no API costs).',
      whyItMatters: 'Embeddings enable semantic understanding across different wording. Full-text provides 40-50x more content.',
      currentOperation: 'Generating semantic embeddings from prepared content',
    },
    {
      stageName: 'Systematic Code Generation',
      whatWeAreDoing: 'Analyzing ALL sources together to identify semantic codes using embeddings.',
      whyItMatters: 'Processing all sources together ensures we detect patterns that span multiple papers.',
      currentOperation: 'Extracting semantic codes from titles + abstracts',
    },
    {
      stageName: 'Candidate Theme Construction',
      whatWeAreDoing: 'Clustering related codes from ALL sources into candidate themes.',
      whyItMatters: 'Themes must appear in 3+ sources (cross-validation requirement) to ensure robust patterns.',
      currentOperation: 'Clustering codes into candidate themes',
    },
    {
      stageName: 'Theme Quality Review',
      whatWeAreDoing: 'Reviewing each candidate theme against supporting codes and the full dataset.',
      whyItMatters: 'Themes must be internally coherent AND distinctly different from each other.',
      currentOperation: 'Validating themes against available content',
    },
    {
      stageName: 'Theme Naming & Definition',
      whatWeAreDoing: "Defining each theme's essence and choosing clear, descriptive names.",
      whyItMatters: 'Clear definitions prevent misinterpretation and convey the analytical narrative.',
      currentOperation: 'Defining and naming final themes',
    },
    {
      stageName: 'Final Report Assembly',
      whatWeAreDoing: 'Generating the final thematic analysis with full provenance and evidence.',
      whyItMatters: 'You can trace any theme back to source material, satisfying audit requirements.',
      currentOperation: 'Assembling final analysis report',
    },
  ];

  const configIndex = Math.max(0, Math.min(stageNumber, stageConfigs.length - 1));
  const config = stageConfigs[configIndex]!; // Non-null assertion: configIndex is clamped to valid range

  const liveStats: TransparentProgressMessage['liveStats'] = {
    sourcesAnalyzed: stageNumber === 0 ? Math.floor(totalSources * (percentage / 40)) : totalSources,
    currentOperation: config.currentOperation,
  };

  // Stage 0: Preparing
  if (stageNumber === 0) {
    liveStats.currentArticle = Math.min(totalSources, Math.floor(totalSources * (percentage / 40)) + 1);
    liveStats.totalArticles = totalSources;
  }

  // Stage 1: Familiarization
  if (stageNumber === 1) {
    liveStats.fullTextRead = Math.floor(totalSources * 0.6);
    liveStats.abstractsRead = Math.floor(totalSources * 0.4);
    liveStats.totalWordsRead = Math.floor(totalSources * 8500);
    liveStats.currentArticle = Math.min(totalSources, Math.floor(percentage / 10));
    liveStats.totalArticles = totalSources;
  }

  // Stage 2+: Codes and themes
  if (stageNumber >= 2) {
    liveStats.codesGenerated = Math.floor(totalSources * 8.5);
  }

  if (stageNumber >= 3) {
    liveStats.themesIdentified = Math.floor(totalSources * 1.2);
  }

  return {
    stageName: config.stageName,
    stageNumber,
    totalStages: 7,
    percentage,
    whatWeAreDoing: config.whatWeAreDoing,
    whyItMatters: config.whyItMatters,
    liveStats,
  };
}

/**
 * Stage 0: Preparing Data
 * Shows paper saving and full-text fetching (0-40% of workflow)
 */
export const Stage0_PreparingData: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 20,
      stage: 'preparing' as const,
      message: 'Saving papers to database...',
      currentSource: 5,
      totalSources: 15,
      transparentMessage: createTransparentMessage(0, 20, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 0 shows paper saving and full-text fetching. This is distinct from familiarization.',
      },
    },
  },
};

/**
 * Stage 1: Familiarization with Data
 * Shows semantic embedding generation (40%+ of workflow)
 */
export const Stage1_Familiarization: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 50,
      stage: 'extracting' as const,
      message: 'Generating semantic embeddings...',
      currentSource: 15,
      totalSources: 15,
      transparentMessage: createTransparentMessage(1, 50, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 1 shows familiarization with data using semantic embeddings. Displays full-text vs. abstract counts.',
      },
    },
  },
};

/**
 * Stage 2: Systematic Code Generation
 * Shows code extraction from all sources
 */
export const Stage2_Coding: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 60,
      stage: 'extracting' as const,
      message: 'Extracting semantic codes...',
      currentSource: 15,
      totalSources: 15,
      transparentMessage: createTransparentMessage(2, 60, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 2 shows systematic code generation. Displays codes generated count.',
      },
    },
  },
};

/**
 * Stage 3: Candidate Theme Construction
 * Shows clustering of codes into themes
 */
export const Stage3_ThemeGeneration: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 70,
      stage: 'extracting' as const,
      message: 'Clustering codes into themes...',
      currentSource: 15,
      totalSources: 15,
      transparentMessage: createTransparentMessage(3, 70, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 3 shows candidate theme construction. Displays themes identified count.',
      },
    },
  },
};

/**
 * Stage 4: Theme Quality Review
 * Shows validation against codes and dataset
 */
export const Stage4_ThemeReview: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 80,
      stage: 'extracting' as const,
      message: 'Validating themes...',
      currentSource: 15,
      totalSources: 15,
      transparentMessage: createTransparentMessage(4, 80, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 4 shows theme quality review. Ensures themes are internally coherent and distinct.',
      },
    },
  },
};

/**
 * Stage 5: Theme Naming & Definition
 * Shows final theme definition and naming
 */
export const Stage5_ThemeDefinition: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 90,
      stage: 'deduplicating' as const,
      message: 'Defining and naming themes...',
      currentSource: 15,
      totalSources: 15,
      transparentMessage: createTransparentMessage(5, 90, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 5 shows theme naming and definition. Creates clear, descriptive theme names.',
      },
    },
  },
};

/**
 * Stage 6: Final Report Assembly
 * Shows final report generation with provenance
 */
export const Stage6_ReportProduction: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 95,
      stage: 'extracting' as const,
      message: 'Assembling final report...',
      currentSource: 15,
      totalSources: 15,
      transparentMessage: createTransparentMessage(6, 95, 15),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Stage 6 shows final report assembly. Links each theme to specific sources and evidence.',
      },
    },
  },
};

/**
 * Extraction Complete - Success State
 * Shows success message with green checkmark
 */
export const Complete_Success: Story = {
  args: {
    progress: {
      isExtracting: false,
      progress: 100,
      stage: 'complete' as const,
      message: 'Successfully extracted 12 themes from 15 sources',
      currentSource: 15,
      totalSources: 15,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Success state after extraction completes. User can close modal with ESC or backdrop click.',
      },
    },
  },
};

/**
 * Extraction Error - Error State
 * Shows error message with red X icon
 */
export const Error_ExtractionFailed: Story = {
  args: {
    progress: {
      isExtracting: false,
      progress: 45,
      stage: 'error' as const,
      message: 'Extraction failed',
      currentSource: 7,
      totalSources: 15,
      error: 'Network timeout: Unable to connect to OpenAI API. Please check your internet connection and try again.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when extraction fails. Shows error message and allows modal to be closed.',
      },
    },
  },
};

/**
 * Without Transparent Message (Synthetic Fallback)
 * Shows progress without WebSocket transparentMessage
 */
export const WithoutTransparentMessage: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 35,
      stage: 'preparing' as const,
      message: 'Fetching full-text content...',
      currentSource: 10,
      totalSources: 15,
      // transparentMessage is undefined - uses synthetic fallback
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows progress without WebSocket transparentMessage. Uses synthetic 4-part message generation.',
      },
    },
  },
};

/**
 * Large Dataset (50 papers)
 * Shows progress with higher source count
 */
export const LargeDataset_50Papers: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 65,
      stage: 'extracting' as const,
      message: 'Extracting themes from 50 sources...',
      currentSource: 50,
      totalSources: 50,
      transparentMessage: createTransparentMessage(3, 65, 50),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows extraction from a large dataset (50 papers). Statistics scale appropriately.',
      },
    },
  },
};

/**
 * Small Dataset (5 papers)
 * Shows progress with minimal source count
 */
export const SmallDataset_5Papers: Story = {
  args: {
    progress: {
      isExtracting: true,
      progress: 75,
      stage: 'extracting' as const,
      message: 'Extracting themes from 5 sources...',
      currentSource: 5,
      totalSources: 5,
      transparentMessage: createTransparentMessage(4, 75, 5),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows extraction from a small dataset (5 papers). Minimal viable dataset for Q-Methodology.',
      },
    },
  },
};
