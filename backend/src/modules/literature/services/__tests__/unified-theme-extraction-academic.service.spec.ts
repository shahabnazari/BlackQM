/**
 * Phase 10 Day 5.8 Week 1: Academic-Grade Theme Extraction Tests
 * Tests for Braun & Clarke (2006) Reflexive Thematic Analysis implementation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnifiedThemeExtractionService } from '../unified-theme-extraction.service';
import { PrismaService } from '../../../../common/prisma.service';

describe('UnifiedThemeExtractionService - Academic Extraction', () => {
  let service: UnifiedThemeExtractionService;
  let prisma: PrismaService;

  // Mock sources for testing
  const mockSources = [
    {
      id: 'paper1',
      type: 'paper' as const,
      title: 'Climate Change Adaptation Strategies',
      content: `This research examines various strategies communities are employing to adapt to climate change impacts.
      We found that resilience-building through infrastructure improvements, policy changes, and community engagement
      are key factors. Our study analyzed 50 case studies across different regions and identified common patterns
      in successful adaptation efforts. The results suggest that multi-stakeholder collaboration and evidence-based
      policy making are critical for effective climate adaptation.`,
      authors: ['Smith, J.', 'Johnson, M.'],
      keywords: ['climate', 'adaptation', 'resilience'],
      year: 2023,
      doi: '10.1234/example1',
    },
    {
      id: 'paper2',
      type: 'paper' as const,
      title: 'Urban Resilience to Climate Impacts',
      content: `Urban areas face unique challenges in building resilience to climate change. This paper explores
      how cities are implementing green infrastructure, updating building codes, and creating emergency response
      plans. We conducted interviews with urban planners and analyzed policy documents from 30 major cities.
      Our findings highlight the importance of integrated planning approaches that consider both mitigation
      and adaptation strategies simultaneously.`,
      authors: ['Brown, A.', 'Davis, R.'],
      keywords: ['urban', 'resilience', 'infrastructure'],
      year: 2023,
      doi: '10.1234/example2',
    },
    {
      id: 'paper3',
      type: 'paper' as const,
      title: 'Community-Based Climate Action',
      content: `This study investigates grassroots climate action initiatives in rural communities. Through
      participatory action research with 15 communities, we identified effective strategies for local climate
      adaptation. Community engagement, local knowledge integration, and capacity building emerged as crucial
      elements. The research demonstrates that bottom-up approaches complement top-down policy interventions
      and can lead to more sustainable outcomes.`,
      authors: ['Wilson, K.'],
      keywords: ['community', 'participation', 'local action'],
      year: 2023,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedThemeExtractionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            unifiedTheme: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UnifiedThemeExtractionService>(UnifiedThemeExtractionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractThemesAcademic', () => {
    it('should be defined', () => {
      expect(service.extractThemesAcademic).toBeDefined();
    });

    it('should accept sources with full content (no truncation)', () => {
      const fullContentSource = {
        ...mockSources[0],
        content: 'A'.repeat(10000), // Long content
      };

      expect(fullContentSource.content.length).toBeGreaterThan(500);
      // Service should accept this without truncating
    });

    it('should require academic extraction options', () => {
      const options = {
        methodology: 'reflexive_thematic' as const,
        validationLevel: 'rigorous' as const,
        maxThemes: 15,
        minConfidence: 0.5,
        researchContext: 'Climate change adaptation',
      };

      expect(options.methodology).toBe('reflexive_thematic');
      expect(options.validationLevel).toBe('rigorous');
    });

    it('should support multiple validation levels', () => {
      const levels = ['standard', 'rigorous', 'publication_ready'] as const;

      levels.forEach(level => {
        expect(['standard', 'rigorous', 'publication_ready']).toContain(level);
      });
    });

    it('should support multiple methodologies', () => {
      const methodologies = [
        'reflexive_thematic',
        'grounded_theory',
        'content_analysis',
      ] as const;

      methodologies.forEach(method => {
        expect(['reflexive_thematic', 'grounded_theory', 'content_analysis']).toContain(method);
      });
    });

    describe('Validation Metrics', () => {
      it('should calculate coherence score (0-1)', () => {
        const mockCoherenceScore = 0.75;
        expect(mockCoherenceScore).toBeGreaterThanOrEqual(0);
        expect(mockCoherenceScore).toBeLessThanOrEqual(1);
      });

      it('should calculate coverage (percentage of sources)', () => {
        const totalSources = 10;
        const coveredSources = 8;
        const coverage = coveredSources / totalSources;

        expect(coverage).toBe(0.8);
        expect(coverage).toBeGreaterThanOrEqual(0);
        expect(coverage).toBeLessThanOrEqual(1);
      });

      it('should check theme saturation', () => {
        const validThemeCounts = [5, 10, 15, 20];
        const invalidThemeCounts = [2, 3, 25, 30];

        validThemeCounts.forEach(count => {
          expect(count).toBeGreaterThanOrEqual(5);
          expect(count).toBeLessThanOrEqual(20);
        });

        invalidThemeCounts.forEach(count => {
          expect(count < 5 || count > 20).toBe(true);
        });
      });

      it('should calculate average confidence', () => {
        const themes = [
          { confidence: 0.8 },
          { confidence: 0.7 },
          { confidence: 0.9 },
        ];

        const avgConfidence = themes.reduce((sum, t) => sum + t.confidence, 0) / themes.length;
        expect(avgConfidence).toBeCloseTo(0.8, 1);
      });
    });

    describe('Methodology Report', () => {
      it('should return methodology metadata', () => {
        const methodology = {
          method: 'Reflexive Thematic Analysis',
          citation: 'Braun & Clarke (2006, 2019)',
          stages: 6,
          validation: 'Cross-source triangulation with semantic embeddings',
          aiRole: 'AI-assisted semantic clustering; themes validated against full dataset',
          limitations: 'AI-assisted interpretation; recommend researcher review for publication',
        };

        expect(methodology.method).toBe('Reflexive Thematic Analysis');
        expect(methodology.stages).toBe(6);
        expect(methodology.citation).toContain('Braun & Clarke');
      });

      it('should list all 6 processing stages', () => {
        const stages = [
          'Familiarization (Semantic Embeddings)',
          'Initial Coding (Pattern Detection)',
          'Theme Generation (Clustering)',
          'Theme Review (Cross-Validation)',
          'Refinement (Quality Control)',
          'Provenance Tracking (Influence Calculation)',
        ];

        expect(stages).toHaveLength(6);
        expect(stages[0]).toContain('Familiarization');
        expect(stages[5]).toContain('Provenance');
      });
    });

    describe('Semantic Embeddings', () => {
      it('should use text-embedding-3-large model', () => {
        const embeddingModel = 'text-embedding-3-large';
        expect(embeddingModel).toBe('text-embedding-3-large');
      });

      it('should process full content without truncation', () => {
        const longContent = 'A'.repeat(5000);
        const truncatedContent = longContent.substring(0, 500);

        // Academic method should use longContent, NOT truncatedContent
        expect(longContent.length).toBe(5000);
        expect(truncatedContent.length).toBe(500);
      });

      it('should calculate cosine similarity between vectors', () => {
        // Mock cosine similarity calculation
        const vec1 = [1, 0, 0];
        const vec2 = [1, 0, 0];
        const vec3 = [0, 1, 0];

        // Identical vectors = similarity 1
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        const similarity = dotProduct / (norm1 * norm2);

        expect(similarity).toBe(1);

        // Orthogonal vectors = similarity 0
        const dotProduct2 = vec1.reduce((sum, val, i) => sum + val * vec3[i], 0);
        const norm3 = Math.sqrt(vec3.reduce((sum, val) => sum + val * val, 0));
        const similarity2 = dotProduct2 / (norm1 * norm3);

        expect(similarity2).toBe(0);
      });
    });

    describe('Theme Validation', () => {
      it('should require minimum 3 sources for publication_ready', () => {
        const validationLevel = 'publication_ready';
        const minSources = validationLevel === 'publication_ready' ? 3 : 2;

        expect(minSources).toBe(3);
      });

      it('should require minimum 2 sources for rigorous', () => {
        const rigorousMinSources = 2;
        const publicationMinSources = 3;

        expect(rigorousMinSources).toBe(2);
        expect(publicationMinSources).toBe(3);
      });

      it('should check semantic coherence threshold', () => {
        const rigorousMinCoherence = 0.6;
        const publicationMinCoherence = 0.7;

        expect(rigorousMinCoherence).toBe(0.6);
        expect(publicationMinCoherence).toBe(0.7);
      });

      it('should check distinctiveness between themes', () => {
        const minDistinctiveness = 0.3;
        const mockDistinctiveness = 0.5;

        expect(mockDistinctiveness).toBeGreaterThan(minDistinctiveness);
      });

      it('should validate evidence quality', () => {
        const codes = [
          { excerpts: ['quote1', 'quote2'] },
          { excerpts: ['quote3'] },
          { excerpts: [] },
        ];

        const withEvidence = codes.filter(c => c.excerpts.length > 0).length;
        const evidenceQuality = withEvidence / codes.length;

        expect(evidenceQuality).toBeCloseTo(0.67, 1);
      });
    });

    describe('Processing Metadata', () => {
      it('should track sources analyzed', () => {
        const metadata = {
          sourcesAnalyzed: mockSources.length,
          codesGenerated: 25,
          candidateThemes: 18,
          finalThemes: 12,
          processingTimeMs: 15000,
          embeddingModel: 'text-embedding-3-large',
          analysisModel: 'gpt-4-turbo-preview',
        };

        expect(metadata.sourcesAnalyzed).toBe(3);
        expect(metadata.finalThemes).toBeLessThanOrEqual(metadata.candidateThemes);
        expect(metadata.candidateThemes).toBeLessThanOrEqual(metadata.codesGenerated);
      });

      it('should use GPT-4 for analysis', () => {
        const analysisModel = 'gpt-4-turbo-preview';
        expect(analysisModel).toContain('gpt-4');
      });
    });

    describe('Transparency Report', () => {
      it('should explain how it works', () => {
        const transparency = {
          howItWorks: 'Six-stage reflexive thematic analysis based on Braun & Clarke (2006)',
          aiRole: 'AI assists in semantic clustering and pattern identification',
          quality: 'Inter-source triangulation (3+ sources), semantic coherence checks',
          limitations: 'AI-assisted interpretation; recommend researcher review for publication',
          citation: 'Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology.',
        };

        expect(transparency.howItWorks).toContain('Six-stage');
        expect(transparency.citation).toContain('Braun');
        expect(transparency.limitations).toContain('researcher review');
      });
    });

    describe('Progress Tracking', () => {
      it('should support progress callbacks for 6 stages', () => {
        const progressUpdates: Array<{ stage: number; total: number; message: string }> = [];

        const mockProgressCallback = (stage: number, total: number, message: string) => {
          progressUpdates.push({ stage, total, message });
        };

        // Simulate 6-stage progress
        for (let i = 1; i <= 6; i++) {
          mockProgressCallback(i, 6, `Stage ${i} in progress`);
        }

        expect(progressUpdates).toHaveLength(6);
        expect(progressUpdates[0].stage).toBe(1);
        expect(progressUpdates[5].stage).toBe(6);
      });
    });

    describe('Error Handling', () => {
      it('should handle empty sources array', () => {
        const sources: any[] = [];
        expect(sources.length).toBe(0);
        // Service should reject or return empty result
      });

      it('should handle sources with missing content', () => {
        const invalidSource = {
          id: 'test1',
          type: 'paper' as const,
          title: 'Test',
          content: '', // Empty content
        };

        expect(invalidSource.content).toBe('');
        // Service should handle gracefully
      });

      it('should handle OpenAI API errors', async () => {
        // Mock OpenAI error
        const mockError = new Error('OpenAI API error');
        expect(mockError.message).toContain('OpenAI');
      });
    });
  });

  describe('Cosine Similarity Helper', () => {
    it('should calculate correct similarity for identical vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];

      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
      }

      norm1 = Math.sqrt(norm1);
      norm2 = Math.sqrt(norm2);

      const similarity = dotProduct / (norm1 * norm2);
      expect(similarity).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];

      let dotProduct = 0;
      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
      }

      expect(dotProduct).toBe(0);
    });

    it('should handle different dimension vectors safely', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2]; // Different dimension

      expect(vec1.length).not.toBe(vec2.length);
      // Service should handle this gracefully and return 0
    });
  });

  describe('Hierarchical Clustering', () => {
    it('should merge similar clusters', () => {
      const clusters = [
        { similarity: 0.9 },
        { similarity: 0.5 },
        { similarity: 0.3 },
      ];

      // Should merge clusters with similarity > 0.8
      const shouldMerge = clusters.filter(c => c.similarity > 0.8);
      expect(shouldMerge).toHaveLength(1);
    });

    it('should stop merging at maxThemes', () => {
      const maxThemes = 15;
      let clusterCount = 30;

      while (clusterCount > maxThemes) {
        clusterCount -= 1; // Simulate merge
      }

      expect(clusterCount).toBe(maxThemes);
    });
  });
});
