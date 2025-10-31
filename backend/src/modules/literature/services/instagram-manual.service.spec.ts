import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { InstagramManualService } from './instagram-manual.service';
import { TranscriptionService } from './transcription.service';
import { MultiMediaAnalysisService } from './multimedia-analysis.service';
import { BadRequestException } from '@nestjs/common';

/**
 * Instagram Manual Upload Service Tests
 *
 * Comprehensive test suite for Instagram manual upload functionality
 * Tests URL validation, file processing, transcription, and legal compliance
 *
 * Phase 9 Day 19 Task 2 - Testing
 */

describe('InstagramManualService', () => {
  let service: InstagramManualService;
  let prisma: PrismaService;
  let transcriptionService: TranscriptionService;
  let multimediaAnalysisService: MultiMediaAnalysisService;
  let configService: ConfigService;

  const mockPrismaService = {
    videoTranscript: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    socialMediaContent: {
      upsert: jest.fn(),
    },
  };

  const mockTranscriptionService = {
    transcribeAudioFile: jest.fn(),
  };

  const mockMultimediaAnalysisService = {
    extractThemesFromTranscript: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'INSTAGRAM_UPLOAD_DIR') return '/tmp/test-instagram-uploads';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstagramManualService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        {
          provide: MultiMediaAnalysisService,
          useValue: mockMultimediaAnalysisService,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<InstagramManualService>(InstagramManualService);
    prisma = module.get<PrismaService>(PrismaService);
    transcriptionService =
      module.get<TranscriptionService>(TranscriptionService);
    multimediaAnalysisService = module.get<MultiMediaAnalysisService>(
      MultiMediaAnalysisService,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with correct upload directory', () => {
      expect(service['uploadDir']).toBe('/tmp/test-instagram-uploads');
    });

    it('should have correct max file size (500 MB)', () => {
      expect(service['maxFileSize']).toBe(500 * 1024 * 1024);
    });

    it('should have correct allowed extensions', () => {
      expect(service['allowedExtensions']).toContain('.mp4');
      expect(service['allowedExtensions']).toContain('.mov');
      expect(service['allowedExtensions']).toContain('.avi');
      expect(service['allowedExtensions']).toContain('.mkv');
    });
  });

  describe('isValidInstagramUrl', () => {
    it('should validate standard Instagram post URL', () => {
      expect(
        service.isValidInstagramUrl('https://www.instagram.com/p/ABC123/'),
      ).toBe(true);
      expect(
        service.isValidInstagramUrl('https://instagram.com/p/ABC123/'),
      ).toBe(true);
      expect(
        service.isValidInstagramUrl('http://www.instagram.com/p/ABC123/'),
      ).toBe(true);
    });

    it('should validate Instagram reel URL', () => {
      expect(
        service.isValidInstagramUrl('https://www.instagram.com/reel/XYZ789/'),
      ).toBe(true);
      expect(
        service.isValidInstagramUrl('https://instagram.com/reel/XYZ789/'),
      ).toBe(true);
    });

    it('should validate Instagram TV URL', () => {
      expect(
        service.isValidInstagramUrl('https://www.instagram.com/tv/DEF456/'),
      ).toBe(true);
    });

    it('should validate URL with username', () => {
      expect(
        service.isValidInstagramUrl(
          'https://www.instagram.com/testuser/p/ABC123/',
        ),
      ).toBe(true);
      expect(
        service.isValidInstagramUrl(
          'https://www.instagram.com/testuser/reel/XYZ789/',
        ),
      ).toBe(true);
    });

    it('should validate URL with query parameters', () => {
      expect(
        service.isValidInstagramUrl(
          'https://www.instagram.com/p/ABC123/?utm_source=ig_web',
        ),
      ).toBe(true);
    });

    it('should reject invalid Instagram URLs', () => {
      expect(
        service.isValidInstagramUrl('https://www.tiktok.com/video/123'),
      ).toBe(false);
      expect(service.isValidInstagramUrl('https://www.instagram.com/')).toBe(
        false,
      );
      expect(service.isValidInstagramUrl('not-a-url')).toBe(false);
      expect(
        service.isValidInstagramUrl('https://www.instagram.com/testuser/'),
      ).toBe(false);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from post URL', () => {
      expect(
        service.extractVideoId('https://www.instagram.com/p/ABC123/'),
      ).toBe('ABC123');
    });

    it('should extract video ID from reel URL', () => {
      expect(
        service.extractVideoId('https://www.instagram.com/reel/XYZ789/'),
      ).toBe('XYZ789');
    });

    it('should extract video ID from TV URL', () => {
      expect(
        service.extractVideoId('https://www.instagram.com/tv/DEF456/'),
      ).toBe('DEF456');
    });

    it('should extract video ID from URL with username', () => {
      expect(
        service.extractVideoId('https://www.instagram.com/testuser/p/ABC123/'),
      ).toBe('ABC123');
    });

    it('should return null for invalid URL', () => {
      expect(service.extractVideoId('https://www.instagram.com/')).toBeNull();
      expect(service.extractVideoId('not-a-url')).toBeNull();
    });
  });

  describe('extractUsername', () => {
    it('should extract username when present', () => {
      expect(
        service.extractUsername('https://www.instagram.com/testuser/p/ABC123/'),
      ).toBe('testuser');
      expect(
        service.extractUsername(
          'https://www.instagram.com/another_user/reel/XYZ789/',
        ),
      ).toBe('another_user');
    });

    it('should return null when username is not present', () => {
      expect(
        service.extractUsername('https://www.instagram.com/p/ABC123/'),
      ).toBeNull();
      expect(
        service.extractUsername('https://www.instagram.com/reel/XYZ789/'),
      ).toBeNull();
    });

    it('should handle usernames with dots and underscores', () => {
      expect(
        service.extractUsername(
          'https://www.instagram.com/user.name_123/p/ABC123/',
        ),
      ).toBe('user.name_123');
    });
  });

  describe('processInstagramUrl', () => {
    const validUrl = 'https://www.instagram.com/p/ABC123/';

    it('should reject invalid Instagram URL', async () => {
      await expect(
        service.processInstagramUrl('https://www.tiktok.com/video/123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return already_processed status if video exists in database', async () => {
      mockPrismaService.videoTranscript.findFirst.mockResolvedValue({
        id: 'existing-transcript',
        sourceUrl: validUrl,
        sourceType: 'instagram',
      });

      const result = await service.processInstagramUrl(validUrl);

      expect(result.status).toBe('already_processed');
      expect(result.videoId).toBe('ABC123');
      expect(result.transcriptId).toBe('existing-transcript');
    });

    it('should return download instructions for new video', async () => {
      mockPrismaService.videoTranscript.findFirst.mockResolvedValue(null);

      const result = await service.processInstagramUrl(validUrl);

      expect(result.status).toBe('awaiting_upload');
      expect(result.videoId).toBe('ABC123');
      expect(result.instructions).toBeDefined();
      expect(result.instructions?.step1).toContain('manually download');
      expect(result.instructions?.tools).toBeInstanceOf(Array);
      expect(result.instructions?.legal_notice).toContain('IMPORTANT');
    });

    it('should include username when present in URL', async () => {
      const urlWithUsername = 'https://www.instagram.com/testuser/p/ABC123/';
      mockPrismaService.videoTranscript.findFirst.mockResolvedValue(null);

      const result = await service.processInstagramUrl(urlWithUsername);

      expect(result.username).toBe('testuser');
    });
  });

  describe('processUploadedVideo', () => {
    const mockUpload = {
      url: 'https://www.instagram.com/p/ABC123/',
      filePath: '/tmp/test-video.mp4',
      fileName: 'test-video.mp4',
      fileSize: 10 * 1024 * 1024, // 10 MB
      metadata: {
        username: 'testuser',
        caption: 'Test caption',
        hashtags: ['test', 'research'],
      },
    };

    const mockThemes = [
      {
        theme: 'Climate Change',
        relevanceScore: 0.9,
        keywords: ['climate', 'change'],
        summary: 'Discussion about climate change',
        timestamps: [],
        quotes: [],
      },
    ];

    it('should process uploaded video successfully', async () => {
      // Mock file validation (will be skipped in this test)
      jest
        .spyOn(service as any, 'validateUploadedFile')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'storeUploadedFile')
        .mockResolvedValue('/tmp/stored-video.mp4');

      // Mock transcription
      jest.spyOn(service as any, 'transcribeUploadedVideo').mockResolvedValue({
        id: 'transcript-123',
        transcript: 'Test transcript',
        confidence: 0.9,
      });

      // Mock theme extraction
      mockMultimediaAnalysisService.extractThemesFromTranscript.mockResolvedValue(
        mockThemes,
      );

      // Mock social media content storage
      mockPrismaService.socialMediaContent.upsert.mockResolvedValue({});

      // Mock cleanup
      jest.spyOn(service as any, 'cleanupFile').mockResolvedValue(undefined);

      const result = await service.processUploadedVideo(
        mockUpload,
        'climate change research',
      );

      expect(result.videoId).toBe('ABC123');
      expect(result.transcript?.id).toBe('transcript-123');
      expect(result.themes).toEqual(mockThemes);
      expect(result.metadata.username).toBe('testuser');
      expect(result.metadata.hashtags).toContain('test');
      expect(result.relevanceScore).toBeGreaterThan(0);
    });

    it('should handle video processing errors', async () => {
      jest
        .spyOn(service as any, 'validateUploadedFile')
        .mockRejectedValue(new Error('Validation failed'));

      await expect(service.processUploadedVideo(mockUpload)).rejects.toThrow(
        'Failed to process Instagram video',
      );
    });
  });

  describe('getProcessingStatus', () => {
    const url = 'https://www.instagram.com/p/ABC123/';

    it('should return not_processed status if video not in database', async () => {
      mockPrismaService.videoTranscript.findFirst.mockResolvedValue(null);

      const result = await service.getProcessingStatus(url);

      expect(result.status).toBe('not_processed');
      expect(result.message).toContain('not been processed');
    });

    it('should return processed status with details if video exists', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        processedAt: new Date(),
        themes: [{ id: '1' }, { id: '2' }],
      };

      mockPrismaService.videoTranscript.findFirst.mockResolvedValue(
        mockTranscript,
      );

      const result = await service.getProcessingStatus(url);

      expect(result.status).toBe('processed');
      expect(result.transcriptId).toBe('transcript-123');
      expect(result.themeCount).toBe(2);
      expect(result.processedAt).toBeDefined();
    });
  });

  describe('Private Helper Methods', () => {
    it('should calculate relevance score correctly', () => {
      const themes = [
        { relevanceScore: 0.9 } as any,
        { relevanceScore: 0.8 } as any,
      ];

      const score = service['calculateRelevanceScore'](themes);

      expect(score).toBe(0.85); // (0.9 + 0.8) / 2
    });

    it('should return 0 for empty themes', () => {
      const score = service['calculateRelevanceScore']([]);
      expect(score).toBe(0);
    });

    it('should generate unique video ID from URL', () => {
      const url = 'https://www.instagram.com/p/ABC123/';
      const videoId1 = service['generateVideoId'](url);
      const videoId2 = service['generateVideoId'](url);

      expect(videoId1).toBe(videoId2); // Same URL should generate same ID
      expect(videoId1).toHaveLength(12); // MD5 hash truncated to 12 chars

      const differentUrl = 'https://www.instagram.com/p/XYZ789/';
      const differentId = service['generateVideoId'](differentUrl);
      expect(differentId).not.toBe(videoId1); // Different URL should generate different ID
    });
  });

  describe('getLegalDisclaimer', () => {
    it('should return legal disclaimer text', () => {
      const disclaimer = service.getLegalDisclaimer();

      expect(disclaimer).toContain('LEGAL NOTICE');
      expect(disclaimer).toContain('Instagram Content Usage');
      expect(disclaimer).toContain('legal right');
      expect(disclaimer).toContain('Terms of Service');
      expect(disclaimer).toContain('copyright');
      expect(disclaimer).toContain('academic/research purposes');
    });

    it('should mention that platform does not scrape Instagram', () => {
      const disclaimer = service.getLegalDisclaimer();

      expect(disclaimer).toContain('does not access Instagram');
      expect(disclaimer).toContain('manually downloaded');
    });
  });

  describe('File Validation', () => {
    it('should validate file size within limits', async () => {
      const upload = {
        filePath: '/tmp/test.mp4',
        fileName: 'test.mp4',
        fileSize: 100 * 1024 * 1024, // 100 MB - valid
        url: 'https://www.instagram.com/p/ABC123/',
      };

      // Mock file access
      const fs = require('fs/promises');
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);

      await expect(
        service['validateUploadedFile'](upload as any),
      ).resolves.not.toThrow();
    });

    it('should reject file exceeding size limit', async () => {
      const upload = {
        filePath: '/tmp/test.mp4',
        fileName: 'test.mp4',
        fileSize: 600 * 1024 * 1024, // 600 MB - exceeds 500 MB limit
        url: 'https://www.instagram.com/p/ABC123/',
      };

      await expect(
        service['validateUploadedFile'](upload as any),
      ).rejects.toThrow('File size exceeds maximum');
    });

    it('should reject invalid file extension', async () => {
      const upload = {
        filePath: '/tmp/test.txt',
        fileName: 'test.txt',
        fileSize: 10 * 1024 * 1024,
        url: 'https://www.instagram.com/p/ABC123/',
      };

      await expect(
        service['validateUploadedFile'](upload as any),
      ).rejects.toThrow('Invalid file type');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const upload = {
        url: 'https://www.instagram.com/p/ABC123/',
        filePath: '/tmp/test.mp4',
        fileName: 'test.mp4',
        fileSize: 10 * 1024 * 1024,
      };

      jest
        .spyOn(service as any, 'validateUploadedFile')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'storeUploadedFile')
        .mockRejectedValue(new Error('Storage failed'));

      await expect(service.processUploadedVideo(upload as any)).rejects.toThrow(
        'Failed to process Instagram video',
      );
    });

    it('should log warnings on social media content storage failure', async () => {
      mockPrismaService.socialMediaContent.upsert.mockRejectedValue(
        new Error('Database error'),
      );

      // This should not throw, just log a warning
      await expect(
        service['storeSocialMediaContent'](
          'video123',
          'transcript123',
          {} as any,
        ),
      ).resolves.not.toThrow();
    });

    it('should log warnings on cleanup failure', async () => {
      // This should not throw, just log a warning
      await expect(
        service['cleanupFile']('/nonexistent/file.mp4'),
      ).resolves.not.toThrow();
    });
  });
});
