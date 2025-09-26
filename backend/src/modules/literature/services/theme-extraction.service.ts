import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { OpenAIService } from '../../ai/services/openai.service';
import { StatementGeneratorService } from '../../ai/services/statement-generator.service';

export interface ExtractedTheme {
  id: string;
  label: string;
  keywords: string[];
  papers: string[];
  weight: number;
  description?: string;
  controversial?: boolean;
  opposingViews?: string[];
  citationPatterns?: {
    supporting: number;
    opposing: number;
    neutral: number;
  };
}

export interface Controversy {
  id: string;
  topic: string;
  viewpointA: {
    description: string;
    papers: string[];
    supportingAuthors: string[];
  };
  viewpointB: {
    description: string;
    papers: string[];
    supportingAuthors: string[];
  };
  strength: number;
  citationPattern: 'polarized' | 'mixed' | 'emerging';
}

export interface StatementHint {
  theme: string;
  suggestedStatement: string;
  perspective: 'supportive' | 'critical' | 'neutral' | 'balanced';
  confidence: number;
  sourceEvidence: string[];
}

@Injectable()
export class ThemeExtractionService {
  constructor(
    private prisma: PrismaService,
    private openAIService: OpenAIService,
    private statementGeneratorService: StatementGeneratorService,
  ) {}

  /**
   * Extract themes from a collection of papers using TF-IDF and clustering
   */
  async extractThemes(paperIds: string[]): Promise<ExtractedTheme[]> {
    const papers = await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
      include: { 
        themes: true,
        collection: true 
      },
    });

    // Extract text content from papers
    const documents = papers.map(p => ({
      id: p.id,
      text: `${p.title} ${p.abstract || ''}`,
      keywords: p.keywords || [],
    }));

    // Perform TF-IDF analysis
    const tfidfResults = await this.performTFIDF(documents);
    
    // Cluster related terms
    const clusters = await this.clusterTerms(tfidfResults);
    
    // Convert clusters to themes
    const themes = await this.clustersToThemes(clusters, papers);
    
    // Detect controversial themes
    const controversialThemes = await this.detectControversialThemes(themes, papers);
    
    // Merge controversial information
    return themes.map(theme => {
      const controversy = controversialThemes.find(c => c.topic === theme.label);
      if (controversy) {
        return {
          ...theme,
          controversial: true,
          opposingViews: [
            controversy.viewpointA.description,
            controversy.viewpointB.description,
          ],
        };
      }
      return theme;
    });
  }

  /**
   * Detect controversies by analyzing citation patterns and semantic opposition
   */
  async detectControversies(paperIds: string[]): Promise<Controversy[]> {
    const papers = await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
    });

    // Analyze citation patterns
    const citationAnalysis = await this.analyzeCitationPatterns(papers);
    
    // Detect semantic oppositions in abstracts
    const semanticOppositions = await this.detectSemanticOppositions(papers);
    
    // Combine analyses to identify controversies
    const controversies: Controversy[] = [];
    
    for (const opposition of semanticOppositions) {
      const citationSupport = citationAnalysis.find(
        c => c.topic === opposition.topic
      );
      
      if (citationSupport && citationSupport.polarization > 0.5) {
        controversies.push({
          id: `controversy-${Date.now()}-${Math.random()}`,
          topic: opposition.topic,
          viewpointA: opposition.viewpointA,
          viewpointB: opposition.viewpointB,
          strength: (opposition.strength + citationSupport.polarization) / 2,
          citationPattern: this.categorizeCitationPattern(citationSupport.polarization),
        });
      }
    }
    
    return controversies;
  }

  /**
   * Generate statement hints from extracted themes
   */
  async generateStatementHints(themes: ExtractedTheme[]): Promise<StatementHint[]> {
    const hints: StatementHint[] = [];
    
    for (const theme of themes) {
      // Generate balanced statement for controversial themes
      if (theme.controversial && theme.opposingViews) {
        const balancedHint = await this.generateBalancedStatement(theme);
        hints.push(balancedHint);
        
        // Also generate perspective-specific statements
        const supportiveHint = await this.generatePerspectiveStatement(theme, 'supportive');
        const criticalHint = await this.generatePerspectiveStatement(theme, 'critical');
        
        hints.push(supportiveHint, criticalHint);
      } else {
        // Generate neutral statement for non-controversial themes
        const neutralHint = await this.generatePerspectiveStatement(theme, 'neutral');
        hints.push(neutralHint);
      }
    }
    
    return hints;
  }

  /**
   * Connect themes to AI statement generator
   */
  async themeToStatements(
    themes: ExtractedTheme[], 
    studyContext: any
  ): Promise<string[]> {
    const statements: string[] = [];
    const hints = await this.generateStatementHints(themes);
    
    for (const hint of hints) {
      // Use the existing statement or enhance it
      // Since refineStatement doesn't exist, we'll use the hint directly
      // or could use enhanceStatements for improvement
      statements.push(hint.suggestedStatement);
    }
    
    // Ensure diversity and balance
    return this.balanceStatements(statements);
  }

  /**
   * Perform TF-IDF analysis on documents
   */
  private async performTFIDF(documents: any[]): Promise<any> {
    // Calculate term frequencies
    const termFrequencies = new Map<string, Map<string, number>>();
    const documentFrequencies = new Map<string, number>();
    
    for (const doc of documents) {
      const terms = this.tokenize(doc.text);
      const docTerms = new Map<string, number>();
      
      for (const term of terms) {
        docTerms.set(term, (docTerms.get(term) || 0) + 1);
        if (!docTerms.has(term)) {
          documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
        }
      }
      
      termFrequencies.set(doc.id, docTerms);
    }
    
    // Calculate TF-IDF scores
    const tfidfScores = new Map<string, Map<string, number>>();
    const totalDocs = documents.length;
    
    for (const [docId, terms] of termFrequencies) {
      const scores = new Map<string, number>();
      
      for (const [term, freq] of terms) {
        const tf = freq / terms.size;
        const idf = Math.log(totalDocs / (documentFrequencies.get(term) || 1));
        scores.set(term, tf * idf);
      }
      
      tfidfScores.set(docId, scores);
    }
    
    return {
      scores: tfidfScores,
      topTerms: this.extractTopTerms(tfidfScores),
    };
  }

  /**
   * Cluster related terms using similarity metrics
   */
  private async clusterTerms(tfidfResults: any): Promise<any[]> {
    const { topTerms } = tfidfResults;
    const clusters: any[] = [];
    const visited = new Set<string>();
    
    for (const term of topTerms) {
      if (!visited.has(term)) {
        const cluster = {
          centroid: term,
          terms: [term],
          weight: 1,
        };
        
        // Find similar terms
        for (const otherTerm of topTerms) {
          if (!visited.has(otherTerm) && this.areSimilar(term, otherTerm)) {
            cluster.terms.push(otherTerm);
            cluster.weight++;
            visited.add(otherTerm);
          }
        }
        
        visited.add(term);
        if (cluster.terms.length > 1) {
          clusters.push(cluster);
        }
      }
    }
    
    return clusters;
  }

  /**
   * Convert term clusters to themes
   */
  private async clustersToThemes(clusters: any[], papers: any[]): Promise<ExtractedTheme[]> {
    const themes: ExtractedTheme[] = [];
    
    for (const cluster of clusters) {
      const relevantPapers = papers.filter(p => {
        const text = `${p.title} ${p.abstract || ''}`.toLowerCase();
        return cluster.terms.some((term: string) => text.includes(term.toLowerCase()));
      });
      
      const theme: ExtractedTheme = {
        id: `theme-${Date.now()}-${Math.random()}`,
        label: await this.generateThemeLabel(cluster.terms),
        keywords: cluster.terms,
        papers: relevantPapers.map(p => p.id),
        weight: cluster.weight,
        description: await this.generateThemeDescription(cluster.terms, relevantPapers),
      };
      
      themes.push(theme);
    }
    
    return themes;
  }

  /**
   * Detect controversial themes by analyzing disagreements
   */
  private async detectControversialThemes(
    themes: ExtractedTheme[], 
    papers: any[]
  ): Promise<Controversy[]> {
    const controversies: Controversy[] = [];
    
    for (const theme of themes) {
      const themePapers = papers.filter(p => theme.papers.includes(p.id));
      
      // Analyze sentiment and stance in abstracts
      const stanceAnalysis = await this.analyzeStances(themePapers);
      
      if (stanceAnalysis.polarization > 0.6) {
        const controversy: Controversy = {
          id: `controversy-${theme.id}`,
          topic: theme.label,
          viewpointA: {
            description: stanceAnalysis.viewpoints[0].description,
            papers: stanceAnalysis.viewpoints[0].papers,
            supportingAuthors: stanceAnalysis.viewpoints[0].authors,
          },
          viewpointB: {
            description: stanceAnalysis.viewpoints[1].description,
            papers: stanceAnalysis.viewpoints[1].papers,
            supportingAuthors: stanceAnalysis.viewpoints[1].authors,
          },
          strength: stanceAnalysis.polarization,
          citationPattern: 'polarized',
        };
        
        controversies.push(controversy);
      }
    }
    
    return controversies;
  }

  /**
   * Analyze citation patterns to detect disagreements
   */
  private async analyzeCitationPatterns(papers: any[]): Promise<any[]> {
    // Simplified citation pattern analysis
    // In a real implementation, this would analyze actual citation networks
    const patterns: any[] = [];
    
    // Group papers by topic keywords
    const topicGroups = new Map<string, any[]>();
    
    for (const paper of papers) {
      const keywords = paper.keywords || [];
      for (const keyword of keywords) {
        if (!topicGroups.has(keyword)) {
          topicGroups.set(keyword, []);
        }
        topicGroups.get(keyword)!.push(paper);
      }
    }
    
    // Analyze each topic group
    for (const [topic, topicPapers] of topicGroups) {
      if (topicPapers.length > 3) {
        const polarization = Math.random(); // Placeholder - would analyze actual citations
        patterns.push({
          topic,
          polarization,
          paperCount: topicPapers.length,
        });
      }
    }
    
    return patterns;
  }

  /**
   * Detect semantic oppositions in paper abstracts
   */
  private async detectSemanticOppositions(papers: any[]): Promise<any[]> {
    const oppositions: any[] = [];
    
    // Look for opposing language patterns
    const opposingPatterns = [
      { positive: 'support', negative: 'oppose' },
      { positive: 'confirm', negative: 'refute' },
      { positive: 'validate', negative: 'challenge' },
      { positive: 'agree', negative: 'disagree' },
      { positive: 'consistent', negative: 'inconsistent' },
    ];
    
    for (const pattern of opposingPatterns) {
      const supportingPapers = papers.filter(p => 
        p.abstract?.toLowerCase().includes(pattern.positive)
      );
      const opposingPapers = papers.filter(p => 
        p.abstract?.toLowerCase().includes(pattern.negative)
      );
      
      if (supportingPapers.length > 0 && opposingPapers.length > 0) {
        oppositions.push({
          topic: `${pattern.positive} vs ${pattern.negative}`,
          strength: (supportingPapers.length + opposingPapers.length) / papers.length,
          viewpointA: {
            description: `Papers supporting/confirming`,
            papers: supportingPapers.map(p => p.id),
          },
          viewpointB: {
            description: `Papers opposing/challenging`,
            papers: opposingPapers.map(p => p.id),
          },
        });
      }
    }
    
    return oppositions;
  }

  /**
   * Generate a balanced statement for controversial themes
   */
  private async generateBalancedStatement(theme: ExtractedTheme): Promise<StatementHint> {
    const prompt = `
      Generate a balanced Q-methodology statement about "${theme.label}" that acknowledges both perspectives:
      Perspective A: ${theme.opposingViews?.[0]}
      Perspective B: ${theme.opposingViews?.[1]}
      The statement should be neutral and allow participants to project their own views.
    `;
    
    const response = await this.openAIService.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.7,
      maxTokens: 150,
    });
    const statement = response.content;
    
    return {
      theme: theme.label,
      suggestedStatement: statement,
      perspective: 'balanced',
      confidence: 0.85,
      sourceEvidence: theme.papers,
    };
  }

  /**
   * Generate a perspective-specific statement
   */
  private async generatePerspectiveStatement(
    theme: ExtractedTheme, 
    perspective: 'supportive' | 'critical' | 'neutral'
  ): Promise<StatementHint> {
    const prompt = `
      Generate a ${perspective} Q-methodology statement about "${theme.label}".
      Keywords: ${theme.keywords.join(', ')}
      Description: ${theme.description}
      The statement should be clear and suitable for Q-sorting.
    `;
    
    const response = await this.openAIService.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.7,
      maxTokens: 150,
    });
    const statement = response.content;
    
    return {
      theme: theme.label,
      suggestedStatement: statement,
      perspective,
      confidence: 0.75,
      sourceEvidence: theme.papers,
    };
  }

  /**
   * Balance statements to ensure diversity
   */
  private balanceStatements(statements: string[]): string[] {
    // Ensure we have a good mix of perspectives
    // Remove duplicates and overly similar statements
    const unique = [...new Set(statements)];
    
    // Limit to reasonable number for Q-sort
    if (unique.length > 60) {
      // Select most diverse subset
      return this.selectDiverseSubset(unique, 60);
    }
    
    return unique;
  }

  /**
   * Helper: Tokenize text
   */
  private tokenize(text: string): string[] {
    // Remove punctuation and split into words
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Filter out short words
  }

  /**
   * Helper: Extract top terms from TF-IDF scores
   */
  private extractTopTerms(scores: Map<string, Map<string, number>>): string[] {
    const termScores = new Map<string, number>();
    
    for (const docScores of scores.values()) {
      for (const [term, score] of docScores) {
        termScores.set(term, (termScores.get(term) || 0) + score);
      }
    }
    
    return Array.from(termScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([term]) => term);
  }

  /**
   * Helper: Check if two terms are similar
   */
  private areSimilar(term1: string, term2: string): boolean {
    // Simple similarity check - could use more sophisticated methods
    const distance = this.levenshteinDistance(term1, term2);
    return distance < 3 || term1.includes(term2) || term2.includes(term1);
  }

  /**
   * Helper: Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Helper: Generate theme label from terms
   */
  private async generateThemeLabel(terms: string[]): Promise<string> {
    // Use the most frequent/central term as the label
    return terms[0].charAt(0).toUpperCase() + terms[0].slice(1);
  }

  /**
   * Helper: Generate theme description
   */
  private async generateThemeDescription(terms: string[], papers: any[]): Promise<string> {
    return `Theme encompassing ${terms.slice(0, 3).join(', ')} across ${papers.length} papers`;
  }

  /**
   * Helper: Analyze stances in papers
   */
  private async analyzeStances(papers: any[]): Promise<any> {
    // Simplified stance analysis
    // In reality, would use NLP to detect actual stances
    return {
      polarization: Math.random(),
      viewpoints: [
        {
          description: 'Supporting viewpoint',
          papers: papers.slice(0, Math.floor(papers.length / 2)).map(p => p.id),
          authors: [],
        },
        {
          description: 'Opposing viewpoint',
          papers: papers.slice(Math.floor(papers.length / 2)).map(p => p.id),
          authors: [],
        },
      ],
    };
  }

  /**
   * Helper: Categorize citation pattern
   */
  private categorizeCitationPattern(polarization: number): 'polarized' | 'mixed' | 'emerging' {
    if (polarization > 0.7) return 'polarized';
    if (polarization > 0.4) return 'mixed';
    return 'emerging';
  }

  /**
   * Helper: Select diverse subset of statements
   */
  private selectDiverseSubset(statements: string[], targetSize: number): string[] {
    // Simple diversity selection - could use more sophisticated methods
    const selected: string[] = [];
    const remaining = [...statements];
    
    while (selected.length < targetSize && remaining.length > 0) {
      // Select statement most different from those already selected
      let mostDifferent = remaining[0];
      let maxDifference = 0;
      
      for (const statement of remaining) {
        let totalDifference = 0;
        for (const selectedStatement of selected) {
          totalDifference += this.statementDifference(statement, selectedStatement);
        }
        
        if (totalDifference > maxDifference) {
          maxDifference = totalDifference;
          mostDifferent = statement;
        }
      }
      
      selected.push(mostDifferent);
      remaining.splice(remaining.indexOf(mostDifferent), 1);
    }
    
    return selected;
  }

  /**
   * Helper: Calculate difference between statements
   */
  private statementDifference(s1: string, s2: string): number {
    // Simple difference metric based on shared words
    const words1 = new Set(s1.toLowerCase().split(/\s+/));
    const words2 = new Set(s2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return 1 - (intersection.size / union.size);
  }
}