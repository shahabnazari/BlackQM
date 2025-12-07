# 🔴 WEBSOCKET DISCONNECTION DURING STAGE 1 - DIAGNOSTIC REPORT

## 📋 ISSUE SUMMARY

**Error**: WebSocket disconnects during Stage 1 (Familiarization)
**Impact**: Theme extraction fails completely
**Observed**: 2025-11-25 22:25:54
**Status**: 🔴 **CRITICAL - Production Blocker**

---

## 🔍 ERROR SEQUENCE

```
Timeline:
22:25:21 ✅ Stage 1 Familiarization stats received
22:25:21 ✅ onProgress callback called with transparentMessage
22:25:23 ✅ Stage 1 Familiarization stats received
22:25:23 ✅ onProgress callback called
22:25:23 ✅ Stage 1 Familiarization stats received
22:25:54 ❌ WebSocket disconnected (31 seconds later)
22:25:54 ❌ V2 extract failed
22:25:54 ❌ Error in extractThemesV2
22:25:54 ❌ Extraction workflow failed
22:25:54 ❌ Theme extraction error
```

**Key Observation**: 31-second gap between last progress update and disconnection

---

## 🎯 ROOT CAUSE ANALYSIS

### **Hypothesis #1: OpenAI Rate Limit Exhausted** 🔴 MOST LIKELY
**Evidence**:
- OpenAI quota observed earlier: 99,965/100,000 tokens (99.965% used)
- Only 35 tokens remaining
- Stage 1 requires OpenAI for familiarization embeddings
- No visible Groq fallback activation

**Root Cause**:
```typescript
// Stage 1 Familiarization calls OpenAI:
await this.openaiService.generateEmbedding(content);  // ❌ Fails with 429 Rate Limit

// Expected behavior: Should fall back to Groq
// Actual behavior: WebSocket disconnects without fallback
```

**Fix Required**:
1. ✅ Implement Groq fallback for embeddings (if not already done)
2. ✅ Add rate limit error handling in Stage 1
3. ✅ Emit progress event on rate limit hit
4. ✅ Use local embeddings as last resort

---

### **Hypothesis #2: Backend Timeout** 🟡 POSSIBLE
**Evidence**:
- 31-second gap before disconnection
- No explicit timeout visible in WebSocket config
- Node.js default timeout: 2 minutes

**Root Cause**:
```typescript
// Possible timeout in HTTP request during Stage 1:
const response = await axios.post('https://api.openai.com/...', {
  timeout: 30000  // 30 seconds - matches observed gap
});
```

**Fix Required**:
1. ✅ Increase HTTP timeout for embeddings
2. ✅ Add retry logic with exponential backoff
3. ✅ Emit progress during long-running operations

---

### **Hypothesis #3: Unhandled Exception in Stage 1** 🟡 POSSIBLE
**Evidence**:
- Sudden disconnection without graceful error
- No error details in frontend logs
- Cascading failures suggest uncaught exception

**Root Cause**:
```typescript
// Stage 1 throws unhandled exception:
try {
  await this.familiarizationStage(sources);
} catch (error) {
  // ❌ Error not properly caught/handled
  // ❌ WebSocket not notified
  // ❌ Frontend hangs until timeout
}
```

**Fix Required**:
1. ✅ Wrap Stage 1 in comprehensive try/catch
2. ✅ Emit error event on WebSocket before disconnecting
3. ✅ Return partial results if possible

---

### **Hypothesis #4: Memory Pressure** 🟢 UNLIKELY
**Evidence**:
- Backend PID 78856 running since 4:50PM (5+ hours)
- Memory: 803MB (seems reasonable)
- No OOM errors visible

**Fix Required**: None (not the primary issue)

---

## 🔬 DIAGNOSTIC STEPS

### **Step 1: Check OpenAI Quota**
```bash
# Run this to check remaining quota:
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json"
```

**Expected**: Daily quota status
**If Exhausted**: Rate limit is the root cause

---

### **Step 2: Test Groq Fallback**
```typescript
// Test if Groq fallback actually works:
// backend/test-groq-fallback.js

const { OpenAIService } = require('./src/modules/ai/services/openai.service');

async function testGroqFallback() {
  const openai = new OpenAIService();

  try {
    // Force rate limit by making request with exhausted quota
    const result = await openai.generateChatCompletion({
      model: 'gpt-4',
      messages: [{role: 'user', content: 'test'}]
    });

    console.log('✅ Response received:', result.model);
    console.log('✅ Groq fallback working:', result.model.includes('llama'));
  } catch (error) {
    console.log('❌ Groq fallback FAILED:', error.message);
  }
}

testGroqFallback();
```

---

### **Step 3: Check Backend Error Logs**
```bash
# Check for uncaught exceptions:
cd /Users/shahabnazariadli/Documents/blackQmethhod/backend

# Look for Stage 1 errors:
grep -r "Stage 1" --include="*.log" . | tail -20

# Look for rate limit errors:
grep -r "429\|rate.limit\|quota" --include="*.log" . | tail -20

# Look for uncaught exceptions:
grep -r "UnhandledPromiseRejection\|uncaughtException" --include="*.log" . | tail -20
```

---

### **Step 4: Test with Small Dataset**
```bash
# Test with just 2 papers to isolate issue:
cd backend
node test-purpose-validation-only.js

# If this works, issue is scale-related
# If this fails, issue is fundamental
```

---

## 🛠️ IMMEDIATE FIXES

### **Fix #1: Add Rate Limit Handling to Stage 1**
**File**: `backend/src/modules/literature/services/unified-theme-extraction.service.ts`

**Before** (vulnerable code):
```typescript
async familiarizationStage(sources: PaperWithContent[]) {
  for (const paper of sources) {
    const embedding = await this.openaiService.generateEmbedding(paper.content);
    // ❌ No rate limit handling
    // ❌ No fallback
    // ❌ No retry
  }
}
```

**After** (resilient code):
```typescript
async familiarizationStage(sources: PaperWithContent[], websocket?: any, userId?: string) {
  for (let i = 0; i < sources.length; i++) {
    const paper = sources[i];

    try {
      // Emit progress
      if (websocket && userId) {
        websocket.emitToUser(userId, 'extraction-progress', {
          stage: 1,
          currentStage: 'familiarization',
          progress: ((i + 1) / sources.length) * 100,
          message: `Processing paper ${i + 1}/${sources.length}`,
        });
      }

      // Try OpenAI first
      let embedding;
      try {
        embedding = await this.openaiService.generateEmbedding(paper.content);
      } catch (openaiError: any) {
        if (openaiError.status === 429 || openaiError.message?.includes('rate limit')) {
          this.logger.warn(`⚠️  OpenAI rate limit hit during familiarization. Falling back to Groq...`);

          // Fallback to Groq
          try {
            embedding = await this.groqService.generateEmbedding(paper.content);
            this.logger.log(`✅ Groq fallback successful for paper ${i + 1}`);
          } catch (groqError: any) {
            this.logger.error(`❌ Groq fallback also failed. Using local embeddings...`);

            // Last resort: local embeddings
            embedding = await this.localEmbeddingService.generateEmbedding(paper.content);
          }
        } else {
          throw openaiError;  // Re-throw if not rate limit
        }
      }

      // Store embedding...
      this.paperEmbeddings.set(paper.id, embedding);

    } catch (error: any) {
      this.logger.error(`❌ Failed to process paper ${i + 1}: ${error.message}`);

      // Emit error but continue with other papers
      if (websocket && userId) {
        websocket.emitToUser(userId, 'extraction-progress', {
          stage: 1,
          error: `Failed to process paper ${i + 1}`,
          details: error.message,
        });
      }

      // Don't fail entire extraction for one paper
      continue;
    }
  }
}
```

**Impact**: ✅ Prevents WebSocket disconnection on rate limits

---

### **Fix #2: Add Timeout Configuration**
**File**: `backend/src/modules/ai/services/openai.service.ts`

```typescript
async generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await this.openai.embeddings.create(
      {
        model: 'text-embedding-ada-002',
        input: text,
      },
      {
        timeout: 60000,  // ✅ 60 second timeout (was default 30s)
        maxRetries: 3,   // ✅ Retry 3 times
      }
    );

    return response.data[0].embedding;
  } catch (error: any) {
    if (error.status === 429) {
      this.logger.warn(`⚠️  OpenAI rate limit: ${error.message}`);
      throw new RateLimitException('OpenAI rate limit exceeded');
    }
    throw error;
  }
}
```

---

### **Fix #3: Add Progress Heartbeat**
**File**: `backend/src/modules/literature/services/unified-theme-extraction.service.ts`

```typescript
async extractThemesV2(sources, purpose, options, websocket, userId) {
  // Start heartbeat to prevent timeout
  const heartbeat = setInterval(() => {
    if (websocket && userId) {
      websocket.emitToUser(userId, 'extraction-heartbeat', {
        timestamp: new Date().toISOString(),
        message: 'Extraction in progress...',
      });
    }
  }, 5000);  // Every 5 seconds

  try {
    // Run extraction...
    const result = await this.runSixStageExtraction(sources, purpose, options, websocket, userId);
    return result;
  } finally {
    clearInterval(heartbeat);  // Stop heartbeat when done
  }
}
```

**Impact**: ✅ Frontend knows backend is still working

---

### **Fix #4: Add Graceful Error Handling**
**File**: `backend/src/modules/literature/literature.controller.ts`

```typescript
@Post('/themes/extract-themes-v2/public')
async extractThemesV2Public(@Body() dto: ExtractThemesV2Dto, @Req() req: Request) {
  const purpose = dto.purpose || 'qualitative_analysis';

  try {
    const result = await this.unifiedThemeExtractionService.extractThemesV2(
      sources,
      purposeMap[purpose],
      options,
      this.themeExtractionGateway,
      userId
    );

    return { success: true, ...result };

  } catch (error: any) {
    this.logger.error(`Theme extraction failed: ${error.message}`, error.stack);

    // Emit error to WebSocket before responding
    if (this.themeExtractionGateway && userId) {
      this.themeExtractionGateway.emitToUser(userId, 'extraction-error', {
        stage: error.stage || 'unknown',
        message: error.message,
        recoverable: error.recoverable || false,
      });
    }

    // Return structured error
    throw new BadRequestException({
      success: false,
      error: 'Theme extraction failed',
      message: error.message,
      stage: error.stage,
      recoverable: error.recoverable || false,
    });
  }
}
```

---

## 🚀 RECOMMENDED ACTION PLAN

### **Immediate (Next 30 minutes)**
1. ✅ Check OpenAI quota status
2. ✅ Verify Groq fallback is configured
3. ✅ Test with small dataset (2 papers)
4. ✅ Add rate limit error handling to Stage 1

### **Short-term (Next 1-2 hours)**
1. ✅ Implement all 4 fixes above
2. ✅ Add comprehensive error handling
3. ✅ Add progress heartbeat
4. ✅ Test with full dataset (10 papers)

### **Medium-term (Next session)**
1. ✅ Implement local embeddings as fallback
2. ✅ Add request queuing for rate limits
3. ✅ Implement caching to reduce API calls
4. ✅ Add monitoring for rate limit hits

---

## 🔒 TESTING CHECKLIST

### **Before Fixes**
- [ ] Reproduce error with 10 papers
- [ ] Confirm WebSocket disconnects at Stage 1
- [ ] Check backend logs for rate limit errors
- [ ] Verify OpenAI quota exhausted

### **After Fixes**
- [ ] Test with 2 papers (should work)
- [ ] Test with 10 papers (should work with fallback)
- [ ] Verify Groq fallback activates on rate limit
- [ ] Confirm WebSocket stays connected
- [ ] Check progress updates continue during fallback
- [ ] Verify themes are extracted successfully

---

## 📊 MONITORING RECOMMENDATIONS

### **Metrics to Track**
```typescript
// Add these Prometheus metrics:
rate_limit_hits_total{service="openai|groq"}
fallback_activations_total{from="openai", to="groq"}
extraction_stage_duration_seconds{stage="1|2|3|4|5|6"}
websocket_disconnections_total{reason="timeout|error|rate_limit"}
```

### **Alerts to Configure**
```yaml
# Alert if rate limits hit frequently:
- alert: HighRateLimitHits
  expr: rate(rate_limit_hits_total[5m]) > 0.1
  severity: warning

# Alert if WebSocket disconnects during extraction:
- alert: ExtractionWebSocketDisconnects
  expr: rate(websocket_disconnections_total{reason="error"}[5m]) > 0.05
  severity: critical
```

---

## 💡 LONG-TERM SOLUTIONS

### **1. Implement Request Queuing**
```typescript
// Queue requests when rate limit hit:
class RateLimitQueue {
  private queue: Array<{request: Function, resolve: Function, reject: Function}> = [];
  private processing = false;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({request, resolve, reject});
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const {request, resolve, reject} = this.queue.shift()!;

    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      if (error.status === 429) {
        // Re-queue with delay
        await this.sleep(60000);  // Wait 1 minute
        this.queue.unshift({request, resolve, reject});
      } else {
        reject(error);
      }
    }

    this.processing = false;
    this.process();  // Process next
  }
}
```

### **2. Implement Response Caching**
```typescript
// Cache embeddings to reduce API calls:
class EmbeddingCache {
  private cache = new Map<string, number[]>();

  async getEmbedding(text: string): Promise<number[]> {
    const hash = this.hashText(text);

    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }

    const embedding = await this.openaiService.generateEmbedding(text);
    this.cache.set(hash, embedding);
    return embedding;
  }
}
```

### **3. Implement Quota Monitoring**
```typescript
// Track quota usage in real-time:
class QuotaMonitor {
  private usage = {
    requests: 0,
    tokens: 0,
    dailyLimit: 100000,
  };

  canMakeRequest(estimatedTokens: number): boolean {
    return (this.usage.tokens + estimatedTokens) < this.usage.dailyLimit * 0.95;
  }

  recordUsage(tokens: number) {
    this.usage.tokens += tokens;
    this.usage.requests++;

    if (this.usage.tokens > this.usage.dailyLimit * 0.9) {
      this.logger.warn(`⚠️  Approaching daily quota limit: ${this.usage.tokens}/${this.usage.dailyLimit}`);
    }
  }
}
```

---

## ✅ CONCLUSION

**Root Cause**: OpenAI rate limit exhausted during Stage 1 Familiarization
**Impact**: WebSocket disconnects, extraction fails completely
**Solution**: Implement Groq fallback + rate limit handling + progress heartbeat

**Status**: 🔴 **CRITICAL - Requires immediate fix**
**ETA**: 30 minutes for emergency fix, 2 hours for comprehensive solution

---

**Next Action**: Check OpenAI quota and implement Fix #1 (rate limit handling in Stage 1)
