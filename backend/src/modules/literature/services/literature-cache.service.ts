/**
 * Phase 10 Day 18: Iterative Theme Extraction - Literature Cache Service
 *
 * Implements content caching and corpus management for iterative theme extraction.
 * Reduces API costs by caching full-text content and embeddings.
 *
 * Research Backing:
 * - Braun & Clarke (2006, 2019): Reflexive Thematic Analysis requires iterative refinement
 * - Glaser & Strauss (1967): Theoretical saturation requires adding sources until no new themes emerge
 * - Noblit & Hare (1988): Meta-ethnography requires corpus building, not one-shot synthesis
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import * as crypto from 'crypto';

export interface CachedContent {
  id: string;
  paperId: string;
  fullTextContent: string;
  fullTextHash: string;
  wordCount: number;
  embeddings?: number[];
  processedAt: Date;
  lastUsedAt: Date;
  extractionCount: number;
}

export interface CorpusStats {
  totalPapers: number;
  cachedCount: number;
  totalExtractions: number;
  estimatedCostSaved: number; // in USD
  averageReuse: number;
}

export interface CorpusInfo {
  id: string;
  userId: string;
  name: string;
  purpose: string;
  paperIds: string[];
  themeCount: number;
  lastExtractedAt: Date;
  isSaturated: boolean;
  saturationConfidence?: number;
  costSaved: number;
  totalExtractions: number;
}

@Injectable()
export class LiteratureCacheService {
  private readonly logger = new Logger(LiteratureCacheService.name);

  // API cost constants (approximate)
  private readonly COST_PER_1K_TOKENS_EMBEDDING = 0.0001; // OpenAI text-embedding-3-small
  private readonly COST_PER_1K_TOKENS_COMPLETION = 0.015; // GPT-4 turbo
  private readonly AVG_WORDS_PER_TOKEN = 0.75;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Store full-text content in cache
   */
  async cacheFullText(
    paperId: string,
    userId: string,
    content: string
  ): Promise<void> {
    const hash = this.generateContentHash(content);
    const wordCount = this.countWords(content);

    try {
      await this.prisma.processedLiterature.upsert({
        where: {
          paperId_userId: { paperId, userId },
        },
        create: {
          paperId,
          userId,
          fullTextContent: content,
          fullTextHash: hash,
          wordCount,
          processedAt: new Date(),
          lastUsedAt: new Date(),
          extractionCount: 1,
        },
        update: {
          fullTextContent: content,
          fullTextHash: hash,
          wordCount,
          lastUsedAt: new Date(),
          extractionCount: { increment: 1 },
        },
      });

      this.logger.log(`Cached full-text for paper ${paperId} (${wordCount} words)`);
    } catch (error) {
      this.logger.error(`Failed to cache full-text for paper ${paperId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve cached full-text content
   */
  async getCachedFullText(
    paperId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const cached = await this.prisma.processedLiterature.findUnique({
        where: {
          paperId_userId: { paperId, userId },
        },
      });

      if (cached) {
        // Update last used timestamp
        await this.prisma.processedLiterature.update({
          where: { id: cached.id },
          data: { lastUsedAt: new Date() },
        });

        this.logger.debug(`Cache HIT for paper ${paperId}`);
        return cached.fullTextContent;
      }

      this.logger.debug(`Cache MISS for paper ${paperId}`);
      return null;
    } catch (error) {
      this.logger.error(`Error retrieving cached content for paper ${paperId}:`, error);
      return null;
    }
  }

  /**
   * Store embeddings in cache
   */
  async cacheEmbeddings(
    paperId: string,
    userId: string,
    embeddings: number[]
  ): Promise<void> {
    try {
      const existing = await this.prisma.processedLiterature.findUnique({
        where: {
          paperId_userId: { paperId, userId },
        },
      });

      if (!existing) {
        throw new Error(`No cached content found for paper ${paperId}`);
      }

      await this.prisma.processedLiterature.update({
        where: { id: existing.id },
        data: {
          embeddings: embeddings as any, // Store as JSON
          lastUsedAt: new Date(),
        },
      });

      this.logger.log(`Cached embeddings for paper ${paperId} (${embeddings.length} dimensions)`);
    } catch (error) {
      this.logger.error(`Failed to cache embeddings for paper ${paperId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve cached embeddings
   */
  async getCachedEmbeddings(
    paperId: string,
    userId: string
  ): Promise<number[] | null> {
    try {
      const cached = await this.prisma.processedLiterature.findUnique({
        where: {
          paperId_userId: { paperId, userId },
        },
        select: { embeddings: true },
      });

      if (cached?.embeddings) {
        this.logger.debug(`Embeddings cache HIT for paper ${paperId}`);
        return cached.embeddings as any as number[];
      }

      this.logger.debug(`Embeddings cache MISS for paper ${paperId}`);
      return null;
    } catch (error) {
      this.logger.error(`Error retrieving cached embeddings for paper ${paperId}:`, error);
      return null;
    }
  }

  /**
   * Check if paper is already processed and cached
   */
  async isPaperProcessed(paperId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.prisma.processedLiterature.count({
        where: {
          paperId,
          userId,
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if paper ${paperId} is processed:`, error);
      return false;
    }
  }

  /**
   * Get corpus statistics for cost analysis
   */
  async getCorpusStats(userId: string): Promise<CorpusStats> {
    try {
      const cached = await this.prisma.processedLiterature.findMany({
        where: { userId },
        select: {
          extractionCount: true,
          wordCount: true,
          embeddings: true,
        },
      });

      const totalPapers = cached.length;
      const cachedCount = cached.length;
      const totalExtractions = cached.reduce((sum, c) => sum + c.extractionCount, 0);
      const averageReuse = totalPapers > 0 ? totalExtractions / totalPapers : 0;

      // Calculate estimated cost saved
      let costSaved = 0;
      cached.forEach((c) => {
        if (c.extractionCount > 1) {
          const reuses = c.extractionCount - 1; // Subtract initial processing
          const tokens = (c.wordCount / this.AVG_WORDS_PER_TOKEN);
          const embeddingCost = (tokens / 1000) * this.COST_PER_1K_TOKENS_EMBEDDING;
          const completionCost = (tokens / 1000) * this.COST_PER_1K_TOKENS_COMPLETION;
          costSaved += reuses * (embeddingCost + completionCost);
        }
      });

      return {
        totalPapers,
        cachedCount,
        totalExtractions,
        estimatedCostSaved: Math.round(costSaved * 100) / 100, // Round to 2 decimals
        averageReuse: Math.round(averageReuse * 10) / 10,
      };
    } catch (error) {
      this.logger.error(`Error calculating corpus stats for user ${userId}:`, error);
      return {
        totalPapers: 0,
        cachedCount: 0,
        totalExtractions: 0,
        estimatedCostSaved: 0,
        averageReuse: 0,
      };
    }
  }

  /**
   * Create or update extraction corpus
   */
  async saveCorpus(
    userId: string,
    paperIds: string[],
    purpose: string,
    name?: string,
    themeCount?: number
  ): Promise<CorpusInfo> {
    try {
      // Check if corpus with same papers exists
      const existing = await this.prisma.extractionCorpus.findFirst({
        where: {
          userId,
          purpose,
        },
      });

      const corpusData = {
        userId,
        name: name || `Corpus ${new Date().toISOString().split('T')[0]}`,
        purpose,
        paperIds: paperIds as any, // Store as JSON array
        themeCount: themeCount || 0,
        lastExtractedAt: new Date(),
        totalExtractions: existing ? existing.totalExtractions + 1 : 1,
      };

      const corpus = existing
        ? await this.prisma.extractionCorpus.update({
            where: { id: existing.id },
            data: corpusData,
          })
        : await this.prisma.extractionCorpus.create({
            data: corpusData,
          });

      return {
        id: corpus.id,
        userId: corpus.userId,
        name: corpus.name,
        purpose: corpus.purpose,
        paperIds: corpus.paperIds as any as string[],
        themeCount: corpus.themeCount,
        lastExtractedAt: corpus.lastExtractedAt,
        isSaturated: corpus.isSaturated,
        saturationConfidence: corpus.saturationConfidence || undefined,
        costSaved: corpus.costSaved,
        totalExtractions: corpus.totalExtractions,
      };
    } catch (error) {
      this.logger.error(`Error saving corpus for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's extraction corpuses
   */
  async getUserCorpuses(userId: string): Promise<CorpusInfo[]> {
    try {
      const corpuses = await this.prisma.extractionCorpus.findMany({
        where: { userId },
        orderBy: { lastExtractedAt: 'desc' },
      });

      return corpuses.map(c => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        purpose: c.purpose,
        paperIds: c.paperIds as any as string[],
        themeCount: c.themeCount,
        lastExtractedAt: c.lastExtractedAt,
        isSaturated: c.isSaturated,
        saturationConfidence: c.saturationConfidence || undefined,
        costSaved: c.costSaved,
        totalExtractions: c.totalExtractions,
      }));
    } catch (error) {
      this.logger.error(`Error fetching corpuses for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Update saturation status for corpus
   */
  async updateSaturationStatus(
    corpusId: string,
    isSaturated: boolean,
    confidence: number
  ): Promise<void> {
    try {
      await this.prisma.extractionCorpus.update({
        where: { id: corpusId },
        data: {
          isSaturated,
          saturationConfidence: confidence,
        },
      });

      this.logger.log(`Updated saturation status for corpus ${corpusId}: ${isSaturated} (confidence: ${confidence})`);
    } catch (error) {
      this.logger.error(`Error updating saturation status for corpus ${corpusId}:`, error);
      throw error;
    }
  }

  /**
   * Update cost savings for corpus
   */
  async updateCostSavings(corpusId: string, additionalSavings: number): Promise<void> {
    try {
      await this.prisma.extractionCorpus.update({
        where: { id: corpusId },
        data: {
          costSaved: { increment: additionalSavings },
        },
      });
    } catch (error) {
      this.logger.error(`Error updating cost savings for corpus ${corpusId}:`, error);
    }
  }

  /**
   * Clean up old cache entries (optional maintenance)
   */
  async cleanupOldCache(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.processedLiterature.deleteMany({
        where: {
          lastUsedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old cache entries (>${daysOld} days)`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error cleaning up old cache:`, error);
      return 0;
    }
  }

  /**
   * Helper: Generate MD5 hash for content
   */
  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Helper: Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
