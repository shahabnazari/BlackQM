# GROBID INTEGRATION - ENTERPRISE-GRADE IMPLEMENTATION PLAN

**Date:** January 2025
**Duration:** 2-3 days (16-24 hours)
**Mode:** STRICT ENTERPRISE-GRADE
**Priority:** 🔥 CRITICAL - 6-10x better PDF extraction quality
**Pattern:** Phase 10.93 Day 1-4 Service Extraction Pattern

---

## 🎯 OBJECTIVES

### **Primary Goal:**
Replace pdf-parse (15% content extraction) with GROBID (90%+ content extraction) for all PDF-based sources.

### **Success Criteria:**
- ✅ GROBID service < 300 lines (Phase 10.91 standard)
- ✅ All functions < 100 lines
- ✅ TypeScript: 0 errors, 0 `any`, 0 `@ts-ignore`
- ✅ Test coverage: 85%+
- ✅ PDF extraction: 15% → 90%+ content
- ✅ Feature-flagged rollout (can disable instantly)
- ✅ Zero breaking changes to existing system

### **Non-Goals (EXPLICITLY OUT OF SCOPE):**
- ❌ Refactor existing pdf-parsing.service (keep as-is)
- ❌ Unified orchestrator redesign (current waterfall works)
- ❌ Source-specific routing (optimization, not critical)
- ❌ Complete Phase 10.94 implementation (too much risk)

---

## 📋 PREREQUISITES

### **Infrastructure:**
- [ ] Docker installed and running
- [ ] Port 8070 available for GROBID service
- [ ] 4GB+ RAM available (GROBID requirement)
- [ ] GROBID Docker image: `lfoppiano/grobid:0.8.0` (latest stable)

### **Development:**
- [ ] Backend running (Port 4000)
- [ ] Database accessible
- [ ] Test PDFs available (arXiv, ERIC, CORE samples)

---

## 🏗️ ARCHITECTURE DESIGN

### **Current 4-Tier Waterfall:**
```
Tier 1: Database Cache (0ms)
  ↓
Tier 2: PMC API + HTML Scraping (1-3s, 40-50% coverage)
  ↓
Tier 3: Unpaywall PDF (3-5s, 25-30% coverage) ← pdf-parse (15% quality)
  ↓
Tier 4: Direct Publisher PDF (3-5s, 15-20% coverage) ← pdf-parse (15% quality)
```

### **NEW 5-Tier Waterfall (with GROBID):**
```
Tier 1: Database Cache (0ms)
  ↓
Tier 2: PMC API + HTML Scraping (1-3s, 40-50% coverage)
  ↓
Tier 2.5: GROBID PDF Processing (5-10s, attempts ALL PDFs) ← NEW
  ↓
Tier 3: Unpaywall PDF → GROBID (if Tier 2.5 skipped)
  ↓
Tier 4: Direct Publisher PDF → GROBID (if Tier 2.5 skipped)
  ↓
FALLBACK: pdf-parse (if GROBID fails)
```

### **Integration Strategy:**

**Option A: Separate Tier (RECOMMENDED)**
```typescript
// pdf-parsing.service.ts:processFullText()

// Tier 2: PMC API + HTML
if (pmid || url) {
  htmlResult = await htmlService.fetchFullText(...);
  if (htmlResult.success) return htmlResult;
}

// Tier 2.5: GROBID (NEW)
if (hasPdfUrl) {
  grobidResult = await grobidService.extractFromPdf(pdfUrl);
  if (grobidResult.success) return grobidResult;
}

// Tier 3: Unpaywall PDF
if (doi) {
  pdfBuffer = await fetchPDF(doi);
  // Try GROBID first, fallback to pdf-parse
  text = await grobidService.extractFromBuffer(pdfBuffer) || extractText(pdfBuffer);
}
```

**Benefits:**
- ✅ Additive (no changes to existing tiers)
- ✅ Easy rollback (remove Tier 2.5)
- ✅ Feature flag at tier level
- ✅ pdf-parse remains as fallback

---

## 📁 FILE STRUCTURE

### **New Files to Create:**

```
backend/src/modules/literature/services/
├── grobid-extraction.service.ts         (< 300 lines) ← Main service
└── grobid-extraction.service.spec.ts    (< 500 lines) ← Tests

backend/src/modules/literature/dto/
└── grobid.dto.ts                        (< 100 lines) ← Type definitions

backend/src/config/
└── grobid.config.ts                     (< 50 lines)  ← Configuration

backend/docker/
└── grobid/
    ├── docker-compose.yml               ← GROBID container
    └── config.yml                       ← GROBID configuration
```

### **Files to Modify:**

```
backend/src/modules/literature/services/
├── pdf-parsing.service.ts               (Add Tier 2.5 integration)

backend/src/modules/literature/literature.module.ts
└── (Add GrobidExtractionService to providers)

backend/.env.example
└── (Add GROBID_ENABLED=true, GROBID_URL=http://localhost:8070)
```

---

## 🗓️ DAY-BY-DAY PLAN (STRICT MODE)

## **DAY 0: Infrastructure Setup (4 hours) - MANDATORY**

⚠️ **DO NOT SKIP** - Essential for all subsequent work

### **Morning: GROBID Docker Deployment (2 hours)**

#### **Step 1: Create Docker Configuration (30 min)**

**File:** `backend/docker/grobid/docker-compose.yml`

```yaml
version: '3.8'

services:
  grobid:
    image: lfoppiano/grobid:0.8.0
    container_name: blackq-grobid
    ports:
      - "8070:8070"
    environment:
      - GROBID_MEMORY=4096m  # 4GB RAM for production
      - JAVA_OPTS=-Xmx4g -Xms1g
    volumes:
      - ./config.yml:/opt/grobid/grobid-home/config/config.yml:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8070/api/isalive"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s  # GROBID takes ~1min to start
    restart: unless-stopped
    networks:
      - blackq-network

networks:
  blackq-network:
    driver: bridge
```

**File:** `backend/docker/grobid/config.yml`

```yaml
# GROBID Configuration for BlackQ Method
# See: https://grobid.readthedocs.io/en/latest/Configuration/

grobid:
  # Number of concurrent requests (adjust based on RAM)
  concurrency: 4

  # PDF processing timeout (seconds)
  timeout: 60

  # Enable all extraction features
  consolidateHeader: true
  consolidateCitations: true

  # TEI output format (structured XML)
  generateTeiIds: true

  # Processing options
  segmentSentences: true
  includeRawAffiliations: true
```

#### **Step 2: Deploy GROBID Container (30 min)**

```bash
# Navigate to docker directory
cd backend/docker/grobid

# Pull GROBID image (1.2GB - may take 5-10 min)
docker pull lfoppiano/grobid:0.8.0

# Start GROBID service
docker-compose up -d

# Wait for service to be ready (~60 seconds)
echo "Waiting for GROBID to start..."
sleep 60

# Test health endpoint
curl -f http://localhost:8070/api/isalive
# Expected: { "status": "ok" }
```

#### **Step 3: Verify GROBID Functionality (1 hour)**

**Create test script:** `backend/scripts/test-grobid.sh`

```bash
#!/bin/bash
# Test GROBID service with sample PDF

GROBID_URL="http://localhost:8070"

echo "=== GROBID SERVICE TEST ==="

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s "$GROBID_URL/api/isalive" | jq .
echo ""

# Test 2: Process sample PDF
echo "2. Testing PDF processing..."
curl -s \
  -F "input=@/path/to/sample.pdf" \
  "$GROBID_URL/api/processFulltextDocument" \
  -o test-output.xml

# Test 3: Verify output is valid XML
echo "3. Verifying XML output..."
xmllint --noout test-output.xml && echo "✅ Valid XML" || echo "❌ Invalid XML"

# Test 4: Extract text content
echo "4. Extracting text from XML..."
xmllint --xpath "//body//p/text()" test-output.xml | head -100
echo ""

echo "=== GROBID TEST COMPLETE ==="
```

```bash
chmod +x backend/scripts/test-grobid.sh
./backend/scripts/test-grobid.sh
```

**Expected Output:**
```
✅ Health check: OK
✅ PDF processed: 5-10 seconds
✅ XML generated: 50-200KB
✅ Text extracted: 3000-8000+ words
```

---

### **Afternoon: Service Skeleton & Configuration (2 hours)**

#### **Step 4: Create Environment Variables (15 min)**

**File:** `backend/.env` (add these lines)

```bash
# ============================================================================
# GROBID Configuration (PDF Full-Text Extraction)
# ============================================================================
GROBID_ENABLED=true
GROBID_URL=http://localhost:8070
GROBID_TIMEOUT=60000  # 60 seconds for large PDFs
GROBID_MAX_FILE_SIZE=52428800  # 50MB max PDF size
GROBID_CONSOLIDATE_HEADER=true
GROBID_CONSOLIDATE_CITATIONS=true
```

**File:** `backend/.env.example` (update with same)

#### **Step 5: Create Configuration Service (30 min)**

**File:** `backend/src/config/grobid.config.ts`

```typescript
/**
 * GROBID Service Configuration
 * Phase 10.94 Minimal Implementation - Day 0
 *
 * Enterprise-Grade Configuration Management
 * - All settings via environment variables
 * - Sensible defaults for local development
 * - Production-ready timeout and size limits
 *
 * Service Size: < 50 lines (WITHIN LIMIT) ✅
 */

export interface GrobidConfig {
  enabled: boolean;
  url: string;
  timeout: number;
  maxFileSize: number;
  consolidateHeader: boolean;
  consolidateCitations: boolean;
}

export const getGrobidConfig = (): GrobidConfig => {
  return {
    enabled: process.env.GROBID_ENABLED === 'true',
    url: process.env.GROBID_URL || 'http://localhost:8070',
    timeout: parseInt(process.env.GROBID_TIMEOUT || '60000', 10),
    maxFileSize: parseInt(process.env.GROBID_MAX_FILE_SIZE || '52428800', 10),
    consolidateHeader: process.env.GROBID_CONSOLIDATE_HEADER !== 'false',
    consolidateCitations: process.env.GROBID_CONSOLIDATE_CITATIONS !== 'false',
  };
};
```

#### **Step 6: Create Type Definitions (45 min)**

**File:** `backend/src/modules/literature/dto/grobid.dto.ts`

```typescript
/**
 * GROBID Service DTOs and Type Definitions
 * Phase 10.94 Minimal Implementation - Day 0
 *
 * Type Safety: Zero `any`, zero `@ts-ignore` ✅
 * Pattern: Phase 10.93 type guard pattern
 *
 * File Size: < 100 lines (WITHIN LIMIT) ✅
 */

/**
 * GROBID API response structure (TEI XML)
 */
export interface GrobidTeiXml {
  teiHeader: {
    fileDesc: {
      titleStmt: { title: string };
      sourceDesc: { biblStruct: unknown };
    };
    profileDesc: {
      abstract?: { p: string | string[] };
    };
  };
  text: {
    body: {
      div: Array<{
        head?: string;
        p: string | string[];
      }>;
    };
  };
}

/**
 * Extracted content from GROBID processing
 */
export interface GrobidExtractedContent {
  success: boolean;
  text?: string;
  wordCount?: number;
  sections?: Array<{
    title: string;
    content: string;
    wordCount: number;
  }>;
  metadata?: {
    title?: string;
    abstract?: string;
    referenceCount?: number;
  };
  processingTime?: number;
  error?: string;
}

/**
 * GROBID service options
 */
export interface GrobidProcessOptions {
  consolidateHeader?: boolean;
  consolidateCitations?: boolean;
  includeRawAffiliations?: boolean;
  segmentSentences?: boolean;
  timeout?: number;
}

/**
 * Type guard: Check if GROBID response is valid
 */
export function isGrobidTeiXml(data: unknown): data is GrobidTeiXml {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const xml = data as Record<string, unknown>;

  // Check teiHeader exists
  if (!xml.teiHeader || typeof xml.teiHeader !== 'object') {
    return false;
  }

  // Check text.body exists
  if (!xml.text || typeof xml.text !== 'object') {
    return false;
  }

  return true;
}
```

#### **Step 7: Update Module Providers (30 min)**

**File:** `backend/src/modules/literature/literature.module.ts`

```typescript
// ... existing imports ...
import { GrobidExtractionService } from './services/grobid-extraction.service';  // ← NEW

@Module({
  imports: [
    // ... existing imports ...
  ],
  controllers: [
    // ... existing controllers ...
  ],
  providers: [
    // ... existing services ...
    GrobidExtractionService,  // ← NEW
    // ... rest of services ...
  ],
  exports: [
    // ... existing exports ...
    GrobidExtractionService,  // ← NEW
  ],
})
export class LiteratureModule {}
```

---

### **Day 0 Checkpoint: Infrastructure Validation**

**Checklist:**
- [ ] GROBID Docker container running (port 8070)
- [ ] Health check returns 200 OK
- [ ] Sample PDF processed successfully
- [ ] XML output generated (50-200KB)
- [ ] Environment variables configured
- [ ] Configuration service created
- [ ] Type definitions created
- [ ] Module updated with new service

**Test Command:**
```bash
# All-in-one validation
curl -f http://localhost:8070/api/isalive && \
docker ps | grep grobid && \
grep "GROBID_ENABLED" backend/.env && \
echo "✅ Day 0 Infrastructure Ready"
```

---

## **DAY 1: GROBID Service Implementation (8 hours) - TDD APPROACH**

⚠️ **STRICT MODE:** Write tests FIRST, then implementation

### **Morning: Service Skeleton + Core Methods (4 hours)**

#### **Step 1: Create Test File FIRST (1 hour)**

**File:** `backend/src/modules/literature/services/grobid-extraction.service.spec.ts`

```typescript
/**
 * GROBID Extraction Service Tests
 * Phase 10.94 Minimal Implementation - Day 1
 *
 * TDD Approach: Tests written BEFORE implementation
 * Target Coverage: 85%+
 * Pattern: Phase 10.93 testing standards
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { GrobidExtractionService } from './grobid-extraction.service';

describe('GrobidExtractionService', () => {
  let service: GrobidExtractionService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrobidExtractionService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                GROBID_ENABLED: 'true',
                GROBID_URL: 'http://localhost:8070',
                GROBID_TIMEOUT: '60000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GrobidExtractionService>(GrobidExtractionService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load configuration from environment', () => {
      expect(configService.get('GROBID_URL')).toBe('http://localhost:8070');
    });
  });

  describe('Health Check', () => {
    it('should return true when GROBID is available', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        of({ data: { status: 'ok' }, status: 200 } as any)
      );

      const result = await service.isGrobidAvailable();
      expect(result).toBe(true);
    });

    it('should return false when GROBID is unavailable', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Connection refused'))
      );

      const result = await service.isGrobidAvailable();
      expect(result).toBe(false);
    });
  });

  describe('PDF Processing', () => {
    it('should extract text from valid PDF buffer', async () => {
      const mockPdfBuffer = Buffer.from('mock PDF content');
      const mockXml = `
        <TEI>
          <text>
            <body>
              <div><p>Introduction text here.</p></div>
              <div><p>Methods text here.</p></div>
            </body>
          </text>
        </TEI>
      `;

      jest.spyOn(httpService, 'post').mockReturnValue(
        of({ data: mockXml, status: 200 } as any)
      );

      const result = await service.extractFromBuffer(mockPdfBuffer);

      expect(result.success).toBe(true);
      expect(result.text).toContain('Introduction text here');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should handle PDF extraction failure gracefully', async () => {
      const mockPdfBuffer = Buffer.from('invalid PDF');

      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => new Error('GROBID processing failed'))
      );

      const result = await service.extractFromBuffer(mockPdfBuffer);

      expect(result.success).toBe(false);
      expect(result.error).toContain('GROBID processing failed');
    });

    it('should respect timeout configuration', async () => {
      const mockPdfBuffer = Buffer.from('large PDF');

      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => ({ code: 'ECONNABORTED' }))
      );

      const result = await service.extractFromBuffer(mockPdfBuffer, { timeout: 5000 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('XML Parsing', () => {
    it('should parse GROBID TEI XML correctly', async () => {
      const mockXml = `
        <TEI>
          <teiHeader>
            <fileDesc>
              <titleStmt><title>Sample Paper Title</title></titleStmt>
            </fileDesc>
            <profileDesc>
              <abstract><p>This is the abstract.</p></abstract>
            </profileDesc>
          </teiHeader>
          <text>
            <body>
              <div><head>Introduction</head><p>Intro text.</p></div>
              <div><head>Methods</head><p>Methods text.</p></div>
            </body>
          </text>
        </TEI>
      `;

      const result = await service.parseGrobidXml(mockXml);

      expect(result.success).toBe(true);
      expect(result.metadata?.title).toBe('Sample Paper Title');
      expect(result.metadata?.abstract).toContain('This is the abstract');
      expect(result.sections).toHaveLength(2);
    });

    it('should handle malformed XML gracefully', async () => {
      const invalidXml = '<TEI><body>Unclosed tag';

      const result = await service.parseGrobidXml(invalidXml);

      expect(result.success).toBe(false);
      expect(result.error).toContain('XML parsing failed');
    });
  });

  describe('Section Extraction', () => {
    it('should extract structured sections', async () => {
      const mockXml = `
        <TEI>
          <text>
            <body>
              <div><head>Introduction</head><p>First paragraph.</p><p>Second paragraph.</p></div>
              <div><head>Methods</head><p>Methods content.</p></div>
              <div><head>Results</head><p>Results content.</p></div>
            </body>
          </text>
        </TEI>
      `;

      const result = await service.parseGrobidXml(mockXml);

      expect(result.sections).toHaveLength(3);
      expect(result.sections?.[0].title).toBe('Introduction');
      expect(result.sections?.[0].content).toContain('First paragraph');
      expect(result.sections?.[0].wordCount).toBeGreaterThan(0);
    });
  });

  // Add 15+ more tests for edge cases, error handling, performance...
});
```

**Target:** 25+ tests, 85%+ coverage

#### **Step 2: Implement Service Skeleton (2 hours)**

**File:** `backend/src/modules/literature/services/grobid-extraction.service.ts`

```typescript
/**
 * GROBID Extraction Service
 * Phase 10.94 Minimal Implementation - Day 1
 *
 * Enterprise-Grade PDF Full-Text Extraction
 * - 6-10x better quality than pdf-parse (90%+ vs 15% content extraction)
 * - Structured XML output with sections (Intro, Methods, Results, Discussion)
 * - Preserves citations, equations, semantic structure
 * - Handles multi-column layouts, complex academic PDFs
 *
 * Architecture Pattern: Phase 10.93 service extraction
 * Type Safety: Zero `any`, zero `@ts-ignore`, type guards for external data
 * Service Size: < 300 lines (HARD LIMIT)
 * Function Size: < 100 lines per function (HARD LIMIT)
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import FormData from 'form-data';
import {
  GrobidExtractedContent,
  GrobidProcessOptions,
  GrobidTeiXml,
  isGrobidTeiXml,
} from '../dto/grobid.dto';

@Injectable()
export class GrobidExtractionService {
  private readonly logger = new Logger(GrobidExtractionService.name);
  private readonly grobidUrl: string;
  private readonly grobidEnabled: boolean;
  private readonly defaultTimeout: number;
  private readonly maxFileSize: number;
  private readonly xmlParser: XMLParser;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Load configuration from environment
    this.grobidUrl = this.configService.get<string>('GROBID_URL') || 'http://localhost:8070';
    this.grobidEnabled = this.configService.get<string>('GROBID_ENABLED') === 'true';
    this.defaultTimeout = parseInt(
      this.configService.get<string>('GROBID_TIMEOUT') || '60000',
      10,
    );
    this.maxFileSize = parseInt(
      this.configService.get<string>('GROBID_MAX_FILE_SIZE') || '52428800',
      10,
    );

    // Initialize XML parser with options
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      trimValues: true,
    });

    this.logger.log(
      `GROBID Service initialized: enabled=${this.grobidEnabled}, url=${this.grobidUrl}`,
    );
  }

  /**
   * Check if GROBID service is available
   * Used for health checks and fallback decisions
   */
  async isGrobidAvailable(): Promise<boolean> {
    if (!this.grobidEnabled) {
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.grobidUrl}/api/isalive`, {
          timeout: 5000,
        }),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.warn('GROBID service unavailable', error);
      return false;
    }
  }

  /**
   * Extract full-text from PDF buffer using GROBID
   *
   * This is the main method called by pdf-parsing.service
   * Replaces pdf-parse for 6-10x better extraction quality
   *
   * @param pdfBuffer PDF file as Buffer
   * @param options Processing options (timeout, consolidation, etc.)
   * @returns Extracted content with sections and metadata
   */
  async extractFromBuffer(
    pdfBuffer: Buffer,
    options?: GrobidProcessOptions,
  ): Promise<GrobidExtractedContent> {
    // Pre-flight checks
    if (!this.grobidEnabled) {
      return {
        success: false,
        error: 'GROBID service is disabled (GROBID_ENABLED=false)',
      };
    }

    if (pdfBuffer.length > this.maxFileSize) {
      return {
        success: false,
        error: `PDF size (${pdfBuffer.length} bytes) exceeds limit (${this.maxFileSize} bytes)`,
      };
    }

    const startTime = Date.now();

    try {
      this.logger.log(`Processing PDF (${(pdfBuffer.length / 1024).toFixed(2)} KB)...`);

      // Step 1: Send PDF to GROBID for processing
      const xml = await this.sendToGrobid(pdfBuffer, options);

      // Step 2: Parse XML to extract text and structure
      const result = await this.parseGrobidXml(xml);

      // Step 3: Add processing time
      result.processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ GROBID extraction complete: ${result.wordCount} words in ${result.processingTime}ms`,
      );

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`❌ GROBID extraction failed after ${processingTime}ms:`, errorMsg);

      return {
        success: false,
        error: errorMsg,
        processingTime,
      };
    }
  }

  /**
   * Send PDF to GROBID API and get TEI XML response
   * Function Size: < 100 lines ✅
   */
  private async sendToGrobid(
    pdfBuffer: Buffer,
    options?: GrobidProcessOptions,
  ): Promise<string> {
    // Prepare multipart form data
    const formData = new FormData();
    formData.append('input', pdfBuffer, {
      filename: 'paper.pdf',
      contentType: 'application/pdf',
    });

    // Add processing options
    if (options?.consolidateHeader !== false) {
      formData.append('consolidateHeader', '1');
    }
    if (options?.consolidateCitations !== false) {
      formData.append('consolidateCitations', '1');
    }

    // Call GROBID API
    const timeout = options?.timeout || this.defaultTimeout;

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.grobidUrl}/api/processFulltextDocument`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout,
          maxContentLength: 100 * 1024 * 1024, // 100MB XML response max
          responseType: 'text',
        },
      ),
    );

    if (typeof response.data !== 'string') {
      throw new Error('GROBID returned non-string response');
    }

    return response.data;
  }

  /**
   * Parse GROBID TEI XML to extract text and metadata
   * Function Size: < 100 lines ✅
   */
  async parseGrobidXml(xml: string): Promise<GrobidExtractedContent> {
    try {
      // Parse XML
      const parsed = this.xmlParser.parse(xml);

      if (!isGrobidTeiXml(parsed)) {
        throw new Error('Invalid GROBID TEI XML structure');
      }

      // Extract metadata
      const metadata = {
        title: parsed.teiHeader?.fileDesc?.titleStmt?.title || undefined,
        abstract: this.extractAbstract(parsed),
      };

      // Extract sections
      const sections = this.extractSections(parsed);

      // Combine all text
      const text = sections.map((s) => s.content).join('\n\n');

      // Calculate word count
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      return {
        success: true,
        text,
        wordCount,
        sections,
        metadata,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `XML parsing failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Extract abstract from GROBID XML
   * Function Size: < 50 lines ✅
   */
  private extractAbstract(xml: GrobidTeiXml): string | undefined {
    const abstractData = xml.teiHeader?.profileDesc?.abstract;

    if (!abstractData) {
      return undefined;
    }

    if (Array.isArray(abstractData.p)) {
      return abstractData.p.join(' ').trim();
    }

    if (typeof abstractData.p === 'string') {
      return abstractData.p.trim();
    }

    return undefined;
  }

  /**
   * Extract structured sections from GROBID XML
   * Function Size: < 100 lines ✅
   */
  private extractSections(xml: GrobidTeiXml): Array<{
    title: string;
    content: string;
    wordCount: number;
  }> {
    const body = xml.text?.body;

    if (!body || !body.div || !Array.isArray(body.div)) {
      return [];
    }

    return body.div
      .map((div) => {
        const title = div.head || 'Section';
        const paragraphs = Array.isArray(div.p) ? div.p : [div.p];
        const content = paragraphs
          .filter((p) => typeof p === 'string')
          .join(' ')
          .trim();

        const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

        return { title, content, wordCount };
      })
      .filter((section) => section.wordCount > 0);
  }

  /**
   * Clean extracted text (remove artifacts, normalize whitespace)
   * Function Size: < 50 lines ✅
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .trim();
  }
}

/**
 * Service Size Verification:
 * - Lines: ~280 (WITHIN 300 LIMIT) ✅
 * - Functions: 8 functions, all < 100 lines ✅
 * - Type Safety: Zero `any`, zero `@ts-ignore` ✅
 */
```

#### **Step 3: Run Tests (Red → Green) (1 hour)**

```bash
# Run tests (should FAIL initially - RED phase)
npm test -- grobid-extraction.service.spec.ts

# Implement methods to make tests pass (GREEN phase)
# Refactor for quality (REFACTOR phase)

# Final test run (should PASS - GREEN)
npm test -- grobid-extraction.service.spec.ts --coverage
```

**Expected Coverage:** 85%+

---

### **Afternoon: Integration with pdf-parsing.service (4 hours)**

#### **Step 4: Add GROBID to pdf-parsing.service (2 hours)**

**File:** `backend/src/modules/literature/services/pdf-parsing.service.ts`

```typescript
// Add import at top
import { GrobidExtractionService } from './grobid-extraction.service';

// Update constructor
constructor(
  private prisma: PrismaService,
  @Inject(forwardRef(() => HtmlFullTextService))
  private htmlService: HtmlFullTextService,
  @Inject(forwardRef(() => GrobidExtractionService))  // ← NEW
  private grobidService: GrobidExtractionService,       // ← NEW
) {}

// Add Tier 2.5 in processFullText() method
// Find line 587 (Tier 2 section) and ADD AFTER Tier 2:

// Tier 2.5: Try GROBID PDF extraction (NEW - Phase 10.94 Day 1)
// Enterprise Enhancement: 6-10x better extraction than pdf-parse
if (!fullText && (paper.pdfUrl || paper.doi)) {
  this.logger.log(`🔍 Tier 2.5: Attempting GROBID PDF extraction...`);

  // Check if GROBID is available
  const isGrobidAvailable = await this.grobidService.isGrobidAvailable();

  if (isGrobidAvailable) {
    let pdfBuffer: Buffer | null = null;

    // Try direct PDF URL first (faster)
    if (paper.pdfUrl) {
      try {
        const pdfResponse = await axios.get(paper.pdfUrl, {
          responseType: 'arraybuffer',
          timeout: FULL_TEXT_TIMEOUT,
          headers: {
            'User-Agent': this.USER_AGENT,
            Accept: 'application/pdf,*/*',
          },
          maxRedirects: this.MAX_REDIRECTS,
        });
        pdfBuffer = Buffer.from(pdfResponse.data);
      } catch (error) {
        this.logger.warn(`⚠️  Direct PDF download failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Fallback to Unpaywall if no direct PDF
    if (!pdfBuffer && paper.doi) {
      pdfBuffer = await this.fetchPDF(paper.doi);
    }

    // Process with GROBID
    if (pdfBuffer) {
      const grobidResult = await this.grobidService.extractFromBuffer(pdfBuffer);

      if (grobidResult.success && grobidResult.text) {
        fullText = grobidResult.text;
        fullTextSource = 'grobid';
        const wordCount = grobidResult.wordCount || 0;
        this.logger.log(
          `✅ Tier 2.5 SUCCESS: GROBID extracted ${wordCount} words (${grobidResult.processingTime}ms)`,
        );
      } else {
        this.logger.log(`⚠️  Tier 2.5 FAILED: ${grobidResult.error}`);
      }
    }
  } else {
    this.logger.log(`⏭️  Tier 2.5 SKIPPED: GROBID service unavailable`);
  }
}

// Continue with existing Tier 3 and Tier 4...
// pdf-parse remains as fallback in Tier 3 and Tier 4
```

**Change Summary:**
- Added: 45 lines (Tier 2.5 logic)
- Modified: 2 lines (constructor injection)
- Deleted: 0 lines (no breaking changes)
- New file size: ~926 lines (WITHIN 1000 LIMIT) ✅

#### **Step 5: Feature Flag Implementation (1 hour)**

**File:** `backend/src/modules/literature/services/pdf-parsing.service.ts`

Add feature flag check at service level:

```typescript
// At top of PDFParsingService class
private readonly useGrobid: boolean;

constructor(
  private prisma: PrismaService,
  @Inject(forwardRef(() => HtmlFullTextService))
  private htmlService: HtmlFullTextService,
  @Inject(forwardRef(() => GrobidExtractionService))
  private grobidService: GrobidExtractionService,
) {
  // Feature flag: Enable/disable GROBID without code changes
  this.useGrobid = process.env.GROBID_ENABLED === 'true';
}

// In Tier 2.5 logic:
if (!fullText && (paper.pdfUrl || paper.doi) && this.useGrobid) {  // ← Add feature flag check
  // ... GROBID extraction logic ...
}
```

**Rollback Strategy:**
```bash
# Disable GROBID instantly (no code changes)
export GROBID_ENABLED=false

# Restart backend
pm2 restart backend
```

#### **Step 6: Integration Testing (1 hour)**

**Create E2E test:** `backend/src/modules/literature/test/grobid-integration.e2e.spec.ts`

```typescript
/**
 * GROBID Integration E2E Tests
 * Tests full-text extraction with real GROBID service
 */

describe('GROBID Integration (E2E)', () => {
  it('should extract full-text from arXiv PDF', async () => {
    const paper = {
      id: 'test-arxiv-1',
      pdfUrl: 'https://arxiv.org/pdf/2301.12345.pdf',
    };

    const result = await pdfParsingService.processFullText(paper.id);

    expect(result.success).toBe(true);
    expect(result.wordCount).toBeGreaterThan(3000);  // vs pdf-parse: ~500 words
  });

  it('should fallback to pdf-parse if GROBID fails', async () => {
    // Test with corrupted PDF
    // Verify pdf-parse fallback works
  });

  // Add 5+ more E2E tests
});
```

---

### **Day 1 Checkpoint: Service Implementation Complete**

**Checklist:**
- [ ] Tests written FIRST (25+ tests)
- [ ] GrobidExtractionService implemented (< 300 lines)
- [ ] All functions < 100 lines
- [ ] TypeScript: 0 errors, 0 `any`, 0 `@ts-ignore`
- [ ] Test coverage: 85%+
- [ ] Integrated into pdf-parsing.service (Tier 2.5)
- [ ] Feature flag implemented
- [ ] E2E tests written

**Test Commands:**
```bash
# Unit tests
npm test -- grobid-extraction.service.spec.ts --coverage

# Integration tests
npm run test:e2e -- grobid-integration.e2e.spec.ts

# TypeScript check
npm run build
```

---

## **DAY 2: Testing & Production Prep (8 hours)**

### **Morning: Comprehensive Testing (4 hours)**

#### **Test Matrix: 50 Papers Across All PDF Sources**

| Source | Papers | Expected Quality | Current pdf-parse | Expected GROBID |
|--------|--------|------------------|-------------------|-----------------|
| arXiv | 10 | Clean preprints | 500-800 words | 5000-8000 words |
| ERIC | 10 | Education PDFs | 400-700 words | 3000-6000 words |
| CORE | 10 | Variable quality | 300-600 words | 2000-5000 words |
| Springer | 10 | Academic articles | 500-900 words | 4000-7000 words |
| Unpaywall | 10 | Mixed publishers | 400-800 words | 3000-7000 words |

**Create test script:** `backend/scripts/test-grobid-50-papers.ts`

```typescript
/**
 * GROBID Quality Test: 50 Papers Across All PDF Sources
 * Measures improvement: pdf-parse vs GROBID
 */

interface TestResult {
  source: string;
  paperId: string;
  pdfParseWords: number;
  grobidWords: number;
  improvement: number;  // 6.4x = 640%
  success: boolean;
}

async function testAllSources() {
  const results: TestResult[] = [];

  // Test arXiv (10 papers)
  const arxivPapers = [
    '2301.12345',
    '2302.54321',
    // ... 8 more
  ];

  for (const paperId of arxivPapers) {
    const result = await testPaper('arXiv', paperId);
    results.push(result);
  }

  // Test ERIC, CORE, Springer, Unpaywall...
  // (same pattern)

  // Generate report
  generateQualityReport(results);
}

function generateQualityReport(results: TestResult[]) {
  const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
  const successRate = (results.filter(r => r.success).length / results.length) * 100;

  console.log(`
    === GROBID QUALITY TEST RESULTS ===

    Papers Tested: ${results.length}
    Success Rate: ${successRate.toFixed(1)}%

    Average Word Count:
    - pdf-parse: ${results.reduce((s, r) => s + r.pdfParseWords, 0) / results.length} words
    - GROBID: ${results.reduce((s, r) => s + r.grobidWords, 0) / results.length} words

    Improvement: ${avgImprovement.toFixed(1)}x better

    Expected: 6-10x improvement
    Result: ${avgImprovement >= 6 ? '✅ PASSED' : '❌ FAILED'}
  `);
}
```

```bash
npm run ts-node backend/scripts/test-grobid-50-papers.ts
```

**Expected Output:**
```
✅ SUCCESS: 6.8x average improvement
✅ SUCCESS: 92% success rate
✅ READY FOR PRODUCTION
```

---

### **Afternoon: Production Deployment (4 hours)**

#### **Step 1: Docker Compose Production Config (1 hour)**

**File:** `docker-compose.prod.yml` (add GROBID service)

```yaml
version: '3.8'

services:
  # ... existing services ...

  grobid:
    image: lfoppiano/grobid:0.8.0
    container_name: blackq-grobid-prod
    ports:
      - "8070:8070"
    environment:
      - GROBID_MEMORY=8192m  # 8GB for production
      - JAVA_OPTS=-Xmx8g -Xms2g
    volumes:
      - ./backend/docker/grobid/config.yml:/opt/grobid/grobid-home/config/config.yml:ro
      - grobid-data:/opt/grobid/grobid-home/tmp  # Persistent cache
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8070/api/isalive"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
    restart: unless-stopped
    networks:
      - blackq-network

volumes:
  grobid-data:

networks:
  blackq-network:
    driver: bridge
```

#### **Step 2: Monitoring & Alerting (1 hour)**

**Add GROBID metrics to monitoring service:**

**File:** `backend/src/common/monitoring/metrics.service.ts`

```typescript
// Add GROBID metrics
export class MetricsService {
  // ... existing metrics ...

  // GROBID Performance Metrics
  grobidExtractionCount = 0;
  grobidSuccessCount = 0;
  grobidFailureCount = 0;
  grobidAvgProcessingTime = 0;
  grobidAvgWordCount = 0;

  recordGrobidExtraction(
    success: boolean,
    processingTime: number,
    wordCount?: number,
  ) {
    this.grobidExtractionCount++;

    if (success) {
      this.grobidSuccessCount++;
      if (wordCount) {
        this.grobidAvgWordCount =
          (this.grobidAvgWordCount * (this.grobidSuccessCount - 1) + wordCount) /
          this.grobidSuccessCount;
      }
    } else {
      this.grobidFailureCount++;
    }

    this.grobidAvgProcessingTime =
      (this.grobidAvgProcessingTime * (this.grobidExtractionCount - 1) + processingTime) /
      this.grobidExtractionCount;
  }

  getGrobidMetrics() {
    return {
      totalExtractions: this.grobidExtractionCount,
      successRate: (this.grobidSuccessCount / this.grobidExtractionCount) * 100,
      avgProcessingTime: this.grobidAvgProcessingTime,
      avgWordCount: this.grobidAvgWordCount,
    };
  }
}
```

#### **Step 3: Documentation (1 hour)**

**Create:** `GROBID_DEPLOYMENT_GUIDE.md`

```markdown
# GROBID Service Deployment Guide

## Quick Start

# 1. Start GROBID container
docker-compose up -d grobid

## 2. Verify health
curl http://localhost:8070/api/isalive

## 3. Enable in backend
export GROBID_ENABLED=true

## 4. Restart backend
pm2 restart backend

## Rollback

# Instant disable (no code changes)
export GROBID_ENABLED=false
pm2 restart backend

## Monitoring

# Check metrics
curl http://localhost:4000/api/metrics/grobid

Expected:
- Success rate: > 90%
- Avg processing time: 5-10s
- Avg word count: 4000-6000 words
```

#### **Step 4: Production Deployment (1 hour)**

**Deployment Checklist:**

```bash
# 1. Backup database (in case rollback needed)
pg_dump blackq > backup-$(date +%Y%m%d).sql

# 2. Deploy GROBID container
docker-compose -f docker-compose.prod.yml up -d grobid

# 3. Wait for health check
sleep 120
curl -f http://localhost:8070/api/isalive

# 4. Enable feature flag
echo "GROBID_ENABLED=true" >> backend/.env

# 5. Restart backend
pm2 restart backend

# 6. Monitor logs
pm2 logs backend --lines 100 | grep GROBID

# 7. Test with single paper
curl -X POST http://localhost:4000/api/literature/papers/test-id/fulltext

# 8. Monitor metrics
curl http://localhost:4000/api/metrics/grobid
```

**Expected Metrics After 1 Hour:**
- GROBID extractions: 50-100 papers
- Success rate: > 90%
- Avg improvement: 6-10x over pdf-parse
- Zero errors

---

## 📊 SUCCESS METRICS

### **Before GROBID:**
- PDF extraction: 15% content (781 words from 5000-word article)
- arXiv papers: 500-800 words
- ERIC papers: 400-700 words
- Quality: ❌ POOR

### **After GROBID:**
- PDF extraction: 90%+ content (5000+ words from 5000-word article)
- arXiv papers: 5000-8000 words (6-10x improvement)
- ERIC papers: 3000-6000 words (7-8x improvement)
- Quality: ✅ EXCELLENT

### **Performance:**
- Processing time: 5-10s per paper (acceptable for background job)
- Success rate: > 90%
- Fallback: pdf-parse still works if GROBID fails
- Zero breaking changes

---

## ✅ COMPLETION CRITERIA

Phase 10.94 GROBID Implementation is complete when:

### **Technical:**
- [ ] GROBID service < 300 lines
- [ ] All functions < 100 lines
- [ ] TypeScript: 0 errors, 0 `any`, 0 `@ts-ignore`
- [ ] Test coverage: 85%+
- [ ] 50-paper test: 6-10x improvement confirmed

### **Functional:**
- [ ] GROBID Docker running and healthy
- [ ] PDF extraction works for all sources
- [ ] Feature flag enables/disables correctly
- [ ] Fallback to pdf-parse if GROBID fails
- [ ] Zero errors in production logs

### **Production:**
- [ ] Deployed to production environment
- [ ] Monitoring metrics collecting data
- [ ] Documentation complete
- [ ] Rollback plan tested

---

## 🚀 ROLLOUT PLAN

### **Phase 1: Canary (10% traffic) - Day 1**
- Enable GROBID for 10% of papers
- Monitor success rate
- Compare quality metrics

### **Phase 2: Gradual Rollout (50% traffic) - Day 2**
- If Day 1 successful, increase to 50%
- Continue monitoring

### **Phase 3: Full Rollout (100% traffic) - Day 3**
- Enable for all papers
- GROBID becomes primary PDF extraction method
- pdf-parse remains as fallback

---

## 📚 REFERENCES

### **Phase 10.93 Patterns Applied:**
- ✅ Service size < 300 lines
- ✅ Functions < 100 lines
- ✅ Type safety (zero `any`)
- ✅ TDD approach (tests first)
- ✅ Feature flags for rollback

### **GROBID Documentation:**
- Official Docs: https://grobid.readthedocs.io/
- API Reference: https://grobid.readthedocs.io/en/latest/Grobid-service/
- Docker Image: https://hub.docker.com/r/lfoppiano/grobid

---

**NEXT STEP:** Start Day 0 infrastructure setup (4 hours).
