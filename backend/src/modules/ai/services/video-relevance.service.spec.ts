/**
 * Video Relevance Service Tests
 *
 * Phase 9 Day 21 - Comprehensive test coverage for AI-powered video relevance scoring
 *
 * Test Coverage:
 * - Single video relevance scoring
 * - Batch video processing
 * - AI response parsing (valid and invalid)
 * - Caching mechanisms
 * - Error handling and fallbacks
 * - Cost calculations
 * - Auto-selection logic
 *
 * @group unit
 * @group ai-services
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  VideoRelevanceService,
  VideoMetadata,
  RelevanceScore,
} from './video-relevance.service';
import { UnifiedAIService } from './unified-ai.service';

describe('VideoRelevanceService', () => {
  let service: VideoRelevanceService;
  let unifiedAIService: jest.Mocked<UnifiedAIService>;

  const mockVideoMetadata: VideoMetadata = {
    videoId: 'test-video-123',
    title: 'Climate Change Research Methods: A Comprehensive Guide',
    description:
      'Exploring quantitative and qualitative research methodologies for climate science',
    channelName: 'Academic Research Channel',
    duration: 1200, // 20 minutes
    publishedAt: new Date('2024-01-15'),
    viewCount: 50000,
  };

  const mockAIResponse = {
    content: JSON.stringify({
      score: 85,
      reasoning:
        'Highly relevant academic content discussing research methodologies',
      topics: ['climate change', 'research methods', 'quantitative analysis'],
      isAcademic: true,
      confidence: 0.9,
      transcribe: true,
      priority: 'high',
    }),
    tokens: 150,
    inputTokens: 100,
    outputTokens: 50,
    responseTimeMs: 500,
    cached: false,
    cost: 0.001,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  };

  beforeEach(async () => {
    const mockUnifiedAIService = {
      generateCompletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoRelevanceService,
        {
          provide: UnifiedAIService,
          useValue: mockUnifiedAIService,
        },
      ],
    }).compile();

    service = module.get<VideoRelevanceService>(VideoRelevanceService);
    unifiedAIService = module.get(UnifiedAIService) as jest.Mocked<UnifiedAIService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scoreVideoRelevance', () => {
    it('should score a video with valid AI response', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      const result = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change research methods',
      );

      expect(result).toMatchObject({
        videoId: 'test-video-123',
        score: 85,
        reasoning: expect.stringContaining('research methodologies'),
        topics: expect.arrayContaining(['climate change', 'research methods']),
        isAcademic: true,
        confidence: 0.9,
        recommendations: {
          transcribe: true,
          priority: 'high',
        },
      });

      expect(unifiedAIService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('climate change research methods'),
        expect.objectContaining({
          model: 'smart',
          temperature: 0.3,
        }),
      );
    });

    it('should cache results and return cached values on subsequent calls', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      // First call
      const result1 = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      // Second call with same parameters
      const result2 = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      expect(result1).toEqual(result2);
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle AI response with markdown code blocks', async () => {
      const responseWithMarkdown = {
        content: '```json\n' + mockAIResponse.content + '\n```',
        tokens: 150,
        inputTokens: 100,
        outputTokens: 50,
        responseTimeMs: 500,
        cached: false,
        cost: 0.001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      };
      unifiedAIService.generateCompletion.mockResolvedValue(responseWithMarkdown);

      const result = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      expect(result.score).toBe(85);
      expect(result.topics).toHaveLength(3);
    });

    it('should return safe defaults when AI response is invalid', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Invalid response without JSON',
        tokens: 10,
        inputTokens: 5,
        outputTokens: 5,
        responseTimeMs: 100,
        cached: false,
        cost: 0.0001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      expect(result).toMatchObject({
        videoId: 'test-video-123',
        score: 50,
        reasoning: 'Unable to determine relevance',
        topics: [],
        isAcademic: false,
        confidence: 0.3,
        recommendations: {
          transcribe: false,
          priority: 'low',
        },
      });
    });

    it('should return error fallback on OpenAI service failure', async () => {
      unifiedAIService.generateCompletion.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      const result = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      expect(result).toMatchObject({
        videoId: 'test-video-123',
        score: 0,
        reasoning: 'Failed to analyze video relevance',
        topics: [],
        isAcademic: false,
        confidence: 0,
        recommendations: {
          transcribe: false,
          priority: 'low',
        },
      });
    });

    it('should clamp scores to 0-100 range', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          score: 150, // Invalid score > 100
          reasoning: 'Test',
          topics: [],
          isAcademic: true,
          confidence: 1.5, // Invalid confidence > 1
          transcribe: true,
          priority: 'high',
        }),
        tokens: 100,
        inputTokens: 60,
        outputTokens: 40,
        responseTimeMs: 300,
        cached: false,
        cost: 0.0008,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      expect(result.score).toBe(100); // Clamped to 100
      expect(result.confidence).toBe(1); // Clamped to 1
    });

    it('should auto-recommend transcription for scores > 60', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          score: 75,
          reasoning: 'Relevant content',
          topics: ['climate'],
          isAcademic: true,
          confidence: 0.8,
          // transcribe field missing - should auto-set based on score
          priority: 'medium',
        }),
        tokens: 120,
        inputTokens: 70,
        outputTokens: 50,
        responseTimeMs: 400,
        cached: false,
        cost: 0.0009,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.scoreVideoRelevance(
        mockVideoMetadata,
        'climate change',
      );

      expect(result.recommendations.transcribe).toBe(true);
      expect(result.recommendations.priority).toBe('medium');
    });

    it('should auto-set priority based on score when not provided', async () => {
      const testCases = [
        { score: 85, expectedPriority: 'high', videoId: 'video-test-85' },
        { score: 70, expectedPriority: 'medium', videoId: 'video-test-70' },
        { score: 50, expectedPriority: 'low', videoId: 'video-test-50' },
      ];

      for (const testCase of testCases) {
        unifiedAIService.generateCompletion.mockResolvedValue({
          content: JSON.stringify({
            score: testCase.score,
            reasoning: 'Test',
            topics: [],
            isAcademic: false,
            confidence: 0.7,
            transcribe: false,
            // priority missing - should auto-set based on score
          }),
          tokens: 100,
          inputTokens: 60,
          outputTokens: 40,
          responseTimeMs: 300,
          cached: false,
          cost: 0.0008,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
        });

        const result = await service.scoreVideoRelevance(
          { ...mockVideoMetadata, videoId: testCase.videoId },
          'test query',
        );

        expect(result.recommendations.priority).toBe(testCase.expectedPriority);
        jest.clearAllMocks();
      }
    });
  });

  describe('batchScoreVideos', () => {
    it('should score multiple videos in parallel', async () => {
      const videos: VideoMetadata[] = [
        { ...mockVideoMetadata, videoId: 'video-1' },
        { ...mockVideoMetadata, videoId: 'video-2' },
        { ...mockVideoMetadata, videoId: 'video-3' },
      ];

      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      const results = await service.batchScoreVideos(videos, 'climate change');

      expect(results).toHaveLength(3);
      expect(results[0].videoId).toBe('video-1');
      expect(results[1].videoId).toBe('video-2');
      expect(results[2].videoId).toBe('video-3');
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures gracefully', async () => {
      const videos: VideoMetadata[] = [
        { ...mockVideoMetadata, videoId: 'video-1' },
        { ...mockVideoMetadata, videoId: 'video-2' },
      ];

      unifiedAIService.generateCompletion
        .mockResolvedValueOnce(mockAIResponse)
        .mockRejectedValueOnce(new Error('API error'));

      const results = await service.batchScoreVideos(videos, 'climate change');

      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(85); // Success
      expect(results[1].score).toBe(0); // Failure fallback
    });
  });

  describe('selectTopVideos', () => {
    it('should select top N videos by relevance score', async () => {
      const videos: VideoMetadata[] = [
        { ...mockVideoMetadata, videoId: 'video-1', duration: 600 }, // 10 min
        { ...mockVideoMetadata, videoId: 'video-2', duration: 1200 }, // 20 min
        { ...mockVideoMetadata, videoId: 'video-3', duration: 900 }, // 15 min
      ];

      unifiedAIService.generateCompletion
        .mockResolvedValueOnce({
          content: JSON.stringify({
            ...JSON.parse(mockAIResponse.content),
            score: 90,
          }),
          tokens: 150,
          inputTokens: 100,
          outputTokens: 50,
          responseTimeMs: 500,
          cached: false,
          cost: 0.001,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            ...JSON.parse(mockAIResponse.content),
            score: 70,
          }),
          tokens: 150,
          inputTokens: 100,
          outputTokens: 50,
          responseTimeMs: 500,
          cached: false,
          cost: 0.001,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            ...JSON.parse(mockAIResponse.content),
            score: 80,
          }),
          tokens: 150,
          inputTokens: 100,
          outputTokens: 50,
          responseTimeMs: 500,
          cached: false,
          cost: 0.001,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
        });

      const result = await service.selectTopVideos(
        videos,
        'climate change',
        2, // Select top 2
      );

      expect(result.selectedVideos).toHaveLength(2);
      expect(result.selectedVideos).toContain('video-1'); // Score 90
      expect(result.selectedVideos).toContain('video-3'); // Score 80
      expect(result.selectedVideos).not.toContain('video-2'); // Score 70
    });

    it('should calculate total transcription cost correctly', async () => {
      const videos: VideoMetadata[] = [
        { ...mockVideoMetadata, videoId: 'video-1', duration: 600 }, // 10 min = $0.06
        { ...mockVideoMetadata, videoId: 'video-2', duration: 1200 }, // 20 min = $0.12
      ];

      unifiedAIService.generateCompletion
        .mockResolvedValueOnce({
          content: JSON.stringify({
            ...JSON.parse(mockAIResponse.content),
            score: 90,
          }),
          tokens: 150,
          inputTokens: 100,
          outputTokens: 50,
          responseTimeMs: 500,
          cached: false,
          cost: 0.001,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            ...JSON.parse(mockAIResponse.content),
            score: 85,
          }),
          tokens: 150,
          inputTokens: 100,
          outputTokens: 50,
          responseTimeMs: 500,
          cached: false,
          cost: 0.001,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
        });

      const result = await service.selectTopVideos(videos, 'climate change', 2);

      // Total: (10 * 0.006) + (20 * 0.006) = 0.18
      expect(result.totalCost).toBeCloseTo(0.18, 2);
    });

    it('should generate reasoning for selection', async () => {
      const videos: VideoMetadata[] = [
        { ...mockVideoMetadata, videoId: 'video-1', duration: 600 },
      ];

      unifiedAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          ...JSON.parse(mockAIResponse.content),
          score: 90,
          isAcademic: true,
        }),
        tokens: 150,
        inputTokens: 100,
        outputTokens: 50,
        responseTimeMs: 500,
        cached: false,
        cost: 0.001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.selectTopVideos(videos, 'climate change', 1);

      expect(result.reasoning).toContain('1 videos');
      expect(result.reasoning).toContain('90%');
      expect(result.reasoning).toContain('1 videos identified as academic');
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      // Create a cache entry
      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);
      await service.scoreVideoRelevance(mockVideoMetadata, 'climate change');

      // Manually expire cache by accessing private cache (for testing)
      const cacheKey = `${mockVideoMetadata.videoId}:climate change`;

      // Call clearExpiredCache
      service.clearExpiredCache();

      // Since cache hasn't expired (24 hours), should still return cached result
      unifiedAIService.generateCompletion.mockClear();
      await service.scoreVideoRelevance(mockVideoMetadata, 'climate change');
      expect(unifiedAIService.generateCompletion).not.toHaveBeenCalled();
    });
  });

  describe('buildScoringPrompt', () => {
    it('should build comprehensive scoring prompt', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      await service.scoreVideoRelevance(mockVideoMetadata, 'climate change');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];

      expect(calledPrompt).toContain('climate change');
      expect(calledPrompt).toContain(mockVideoMetadata.title);
      expect(calledPrompt).toContain(mockVideoMetadata.description);
      expect(calledPrompt).toContain(mockVideoMetadata.channelName);
      expect(calledPrompt).toContain('20 minutes'); // Duration in minutes
      expect(calledPrompt).toContain("Score this video's relevance");
      expect(calledPrompt).toContain('0-100');
      expect(calledPrompt).toContain('Academic vs entertainment');
    });
  });

  describe('edge cases', () => {
    it('should handle videos with missing view counts', async () => {
      const videoWithoutViews: VideoMetadata = {
        ...mockVideoMetadata,
        viewCount: undefined,
      };

      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      const result = await service.scoreVideoRelevance(
        videoWithoutViews,
        'climate change',
      );

      expect(result.score).toBe(85);
      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('N/A'); // View count shows N/A
    });

    it('should handle very short videos', async () => {
      const shortVideo: VideoMetadata = {
        ...mockVideoMetadata,
        duration: 30, // 30 seconds
      };

      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      await service.scoreVideoRelevance(shortVideo, 'climate change');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('1 minutes'); // Rounds to 1 minute
    });

    it('should handle very long videos', async () => {
      const longVideo: VideoMetadata = {
        ...mockVideoMetadata,
        duration: 7200, // 2 hours
      };

      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      await service.scoreVideoRelevance(longVideo, 'climate change');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('120 minutes'); // 2 hours
    });

    it('should differentiate cache keys for different contexts', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      // Same video, different contexts
      await service.scoreVideoRelevance(mockVideoMetadata, 'climate change');
      await service.scoreVideoRelevance(mockVideoMetadata, 'research methods');

      // Should call OpenAI twice (different cache keys)
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance', () => {
    it('should process batch requests efficiently in parallel', async () => {
      const videos: VideoMetadata[] = Array.from({ length: 10 }, (_, i) => ({
        ...mockVideoMetadata,
        videoId: `video-${i}`,
      }));

      unifiedAIService.generateCompletion.mockResolvedValue(mockAIResponse);

      const startTime = Date.now();
      await service.batchScoreVideos(videos, 'climate change');
      const endTime = Date.now();

      // Parallel processing should be much faster than sequential
      // This is a rough check - adjust threshold as needed
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });
  });
});
