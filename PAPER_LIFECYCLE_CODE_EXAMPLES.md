# Paper Lifecycle - Code Examples & Implementation Patterns

## Table of Contents
1. [Paper Saving Examples](#paper-saving)
2. [State Management Examples](#state-management)
3. [Theme Extraction Examples](#theme-extraction)
4. [Database Operations](#database-operations)
5. [API Integration Examples](#api-integration)

---

## Paper Saving

### Frontend: Save Single Paper

**File:** `frontend/app/(researcher)/discover/literature/components/SearchResultCard.tsx`

```typescript
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';

export function SearchResultCard({ paper }: { paper: Paper }) {
  const handleSavePaper = usePaperManagementStore(s => s.handleSavePaper);
  const isSaved = usePaperManagementStore(s => s.isSaved(paper.id));
  const [isSaving, setIsSaving] = useState(false);

  const onSaveClick = async () => {
    setIsSaving(true);
    try {
      await handleSavePaper(paper);
      // UI updated by store
    } catch (error) {
      console.error('Failed to save paper:', error);
      toast.error('Failed to save paper');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="paper-card">
      <h3>{paper.title}</h3>
      <p>{paper.authors?.join(', ')}</p>
      
      <Button
        onClick={onSaveClick}
        disabled={isSaving || isSaved}
        variant={isSaved ? 'success' : 'default'}
      >
        {isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save Paper'}
      </Button>
    </div>
  );
}
```

### Frontend: Batch Save Papers

**File:** `frontend/lib/services/theme-extraction/paper-save.service.ts`

```typescript
import { PaperSaveService } from '@/lib/services/theme-extraction/paper-save.service';

export async function handleBatchSave(papers: Paper[], onProgress?: (msg: string) => void) {
  const service = new PaperSaveService();
  const abortController = new AbortController();

  try {
    onProgress?.('Starting batch save...');
    
    const result = await service.batchSave(papers, {
      signal: abortController.signal,
      onProgress: onProgress,
      retryOptions: {
        maxRetries: 3,
        onRetry: (attempt, error, delayMs) => {
          onProgress?.(`Retry ${attempt}/3 - waiting ${delayMs}ms`);
        }
      }
    });

    onProgress?.(`Saved ${result.savedCount}/${papers.length} papers`);
    
    if (result.failedCount > 0) {
      console.error('Failed papers:', result.failedPapers);
    }

    return result;
  } catch (error) {
    onProgress?.(`Error: ${error.message}`);
    throw error;
  }
}
```

### Backend: Save Paper Endpoint

**File:** `backend/src/modules/literature/literature.controller.ts`

```typescript
import { SavePaperDto } from './dto/literature.dto';

@Post('papers/save')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Save a paper to user library' })
@ApiResponse({ status: 201, description: 'Paper saved' })
async savePaper(
  @Body() saveDto: SavePaperDto,
  @CurrentUser() user: any,
) {
  try {
    const result = await this.literatureService.savePaper(
      saveDto,
      user.userId
    );
    return {
      success: true,
      paperId: result.id,
      savedAt: result.createdAt,
    };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new InternalServerErrorException(error.message);
  }
}
```

### Backend: Save Business Logic

**File:** `backend/src/modules/literature/literature.service.ts`

```typescript
async savePaper(
  saveDto: SavePaperDto,
  userId: string,
): Promise<Paper> {
  // Step 1: Validate input
  if (!saveDto.title || !saveDto.source) {
    throw new BadRequestException('Title and source are required');
  }

  // Step 2: Check for duplicates
  const existing = await this.prisma.paper.findFirst({
    where: {
      userId,
      title: saveDto.title,
      year: saveDto.year,
    },
  });

  if (existing) {
    return existing; // Return existing instead of error
  }

  // Step 3: Create paper record
  const paper = await this.prisma.paper.create({
    data: {
      userId,
      title: saveDto.title.trim(),
      authors: saveDto.authors || [],
      year: saveDto.year,
      abstract: saveDto.abstract?.trim(),
      source: saveDto.source,
      doi: saveDto.doi?.trim(),
      url: saveDto.url?.trim(),
      keywords: saveDto.keywords,
      citationCount: saveDto.citationCount,
      
      // Full-text status
      fullTextStatus: 'not_fetched',
      hasFullText: false,
      
      // Quality metrics
      wordCount: saveDto.wordCount,
      abstractWordCount: saveDto.abstractWordCount,
      qualityScore: saveDto.qualityScore,
      isEligible: saveDto.isEligible,
    },
  });

  // Step 4: Queue full-text fetch (async, non-blocking)
  this.pdfQueueService.enqueue(paper.id, userId).catch((error) => {
    this.logger.error(`Failed to queue PDF: ${error.message}`);
  });

  return paper;
}
```

---

## State Management

### Paper Management Store Usage

**File:** `frontend/lib/stores/paper-management.store.ts` (partial)

```typescript
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';

// In a component
export function PaperLibrary() {
  // Selectors - optimized to prevent re-renders
  const savedPapers = usePaperManagementStore(s => s.savedPapers);
  const selectedCount = usePaperManagementStore(s => s.selectedPapers.size);
  const isLoadingLibrary = usePaperManagementStore(s => s.isLoadingLibrary);
  
  // Actions
  const loadLibrary = usePaperManagementStore(s => s.loadUserLibrary);
  const toggleSelection = usePaperManagementStore(s => s.togglePaperSelection);
  const selectAll = usePaperManagementStore(s => s.selectAll);
  const clearSelection = usePaperManagementStore(s => s.clearSelection);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  return (
    <div>
      <div className="toolbar">
        <span>{selectedCount} selected</span>
        {selectedCount > 0 && (
          <Button onClick={clearSelection}>Clear Selection</Button>
        )}
        {selectedCount === 0 && savedPapers.length > 0 && (
          <Button onClick={() => selectAll(savedPapers.map(p => p.id))}>
            Select All
          </Button>
        )}
      </div>

      {isLoadingLibrary ? (
        <LoadingSpinner />
      ) : (
        <div className="papers-grid">
          {savedPapers.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isSelected={usePaperManagementStore(s =>
                s.isSelected(paper.id)
              )}
              onSelect={() => toggleSelection(paper.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Theme Extraction Store Usage

**File:** `frontend/lib/stores/theme-extraction.store.ts` (partial)

```typescript
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

export function ThemeExtractionPanel() {
  // State selectors
  const unifiedThemes = useThemeExtractionStore(s => s.unifiedThemes);
  const selectedThemeIds = useThemeExtractionStore(s => s.selectedThemeIds);
  const extractionProgress = useThemeExtractionStore(s => s.extractionProgress);
  const analyzingThemes = useThemeExtractionStore(s => s.analyzingThemes);
  
  // Actions
  const addTheme = useThemeExtractionStore(s => s.addTheme);
  const removeTheme = useThemeExtractionStore(s => s.removeTheme);
  const toggleThemeSelection = useThemeExtractionStore(s => s.toggleThemeSelection);
  const updateExtractionProgress = useThemeExtractionStore(s => s.updateExtractionProgress);

  // WebSocket listener (in useEffect)
  useEffect(() => {
    const socket = io('/literature');

    socket.on('extraction-progress', (data) => {
      updateExtractionProgress({
        stage: data.stage,
        percentage: data.percentage,
        papersProcessed: data.papersProcessed,
        papersRemaining: data.papersRemaining,
      });
    });

    socket.on('extraction-complete', (themes) => {
      themes.forEach(theme => addTheme(theme));
    });

    return () => socket.disconnect();
  }, [updateExtractionProgress, addTheme]);

  return (
    <div>
      {analyzingThemes && extractionProgress && (
        <ProgressBar
          percentage={extractionProgress.percentage}
          stage={extractionProgress.stage}
          papersProcessed={extractionProgress.papersProcessed}
          papersRemaining={extractionProgress.papersRemaining}
        />
      )}

      <div className="themes-list">
        {unifiedThemes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedThemeIds.includes(theme.id)}
            onToggle={() => toggleThemeSelection(theme.id)}
            onRemove={() => removeTheme(theme.id)}
          />
        ))}
      </div>

      {selectedThemeIds.length > 0 && (
        <Button onClick={() => generateStatements(selectedThemeIds)}>
          Generate Statements
        </Button>
      )}
    </div>
  );
}
```

---

## Theme Extraction

### Batch Theme Extraction

**Frontend:**
```typescript
import { literatureAPI } from '@/lib/services/literature-api.service';

async function extractThemesBatch(
  corpusId: string,
  paperIds: string[],
  purpose: ResearchPurpose,
) {
  try {
    const response = await literatureAPI.extractThemes({
      corpusId,
      paperIds,
      purpose,
      userExpertiseLevel: 'advanced',
    });

    // Response includes themes + saturation data
    return {
      themes: response.themes,
      saturation: {
        isSaturated: response.saturation?.isSaturated || false,
        confidence: response.saturation?.confidence || 0,
      },
    };
  } catch (error) {
    console.error('Theme extraction failed:', error);
    throw error;
  }
}
```

**Backend:**
```typescript
@Post('themes/extract')
@UseGuards(JwtAuthGuard)
async extractThemes(
  @Body() extractDto: ExtractThemesDto,
  @CurrentUser() user: any,
) {
  return await this.themeExtractionService.extractThemesBatch({
    userId: user.userId,
    corpusId: extractDto.corpusId,
    paperIds: extractDto.paperIds,
    purpose: extractDto.purpose,
    userExpertiseLevel: extractDto.userExpertiseLevel,
  });
}
```

### Incremental Theme Extraction

**Frontend:**
```typescript
async function extractThemesIncremental(
  corpusId: string,
  newPaperIds: string[],
  previousThemeIds: string[],
  iterationNumber: number,
) {
  const response = await literatureAPI.extractThemesIncremental({
    corpusId,
    newPaperIds,
    previousThemeIds,
    extractionIteration: iterationNumber,
  });

  return {
    newThemes: response.newThemes,
    refinedThemes: response.refinedThemes,
    saturation: response.saturation,
  };
}
```

---

## Database Operations

### Create Paper Record

```typescript
// Prisma
const paper = await prisma.paper.create({
  data: {
    userId: 'user-123',
    title: 'Deep Learning in Education',
    authors: ['John Doe', 'Jane Smith'],
    year: 2023,
    abstract: '...',
    source: 'arxiv',
    doi: '10.1234/example',
    fullTextStatus: 'not_fetched',
    hasFullText: false,
    wordCount: 5000,
    qualityScore: 78.5,
    isEligible: true,
  },
});
```

### Query Papers by User

```typescript
const papers = await prisma.paper.findMany({
  where: {
    userId: 'user-123',
    source: 'arxiv',
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

### Create Extraction Corpus

```typescript
const corpus = await prisma.extractionCorpus.create({
  data: {
    userId: 'user-123',
    name: 'AI in Education - 2023',
    purpose: 'hypothesis_generation',
    paperIds: ['paper-1', 'paper-2', 'paper-3'],
    themeCount: 0,
    lastExtractedAt: new Date(),
    isSaturated: false,
    totalExtractions: 1,
  },
});
```

### Extract Themes & Store

```typescript
// 1. Call GPT-4 theme extraction
const aiResponse = await openai.createChatCompletion({
  model: 'gpt-4-turbo-preview',
  messages: [{
    role: 'user',
    content: `Extract 5-10 major themes from these papers: ${fullText}`,
  }],
});

// 2. Parse response
const themes = parseThemesFromAI(aiResponse.content);

// 3. Store in database
for (const theme of themes) {
  const unifiedTheme = await prisma.unifiedTheme.create({
    data: {
      label: theme.label,
      description: theme.description,
      keywords: theme.keywords,
      weight: theme.relevanceScore,
      extractedAt: new Date(),
      extractionModel: 'gpt-4-turbo-preview',
      confidence: theme.confidence,
    },
  });

  // 4. Store provenance
  for (const paper of papersUsed) {
    await prisma.themeSource.create({
      data: {
        themeId: unifiedTheme.id,
        sourceType: 'paper',
        sourceId: paper.id,
        sourceTitle: paper.title,
        influence: 1 / papersUsed.length, // Equal influence
        keywordMatches: countMatches(theme.keywords, paper.fullText),
      },
    });
  }
}
```

### Create Statements from Themes

```typescript
// 1. Load themes
const themes = await prisma.unifiedTheme.findMany({
  where: { id: { in: themeIds } },
});

// 2. Call AI to generate statements
const statements = [];
for (const theme of themes) {
  const response = await openai.createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [{
      role: 'user',
      content: `Generate 3 Q-sort statements about: ${theme.label}`,
    }],
  });

  const generatedStatements = parseStatementsFromAI(response.content);
  statements.push(...generatedStatements);
}

// 3. Store statements with provenance
for (let i = 0; i < statements.length; i++) {
  const statement = await prisma.statement.create({
    data: {
      surveyId,
      text: statements[i].text,
      order: i,
      sourcePaperId: statements[i].sourcePaperId,
      sourceThemeId: statements[i].sourceThemeId,
      perspective: statements[i].perspective,
      generationMethod: 'ai-augmented',
      confidence: statements[i].confidence,
      provenance: {
        citationChain: [
          {
            type: 'paper',
            id: paper.id,
            title: paper.title,
          },
          {
            type: 'theme',
            id: theme.id,
            label: theme.label,
          },
        ],
      },
    },
  });
}
```

---

## API Integration

### Axios Configuration with Auth

**File:** `frontend/lib/services/literature-api.service.ts`

```typescript
private api: AxiosInstance;

constructor() {
  this.baseURL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';
  
  this.api = axios.create({
    baseURL: this.baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000, // 60 seconds for literature search
  });

  // Add auth interceptor
  this.api.interceptors.request.use(async (config) => {
    // Skip auth for /auth/ endpoints
    if (config.url?.includes('/auth/')) {
      return config;
    }

    // Get token from auth utils
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
}
```

### API Methods

```typescript
class LiteratureAPIService {
  // Search literature
  async searchLiterature(
    params: SearchLiteratureParams,
  ): Promise<SearchResults> {
    const response = await this.api.post('/search', params);
    return response.data;
  }

  // Save paper
  async savePaper(paper: Paper): Promise<SaveResult> {
    const response = await this.api.post('/papers/save', {
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      doi: paper.doi,
      url: paper.url,
      source: paper.source,
      abstract: paper.abstract,
      keywords: paper.keywords,
      citationCount: paper.citationCount,
    });
    return response.data;
  }

  // Get user library
  async getUserLibrary(
    page: number = 1,
    limit: number = 50,
  ): Promise<PaperLibrary> {
    const response = await this.api.get('/papers', {
      params: { page, limit },
    });
    return {
      papers: response.data.papers,
      total: response.data.total,
      page,
      limit,
    };
  }

  // Extract themes
  async extractThemes(
    payload: ExtractThemesPayload,
  ): Promise<ExtractResult> {
    const response = await this.api.post('/themes/extract', payload);
    return response.data;
  }
}

export const literatureAPI = new LiteratureAPIService();
```

### WebSocket Progress Tracking

```typescript
import { io } from 'socket.io-client';

export function useExtractionProgress(requestId: string) {
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);

  useEffect(() => {
    const socket = io(`${process.env['NEXT_PUBLIC_API_URL']}`, {
      auth: {
        token: getAuthToken(),
      },
    });

    socket.on('extraction-progress', (data) => {
      if (data.requestId === requestId) {
        setProgress({
          stage: data.stage,
          percentage: data.percentage,
          papersProcessed: data.papersProcessed,
          papersRemaining: data.papersRemaining,
          saturation: data.saturation,
        });
      }
    });

    return () => socket.disconnect();
  }, [requestId]);

  return progress;
}
```

---

## Key Implementation Files

### Frontend
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/paper-management.store.ts` (690 lines)
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/theme-extraction.store.ts` (315 lines)
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/services/literature-api.service.ts` (1000+ lines)
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/services/theme-extraction/paper-save.service.ts` (368 lines)

### Backend
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/literature.service.ts` (2000+ lines)
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/literature.controller.ts` (1500+ lines)
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/prisma/schema.prisma` (1896 lines)

### Types
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/types/paper-save.types.ts` (197 lines)
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/services/literature-api.service.ts` (lines 5-60 for Paper interface)

