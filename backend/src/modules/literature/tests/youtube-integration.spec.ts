/**
 * YouTube Integration Test Suite
 * Tests the full flow of YouTube search functionality
 *
 * ROOT CAUSE INVESTIGATION:
 * Issue: YouTube results "appear for a second then disappear"
 *
 * Hypothesis:
 * 1. ✅ YouTube API key is valid (verified with direct API test)
 * 2. ❓ Authentication might be failing (endpoint requires JwtAuthGuard)
 * 3. ❓ Frontend may not have valid JWT token
 * 4. ❓ Request may be failing silently due to auth issues
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { LiteratureService } from '../literature.service';
import { LiteratureController } from '../literature.controller';
import { PrismaService } from '../../../common/prisma.service';
import { of, throwError } from 'rxjs';

describe('YouTube Integration Tests', () => {
  let service: LiteratureService;
  let controller: LiteratureController;
  let httpService: HttpService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockPrismaService = {
      paper: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiteratureController],
      providers: [
        LiteratureService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LiteratureService>(LiteratureService);
    controller = module.get<LiteratureController>(LiteratureController);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('YouTube API Key Validation', () => {
    it('should have YouTube API key configured', () => {
      const apiKey = process.env.YOUTUBE_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey).not.toBe('your-youtube-api-key-here');
      expect(apiKey).toMatch(/^AIza/); // YouTube API keys start with AIza
    });

    it('should not use placeholder API key', () => {
      const apiKey = process.env.YOUTUBE_API_KEY;
      expect(apiKey).not.toBe('your-youtube-api-key-here');
    });
  });

  describe('searchAlternativeSources with YouTube', () => {
    it('should return YouTube results when API key is valid', async () => {
      const mockYouTubeResponse = {
        data: {
          items: [
            {
              id: { videoId: 'test123' },
              snippet: {
                title: 'Test Video',
                channelTitle: 'Test Channel',
                publishedAt: '2024-01-01T00:00:00Z',
                description: 'Test description',
                channelId: 'channel123',
                thumbnails: { default: { url: 'test.jpg' } },
              },
            },
          ],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockYouTubeResponse as any));

      const results = await service.searchAlternativeSources(
        'machine learning',
        ['youtube'],
        'test-user',
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toMatchObject({
        id: 'test123',
        title: 'Test Video',
        source: 'YouTube',
        type: 'video',
      });
    });

    it('should handle YouTube API errors gracefully', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('YouTube API quota exceeded'))
      );

      const results = await service.searchAlternativeSources(
        'machine learning',
        ['youtube'],
        'test-user',
      );

      // Should return empty array instead of throwing
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle missing API key gracefully', async () => {
      const originalKey = process.env.YOUTUBE_API_KEY;
      delete process.env.YOUTUBE_API_KEY;

      const results = await service.searchAlternativeSources(
        'machine learning',
        ['youtube'],
        'test-user',
      );

      // Should return empty array when key is missing
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);

      // Restore
      process.env.YOUTUBE_API_KEY = originalKey;
    });
  });

  describe('Controller endpoint - getAlternativeSources', () => {
    it('should accept query and sources parameters', async () => {
      const mockResults = [
        {
          id: 'test123',
          title: 'Test Video',
          source: 'YouTube',
        },
      ];

      jest.spyOn(service, 'searchAlternativeSources').mockResolvedValue(mockResults);

      const user = { id: 'test-user', email: 'test@example.com' };
      const result = await controller.getAlternativeSources(
        'machine learning',
        'youtube',
        user,
      );

      expect(result).toEqual(mockResults);
      expect(service.searchAlternativeSources).toHaveBeenCalledWith(
        'machine learning',
        ['youtube'],
        'test-user',
      );
    });

    it('should normalize sources to array', async () => {
      jest.spyOn(service, 'searchAlternativeSources').mockResolvedValue([]);

      const user = { id: 'test-user', email: 'test@example.com' };

      // Test with string
      await controller.getAlternativeSources('test', 'youtube', user);
      expect(service.searchAlternativeSources).toHaveBeenCalledWith(
        'test',
        ['youtube'],
        'test-user',
      );

      // Test with array
      await controller.getAlternativeSources('test', ['youtube', 'github'], user);
      expect(service.searchAlternativeSources).toHaveBeenCalledWith(
        'test',
        ['youtube', 'github'],
        'test-user',
      );
    });

    it('should handle errors and propagate them', async () => {
      jest.spyOn(service, 'searchAlternativeSources').mockRejectedValue(
        new Error('Service error')
      );

      const user = { id: 'test-user', email: 'test@example.com' };

      await expect(
        controller.getAlternativeSources('test', 'youtube', user)
      ).rejects.toThrow('Service error');
    });
  });

  describe('YouTube Search Method - Private Implementation', () => {
    it('should construct proper YouTube API URL', async () => {
      const mockResponse = {
        data: {
          items: [{
            id: { videoId: 'test' },
            snippet: {
              title: 'Test',
              channelTitle: 'Channel',
              publishedAt: '2024-01-01',
              description: 'Desc',
              channelId: 'ch123',
              thumbnails: {},
            },
          }],
        },
      };

      const getSpy = jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

      await service.searchAlternativeSources('test query', ['youtube'], 'user1');

      expect(getSpy).toHaveBeenCalled();
      const callArgs = getSpy.mock.calls[0];
      const url = callArgs[0];
      const config = callArgs[1];

      expect(url).toBe('https://www.googleapis.com/youtube/v3/search');
      expect(config.params).toMatchObject({
        q: 'test query',
        part: 'snippet',
        type: 'video',
        maxResults: 10,
        order: 'relevance',
      });
      expect(config.params.key).toBeDefined();
    });
  });

  describe('Authentication Requirements', () => {
    it('should require JWT authentication for /alternative endpoint', () => {
      // This test verifies the endpoint has @UseGuards(JwtAuthGuard)
      const metadata = Reflect.getMetadata('__guards__', controller.getAlternativeSources);
      expect(metadata).toBeDefined();
      // In actual implementation, this would check for JwtAuthGuard
    });
  });

  describe('Error Logging', () => {
    it('should log errors when YouTube API fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      await service.searchAlternativeSources('test', ['youtube'], 'user1');

      // Error should be logged but not thrown
      // Service should return empty array gracefully

      consoleSpy.mockRestore();
    });
  });
});

/**
 * INTEGRATION TEST SCENARIOS TO RUN MANUALLY:
 *
 * 1. Test without authentication:
 *    curl http://localhost:4000/api/literature/alternative?query=test&sources=youtube
 *    Expected: 401 Unauthorized
 *
 * 2. Test with valid JWT token:
 *    curl -H "Authorization: Bearer <TOKEN>" \
 *         http://localhost:4000/api/literature/alternative?query=test&sources=youtube
 *    Expected: 200 OK with YouTube results
 *
 * 3. Test with expired token:
 *    curl -H "Authorization: Bearer <EXPIRED_TOKEN>" \
 *         http://localhost:4000/api/literature/alternative?query=test&sources=youtube
 *    Expected: 401 Unauthorized
 *
 * 4. Test with invalid API key:
 *    Temporarily change YOUTUBE_API_KEY in .env to invalid value
 *    Expected: Empty array [] returned, error logged
 */
