# Diagnostic: Stage 0 Stuck After Saving Papers

**Issue:** Theme extraction gets stuck at Stage 0 after saving all papers to database. Progress shows "0 Papers Saved" and stays there for ~1 minute before proceeding.

## Symptoms

```
Preparing
Stage 0 of 7

What we're doing:
Initializing extraction workflow...

Why it matters:
Setting up the analysis pipeline.

Sources Analyzed: 0
Data Preparation Progress: ⚙️ PREPARING
📚 Papers Saved: 0 (To database)
📁 Total Selected: 0 (Papers to process)
```

**Timeline:**
1. Papers are saved successfully (can see them in database)
2. Progress shows "0 Papers Saved" 
3. System appears frozen for ~1 minute
4. Then suddenly proceeds to Stage 1

## Root Cause Analysis

Based on the codebase structure, the issue is likely in one of these areas:

### 1. **WebSocket Progress Updates Not Sent**
- **File:** `backend/src/modules/literature/gateways/theme-extraction.gateway.ts`
- **Issue:** Progress updates may not be emitted after papers are saved
- **Evidence:** Gateway has `emitProgress()` method but may not be called at right time

### 2. **Stage 0 Logic Missing or Incomplete**
- **File:** `backend/src/modules/literature/services/unified-theme-extraction.service.ts`
- **Issue:** Stage 0 may not exist or may not emit progress updates
- **Evidence:** No search results found for "Stage 0" or "stage.*0" in the service

### 3. **Paper Saving Not Tracked**
- **File:** `backend/src/modules/literature/literature.service.ts`
- **Issue:** `savePaper()` method may not emit progress updates
- **Evidence:** Controller has `savePaperPublic()` endpoint but no progress tracking

### 4. **Frontend Not Receiving Updates**
- **File:** Frontend theme extraction component
- **Issue:** WebSocket connection may drop or not receive Stage 0 updates
- **Evidence:** Progress shows "0" which suggests no updates received

## Likely Culprit

**Most Probable:** The unified theme extraction service doesn't have a proper Stage 0 implementation that:
1. Tracks paper saving progress
2. Emits WebSocket updates during saving
3. Updates the "Papers Saved" counter in real-time

## What Should Happen

**Correct Flow:**
```
Stage 0: Data Preparation
├── For each paper in batch:
│   ├── Save paper to database
│   ├── Emit progress: { papersSaved: X, totalPapers: Y }
│   └── Update UI counter
├── Fetch full-text where available
└── Emit completion: { papersSaved: Y, totalPapers: Y }
```

**Current Flow (Broken):**
```
Stage 0: Data Preparation
├── Papers saved (no progress updates)
├── UI shows "0 Papers Saved"
├── ~1 minute delay (unknown operation)
└── Suddenly jumps to Stage 1
```

## Investigation Steps

### Step 1: Check if Stage 0 exists in service
```bash
grep -rn "stage.*0\|Stage.*0" backend/src/modules/literature/services/unified-theme-extraction.service.ts
```

### Step 2: Check paper saving logic
```bash
grep -rn "savePaper\|save.*paper" backend/src/modules/literature/literature.service.ts
```

### Step 3: Check WebSocket emissions
```bash
grep -rn "emitProgress.*stage.*0\|stage: 0" backend/src/modules/literature/
```

### Step 4: Check frontend WebSocket listener
```bash
# Check frontend for Stage 0 handling
grep -rn "stage.*0\|Stage 0" frontend/src/
```

## Recommended Fixes

### Fix #1: Add Stage 0 to Unified Theme Extraction Service

**Location:** `unified-theme-extraction.service.ts`

```typescript
async extractThemesV2(...) {
  // STAGE 0: Data Preparation
  this.gateway.emitProgress({
    userId,
    stage: 'preparing',
    percentage: 0,
    message: 'Saving papers to database...',
    details: {
      stageNumber: 0,
      totalStages: 7,
      stageName: 'Data Preparation',
      whatWeAreDoing: 'Saving papers to database and fetching full-text content',
      whyItMatters: 'Persisting selected corpus for analysis',
      liveStats: {
        sourcesAnalyzed: 0,
        currentOperation: 'Saving papers',
      }
    }
  });

  // Save papers with progress tracking
  let papersSaved = 0;
  for (const source of sources) {
    await this.savePaperToDatabase(source);
    papersSaved++;
    
    // Emit progress update
    this.gateway.emitProgress({
      userId,
      stage: 'preparing',
      percentage: (papersSaved / sources.length) * 100,
      message: `Saved ${papersSaved}/${sources.length} papers`,
      details: {
        stageNumber: 0,
        totalStages: 7,
        liveStats: {
          sourcesAnalyzed: papersSaved,
          currentOperation: 'Saving papers',
        }
      }
    });
  }

  // Stage 0 complete
  this.gateway.emitProgress({
    userId,
    stage: 'preparing',
    percentage: 100,
    message: `All ${sources.length} papers saved`,
    details: {
      stageNumber: 0,
      totalStages: 7,
      liveStats: {
        sourcesAnalyzed: sources.length,
        currentOperation: 'Data preparation complete',
      }
    }
  });

  // Continue to Stage 1...
}
```

### Fix #2: Add Progress Tracking to Literature Service

**Location:** `literature.service.ts`

```typescript
async savePaper(dto: SavePaperDto, userId: string) {
  // Emit progress if gateway available
  if (this.gateway) {
    this.gateway.emitProgress({
      userId,
      stage: 'preparing',
      percentage: 0,
      message: 'Saving paper...',
    });
  }

  // Save paper
  const paper = await this.prisma.paper.create({...});

  // Emit completion
  if (this.gateway) {
    this.gateway.emitProgress({
      userId,
      stage: 'preparing',
      percentage: 100,
      message: 'Paper saved',
    });
  }

  return paper;
}
```

### Fix #3: Ensure Frontend Handles Stage 0

**Location:** Frontend theme extraction component

```typescript
socket.on('extraction-progress', (progress) => {
  console.log('Progress update:', progress);
  
  // Handle Stage 0 specifically
  if (progress.stage === 'preparing' || progress.details?.stageNumber === 0) {
    setStage(0);
    setPapersSaved(progress.details?.liveStats?.sourcesAnalyzed || 0);
    setTotalPapers(progress.details?.liveStats?.totalArticles || 0);
  }
  
  // Update UI
  setProgress(progress);
});
```

## Testing Plan

1. **Add Logging:**
   - Add console.log in service when Stage 0 starts
   - Add console.log when emitting progress
   - Add console.log in gateway when receiving emit request

2. **Monitor WebSocket:**
   - Open browser DevTools → Network → WS
   - Watch for `extraction-progress` events
   - Verify Stage 0 events are sent

3. **Check Database:**
   - Verify papers are actually saved
   - Check timestamps to see when saving completes

4. **Measure Delay:**
   - Time from last paper saved to Stage 1 start
   - Identify what happens during the ~1 minute gap

## Expected Outcome

After fixes:
- Stage 0 shows real-time progress: "Saved 1/10 papers", "Saved 2/10 papers", etc.
- No 1-minute delay
- Smooth transition from Stage 0 → Stage 1
- User sees continuous progress updates

## Priority

**CRITICAL** - This affects user experience significantly. Users think the system is frozen when it's actually working.

## Related Files

- `backend/src/modules/literature/services/unified-theme-extraction.service.ts`
- `backend/src/modules/literature/gateways/theme-extraction.gateway.ts`
- `backend/src/modules/literature/literature.service.ts`
- `backend/src/modules/literature/literature.controller.ts`
- Frontend theme extraction component (path unknown)

## Next Steps

1. Search for where papers are actually saved during theme extraction
2. Add Stage 0 progress tracking
3. Test with 10 papers to verify smooth progress
4. Deploy fix and monitor production logs
