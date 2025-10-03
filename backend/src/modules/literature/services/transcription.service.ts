import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/common/prisma.service';
import { firstValueFrom } from 'rxjs';
import youtubedl from 'youtube-dl-exec';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import OpenAI from 'openai';

export interface TranscriptWithTimestamps {
  id: string;
  sourceId: string;
  sourceType: 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  transcript: string;
  timestampedText: Array<{
    timestamp: number;
    text: string;
    speaker?: string;
  }>;
  duration: number;
  confidence?: number;
  cost: number;
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly openai: OpenAI;
  private readonly tempDir = '/tmp/vqmethod-transcriptions';
  private readonly maxDuration = 7200; // 2 hours (cost management)

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      this.logger.warn('OpenAI API key not configured - transcription will not work');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Get or create transcription (with caching to save costs)
   */
  async getOrCreateTranscription(
    sourceId: string,
    sourceType: 'youtube' | 'podcast' | 'tiktok' | 'instagram',
    sourceUrl?: string,
  ): Promise<TranscriptWithTimestamps> {
    // Check cache first
    const existing = await this.prisma.videoTranscript.findUnique({
      where: { sourceId_sourceType: { sourceId, sourceType } },
    });

    if (existing) {
      this.logger.log(`Using cached transcription for ${sourceType}:${sourceId}`);
      return {
        id: existing.id,
        sourceId: existing.sourceId,
        sourceType: existing.sourceType as any,
        transcript: existing.transcript,
        timestampedText: existing.timestampedText as any,
        duration: existing.duration,
        confidence: existing.confidence || undefined,
        cost: 0, // Already paid for
      };
    }

    // Create new transcription
    this.logger.log(`Creating new transcription for ${sourceType}:${sourceId}`);

    switch (sourceType) {
      case 'youtube':
        return this.transcribeYouTubeVideo(sourceId);
      case 'podcast':
        if (!sourceUrl) throw new Error('Podcast URL required');
        return this.transcribePodcast(sourceUrl);
      case 'tiktok':
        return this.transcribeTikTokVideo(sourceId);
      case 'instagram':
        if (!sourceUrl) throw new Error('Instagram URL required');
        return this.transcribeInstagramVideo(sourceUrl);
      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }
  }

  /**
   * Transcribe YouTube video using OpenAI Whisper
   */
  async transcribeYouTubeVideo(videoId: string): Promise<TranscriptWithTimestamps> {
    this.logger.log(`Transcribing YouTube video: ${videoId}`);

    try {
      // 1. Extract audio using yt-dlp
      const audioPath = await this.extractYouTubeAudio(videoId);

      // 2. Get video metadata
      const metadata = await this.getYouTubeMetadata(videoId);

      // 3. Check duration (cost management)
      if (metadata.duration > this.maxDuration) {
        throw new Error(
          `Video duration (${metadata.duration}s) exceeds maximum (${this.maxDuration}s). ` +
          `Estimated cost: $${((metadata.duration / 60) * 0.006).toFixed(2)}`
        );
      }

      // 4. Transcribe with Whisper
      const transcription = await this.transcribeAudioFile(audioPath);

      // 5. Store in database
      const stored = await this.prisma.videoTranscript.create({
        data: {
          sourceId: videoId,
          sourceType: 'youtube',
          sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
          title: metadata.title,
          author: metadata.channel,
          duration: metadata.duration,
          transcript: transcription.text,
          timestampedText: transcription.segments,
          language: metadata.language || 'en',
          confidence: transcription.confidence,
          transcriptionCost: (metadata.duration / 60) * 0.006,
          metadata: {
            channelId: metadata.channelId,
            publishedAt: metadata.publishedAt,
            thumbnails: metadata.thumbnails,
          },
        },
      });

      // 6. Clean up temp file
      await fs.unlink(audioPath);

      return {
        id: stored.id,
        sourceId: stored.sourceId,
        sourceType: 'youtube',
        transcript: stored.transcript,
        timestampedText: stored.timestampedText as any,
        duration: stored.duration,
        confidence: stored.confidence || undefined,
        cost: stored.transcriptionCost || 0,
      };
    } catch (error: any) {
      this.logger.error(`Failed to transcribe YouTube video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Extract audio from YouTube video
   */
  private async extractYouTubeAudio(videoId: string): Promise<string> {
    await fs.mkdir(this.tempDir, { recursive: true });
    const outputPath = path.join(this.tempDir, `${videoId}.mp3`);

    try {
      await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: outputPath,
      });

      return outputPath;
    } catch (error: any) {
      this.logger.error(`Failed to extract audio from YouTube video ${videoId}:`, error);
      throw new Error('Failed to extract audio from YouTube video');
    }
  }

  /**
   * Get YouTube video metadata
   */
  private async getYouTubeMetadata(videoId: string): Promise<any> {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');

    if (!apiKey || apiKey === 'your-youtube-api-key-here') {
      // Fallback: use yt-dlp to get metadata
      const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpSingleJson: true,
        noWarnings: true,
        callHome: false,
        preferFreeFormats: true,
      }) as any;

      return {
        title: info.title,
        channel: info.uploader || info.channel,
        channelId: info.channel_id,
        duration: info.duration,
        publishedAt: info.upload_date,
        thumbnails: info.thumbnails,
        language: info.language,
      };
    }

    // Use YouTube Data API v3
    const response = await firstValueFrom(
      this.httpService.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          key: apiKey,
          id: videoId,
          part: 'snippet,contentDetails',
        },
      })
    );

    const video = response.data.items[0];
    return {
      title: video.snippet.title,
      channel: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      duration: this.parseYouTubeDuration(video.contentDetails.duration),
      publishedAt: video.snippet.publishedAt,
      thumbnails: video.snippet.thumbnails,
      language: video.snippet.defaultLanguage || 'en',
    };
  }

  /**
   * Parse ISO 8601 duration (PT1H2M3S) to seconds
   */
  private parseYouTubeDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  private async transcribeAudioFile(audioPath: string): Promise<{
    text: string;
    segments: Array<{ timestamp: number; text: string }>;
    confidence: number;
  }> {
    this.logger.log(`Transcribing audio file: ${audioPath}`);

    try {
      const audioFile = await fs.readFile(audioPath);
      const blob = new Blob([audioFile], { type: 'audio/mp3' });

      const transcription = await this.openai.audio.transcriptions.create({
        file: blob as any,
        model: 'whisper-1',
        response_format: 'verbose_json', // Get timestamps
        timestamp_granularities: ['segment'], // Word-level timestamps
      });

      // Process segments with timestamps
      const segments = (transcription as any).segments?.map((seg: any) => ({
        timestamp: Math.floor(seg.start),
        text: seg.text.trim(),
      })) || [];

      // Calculate average confidence (if available)
      const avgConfidence = (transcription as any).segments?.reduce(
        (sum: number, seg: any) => sum + (seg.confidence || 0.9),
        0
      ) / ((transcription as any).segments?.length || 1);

      return {
        text: transcription.text,
        segments,
        confidence: avgConfidence,
      };
    } catch (error: any) {
      this.logger.error('Whisper transcription failed:', error);
      throw new Error('Failed to transcribe audio with Whisper API');
    }
  }

  /**
   * Transcribe podcast from URL or audio file
   */
  async transcribePodcast(
    podcastUrl: string,
    metadata?: {
      title?: string;
      showName?: string;
      episodeNumber?: number;
    }
  ): Promise<TranscriptWithTimestamps> {
    this.logger.log(`Transcribing podcast: ${podcastUrl}`);

    // 1. Download podcast audio
    const audioPath = await this.downloadAudio(podcastUrl);

    // 2. Get audio duration
    const duration = await this.getAudioDuration(audioPath);

    if (duration > this.maxDuration) {
      await fs.unlink(audioPath);
      throw new Error(`Podcast duration (${duration}s) exceeds maximum (${this.maxDuration}s)`);
    }

    // 3. Transcribe
    const transcription = await this.transcribeAudioFile(audioPath);

    // 4. Store in database
    const stored = await this.prisma.videoTranscript.create({
      data: {
        sourceId: podcastUrl,
        sourceType: 'podcast',
        sourceUrl: podcastUrl,
        title: metadata?.title || 'Untitled Podcast',
        author: metadata?.showName || 'Unknown',
        duration,
        transcript: transcription.text,
        timestampedText: transcription.segments,
        language: 'en',
        confidence: transcription.confidence,
        transcriptionCost: (duration / 60) * 0.006,
        metadata: {
          episodeNumber: metadata?.episodeNumber,
        },
      },
    });

    // 5. Clean up
    await fs.unlink(audioPath);

    return {
      id: stored.id,
      sourceId: stored.sourceId,
      sourceType: 'podcast',
      transcript: stored.transcript,
      timestampedText: stored.timestampedText as any,
      duration: stored.duration,
      confidence: stored.confidence || undefined,
      cost: stored.transcriptionCost || 0,
    };
  }

  /**
   * Download audio file from URL
   */
  private async downloadAudio(url: string): Promise<string> {
    await fs.mkdir(this.tempDir, { recursive: true });
    const filename = `podcast-${Date.now()}.mp3`;
    const outputPath = path.join(this.tempDir, filename);

    const response = await firstValueFrom(
      this.httpService.get(url, { responseType: 'arraybuffer' })
    );

    await fs.writeFile(outputPath, Buffer.from(response.data));
    return outputPath;
  }

  /**
   * Get audio file duration using ffprobe
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(Math.floor(metadata.format.duration || 0));
      });
    });
  }

  /**
   * Transcribe TikTok video (placeholder - requires TikTok Research API)
   */
  /**
   * Transcribe TikTok video
   * NOTE: Implementation delegated to TikTokResearchService
   * This method exists for interface compatibility
   */
  async transcribeTikTokVideo(videoId: string): Promise<TranscriptWithTimestamps> {
    // This is now handled by TikTokResearchService.transcribeTikTokVideo()
    // Keep this method for backward compatibility
    this.logger.log(`TikTok transcription request delegated to TikTokResearchService: ${videoId}`);

    throw new Error(
      'TikTok transcription is now handled by TikTokResearchService. ' +
      'Please use TikTokResearchService.transcribeTikTokVideo() instead. ' +
      'See Phase 9 Day 19 Task 1 implementation.'
    );
  }

  /**
   * Transcribe Instagram video (manual upload method)
   * NOTE: Implementation delegated to InstagramManualService
   * This method exists for interface compatibility
   */
  async transcribeInstagramVideo(url: string): Promise<TranscriptWithTimestamps> {
    // This is now handled by InstagramManualService.processUploadedVideo()
    // Keep this method for backward compatibility
    this.logger.log(`Instagram transcription request delegated to InstagramManualService: ${url}`);

    throw new Error(
      'Instagram transcription is now handled by InstagramManualService. ' +
      'Please use InstagramManualService.processInstagramUrl() and processUploadedVideo() instead. ' +
      'See Phase 9 Day 19 Task 2 implementation.'
    );
  }

  /**
   * Calculate cost estimate before transcription
   */
  async estimateTranscriptionCost(
    sourceId: string,
    sourceType: 'youtube' | 'podcast'
  ): Promise<{ duration: number; estimatedCost: number }> {
    let duration: number;

    if (sourceType === 'youtube') {
      const metadata = await this.getYouTubeMetadata(sourceId);
      duration = metadata.duration;
    } else {
      // For podcasts, would need to fetch metadata or allow user to provide
      duration = 3600; // Default estimate: 1 hour
    }

    return {
      duration,
      estimatedCost: (duration / 60) * 0.006, // $0.006 per minute
    };
  }
}
