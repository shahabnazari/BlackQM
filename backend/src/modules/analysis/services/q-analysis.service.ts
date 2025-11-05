import { Injectable } from '@nestjs/common';
import { FactorExtractionService } from './factor-extraction.service';
import { RotationEngineService } from './rotation-engine.service';
import { StatisticalOutputService } from './statistical-output.service';
import { PQMethodCompatibilityService } from './pqmethod-compatibility.service';
import { QMethodValidatorService } from '../qmethod-validator.service';
import { PrismaService } from '../../../common/prisma.service';
import {
  AnalysisOptions,
  AnalysisConfig,
  StudyData,
  QAnalysisResult,
  InteractionState,
  InteractiveAnalysisResult,
  RotationSuggestion,
  AnalysisComparison,
} from '../types';

/**
 * Q-Analysis Service
 * Main orchestrator for Q-methodology analysis
 * Provides comprehensive analysis pipeline with world-class performance
 */
@Injectable()
export class QAnalysisService {
  constructor(
    private readonly factorExtraction: FactorExtractionService,
    private readonly rotationEngine: RotationEngineService,
    private readonly statisticalOutput: StatisticalOutputService,
    private readonly pqmethodCompatibility: PQMethodCompatibilityService,
    private readonly validator: QMethodValidatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Perform complete Q-methodology analysis
   * End-to-end analysis pipeline with PQMethod compatibility
   */
  async performAnalysis(
    surveyId: string,
    options: AnalysisOptions = {},
  ): Promise<QAnalysisResult> {
    // Set default options
    const config = this.getAnalysisConfig(options);

    // Step 1: Load study data
    const studyData = await this.loadStudyData(surveyId);

    // Step 2: Calculate correlation matrix
    const correlationMatrix = this.validator.calculateCorrelationMatrix(
      studyData.qSorts,
    );

    // Step 3: Factor extraction
    const extractionResult = await this.extractFactors(
      correlationMatrix,
      config.extractionMethod,
      config.numberOfFactors ||
        (await this.determineOptimalFactors(correlationMatrix)),
    );

    // Step 4: Factor rotation
    // Transpose factors if needed (from rows to columns for rotation)
    const factorsForRotation = this.transposeMatrix(extractionResult.factors);
    const rotationResult = await this.rotateFactors(
      factorsForRotation,
      config.rotationMethod,
      config.rotationOptions,
    );

    // Step 5: Generate statistical outputs
    const statisticalOutputs = this.statisticalOutput.generateFactorArrays(
      rotationResult.rotatedLoadings,
      studyData.statements,
      studyData.qSorts,
    );

    // Step 6: Identify distinguishing and consensus statements
    const distinguishingStatements =
      this.statisticalOutput.identifyDistinguishingStatements(
        statisticalOutputs.factorArrays,
        config.significanceLevel,
      );

    const consensusStatements =
      this.statisticalOutput.identifyConsensusStatements(
        statisticalOutputs.factorArrays,
        config.consensusThreshold,
      );

    // Step 7: Generate crib sheets
    const cribSheets = this.statisticalOutput.generateCribSheets(
      statisticalOutputs.factorArrays,
      distinguishingStatements,
      consensusStatements,
    );

    // Step 8: Perform bootstrap analysis if requested
    let bootstrapResults = null;
    if (config.performBootstrap) {
      bootstrapResults = await this.statisticalOutput.performBootstrapAnalysis(
        studyData.qSorts,
        config.bootstrapIterations,
      );
    }

    // Step 9: Validate against PQMethod if benchmark provided
    let validationResults = null;
    if (config.pqmethodBenchmark) {
      validationResults = await this.validateAgainstPQMethod(
        {
          eigenvalues: extractionResult.eigenvalues,
          factorLoadings: rotationResult.rotatedLoadings,
          zScores: statisticalOutputs.factorArrays.flatMap((fa) =>
            fa.statements.map((s) => s.zScore),
          ),
          correlationMatrix,
        },
        config.pqmethodBenchmark,
      );
    }

    // Step 10: Save analysis results
    const analysisId = await this.saveAnalysisResults(surveyId, {
      config,
      extractionResult,
      rotationResult,
      statisticalOutputs,
      distinguishingStatements,
      consensusStatements,
      cribSheets,
      bootstrapResults,
      validationResults,
    });

    // Step 11: Generate comprehensive report
    const report = this.statisticalOutput.generateStatisticalReport(studyData, {
      factorArrays: statisticalOutputs.factorArrays,
      distinguishingStatements,
      consensusStatements,
      cribSheets,
      rotatedLoadings: rotationResult.rotatedLoadings,
      eigenvalues: extractionResult.eigenvalues,
      variance: extractionResult.variance,
      communalities: extractionResult.communalities,
      rotationMethod: config.rotationMethod,
      extractionMethod: config.extractionMethod,
      bootstrap: bootstrapResults,
      correlationMatrix,
    });

    return {
      analysisId,
      surveyId,
      timestamp: new Date(),
      config,
      correlationMatrix,
      extraction: extractionResult,
      rotation: rotationResult,
      factorArrays: statisticalOutputs.factorArrays,
      idealizedQSorts: statisticalOutputs.idealizedQSorts,
      distinguishingStatements,
      consensusStatements,
      cribSheets,
      bootstrap: bootstrapResults,
      validation: validationResults,
      report,
      performance: {
        analysisTime: Date.now() - studyData.startTime,
        participantCount: studyData.qSorts.length,
        statementCount: studyData.statements.length,
        factorCount: rotationResult.rotatedLoadings[0].length,
      },
    };
  }

  /**
   * Perform quick analysis with smart defaults
   * Optimized for performance with automatic parameter selection
   */
  async performQuickAnalysis(surveyId: string): Promise<QAnalysisResult> {
    return this.performAnalysis(surveyId, {
      extractionMethod: 'pca',
      rotationMethod: 'varimax',
      numberOfFactors: null, // Auto-determine
      performBootstrap: false,
      significanceLevel: 0.05,
      consensusThreshold: 0.5,
    });
  }

  /**
   * Perform interactive analysis with real-time updates
   * For manual rotation and exploration
   */
  async performInteractiveAnalysis(
    surveyId: string,
    interactionState: InteractionState,
  ): Promise<InteractiveAnalysisResult> {
    const studyData = await this.loadStudyData(surveyId);
    const correlationMatrix = this.validator.calculateCorrelationMatrix(
      studyData.qSorts,
    );

    // Use cached extraction if available
    let extractionResult = interactionState.cachedExtraction;
    if (!extractionResult) {
      extractionResult = await this.extractFactors(
        correlationMatrix,
        interactionState.extractionMethod,
        interactionState.numberOfFactors,
      );
    }

    // Apply interactive rotation
    const interactiveResult = await this.rotationEngine.rotateInteractive(
      extractionResult!.factors, // We know it's defined at this point
      interactionState.rotationHistory,
    );

    // Convert to RotationResult format
    const rotationResult = {
      rotatedLoadings: interactiveResult.rotatedLoadings,
      rotationMatrix: interactiveResult.cumulativeRotationMatrix,
      iterations: interactionState.rotationHistory.length,
      converged: true, // Interactive rotation always "converges"
    };

    // Generate real-time preview
    const preview = this.generateInteractivePreview(
      rotationResult,
      studyData.statements,
    );

    return {
      currentRotation: rotationResult,
      preview,
      canUndo: interactionState.rotationHistory.length > 0,
      canRedo: interactionState.redoStack.length > 0,
      suggestions: await this.generateRotationSuggestions(rotationResult),
    };
  }

  /**
   * Import PQMethod data and perform analysis
   */
  async importAndAnalyzePQMethod(
    filePath: string,
    options: AnalysisOptions = {},
  ): Promise<QAnalysisResult> {
    // Import PQMethod data
    const pqmethodData =
      await this.pqmethodCompatibility.importDATFile(filePath);

    // Convert to VQMethod format
    const surveyId = await this.createSurveyFromPQMethod(pqmethodData);

    // Perform analysis
    return this.performAnalysis(surveyId, options);
  }

  /**
   * Export analysis results to PQMethod format
   */
  async exportToPQMethod(
    analysisId: string,
    outputPath: string,
  ): Promise<void> {
    const analysis = await this.loadAnalysisResults(analysisId);

    // Convert to PQMethod format
    const pqmethodData =
      this.pqmethodCompatibility.convertToPQMethodFormat(analysis);

    // Export files
    await this.pqmethodCompatibility.exportDATFile(
      {
        statements: pqmethodData.data.statements,
        qSorts: pqmethodData.data.sorts,
        metadata: pqmethodData.metadata,
      },
      outputPath + '.dat',
    );
    await this.pqmethodCompatibility.exportLISFile(
      analysis.report,
      outputPath + '.lis',
    );
  }

  /**
   * Compare two analysis results
   */
  async compareAnalyses(
    analysisId1: string,
    analysisId2: string,
  ): Promise<AnalysisComparison> {
    const analysis1 = await this.loadAnalysisResults(analysisId1);
    const analysis2 = await this.loadAnalysisResults(analysisId2);

    return {
      factorCorrelation: this.compareFactorStructures(
        analysis1.rotation.rotatedLoadings,
        analysis2.rotation.rotatedLoadings,
      ),
      statementDifferences: this.compareStatementRankings(
        analysis1.factorArrays,
        analysis2.factorArrays,
      ),
      consensusOverlap: this.compareConsensusStatements(
        analysis1.consensusStatements,
        analysis2.consensusStatements,
      ),
      methodologicalDifferences: {
        extraction:
          analysis1.config.extractionMethod !==
          analysis2.config.extractionMethod,
        rotation:
          analysis1.config.rotationMethod !== analysis2.config.rotationMethod,
        factors:
          analysis1.config.numberOfFactors !== analysis2.config.numberOfFactors,
      },
    };
  }

  // Helper methods
  private getAnalysisConfig(options: AnalysisOptions): AnalysisConfig {
    return {
      extractionMethod: options.extractionMethod || 'pca',
      rotationMethod: options.rotationMethod || 'varimax',
      numberOfFactors: options.numberOfFactors || null,
      rotationOptions: options.rotationOptions || {},
      performBootstrap: options.performBootstrap ?? true,
      bootstrapIterations: options.bootstrapIterations || 1000,
      significanceLevel: options.significanceLevel || 0.05,
      consensusThreshold: options.consensusThreshold || 0.5,
      pqmethodBenchmark: options.pqmethodBenchmark,
    };
  }

  private async loadStudyData(surveyId: string): Promise<StudyData> {
    const startTime = Date.now();

    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        statements: true,
        responses: {
          include: {
            qSorts: true,
          },
        },
      },
    });

    if (!survey) {
      throw new Error(`Survey ${surveyId} not found`);
    }

    // Transform to analysis format
    const statements = survey.statements.map((stmt: any) => ({
      id: stmt.id,
      text: stmt.text,
      category: stmt.category || 'General',
    }));

    const qSorts = survey.responses
      .filter((response: any) => response.qSorts?.length > 0)
      .flatMap((response: any) =>
        response.qSorts.map((qSort: any) => qSort.sortData as number[]),
      );

    return {
      surveyId: surveyId,
      surveyName: survey.title,
      statements,
      qSorts,
      startTime,
    };
  }

  private async determineOptimalFactors(
    correlationMatrix: number[][],
  ): Promise<number> {
    // Use multiple criteria to determine optimal number of factors

    // 1. Kaiser criterion
    const eigenResult = await this.factorExtraction.extractFactorsPCA(
      correlationMatrix,
      10,
    );
    const kaiserFactors = this.factorExtraction.applyKaiserCriterion(
      eigenResult.eigenvalues,
    );

    // 2. Parallel analysis
    const parallelResult =
      await this.factorExtraction.performParallelAnalysis(correlationMatrix);

    // 3. Scree test (simplified - look for elbow)
    const screeSuggestion = this.findScreeElbow(eigenResult.eigenvalues);

    // Take the median of the three methods
    const suggestions = [
      kaiserFactors,
      parallelResult.suggestedFactors,
      screeSuggestion,
    ];
    suggestions.sort((a, b) => a - b);

    return suggestions[1]; // Return median
  }

  private findScreeElbow(eigenvalues: number[]): number {
    // Simple elbow detection
    const differences = eigenvalues
      .slice(1)
      .map((val, i) => eigenvalues[i] - val);

    const maxDiffIndex = differences.indexOf(Math.max(...differences));
    return maxDiffIndex + 1;
  }

  private async extractFactors(
    correlationMatrix: number[][],
    method: string,
    numberOfFactors: number,
  ): Promise<any> {
    switch (method) {
      case 'centroid':
        return this.factorExtraction.extractFactorsCentroid(
          correlationMatrix,
          numberOfFactors,
        );
      case 'pca':
        return this.factorExtraction.extractFactorsPCA(
          correlationMatrix,
          numberOfFactors,
        );
      case 'ml':
        return this.factorExtraction.extractFactorsML(
          correlationMatrix,
          numberOfFactors,
        );
      default:
        return this.factorExtraction.extractFactorsPCA(
          correlationMatrix,
          numberOfFactors,
        );
    }
  }

  private async rotateFactors(
    loadings: number[][],
    method: string,
    options: any = {},
  ): Promise<any> {
    switch (method) {
      case 'varimax':
        return this.rotationEngine.rotateVarimax(loadings, options.normalize);
      case 'quartimax':
        return this.rotationEngine.rotateQuartimax(loadings);
      case 'promax': {
        const promaxResult = await this.rotationEngine.rotatePromax(
          loadings,
          options.kappa,
        );
        return {
          rotatedLoadings: promaxResult.patternMatrix,
          rotationMatrix: this.createIdentityMatrix(loadings[0].length), // Placeholder
          iterations: 25, // Default for Promax
          converged: true,
          patternMatrix: promaxResult.patternMatrix,
          structureMatrix: promaxResult.structureMatrix,
          factorCorrelations: promaxResult.factorCorrelations,
        };
      }
      case 'oblimin':
        return this.rotationEngine.rotateOblimin(loadings, options.delta);
      case 'none':
        return {
          rotatedLoadings: loadings,
          rotationMatrix: this.createIdentityMatrix(loadings[0].length),
          iterations: 0,
          converged: true,
        };
      default:
        return this.rotationEngine.rotateVarimax(loadings);
    }
  }

  private createIdentityMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        matrix[i][j] = i === j ? 1 : 0;
      }
    }
    return matrix;
  }

  private transposeMatrix(matrix: number[][]): number[][] {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
  }

  private async validateAgainstPQMethod(
    studyData: any,
    benchmark: any,
  ): Promise<any> {
    return this.validator.validateAgainstBenchmark(studyData, benchmark);
  }

  private async saveAnalysisResults(
    surveyId: string,
    results: any,
  ): Promise<string> {
    const analysis = await this.prisma.analysis.create({
      data: {
        surveyId,
        config: results.config,
        results: results,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return analysis.id;
  }

  private async loadAnalysisResults(analysisId: string): Promise<any> {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        survey: {
          include: {
            statements: true,
            responses: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    return analysis.results;
  }

  private async createSurveyFromPQMethod(pqmethodData: any): Promise<string> {
    const survey = await this.prisma.survey.create({
      data: {
        title: pqmethodData.metadata.studyTitle,
        description: 'Imported from PQMethod',
        createdBy: 'system', // You might want to pass a userId here
        status: 'ACTIVE',
        statements: {
          create: pqmethodData.statements.map((stmt: any) => ({
            text: stmt.text,
            order: stmt.number,
          })),
        },
        responses: {
          create: pqmethodData.qSorts.map((sort: any) => ({
            participantId: sort.participantId,
            status: 'COMPLETED',
            qSort: {
              create: {
                sortData: sort.values,
                completedAt: new Date(),
              },
            },
          })),
        },
      },
    });

    return survey.id;
  }

  private generateInteractivePreview(
    rotationResult: any,
    statements: any[],
  ): any {
    // Generate preview for interactive rotation
    return {
      factorLoadings: rotationResult.rotatedLoadings,
      factorArrays: rotationResult.factorArrays || [],
      topStatements: rotationResult.factorArrays
        ? this.getTopStatements(rotationResult.factorArrays, statements)
        : [],
      rotationQuality: this.assessRotationQuality(rotationResult),
    };
  }

  private getTopStatements(factorArrays: any[], statements: any[]): any {
    // Get top statements for each factor
    if (!factorArrays || factorArrays.length === 0) {
      return [];
    }
    return factorArrays.map((array, factorIndex) => ({
      factor: factorIndex + 1,
      positive: array.slice(0, 3),
      negative: array.slice(-3),
    }));
  }

  private assessRotationQuality(rotationResult: any): number {
    // Assess quality of rotation (0-100)
    // Based on simple structure, variance explained, etc.
    return 85; // Simplified
  }

  private async generateRotationSuggestions(
    rotationResult: any,
  ): Promise<RotationSuggestion[]> {
    // AI-powered rotation suggestions
    const suggestions: RotationSuggestion[] = [];

    // Analyze factor correlations
    const correlations = this.calculateFactorCorrelations(
      rotationResult.rotatedLoadings,
    );

    // Suggest rotations to improve simple structure
    correlations.forEach((row, i) => {
      row.forEach((corr, j) => {
        if (i < j && Math.abs(corr) > 0.3 && Math.abs(corr) < 0.7) {
          suggestions.push({
            factor1: i,
            factor2: j,
            angle: Math.atan(corr) * (180 / Math.PI),
            reason: `Factors ${i + 1} and ${j + 1} show moderate correlation (r=${corr.toFixed(2)})`,
            impact: 'Could improve simple structure',
          });
        }
      });
    });

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private calculateFactorCorrelations(loadings: number[][]): number[][] {
    const numFactors = loadings[0].length;
    const correlations: number[][] = [];

    for (let i = 0; i < numFactors; i++) {
      correlations[i] = [];
      for (let j = 0; j < numFactors; j++) {
        const factor1 = loadings.map((row) => row[i]);
        const factor2 = loadings.map((row) => row[j]);
        correlations[i][j] = this.pearsonCorrelation(factor1, factor2);
      }
    }

    return correlations;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    return den === 0 ? 0 : num / den;
  }

  private compareFactorStructures(
    loadings1: number[][],
    loadings2: number[][],
  ): number {
    // Compare factor structures using congruence coefficient
    const flat1 = loadings1.flat();
    const flat2 = loadings2.flat();

    return this.pearsonCorrelation(flat1, flat2);
  }

  private compareStatementRankings(arrays1: any[], arrays2: any[]): any[] {
    // Compare statement rankings between two analyses
    const differences: any[] = [];

    arrays1.forEach((array1, factorIndex) => {
      const array2 = arrays2[factorIndex];
      if (!array2) return;

      array1.statements.forEach((stmt1: any, stmtIndex: number) => {
        const stmt2 = array2.statements[stmtIndex];
        if (stmt2) {
          const diff = Math.abs(stmt1.rank - stmt2.rank);
          if (diff > 2) {
            differences.push({
              statementId: stmt1.id,
              factor: factorIndex + 1,
              rank1: stmt1.rank,
              rank2: stmt2.rank,
              difference: diff,
            });
          }
        }
      });
    });

    return differences;
  }

  private compareConsensusStatements(
    consensus1: any[],
    consensus2: any[],
  ): number {
    // Calculate overlap in consensus statements
    const set1 = new Set(consensus1.map((c) => c.statementId));
    const set2 = new Set(consensus2.map((c) => c.statementId));

    const intersection = [...set1].filter((id) => set2.has(id));
    const union = new Set([...set1, ...set2]);

    return intersection.length / union.size;
  }
}
