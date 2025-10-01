import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ThemeExtractionService, ExtractedTheme } from './theme-extraction.service';
import { StatementGeneratorService } from '../../ai/services/statement-generator.service';

export interface ThemeStatementMapping {
  themeId: string;
  themeLabel: string;
  statements: StatementWithProvenance[];
}

export interface StatementWithProvenance {
  text: string;
  order: number;
  sourcePaperId?: string;
  sourceThemeId: string;
  perspective: 'supportive' | 'critical' | 'neutral' | 'balanced';
  generationMethod: 'theme-based' | 'ai-augmented' | 'controversy-pair' | 'manual';
  confidence: number;
  provenance: {
    sourceDocuments: string[];
    extractedThemes: string[];
    citationChain: string[];
    generationTimestamp: Date;
    aiModel?: string;
    controversyContext?: {
      viewpointA: string;
      viewpointB: string;
    };
  };
}

export interface StudyScaffoldingContext {
  researchQuestions?: string[];
  hypotheses?: string[];
  objectives?: string[];
  suggestedMethods?: {
    gridSize?: number;
    participantCount?: number;
    analysisApproach?: string;
  };
}

@Injectable()
export class ThemeToStatementService {
  private readonly logger = new Logger(ThemeToStatementService.name);

  constructor(
    private prisma: PrismaService,
    private themeExtractionService: ThemeExtractionService,
    private statementGeneratorService: StatementGeneratorService,
  ) {}

  /**
   * Map themes to statements with multi-perspective generation
   * Includes controversy pairs for balanced coverage
   */
  async mapThemesToStatements(
    themes: ExtractedTheme[],
    studyContext?: {
      targetStatements?: number;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
      includeControversyPairs?: boolean;
    },
  ): Promise<ThemeStatementMapping[]> {
    this.logger.log(`Mapping ${themes.length} themes to statements`);

    const mappings: ThemeStatementMapping[] = [];
    const targetPerTheme = Math.ceil((studyContext?.targetStatements || 40) / themes.length);
    let statementOrder = 0;

    for (const theme of themes) {
      const statements: StatementWithProvenance[] = [];

      // Generate perspective-based statements
      const perspectives: ('supportive' | 'critical' | 'neutral' | 'balanced')[] =
        theme.controversial
          ? ['supportive', 'critical', 'balanced']
          : ['neutral'];

      for (const perspective of perspectives) {
        const statement = await this.generatePerspectiveStatement(
          theme,
          perspective,
          studyContext?.academicLevel || 'intermediate',
        );

        statements.push({
          ...statement,
          order: ++statementOrder,
        });
      }

      // Generate controversy pairs if theme is controversial
      if (theme.controversial && theme.opposingViews && studyContext?.includeControversyPairs !== false) {
        const controversyPairs = await this.generateControversyPairs(theme);
        for (const pair of controversyPairs) {
          statements.push({
            ...pair,
            order: ++statementOrder,
          });
        }
      }

      // Ensure minimum statements per theme
      while (statements.length < Math.min(targetPerTheme, 5)) {
        const additionalStatement = await this.generateAdditionalStatement(
          theme,
          statements,
          studyContext?.academicLevel || 'intermediate',
        );
        statements.push({
          ...additionalStatement,
          order: ++statementOrder,
        });
      }

      mappings.push({
        themeId: theme.id,
        themeLabel: theme.label,
        statements,
      });
    }

    return mappings;
  }

  /**
   * Generate controversy pairs for balanced representation
   */
  private async generateControversyPairs(
    theme: ExtractedTheme,
  ): Promise<StatementWithProvenance[]> {
    const pairs: StatementWithProvenance[] = [];

    if (!theme.opposingViews || theme.opposingViews.length < 2) {
      return pairs;
    }

    // Generate statement for viewpoint A
    const statementA = await this.statementGeneratorService.generateStatements(
      `${theme.label} - Viewpoint: ${theme.opposingViews[0]}`,
      { count: 1, maxLength: 100 },
    );

    // Generate statement for viewpoint B
    const statementB = await this.statementGeneratorService.generateStatements(
      `${theme.label} - Viewpoint: ${theme.opposingViews[1]}`,
      { count: 1, maxLength: 100 },
    );

    const timestamp = new Date();

    if (statementA.length > 0) {
      pairs.push({
        text: statementA[0].text,
        order: 0, // Will be set by caller
        sourceThemeId: theme.id,
        perspective: 'supportive',
        generationMethod: 'controversy-pair',
        confidence: 0.8,
        provenance: {
          sourceDocuments: theme.papers,
          extractedThemes: [theme.id],
          citationChain: [],
          generationTimestamp: timestamp,
          aiModel: 'gpt-4-turbo-preview',
          controversyContext: {
            viewpointA: theme.opposingViews[0],
            viewpointB: theme.opposingViews[1],
          },
        },
      });
    }

    if (statementB.length > 0) {
      pairs.push({
        text: statementB[0].text,
        order: 0, // Will be set by caller
        sourceThemeId: theme.id,
        perspective: 'critical',
        generationMethod: 'controversy-pair',
        confidence: 0.8,
        provenance: {
          sourceDocuments: theme.papers,
          extractedThemes: [theme.id],
          citationChain: [],
          generationTimestamp: timestamp,
          aiModel: 'gpt-4-turbo-preview',
          controversyContext: {
            viewpointA: theme.opposingViews[0],
            viewpointB: theme.opposingViews[1],
          },
        },
      });
    }

    return pairs;
  }

  /**
   * Generate a single perspective-based statement
   */
  private async generatePerspectiveStatement(
    theme: ExtractedTheme,
    perspective: 'supportive' | 'critical' | 'neutral' | 'balanced',
    academicLevel: 'basic' | 'intermediate' | 'advanced',
  ): Promise<StatementWithProvenance> {
    const perspectivePrompt = this.buildPerspectivePrompt(theme, perspective, academicLevel);

    const statements = await this.statementGeneratorService.generateStatements(
      perspectivePrompt,
      {
        count: 1,
        maxLength: 100,
        academicLevel,
        avoidBias: perspective === 'neutral' || perspective === 'balanced',
      },
    );

    const timestamp = new Date();

    return {
      text: statements[0]?.text || `Statement about ${theme.label}`,
      order: 0, // Will be set by caller
      sourceThemeId: theme.id,
      sourcePaperId: theme.papers[0], // Primary source paper
      perspective,
      generationMethod: 'theme-based',
      confidence: this.calculateConfidence(theme, perspective),
      provenance: {
        sourceDocuments: theme.papers,
        extractedThemes: [theme.id],
        citationChain: [],
        generationTimestamp: timestamp,
        aiModel: 'gpt-4-turbo-preview',
      },
    };
  }

  /**
   * Generate additional statement to meet target count
   */
  private async generateAdditionalStatement(
    theme: ExtractedTheme,
    existingStatements: StatementWithProvenance[],
    academicLevel: 'basic' | 'intermediate' | 'advanced',
  ): Promise<StatementWithProvenance> {
    // Find which perspective is least represented
    const perspectiveCounts = new Map<string, number>();
    for (const stmt of existingStatements) {
      perspectiveCounts.set(stmt.perspective, (perspectiveCounts.get(stmt.perspective) || 0) + 1);
    }

    const leastRepresented = ['neutral', 'supportive', 'critical', 'balanced']
      .find(p => !perspectiveCounts.has(p)) || 'neutral';

    return this.generatePerspectiveStatement(
      theme,
      leastRepresented as any,
      academicLevel,
    );
  }

  /**
   * Build perspective-specific prompt
   */
  private buildPerspectivePrompt(
    theme: ExtractedTheme,
    perspective: string,
    academicLevel: string,
  ): string {
    const baseContext = `${theme.label}: ${theme.description || ''}`;

    switch (perspective) {
      case 'supportive':
        return `Generate a statement supporting: ${baseContext}`;
      case 'critical':
        return `Generate a critical statement about: ${baseContext}`;
      case 'balanced':
        return `Generate a balanced statement acknowledging multiple views on: ${baseContext}`;
      default:
        return `Generate a neutral statement about: ${baseContext}`;
    }
  }

  /**
   * Calculate confidence score based on theme and perspective
   */
  private calculateConfidence(theme: ExtractedTheme, perspective: string): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for themes with more papers
    if (theme.papers.length > 5) confidence += 0.1;
    if (theme.papers.length > 10) confidence += 0.1;

    // Adjust for controversial themes
    if (theme.controversial) {
      if (perspective === 'balanced') {
        confidence += 0.05; // Balanced statements on controversial topics are valuable
      } else if (perspective === 'supportive' || perspective === 'critical') {
        confidence -= 0.05; // Partisan statements on controversial topics need care
      }
    }

    // Weight influences confidence
    confidence += theme.weight * 0.1;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Wire gap analyzer outputs into study scaffolding
   */
  async createStudyScaffolding(
    researchGaps: any[],
    themes: ExtractedTheme[],
  ): Promise<StudyScaffoldingContext> {
    const scaffolding: StudyScaffoldingContext = {
      researchQuestions: [],
      hypotheses: [],
      objectives: [],
      suggestedMethods: {},
    };

    // Generate research questions from gaps
    for (const gap of researchGaps.slice(0, 3)) {
      scaffolding.researchQuestions?.push(
        `How does ${gap.topic || gap.description} impact the field?`
      );
    }

    // Generate hypotheses from controversial themes
    const controversialThemes = themes.filter(t => t.controversial);
    for (const theme of controversialThemes.slice(0, 3)) {
      if (theme.opposingViews) {
        scaffolding.hypotheses?.push(
          `Participants will show polarized perspectives on ${theme.label}`
        );
      }
    }

    // Generate objectives from all themes
    scaffolding.objectives?.push(
      `Identify distinct viewpoints on ${themes.map(t => t.label).join(', ')}`,
      `Understand factors influencing perspective formation`,
      `Develop typology of participant positions`,
    );

    // Suggest methods based on theme count and controversy
    const hasControversy = controversialThemes.length > 0;
    scaffolding.suggestedMethods = {
      gridSize: hasControversy ? 11 : 9, // Larger grid for controversial topics
      participantCount: Math.max(30, themes.length * 8), // 8 participants per theme minimum
      analysisApproach: hasControversy ? 'varimax-rotation' : 'pca-extraction',
    };

    return scaffolding;
  }

  /**
   * Persist statement mappings to database
   */
  async persistToSurvey(
    surveyId: string,
    mappings: ThemeStatementMapping[],
  ): Promise<void> {
    this.logger.log(`Persisting ${mappings.length} theme mappings to survey ${surveyId}`);

    // Update survey with theme and paper IDs
    const allPaperIds = new Set<string>();
    const allThemeIds = new Set<string>();

    for (const mapping of mappings) {
      allThemeIds.add(mapping.themeId);
      for (const stmt of mapping.statements) {
        if (stmt.sourcePaperId) allPaperIds.add(stmt.sourcePaperId);
      }
    }

    await this.prisma.survey.update({
      where: { id: surveyId },
      data: {
        basedOnPapersIds: JSON.stringify(Array.from(allPaperIds)),
        extractedThemeIds: JSON.stringify(Array.from(allThemeIds)),
      },
    });

    // Create statements with provenance
    const statements = mappings.flatMap(mapping => mapping.statements);

    for (const stmt of statements) {
      await this.prisma.statement.create({
        data: {
          surveyId,
          text: stmt.text,
          order: stmt.order,
          sourcePaperId: stmt.sourcePaperId,
          sourceThemeId: stmt.sourceThemeId,
          perspective: stmt.perspective,
          generationMethod: stmt.generationMethod,
          confidence: stmt.confidence,
          provenance: stmt.provenance,
        },
      });
    }

    // Create or update research pipeline
    await this.prisma.researchPipeline.upsert({
      where: { surveyId },
      update: {
        generatedStatements: JSON.stringify(statements.map(s => s.text)),
        statementProvenance: JSON.stringify(statements.map(s => s.provenance)),
        extractedThemes: JSON.stringify(Array.from(allThemeIds)),
        selectedPaperIds: JSON.stringify(Array.from(allPaperIds)),
      },
      create: {
        surveyId,
        generatedStatements: JSON.stringify(statements.map(s => s.text)),
        statementProvenance: JSON.stringify(statements.map(s => s.provenance)),
        extractedThemes: JSON.stringify(Array.from(allThemeIds)),
        selectedPaperIds: JSON.stringify(Array.from(allPaperIds)),
      },
    });
  }

  /**
   * Generate statements from theme IDs
   * This is the method called by the pipeline controller
   */
  async generateFromThemes(
    themeIds: string[],
    studyContext: {
      topic: string;
      academicLevel: 'undergraduate' | 'graduate' | 'professional';
      targetStatementCount: number;
      perspectives: ('supportive' | 'critical' | 'neutral' | 'balanced')[];
    },
    userId: string,
  ): Promise<{ statements: any[]; metadata: any }> {
    this.logger.log(`Generating statements from ${themeIds.length} themes for user ${userId}`);

    // For now, return a mock response to get the server running
    const statements = themeIds.map((themeId, index) => ({
      text: `Statement ${index + 1} based on theme ${themeId}`,
      order: index,
      themeId,
      perspective: studyContext.perspectives[index % studyContext.perspectives.length],
    }));

    return {
      statements,
      metadata: {
        themesProcessed: themeIds.length,
        statementsGenerated: statements.length,
        tokensUsed: 0, // Would be calculated in real implementation
      },
    };
  }
}