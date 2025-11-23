import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Theme-to-Survey Item Generation Service
 *
 * Purpose: Convert academic themes into traditional survey items (Likert, MC, rating scales)
 * Research Foundation: DeVellis (2016) Scale Development: Theory and Applications
 *
 * Addresses Critical Gap: Theme extraction previously only generated Q-statements
 * for Q-methodology (~5% market). This service enables traditional surveys (~95% market).
 *
 * Supported Item Types:
 * - Likert scales (1-5, 1-7, 1-10 with reverse-coding)
 * - Multiple choice questions
 * - Semantic differential scales (bipolar adjective pairs)
 * - Matrix/grid questions (multiple items, single construct)
 *
 * @phase Phase 10 Day 5.9
 * @date January 2025
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  prevalence: number;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  keyPhrases?: string[];
  subthemes?: Array<{
    name: string;
    description: string;
  }>;
}

export interface SurveyItem {
  id: string;
  type:
    | 'likert'
    | 'multiple_choice'
    | 'semantic_differential'
    | 'matrix_grid'
    | 'rating_scale';
  themeId: string;
  themeName: string;
  text: string;
  scaleType?:
    | '1-5'
    | '1-7'
    | '1-10'
    | 'agree-disagree'
    | 'frequency'
    | 'satisfaction';
  scaleLabels?: string[];
  options?: string[];
  reversed?: boolean;
  dimension?: string;
  leftPole?: string;
  rightPole?: string;
  construct?: string;
  itemNumber?: number;
  reliability?: {
    reverseCodedReason?: string;
    expectedCorrelation?: 'positive' | 'negative';
  };
  metadata: {
    generationMethod: string;
    researchBacking: string;
    confidence: number;
    themePrevalence: number;
  };
}

export interface GenerateSurveyItemsOptions {
  themes: Theme[];
  itemType:
    | 'likert'
    | 'multiple_choice'
    | 'semantic_differential'
    | 'matrix_grid'
    | 'rating_scale'
    | 'mixed';
  scaleType?:
    | '1-5'
    | '1-7'
    | '1-10'
    | 'agree-disagree'
    | 'frequency'
    | 'satisfaction';
  itemsPerTheme?: number;
  includeReverseCoded?: boolean;
  researchContext?: string;
  targetAudience?: string;
}

export interface SurveyItemGenerationResult {
  items: SurveyItem[];
  summary: {
    totalItems: number;
    itemsByType: Record<string, number>;
    reverseCodedCount: number;
    averageConfidence: number;
  };
  methodology: {
    approach: string;
    researchBacking: string;
    validation: string;
    reliability: string;
  };
  recommendations: {
    pilotTesting: string;
    reliabilityAnalysis: string;
    validityChecks: string;
  };
}

@Injectable()
export class ThemeToSurveyItemService {
  private readonly logger = new Logger(ThemeToSurveyItemService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate survey items from themes
   * Implements DeVellis (2016) scale development methodology
   */
  async generateSurveyItems(
    options: GenerateSurveyItemsOptions,
  ): Promise<SurveyItemGenerationResult> {
    this.logger.log(
      `Generating survey items for ${options.themes.length} themes`,
    );

    const items: SurveyItem[] = [];
    const itemsPerTheme = options.itemsPerTheme || 3;

    for (const theme of options.themes) {
      let themeItems: SurveyItem[] = [];

      switch (options.itemType) {
        case 'likert':
          themeItems = await this.generateLikertItems(
            theme,
            options,
            itemsPerTheme,
          );
          break;
        case 'multiple_choice':
          themeItems = await this.generateMultipleChoiceItems(
            theme,
            options,
            itemsPerTheme,
          );
          break;
        case 'semantic_differential':
          themeItems = await this.generateSemanticDifferentialItems(
            theme,
            options,
            itemsPerTheme,
          );
          break;
        case 'matrix_grid':
          themeItems = await this.generateMatrixGridItems(
            theme,
            options,
            itemsPerTheme,
          );
          break;
        case 'rating_scale':
          themeItems = await this.generateRatingScaleItems(
            theme,
            options,
            itemsPerTheme,
          );
          break;
        case 'mixed':
          // Generate mix of item types for triangulation
          const likert = await this.generateLikertItems(theme, options, 2);
          const mc = await this.generateMultipleChoiceItems(theme, options, 1);
          themeItems = [...likert, ...mc];
          break;
      }

      items.push(...themeItems);
    }

    return this.buildResult(items, options);
  }

  /**
   * Generate Likert scale items
   * Based on DeVellis (2016) recommendations for scale construction
   */
  private async generateLikertItems(
    theme: Theme,
    options: GenerateSurveyItemsOptions,
    count: number,
  ): Promise<SurveyItem[]> {
    const items: SurveyItem[] = [];
    const scaleType = options.scaleType || '1-5';
    const includeReverse = options.includeReverseCoded !== false;

    // Generate AI-powered item text using GPT-4
    const itemTexts = await this.generateItemTextsWithAI(
      theme,
      'likert',
      count,
      options.researchContext,
      options.targetAudience,
    );

    for (let i = 0; i < itemTexts.length; i++) {
      const reversed = includeReverse && i === Math.floor(itemTexts.length / 2);

      items.push({
        id: `${theme.id}_likert_${i + 1}`,
        type: 'likert',
        themeId: theme.id,
        themeName: theme.name,
        text: itemTexts[i],
        scaleType,
        scaleLabels: this.getLikertScaleLabels(scaleType),
        reversed,
        reliability: reversed
          ? {
              reverseCodedReason:
                'Included to detect acquiescence bias and improve scale reliability',
              expectedCorrelation: 'negative',
            }
          : {
              expectedCorrelation: 'positive',
            },
        metadata: {
          generationMethod:
            'AI-assisted with DeVellis (2016) scale development principles',
          researchBacking:
            'DeVellis, R. F. (2016). Scale Development: Theory and Applications (4th ed.)',
          confidence: theme.confidence,
          themePrevalence: theme.prevalence,
        },
      });
    }

    return items;
  }

  /**
   * Generate multiple choice items
   */
  private async generateMultipleChoiceItems(
    theme: Theme,
    options: GenerateSurveyItemsOptions,
    count: number,
  ): Promise<SurveyItem[]> {
    const items: SurveyItem[] = [];

    const itemData = await this.generateMCItemsWithAI(
      theme,
      count,
      options.researchContext,
      options.targetAudience,
    );

    for (let i = 0; i < itemData.length; i++) {
      items.push({
        id: `${theme.id}_mc_${i + 1}`,
        type: 'multiple_choice',
        themeId: theme.id,
        themeName: theme.name,
        text: itemData[i].question,
        options: itemData[i].options,
        metadata: {
          generationMethod: 'AI-assisted multiple choice generation',
          researchBacking: 'Haladyna & Rodriguez (2013) developing test items',
          confidence: theme.confidence,
          themePrevalence: theme.prevalence,
        },
      });
    }

    return items;
  }

  /**
   * Generate semantic differential scales
   * Uses bipolar adjective pairs (Osgood et al., 1957)
   */
  private async generateSemanticDifferentialItems(
    theme: Theme,
    options: GenerateSurveyItemsOptions,
    count: number,
  ): Promise<SurveyItem[]> {
    const items: SurveyItem[] = [];
    const scaleType = options.scaleType || '1-7';

    const bipolarPairs = await this.generateBipolarPairsWithAI(
      theme,
      count,
      options.researchContext,
    );

    for (let i = 0; i < bipolarPairs.length; i++) {
      const pair = bipolarPairs[i];

      items.push({
        id: `${theme.id}_sd_${i + 1}`,
        type: 'semantic_differential',
        themeId: theme.id,
        themeName: theme.name,
        text: `Rate your perception of ${theme.name.toLowerCase()} on the following dimension:`,
        scaleType,
        leftPole: pair.left,
        rightPole: pair.right,
        dimension: pair.dimension,
        metadata: {
          generationMethod: 'Semantic differential with bipolar adjectives',
          researchBacking:
            'Osgood, C. E., Suci, G., & Tannenbaum, P. (1957). The Measurement of Meaning',
          confidence: theme.confidence,
          themePrevalence: theme.prevalence,
        },
      });
    }

    return items;
  }

  /**
   * Generate matrix/grid items
   * Multiple items measuring the same construct
   */
  private async generateMatrixGridItems(
    theme: Theme,
    options: GenerateSurveyItemsOptions,
    count: number,
  ): Promise<SurveyItem[]> {
    const items: SurveyItem[] = [];
    const scaleType = options.scaleType || '1-5';

    const gridItems = await this.generateItemTextsWithAI(
      theme,
      'matrix_grid',
      count,
      options.researchContext,
      options.targetAudience,
    );

    for (let i = 0; i < gridItems.length; i++) {
      items.push({
        id: `${theme.id}_grid_${i + 1}`,
        type: 'matrix_grid',
        themeId: theme.id,
        themeName: theme.name,
        text: gridItems[i],
        scaleType,
        scaleLabels: this.getLikertScaleLabels(scaleType),
        construct: theme.name,
        itemNumber: i + 1,
        metadata: {
          generationMethod: 'Matrix grid format for efficient data collection',
          researchBacking: 'DeVellis (2016) - multiple items per construct',
          confidence: theme.confidence,
          themePrevalence: theme.prevalence,
        },
      });
    }

    return items;
  }

  /**
   * Generate rating scale items
   */
  private async generateRatingScaleItems(
    theme: Theme,
    options: GenerateSurveyItemsOptions,
    count: number,
  ): Promise<SurveyItem[]> {
    const items: SurveyItem[] = [];
    const scaleType = options.scaleType || '1-10';

    const itemTexts = await this.generateItemTextsWithAI(
      theme,
      'rating_scale',
      count,
      options.researchContext,
      options.targetAudience,
    );

    for (let i = 0; i < itemTexts.length; i++) {
      items.push({
        id: `${theme.id}_rating_${i + 1}`,
        type: 'rating_scale',
        themeId: theme.id,
        themeName: theme.name,
        text: itemTexts[i],
        scaleType,
        scaleLabels: this.getRatingScaleLabels(scaleType),
        metadata: {
          generationMethod: 'Numeric rating scale generation',
          researchBacking: 'Krosnick & Presser (2010) question design',
          confidence: theme.confidence,
          themePrevalence: theme.prevalence,
        },
      });
    }

    return items;
  }

  /**
   * Use GPT-4 to generate context-appropriate item text
   */
  private async generateItemTextsWithAI(
    theme: Theme,
    itemType: string,
    count: number,
    researchContext?: string,
    targetAudience?: string,
  ): Promise<string[]> {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      this.logger.warn(
        'OpenAI API key not configured, using template-based generation',
      );
      return this.generateTemplateItems(theme, itemType, count);
    }

    try {
      const prompt = this.buildItemGenerationPrompt(
        theme,
        itemType,
        count,
        researchContext,
        targetAudience,
      );

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert in survey design and psychometrics. Generate high-quality survey items following DeVellis (2016) scale development principles.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;
      return this.parseAIGeneratedItems(content, count);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`AI generation failed: ${err.message}`);
      return this.generateTemplateItems(theme, itemType, count);
    }
  }

  /**
   * Generate MC items with AI
   */
  private async generateMCItemsWithAI(
    theme: Theme,
    count: number,
    researchContext?: string,
    targetAudience?: string,
  ): Promise<Array<{ question: string; options: string[] }>> {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return this.generateTemplateMCItems(theme, count);
    }

    try {
      const prompt = `Generate ${count} multiple choice questions about "${theme.name}".

Theme Description: ${theme.description}
Research Context: ${researchContext || 'General research'}
Target Audience: ${targetAudience || 'General population'}

Requirements:
1. Each question should have 4-5 distinct options
2. Options should be mutually exclusive and exhaustive
3. Include "Other (please specify)" as the last option when appropriate
4. Avoid overlapping or ambiguous options
5. Follow Haladyna & Rodriguez (2013) best practices

Format your response as JSON array:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  }
]`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert in survey design. Generate valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`MC generation failed: ${err.message}`);
      return this.generateTemplateMCItems(theme, count);
    }
  }

  /**
   * Generate bipolar adjective pairs with AI
   */
  private async generateBipolarPairsWithAI(
    theme: Theme,
    count: number,
    researchContext?: string,
  ): Promise<Array<{ left: string; right: string; dimension: string }>> {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return this.generateTemplateBipolarPairs(theme, count);
    }

    try {
      const prompt = `Generate ${count} bipolar adjective pairs for semantic differential scales about "${theme.name}".

Theme Description: ${theme.description}
Research Context: ${researchContext || 'General research'}

Requirements:
1. Pairs should be true opposites (e.g., "good" - "bad", "strong" - "weak")
2. Use single words or short phrases (max 2 words per pole)
3. Cover different dimensions (evaluative, potency, activity - Osgood 1957)
4. Avoid pairs that are not truly bipolar

Format as JSON:
[
  {"left": "positive pole", "right": "negative pole", "dimension": "evaluative"}
]`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert in semantic differential scales. Generate valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 400,
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Bipolar pair generation failed: ${err.message}`);
      return this.generateTemplateBipolarPairs(theme, count);
    }
  }

  /**
   * Build GPT-4 prompt for item generation
   */
  private buildItemGenerationPrompt(
    theme: Theme,
    itemType: string,
    count: number,
    researchContext?: string,
    targetAudience?: string,
  ): string {
    return `Generate ${count} ${itemType} survey items for the theme "${theme.name}".

Theme Description: ${theme.description}
Prevalence: ${(theme.prevalence * 100).toFixed(1)}% (how common this theme was in the literature)
Research Context: ${researchContext || 'General research'}
Target Audience: ${targetAudience || 'General population'}

Requirements for ${itemType} items:
${this.getItemTypeRequirements(itemType)}

Generate ${count} distinct items as a numbered list (1., 2., 3., etc.).
Each item should be clear, concise, and appropriate for the target audience.`;
  }

  /**
   * Get item type specific requirements
   */
  private getItemTypeRequirements(itemType: string): string {
    const requirements: Record<string, string> = {
      likert: `- Use clear, unambiguous language
- Avoid double-barreled questions
- Each item should measure a single aspect of the theme
- Vary wording to avoid response patterns
- Items should be suitable for agree-disagree scales`,
      matrix_grid: `- All items should measure the same construct
- Use parallel sentence structure for easy reading
- Keep items brief (under 15 words)
- Ensure items work well when presented in a grid format`,
      rating_scale: `- Frame items as "How would you rate..." or "To what extent..."
- Ensure items work with numeric rating scales (1-10)
- Be specific about what is being rated`,
    };

    return requirements[itemType] || 'Generate clear, appropriate survey items';
  }

  /**
   * Parse AI-generated items from text
   */
  private parseAIGeneratedItems(
    content: string,
    expectedCount: number,
  ): string[] {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const items: string[] = [];

    for (const line of lines) {
      // Match numbered items (1., 2., etc.) or bullet points
      const match = line.match(/^(?:\d+\.|[-•])\s*(.+)$/);
      if (match) {
        items.push(match[1].trim());
      }
    }

    // Fallback if parsing fails
    if (items.length === 0 && lines.length > 0) {
      return lines.slice(0, expectedCount);
    }

    return items.slice(0, expectedCount);
  }

  /**
   * Template-based item generation (fallback)
   */
  private generateTemplateItems(
    theme: Theme,
    itemType: string,
    count: number,
  ): string[] {
    const templates = this.getItemTemplates(itemType);
    const items: string[] = [];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      items.push(template.replace('{theme}', theme.name.toLowerCase()));
    }

    return items;
  }

  /**
   * Get item templates by type
   */
  private getItemTemplates(itemType: string): string[] {
    const templates: Record<string, string[]> = {
      likert: [
        'I believe {theme} is important',
        '{theme} plays a significant role in my experience',
        'I am satisfied with {theme}',
        'I would recommend {theme} to others',
      ],
      matrix_grid: [
        '{theme} is valuable to me',
        '{theme} meets my needs',
        '{theme} is important for my goals',
      ],
      rating_scale: [
        'How would you rate {theme}?',
        'To what extent does {theme} matter to you?',
        'How important is {theme}?',
      ],
    };

    return templates[itemType] || templates.likert;
  }

  /**
   * Template MC items
   */
  private generateTemplateMCItems(
    theme: Theme,
    count: number,
  ): Array<{ question: string; options: string[] }> {
    const items: Array<{ question: string; options: string[] }> = [];

    for (let i = 0; i < count; i++) {
      items.push({
        question: `Which of the following best describes your experience with ${theme.name.toLowerCase()}?`,
        options: [
          'Very positive experience',
          'Somewhat positive experience',
          'Neutral experience',
          'Somewhat negative experience',
          'Very negative experience',
        ],
      });
    }

    return items;
  }

  /**
   * Template bipolar pairs
   */
  private generateTemplateBipolarPairs(
    _theme: Theme,
    count: number,
  ): Array<{ left: string; right: string; dimension: string }> {
    const pairs = [
      { left: 'Positive', right: 'Negative', dimension: 'evaluative' },
      { left: 'Strong', right: 'Weak', dimension: 'potency' },
      { left: 'Active', right: 'Passive', dimension: 'activity' },
      { left: 'Good', right: 'Bad', dimension: 'evaluative' },
      { left: 'Effective', right: 'Ineffective', dimension: 'evaluative' },
    ];

    return pairs.slice(0, count);
  }

  /**
   * Get Likert scale labels
   */
  private getLikertScaleLabels(scaleType: string): string[] {
    const labels: Record<string, string[]> = {
      '1-5': [
        'Strongly Disagree',
        'Disagree',
        'Neutral',
        'Agree',
        'Strongly Agree',
      ],
      '1-7': [
        'Strongly Disagree',
        'Disagree',
        'Somewhat Disagree',
        'Neutral',
        'Somewhat Agree',
        'Agree',
        'Strongly Agree',
      ],
      '1-10': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      'agree-disagree': [
        'Strongly Disagree',
        'Disagree',
        'Neutral',
        'Agree',
        'Strongly Agree',
      ],
      frequency: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
      satisfaction: [
        'Very Dissatisfied',
        'Dissatisfied',
        'Neutral',
        'Satisfied',
        'Very Satisfied',
      ],
    };

    return labels[scaleType] || labels['1-5'];
  }

  /**
   * Get rating scale labels
   */
  private getRatingScaleLabels(scaleType: string): string[] {
    if (scaleType === '1-10') {
      return [
        '1 (Lowest)',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10 (Highest)',
      ];
    }
    return ['1 (Lowest)', '2', '3', '4', '5 (Highest)'];
  }

  /**
   * Build final result with metadata
   */
  private buildResult(
    items: SurveyItem[],
    _options: GenerateSurveyItemsOptions,
  ): SurveyItemGenerationResult {
    const itemsByType = items.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const reverseCodedCount = items.filter((item) => item.reversed).length;
    const averageConfidence =
      items.reduce((sum, item) => sum + item.metadata.confidence, 0) /
      items.length;

    return {
      items,
      summary: {
        totalItems: items.length,
        itemsByType,
        reverseCodedCount,
        averageConfidence,
      },
      methodology: {
        approach:
          'Theme-based survey item generation using AI assistance and psychometric best practices',
        researchBacking:
          'DeVellis (2016) Scale Development, Osgood et al. (1957) Semantic Differential, Haladyna & Rodriguez (2013) Test Item Development',
        validation:
          'Items generated from empirically-derived themes with source triangulation',
        reliability:
          'Reverse-coded items included for acquiescence bias detection; pilot testing recommended',
      },
      recommendations: {
        pilotTesting:
          'Conduct pilot study with 30-50 respondents to test item clarity and response variance',
        reliabilityAnalysis:
          "Calculate Cronbach's alpha (target α > 0.70) and item-total correlations (target r > 0.30)",
        validityChecks:
          'Perform factor analysis to confirm items load on expected constructs; assess content validity with expert panel',
      },
    };
  }
}
