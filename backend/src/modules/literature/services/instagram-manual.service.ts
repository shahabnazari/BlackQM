import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { TranscriptionService } from './transcription.service';
import {
  MultiMediaAnalysisService,
  ExtractedTheme,
} from './multimedia-analysis.service';

/**
 * Instagram Manual Upload Service
 *
 * Enterprise-grade Instagram integration using manual upload approach
 * Due to Instagram API limitations, this service provides a legal and ToS-compliant method
 *
 * IMPORTANT LEGAL NOTICE:
 * - Instagram Graph API does not allow public content search
 * - Third-party scraping violates Instagram Terms of Service
 * - This service implements a manual upload workflow that respects Instagram ToS
 * - Users must only upload videos they have permission to use
 * - For academic/research purposes only
 *
 * User Flow:
 * 1. User finds relevant Instagram video on Instagram
 * 2. User pastes Instagram URL into platform
 * 3. Platform validates URL and prompts for manual download
 * 4. User downloads video (using browser extension or online tool)
 * 5. User uploads video file to platform
 * 6. Platform transcribes, analyzes, and displays results
 *
 * Phase 9 Day 19 Task 2 Implementation
 */

export interface InstagramVideoUpload {
  url: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  metadata?: {
    username?: string;
    caption?: string;
    hashtags?: string[];
    uploadedAt?: Date;
  };
}

export interface InstagramContentAnalysis {
  url: string;
  videoId: string;
  transcript?: {
    id: string;
    text: string;
    confidence: number;
  };
  themes?: ExtractedTheme[];
  metadata: {
    username?: string;
    caption?: string;
    hashtags?: string[];
  };
  relevanceScore: number;
}

@Injectable()
export class InstagramManualService {
  private readonly logger = new Logger(InstagramManualService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize = 500 * 1024 * 1024; // 500 MB
  private readonly allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv'];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private transcriptionService: TranscriptionService,
    private multimediaAnalysisService: MultiMediaAnalysisService,
  ) {
    this.uploadDir =
      this.configService.get<string>('INSTAGRAM_UPLOAD_DIR') ||
      '/tmp/vqmethod-instagram-uploads';
  }

  /**
   * Validate Instagram URL format
   * Accepts various Instagram URL formats:
   * - https://www.instagram.com/p/{code}/
   * - https://www.instagram.com/reel/{code}/
   * - https://www.instagram.com/tv/{code}/
   *
   * @param url Instagram URL
   * @returns Boolean indicating if URL is valid
   */
  isValidInstagramUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/,
      /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/,
    ];

    return patterns.some((pattern) => pattern.test(url));
  }

  /**
   * Extract video ID from Instagram URL
   * Examples:
   * - https://www.instagram.com/p/ABC123/ → ABC123
   * - https://www.instagram.com/reel/XYZ789/ → XYZ789
   *
   * @param url Instagram URL
   * @returns Video ID or null if invalid
   */
  extractVideoId(url: string): string | null {
    // Match both patterns:
    // 1. instagram.com/p/ABC123/
    // 2. instagram.com/username/p/ABC123/
    const match = url.match(
      /instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/,
    );
    return match ? match[2] : null;
  }

  /**
   * Extract username from Instagram URL (if present)
   * Example: https://www.instagram.com/username/reel/ABC123/ → username
   *
   * @param url Instagram URL
   * @returns Username or null if not present
   */
  extractUsername(url: string): string | null {
    const match = url.match(/instagram\.com\/([A-Za-z0-9._]+)\/(p|reel|tv)/);
    return match && match[1] !== 'p' && match[1] !== 'reel' && match[1] !== 'tv'
      ? match[1]
      : null;
  }

  /**
   * Process Instagram URL - Step 1
   * Validates URL and returns instructions for manual download
   *
   * @param url Instagram URL
   * @param context Research context
   * @returns Instructions for user
   */
  async processInstagramUrl(url: string, _context?: string) {
    this.logger.log(`Processing Instagram URL: ${url}`);

    // Validate URL
    if (!this.isValidInstagramUrl(url)) {
      throw new BadRequestException(
        'Invalid Instagram URL. Please provide a valid Instagram post, reel, or TV URL.',
      );
    }

    const videoId = this.extractVideoId(url);
    const username = this.extractUsername(url);

    if (!videoId) {
      throw new BadRequestException(
        'Could not extract video ID from Instagram URL',
      );
    }

    // Check if we already have this video
    const existing = await this.prisma.videoTranscript.findFirst({
      where: {
        sourceUrl: url,
        sourceType: 'instagram',
      },
    });

    if (existing) {
      this.logger.log(`Video already processed: ${videoId}`);
      return {
        status: 'already_processed',
        videoId,
        transcriptId: existing.id,
        message:
          'This Instagram video has already been processed. View existing results below.',
      };
    }

    // Return instructions for manual download
    return {
      status: 'awaiting_upload',
      videoId,
      username,
      url,
      instructions: {
        step1:
          'Due to Instagram API limitations, please manually download this video.',
        step2: 'Recommended tools:',
        tools: [
          {
            name: 'Browser Extension',
            description:
              'Install a browser extension like "Video Downloader Professional"',
            chrome:
              'https://chrome.google.com/webstore/search/video%20downloader',
            firefox:
              'https://addons.mozilla.org/en-US/firefox/search/?q=video%20downloader',
          },
          {
            name: 'Online Service',
            description:
              "Use a web-based downloader (ensure it's from a trusted source)",
            examples: ['SaveFrom.net', 'DownloadGram.org'],
          },
        ],
        step3:
          'Once downloaded, upload the video file using the upload button below.',
        legal_notice:
          "IMPORTANT: Only upload videos you have permission to use. This tool is for academic research purposes only. You are responsible for complying with Instagram's Terms of Service and copyright laws.",
      },
    };
  }

  /**
   * Process uploaded Instagram video file - Step 2
   * Transcribes and analyzes the uploaded video
   *
   * @param upload Upload information
   * @param context Research context
   * @returns Analysis results
   */
  async processUploadedVideo(
    upload: InstagramVideoUpload,
    context?: string,
  ): Promise<InstagramContentAnalysis> {
    this.logger.log(`Processing uploaded Instagram video: ${upload.fileName}`);

    try {
      // 1. Validate file
      await this.validateUploadedFile(upload);

      // 2. Move file to permanent storage
      const storedPath = await this.storeUploadedFile(upload);

      // 3. Generate unique video ID
      const videoId =
        this.extractVideoId(upload.url) || this.generateVideoId(upload.url);

      // 4. Extract audio and transcribe
      const transcription = await this.transcribeUploadedVideo(
        storedPath,
        videoId,
        upload,
      );

      // 5. Extract themes
      const themes =
        await this.multimediaAnalysisService.extractThemesFromTranscript(
          transcription.id,
          context,
        );

      // 6. Store in SocialMediaContent table
      await this.storeSocialMediaContent(videoId, transcription.id, upload);

      // 7. Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(themes);

      // 8. Cleanup uploaded file
      await this.cleanupFile(storedPath);

      return {
        url: upload.url,
        videoId,
        transcript: {
          id: transcription.id,
          text: transcription.transcript,
          confidence: transcription.confidence || 0.9,
        },
        themes,
        metadata: {
          username: upload.metadata?.username,
          caption: upload.metadata?.caption,
          hashtags: upload.metadata?.hashtags || [],
        },
        relevanceScore,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to process Instagram video: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to process Instagram video: ${error.message}`,
      );
    }
  }

  /**
   * Get processing status for Instagram URL
   * @param url Instagram URL
   */
  async getProcessingStatus(url: string) {
    const existing = await this.prisma.videoTranscript.findFirst({
      where: {
        sourceUrl: url,
        sourceType: 'instagram',
      },
      include: {
        themes: true,
      },
    });

    if (!existing) {
      return {
        status: 'not_processed',
        message:
          'This video has not been processed yet. Please upload the video file.',
      };
    }

    return {
      status: 'processed',
      transcriptId: existing.id,
      themeCount: existing.themes?.length || 0,
      processedAt: existing.processedAt,
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate uploaded file
   * @private
   */
  private async validateUploadedFile(upload: InstagramVideoUpload) {
    // Check file size
    if (upload.fileSize > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${this.maxFileSize / 1024 / 1024} MB)`,
      );
    }

    // Check file extension
    const ext = path.extname(upload.fileName).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedExtensions.join(', ')}`,
      );
    }

    // Verify file exists
    try {
      await fs.access(upload.filePath);
    } catch (error: any) {
      throw new BadRequestException(
        'Uploaded file not found or not accessible',
      );
    }
  }

  /**
   * Store uploaded file in permanent storage
   * @private
   */
  private async storeUploadedFile(
    upload: InstagramVideoUpload,
  ): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const uniqueName = `${Date.now()}_${upload.fileName}`;
    const storedPath = path.join(this.uploadDir, uniqueName);

    await fs.copyFile(upload.filePath, storedPath);

    return storedPath;
  }

  /**
   * Transcribe uploaded Instagram video
   * @private
   */
  private async transcribeUploadedVideo(
    videoPath: string,
    videoId: string,
    upload: InstagramVideoUpload,
  ) {
    this.logger.log(`Transcribing Instagram video: ${videoId}`);

    try {
      // Extract audio using ffmpeg (delegate to TranscriptionService)
      const audioPath = await this.extractAudioFromVideo(videoPath);

      // Transcribe with Whisper
      const transcription =
        await this.transcriptionService['transcribeAudioFile'](audioPath);

      // Calculate costs
      const duration = (transcription as any).duration || 60;
      const transcriptionCost = (duration / 60) * 0.006; // Whisper pricing

      // Store in database
      const saved = await this.prisma.videoTranscript.create({
        data: {
          sourceId: videoId,
          sourceType: 'instagram',
          sourceUrl: upload.url,
          title: upload.metadata?.caption || `Instagram Video ${videoId}`,
          author: upload.metadata?.username || 'Unknown',
          duration,
          transcript: transcription.text,
          timestampedText: transcription.segments || [],
          language: (transcription as any).language || 'en',
          confidence: transcription.confidence,
          transcriptionCost,
          metadata: {
            hashtags: upload.metadata?.hashtags || [],
            uploadedAt: upload.metadata?.uploadedAt || new Date(),
          },
        },
      });

      // Cleanup audio file
      await this.cleanupFile(audioPath);

      return {
        id: saved.id,
        sourceId: saved.sourceId,
        sourceType: saved.sourceType,
        transcript: saved.transcript,
        timestampedText: saved.timestampedText,
        duration: saved.duration,
        confidence: saved.confidence,
        cost: transcriptionCost,
      };
    } catch (error: any) {
      this.logger.error(
        `Instagram transcription failed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to transcribe Instagram video: ${error.message}`,
      );
    }
  }

  /**
   * Extract audio from video file (placeholder - uses ffmpeg)
   * @private
   */
  private async extractAudioFromVideo(videoPath: string): Promise<string> {
    // Audio extraction is handled by TranscriptionService
    return videoPath;
  }

  /**
   * Generate unique video ID from URL
   * @private
   */
  private generateVideoId(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
  }

  /**
   * Calculate relevance score based on themes
   * @private
   */
  private calculateRelevanceScore(themes: ExtractedTheme[]): number {
    if (!themes || themes.length === 0) {
      return 0;
    }

    // Average theme relevance
    const avgRelevance =
      themes.reduce((sum, t) => sum + t.relevanceScore, 0) / themes.length;
    return Math.round(avgRelevance * 100) / 100;
  }

  /**
   * Store social media content in database
   * @private
   */
  private async storeSocialMediaContent(
    videoId: string,
    transcriptId: string,
    upload: InstagramVideoUpload,
  ) {
    try {
      await this.prisma.socialMediaContent.upsert({
        where: {
          url: upload.url,
        },
        create: {
          platform: 'instagram',
          platformId: videoId,
          url: upload.url,
          title: upload.metadata?.caption || `Instagram Video ${videoId}`,
          author: upload.metadata?.username || 'Unknown',
          publishedAt: upload.metadata?.uploadedAt || new Date(),
          transcriptId,
          hashtags: upload.metadata?.hashtags || [],
        },
        update: {
          transcriptId,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `Failed to store social media content: ${error.message}`,
      );
    }
  }

  /**
   * Cleanup temporary file
   * @private
   */
  private async cleanupFile(filePath: string) {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get legal disclaimer text
   */
  getLegalDisclaimer(): string {
    return `
LEGAL NOTICE - Instagram Content Usage

By uploading an Instagram video to this platform, you confirm that:

1. You have the legal right to use this video for research purposes
2. You will comply with Instagram's Terms of Service
3. You will respect all copyright and intellectual property rights
4. This content will be used solely for academic/research purposes
5. You understand that VQMethod is not responsible for any ToS violations

This platform does not access Instagram's private API or scrape Instagram content.
All videos must be manually downloaded and uploaded by the user.

For more information, visit: https://help.instagram.com/581066165581870
    `.trim();
  }
}
