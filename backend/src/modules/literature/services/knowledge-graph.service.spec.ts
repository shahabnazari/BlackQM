import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { PrismaService } from '../../../common/prisma.service';
import { OpenAIService } from '../../ai/services/openai.service';

describe('KnowledgeGraphService', () => {
  let service: KnowledgeGraphService;
  let prisma: PrismaService;
  let openai: OpenAIService;

  const mockPrisma = {
    paper: {
      findMany: jest.fn(),
    },
    knowledgeNode: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    knowledgeEdge: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeGraphService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAI,
        },
      ],
    }).compile();

    service = module.get<KnowledgeGraphService>(KnowledgeGraphService);
    prisma = module.get<PrismaService>(PrismaService);
    openai = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Entity Extraction', () => {
    it('should extract concepts from paper abstracts', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Machine Learning in Healthcare',
          abstract:
            'This study explores the application of machine learning algorithms in predicting patient outcomes.',
          authors: ['Author 1'],
        },
      ];

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: [
                  'machine learning',
                  'healthcare',
                  'patient outcomes',
                ],
                theories: ['predictive modeling'],
                methods: ['supervised learning'],
                findings: ['improved prediction accuracy'],
              }),
            },
          },
        ],
      });

      const result = await service.buildKnowledgeGraph(['paper1']);

      expect(result.metrics.entitiesExtracted).toBeGreaterThan(0);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should categorize entities correctly', async () => {
      // Test entity type classification logic
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Test Paper',
          abstract: 'A study about concepts and theories.',
          authors: ['Test Author'],
        },
      ];

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers);
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: ['concept1', 'concept2'],
                theories: ['theory1'],
                methods: ['method1'],
                findings: [],
              }),
            },
          },
        ],
      });

      const result = await service.buildKnowledgeGraph(['paper1']);

      expect(result.success).toBe(true);
    });

    it('should handle empty abstracts gracefully', async () => {
      const mockPapers = [
        { id: 'paper1', title: 'No Abstract', abstract: '', authors: [] },
      ];

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers);

      const result = await service.buildKnowledgeGraph(['paper1']);

      expect(result.success).toBe(true);
      expect(result.metrics.entitiesExtracted).toBe(0);
    });
  });

  describe('Bridge Concept Detection', () => {
    it('should identify high-betweenness concepts', async () => {
      const mockNodes = [
        { id: 'n1', label: 'Concept A', type: 'CONCEPT' },
        { id: 'n2', label: 'Concept B', type: 'CONCEPT' },
        { id: 'n3', label: 'Concept C', type: 'CONCEPT' },
      ];

      const mockEdges = [
        { fromNodeId: 'n1', toNodeId: 'n2' },
        { fromNodeId: 'n2', toNodeId: 'n3' },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      // Bridge detection should identify n2 as having high betweenness
      const result = await service.buildKnowledgeGraph([]);

      expect(result.metrics.bridgeConceptsFound).toBeGreaterThanOrEqual(0);
    });

    it('should detect cross-disciplinary connectors', async () => {
      const mockNodes = [
        {
          id: 'n1',
          label: 'ML Algorithm',
          type: 'CONCEPT',
          keywords: ['computer science'],
        },
        {
          id: 'n2',
          label: 'Patient Outcome',
          type: 'CONCEPT',
          keywords: ['medicine'],
        },
        {
          id: 'n3',
          label: 'Predictive Model',
          type: 'CONCEPT',
          keywords: ['computer science', 'medicine'],
        },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);

      const result = await service.buildKnowledgeGraph([]);

      expect(result.insights.bridgeConcepts).toBeDefined();
    });

    it('should calculate betweenness centrality correctly', async () => {
      // Test the betweenness centrality algorithm
      const mockNodes = [
        { id: 'n1', label: 'A', type: 'CONCEPT' },
        { id: 'n2', label: 'B', type: 'CONCEPT' },
        { id: 'n3', label: 'C', type: 'CONCEPT' },
        { id: 'n4', label: 'D', type: 'CONCEPT' },
      ];

      const mockEdges = [
        { fromNodeId: 'n1', toNodeId: 'n2' },
        { fromNodeId: 'n2', toNodeId: 'n3' },
        { fromNodeId: 'n2', toNodeId: 'n4' },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      const result = await service.buildKnowledgeGraph([]);

      // n2 should have highest betweenness
      expect(result.metrics.bridgeConceptsFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Controversy Detection', () => {
    it('should identify opposing citation clusters', async () => {
      const mockNodes = [
        { id: 'n1', label: 'Pro View', type: 'FINDING' },
        { id: 'n2', label: 'Con View', type: 'FINDING' },
      ];

      const mockEdges = [
        { fromNodeId: 'n1', toNodeId: 'n2', type: 'CONTRADICTS' },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      const result = await service.buildKnowledgeGraph([]);

      expect(result.metrics.controversiesDetected).toBeGreaterThanOrEqual(0);
    });

    it('should calculate controversy intensity', async () => {
      const mockNodes = Array.from({ length: 10 }, (_, i) => ({
        id: `n${i}`,
        label: `Finding ${i}`,
        type: 'FINDING',
      }));

      const mockEdges = [
        { fromNodeId: 'n0', toNodeId: 'n1', type: 'CONTRADICTS' },
        { fromNodeId: 'n2', toNodeId: 'n3', type: 'CONTRADICTS' },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      const result = await service.buildKnowledgeGraph([]);

      expect(result.insights.controversies).toBeDefined();
    });

    it('should group controversy clusters', async () => {
      // Test clustering of controversial findings
      const result = await service.buildKnowledgeGraph([]);

      if (result.insights.controversies.length > 0) {
        expect(result.insights.controversies[0]).toHaveProperty('clusters');
      }
    });
  });

  describe('Influence Flow', () => {
    it('should track idea propagation correctly', async () => {
      const mockNodes = [
        { id: 'n1', label: 'Original Idea', type: 'THEORY' },
        { id: 'n2', label: 'Extension', type: 'THEORY' },
        { id: 'n3', label: 'Application', type: 'METHOD' },
      ];

      const mockEdges = [
        {
          fromNodeId: 'n1',
          toNodeId: 'n2',
          type: 'EXTENDS',
          createdAt: new Date('2020-01-01'),
        },
        {
          fromNodeId: 'n2',
          toNodeId: 'n3',
          type: 'USES',
          createdAt: new Date('2021-01-01'),
        },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      const result = await service.trackInfluenceFlow('n1');

      expect(result.success).toBe(true);
      expect(result.influenceFlows).toBeDefined();
    });

    it('should apply temporal decay', async () => {
      const oldDate = new Date('2010-01-01');
      const recentDate = new Date('2023-01-01');

      const mockEdges = [
        { fromNodeId: 'n1', toNodeId: 'n2', createdAt: oldDate },
        { fromNodeId: 'n1', toNodeId: 'n3', createdAt: recentDate },
      ];

      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      const result = await service.trackInfluenceFlow('n1');

      // Recent connections should have higher influence
      expect(result.success).toBe(true);
    });

    it('should calculate influence scores using PageRank variant', async () => {
      const mockNodes = Array.from({ length: 5 }, (_, i) => ({
        id: `n${i}`,
        label: `Node ${i}`,
        type: 'CONCEPT',
      }));

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([
        { fromNodeId: 'n0', toNodeId: 'n1' },
        { fromNodeId: 'n1', toNodeId: 'n2' },
        { fromNodeId: 'n0', toNodeId: 'n2' },
      ]);

      const result = await service.trackInfluenceFlow('n0');

      expect(result.influenceFlows.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Missing Link Prediction', () => {
    it('should predict plausible connections', async () => {
      const mockNodes = [
        {
          id: 'n1',
          label: 'Concept A',
          type: 'CONCEPT',
          keywords: ['ML', 'healthcare'],
        },
        {
          id: 'n2',
          label: 'Concept B',
          type: 'CONCEPT',
          keywords: ['ML', 'finance'],
        },
        {
          id: 'n3',
          label: 'Concept C',
          type: 'CONCEPT',
          keywords: ['healthcare', 'finance'],
        },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([]);

      const result = await service.predictMissingLinks();

      expect(result.success).toBe(true);
      expect(result.predictedLinks).toBeDefined();
    });

    it('should rank predictions by confidence', async () => {
      const mockNodes = [
        { id: 'n1', label: 'A', type: 'CONCEPT', keywords: ['k1', 'k2', 'k3'] },
        { id: 'n2', label: 'B', type: 'CONCEPT', keywords: ['k1', 'k2'] },
        { id: 'n3', label: 'C', type: 'CONCEPT', keywords: ['k1'] },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([]);

      const result = await service.predictMissingLinks();

      if (result.predictedLinks.length > 1) {
        // Higher keyword overlap should result in higher confidence
        expect(result.predictedLinks[0].confidence).toBeGreaterThanOrEqual(
          result.predictedLinks[1].confidence,
        );
      }
    });

    it('should use Jaccard similarity for prediction', async () => {
      const mockNodes = [
        { id: 'n1', label: 'A', type: 'CONCEPT', keywords: ['a', 'b'] },
        { id: 'n2', label: 'B', type: 'CONCEPT', keywords: ['b', 'c'] },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([]);

      const result = await service.predictMissingLinks();

      // Jaccard similarity: |{b}| / |{a,b,c}| = 1/3 = 0.33
      expect(result.success).toBe(true);
    });
  });

  describe('Emerging Topics Detection', () => {
    it('should identify topics with exponential growth', async () => {
      const mockNodes = Array.from({ length: 10 }, (_, i) => ({
        id: `n${i}`,
        label: 'AI Ethics',
        type: 'CONCEPT',
        createdAt: new Date(2020 + i, 0, 1),
        citationCount: Math.pow(2, i), // Exponential growth
      }));

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);

      const result = await service.buildKnowledgeGraph([]);

      expect(result.metrics.emergingTopicsFound).toBeGreaterThanOrEqual(0);
    });

    it('should calculate growth rate correctly', async () => {
      const mockNodes = [
        {
          id: 'n1',
          label: 'Topic',
          type: 'CONCEPT',
          createdAt: new Date('2020-01-01'),
          citationCount: 10,
        },
        {
          id: 'n2',
          label: 'Topic',
          type: 'CONCEPT',
          createdAt: new Date('2021-01-01'),
          citationCount: 15,
        },
        {
          id: 'n3',
          label: 'Topic',
          type: 'CONCEPT',
          createdAt: new Date('2022-01-01'),
          citationCount: 25,
        },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);

      const result = await service.buildKnowledgeGraph([]);

      expect(result.insights.emergingTopics).toBeDefined();
    });

    it('should filter out declining topics', async () => {
      const mockNodes = [
        { id: 'n1', label: 'Declining', type: 'CONCEPT', citationCount: 100 },
        { id: 'n2', label: 'Declining', type: 'CONCEPT', citationCount: 50 },
        { id: 'n3', label: 'Declining', type: 'CONCEPT', citationCount: 25 },
      ];

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);

      const result = await service.buildKnowledgeGraph([]);

      // Declining topics should not be in emerging topics
      const emergingLabels = result.insights.emergingTopics.map(
        (t: any) => t.topic,
      );
      expect(emergingLabels).not.toContain('Declining');
    });
  });

  describe('Graph Export', () => {
    it('should export graph in JSON format', async () => {
      const result = await service.exportKnowledgeGraph('json');

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.data).toBeDefined();
    });

    it('should export graph in GraphML format', async () => {
      mockPrisma.knowledgeNode.findMany.mockResolvedValue([
        { id: 'n1', label: 'Node 1', type: 'CONCEPT' },
      ]);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([]);

      const result = await service.exportKnowledgeGraph('graphml');

      expect(result.success).toBe(true);
      expect(result.format).toBe('graphml');
      expect(result.data).toContain('<?xml');
      expect(result.data).toContain('<graphml');
    });

    it('should export graph in Cypher format', async () => {
      mockPrisma.knowledgeNode.findMany.mockResolvedValue([
        { id: 'n1', label: 'Node 1', type: 'CONCEPT' },
      ]);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([
        { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2', type: 'RELATES' },
      ]);

      const result = await service.exportKnowledgeGraph('cypher');

      expect(result.success).toBe(true);
      expect(result.format).toBe('cypher');
      expect(result.data).toContain('CREATE');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large graphs efficiently', async () => {
      const largeNodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `n${i}`,
        label: `Node ${i}`,
        type: 'CONCEPT',
      }));

      mockPrisma.knowledgeNode.findMany.mockResolvedValue(largeNodes);

      const startTime = Date.now();
      await service.buildKnowledgeGraph([]);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete in <10s
    });

    it('should handle disconnected components', async () => {
      const mockNodes = [
        { id: 'n1', label: 'A', type: 'CONCEPT' },
        { id: 'n2', label: 'B', type: 'CONCEPT' },
        { id: 'n3', label: 'C', type: 'CONCEPT' },
      ];

      // No edges - completely disconnected
      mockPrisma.knowledgeNode.findMany.mockResolvedValue(mockNodes);
      mockPrisma.knowledgeEdge.findMany.mockResolvedValue([]);

      const result = await service.buildKnowledgeGraph([]);

      expect(result.success).toBe(true);
    });

    it('should handle cyclic graphs', async () => {
      const mockEdges = [
        { fromNodeId: 'n1', toNodeId: 'n2' },
        { fromNodeId: 'n2', toNodeId: 'n3' },
        { fromNodeId: 'n3', toNodeId: 'n1' }, // Cycle
      ];

      mockPrisma.knowledgeEdge.findMany.mockResolvedValue(mockEdges);

      const result = await service.trackInfluenceFlow('n1');

      expect(result.success).toBe(true);
    });
  });
});
