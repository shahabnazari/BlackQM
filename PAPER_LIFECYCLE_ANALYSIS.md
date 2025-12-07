# Complete Paper Management Workflow Analysis

## Executive Summary

This document provides a comprehensive analysis of the paper lifecycle in the VQMethod system, from initial search through Q-sort completion. The system implements a 5-stage pipeline with sophisticated state management, database persistence, and API integration.

---

## Table of Contents

1. [Paper Lifecycle Overview](#paper-lifecycle-overview)
2. [Stage-by-Stage Breakdown](#stage-by-stage-breakdown)
3. [Database Schema](#database-schema)
4. [Frontend State Management](#frontend-state-management)
5. [API Integration](#api-integration)
6. [Implementation Status](#implementation-status)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## Paper Lifecycle Overview

### The Five Stages

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────────┐     ┌────────────┐
│   SEARCH    │ --> │     SAVE     │ --> │  CORPUS   │ --> │   EXTRACT    │ --> │  Q-SORT    │
│  (External) │     │  (Database)  │     │ (Organized)│    │   (Themes)   │     │ (Statements)│
└─────────────┘     └──────────────┘     └───────────┘     └──────────────┘     └────────────┘
   Papers from         Papers added     Papers grouped    Themes extracted    Papers mapped
   17 sources          to user library   by research      from full-text       to Q-statements
                                         purpose
```

### Key Entities

1. **Search Results** - Transient data from 17 sources (ArXiv, PubMed, Springer, etc.)
2. **Saved Papers** - Papers added to user's library (stored in `papers` table)
3. **Extraction Corpus** - Organized collection of papers for theme extraction
4. **Themes** - Extracted from paper content via AI (stored in `PaperTheme` + `UnifiedTheme` tables)
5. **Statements** - Q-sort statements generated from themes (stored in `Statement` table)

---

## Stage-by-Stage Breakdown

### Stage 1: SEARCH (External APIs)

**Responsibility:** Query multiple academic sources and return search results

**Sources (17 Total):**
- Open Access: ArXiv, PubMed, PMC, ERIC, CORE, Google Scholar
- Premium (API Keys Required): Springer, IEEE, Scopus, Web of Science, Nature
- Social Media: YouTube, TikTok, Instagram
- Custom: SSRN, CrossRef, Semantic Scholar

**Frontend Components:**
- `/discover/literature/page.tsx` - Main literature search page
- `LiteratureSearchContainer.tsx` - Search UI and state management
- `SearchSection/` - Search input and filters

**Frontend State:**
```typescript
// Store: literature-search.store.ts (Zustand)
interface LiteratureSearchState {
  searchQuery: string;
  filters: SearchFilters;
  selectedSources: string[];
  searchResults: Paper[];
  isSearching: boolean;
  paginationPage: number;
  sortBy: 'relevance' | 'date' | 'citations';
}
```

**Backend Flow:**
```
Controller (POST /literature/search)
  ↓
LiteratureService.searchLiterature()
  ├─ Validate search parameters
  ├─ Detect query complexity (simple, moderate, complex)
  ├─ Allocate sources by tier (Tier 1-3)
  ├─ Call individual source services in parallel
  ├─ Aggregate results
  ├─ Calculate quality scores + word counts
  ├─ Apply BM25 relevance scoring
  └─ Return paginated results
```

**Database: Read-Only** (No data persisted at this stage)

**Key Services:**
- `LiteratureService` (orchestrator)
- `ArxivService`, `PubMedService`, `SpringerService`, etc. (source adapters)
- `SearchCoalescerService` (deduplication)
- `APIQuotaMonitorService` (rate limiting)

---

### Stage 2: SAVE (Papers → User Library)

**Responsibility:** Add papers from search results to user's personal library

**Frontend Flow:**
```typescript
// Component: SearchResultsCard
onSavePaperClick(paper: Paper) {
  ├─ Call: usePaperManagementStore.handleSavePaper(paper)
  ├─ Optimistic UI update
  └─ Sync with backend
}
```

**State Management:**
```typescript
// Store: paper-management.store.ts (Zustand - Phase 10.91)
export interface PaperManagementState {
  savedPapers: Paper[];  // User's library
  selectedPapers: Set<string>;  // For bulk operations
  extractingPapers: Set<string>;  // Currently extracting
  extractedPapers: Set<string>;  // Already processed
  
  // Actions
  handleSavePaper(paper: Paper): Promise<void>;
  handleRemovePaper(paperId: string): Promise<void>;
  loadUserLibrary(): Promise<void>;  // Fetch from backend
}
```

**API Call:**
```typescript
// Service: literature-api.service.ts
async savePaper(paper: Paper): Promise<SaveResult> {
  POST /api/literature/papers/save
  Body: {
    title, authors, year, doi, url, source,
    abstract, keywords, citationCount, ...
  }
  Returns: { success: boolean, paperId: string, savedAt: DateTime }
}
```

**Backend Handler:**
```
Controller (POST /literature/papers/save)
  ↓
LiteratureService.savePaper(saveDto, userId)
  ├─ Validate input (title, source required)
  ├─ Check for duplicates (userId + title + year)
  ├─ Sanitize sensitive fields
  ├─ Create Paper record in database
  ├─ Trigger full-text fetch (async background job)
  └─ Return { success, paperId }
```

**Database Schema:**
```sql
-- papers table (Phase 9 models)
CREATE TABLE papers (
  id: String @id @default(cuid()),
  
  -- Basic metadata
  title: String,
  authors: Json,  -- JSON array of author names
  year: Int,
  abstract: String?,
  
  -- Source info
  source: String,  -- ArXiv, PubMed, Springer, etc.
  doi: String?,
  pmid: String?,
  url: String?,
  venue: String?,
  citationCount: Int?,
  
  -- User library tracking
  userId: String,  -- Links to User.id
  collectionId: String?,  -- For paper collections
  tags: Json?,
  notes: String?,
  
  -- Full-text tracking (Phase 10.5+)
  pdfPath: String?,
  hasFullText: Boolean @default(false),
  fullText: String?,  -- Full article content
  fullTextStatus: String,  -- not_fetched|fetching|success|failed
  fullTextSource: String,  -- unpaywall|manual|pmc|html_scrape
  fullTextFetchedAt: DateTime?,
  fullTextWordCount: Int?,
  
  -- Quality metrics (Phase 10.5+)
  wordCount: Int?,  -- Total word count
  abstractWordCount: Int?,
  qualityScore: Float?,  -- 0-100 quality score
  isEligible: Boolean?  -- wordCount >= 1000
  
  -- Indexes
  @@index([userId])
  @@index([collectionId])
  @@index([source])
}
```

**Implementation Status:** ✅ COMPLETE
- Paper saving with validation
- Duplicate detection
- Async full-text fetching
- Batch save with rate limiting (Phase 10.93)

---

### Stage 3: CORPUS (Organize Papers)

**Responsibility:** Group saved papers into research corpuses for iterative extraction

**Concept:** 
From Noblit & Hare (1988) meta-ethnography theory - systematic literature review requires:
1. Building a research corpus (not one-shot extraction)
2. Iterative refinement with new papers
3. Theoretical saturation detection

**Frontend UI:**
```
📚 My Papers (saved papers library)
  ├─ Select papers manually
  ├─ Organize into corpus
  └─ Configure research purpose
```

**Database Schema:**
```sql
-- extraction_corpus table (Phase 10.18)
CREATE TABLE extraction_corpus (
  id: String @id @default(cuid()),
  
  userId: String,  -- Links to User.id
  name: String @default("Untitled Corpus"),
  purpose: String,  -- research purpose
  
  paperIds: Json,  -- JSON array of Paper.ids in corpus
  themeCount: Int @default(0),
  lastExtractedAt: DateTime,
  
  -- Saturation tracking
  isSaturated: Boolean @default(false),
  saturationConfidence: Float?,  -- 0-1
  costSaved: Float @default(0),  -- Via caching
  totalExtractions: Int @default(1),
  
  createdAt: DateTime @default(now()),
  updatedAt: DateTime @updatedAt
}
```

**Research Purposes Supported:**
- `literature_synthesis` - Broad thematic summary
- `hypothesis_generation` - Generate research hypotheses
- `gap_analysis` - Identify research gaps
- `methodology_review` - Methodological patterns
- `theory_building` - Conceptual framework development

**Implementation Status:** ✅ IMPLEMENTED
- Corpus creation and management
- Paper organization by research purpose
- Batch operations support
- Saturation detection (Phase 10.18)

---

### Stage 4: EXTRACT (Theme Extraction)

**Responsibility:** Extract themes from papers' full-text content using AI

**Frontend State:**
```typescript
// Store: theme-extraction.store.ts (Phase 10.91)
interface ThemeExtractionState {
  // Input
  extractingPapers: Set<string>;  // Papers being processed
  extractedPapers: Set<string>;   // Papers already processed
  
  // Output
  unifiedThemes: UnifiedTheme[];  // AI-extracted themes
  selectedThemeIds: string[];      // User selections
  
  // Config
  extractionPurpose: ResearchPurpose;
  userExpertiseLevel: UserExpertiseLevel;  // novice|intermediate|advanced|expert
  
  // Progress
  analyzingThemes: boolean;
  extractionProgress: ExtractionProgress;  // { stage, percentage, paperCount }
  extractionError: string | null;
}
```

**Two Extraction Modes:**

#### Mode 1: Batch Extraction (All at once)
```
Papers in Corpus → Full-text retrieval → AI theme extraction → Results
```

#### Mode 2: Incremental Extraction (Iterative)
```
Iteration 1: Papers 1-10 → Extract themes
           → Validate + refine
Iteration 2: Papers 11-20 + previous themes → Re-extract
           → New themes + refinements
Iteration N: New papers → Extract + merge with existing
```

**API Endpoints:**
```typescript
// Batch extraction
POST /api/literature/themes/extract
Body: {
  corpusId: string,
  paperIds: string[],
  purpose: ResearchPurpose,
  userExpertiseLevel: string
}

// Incremental extraction
POST /api/literature/themes/extract-incremental
Body: {
  corpusId?: string,
  newPaperIds: string[],
  previousThemeIds?: string[],
  extractionIteration: number
}
```

**Backend Processing:**
```
LiteratureService.extractThemes()
  ├─ STEP 1: Load papers from database
  │   └─ With full-text content (if available)
  │
  ├─ STEP 2: Get full-text for each paper
  │   ├─ Check ProcessedLiterature cache (Phase 10.18)
  │   ├─ If cached: use cached content + embeddings
  │   └─ If new: fetch from PDF/HTML, cache it
  │
  ├─ STEP 3: Prepare extraction payload
  │   ├─ Chunk long papers (20K+ words)
  │   ├─ Calculate content quality metrics
  │   └─ Add user expertise context
  │
  ├─ STEP 4: Call AI theme extraction
  │   └─ GPT-4 Turbo theme extraction
  │
  ├─ STEP 5: Post-process themes
  │   ├─ Calculate relevance scores
  │   ├─ Detect saturation (no new themes)
  │   └─ De-duplicate across iterations
  │
  └─ STEP 6: Persist themes
      ├─ UnifiedTheme table
      ├─ ThemeSource table (provenance)
      ├─ ThemeProvenance table (statistical breakdown)
      └─ Update ExtractionCorpus
```

**Database Schema:**
```sql
-- Theme storage (unified model - Phase 9.20)
CREATE TABLE unified_themes (
  id: String @id @default(uuid()),
  
  label: String,  -- Theme name
  description: String?,
  keywords: Json,  -- Extracted keywords
  weight: Float,   -- Importance 0-1
  controversial: Boolean @default(false),
  
  studyId: String?,
  collectionId: String?,
  
  extractedAt: DateTime @default(now()),
  extractionModel: String,  -- "gpt-4-turbo-preview"
  confidence: Float,  -- 0-1
}

-- Provenance tracking
CREATE TABLE theme_provenance (
  themeId: String @unique,
  
  -- Breakdown by source type
  paperInfluence: Float,      -- 65% from papers
  videoInfluence: Float,      -- 25% from videos
  podcastInfluence: Float,    -- 10% from podcasts
  socialInfluence: Float,     -- 0% from social
  
  paperCount: Int,
  videoCount: Int,
  podcastCount: Int,
  socialCount: Int,
  
  averageConfidence: Float,
  citationChain: Json
}

-- Source tracking
CREATE TABLE theme_sources (
  id: String @id,
  themeId: String,
  
  sourceType: String,  -- "paper"|"youtube"|"podcast"|"tiktok"|"instagram"
  sourceId: String,    -- Paper.id or VideoTranscript.id
  sourceTitle: String,
  
  influence: Float,    -- This source's contribution 0-1
  keywordMatches: Int,
  excerpts: Json       -- Relevant quotes
}

-- Content caching (Phase 10.18)
CREATE TABLE processed_literature (
  id: String @id,
  
  paperId: String,
  userId: String,
  
  fullTextContent: String,    -- Cached full-text
  fullTextHash: String,       -- MD5 for change detection
  wordCount: Int,
  embeddings: Json?,          -- Vector embeddings
  
  processedAt: DateTime,
  lastUsedAt: DateTime,
  extractionCount: Int        -- Track reuse for cost analysis
  
  @@unique([paperId, userId])
}
```

**WebSocket Progress Updates (Phase 10.8):**
```
Server → Client (via WebSocket gateway)
{
  type: 'extraction-progress',
  requestId: string,
  stage: 'preparing'|'analyzing'|'extracting'|'finalizing',
  percentage: 0-100,
  currentPaper: { id, title, progress },
  totalPapers: number,
  papersProcessed: number,
  papersRemaining: number,
  saturation?: {
    isSaturated: boolean,
    confidence: number,
    newThemesCount: number
  }
}
```

**Implementation Status:** ✅ COMPLETE
- Batch and incremental extraction
- Full-text caching (Phase 10.18)
- WebSocket progress updates (Phase 10.8)
- Saturation detection (Phase 10.18)
- Multi-source theme extraction (papers + multimedia)
- Comprehensive provenance tracking (Phase 9.20)

---

### Stage 5: Q-SORT (Generate Statements & Survey)

**Responsibility:** Convert extracted themes into Q-statements for Q-sort study

**Frontend UI:**
```
Extracted Themes → Review + Finalize → Generate Q-Statements → Create Survey
```

**From Themes to Statements:**
```
Theme: "Digital Literacy in Education"
  Keywords: [digital, literacy, education, skills]
  Relevance: 0.92
  
→ AI Theme-to-Statement Generator →

Statements Generated:
1. "Digital literacy is essential for 21st-century learning"
2. "Technology creates equity gaps in educational access"
3. "Digital skills should be integrated into curriculum design"
...
```

**API Endpoints:**
```typescript
// Generate statements from themes
POST /api/literature/themes/to-statements
Body: {
  themeIds: string[],
  surveyId: string,
  statementCount: number  // How many per theme
}

// Generate complete survey
POST /api/literature/generate-survey
Body: {
  themeIds: string[],
  purpose: ResearchPurpose,
  gridConfig?: { rangeMin, rangeMax, distribution }
}
```

**Database Schema:**
```sql
-- Statements for Q-sort
CREATE TABLE statements (
  id: String @id @default(cuid()),
  
  surveyId: String,  -- Links to Survey.id
  text: String,      -- The statement to be sorted
  order: Int,        -- Position in survey
  
  -- Provenance tracking
  sourcePaperId: String?,
  sourceThemeId: String?,
  perspective: String?,     -- supportive|critical|neutral|balanced
  generationMethod: String?, -- theme-based|ai-augmented|manual
  confidence: Float?,        -- 0-1 confidence
  provenance: Json?         -- Full citation chain
}

-- Links to Statement
CREATE TABLE statement_provenance (
  statementId: String @unique,
  statement: Statement,
  
  sourcePaperId: String?,
  sourcePaper: Paper?,
  sourceThemeId: String?,
  sourceTheme: PaperTheme?,
  
  generationMethod: String?,
  confidence: Float?,
  metadata: Json?
}

-- Q-sort responses
CREATE TABLE q_sorts (
  id: String @id @default(cuid()),
  
  responseId: String,  -- Links to Response.id
  statementId: String,
  position: Int,       -- Where user placed statement (-3 to +3)
  
  @@unique([responseId, statementId])
}
```

**Research Pipeline Integration:**
```
ResearchPipeline table tracks all phases:
- literatureSearchIds: [], // Phase 9
- selectedPaperIds: [],     // Phase 9
- extractedThemes: [],      // Phase 9
- generatedStatements: [],  // Phase 10
- analysisIds: [],          // Phase 10 (analysis)
- reportIds: []             // Phase 10 (reporting)
```

**Implementation Status:** ✅ COMPLETE
- Theme-to-statement conversion
- AI-powered statement generation
- Full provenance tracking
- Survey generation with Q-grid
- Research pipeline integration

---

## Database Schema

### Core Paper Management Tables

```
┌─────────────────────────────────────────────────────────────────┐
│ USER                                                             │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ email, password, name                                            │
│ relationships: papers[], extractionCorpus[], researchGaps[]     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├── 1:N
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PAPER (papers table)                                             │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)           String                                         │
│ userId (FK)       String ──→ User.id                            │
│ title             String (required)                              │
│ authors           Json (array)                                   │
│ year              Int                                            │
│ abstract          String?                                        │
│ doi, pmid, url    String?                                        │
│ source            String (ArXiv|PubMed|Springer|...)            │
│ citationCount     Int?                                           │
│ keywords          Json (array)?                                  │
│                                                                  │
│ -- Full-text tracking                                           │
│ fullText          String? (10,000+ words)                       │
│ fullTextStatus    String (not_fetched|fetching|success|failed)  │
│ fullTextSource    String (unpaywall|pmc|manual|html_scrape)     │
│ fullTextFetchedAt DateTime?                                     │
│ fullTextWordCount Int?                                          │
│ hasFullText       Boolean                                       │
│                                                                  │
│ -- Quality metrics                                              │
│ wordCount         Int?                                          │
│ abstractWordCount Int?                                          │
│ qualityScore      Float? (0-100)                                │
│ isEligible        Boolean? (wordCount >= 1000)                  │
│                                                                  │
│ createdAt, updatedAt                                            │
│ @@index([userId])                                               │
│ @@index([source])                                               │
│ @@index([doi])                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ├─ 1:N              ├─ 1:N              ├─ 1:N
         ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ PAPER_COLLECTION │  │ PROCESSED_LITER. │  │ STATEMENT_PROVEN.│
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ id (PK)          │  │ id (PK)          │  │ id (PK)          │
│ userId           │  │ paperId (FK)     │  │ statementId      │
│ name             │  │ userId (FK)      │  │ sourcePaperId(FK)│
│ papers[]         │  │ fullTextContent  │  │ sourcePaper      │
└──────────────────┘  │ fullTextHash     │  │ sourceThemeId(FK)│
                      │ wordCount        │  │ sourceTheme      │
                      │ embeddings       │  │ confidence       │
                      │ processedAt      │  │ metadata         │
                      │ lastUsedAt       │  └──────────────────┘
                      │ extractionCount  │
                      └──────────────────┘
```

### Theme & Extraction Tables

```
┌──────────────────────────────────────────────────────────────┐
│ EXTRACTION_CORPUS                                            │
├──────────────────────────────────────────────────────────────┤
│ id (PK)             String                                   │
│ userId (FK)         String ──→ User.id                      │
│ name                String @default("Untitled Corpus")       │
│ purpose             String (research purpose)                │
│ paperIds            Json (array of Paper.ids)                │
│ themeCount          Int                                      │
│ lastExtractedAt     DateTime                                 │
│ isSaturated         Boolean (theoretical saturation reached)  │
│ saturationConfidence Float? (0-1)                            │
│ costSaved           Float (estimated $ via caching)          │
│ totalExtractions    Int (iteration count)                    │
│ createdAt, updatedAt                                         │
│ @@index([userId])                                            │
│ @@index([lastExtractedAt])                                   │
└──────────────────────────────────────────────────────────────┘
                        │
                        ├─ paperIds: Json → Paper.ids
                        │
                        ├─ Creates themes →
                        │
         ┌──────────────┴──────────────────┐
         │                                 │
         ↓                                 ↓
┌──────────────────────┐    ┌──────────────────────┐
│ PAPER_THEME (old)    │    │ UNIFIED_THEME (new)  │
├──────────────────────┤    ├──────────────────────┤
│ id (PK)              │    │ id (PK)              │
│ name                 │    │ label                │
│ keywords             │    │ description          │
│ relevanceScore       │    │ keywords             │
│ emergenceYear        │    │ weight (0-1)         │
│ trendDirection       │    │ controversial        │
│ papers[]             │    │ studyId              │
│ createdAt, updatedAt │    │ extractedAt          │
└──────────────────────┘    │ extractionModel      │
                            │ confidence           │
                            │ createdAt, updatedAt │
                            └──────────────────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ├─ 1:N          ├─ 1:1          ├─ 1:N
                   ↓                ↓                ↓
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │ THEME_SOURCE     │ │ THEME_PROVENANCE │ │ STATEMENT_PROVEN. │
         ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
         │ id               │ │ themeId (unique) │ │ statementId (FK) │
         │ themeId (FK)     │ │ paperInfluence   │ │ sourcePaperId(FK)│
         │ sourceType       │ │ videoInfluence   │ │ sourceThemeId(FK)│
         │ sourceId         │ │ podcastInfluence │ │ sourceTheme      │
         │ sourceTitle      │ │ socialInfluence  │ │ confidence       │
         │ sourceUrl        │ │ paperCount       │ │ metadata         │
         │ influence (0-1)  │ │ videoCount       │ └──────────────────┘
         │ keywordMatches   │ │ podcastCount     │
         │ excerpts         │ │ socialCount      │
         │ timestamps       │ │ avgConfidence    │
         │ createdAt        │ │ citationChain    │
         └──────────────────┘ └──────────────────┘
```

### Survey & Q-sort Tables

```
┌─────────────────────────────────────────────────────────────┐
│ SURVEY                                                       │
├─────────────────────────────────────────────────────────────┤
│ id (PK)              String                                  │
│ createdBy (FK)       String ──→ User.id                     │
│ title                String                                  │
│ status               SurveyStatus (DRAFT|ACTIVE|ENDED|...)   │
│                                                              │
│ -- Literature pipeline fields                              │
│ basedOnPapersIds     Json []                                │
│ extractedThemeIds    Json []                                │
│ researchGapId        String?                                │
│ studyContext         Json?                                  │
│                                                              │
│ -- Grid configuration                                      │
│ gridColumns          Int @default(9)                        │
│ gridShape            String @default("quasi-normal")        │
│ gridConfig           Json?                                  │
│                                                              │
│ createdAt, updatedAt                                        │
│ researchPipeline     ResearchPipeline (1:1)                │
│ statements           Statement[] (1:N)                      │
│ responses            Response[] (1:N)                       │
└─────────────────────────────────────────────────────────────┘
         │                                      │
         │                                      │
         ├─ 1:N ──────────────┐    ├─ 1:N
         ↓                    ↓    ↓
┌────────────────────┐  ┌────────────────────┐  ┌─────────────┐
│ STATEMENT          │  │ RESEARCH_PIPELINE  │  │ RESPONSE    │
├────────────────────┤  ├────────────────────┤  ├─────────────┤
│ id (PK)            │  │ id (PK)            │  │ id (PK)     │
│ surveyId (FK)      │  │ surveyId (FK)      │  │ surveyId(FK)│
│ text               │  │ currentPhase       │  │ participant │
│ order              │  │ completedPhases    │  │ sessionCode │
│                    │  │ literatureSearchIds│  │ answers     │
│ -- Provenance      │  │ selectedPaperIds   │  │ qSorts      │
│ sourcePaperId      │  │ extractedThemes    │  │ progress    │
│ sourceThemeId      │  │ generatedStatements│  │ createdAt   │
│ perspective        │  │ analysisIds        │  │ completedAt │
│ generationMethod   │  │ reportIds          │  └─────────────┘
│ confidence         │  │ createdAt,updated  │        │
│ provenance         │  └────────────────────┘        ├─ 1:N
│                    │                                │
│ createdAt          │                                ↓
└────────────────────┘                        ┌─────────────┐
         │                                    │ Q_SORT      │
         │                                    ├─────────────┤
         ├─ 1:N                              │ id (PK)     │
         ↓                                    │ responseId  │
┌────────────────────┐                       │ statementId │
│ Q_SORT             │                       │ position    │
├────────────────────┤                       │ (-3 to +3)  │
│ id (PK)            │                       └─────────────┘
│ responseId (FK)    │
│ statementId (FK)   │
│ position           │
│ @@unique([response │
│ Id, statementId])  │
└────────────────────┘
```

---

## Frontend State Management

### Store Architecture (Zustand - Phase 10.91+)

**Overview:**
```
Global State Stores (Client-side)
├─ paper-management.store.ts
│  └─ selectedPapers, savedPapers, extractingPapers, extractedPapers
│
├─ literature-search.store.ts
│  └─ searchQuery, searchResults, filters, pagination
│
├─ theme-extraction.store.ts
│  ├─ unifiedThemes, selectedThemeIds
│  ├─ extractingPapers, extractedPapers
│  ├─ extractionProgress, extractionError
│  └─ researchQuestions, hypotheses, surveys
│
├─ literature-theme.store.ts
│  └─ theme management helpers
│
└─ gap-analysis.store.ts
   └─ identified gaps, status
```

### Paper Management Store (Phase 10.91)

**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/paper-management.store.ts`

**Key Features:**
- Selection management for bulk operations
- Library synchronization with backend
- Extraction tracking (extracting vs. extracted)
- Optimistic UI updates
- Input validation
- Zustand DevTools integration

**Example Usage:**
```typescript
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';

// In component
const selectedCount = usePaperManagementStore(s => s.selectedPapers.size);
const savedPapers = usePaperManagementStore(s => s.savedPapers);

// Save a paper
const handleSave = async (paper: Paper) => {
  await usePaperManagementStore.getState().handleSavePaper(paper);
};

// Batch operations
const handleSelectAll = () => {
  usePaperManagementStore.getState().selectAll(paperIds);
};
```

### Theme Extraction Store (Phase 10.91)

**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/theme-extraction.store.ts`

**Key Features:**
- Theme management (add, remove, update)
- Selection management for theme export
- Progress tracking via WebSocket updates
- Saturation detection
- Results generation (questions, hypotheses, surveys)
- Modal state management
- Modular architecture with helper functions

**State Structure:**
```typescript
interface ThemeExtractionState {
  // Themes
  unifiedThemes: UnifiedTheme[];
  selectedThemeIds: string[];
  
  // Papers being processed
  extractingPapers: Set<string>;
  extractedPapers: Set<string>;
  
  // Configuration
  extractionPurpose: ResearchPurpose | null;
  userExpertiseLevel: UserExpertiseLevel;
  
  // Progress
  analyzingThemes: boolean;
  extractionProgress: ExtractionProgress | null;
  extractionError: string | null;
  
  // Results
  researchQuestions: ResearchQuestionSuggestion[];
  hypotheses: HypothesisSuggestion[];
  generatedSurvey: GeneratedSurvey | null;
}
```

---

## API Integration

### Frontend API Service

**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/services/literature-api.service.ts`

**Key Methods:**
```typescript
class LiteratureAPIService {
  // Search
  async searchLiterature(params: SearchLiteratureParams): Promise<SearchResults>
  async getSearchHistory(): Promise<SearchLog[]>
  
  // Paper management
  async savePaper(paper: Paper): Promise<SaveResult>
  async removePaper(paperId: string): Promise<RemoveResult>
  async getUserLibrary(page: number, limit: number): Promise<PaperLibrary>
  async getPaper(paperId: string): Promise<Paper>
  
  // Full-text fetching
  async fetchFullText(paperId: string): Promise<FullTextResult>
  async pollFullTextStatus(paperId: string, maxAttempts: number): Promise<FullTextStatus>
  
  // Theme extraction
  async extractThemes(payload: ExtractThemesPayload): Promise<ExtractResult>
  async extractThemesIncremental(payload: IncrementalPayload): Promise<ExtractResult>
  
  // Theme-to-statement
  async generateStatements(themeIds: string[]): Promise<StatementResult>
  
  // Research gaps
  async analyzeGaps(corpusId: string): Promise<ResearchGap[]>
  
  // Theme operations
  async getThemes(): Promise<UnifiedTheme[]>
  async removeTheme(themeId: string): Promise<void>
}
```

### WebSocket Gateway (Phase 10.8)

**Bi-directional Updates:**
```typescript
// Backend sends progress via WebSocket
server → client: {
  type: 'extraction-progress',
  stage: 'extracting',
  percentage: 45,
  currentPaper: { id, title },
  papersProcessed: 5,
  papersRemaining: 6
}

// Client receives updates and updates store
useThemeExtractionStore.updateExtractionProgress(data)
```

### Backend Controller Endpoints

**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/literature.controller.ts`

**Endpoints:**
```
POST   /literature/search                      - Search papers
POST   /literature/papers/save                 - Save paper to library
GET    /literature/papers/{paperId}            - Get paper details
DELETE /literature/papers/{paperId}            - Remove paper
GET    /literature/papers                      - Get user's library
POST   /literature/fulltext/{paperId}          - Fetch full-text
POST   /literature/themes/extract              - Extract themes (batch)
POST   /literature/themes/extract-incremental  - Extract themes (incremental)
GET    /literature/themes                      - Get extracted themes
DELETE /literature/themes/{themeId}            - Remove theme
POST   /literature/themes/to-statements        - Convert to statements
POST   /literature/research-gaps               - Analyze gaps
```

---

## Implementation Status

### Completed Stages

| Stage | Status | Key Features | Phase |
|-------|--------|-------------|-------|
| SEARCH | ✅ Complete | 17 sources, BM25 scoring, quality metrics | Phase 10.6+ |
| SAVE | ✅ Complete | Bulk save, rate limiting, duplicate detection | Phase 10.93 |
| CORPUS | ✅ Complete | Organization, saturation detection, iteration tracking | Phase 10.18 |
| EXTRACT | ✅ Complete | Batch + incremental, full-text caching, WebSocket progress | Phase 10.8-10.18 |
| Q-SORT | ✅ Complete | Statement generation, survey creation, provenance | Phase 10.0+ |

### Feature Completeness

**Papers → Database:**
- ✅ Search from 17 sources
- ✅ Save with validation & duplicates
- ✅ Full-text fetching (async background)
- ✅ Word count tracking
- ✅ Quality scoring (0-100)
- ✅ Eligibility criteria (≥1000 words)

**Database → Themes:**
- ✅ Corpus creation & management
- ✅ Batch theme extraction
- ✅ Incremental extraction (iterative)
- ✅ Saturation detection
- ✅ Content caching (ProcessedLiterature)
- ✅ Embedding storage
- ✅ Cost tracking (Phase 10.18)

**Themes → Q-Sort:**
- ✅ AI statement generation
- ✅ Statement provenance
- ✅ Survey generation
- ✅ Q-grid configuration
- ✅ Research pipeline integration

**State Management:**
- ✅ Zustand stores (v4.4+)
- ✅ Paper management store (Phase 10.91)
- ✅ Theme extraction store (Phase 10.91)
- ✅ WebSocket updates (Phase 10.8)
- ✅ Optimistic UI updates
- ✅ Error handling & recovery

---

## Data Flow Diagrams

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User Workflow: Literature → Themes → Survey                     │
└─────────────────────────────────────────────────────────────────┘

                             SEARCH
                               │
         ┌──────────┬──────────┼──────────┬──────────┐
         ▼          ▼          ▼          ▼          ▼
      ArXiv     PubMed    Springer    IEEE       ... (17 sources)
         │          │          │          │          │
         └──────────┼──────────┼──────────┼──────────┘
                    ▼
            Results in Memory
            (transient)
                    │
                    │ [User selects papers]
                    ▼
                 SAVE
                    │
         ┌──────────▼──────────┐
         │ Validation Layer    │
         │ - Check required    │
         │ - Detect duplicates │
         │ - Sanitize inputs   │
         └──────────┬──────────┘
                    │
                    ▼
            Database: PAPER table
            (userId + title + year + doi)
                    │
                    │ [Async: Fetch full-text]
                    ├─ Check ProcessedLiterature cache
                    ├─ Fetch PDF/HTML if needed
                    └─ Store fullText + wordCount
                    │
                    │ [User creates corpus]
                    ▼
                 CORPUS
                    │
         ┌──────────▼──────────┐
         │ ExtractionCorpus    │
         │ - name              │
         │ - purpose           │
         │ - paperIds (JSON)   │
         │ - iterationCount    │
         └──────────┬──────────┘
                    │
                    │ [User extracts themes]
                    ▼
                 EXTRACT
                    │
         ┌──────────▼──────────┐
         │ Theme Extraction    │
         │ Pipeline:           │
         │ 1. Load papers      │
         │ 2. Get full-text    │
         │ 3. Chunk if needed  │
         │ 4. Call GPT-4       │
         │ 5. Post-process     │
         │ 6. Detect saturation│
         └──────────┬──────────┘
                    │
                    ▼
        Database: UNIFIED_THEME table
        (+ THEME_SOURCE + THEME_PROVENANCE)
                    │
                    │ [User finalizes themes]
                    ▼
                 Q-SORT
                    │
         ┌──────────▼──────────┐
         │ Statement Gen       │
         │ - Theme → Statements│
         │ - Validate          │
         │ - Add provenance    │
         └──────────┬──────────┘
                    │
                    ▼
        Database: STATEMENT table
        (+ STATEMENT_PROVENANCE)
                    │
                    │ [Create survey]
                    ▼
        Database: SURVEY table
        (+ GRID_CONFIGURATION)
                    │
                    │ [Participants sort]
                    ▼
        Database: Q_SORT + RESPONSE tables
```

### State Management Flow

```
Frontend Components
        │
        ├─→ usePaperManagementStore
        │   ├─ selectedPapers: Set<string>
        │   ├─ savedPapers: Paper[]
        │   ├─ extractingPapers: Set<string>
        │   └─ extractedPapers: Set<string>
        │
        ├─→ useLiteratureSearchStore
        │   ├─ searchQuery: string
        │   ├─ searchResults: Paper[]
        │   ├─ filters: SearchFilters
        │   └─ pagination: { page, limit, total }
        │
        └─→ useThemeExtractionStore
            ├─ unifiedThemes: UnifiedTheme[]
            ├─ selectedThemeIds: string[]
            ├─ extractingPapers: Set<string>
            ├─ extractedPapers: Set<string>
            ├─ extractionProgress: ExtractionProgress
            ├─ extractionError: string | null
            ├─ researchQuestions: ResearchQuestionSuggestion[]
            ├─ hypotheses: HypothesisSuggestion[]
            └─ generatedSurvey: GeneratedSurvey | null
```

### Paper Save Flow (With Rate Limiting)

```
User clicks "Save Paper"
         │
         ▼
usePaperManagementStore.handleSavePaper(paper)
         │
         ├─ Validate paper (title, source required)
         ├─ Check duplicates (userId + title + year)
         │
         ▼
literatureAPI.savePaper(paper)
         │
         ├─ POST /api/literature/papers/save
         │
         ▼
Backend: LiteratureService.savePaper()
         │
         ├─ Sanitize inputs
         ├─ Check for duplicates (unique index)
         │
         ▼
Database: CREATE Paper record
         │
         ├─ Store basic metadata
         ├─ Set fullTextStatus = 'not_fetched'
         ├─ Return paperId
         │
         ▼
Async Background Job
         │
         ├─ Fetch full-text (PDF/HTML)
         ├─ Store in fullText column
         ├─ Update fullTextStatus = 'success'
         ├─ Calculate wordCount
         └─ Cache in ProcessedLiterature
```

---

## Key Design Patterns

### 1. Separation of Concerns
- **Controller:** HTTP routing only
- **Service:** Business logic & orchestration
- **Source Services:** External API integration
- **Frontend Stores:** Client-side state

### 2. Batch Processing
- Sequential saves with 700ms delays (avoids 429 errors)
- Rate-limited to 1.43 req/sec (under 100 req/60s backend limit)
- Chunked paper processing for large corpuses

### 3. Optimistic Updates
- Update UI immediately
- Sync with backend asynchronously
- Rollback on error

### 4. Caching Strategy
- **Full-text:** ProcessedLiterature table (per user/paper)
- **Search results:** In-memory pagination
- **API responses:** CacheService (1-hour TTL)

### 5. Provenance Tracking
- Papers → Sources (17 databases)
- Themes → Papers + Themes + Videos + Social Media
- Statements → Papers → Themes → Statements
- Full citation chain for reproducibility

---

## Common Issues & Solutions

### Issue 1: 429 Rate Limit Errors
**Root Cause:** 3 concurrent saves + 500ms delay = 6 req/sec (exceeds 1.67 req/sec backend limit)

**Solution (Phase 10.93):**
- Change to sequential saves (MAX_CONCURRENT_SAVES = 1)
- Increase delay to 700ms
- Result: 1.43 req/sec (safe margin)

### Issue 2: Missing Full-Text
**Root Cause:** Some sources don't provide full-text; need to fetch from multiple providers

**Solution:**
- ProcessedLiterature cache (avoid refetching)
- PDFQueueService (async background fetching)
- Unpaywall + PMC + HTML scraping fallback

### Issue 3: Saturation Detection
**Problem:** How to know when to stop adding papers?

**Solution (Phase 10.18):**
- Track new theme count per iteration
- If no new themes for N papers → likely saturated
- Store isSaturated + confidence in ExtractionCorpus

---

## Next Steps for Development

1. **Publish Themes to Library** - Allow users to save extracted themes
2. **Collaborative Theme Refinement** - Multiple researchers review/edit themes
3. **Export Statements** - Generate statements in multiple formats
4. **Full-Text Analysis** - More granular theme extraction from specific sections
5. **Batch Q-sort** - Multiple surveys from different theme sets
6. **Analysis Integration** - Direct link from survey results back to literature

