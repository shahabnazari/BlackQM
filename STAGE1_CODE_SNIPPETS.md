# Stage 1 Familiarization - Key Code Snippets

## 1. Backend: Where Stats Are Generated

### File: `backend/src/modules/literature/services/unified-theme-extraction.service.ts`

#### Initialization (Lines 3145-3173)
```typescript
const initMessage = {
  stageName: 'Familiarization',
  stageNumber: 1,
  totalStages: 6,
  percentage: 0,
  whatWeAreDoing: `Starting familiarization with ${sources.length} papers...`,
  whyItMatters: 'Beginning semantic embedding generation for thematic analysis...',
  liveStats: {
    sourcesAnalyzed: 0,
    currentOperation: 'Initializing familiarization stage...',
    fullTextRead: 0,        // ← STAT #1: Starts at 0
    abstractsRead: 0,       // ← STAT #2: Starts at 0
    totalWordsRead: 0,      // ← STAT #3: Starts at 0
    currentArticle: 0,
    totalArticles: sources.length,
    articleTitle: 'Starting...',
    articleType: 'abstract' as const,
    articleWords: 0,
  },
};

if (userId && this.themeGateway) {
  this.emitProgress(userId, 'familiarization', 0, 
    `Starting familiarization with ${sources.length} papers...`, 
    initMessage);
  this.logger.log(`📡 Phase 10.95: Emitted initialization message...`);
}
```

#### Per-Paper Loop (Lines 3175-3323)
```typescript
const embeddingTasks = sources.map((source, index) =>
  limit(async () => {
    try {
      // ===== STEP 1: Calculate word count =====
      const wordCount = source.content.split(/\s+/).length;

      // ===== STEP 2: Classify full-text vs. abstract =====
      const isFullText =
        source.metadata?.contentType === 'full_text' ||         // PDF extracted
        (source.metadata?.contentType === 'abstract_overflow' && wordCount > 3000) ||
        wordCount > 3500;  // Heuristic threshold

      // ... [Generate embedding via OpenAI] ...

      // ===== STEP 3: UPDATE STATS (CRITICAL SECTION) =====
      stats.processedCount++;
      if (isFullText) {
        stats.fullTextCount++;          // ← INCREMENT STAT #1
      } else {
        stats.abstractCount++;
      }
      stats.totalWords += wordCount;    // ← INCREMENT STAT #3

      // ===== STEP 4: Create message with updated stats =====
      const progressWithinStage = Math.round(
        (stats.processedCount / sources.length) * 20
      );

      const transparentMessage = {
        stageName: 'Familiarization',
        stageNumber: 1,
        totalStages: 6,
        percentage: progressWithinStage,
        whatWeAreDoing: progressMessage,
        whyItMatters: `SCIENTIFIC PROCESS: Familiarization converts each article...`,
        liveStats: {
          sourcesAnalyzed: stats.processedCount,
          currentOperation: `Reading ${isFullText ? 'full-text' : 'abstract'} ${index + 1}/${sources.length}`,
          fullTextRead: stats.fullTextCount,      // ← STAT #1: Current value
          abstractsRead: stats.abstractCount,     // ← STAT #2: Current value
          totalWordsRead: stats.totalWords,       // ← STAT #3: Current value
          currentArticle: index + 1,
          totalArticles: sources.length,
          articleTitle: source.title.substring(0, 80),
          articleType: (isFullText ? 'full-text' : 'abstract'),
          articleWords: wordCount,
          embeddingStats: {
            dimensions: 3072,
            model: 'text-embedding-3-large',
            totalEmbeddingsGenerated: embeddingCount,
            averageEmbeddingMagnitude: currentAvgMagnitude,
            processingMethod: (currentArticleChunks > 0 ? 'chunked-averaged' : 'single'),
            chunksProcessed: currentArticleChunks || undefined,
          },
        },
      };

      // ===== STEP 5: EMIT via WebSocket =====
      if (userId) {
        this.emitProgress(
          userId,
          'familiarization',
          progressWithinStage,
          progressMessage,
          transparentMessage,  // ← This object with stats is sent
        );
      }

      // ===== STEP 6: EMIT via callback =====
      if (progressCallback) {
        progressCallback(1, 6, progressMessage, transparentMessage);
      }

    } catch (error) {
      // ... [Error handling] ...
      stats.processedCount++;
      this.emitFailedPaperProgress(userId, index, sources.length, stats, 
        `API Error: ${shortError}`, source.title || 'Unknown', progressCallback);
    }
  }),
);
```

#### Final Return (Lines 3494-3512)
```typescript
return {
  embeddings,
  familiarizationStats: {
    fullTextRead: stats.fullTextCount,           // ← STAT #1 final value
    abstractsRead: stats.abstractCount,          // ← STAT #2 final value
    totalWordsRead: stats.totalWords,            // ← STAT #3 final value
    totalArticles: sources.length,
    embeddingStats: {
      model: UnifiedThemeExtractionService.EMBEDDING_MODEL,
      dimensions: UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS,
      totalEmbeddingsGenerated: embeddingCount,
      averageEmbeddingMagnitude: avgMagnitude,
      chunkedArticleCount,
      totalChunksProcessed,
    },
  },
};
```

---

## 2. Backend: WebSocket Gateway Emission

### File: `backend/src/modules/literature/gateways/theme-extraction.gateway.ts`

#### Gateway Definition (Lines 28-34)
```typescript
@WebSocketGateway({
  namespace: '/theme-extraction',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ThemeExtractionGateway {
  @WebSocketServer()
  server!: Server;
```

#### Progress Emission Method (Lines 95-100)
```typescript
emitProgress(progress: ExtractionProgress) {
  this.server.to(progress.userId).emit('extraction-progress', progress);
  this.logger.debug(
    `Progress emitted to user ${progress.userId}: ${progress.stage} - ${progress.percentage}%`,
  );
}
```

#### ExtractionProgress Interface (Lines 20-26)
```typescript
export interface ExtractionProgress {
  userId: string;
  stage: string;           // 'familiarization' for Stage 1
  percentage: number;      // 0-20 for Stage 1
  message: string;
  details?: any;           // Contains TransparentProgressMessage
}
```

**Note:** The `details` field contains the full `TransparentProgressMessage` with:
- `liveStats.fullTextRead`
- `liveStats.abstractsRead`
- `liveStats.totalWordsRead`

---

## 3. Frontend: WebSocket Reception

### File: `frontend/lib/hooks/useThemeExtractionWebSocket.ts`

#### Socket Setup (approx. line 268+)
```typescript
const newSocket = io(`${apiUrl}/theme-extraction`, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

newSocket.on(WS_EVENTS.CONNECT, () => {
  if (IS_DEV) {
    logger.info('WebSocket connected', 'useThemeExtractionWebSocket');
  }
  setConnectionStatus(ConnectionStatus.CONNECTED);
  
  // Join user-specific room for progress updates
  if (userId) {
    newSocket.emit(WS_EVENTS.JOIN, userId);
  }
});

// ===== CRITICAL: EXTRACTION PROGRESS EVENT =====
newSocket.on(WS_EVENTS.EXTRACTION_PROGRESS, (data: WebSocketProgressData) => {
  if (!data || !isValidProgressData(data)) {
    logger.warn('Invalid progress data received', 'useThemeExtractionWebSocket', { data });
    return;
  }

  if (IS_DEV) {
    logger.debug('Extraction progress received', 'useThemeExtractionWebSocket', { 
      stage: data.stage,
      percentage: data.percentage,
      hasTransparentMessage: !!data.details?.transparentMessage,
    });
  }

  const progressData: ExtractionProgressData = {
    stage: data.stage || 'unknown',
    progress: data.percentage || 0,
    details: {
      transparentMessage: data.details?.transparentMessage || 
        (isTransparentMessage(data.details) ? data.details : undefined),
    },
  };

  if (onProgress) {
    onProgress(progressData);
  }
});
```

---

## 4. Frontend: State Management

### File: `frontend/lib/hooks/useThemeExtractionProgress.ts`

#### Interface (Lines 13-25)
```typescript
export interface ExtractionProgress {
  isExtracting: boolean;
  currentSource: number;
  totalSources: number;
  progress: number;              // 0-100
  message: string;
  stage: 'preparing' | 'extracting' | 'deduplicating' | 'complete' | 'error';
  error?: string;
  transparentMessage?: TransparentProgressMessage;  // ← Stores WebSocket data including stats
  accumulatedStageMetrics?: Record<number, TransparentProgressMessage>;
}
```

#### Update Method (Lines 57-85)
```typescript
const updateProgress = useCallback(
  (currentSource: number, totalSources: number, 
   transparentMessage?: TransparentProgressMessage) => {
    logger.debug('updateProgress called', 'useThemeExtractionProgress', {
      currentSource,
      totalSources,
      hasTransparentMessage: !!transparentMessage,
    });
    
    if (transparentMessage) {
      logger.debug('Received transparentMessage with liveStats', 
        'useThemeExtractionProgress', {
        sourcesAnalyzed: transparentMessage.liveStats?.sourcesAnalyzed,
        fullTextRead: transparentMessage.liveStats?.fullTextRead,    // ← STAT #1
        abstractsRead: transparentMessage.liveStats?.abstractsRead,  // ← STAT #2
        totalWordsRead: transparentMessage.liveStats?.totalWordsRead, // ← STAT #3
      });
    }

    const progressPercent = totalSources > 0
      ? Math.round((currentSource / totalSources) * 100)
      : 0;

    setProgress(prev => ({
      ...prev,
      currentSource,
      progress: progressPercent,
      message: `Extracting themes from source ${currentSource} of ${totalSources}...`,
      stage: 'extracting',
      ...(transparentMessage && { transparentMessage }),  // ← Store everything
    }));
  },
  []
);
```

---

## 5. Frontend: Display Component

### File: `frontend/components/literature/EnhancedThemeExtractionProgress.tsx`

#### TransparentProgressMessage Interface (Lines 36-73)
```typescript
export interface TransparentProgressMessage {
  stageName: string;
  stageNumber: number;
  totalStages: number;
  percentage: number;
  whatWeAreDoing: string;
  whyItMatters: string;
  liveStats: {
    sourcesAnalyzed: number;
    codesGenerated?: number;
    themesIdentified?: number;
    currentOperation: string;
    
    // ===== STAGE 1 FAMILIARIZATION STATS =====
    fullTextRead?: number;         // ← STAT #1 displayed here
    abstractsRead?: number;        // ← STAT #2 displayed here
    totalWordsRead?: number;       // ← STAT #3 displayed here
    
    // Per-article details
    currentArticle?: number;
    totalArticles?: number;
    articleTitle?: string;
    articleType?: 'full-text' | 'abstract';
    articleWords?: number;
    
    // Scientific metrics
    embeddingStats?: {
      dimensions: number;
      model: string;
      totalEmbeddingsGenerated: number;
      averageEmbeddingMagnitude?: number;
      processingMethod: 'single' | 'chunked-averaged';
      chunksProcessed?: number;
      scientificExplanation?: string;
    };
    familiarizationReport?: {
      downloadUrl?: string;
      embeddingVectors?: boolean;
      completedAt?: string;
    };
  };
}
```

#### Display Logic (What SHOULD be rendered)
```typescript
// This is where the stats SHOULD be displayed for Stage 1
if (currentStage === 1 && transparentMessage?.liveStats) {
  const { fullTextRead, abstractsRead, totalWordsRead } = transparentMessage.liveStats;
  
  // RENDER THESE VALUES:
  // fullTextRead: "Full Articles: {value}"
  // abstractsRead: "Abstracts: {value}"
  // totalWordsRead: "Total Words Read: {value.toLocaleString()}"
}
```

---

## 6. Frontend: Container Integration

### File: `frontend/app/(researcher)/discover/literature/containers/ThemeExtractionContainer.tsx`

#### Metrics Accumulation (Lines 1063-1125)
```typescript
const accumulatedStageMetricsRef = useRef<Record<number, TransparentProgressMessage>>({});

const onProgress = useCallback((data: ExtractionProgressData) => {
  const stageNumber = data.details?.transparentMessage?.stageNumber || 0;
  const { transparentMessage } = data.details || {};
  
  if (transparentMessage && transparentMessage.liveStats) {
    // Store metrics for this stage
    accumulatedStageMetricsRef.current[stageNumber] = transparentMessage;
    
    // For Stage 1, extract and log the stats
    if (stageNumber === 1) {
      const { 
        fullTextRead, 
        abstractsRead, 
        totalWordsRead 
      } = transparentMessage.liveStats;
      
      logger.debug('Stage 1 familiarization metrics', 'ThemeExtractionContainer', {
        fullTextRead,
        abstractsRead,
        totalWordsRead,
      });
    }
  }
  
  // Pass accumulated metrics to progress modal
  const progressUpdate = {
    // ... other fields ...
    accumulatedStageMetrics: accumulatedStageMetricsRef.current,  // ← Pass to modal
  };
  
  // Update progress state
  updateProgress(
    data.currentSource || 0,
    totalSources,
    transparentMessage
  );
}, []);
```

#### HTTP Fallback (Lines 1105-1125)
```typescript
// If WebSocket data is missing, use HTTP response as fallback
if (response.familiarizationStats) {
  const { 
    fullTextRead, 
    abstractsRead, 
    totalWordsRead 
  } = response.familiarizationStats;
  
  logger.info('Using HTTP response familiarizationStats as fallback (WebSocket data missing)', 
    'ThemeExtractionContainer');
    
  // Fallback: Create synthetic transparentMessage from HTTP data
  const fallbackTransparent: TransparentProgressMessage = {
    stageName: 'Familiarization',
    stageNumber: 1,
    totalStages: 6,
    percentage: 20,
    whatWeAreDoing: 'Familiarization complete (data from HTTP response)',
    whyItMatters: 'Stage 1 complete',
    liveStats: {
      sourcesAnalyzed: response.metadata?.processedPapers || totalSources,
      fullTextRead,      // ← From HTTP response
      abstractsRead,     // ← From HTTP response
      totalWordsRead,    // ← From HTTP response
      currentOperation: 'Familiarization complete',
    },
  };
}
```

---

## 7. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: unified-theme-extraction.service.ts                     │
├─────────────────────────────────────────────────────────────────┤
│ Stats Object:                                                     │
│ {                                                                 │
│   processedCount: 0,    // Internal counter                      │
│   fullTextCount: 0,  ←─ STAT #1 (counts > 3500 word articles)   │
│   abstractCount: 0,     // Not explicitly named in stats          │
│   totalWords: 0      ←─ STAT #3 (sum of all word counts)        │
│ }                                                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ For each paper in sources:
                 │  1. Calculate wordCount
                 │  2. Determine isFullText
                 │  3. Update fullTextCount OR abstractCount
                 │  4. Add wordCount to totalWords
                 │  5. Create TransparentProgressMessage
                 │  6. Emit via WebSocket
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ WEBSOCKET: theme-extraction.gateway.ts                           │
├─────────────────────────────────────────────────────────────────┤
│ Sends:                                                            │
│ {                                                                 │
│   userId: "user-123",                                             │
│   stage: "familiarization",                                       │
│   percentage: 5,                                                  │
│   message: "Reading article 1 of 50...",                          │
│   details: {                                                      │
│     transparentMessage: {                                         │
│       liveStats: {                                                │
│         fullTextRead: 0,    ←─ STAT #1                            │
│         abstractsRead: 1,   ←─ STAT #2                            │
│         totalWordsRead: 2500 ←─ STAT #3                           │
│       }                                                            │
│     }                                                              │
│   }                                                                │
│ }                                                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ FRONTEND: useThemeExtractionWebSocket.ts                         │
├─────────────────────────────────────────────────────────────────┤
│ Receives 'extraction-progress' event                              │
│ Extracts transparentMessage from data.details                    │
│ Calls onProgress(data)                                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ FRONTEND: useThemeExtractionProgress.ts                          │
├─────────────────────────────────────────────────────────────────┤
│ updateProgress(..., transparentMessage)                          │
│ setProgress({                                                     │
│   transparentMessage: {                                           │
│     liveStats: {                                                  │
│       fullTextRead,      ←─ STAT #1 stored here                  │
│       abstractsRead,     ←─ STAT #2 stored here                  │
│       totalWordsRead     ←─ STAT #3 stored here                  │
│     }                                                              │
│   }                                                                │
│ })                                                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ FRONTEND: ThemeExtractionProgressModal.tsx                       │
├─────────────────────────────────────────────────────────────────┤
│ Receives progress prop                                            │
│ Passes to EnhancedThemeExtractionProgress                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ FRONTEND: EnhancedThemeExtractionProgress.tsx                    │
├─────────────────────────────────────────────────────────────────┤
│ Receives transparentMessage prop                                 │
│ SHOULD RENDER:                                                    │
│ - Full Articles: {liveStats.fullTextRead}                        │
│ - Abstracts: {liveStats.abstractsRead}                           │
│ - Total Words: {liveStats.totalWordsRead}                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Key Variables Across Files

| Variable | Backend | Gateway | Frontend Hook | Frontend State | Display |
|----------|---------|---------|---------------|---|---|
| fullTextRead | stats.fullTextCount | transparentMessage.liveStats.fullTextRead | transparentMessage.liveStats.fullTextRead | progress.transparentMessage.liveStats.fullTextRead | Should render |
| abstractsRead | stats.abstractCount | transparentMessage.liveStats.abstractsRead | transparentMessage.liveStats.abstractsRead | progress.transparentMessage.liveStats.abstractsRead | Should render |
| totalWordsRead | stats.totalWords | transparentMessage.liveStats.totalWordsRead | transparentMessage.liveStats.totalWordsRead | progress.transparentMessage.liveStats.totalWordsRead | Should render |

