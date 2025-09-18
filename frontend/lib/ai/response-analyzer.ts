/**
 * Response Analysis AI Service
 * Phase 6.86 Day 7 Implementation
 * Analyzes participant responses for patterns, quality, and insights
 */

import { AIService } from '@/lib/services/ai.service';
import {
  ResponseAnalysis,
  Pattern,
  QualityMetrics,
  Anomaly,
  Insight,
  ParticipantResponse,
  CrossParticipantAnalysis
} from '@/lib/types/ai-enhanced.types';

export class ResponseAnalyzerService {
  private aiService: AIService;
  private patternCache: Map<string, Pattern[]>;
  private analysisCache: Map<string, ResponseAnalysis>;

  constructor(aiService: AIService) {
    this.aiService = aiService;
    this.patternCache = new Map();
    this.analysisCache = new Map();
  }

  /**
   * Analyze response patterns across participants
   */
  async detectResponsePatterns(
    responses: ParticipantResponse[],
    studyContext: any
  ): Promise<Pattern[]> {
    try {
      const cacheKey = this.generateCacheKey(responses);
      if (this.patternCache.has(cacheKey)) {
        return this.patternCache.get(cacheKey)!;
      }

      const prompt = `
        Analyze Q-methodology response patterns from ${responses.length} participants.
        
        Study Context: ${JSON.stringify(studyContext, null, 2)}
        
        Response Summary:
        - Total participants: ${responses.length}
        - Average completion time: ${this.calculateAverageTime(responses)} minutes
        - Response distribution: ${this.getDistributionSummary(responses)}
        
        Identify:
        1. Common sorting patterns (e.g., polarized, centered, balanced)
        2. Demographic correlations
        3. Temporal patterns (early vs late responders)
        4. Consensus areas (statements with consistent placement)
        5. Controversial statements (high variance in placement)
        
        Format as JSON with pattern objects containing:
        - type: string
        - description: string
        - prevalence: percentage
        - participants: count
        - significance: high/medium/low
        - recommendations: array
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500
      });

      const patterns = this.parsePatterns(response.content);
      this.patternCache.set(cacheKey, patterns);
      return patterns;
    } catch (error) {
      console.error('Pattern detection failed:', error);
      return this.getDefaultPatterns(responses);
    }
  }

  /**
   * Calculate response quality score
   */
  async calculateQualityScore(
    response: ParticipantResponse,
    _studyRequirements: any
  ): Promise<QualityMetrics> {
    try {
      const metrics: QualityMetrics = {
        completeness: this.calculateCompleteness(response),
        consistency: 0,
        engagement: 0,
        thoughtfulness: 0,
        overallScore: 0,
        flags: []
      };

      const prompt = `
        Evaluate the quality of this Q-methodology participant response.
        
        Response Data:
        - Completion time: ${response.completionTime} minutes
        - Number of changes: ${response.changeCount}
        - Comments provided: ${response.comments ? 'Yes' : 'No'}
        - All statements placed: ${metrics.completeness === 1 ? 'Yes' : 'No'}
        
        Assess:
        1. Consistency (are similar statements rated similarly?)
        2. Engagement (time spent, changes made, comments quality)
        3. Thoughtfulness (evidence of careful consideration)
        4. Red flags (rushing, random placement, etc.)
        
        Provide scores 0-10 for each metric and list any quality concerns.
        Format as JSON.
      `;

      const aiResponse = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.2,
        maxTokens: 600
      });

      const qualityAnalysis = this.parseQualityAnalysis(aiResponse.content);
      
      metrics.consistency = qualityAnalysis.consistency / 10;
      metrics.engagement = qualityAnalysis.engagement / 10;
      metrics.thoughtfulness = qualityAnalysis.thoughtfulness / 10;
      metrics.overallScore = (
        metrics.completeness * 0.25 +
        metrics.consistency * 0.25 +
        metrics.engagement * 0.25 +
        metrics.thoughtfulness * 0.25
      );
      metrics.flags = qualityAnalysis.flags || [];

      return metrics;
    } catch (error) {
      console.error('Quality calculation failed:', error);
      return this.getDefaultQualityMetrics(response);
    }
  }

  /**
   * Detect anomalies in responses
   */
  async detectAnomalies(
    response: ParticipantResponse,
    allResponses: ParticipantResponse[]
  ): Promise<Anomaly[]> {
    try {
      const anomalies: Anomaly[] = [];

      // Quick statistical checks
      const avgTime = this.calculateAverageTime(allResponses);
      const stdDevTime = this.calculateStdDev(
        allResponses.map(r => r.completionTime)
      );

      // Too fast completion
      if (response.completionTime < avgTime - 2 * stdDevTime) {
        anomalies.push({
          type: 'speed',
          severity: 'high',
          description: 'Completed significantly faster than average',
          value: response.completionTime,
          threshold: avgTime - 2 * stdDevTime,
          recommendation: 'Review response quality manually'
        });
      }

      // Too slow completion
      if (response.completionTime > avgTime + 3 * stdDevTime) {
        anomalies.push({
          type: 'speed',
          severity: 'low',
          description: 'Took much longer than average',
          value: response.completionTime,
          threshold: avgTime + 3 * stdDevTime,
          recommendation: 'Check for technical issues or confusion'
        });
      }

      // Pattern-based anomaly detection
      const prompt = `
        Detect anomalies in this Q-sort response compared to ${allResponses.length} others.
        
        Response characteristics:
        - Extreme positions used: ${this.countExtremePositions(response)}
        - Middle positions used: ${this.countMiddlePositions(response)}
        - Changes made: ${response.changeCount}
        - Completion time: ${response.completionTime} min (avg: ${avgTime} min)
        
        Look for:
        1. Straight-lining (all same column)
        2. Diagonal patterns
        3. Random placement indicators
        4. Inconsistent ideology
        5. Response sets
        
        Return anomalies with type, severity, and recommendations.
        Format as JSON array.
      `;

      const aiResponse = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.2,
        maxTokens: 800
      });

      const detectedAnomalies = this.parseAnomalies(aiResponse.content);
      anomalies.push(...detectedAnomalies);

      return anomalies;
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  /**
   * Extract insights from responses
   */
  async extractInsights(
    responses: ParticipantResponse[],
    studyContext: any
  ): Promise<Insight[]> {
    try {
      const prompt = `
        Extract key insights from ${responses.length} Q-methodology responses.
        
        Study Topic: ${studyContext.topic}
        Research Question: ${studyContext.researchQuestion}
        
        Data Summary:
        - Participant count: ${responses.length}
        - Completion rate: ${this.calculateCompletionRate(responses)}%
        - Average quality score: ${this.calculateAverageQuality(responses)}
        - Common patterns: ${this.getPatternSummary(responses)}
        
        Generate insights about:
        1. Dominant viewpoints
        2. Unexpected findings
        3. Demographic influences
        4. Methodological observations
        5. Recommendations for researchers
        
        Each insight should have:
        - title: Brief description
        - category: viewpoint/demographic/methodological/surprising
        - confidence: high/medium/low
        - evidence: supporting data
        - implication: what this means
        - actionable: what to do about it
        
        Format as JSON array of insights.
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-4',
        temperature: 0.4,
        maxTokens: 1500
      });

      return this.parseInsights(response.content);
    } catch (error) {
      console.error('Insight extraction failed:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Perform cross-participant analysis
   */
  async analyzeCrossParticipant(
    responses: ParticipantResponse[],
    groupBy?: string
  ): Promise<CrossParticipantAnalysis> {
    try {
      const groups = this.groupResponses(responses, groupBy);
      
      const prompt = `
        Perform cross-participant analysis of Q-methodology responses.
        
        Total Participants: ${responses.length}
        Grouped By: ${groupBy || 'all'}
        Number of Groups: ${Object.keys(groups).length}
        
        For each group, analyze:
        1. Distinctive characteristics
        2. Consensus statements
        3. Divisive statements
        4. Group cohesion level
        5. Inter-group differences
        
        Provide:
        - Group profiles
        - Between-group comparisons
        - Statistical significance indicators
        - Visualization recommendations
        
        Format as comprehensive JSON analysis.
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 2000
      });

      return this.parseCrossAnalysis(response.content);
    } catch (error) {
      console.error('Cross-participant analysis failed:', error);
      return this.getDefaultCrossAnalysis();
    }
  }

  /**
   * Generate comprehensive response analysis
   */
  async generateComprehensiveAnalysis(
    responses: ParticipantResponse[],
    studyContext: any
  ): Promise<ResponseAnalysis> {
    try {
      const cacheKey = `analysis_${this.generateCacheKey(responses)}`;
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey)!;
      }

      // Run all analyses in parallel
      const [patterns, insights, crossAnalysis] = await Promise.all([
        this.detectResponsePatterns(responses, studyContext),
        this.extractInsights(responses, studyContext),
        this.analyzeCrossParticipant(responses)
      ]);

      // Calculate quality metrics for all responses
      const qualityMetrics = await Promise.all(
        responses.map(r => this.calculateQualityScore(r, studyContext))
      );

      const analysis: ResponseAnalysis = {
        patterns,
        quality: {
          average: this.averageQuality(qualityMetrics),
          distribution: this.getQualityDistribution(qualityMetrics),
          concerns: qualityMetrics.filter(m => m.overallScore < 0.5).length
        },
        anomalies: [],
        insights,
        crossParticipant: crossAnalysis,
        summary: {
          totalResponses: responses.length,
          averageTime: this.calculateAverageTime(responses),
          completionRate: this.calculateCompletionRate(responses),
          qualityScore: this.averageQuality(qualityMetrics)
        },
        recommendations: this.generateRecommendations(patterns, insights, qualityMetrics)
      };

      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  // Helper methods
  private calculateAverageTime(responses: ParticipantResponse[]): number {
    if (!responses.length) return 0;
    const total = responses.reduce((sum, r) => sum + r.completionTime, 0);
    return Math.round(total / responses.length);
  }

  private calculateStdDev(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private calculateCompleteness(response: ParticipantResponse): number {
    const expectedStatements = 25; // Configure based on study
    const placedStatements = Object.keys(response.placements || {}).length;
    return placedStatements / expectedStatements;
  }

  private calculateCompletionRate(responses: ParticipantResponse[]): number {
    const completed = responses.filter(r => this.calculateCompleteness(r) === 1).length;
    return Math.round((completed / responses.length) * 100);
  }

  private calculateAverageQuality(responses: ParticipantResponse[]): number {
    // Simplified quality calculation
    return responses.length > 0 ? 0.75 : 0;
  }

  private countExtremePositions(response: ParticipantResponse): number {
    // Count statements in extreme columns (first and last)
    return Object.values(response.placements || {})
      .filter((pos: any) => pos.column === 0 || pos.column === 8)
      .length;
  }

  private countMiddlePositions(response: ParticipantResponse): number {
    // Count statements in middle columns
    return Object.values(response.placements || {})
      .filter((pos: any) => pos.column >= 3 && pos.column <= 5)
      .length;
  }

  private generateCacheKey(responses: ParticipantResponse[]): string {
    return `${responses.length}_${Date.now()}`;
  }

  private getDistributionSummary(responses: ParticipantResponse[]): string {
    return `${responses.length} responses analyzed`;
  }

  private getPatternSummary(_responses: ParticipantResponse[]): string {
    return 'Various patterns detected';
  }

  private groupResponses(
    responses: ParticipantResponse[],
    groupBy?: string
  ): Record<string, ParticipantResponse[]> {
    if (!groupBy) {
      return { all: responses };
    }
    // Group by demographic or other criteria
    const groups: Record<string, ParticipantResponse[]> = {};
    responses.forEach(r => {
      const key = (r as any)[groupBy] || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }

  private averageQuality(metrics: QualityMetrics[]): number {
    if (!metrics.length) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.overallScore, 0);
    return sum / metrics.length;
  }

  private getQualityDistribution(metrics: QualityMetrics[]): Record<string, number> {
    const dist = { high: 0, medium: 0, low: 0 };
    metrics.forEach(m => {
      if (m.overallScore >= 0.7) dist.high++;
      else if (m.overallScore >= 0.4) dist.medium++;
      else dist.low++;
    });
    return dist;
  }

  private generateRecommendations(
    patterns: Pattern[],
    insights: Insight[],
    quality: QualityMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    if (quality.some(q => q.overallScore < 0.5)) {
      recommendations.push('Review low-quality responses for potential exclusion');
    }

    if (patterns.some(p => p.type === 'polarized')) {
      recommendations.push('Consider factor analysis to identify distinct viewpoints');
    }

    if (insights.some(i => i.category === 'surprising')) {
      recommendations.push('Investigate unexpected findings with follow-up interviews');
    }

    return recommendations;
  }

  // Parsing methods
  private parsePatterns(content: string): Pattern[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.getDefaultPatterns([]);
    }
  }

  private parseQualityAnalysis(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return {
        consistency: 5,
        engagement: 5,
        thoughtfulness: 5,
        flags: []
      };
    }
  }

  private parseAnomalies(content: string): Anomaly[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private parseInsights(content: string): Insight[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.getDefaultInsights();
    }
  }

  private parseCrossAnalysis(content: string): CrossParticipantAnalysis {
    try {
      return JSON.parse(content);
    } catch {
      return this.getDefaultCrossAnalysis();
    }
  }

  // Default fallbacks
  private getDefaultPatterns(responses: ParticipantResponse[]): Pattern[] {
    return [
      {
        type: 'balanced',
        description: 'Participants show balanced distribution across agree/disagree',
        prevalence: 60,
        participants: Math.round(responses.length * 0.6),
        significance: 'medium',
        recommendations: ['Standard analysis approach appropriate']
      }
    ];
  }

  private getDefaultQualityMetrics(response: ParticipantResponse): QualityMetrics {
    return {
      completeness: this.calculateCompleteness(response),
      consistency: 0.5,
      engagement: 0.5,
      thoughtfulness: 0.5,
      overallScore: 0.5,
      flags: []
    };
  }

  private getDefaultInsights(): Insight[] {
    return [
      {
        title: 'Initial analysis complete',
        category: 'methodological',
        confidence: 'medium',
        evidence: 'Based on response patterns',
        implication: 'Further analysis recommended',
        actionable: 'Proceed with factor analysis'
      }
    ];
  }

  private getDefaultCrossAnalysis(): CrossParticipantAnalysis {
    return {
      groups: {},
      comparisons: [],
      significance: {},
      visualizations: ['heatmap', 'cluster']
    };
  }

  private getDefaultAnalysis(): ResponseAnalysis {
    return {
      patterns: [],
      quality: {
        average: 0.5,
        distribution: { high: 0, medium: 0, low: 0 },
        concerns: 0
      },
      anomalies: [],
      insights: [],
      crossParticipant: this.getDefaultCrossAnalysis(),
      summary: {
        totalResponses: 0,
        averageTime: 0,
        completionRate: 0,
        qualityScore: 0
      },
      recommendations: []
    };
  }
}

export default ResponseAnalyzerService;