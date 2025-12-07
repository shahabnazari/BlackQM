# Stage 1 (Familiarization) - Quick Reference

## The Three Main Statistics

| Statistic | Definition | Where Tracked | Type |
|-----------|-----------|---|---|
| **fullTextRead** | Count of articles > 3500 words OR PDF-extracted | `stats.fullTextCount` | integer |
| **abstractsRead** | Count of articles < 3500 words | `stats.abstractCount` | integer |
| **totalWordsRead** | Cumulative word count of all papers | `stats.totalWords` | integer |

---

## Data Flow in One Diagram

```
Backend Loop (1 paper at a time):
  for each paper:
    1. wordCount = paper.content.split(/\s+/).length
    2. isFullText = (wordCount > 3500 OR metadata.contentType === 'full_text')
    3. stats.fullTextCount++ OR stats.abstractCount++
    4. stats.totalWords += wordCount
    5. CREATE TransparentProgressMessage { fullTextRead: N, abstractsRead: M, totalWordsRead: K }
    6. EMIT via WebSocket.emitProgress(...)
    7. EMIT via progressCallback(...)
    
        ↓
        
Frontend WebSocket:
  socket.on('extraction-progress', (data) => {
    const { fullTextRead, abstractsRead, totalWordsRead } 
      = data.details.transparentMessage.liveStats
    
    // Store in React state
    setProgress({ transparentMessage: {...data.details.transparentMessage} })
  })
  
        ↓
        
Frontend Display:
  ThemeExtractionProgressModal
    → EnhancedThemeExtractionProgress
      → Renders: "Full Articles: {fullTextRead}"
                 "Abstracts: {abstractsRead}"
                 "Total Words: {totalWordsRead}"
```

---

## Key File Locations

| What | File | Line |
|------|------|------|
| Stat calculation (per paper) | unified-theme-extraction.service.ts | 3316-3322 |
| Stats initialization | unified-theme-extraction.service.ts | 3145-3173 |
| fullText/abstract classification | unified-theme-extraction.service.ts | 3208-3220 |
| Create TransparentProgressMessage | unified-theme-extraction.service.ts | 3352-3383 |
| WebSocket emission | unified-theme-extraction.service.ts | 3390-3397 |
| Failed paper handling | unified-theme-extraction.service.ts | 333-380 |
| HTTP response (fallback) | unified-theme-extraction.service.ts | 3494-3512 |
| WebSocket gateway | theme-extraction.gateway.ts | 95-100 |
| Frontend reception | useThemeExtractionWebSocket.ts | ~280+ |
| Frontend state | useThemeExtractionProgress.ts | 57-85 |
| Display interface | EnhancedThemeExtractionProgress.tsx | 36-73 |

---

## Critical Classification Logic

```typescript
const isFullText =
  source.metadata?.contentType === 'full_text' ||  // ✅ Most reliable
  (source.metadata?.contentType === 'abstract_overflow' && wordCount > 3000) ||
  wordCount > 3500; // ⚠️ Fallback heuristic
```

**Thresholds:**
- Full-text: > 3,500 words
- Abstract overflow: 3,000-3,500 words (if flagged as overflow)
- Abstract: < 3,000 words

---

## Transmission Channels

### Primary: WebSocket (Real-time)
- **Gateway:** `theme-extraction.gateway.ts`
- **Event:** `extraction-progress`
- **Frequency:** Every paper (1 per second minimum)
- **Payload:** `ExtractionProgress` + `TransparentProgressMessage`

### Secondary: HTTP (Fallback)
- **Endpoint:** Response to extraction POST
- **Frequency:** Once at end
- **Payload:** `familiarizationStats` object in response

---

## What Can Go Wrong

### High Priority
1. **Missing display rendering** - EnhancedThemeExtractionProgress may not render the counters
   - Check lines 150-200+ for actual JSX rendering

### Medium Priority
2. **Classification inaccuracy** - Heuristic (>3500 words) may misclassify edge cases
   - Long abstracts may be marked as full-text
   - Short papers may be marked as abstracts

3. **Race condition** - Stats updates may arrive out of order
   - Mitigation: WebSocket is sequential so ordering preserved

### Low Priority
4. **Duplicate content** - No deduplication by paper ID
   - Same paper processed twice = double-counted stats
   
5. **Failed paper handling** - Error messages unclear about skip vs. count

---

## HTTP Response Example

```json
{
  "themes": [...],
  "familiarizationStats": {
    "fullTextRead": 42,
    "abstractsRead": 8,
    "totalWordsRead": 125430,
    "totalArticles": 50,
    "embeddingStats": {
      "model": "text-embedding-3-large",
      "dimensions": 3072,
      "totalEmbeddingsGenerated": 50,
      "averageEmbeddingMagnitude": 45.23,
      "chunkedArticleCount": 3,
      "totalChunksProcessed": 7
    }
  }
}
```

---

## Debugging Tips

**To verify stats are being calculated:**
1. Check backend logs for: `Familiarization stats: X full-text, Y abstracts, Z words`
2. Search for message: `📊 Familiarization complete:`

**To verify stats are being transmitted:**
1. Check browser DevTools → Network → WS (WebSocket)
2. Look for events containing `"extraction-progress"`
3. Inspect `details.transparentMessage.liveStats`

**To verify stats are being displayed:**
1. Check if EnhancedThemeExtractionProgress renders the values
2. Look for text: `"Full Articles: {number}"`

---

## Testing Checklist

- [ ] Backend generates correct `fullTextRead` count
- [ ] Backend generates correct `abstractsRead` count  
- [ ] Backend generates correct `totalWordsRead` sum
- [ ] WebSocket emits these values in `transparentMessage.liveStats`
- [ ] Frontend receives and stores in `transparentMessage`
- [ ] EnhancedThemeExtractionProgress actually displays them
- [ ] HTTP fallback provides same stats if WebSocket fails
- [ ] Failed papers don't break the stats calculation
