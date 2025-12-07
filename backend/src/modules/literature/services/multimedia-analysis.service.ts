import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { UnifiedThemeExtractionService } from './unified-theme-extraction.service';

export interface ExtractedTheme {
  theme: string;
  relevanceScore: number;
  timestamps: Array<{ start: number; end: number }>;
  keywords: string[];
  summary: string;
  quotes: Array<{ timestamp: number; quote: string }>;
}

export interface ExtractedCitation {
  citedWork: string;
  citationType: 'mention' | 'citation' | 'reference';
  timestamp: number;
  context: string;
  confidence: number;
  parsedCitation?: {
    author?: string;
    title?: string;
    year?: number;
    doi?: string;
  };
}

/**
 * Phase 10.106 Phase 10: Theme source type definitions
 * Netflix-grade: Full type safety for internal data
 */
export interface ThemeSourceTimestamp {
  start: number;
  end: number;
  text?: string;
}

export interface ThemeSourceQuote {
  timestamp: number;
  quote: string;
}

export interface ThemeSource {
  timestamps?: ThemeSourceTimestamp[];
  quotes?: ThemeSourceQuote[];
}

@Injectable()
export class MultiMediaAnalysisService {
  private readonly logger = new Logger(MultiMediaAnalysisService.name);
  private readonly openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private unifiedThemeService?: UnifiedThemeExtractionService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Extract research themes from video/podcast transcript (UNIFIED)
   *
   * Phase 9 Day 20: Now delegates to UnifiedThemeExtractionService for full provenance
   * Falls back to legacy method if unified service not available
   */
  async extractThemesFromTranscript(
    transcriptId: string,
    researchContext?: string,
  ): Promise<ExtractedTheme[]> {
    // Phase 9 Day 20: Use unified theme extraction if available
    if (this.unifiedThemeService) {
      return this.extractThemesUnified(transcriptId, researchContext);
    }

    // Legacy method (for backward compatibility)
    return this.extractThemesLegacy(transcriptId, researchContext);
  }

  /**
   * NEW: Extract themes using unified service with full provenance tracking
   * Phase 9 Day 20 Implementation
   */
  private async extractThemesUnified(
    transcriptId: string,
    researchContext?: string,
  ): Promise<ExtractedTheme[]> {
    this.logger.log(
      `[UNIFIED] Extracting themes from transcript: ${transcriptId}`,
    );

    // Get transcript to determine source type
    const transcript = await this.prisma.videoTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      throw new Error(`Transcript not found: ${transcriptId}`);
    }

    // Determine source type
    const sourceType = transcript.sourceType as
      | 'youtube'
      | 'podcast'
      | 'tiktok'
      | 'instagram';

    // Extract themes using unified service
    const unifiedThemes =
      await this.unifiedThemeService!.extractThemesFromSource(
        sourceType,
        [transcript.sourceId], // Use sourceId, not transcriptId
        {
          researchContext,
          maxThemes: 10,
        },
      );

    // Convert unified themes to ExtractedTheme format for backward compatibility
    const extractedThemes: ExtractedTheme[] = unifiedThemes.map((theme) => ({
      theme: theme.label,
      relevanceScore: theme.weight,
      timestamps: this.extractTimestampsFromSources(theme.sources),
      keywords: theme.keywords,
      summary: theme.description || '',
      quotes: this.extractQuotesFromSources(theme.sources),
    }));

    // Also store in legacy TranscriptTheme table for backward compatibility
    await this.storeThemes(transcriptId, extractedThemes);

    this.logger.log(
      `[UNIFIED] Extracted ${extractedThemes.length} themes with full provenance`,
    );

    return extractedThemes;
  }

  /**
   * Extract timestamps from unified theme sources
   */
  private extractTimestampsFromSources(
    sources: ThemeSource[],
  ): Array<{ start: number; end: number }> {
    const timestamps: Array<{ start: number; end: number }> = [];

    for (const source of sources) {
      if (source.timestamps && Array.isArray(source.timestamps)) {
        timestamps.push(
          ...source.timestamps.map((t: ThemeSourceTimestamp) => ({
            start: t.start,
            end: t.end,
          })),
        );
      }
    }

    return timestamps;
  }

  /**
   * Extract quotes from unified theme sources
   */
  private extractQuotesFromSources(
    sources: ThemeSource[],
  ): Array<{ timestamp: number; quote: string }> {
    const quotes: Array<{ timestamp: number; quote: string }> = [];

    for (const source of sources) {
      if (source.timestamps && Array.isArray(source.timestamps)) {
        for (const segment of source.timestamps) {
          if (segment.text) {
            quotes.push({
              timestamp: segment.start,
              quote: segment.text,
            });
          }
        }
      }
    }

    return quotes.slice(0, 5); // Limit to 5 quotes
  }

  /**
   * LEGACY: Extract research themes from video/podcast transcript
   * Kept for backward compatibility
   * @deprecated Use extractThemesUnified instead
   */
  private async extractThemesLegacy(
    transcriptId: string,
    researchContext?: string,
  ): Promise<ExtractedTheme[]> {
    this.logger.log(`Extracting themes from transcript: ${transcriptId}`);

    const transcript = await this.prisma.videoTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      throw new Error(`Transcript not found: ${transcriptId}`);
    }

    const prompt = `You are a research analysis AI. Analyze this video/podcast transcript and extract research themes.

**Task:** Extract 5-10 main research themes from this transcript.

**Context:** ${researchContext || 'General research literature review'}

**For each theme, provide:**
1. Theme label (2-5 words)
2. Relevance score (0-1)
3. Keywords (3-7 words)
4. Brief summary (1-2 sentences)
5. 1-3 key quotes that represent this theme

**Transcript:**
${transcript.transcript}

**Timestamped Segments:**
${JSON.stringify((transcript.timestampedText as any[]).slice(0, 50))} // First 50 segments

Respond in JSON format:
{
  "themes": [
    {
      "theme": "Climate Change Adaptation",
      "relevanceScore": 0.95,
      "keywords": ["adaptation", "resilience", "mitigation"],
      "summary": "Discusses strategies for adapting to climate change...",
      "quotes": [
        {"timestamp": 120, "quote": "..."}
      ]
    }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const themes: ExtractedTheme[] = result.themes;

    // Map timestamps from transcript segments
    const timestampedSegments = transcript.timestampedText as any[];
    for (const theme of themes) {
      theme.timestamps = this.findThemeTimestamps(
        theme.keywords,
        timestampedSegments,
      );
    }

    // Store themes in database
    await this.storeThemes(transcriptId, themes);

    // Calculate cost
    const cost = this.calculateGPT4Cost(
      response.usage || { prompt_tokens: 0, completion_tokens: 0 },
    );
    await this.prisma.videoTranscript.update({
      where: { id: transcriptId },
      data: { analysisCost: cost },
    });

    this.logger.log(
      `Extracted ${themes.length} themes (cost: $${cost.toFixed(4)})`,
    );

    return themes;
  }

  /**
   * Find timestamps where theme keywords appear in transcript
   */
  private findThemeTimestamps(
    keywords: string[],
    segments: Array<{ timestamp: number; text: string }>,
  ): Array<{ start: number; end: number }> {
    const timestamps: Array<{ start: number; end: number }> = [];
    const keywordSet = new Set(keywords.map((k) => k.toLowerCase()));

    for (let i = 0; i < segments.length; i++) {
      const text = segments[i].text.toLowerCase();
      const hasKeyword = Array.from(keywordSet).some((kw) => text.includes(kw));

      if (hasKeyword) {
        const start = segments[i].timestamp;
        const end = segments[i + 1]?.timestamp || start + 10;
        timestamps.push({ start, end });
      }
    }

    return timestamps;
  }

  /**
   * Store themes in database
   */
  private async storeThemes(
    transcriptId: string,
    themes: ExtractedTheme[],
  ): Promise<void> {
    await this.prisma.transcriptTheme.createMany({
      data: themes.map((theme) => ({
        transcriptId,
        theme: theme.theme,
        relevanceScore: theme.relevanceScore,
        timestamps: theme.timestamps,
        keywords: theme.keywords, // SQLite: Json type (array will be stored as JSON)
        summary: theme.summary,
        quotes: theme.quotes,
      })),
    });
  }

  /**
   * Extract citations from transcript
   * Identifies when speaker mentions papers, studies, or authors
   */
  async extractCitationsFromTranscript(
    transcriptId: string,
  ): Promise<ExtractedCitation[]> {
    this.logger.log(`Extracting citations from transcript: ${transcriptId}`);

    const transcript = await this.prisma.videoTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      throw new Error(`Transcript not found: ${transcriptId}`);
    }

    const prompt = `You are a research citation extractor. Identify all citations, references to papers, studies, or authors in this transcript.

**Task:** Find all mentions of academic papers, studies, authors, or research findings.

**Transcript with timestamps:**
${JSON.stringify(transcript.timestampedText)}

**For each citation, extract:**
1. Cited work (author, title, or claim)
2. Citation type: 'mention' (casual reference), 'citation' (explicit paper reference), or 'reference' (crediting source)
3. Timestamp where it occurs
4. Context (surrounding text)
5. Confidence (0-1)
6. If possible, parse: author, title, year, DOI

**Examples:**
- "Smith et al. 2020 found that..." → citation
- "A recent study showed..." → mention
- "According to the literature..." → reference

Respond in JSON format:
{
  "citations": [
    {
      "citedWork": "Smith et al. (2020) - Climate adaptation strategies",
      "citationType": "citation",
      "timestamp": 145,
      "context": "...as Smith et al. 2020 found that local...",
      "confidence": 0.9,
      "parsedCitation": {"author": "Smith", "year": 2020}
    }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const citations: ExtractedCitation[] = result.citations;

    // Store citations in database
    await this.prisma.multimediaCitation.createMany({
      data: citations.map((cit) => ({
        transcriptId,
        citedWork: cit.citedWork,
        citationType: cit.citationType,
        timestamp: cit.timestamp,
        context: cit.context,
        confidence: cit.confidence,
        parsedCitation: cit.parsedCitation,
      })),
    });

    this.logger.log(`Extracted ${citations.length} citations`);

    return citations;
  }

  /**
   * Calculate GPT-4 cost based on token usage
   */
  private calculateGPT4Cost(usage: {
    prompt_tokens: number;
    completion_tokens: number;
  }): number {
    const inputCost = (usage.prompt_tokens / 1000) * 0.01; // $0.01 per 1K input tokens
    const outputCost = (usage.completion_tokens / 1000) * 0.03; // $0.03 per 1K output tokens
    return inputCost + outputCost;
  }

  /**
   * Get themes for a transcript
   */
  async getThemesForTranscript(
    transcriptId: string,
  ): Promise<ExtractedTheme[]> {
    const themes = await this.prisma.transcriptTheme.findMany({
      where: { transcriptId },
      orderBy: { relevanceScore: 'desc' },
    });

    return themes.map((theme) => ({
      theme: theme.theme,
      relevanceScore: theme.relevanceScore,
      timestamps: theme.timestamps as any,
      keywords: theme.keywords as any, // SQLite: Json type (parse as array)
      summary: theme.summary || '',
      quotes: theme.quotes as any,
    }));
  }

  /**
   * Get citations for a transcript
   */
  async getCitationsForTranscript(
    transcriptId: string,
  ): Promise<ExtractedCitation[]> {
    const citations = await this.prisma.multimediaCitation.findMany({
      where: { transcriptId },
      orderBy: { timestamp: 'asc' },
    });

    return citations.map((cit) => ({
      citedWork: cit.citedWork,
      citationType: cit.citationType as any,
      timestamp: cit.timestamp,
      context: cit.context,
      confidence: cit.confidence,
      parsedCitation: cit.parsedCitation as any,
    }));
  }
}
