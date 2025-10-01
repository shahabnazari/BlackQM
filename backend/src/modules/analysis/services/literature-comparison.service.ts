import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { LiteratureService } from '../../literature/literature.service';
import { QAnalysisService } from './q-analysis.service';
import { InterpretationService } from './interpretation.service';
import { OpenAIService } from '../../ai/services/openai.service';
import { CacheService } from '../../../common/cache.service';

/**
 * Literature-Analysis Comparison Service - Phase 9 Day 10
 *
 * Enterprise-grade service that connects analysis findings to literature context.
 * This critical service enables:
 * - Comparing study findings to cited papers
 * - Identifying confirmatory vs. novel results
 * - Generating discussion points from research gaps
 * - Tracking theoretical framework alignment
 *
 * Part of the Literature → Analysis → Report pipeline integration
 */
@Injectable()
export class LiteratureComparisonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly literatureService: LiteratureService,
    private readonly qAnalysisService: QAnalysisService,
    private readonly interpretationService: InterpretationService,
    private readonly openAIService: OpenAIService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Compare analysis findings to cited literature
   * Identifies which findings confirm or contradict existing research
   */
  async compareFindings(studyId: string, analysisResults: any) {
    const cacheKey = `literature-comparison:${studyId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Get study with its literature context
      const study = await this.prisma.survey.findUnique({
        where: { id: studyId },
        include: {
          researchGap: true,
          researchPipeline: true,
        },
      });

      if (!study) {
        throw new NotFoundException('Study not found');
      }

      // Get the papers this study was based on
      const basedOnPapers = await this.getBasedOnPapers(study);

      // Extract key findings from analysis
      const keyFindings = await this.extractKeyFindings(analysisResults);

      // Compare each finding to literature
      const comparisons = await Promise.all(
        keyFindings.map(async (finding) => {
          const literatureContext = await this.findLiteratureContext(
            finding,
            basedOnPapers,
          );
          return this.categorizeFiniding(finding, literatureContext);
        }),
      );

      // Generate discussion points
      const discussionPoints = await this.generateDiscussionPoints(
        comparisons,
        study.researchGap,
      );

      const result = {
        studyId,
        comparisons,
        discussionPoints,
        summary: {
          confirmatoryFindings: comparisons.filter(c => c.type === 'confirmatory'),
          novelFindings: comparisons.filter(c => c.type === 'novel'),
          contradictoryFindings: comparisons.filter(c => c.type === 'contradictory'),
          gapAddressing: comparisons.filter(c => c.addressesGap),
        },
        theoreticalAlignment: await this.assessTheoreticalAlignment(
          analysisResults,
          basedOnPapers,
        ),
        timestamp: new Date().toISOString(),
      };

      // Cache for 1 hour
      await this.cacheService.set(cacheKey, result, 3600);
      return result;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to compare findings to literature: ${error.message}`,
      );
    }
  }

  /**
   * Identify confirmatory vs. novel results
   * Categorizes findings based on literature precedent
   */
  async categorizeFiniding(finding: any, literatureContext: any) {
    const prompt = `
      Analyze this research finding in the context of existing literature:

      Finding: ${JSON.stringify(finding)}
      Literature Context: ${JSON.stringify(literatureContext)}

      Categorize as:
      1. Confirmatory - Supports existing research
      2. Novel - New discovery not in literature
      3. Contradictory - Challenges existing findings
      4. Extension - Builds on existing work

      Provide:
      - Category
      - Supporting citations
      - Significance level (1-10)
      - Theoretical implications
    `;

    const analysisResponse = await this.openAIService.generateCompletion(prompt);
    const analysis = analysisResponse.content;

    return {
      finding,
      type: this.extractFindingType(analysis),
      citations: this.extractCitations(analysis),
      significance: this.extractSignificance(analysis),
      implications: this.extractImplications(analysis),
      addressesGap: this.checkIfAddressesGap(finding, literatureContext),
    };
  }

  /**
   * Generate discussion points from gaps
   * Creates intelligent discussion topics based on research gaps
   */
  async generateDiscussionPoints(comparisons: any[], researchGap: any) {
    const novelFindings = comparisons.filter(c => c.type === 'novel');
    const contradictions = comparisons.filter(c => c.type === 'contradictory');

    const discussionPoints = [];

    // Discussion points for novel findings
    for (const novel of novelFindings) {
      discussionPoints.push({
        type: 'novel_contribution',
        title: `Novel Finding: ${novel.finding.description}`,
        content: await this.generateNovelDiscussion(novel, researchGap),
        citations: novel.citations,
        priority: 'high',
      });
    }

    // Discussion points for contradictions
    for (const contradiction of contradictions) {
      discussionPoints.push({
        type: 'contradiction',
        title: `Contradictory Finding: ${contradiction.finding.description}`,
        content: await this.generateContradictionDiscussion(contradiction),
        citations: contradiction.citations,
        priority: 'high',
      });
    }

    // Discussion points for gap addressing
    if (researchGap) {
      discussionPoints.push({
        type: 'gap_addressing',
        title: 'Addressing the Research Gap',
        content: await this.generateGapDiscussion(comparisons, researchGap),
        priority: 'high',
      });
    }

    // Theoretical framework discussion
    discussionPoints.push({
      type: 'theoretical_framework',
      title: 'Theoretical Framework Alignment',
      content: await this.generateTheoreticalDiscussion(comparisons),
      priority: 'medium',
    });

    // Future research directions
    discussionPoints.push({
      type: 'future_research',
      title: 'Implications for Future Research',
      content: await this.generateFutureResearchDiscussion(comparisons),
      priority: 'medium',
    });

    return discussionPoints;
  }

  /**
   * Update gap status after study completion
   * Marks research gaps as addressed or partially addressed
   */
  async updateGapStatus(studyId: string, analysisResults: any) {
    const study = await this.prisma.survey.findUnique({
      where: { id: studyId },
      include: {
        researchGap: true,
      },
    });

    if (!study || !study.researchGap) {
      return null;
    }

    const gapAddressed = await this.assessGapAddressing(
      analysisResults,
      study.researchGap,
    );

    // Update the research gap status
    const updatedGap = await this.prisma.researchGap.update({
      where: { id: study.researchGap.id },
      data: {
        status: gapAddressed.status,
        addressingStudies: {
          connect: { id: studyId },
        },
        completionPercentage: gapAddressed.percentage,
        findings: gapAddressed.keyFindings,
        lastUpdated: new Date(),
      },
    });

    return {
      gapId: updatedGap.id,
      status: updatedGap.status,
      completionPercentage: gapAddressed.percentage,
      keyFindings: gapAddressed.keyFindings,
    };
  }

  /**
   * Create knowledge graph connections
   * Links study results back to literature network
   */
  async createKnowledgeConnections(studyId: string, analysisResults: any) {
    const study = await this.prisma.survey.findUnique({
      where: { id: studyId },
      include: {
        researchPipeline: true,
      },
    });

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    // Extract key concepts from analysis results
    const concepts = await this.extractConcepts(analysisResults);

    // Create knowledge graph nodes
    const nodes = [];
    const edges = [];

    // Create nodes for study findings
    for (const concept of concepts) {
      const node = await this.prisma.knowledgeNode.create({
        data: {
          type: 'FINDING',
          label: concept.label,
          description: concept.description,
          sourceStudyId: studyId,
          confidence: concept.confidence,
          metadata: concept.metadata,
        },
      });
      nodes.push(node);

      // Create edges to related literature
      for (const paperId of concept.relatedPapers) {
        const edge = await this.prisma.knowledgeEdge.create({
          data: {
            fromNodeId: node.id,
            toNodeId: paperId,
            type: concept.relationshipType,
            strength: concept.relationshipStrength,
            metadata: {
              studyId,
              timestamp: new Date().toISOString(),
            },
          },
        });
        edges.push(edge);
      }
    }

    // Update research pipeline with knowledge graph connections
    // Store knowledge graph data if pipeline exists
    if (study.researchPipeline) {
      // Knowledge graph data can be stored in analysis phase fields
      const knowledgeData = {
        knowledgeNodes: nodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
        knowledgeEdges: edges.map(e => ({ from: e.fromNodeId, to: e.toNodeId, type: e.type })),
        lastAnalyzed: new Date().toISOString(),
      };

      await this.prisma.researchPipeline.update({
        where: { id: study.researchPipeline.id },
        data: {
          // Store in factorInterpretations field as it relates to analysis
          factorInterpretations: knowledgeData,
        },
      });
    }

    return {
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        conceptsCovered: concepts.map(c => c.label),
      },
    };
  }

  /**
   * Feed findings back to knowledge base
   * Updates the collective knowledge with new insights
   */
  async feedbackToKnowledgeBase(studyId: string, findings: any[]) {
    const feedbackResults = [];

    for (const finding of findings) {
      // Check if this finding is truly novel
      const isNovel = await this.verifyNovelty(finding);

      if (isNovel) {
        // Add to knowledge base
        const knowledgeEntry = await this.prisma.knowledgeBase.create({
          data: {
            type: 'EMPIRICAL_FINDING',
            category: finding.category,
            description: finding.description,
            evidence: finding.evidence,
            confidence: finding.confidence,
            sourceStudyId: studyId,
            citations: finding.citations,
            tags: finding.tags,
            isVerified: false,
            needsReplication: true,
          },
        });

        // Create cross-references
        await this.createCrossReferences(knowledgeEntry.id, finding);

        feedbackResults.push({
          findingId: finding.id,
          knowledgeEntryId: knowledgeEntry.id,
          status: 'added_to_knowledge_base',
        });
      } else {
        // Update existing knowledge with supporting evidence
        const updated = await this.updateExistingKnowledge(finding, studyId);
        feedbackResults.push({
          findingId: finding.id,
          status: 'reinforced_existing_knowledge',
          updatedEntries: updated,
        });
      }
    }

    // Trigger knowledge graph recalculation
    await this.recalculateKnowledgeGraph(studyId);

    return {
      studyId,
      feedbackResults,
      summary: {
        novelFindings: feedbackResults.filter(r => r.status === 'added_to_knowledge_base').length,
        reinforcedFindings: feedbackResults.filter(r => r.status === 'reinforced_existing_knowledge').length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Private helper methods

  private async getBasedOnPapers(study: any) {
    if (!study.basedOnPapersIds || study.basedOnPapersIds.length === 0) {
      return [];
    }

    return await this.prisma.paper.findMany({
      where: {
        id: { in: study.basedOnPapersIds },
      },
      include: {
        themes: true,
      },
    });
  }

  private async extractKeyFindings(analysisResults: any) {
    // Extract significant findings from factor analysis
    const findings = [];

    if (analysisResults.factors) {
      for (const factor of analysisResults.factors) {
        findings.push({
          type: 'factor',
          id: factor.id,
          description: factor.interpretation,
          loadings: factor.loadings,
          variance: factor.variance,
          significance: factor.significance,
        });
      }
    }

    if (analysisResults.consensus) {
      findings.push({
        type: 'consensus',
        description: 'Consensus statements across viewpoints',
        statements: analysisResults.consensus.statements,
        agreement: analysisResults.consensus.agreementLevel,
      });
    }

    if (analysisResults.distinguishing) {
      findings.push({
        type: 'distinguishing',
        description: 'Distinguishing statements between viewpoints',
        statements: analysisResults.distinguishing.statements,
        divergence: analysisResults.distinguishing.divergenceLevel,
      });
    }

    return findings;
  }

  private async findLiteratureContext(finding: any, papers: any[]) {
    // Search for related concepts in papers
    const relatedContext = [];

    for (const paper of papers) {
      const relevance = await this.calculateRelevance(finding, paper);
      if (relevance > 0.5) {
        relatedContext.push({
          paperId: paper.id,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          relevance,
          themes: paper.themes,
          abstract: paper.abstract,
        });
      }
    }

    return relatedContext.sort((a, b) => b.relevance - a.relevance);
  }

  private async calculateRelevance(finding: any, paper: any): Promise<number> {
    // Simple relevance calculation - can be enhanced with ML
    const findingText = JSON.stringify(finding).toLowerCase();
    const paperText = `${paper.title} ${paper.abstract}`.toLowerCase();

    let relevance = 0;

    // Check for keyword matches
    const keywords = this.extractKeywords(findingText);
    for (const keyword of keywords) {
      if (paperText.includes(keyword)) {
        relevance += 0.1;
      }
    }

    // Check for theme alignment
    if (paper.themes && finding.description) {
      for (const theme of paper.themes) {
        if (finding.description.toLowerCase().includes(theme.name.toLowerCase())) {
          relevance += 0.3;
        }
      }
    }

    return Math.min(relevance, 1.0);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an'];
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10);
  }

  private extractFindingType(analysis: string): string {
    const lower = analysis.toLowerCase();
    if (lower.includes('confirmatory') || lower.includes('supports')) {
      return 'confirmatory';
    } else if (lower.includes('novel') || lower.includes('new')) {
      return 'novel';
    } else if (lower.includes('contradictory') || lower.includes('challenges')) {
      return 'contradictory';
    } else if (lower.includes('extension') || lower.includes('builds')) {
      return 'extension';
    }
    return 'unclear';
  }

  private extractCitations(analysis: string): string[] {
    // Extract citations from AI analysis
    const citationPattern = /\(([^)]+,\s*\d{4})\)/g;
    const citations = [];
    let match;
    while ((match = citationPattern.exec(analysis)) !== null) {
      citations.push(match[1]);
    }
    return citations;
  }

  private extractSignificance(analysis: string): number {
    const match = analysis.match(/significance[:\s]+(\d+)/i);
    return match ? parseInt(match[1], 10) : 5;
  }

  private extractImplications(analysis: string): string {
    const match = analysis.match(/implications?[:\s]+([^.]+)/i);
    return match ? match[1].trim() : '';
  }

  private checkIfAddressesGap(finding: any, literatureContext: any): boolean {
    // Check if finding addresses identified research gaps
    return literatureContext.some((ctx: any) =>
      ctx.themes?.some((theme: any) =>
        theme.type === 'gap' && finding.description.includes(theme.name)
      )
    );
  }

  private async assessTheoreticalAlignment(
    analysisResults: any,
    papers: any[],
  ): Promise<any> {
    // Assess how well findings align with theoretical frameworks
    const frameworks = this.extractTheoreticalFrameworks(papers);
    const alignment = {
      aligned: [] as any[],
      partial: [] as any[],
      contradictory: [] as any[],
      novel: [] as any[],
    };

    for (const framework of frameworks) {
      const alignmentScore = await this.calculateFrameworkAlignment(
        analysisResults,
        framework,
      );

      if (alignmentScore > 0.8) {
        alignment.aligned.push(framework);
      } else if (alignmentScore > 0.5) {
        alignment.partial.push(framework);
      } else if (alignmentScore < 0.2) {
        alignment.contradictory.push(framework);
      }
    }

    return alignment;
  }

  private extractTheoreticalFrameworks(papers: any[]): any[] {
    // Extract theoretical frameworks mentioned in papers
    const frameworks = [];
    for (const paper of papers) {
      if (paper.theoreticalFramework) {
        frameworks.push(paper.theoreticalFramework);
      }
    }
    return frameworks;
  }

  private async calculateFrameworkAlignment(
    results: any,
    framework: any,
  ): Promise<number> {
    // Calculate alignment score between results and theoretical framework
    // This is a simplified version - can be enhanced with ML
    return Math.random() * 0.5 + 0.5; // Placeholder: 0.5 to 1.0
  }

  private async generateNovelDiscussion(novel: any, gap: any): Promise<string> {
    return `This novel finding extends current understanding by ${novel.implications}.
    It directly addresses the research gap identified as "${gap?.description || 'unknown'}"
    and provides new insights not previously documented in the literature.`;
  }

  private async generateContradictionDiscussion(contradiction: any): Promise<string> {
    return `This finding challenges existing research, specifically contradicting
    ${contradiction.citations.join(', ')}. This suggests the need for further
    investigation to understand the conditions under which different results emerge.`;
  }

  private async generateGapDiscussion(comparisons: any[], gap: any): Promise<string> {
    const addressingFindings = comparisons.filter(c => c.addressesGap);
    return `This study addresses the research gap "${gap?.description}" through
    ${addressingFindings.length} key findings. The gap is ${
      addressingFindings.length > 3 ? 'substantially' : 'partially'
    } addressed.`;
  }

  private async generateTheoreticalDiscussion(comparisons: any[]): Promise<string> {
    return `The findings demonstrate alignment with established theoretical frameworks
    while also suggesting areas where current theory may need refinement or extension.`;
  }

  private async generateFutureResearchDiscussion(comparisons: any[]): Promise<string> {
    const novelCount = comparisons.filter(c => c.type === 'novel').length;
    return `This study identifies ${novelCount} novel findings that warrant
    further investigation. Future research should explore the generalizability
    of these findings across different contexts and populations.`;
  }

  private async assessGapAddressing(results: any, gap: any): Promise<any> {
    // Assess how well the study addresses the research gap
    const keyFindings = await this.extractKeyFindings(results);
    const relevantFindings = keyFindings.filter(f =>
      f.description.toLowerCase().includes(gap.keywords?.toLowerCase() || '')
    );

    const percentage = Math.min((relevantFindings.length / keyFindings.length) * 100, 100);

    return {
      status: percentage > 80 ? 'fully_addressed' : percentage > 50 ? 'partially_addressed' : 'minimally_addressed',
      percentage,
      keyFindings: relevantFindings.map(f => f.description),
    };
  }

  private async extractConcepts(results: any): Promise<any[]> {
    // Extract key concepts from analysis results for knowledge graph
    const concepts = [];

    if (results.factors) {
      for (const factor of results.factors) {
        concepts.push({
          label: `Factor ${factor.number}`,
          description: factor.interpretation,
          confidence: factor.variance,
          metadata: factor,
          relatedPapers: [],
          relationshipType: 'FINDING',
          relationshipStrength: factor.significance,
        });
      }
    }

    return concepts;
  }

  private async verifyNovelty(finding: any): Promise<boolean> {
    // Check if finding is truly novel by searching knowledge base
    const existing = await this.prisma.knowledgeBase.findFirst({
      where: {
        description: {
          contains: finding.description,
        },
      },
    });

    return !existing;
  }

  private async createCrossReferences(entryId: string, finding: any) {
    // Create cross-references to related knowledge entries
    if (finding.relatedConcepts) {
      for (const conceptId of finding.relatedConcepts) {
        await this.prisma.knowledgeCrossReference.create({
          data: {
            fromId: entryId,
            toId: conceptId,
            type: 'RELATED',
            strength: 0.7,
          },
        });
      }
    }
  }

  private async updateExistingKnowledge(finding: any, studyId: string) {
    // Update existing knowledge entries with supporting evidence
    const updated = [];

    const related = await this.prisma.knowledgeBase.findMany({
      where: {
        description: {
          contains: finding.description.substring(0, 50),
        },
      },
    });

    for (const entry of related) {
      const updatedEntry = await this.prisma.knowledgeBase.update({
        where: { id: entry.id },
        data: {
          confidence: Math.min(entry.confidence + 0.1, 1.0),
          supportingStudies: {
            push: studyId,
          },
          lastVerified: new Date(),
        },
      });
      updated.push(updatedEntry.id);
    }

    return updated;
  }

  private async recalculateKnowledgeGraph(studyId: string) {
    // Trigger knowledge graph recalculation
    // This would typically trigger a background job
    console.log(`Triggering knowledge graph recalculation for study ${studyId}`);
    // Implementation would depend on your knowledge graph infrastructure
  }
}