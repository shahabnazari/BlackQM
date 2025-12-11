import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import {
  ThemeExtractionService,
  ExtractedTheme,
} from './theme-extraction.service';
import { StatementGeneratorService } from '../../ai/services/statement-generator.service';
// Phase 10.113 Week 5: Claim-based statement generation
import { ClaimExtractionService } from './claim-extraction.service';
import type {
  ExtractedClaim,
  ClaimExtractionPaperInput,
  ClaimExtractionThemeContext,
} from '../types/claim-extraction.types';

// ============================================================================
// Phase 10.113 Week 5: Configuration Constants (No Magic Numbers)
// ============================================================================

/** Maximum claims to use for statement generation per theme */
const MAX_CLAIMS_FOR_STATEMENTS = 20;

/** Minimum statement potential to convert claim to statement */
const MIN_CLAIM_POTENTIAL_FOR_STATEMENT = 0.5;

/** Weight for claim-based statements vs theme-based */
const CLAIM_STATEMENT_CONFIDENCE_BOOST = 0.15;

/** Default target statements if not specified */
const DEFAULT_TARGET_STATEMENTS = 40;

/** Minimum statements per theme */
const MIN_STATEMENTS_PER_THEME = 3;

/** Maximum statements per theme */
const MAX_STATEMENTS_PER_THEME = 10;

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
  generationMethod:
    | 'theme-based'
    | 'ai-augmented'
    | 'controversy-pair'
    | 'claim-based'  // Phase 10.113 Week 5: Claim-to-statement conversion
    | 'manual';
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
    _themeExtractionService: ThemeExtractionService,
    private statementGeneratorService: StatementGeneratorService,
    // Phase 10.113 Week 5: Claim-based statement generation
    private claimExtractionService: ClaimExtractionService,
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
    const targetPerTheme = Math.ceil(
      (studyContext?.targetStatements || 40) / themes.length,
    );
    let statementOrder = 0;

    for (const theme of themes) {
      const statements: StatementWithProvenance[] = [];

      // Generate perspective-based statements
      const perspectives: (
        | 'supportive'
        | 'critical'
        | 'neutral'
        | 'balanced'
      )[] = theme.controversial
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
      if (
        theme.controversial &&
        theme.opposingViews &&
        studyContext?.includeControversyPairs !== false
      ) {
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
    const perspectivePrompt = this.buildPerspectivePrompt(
      theme,
      perspective,
      academicLevel,
    );

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
      perspectiveCounts.set(
        stmt.perspective,
        (perspectiveCounts.get(stmt.perspective) || 0) + 1,
      );
    }

    const leastRepresented =
      ['neutral', 'supportive', 'critical', 'balanced'].find(
        (p) => !perspectiveCounts.has(p),
      ) || 'neutral';

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
    _academicLevel: string,
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
  private calculateConfidence(
    theme: ExtractedTheme,
    perspective: string,
  ): number {
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
        `How does ${gap.topic || gap.description} impact the field?`,
      );
    }

    // Generate hypotheses from controversial themes
    const controversialThemes = themes.filter((t) => t.controversial);
    for (const theme of controversialThemes.slice(0, 3)) {
      if (theme.opposingViews) {
        scaffolding.hypotheses?.push(
          `Participants will show polarized perspectives on ${theme.label}`,
        );
      }
    }

    // Generate objectives from all themes
    scaffolding.objectives?.push(
      `Identify distinct viewpoints on ${themes.map((t) => t.label).join(', ')}`,
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
    this.logger.log(
      `Persisting ${mappings.length} theme mappings to survey ${surveyId}`,
    );

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
    const statements = mappings.flatMap((mapping) => mapping.statements);

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
        generatedStatements: JSON.stringify(statements.map((s) => s.text)),
        statementProvenance: JSON.stringify(
          statements.map((s) => s.provenance),
        ),
        extractedThemes: JSON.stringify(Array.from(allThemeIds)),
        selectedPaperIds: JSON.stringify(Array.from(allPaperIds)),
      },
      create: {
        surveyId,
        generatedStatements: JSON.stringify(statements.map((s) => s.text)),
        statementProvenance: JSON.stringify(
          statements.map((s) => s.provenance),
        ),
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
    this.logger.log(
      `Generating statements from ${themeIds.length} themes for user ${userId}`,
    );

    // For now, return a mock response to get the server running
    const statements = themeIds.map((themeId, index) => ({
      text: `Statement ${index + 1} based on theme ${themeId}`,
      order: index,
      themeId,
      perspective:
        studyContext.perspectives[index % studyContext.perspectives.length],
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

  // ============================================================================
  // Phase 10.113 Week 5: Claim-Based Statement Generation
  // ============================================================================

  /**
   * Generate statements from extracted claims (Week 5)
   * Uses ClaimExtractionService to extract claims, then converts to statements
   * with full provenance chain: Paper → Claim → Theme → Statement
   *
   * @param themes - Extracted themes
   * @param papers - Source papers (need abstracts for claim extraction)
   * @param studyContext - Study configuration
   * @returns Theme-statement mappings with claim-based provenance
   */
  async mapThemesToStatementsWithClaims(
    themes: ExtractedTheme[],
    papers: Array<{
      id: string;
      title: string;
      abstract?: string;
      year?: number;
      authors?: string[];
      keywords?: string[];
    }>,
    studyContext?: {
      targetStatements?: number;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
      includeControversyPairs?: boolean;
    },
  ): Promise<ThemeStatementMapping[]> {
    this.logger.log(
      `[Phase 10.113 Week 5] Mapping ${themes.length} themes to statements using claim extraction`,
    );

    const mappings: ThemeStatementMapping[] = [];
    const targetPerTheme = Math.ceil(
      (studyContext?.targetStatements || DEFAULT_TARGET_STATEMENTS) / themes.length,
    );
    let statementOrder = 0;

    for (const theme of themes) {
      // Find papers belonging to this theme
      const themePapers = papers.filter(p => theme.papers.includes(p.id));

      // Convert to ClaimExtractionPaperInput format
      const claimPapers: ClaimExtractionPaperInput[] = themePapers
        .filter(p => p.abstract && p.abstract.length >= 100)
        .map(p => ({
          id: p.id,
          title: p.title,
          abstract: p.abstract!,
          year: p.year,
          authors: p.authors,
          keywords: p.keywords,
          themeId: theme.id,
        }));

      const statements: StatementWithProvenance[] = [];

      // Phase 10.113 Week 5: Extract claims and convert to statements
      if (claimPapers.length > 0) {
        try {
          const claimStatements = await this.generateStatementsFromClaims(
            claimPapers,
            theme,
            targetPerTheme,
            studyContext?.academicLevel || 'intermediate',
          );

          for (const stmt of claimStatements) {
            statements.push({
              ...stmt,
              order: ++statementOrder,
            });
          }
        } catch (error: unknown) {
          const err = error as { message?: string };
          this.logger.warn(
            `[Phase 10.113 Week 5] Claim extraction failed for theme "${theme.label}": ` +
            `${err.message || 'Unknown error'}. Falling back to theme-based generation.`,
          );
        }
      }

      // Fallback: Generate theme-based statements if not enough claims
      const remaining = Math.max(
        MIN_STATEMENTS_PER_THEME - statements.length,
        0,
      );

      if (remaining > 0) {
        const fallbackStatements = await this.generateFallbackStatements(
          theme,
          remaining,
          studyContext?.academicLevel || 'intermediate',
        );

        for (const stmt of fallbackStatements) {
          statements.push({
            ...stmt,
            order: ++statementOrder,
          });
        }
      }

      // Generate controversy pairs if theme is controversial
      if (
        theme.controversial &&
        theme.opposingViews &&
        studyContext?.includeControversyPairs !== false
      ) {
        const controversyPairs = await this.generateControversyPairs(theme);
        for (const pair of controversyPairs) {
          statements.push({
            ...pair,
            order: ++statementOrder,
          });
        }
      }

      mappings.push({
        themeId: theme.id,
        themeLabel: theme.label,
        statements: statements.slice(0, MAX_STATEMENTS_PER_THEME),
      });
    }

    this.logger.log(
      `[Phase 10.113 Week 5] Generated ${mappings.reduce((sum, m) => sum + m.statements.length, 0)} ` +
      `statements from ${themes.length} themes`,
    );

    return mappings;
  }

  /**
   * Generate statements from extracted claims
   * Phase 10.113 Week 5: Core claim-to-statement conversion
   */
  private async generateStatementsFromClaims(
    papers: ClaimExtractionPaperInput[],
    theme: ExtractedTheme,
    targetCount: number,
    academicLevel: 'basic' | 'intermediate' | 'advanced',
  ): Promise<StatementWithProvenance[]> {
    // Build theme context for claim extraction
    const themeContext: ClaimExtractionThemeContext = {
      id: theme.id,
      label: theme.label,
      description: theme.description || '',
      keywords: theme.keywords,
      isControversial: theme.controversial,
    };

    // Extract claims
    const extractionResult = await this.claimExtractionService.extractClaims(
      papers,
      themeContext,
      {
        maxTotalClaims: MAX_CLAIMS_FOR_STATEMENTS,
        minStatementPotential: MIN_CLAIM_POTENTIAL_FOR_STATEMENT,
      },
    );

    // Sort by statement potential (highest first)
    const sortedClaims = [...extractionResult.claims].sort(
      (a, b) => b.statementPotential - a.statementPotential,
    );

    // Convert top claims to statements
    const statements: StatementWithProvenance[] = [];
    const timestamp = new Date();

    for (const claim of sortedClaims.slice(0, targetCount)) {
      const statement = this.convertClaimToStatement(
        claim,
        theme,
        timestamp,
        academicLevel,
      );
      statements.push(statement);
    }

    return statements;
  }

  /**
   * Convert a single claim to a statement with full provenance
   */
  private convertClaimToStatement(
    claim: ExtractedClaim,
    theme: ExtractedTheme,
    timestamp: Date,
    _academicLevel: 'basic' | 'intermediate' | 'advanced',
  ): StatementWithProvenance {
    // Map claim perspective to statement perspective
    const perspective = claim.perspective === 'neutral' ? 'neutral'
      : claim.perspective === 'supportive' ? 'supportive'
      : claim.perspective === 'critical' ? 'critical'
      : 'balanced';

    // Boost confidence for claim-based statements (higher provenance)
    const confidence = Math.min(
      1,
      claim.confidence * claim.statementPotential + CLAIM_STATEMENT_CONFIDENCE_BOOST,
    );

    return {
      text: claim.normalizedClaim,
      order: 0, // Will be set by caller
      sourcePaperId: claim.sourcePapers[0],
      sourceThemeId: theme.id,
      perspective,
      generationMethod: 'claim-based' as const, // Week 5: new method type
      confidence,
      provenance: {
        sourceDocuments: [...claim.sourcePapers],
        extractedThemes: [theme.id],
        citationChain: [],
        generationTimestamp: timestamp,
        aiModel: 'claim-extraction',
        // Phase 10.113 Week 5: Extended provenance
        claimId: claim.id,
        originalClaimText: claim.originalText,
        claimPerspective: claim.perspective,
        statementPotential: claim.statementPotential,
      } as StatementWithProvenance['provenance'] & {
        claimId: string;
        originalClaimText: string;
        claimPerspective: string;
        statementPotential: number;
      },
    };
  }

  /**
   * Generate fallback statements using traditional theme-based approach
   */
  private async generateFallbackStatements(
    theme: ExtractedTheme,
    count: number,
    academicLevel: 'basic' | 'intermediate' | 'advanced',
  ): Promise<StatementWithProvenance[]> {
    const statements: StatementWithProvenance[] = [];
    const perspectives: Array<'supportive' | 'critical' | 'neutral' | 'balanced'> = [
      'neutral',
      'supportive',
      'critical',
    ];

    for (let i = 0; i < count; i++) {
      const perspective = perspectives[i % perspectives.length]!;
      const statement = await this.generatePerspectiveStatement(
        theme,
        perspective,
        academicLevel,
      );
      statements.push(statement);
    }

    return statements;
  }
}
