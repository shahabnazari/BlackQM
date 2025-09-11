# VQMethod Implementation Guide - Part 4

## Phases 6.86-10: AI Features through Pre-Production Readiness

**Document Rule**: Maximum 20,000 tokens per document. Content continues in sequentially numbered parts.  
**Previous Part**: [IMPLEMENTATION_GUIDE_PART3.md](./IMPLEMENTATION_GUIDE_PART3.md) - Phases 6.5-6.85  
**Next Part**: [IMPLEMENTATION_GUIDE_PART5.md](./IMPLEMENTATION_GUIDE_PART5.md) - Phases 11-16

---

# PHASE 6.86: AI-POWERED RESEARCH INTELLIGENCE

**Duration:** 12-14 days  
**Status:** 🔴 NOT STARTED (0%)  
**Target:** AI-assisted study design and participant experience

## 6.86.1 OpenAI Integration Setup

### AI Service Configuration

```typescript
// backend/src/modules/ai/services/openai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CacheService } from '@/common/cache.service';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private models = {
    fast: 'gpt-3.5-turbo-0125',
    smart: 'gpt-4-turbo-preview',
    vision: 'gpt-4-vision-preview',
  };

  constructor(
    private config: ConfigService,
    private cache: CacheService
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY'),
    });
  }

  async generateCompletion(
    prompt: string,
    options: {
      model?: 'fast' | 'smart';
      temperature?: number;
      maxTokens?: number;
      cache?: boolean;
    } = {}
  ) {
    const {
      model = 'fast',
      temperature = 0.7,
      maxTokens = 1000,
      cache = true,
    } = options;

    // Check cache
    if (cache) {
      const cacheKey = `ai:${Buffer.from(prompt).toString('base64').substring(0, 32)}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.models[model],
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });

      const result = completion.choices[0].message.content;

      // Cache result
      if (cache) {
        await this.cache.set(cacheKey, result, 3600); // 1 hour cache
      }

      return result;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  async analyzeText(text: string, analysis: 'sentiment' | 'themes' | 'bias') {
    const prompts = {
      sentiment: `Analyze the sentiment of the following text. Return a JSON object with overall sentiment (positive/negative/neutral) and confidence score (0-1):\n\n${text}`,
      themes: `Extract the main themes from the following text. Return a JSON array of themes with descriptions:\n\n${text}`,
      bias: `Analyze the following text for potential biases. Return a JSON object with identified biases and suggestions for improvement:\n\n${text}`,
    };

    const result = await this.generateCompletion(prompts[analysis], {
      model: 'smart',
      temperature: 0.3,
    });

    return JSON.parse(result);
  }
}
```

### Cost Management Service

```typescript
// backend/src/modules/ai/services/ai-cost.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class AICostService {
  private costPerToken = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
  };

  constructor(private prisma: PrismaService) {}

  async trackUsage(
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);

    await this.prisma.aiUsage.create({
      data: {
        userId,
        model,
        inputTokens,
        outputTokens,
        cost,
        timestamp: new Date(),
      },
    });

    // Check budget limits
    await this.checkBudgetLimit(userId);

    return cost;
  }

  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ) {
    const rates =
      this.costPerToken[model] || this.costPerToken['gpt-3.5-turbo'];
    return (inputTokens * rates.input + outputTokens * rates.output) / 1000;
  }

  async checkBudgetLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const monthlyUsage = await this.getMonthlyUsage(userId);
    const limit = user.subscription?.aiCreditLimit || 10; // $10 default

    if (monthlyUsage > limit) {
      throw new Error('AI credit limit exceeded');
    }
  }

  async getMonthlyUsage(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aiUsage.aggregate({
      where: {
        userId,
        timestamp: { gte: startOfMonth },
      },
      _sum: { cost: true },
    });

    return usage._sum.cost || 0;
  }
}
```

## 6.86.2 AI-Powered Study Design Assistant

### Statement Generation Service

```typescript
// backend/src/modules/ai/services/statement-generator.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Injectable()
export class StatementGeneratorService {
  constructor(private openai: OpenAIService) {}

  async generateStatements(
    topic: string,
    options: {
      count?: number;
      perspectives?: string[];
      avoidBias?: boolean;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
    } = {}
  ) {
    const {
      count = 30,
      perspectives = [],
      avoidBias = true,
      academicLevel = 'intermediate',
    } = options;

    const prompt = this.buildPrompt(
      topic,
      count,
      perspectives,
      avoidBias,
      academicLevel
    );

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.8,
      maxTokens: 2000,
    });

    return this.parseStatements(response);
  }

  private buildPrompt(
    topic: string,
    count: number,
    perspectives: string[],
    avoidBias: boolean,
    level: string
  ) {
    return `Generate ${count} diverse statements for a Q-methodology study about "${topic}".

Requirements:
- Statements should be clear and concise (max 100 characters)
- Cover different perspectives: ${perspectives.join(', ') || 'various viewpoints'}
- Academic level: ${level}
- ${avoidBias ? 'Avoid loaded language and obvious bias' : 'Include provocative statements'}
- Mix positive, negative, and neutral statements
- Ensure statements are sortable on an agree-disagree scale

Format each statement as:
[ID]: [Statement text] | [Perspective] | [Polarity: positive/negative/neutral]

Example:
S01: Electric vehicles are essential for reducing emissions | Environmental | positive
S02: The cost of EVs excludes lower-income families | Economic | negative`;
  }

  private parseStatements(response: string): Statement[] {
    const lines = response.split('\n').filter(line => line.trim());

    return lines
      .map(line => {
        const match = line.match(/^(S\d+):\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
        if (!match) return null;

        return {
          id: match[1],
          text: match[2].trim(),
          perspective: match[3].trim(),
          polarity: match[4].trim() as 'positive' | 'negative' | 'neutral',
        };
      })
      .filter(Boolean);
  }

  async validateStatements(statements: Statement[]) {
    const validationPrompt = `Review these Q-methodology statements for:
1. Clarity and conciseness
2. Bias or loaded language
3. Sortability on agree-disagree scale
4. Coverage of diverse perspectives

Statements:
${statements.map(s => `- ${s.text}`).join('\n')}

Return a JSON object with:
- overallQuality: score 0-100
- issues: array of {statementId, issue, suggestion}
- improvements: general suggestions`;

    const result = await this.openai.generateCompletion(validationPrompt, {
      model: 'smart',
      temperature: 0.3,
    });

    return JSON.parse(result);
  }
}
```

### Grid Design AI Assistant

```typescript
// frontend/components/ai/GridDesignAssistant.tsx
import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Sparkles } from 'lucide-react';

export function GridDesignAssistant({ onApplySuggestion }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const getSuggestion = async () => {
    setLoading(true);

    const response = await fetch('/api/ai/grid-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementCount: 30,
        studyType: 'exploratory',
      }),
    });

    const data = await response.json();
    setSuggestion(data);
    setLoading(false);
  };

  return (
    <Card className="p-4 border-2 border-system-blue/20 bg-system-blue/5">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-system-blue mt-1" />
        <div className="flex-1">
          <h4 className="font-medium mb-2">AI Grid Assistant</h4>

          {!suggestion ? (
            <div>
              <p className="text-sm text-secondary-label mb-3">
                Get AI-powered recommendations for your Q-sort grid design based on best practices.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={getSuggestion}
                loading={loading}
              >
                Get Recommendation
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded p-3">
                <p className="text-sm font-medium mb-2">Recommended Distribution:</p>
                <div className="flex gap-2 justify-center">
                  {suggestion.distribution.map((count, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs text-gray-500">
                        {i - Math.floor(suggestion.distribution.length / 2)}
                      </div>
                      <div className="w-8 h-8 bg-system-blue/10 rounded flex items-center justify-center font-medium">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p><strong>Rationale:</strong> {suggestion.rationale}</p>
                <p><strong>Best for:</strong> {suggestion.bestFor}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onApplySuggestion(suggestion)}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={getSuggestion}
                >
                  Try Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

## 6.86.3 Bias Detection System

### Bias Detection Service

```typescript
// backend/src/modules/ai/services/bias-detection.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAIService } from './openai.service';

interface BiasReport {
  overallScore: number; // 0-100, higher is less biased
  detectedBiases: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    examples: string[];
    suggestions: string[];
  }[];
  recommendations: string[];
}

@Injectable()
export class BiasDetectionService {
  constructor(private openai: OpenAIService) {}

  async analyzeStudyForBias(study: {
    title: string;
    description: string;
    statements: string[];
    questions?: any[];
  }): Promise<BiasReport> {
    const prompt = `Analyze this Q-methodology study for potential biases:

Title: ${study.title}
Description: ${study.description}

Statements:
${study.statements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Check for:
1. Language bias (loaded terms, leading statements)
2. Perspective bias (missing viewpoints)
3. Cultural bias (assumptions about context)
4. Confirmation bias (favoring certain outcomes)
5. Sampling bias (statement selection)

Return a detailed JSON report with:
- overallScore: 0-100 (100 = no bias detected)
- detectedBiases: array of bias types with severity and examples
- recommendations: specific improvements`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.3,
      maxTokens: 2000,
    });

    return JSON.parse(response);
  }

  async suggestNeutralAlternative(statement: string): Promise<string> {
    const prompt = `Rewrite this Q-methodology statement to be more neutral and unbiased while preserving the core concept:

Original: "${statement}"

Provide a single improved version that:
- Removes loaded language
- Maintains sortability on agree-disagree scale
- Keeps similar length
- Preserves the underlying concept`;

    return this.openai.generateCompletion(prompt, {
      model: 'fast',
      temperature: 0.5,
      maxTokens: 100,
    });
  }

  async checkCulturalSensitivity(content: string[]): Promise<any> {
    const prompt = `Review these statements for cultural sensitivity issues:

${content.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Identify:
- Culturally specific references that may not translate
- Assumptions about social norms
- Language that may be offensive in certain cultures
- Suggestions for more inclusive alternatives

Return as JSON with flagged items and recommendations.`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.3,
    });

    return JSON.parse(response);
  }
}
```

## 🔍 Testing Checkpoint 6.86.1

- [ ] OpenAI API connects successfully
- [ ] Cost tracking works correctly
- [ ] Statement generation produces valid results
- [ ] Grid AI suggestions are appropriate
- [ ] Bias detection identifies issues
- [ ] Caching reduces API calls

---

# PHASE 6.88: AI-POWERED ANALYSIS & REPORTING

**Duration:** 8-10 days  
**Status:** 🔴 NOT STARTED (0%)  
**Target:** Automated insights and report generation

## 6.88.1 Data Interpretation Engine

### Factor Interpretation Service

```typescript
// backend/src/modules/ai/services/factor-interpretation.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Injectable()
export class FactorInterpretationService {
  constructor(private openai: OpenAIService) {}

  async interpretFactor(
    factorData: {
      factorNumber: number;
      varianceExplained: number;
      loadings: Array<{ participantId: string; loading: number }>;
      distinguishingStatements: Array<{
        statement: string;
        zScore: number;
        rank: number;
      }>;
    },
    studyContext: string
  ) {
    const prompt = `Interpret this Q-methodology factor based on the distinguishing statements and loadings:

Study Context: ${studyContext}
Factor ${factorData.factorNumber} (Explains ${factorData.varianceExplained.toFixed(1)}% of variance)

Top Distinguishing Statements (by Z-score):
${factorData.distinguishingStatements
  .slice(0, 10)
  .map(s => `- "${s.statement}" (Z: ${s.zScore.toFixed(2)}, Rank: ${s.rank})`)
  .join('\n')}

Participant Loadings:
- High loaders (>0.6): ${factorData.loadings.filter(l => l.loading > 0.6).length} participants
- Moderate loaders (0.4-0.6): ${factorData.loadings.filter(l => l.loading >= 0.4 && l.loading <= 0.6).length} participants

Provide:
1. A descriptive name for this factor (max 50 chars)
2. Key characteristics of this viewpoint (3-5 bullet points)
3. What distinguishes this perspective from others
4. Potential demographic or background factors
5. Narrative summary (200 words)

Format as JSON.`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.4,
      maxTokens: 1500,
    });

    return JSON.parse(response);
  }

  async generateConsensusAnalysis(
    consensusStatements: Array<{
      statement: string;
      averageZScore: number;
      agreement: number; // percentage
    }>
  ) {
    const prompt = `Analyze these consensus statements from a Q-methodology study:

High Consensus Statements (>80% agreement):
${consensusStatements
  .filter(s => s.agreement > 80)
  .map(
    s =>
      `- "${s.statement}" (${s.agreement}% agreement, Avg Z: ${s.averageZScore.toFixed(2)})`
  )
  .join('\n')}

Provide:
1. Key areas of agreement across all perspectives
2. Implications for policy or practice
3. Why these might be consensus points
4. Potential blind spots or assumptions

Format as structured JSON.`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.3,
    });

    return JSON.parse(response);
  }
}
```

## 6.88.2 Literature Review Integration

### Academic Search Service

```typescript
// backend/src/modules/ai/services/literature-search.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LiteratureSearchService {
  private semanticScholarAPI = 'https://api.semanticscholar.org/graph/v1';
  private crossrefAPI = 'https://api.crossref.org/works';

  async findRelatedLiterature(topic: string, limit = 10): Promise<Paper[]> {
    // Search Semantic Scholar
    const s2Response = await axios.get(
      `${this.semanticScholarAPI}/paper/search`,
      {
        params: {
          query: topic,
          limit,
          fields: 'title,authors,year,abstract,citationCount,url',
        },
      }
    );

    const papers = s2Response.data.data.map(paper => ({
      title: paper.title,
      authors: paper.authors.map(a => a.name).join(', '),
      year: paper.year,
      abstract: paper.abstract,
      citations: paper.citationCount,
      url: paper.url,
      source: 'Semantic Scholar',
    }));

    // Sort by relevance and citations
    return papers.sort((a, b) => b.citations - a.citations);
  }

  async generateLiteratureContext(
    studyTopic: string,
    papers: Paper[]
  ): Promise<string> {
    const prompt = `Based on these academic papers about "${studyTopic}", provide a brief literature review context:

Papers:
${papers.map(p => `- ${p.title} (${p.year}) - ${p.citations} citations`).join('\n')}

Write a 300-word synthesis that:
1. Identifies key themes in the literature
2. Notes methodological approaches
3. Highlights gaps your Q-study might address
4. Suggests theoretical frameworks

Use academic writing style.`;

    // This would call OpenAI service
    return 'Literature review context...';
  }
}
```

## 6.88.3 Automated Report Generation

### Report Generator Service

```typescript
// backend/src/modules/ai/services/report-generator.service.ts
import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as Handlebars from 'handlebars';

@Injectable()
export class ReportGeneratorService {
  private templates = {
    executive: 'executive-summary.hbs',
    academic: 'academic-report.hbs',
    participant: 'participant-feedback.hbs',
  };

  async generateReport(
    type: 'executive' | 'academic' | 'participant',
    data: any
  ): Promise<Buffer> {
    // Load and compile template
    const template = await this.loadTemplate(this.templates[type]);
    const compiled = Handlebars.compile(template);

    // Generate HTML
    const html = compiled(data);

    // Convert to PDF
    return this.generatePDF(html, data);
  }

  async generateExecutiveSummary(analysis: any) {
    const summary = {
      title: analysis.study.title,
      date: new Date().toLocaleDateString(),
      participants: analysis.participants.length,
      responseRate: analysis.responseRate,
      keyFindings: await this.extractKeyFindings(analysis),
      factors: await this.summarizeFactors(analysis.factors),
      consensus: await this.summarizeConsensus(analysis.consensus),
      recommendations: await this.generateRecommendations(analysis),
      visualizations: await this.prepareVisualizations(analysis),
    };

    return this.generateReport('executive', summary);
  }

  private async extractKeyFindings(analysis: any): Promise<string[]> {
    // Use AI to extract top 5 key findings
    const findings = [];

    // Most important factor
    findings.push(
      `The dominant perspective (Factor 1) represents ${analysis.factors[0].varianceExplained.toFixed(1)}% of viewpoints, characterized by ${analysis.factors[0].interpretation.name}`
    );

    // Consensus points
    if (analysis.consensus.length > 0) {
      findings.push(
        `Strong consensus exists on ${analysis.consensus.length} statements, indicating shared values across all perspectives`
      );
    }

    // Polarizing issues
    const polarizing = analysis.statements.filter(s => s.variance > 2);
    if (polarizing.length > 0) {
      findings.push(
        `${polarizing.length} statements show high polarization, revealing key areas of disagreement`
      );
    }

    return findings;
  }

  private async generatePDF(html: string, data: any): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add pages with content
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Add header
    page.drawText(data.title, {
      x: 50,
      y: height - 50,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });

    // Add content (simplified - would use proper HTML to PDF library)
    // ...

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
```

### Report Delivery Component

```typescript
// frontend/components/reports/ReportGenerator.tsx
import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { FileText, Download, Send, Sparkles } from 'lucide-react';

export function ReportGenerator({ studyId, analysisData }) {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<'executive' | 'academic' | 'participant'>('executive');
  const [includeAI, setIncludeAI] = useState(true);

  const generateReport = async () => {
    setGenerating(true);

    const response = await fetch(`/api/studies/${studyId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: reportType,
        includeAI,
        sections: getSelectedSections(),
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studyId}-${reportType}-report.pdf`;
      a.click();
    }

    setGenerating(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Generate Report</h3>

      {/* Report Type Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2">Report Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'executive', label: 'Executive Summary', icon: FileText },
              { value: 'academic', label: 'Academic Report', icon: FileText },
              { value: 'participant', label: 'Participant Feedback', icon: FileText },
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value as any)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  reportType === type.value
                    ? 'border-system-blue bg-system-blue/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <type.icon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Enhancement Toggle */}
        <div className="flex items-center justify-between p-3 bg-system-blue/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-system-blue" />
            <div>
              <div className="font-medium">AI-Enhanced Insights</div>
              <div className="text-xs text-secondary-label">
                Include AI-generated interpretations and recommendations
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={includeAI}
            onChange={(e) => setIncludeAI(e.target.checked)}
            className="rounded"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateReport}
          loading={generating}
          fullWidth
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>
    </Card>
  );
}
```

## 🔍 Testing Checkpoint 6.88.1

- [ ] Factor interpretation generates meaningful insights
- [ ] Literature search returns relevant papers
- [ ] Report generation creates valid PDFs
- [ ] AI insights are accurate and helpful
- [ ] Export formats are correct
- [ ] Cost tracking works for all AI operations

---

# PHASE 10: PRE-PRODUCTION READINESS

**Duration:** 5-7 days  
**Status:** 🔴 NOT STARTED (0%)  
**Target:** Complete testing, monitoring, and deployment preparation

## 10.1 Comprehensive Testing Suite

### Integration Testing Setup

```typescript
// test/integration/study-flow.test.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '@/common/prisma.service';

describe('Study Flow Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Setup test user and auth
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
      });

    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM users WHERE email = 'test@example.com'`;
    await app.close();
  });

  describe('Complete Study Lifecycle', () => {
    let studyId: string;

    it('should create a new study', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/studies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Study',
          description: 'Integration test study',
          configuration: {
            gridDistribution: [1, 2, 3, 4, 5, 4, 3, 2, 1],
            statements: Array.from({ length: 25 }, (_, i) => ({
              id: `stmt-${i}`,
              text: `Statement ${i + 1}`,
            })),
          },
        })
        .expect(201);

      studyId = response.body.id;
      expect(studyId).toBeDefined();
    });

    it('should allow participant to join study', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/studies/${studyId}/join`)
        .send({
          inviteCode: 'TEST123',
        })
        .expect(200);

      expect(response.body.participantToken).toBeDefined();
    });

    it('should submit Q-sort data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/studies/${studyId}/responses`)
        .send({
          participantToken: 'test-token',
          qSortData: {
            placements: { '0-0': 'stmt-1', '1-0': 'stmt-2' },
            completedAt: new Date(),
          },
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should run analysis', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/studies/${studyId}/analysis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          extractionMethod: 'pca',
          numberOfFactors: 3,
        })
        .expect(200);

      expect(response.body.factors).toHaveLength(3);
      expect(response.body.eigenvalues).toBeDefined();
    });
  });
});
```

### Performance Testing

```javascript
// test/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'], // Error rate under 10%
  },
};

export default function () {
  // Test participant flow
  const joinResponse = http.post(
    'http://localhost:3000/api/studies/test-study/join',
    JSON.stringify({ inviteCode: 'TEST123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(joinResponse, {
    'join successful': r => r.status === 200,
    'token received': r => r.json('participantToken') !== undefined,
  });

  errorRate.add(joinResponse.status !== 200);

  sleep(1);

  // Test Q-sort submission
  if (joinResponse.status === 200) {
    const token = joinResponse.json('participantToken');

    const sortResponse = http.post(
      'http://localhost:3000/api/studies/test-study/responses',
      JSON.stringify({
        participantToken: token,
        qSortData: generateRandomSort(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(sortResponse, {
      'sort submitted': r => r.status === 201,
    });

    errorRate.add(sortResponse.status !== 201);
  }

  sleep(1);
}

function generateRandomSort() {
  const placements = {};
  let statementIndex = 0;
  const distribution = [1, 2, 3, 4, 5, 4, 3, 2, 1];

  distribution.forEach((count, col) => {
    for (let row = 0; row < count; row++) {
      placements[`${col}-${row}`] = `stmt-${++statementIndex}`;
    }
  });

  return { placements, completedAt: new Date().toISOString() };
}
```

### Security Testing

```bash
#!/bin/bash
# test/security/security-scan.sh

echo "Running security tests..."

# 1. Dependency vulnerability scan
echo "Checking dependencies..."
npm audit --audit-level=high

# 2. OWASP ZAP scan
echo "Running OWASP ZAP scan..."
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# 3. SQL injection test
echo "Testing SQL injection protection..."
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com\" OR 1=1--", "password": "test"}'

# 4. XSS test
echo "Testing XSS protection..."
curl -X POST http://localhost:3000/api/studies \
  -H "Content-Type: application/json" \
  -d '{"title": "<script>alert(\"XSS\")</script>"}'

# 5. Rate limiting test
echo "Testing rate limiting..."
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}' &
done
wait

echo "Security tests complete. Check reports for details."
```

## 10.2 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run typecheck

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Build application
        run: npm run build

      - name: Run security scan
        run: npm audit --production

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t vqmethod/frontend:staging ./frontend
          docker build -t vqmethod/backend:staging ./backend

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push vqmethod/frontend:staging
          docker push vqmethod/backend:staging

      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          kubectl set image deployment/vqmethod-frontend frontend=vqmethod/frontend:staging --namespace=staging
          kubectl set image deployment/vqmethod-backend backend=vqmethod/backend:staging --namespace=staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t vqmethod/frontend:${{ github.sha }} ./frontend
          docker build -t vqmethod/backend:${{ github.sha }} ./backend

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push vqmethod/frontend:${{ github.sha }}
          docker push vqmethod/backend:${{ github.sha }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/vqmethod-frontend frontend=vqmethod/frontend:${{ github.sha }} --namespace=production
          kubectl set image deployment/vqmethod-backend backend=vqmethod/backend:${{ github.sha }} --namespace=production
```

## 10.3 Monitoring Setup

### Prometheus Configuration

```yaml
# infrastructure/monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'vqmethod-backend'
    static_configs:
      - targets: ['backend:4000']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts.yml'
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "VQMethod Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Active Studies",
        "targets": [
          {
            "expr": "vqmethod_active_studies"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Testing Checkpoint 10.1

- [ ] All integration tests pass
- [ ] Load testing meets performance targets
- [ ] Security scan shows no critical issues
- [ ] CI/CD pipeline runs successfully
- [ ] Monitoring dashboards work
- [ ] Backup procedures tested

---

# Summary

This Part 4 covers:

- **Phase 6.86**: AI-Powered Research Intelligence with OpenAI integration
- **Phase 6.88**: AI Analysis & Reporting with automated insights
- **Phase 10**: Pre-Production Readiness with comprehensive testing and deployment

Continue to **IMPLEMENTATION_GUIDE_PART5.md** for Phases 11-16 (Enterprise Features).

**Document Size**: ~19,900 tokens
