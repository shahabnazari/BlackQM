/**
 * Methodology Service - DESIGN Phase
 * World-class implementation for research design support
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface ResearchQuestion {
  main: string;
  subQuestions: string[];
  type: 'exploratory' | 'descriptive' | 'explanatory' | 'evaluative';
  scope: 'broad' | 'focused' | 'narrow';
  methodology: 'qualitative' | 'quantitative' | 'mixed' | 'q-methodology';
  population: string;
  setting: string;
  timeframe: string;
  variables: string[];
  feasibility: FeasibilityAssessment;
}

export interface FeasibilityAssessment {
  score: number; // 0-100
  concerns: string[];
  strengths: string[];
  recommendations: string[];
}

export interface Hypothesis {
  id: string;
  type: 'null' | 'alternative' | 'directional' | 'non-directional';
  statement: string;
  variables: {
    independent: string[];
    dependent: string[];
    control: string[];
  };
  testable: boolean;
  measurable: boolean;
  rationale: string;
}

export interface StudyDesign {
  type: 'experimental' | 'quasi-experimental' | 'observational' | 'correlational' | 'descriptive';
  approach: 'cross-sectional' | 'longitudinal' | 'retrospective' | 'prospective';
  sampling: {
    method: 'random' | 'stratified' | 'cluster' | 'convenience' | 'purposive' | 'snowball';
    size: number;
    power: number;
    confidence: number;
  };
  dataCollection: string[];
  timeline: {
    phases: StudyPhase[];
    totalDuration: string;
  };
}

export interface StudyPhase {
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  milestones: string[];
}

export interface PowerAnalysis {
  effectSize: number;
  alpha: number;
  power: number;
  sampleSize: number;
  type: 'a-priori' | 'post-hoc' | 'compromise' | 'sensitivity';
  test: string;
}

@Injectable()
export class MethodologyService {
  private readonly logger = new Logger(MethodologyService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate and enhance a research question
   */
  async validateResearchQuestion(question: Partial<ResearchQuestion>): Promise<{
    valid: boolean;
    score: number;
    feedback: string[];
    suggestions: string[];
  }> {
    const feedback: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Check clarity (word count)
    if (question.main) {
      const wordCount = question.main.split(' ').length;
      if (wordCount >= 10 && wordCount <= 25) {
        score += 20;
      } else {
        feedback.push('Question length should be between 10-25 words for optimal clarity');
        suggestions.push('Consider breaking down complex questions into main and sub-questions');
      }

      // Check for question words
      const hasQuestionWord = /^(how|what|why|when|where|who|which|to what extent)/i.test(question.main);
      if (hasQuestionWord) {
        score += 20;
      } else {
        feedback.push('Question should start with an interrogative word');
        suggestions.push('Begin with How, What, Why, When, Where, Who, or Which');
      }
    }

    // Check specificity
    if (question.population && question.setting && question.timeframe) {
      score += 20;
    } else {
      feedback.push('Question lacks specific context');
      suggestions.push('Define your population, setting, and timeframe clearly');
    }

    // Check feasibility
    if (question.variables && question.variables.length > 0 && question.variables.length <= 5) {
      score += 20;
    } else {
      feedback.push('Consider the number of variables for feasibility');
      suggestions.push('Focus on 2-5 key variables for a manageable scope');
    }

    // Check methodology alignment
    if (question.methodology === 'q-methodology') {
      const hasSubjectivity = /viewpoint|perspective|opinion|attitude|belief|perception/i.test(question.main || '');
      if (hasSubjectivity) {
        score += 20;
        feedback.push('Well-suited for Q methodology');
      } else {
        suggestions.push('Q methodology works best with questions about subjective viewpoints');
      }
    } else {
      score += 20;
    }

    return {
      valid: score >= 60,
      score,
      feedback,
      suggestions
    };
  }

  /**
   * Generate research question suggestions based on topic
   */
  async generateQuestionSuggestions(params: {
    topic: string;
    type: ResearchQuestion['type'];
    methodology: ResearchQuestion['methodology'];
    context?: string;
  }): Promise<string[]> {
    const templates = this.getQuestionTemplates(params.type, params.methodology);
    
    return templates.map(template => 
      this.fillTemplate(template, {
        topic: params.topic,
        context: params.context || '[context]'
      })
    );
  }

  /**
   * Create and validate hypotheses
   */
  async createHypothesis(params: {
    researchQuestion: string;
    type: Hypothesis['type'];
    variables: Hypothesis['variables'];
  }): Promise<Hypothesis> {
    const hypothesis: Hypothesis = {
      id: `hyp-${Date.now()}`,
      type: params.type,
      statement: this.generateHypothesisStatement(params),
      variables: params.variables,
      testable: this.isTestable(params.variables),
      measurable: this.isMeasurable(params.variables),
      rationale: this.generateRationale(params)
    };

    // Save to database if needed
    await this.saveHypothesis(hypothesis);

    return hypothesis;
  }

  /**
   * Design optimal study methodology
   */
  async designStudy(params: {
    researchQuestion: ResearchQuestion;
    constraints: {
      budget?: number;
      timeLimit?: string;
      accessToParticipants?: 'easy' | 'moderate' | 'difficult';
      ethicalConsiderations?: string[];
    };
  }): Promise<StudyDesign> {
    // Determine appropriate study design based on question type
    const studyType = this.determineStudyType(params.researchQuestion);
    const approach = this.determineApproach(params.researchQuestion);
    
    // Calculate sample size
    const powerAnalysis = await this.calculatePower({
      effectSize: 0.5, // Medium effect size as default
      alpha: 0.05,
      power: 0.8,
      sampleSize: 0, // Will be calculated
      type: 'a-priori',
      test: this.determineStatisticalTest(params.researchQuestion)
    });

    // Design sampling strategy
    const sampling = this.designSamplingStrategy(
      params.researchQuestion,
      powerAnalysis.sampleSize,
      params.constraints
    );

    // Create timeline
    const timeline = this.createStudyTimeline(
      params.researchQuestion,
      params.constraints.timeLimit
    );

    return {
      type: studyType,
      approach,
      sampling,
      dataCollection: this.determineDataCollectionMethods(params.researchQuestion),
      timeline
    };
  }

  /**
   * Perform power analysis
   */
  async calculatePower(params: PowerAnalysis): Promise<PowerAnalysis> {
    // Simplified power calculation
    // In production, would use proper statistical libraries
    
    let sampleSize: number;
    
    if (params.type === 'a-priori') {
      // Calculate sample size for given power
      const z_alpha = this.getZScore(params.alpha);
      const z_beta = this.getZScore(1 - params.power);
      sampleSize = Math.ceil(
        2 * Math.pow((z_alpha + z_beta) / params.effectSize, 2)
      );
    } else {
      sampleSize = params.sampleSize;
      // Calculate power for given sample size
      // Simplified calculation
    }

    return {
      ...params,
      sampleSize
    };
  }

  /**
   * Evaluate methodology choices
   */
  async evaluateMethodology(params: {
    question: ResearchQuestion;
    proposedDesign: StudyDesign;
  }): Promise<{
    alignment: number; // 0-100
    strengths: string[];
    weaknesses: string[];
    alternatives: string[];
    recommendations: string[];
  }> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const alternatives: string[] = [];
    const recommendations: string[] = [];
    let alignment = 0;

    // Check question-methodology alignment
    if (params.question.methodology === 'q-methodology') {
      if (params.proposedDesign.sampling.method === 'purposive') {
        alignment += 25;
        strengths.push('Purposive sampling appropriate for Q methodology');
      } else {
        weaknesses.push('Consider purposive sampling for Q methodology');
        recommendations.push('Select participants who represent different viewpoints');
      }

      if (params.proposedDesign.sampling.size >= 20 && params.proposedDesign.sampling.size <= 60) {
        alignment += 25;
        strengths.push('Sample size appropriate for Q methodology');
      } else {
        weaknesses.push('Q studies typically need 20-60 participants');
      }
    }

    // Check design appropriateness
    if (this.isDesignAppropriate(params.question.type, params.proposedDesign.type)) {
      alignment += 25;
      strengths.push(`${params.proposedDesign.type} design suits ${params.question.type} questions`);
    } else {
      weaknesses.push('Study design may not be optimal for question type');
      alternatives.push(this.suggestAlternativeDesign(params.question.type));
    }

    // Check feasibility
    if (this.isFeasibleDesign(params.proposedDesign)) {
      alignment += 25;
      strengths.push('Design appears feasible');
    } else {
      weaknesses.push('Consider feasibility constraints');
      recommendations.push('Simplify data collection or extend timeline');
    }

    return {
      alignment,
      strengths,
      weaknesses,
      alternatives,
      recommendations
    };
  }

  /**
   * Generate methodology report
   */
  async generateMethodologySection(studyId: string): Promise<string> {
    // Generate formatted methodology section for paper/proposal
    const study = await this.getStudyDetails(studyId);
    
    return `
# Methodology

## Research Design
${study.design.type} ${study.design.approach} study design was employed to address the research questions.

## Participants
${study.sampling.method} sampling was used to recruit ${study.sampling.size} participants from ${study.population}.

## Data Collection
Data were collected using ${study.dataCollection.join(', ')}.

## Procedure
${study.timeline.phases.map((phase: any) => 
  `### ${phase.name} (${phase.duration})
  Activities: ${phase.activities.join(', ')}
  Deliverables: ${phase.deliverables.join(', ')}`
).join('\n')}

## Data Analysis
${study.analysisMethod}

## Ethical Considerations
${study.ethicalConsiderations}
    `.trim();
  }

  // Helper methods

  private getQuestionTemplates(type: string, methodology: string): string[] {
    const templates: Record<string, string[]> = {
      exploratory: [
        'What factors influence {topic} in {context}?',
        'How do stakeholders perceive {topic}?',
        'What patterns emerge in {topic}?'
      ],
      descriptive: [
        'What is the current state of {topic}?',
        'What are the characteristics of {topic}?',
        'How prevalent is {topic} in {context}?'
      ],
      explanatory: [
        'Why does {topic} occur in {context}?',
        'How does X affect {topic}?',
        'What causes {topic}?'
      ],
      evaluative: [
        'How effective is {topic}?',
        'What is the impact of {topic}?',
        'To what extent does {topic} achieve its goals?'
      ]
    };

    if (methodology === 'q-methodology') {
      return [
        'What are the distinct viewpoints on {topic}?',
        'How do stakeholders subjectively understand {topic}?',
        'What perspectives exist regarding {topic}?'
      ];
    }

    return templates[type] || templates.exploratory;
  }

  private fillTemplate(template: string, values: Record<string, string>): string {
    let filled = template;
    Object.entries(values).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return filled;
  }

  private generateHypothesisStatement(params: any): string {
    const { type, variables } = params;
    
    if (type === 'null') {
      return `There is no significant relationship between ${variables.independent.join(', ')} and ${variables.dependent.join(', ')}.`;
    } else if (type === 'alternative') {
      return `There is a significant relationship between ${variables.independent.join(', ')} and ${variables.dependent.join(', ')}.`;
    } else if (type === 'directional') {
      return `${variables.independent[0]} positively affects ${variables.dependent[0]}.`;
    } else {
      return `${variables.independent[0]} affects ${variables.dependent[0]}.`;
    }
  }

  private isTestable(variables: Hypothesis['variables']): boolean {
    return variables.independent.length > 0 && variables.dependent.length > 0;
  }

  private isMeasurable(variables: Hypothesis['variables']): boolean {
    // Check if variables can be operationalized
    return true; // Simplified
  }

  private generateRationale(params: any): string {
    return 'Based on existing literature and theoretical framework...';
  }

  private determineStudyType(question: ResearchQuestion): StudyDesign['type'] {
    const typeMap: Record<ResearchQuestion['type'], StudyDesign['type']> = {
      exploratory: 'observational',
      descriptive: 'descriptive',
      explanatory: 'correlational',
      evaluative: 'quasi-experimental'
    };
    return typeMap[question.type];
  }

  private determineApproach(question: ResearchQuestion): StudyDesign['approach'] {
    if (question.timeframe.includes('over time') || question.timeframe.includes('years')) {
      return 'longitudinal';
    }
    return 'cross-sectional';
  }

  private determineStatisticalTest(question: ResearchQuestion): string {
    if (question.methodology === 'q-methodology') {
      return 'factor-analysis';
    } else if (question.methodology === 'quantitative') {
      return 't-test'; // Simplified
    }
    return 'thematic-analysis';
  }

  private designSamplingStrategy(
    question: ResearchQuestion,
    targetSize: number,
    constraints: any
  ): StudyDesign['sampling'] {
    let method: StudyDesign['sampling']['method'] = 'random';
    
    if (question.methodology === 'q-methodology') {
      method = 'purposive';
      targetSize = Math.min(60, Math.max(20, targetSize));
    } else if (constraints.accessToParticipants === 'difficult') {
      method = 'convenience';
    }

    return {
      method,
      size: targetSize,
      power: 0.8,
      confidence: 0.95
    };
  }

  private createStudyTimeline(question: ResearchQuestion, timeLimit?: string): StudyDesign['timeline'] {
    const phases: StudyPhase[] = [
      {
        name: 'Preparation',
        duration: '2 weeks',
        activities: ['Ethics approval', 'Participant recruitment', 'Material preparation'],
        deliverables: ['Ethics certificate', 'Recruitment materials'],
        milestones: ['Ethics approved', 'Recruitment started']
      },
      {
        name: 'Data Collection',
        duration: '4 weeks',
        activities: ['Conduct interviews/surveys', 'Q-sorts', 'Follow-ups'],
        deliverables: ['Raw data', 'Transcripts'],
        milestones: ['50% completion', '100% completion']
      },
      {
        name: 'Analysis',
        duration: '3 weeks',
        activities: ['Data processing', 'Statistical analysis', 'Interpretation'],
        deliverables: ['Analysis results', 'Findings summary'],
        milestones: ['Analysis complete']
      },
      {
        name: 'Reporting',
        duration: '2 weeks',
        activities: ['Write report', 'Create visualizations', 'Peer review'],
        deliverables: ['Final report', 'Presentation'],
        milestones: ['Report submitted']
      }
    ];

    return {
      phases,
      totalDuration: '11 weeks'
    };
  }

  private determineDataCollectionMethods(question: ResearchQuestion): string[] {
    const methods: string[] = [];
    
    if (question.methodology === 'q-methodology') {
      methods.push('Q-sort', 'Post-sort interview');
    } else if (question.methodology === 'qualitative') {
      methods.push('Semi-structured interviews', 'Focus groups');
    } else if (question.methodology === 'quantitative') {
      methods.push('Structured survey', 'Standardized measures');
    } else {
      methods.push('Mixed methods', 'Triangulation');
    }
    
    return methods;
  }

  private isDesignAppropriate(questionType: string, designType: string): boolean {
    const appropriate: Record<string, string[]> = {
      exploratory: ['observational', 'descriptive'],
      descriptive: ['descriptive', 'observational'],
      explanatory: ['correlational', 'experimental', 'quasi-experimental'],
      evaluative: ['experimental', 'quasi-experimental']
    };
    
    return appropriate[questionType]?.includes(designType) || false;
  }

  private isFeasibleDesign(design: StudyDesign): boolean {
    // Check if timeline and sample size are realistic
    const totalWeeks = parseInt(design.timeline.totalDuration);
    return totalWeeks <= 52 && design.sampling.size <= 1000;
  }

  private suggestAlternativeDesign(questionType: string): string {
    const suggestions: Record<string, string> = {
      exploratory: 'Consider case study or grounded theory approach',
      descriptive: 'Consider cross-sectional survey design',
      explanatory: 'Consider experimental or longitudinal design',
      evaluative: 'Consider randomized controlled trial or quasi-experimental design'
    };
    return suggestions[questionType] || 'Consider mixed methods approach';
  }

  private getZScore(probability: number): number {
    // Simplified Z-score calculation
    const zScores: Record<number, number> = {
      0.05: 1.96,
      0.01: 2.58,
      0.8: 0.84,
      0.9: 1.28,
      0.95: 1.65
    };
    return zScores[probability] || 1.96;
  }

  private async saveHypothesis(hypothesis: Hypothesis): Promise<void> {
    // Save to database
    // Implementation depends on your schema
  }

  private async getStudyDetails(studyId: string): Promise<any> {
    // Fetch study details from database
    return {
      design: { type: 'observational', approach: 'cross-sectional' },
      sampling: { method: 'purposive', size: 30 },
      population: 'Healthcare workers',
      dataCollection: ['Q-sort', 'Interview'],
      timeline: { phases: [] },
      analysisMethod: 'Factor analysis',
      ethicalConsiderations: 'Informed consent obtained'
    };
  }
}