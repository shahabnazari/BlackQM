import { Injectable } from '@nestjs/common';
import { PQMethodData, PQMethodAnalysisOutput, QSort } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PQMethodIOService {
  /**
   * Import PQMethod .DAT file format
   * Supports both statement and Q-sort data
   */
  async importPQMethodFile(filePath: string): Promise<PQMethodData> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    // Parse header information
    const metadata = this.parseHeader(lines);

    // Parse statements
    const statements = this.parseStatements(lines, metadata.numberOfStatements);

    // Parse Q-sorts
    const sorts = this.parseQSorts(lines, metadata);

    return {
      version: '2.35', // Default PQMethod version
      format: 'DAT',
      data: {
        statements,
        sorts,
        analysis: null,
      },
      metadata,
    };
  }

  /**
   * Export to PQMethod .DAT format
   */
  async exportToPQMethod(
    data: PQMethodData,
    outputPath: string,
  ): Promise<void> {
    const lines: string[] = [];

    // Write header
    lines.push(`PQMethod Data File v${data.version}`);
    lines.push(`Study: ${data.metadata.studyTitle}`);
    lines.push(`Statements: ${data.metadata.numberOfStatements}`);
    lines.push(`Sorts: ${data.metadata.numberOfSorts}`);
    lines.push(`Distribution: ${data.metadata.distribution.join(' ')}`);
    lines.push('');

    // Write statements
    lines.push('STATEMENTS');
    data.data.statements.forEach((stmt) => {
      lines.push(`${String(stmt.number).padStart(3)} ${stmt.text}`);
    });
    lines.push('');

    // Write Q-sorts
    lines.push('Q-SORTS');
    data.data.sorts.forEach((sort, index) => {
      lines.push(`Sort ${index + 1}: ${sort.participantId}`);
      lines.push(sort.values.join(' '));
    });

    // Write analysis results if available
    if (data.data.analysis) {
      lines.push('');
      lines.push('ANALYSIS RESULTS');
      lines.push(JSON.stringify(data.data.analysis, null, 2));
    }

    await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
  }

  /**
   * Import PQMethod analysis output (.LIS file)
   */
  async importPQMethodAnalysis(
    filePath: string,
  ): Promise<PQMethodAnalysisOutput> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    // Parse correlation matrix
    const correlationMatrix = this.parseCorrelationMatrix(lines);

    // Parse factor loadings
    const unrotatedFactors = this.parseFactorLoadings(lines, 'UNROTATED');
    const rotatedFactors = this.parseFactorLoadings(lines, 'ROTATED');

    // Parse factor arrays
    const factorArrays = this.parseFactorArrays(lines);

    // Parse distinguishing and consensus statements
    const distinguishingStatements = this.parseDistinguishingStatements(lines);
    const consensusStatements = this.parseConsensusStatements(lines);

    // Parse factor scores
    const factorScores = this.parseFactorScores(lines);

    return {
      correlationMatrix,
      unrotatedFactors,
      rotatedFactors,
      factorArrays,
      distinguishingStatements,
      consensusStatements,
      factorScores,
    };
  }

  /**
   * Export analysis results in PQMethod format
   */
  async exportAnalysisToPQMethod(
    analysis: any,
    outputPath: string,
  ): Promise<void> {
    const lines: string[] = [];

    // Header
    lines.push('PQMethod2.35 Analysis Output');
    lines.push('='.repeat(60));
    lines.push(`Analysis Date: ${new Date().toISOString()}`);
    lines.push('');

    // Correlation Matrix
    lines.push('CORRELATION MATRIX OF Q-SORTS');
    lines.push('-'.repeat(40));
    this.formatCorrelationMatrix(analysis.correlationMatrix, lines);
    lines.push('');

    // Factor Loadings
    lines.push('UNROTATED FACTOR MATRIX');
    lines.push('-'.repeat(40));
    this.formatFactorMatrix(analysis.extraction.factors, lines);
    lines.push('');

    lines.push('ROTATED FACTOR MATRIX');
    lines.push('-'.repeat(40));
    this.formatFactorMatrix(analysis.rotation.rotatedLoadings, lines);
    lines.push('');

    // Factor Arrays
    lines.push('FACTOR ARRAYS');
    lines.push('-'.repeat(40));
    analysis.factorArrays.forEach((array: any, index: number) => {
      lines.push(`Factor ${index + 1}:`);
      array.statements.forEach((stmt: any) => {
        lines.push(
          `  ${String(stmt.id).padStart(3)} ${String(stmt.zScore.toFixed(3)).padStart(7)} ${stmt.text}`,
        );
      });
      lines.push('');
    });

    // Distinguishing Statements
    lines.push('DISTINGUISHING STATEMENTS');
    lines.push('-'.repeat(40));
    analysis.distinguishingStatements.forEach((stmt: any) => {
      lines.push(`Statement ${stmt.statementId}: ${stmt.text}`);
      lines.push(
        `  Factor 1: ${stmt.zScore1.toFixed(3)} Factor 2: ${stmt.zScore2.toFixed(3)}`,
      );
      lines.push(
        `  Difference: ${stmt.difference.toFixed(3)} p < ${stmt.pValue.toFixed(3)}`,
      );
      lines.push('');
    });

    // Consensus Statements
    lines.push('CONSENSUS STATEMENTS');
    lines.push('-'.repeat(40));
    analysis.consensusStatements.forEach((stmt: any) => {
      lines.push(`Statement ${stmt.statementId}: ${stmt.text}`);
      lines.push(`  Mean Z-Score: ${stmt.meanZScore.toFixed(3)}`);
      lines.push(`  Range: ${stmt.zScoreRange.toFixed(3)}`);
      lines.push('');
    });

    await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
  }

  /**
   * Convert between PQMethod and our internal format
   */
  convertToInternalFormat(pqmethodData: PQMethodData): {
    statements: any[];
    qSorts: number[][];
  } {
    return {
      statements: pqmethodData.data.statements.map((stmt) => ({
        id: stmt.number,
        text: stmt.text,
        category: stmt.category,
      })),
      qSorts: pqmethodData.data.sorts.map((sort) => sort.values),
    };
  }

  convertFromInternalFormat(
    statements: any[],
    qSorts: number[][],
    metadata: any,
  ): PQMethodData {
    return {
      version: '2.35',
      format: 'DAT',
      data: {
        statements: statements.map((stmt, index) => ({
          number: index + 1,
          text: stmt.text || stmt,
          category: stmt.category,
        })),
        sorts: qSorts.map((values, index) => ({
          participantId: `P${index + 1}`,
          values,
        })),
        analysis: null,
      },
      metadata: {
        studyTitle: metadata.title || 'Q-Study',
        numberOfStatements: statements.length,
        numberOfSorts: qSorts.length,
        distribution: this.calculateDistribution(qSorts[0]),
        ...metadata,
      },
    };
  }

  // Helper methods
  private parseHeader(lines: string[]): any {
    const metadata: any = {};

    lines.forEach((line) => {
      if (line.includes('Statements:')) {
        metadata.numberOfStatements = parseInt(line.split(':')[1].trim());
      }
      if (line.includes('Sorts:')) {
        metadata.numberOfSorts = parseInt(line.split(':')[1].trim());
      }
      if (line.includes('Distribution:')) {
        metadata.distribution = line
          .split(':')[1]
          .trim()
          .split(' ')
          .map(Number);
      }
      if (line.includes('Study:')) {
        metadata.studyTitle = line.split(':')[1].trim();
      }
    });

    return metadata;
  }

  private parseStatements(lines: string[], count: number): any[] {
    const statements: any[] = [];
    let inStatements = false;

    lines.forEach((line) => {
      if (line === 'STATEMENTS') {
        inStatements = true;
        return;
      }
      if (inStatements && statements.length < count) {
        const match = line.match(/^\s*(\d+)\s+(.+)$/);
        if (match) {
          statements.push({
            number: parseInt(match[1]),
            text: match[2].trim(),
          });
        }
      }
    });

    return statements;
  }

  private parseQSorts(lines: string[], metadata: any): QSort[] {
    const sorts: QSort[] = [];
    let inSorts = false;
    let currentSort: any = null;

    lines.forEach((line) => {
      if (line === 'Q-SORTS') {
        inSorts = true;
        return;
      }
      if (inSorts) {
        if (line.startsWith('Sort')) {
          if (currentSort) {
            sorts.push(currentSort);
          }
          const match = line.match(/Sort \d+: (.+)$/);
          currentSort = {
            participantId: match ? match[1] : `P${sorts.length + 1}`,
            values: [],
          };
        } else if (currentSort && line.trim()) {
          currentSort.values = line.trim().split(/\s+/).map(Number);
        }
      }
    });

    if (currentSort) {
      sorts.push(currentSort);
    }

    return sorts;
  }

  private parseCorrelationMatrix(lines: string[]): number[][] {
    const matrix: number[][] = [];
    let inMatrix = false;

    lines.forEach((line) => {
      if (line.includes('CORRELATION MATRIX')) {
        inMatrix = true;
        return;
      }
      if (inMatrix && line.trim() && !line.startsWith('-')) {
        const values = line
          .trim()
          .split(/\s+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (values.length > 0) {
          matrix.push(values);
        }
      }
      if (inMatrix && line.trim() === '') {
        inMatrix = false;
      }
    });

    return matrix;
  }

  private parseFactorLoadings(lines: string[], type: string): number[][] {
    const loadings: number[][] = [];
    let inSection = false;

    lines.forEach((line) => {
      if (line.includes(`${type} FACTOR`)) {
        inSection = true;
        return;
      }
      if (inSection && line.trim() && !line.startsWith('-')) {
        const values = line
          .trim()
          .split(/\s+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (values.length > 0) {
          loadings.push(values);
        }
      }
      if (inSection && line.trim() === '') {
        inSection = false;
      }
    });

    return loadings;
  }

  private parseFactorArrays(lines: string[]): any[] {
    const arrays: any[] = [];
    let inArrays = false;
    let currentFactor: any = null;

    lines.forEach((line) => {
      if (line.includes('FACTOR ARRAYS')) {
        inArrays = true;
        return;
      }
      if (inArrays) {
        if (line.match(/^Factor \d+:/)) {
          if (currentFactor) {
            arrays.push(currentFactor);
          }
          currentFactor = {
            factor: arrays.length + 1,
            statements: [],
          };
        } else if (currentFactor && line.trim()) {
          const match = line.match(/^\s*(\d+)\s+([\d.-]+)\s+(.+)$/);
          if (match) {
            currentFactor.statements.push({
              id: parseInt(match[1]),
              zScore: parseFloat(match[2]),
              text: match[3].trim(),
            });
          }
        }
      }
    });

    if (currentFactor) {
      arrays.push(currentFactor);
    }

    return arrays;
  }

  private parseDistinguishingStatements(lines: string[]): any[] {
    const statements: any[] = [];
    let inSection = false;

    lines.forEach((line, index) => {
      if (line.includes('DISTINGUISHING STATEMENTS')) {
        inSection = true;
        return;
      }
      if (inSection && line.startsWith('Statement')) {
        const match = line.match(/Statement (\d+): (.+)$/);
        if (match && lines[index + 1]) {
          const scores = lines[index + 1].match(/([\d.-]+)/g);
          if (scores && scores.length >= 2) {
            statements.push({
              id: parseInt(match[1]),
              text: match[2],
              factor1Score: parseFloat(scores[0]),
              factor2Score: parseFloat(scores[1]),
            });
          }
        }
      }
      if (inSection && line.trim() === '') {
        inSection = false;
      }
    });

    return statements;
  }

  private parseConsensusStatements(lines: string[]): any[] {
    const statements: any[] = [];
    let inSection = false;

    lines.forEach((line, index) => {
      if (line.includes('CONSENSUS STATEMENTS')) {
        inSection = true;
        return;
      }
      if (inSection && line.startsWith('Statement')) {
        const match = line.match(/Statement (\d+): (.+)$/);
        if (match) {
          const nextLine = lines[index + 1];
          if (nextLine && nextLine.includes('Mean Z-Score:')) {
            const meanMatch = nextLine.match(/Mean Z-Score: ([\d.-]+)/);
            if (meanMatch) {
              statements.push({
                id: parseInt(match[1]),
                text: match[2],
                meanZScore: parseFloat(meanMatch[1]),
              });
            }
          }
        }
      }
      if (inSection && line.trim() === '') {
        inSection = false;
      }
    });

    return statements;
  }

  private parseFactorScores(lines: string[]): any[] {
    // Similar parsing logic for factor scores
    return [];
  }

  private formatCorrelationMatrix(matrix: number[][], lines: string[]): void {
    matrix.forEach((row, i) => {
      const values = row.map((val) => val.toFixed(3).padStart(7));
      lines.push(`${String(i + 1).padStart(3)} ${values.join(' ')}`);
    });
  }

  private formatFactorMatrix(matrix: number[][], lines: string[]): void {
    matrix.forEach((row, i) => {
      const values = row.map((val) => val.toFixed(3).padStart(7));
      lines.push(`${String(i + 1).padStart(3)} ${values.join(' ')}`);
    });
  }

  private calculateDistribution(qSort: number[]): number[] {
    const distribution: number[] = [];
    const uniqueValues = [...new Set(qSort)].sort((a, b) => a - b);

    uniqueValues.forEach((value) => {
      const count = qSort.filter((v) => v === value).length;
      distribution.push(count);
    });

    return distribution;
  }
}
