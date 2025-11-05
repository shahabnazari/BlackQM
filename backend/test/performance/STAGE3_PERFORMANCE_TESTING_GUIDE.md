# Stage 3: Performance Testing Guide

## Phase 10 Day 5.7 - Enterprise-Grade Load & Stress Testing

**Purpose:** Validate system performance under realistic and extreme load conditions
**Duration:** 3-4 hours
**Priority:** CRITICAL - Production Readiness Validation
**Success Criteria:** All endpoints meet performance SLAs under expected load

---

## Testing Philosophy

Performance testing validates that the system meets defined Service Level Agreements (SLAs) under various load conditions. This is not theoretical - these benchmarks must reflect **real-world PhD researcher usage patterns**.

**Key Questions:**

- Can the system handle 50 concurrent researchers during peak hours?
- Does search response time remain <3s under load?
- Can theme extraction process 100+ papers without timeout?
- Does the system gracefully degrade under extreme load?

---

## Performance Testing Strategy

### Three-Tier Load Testing Approach

**Tier 1: Baseline Performance (1 concurrent user)**

- Establishes performance baseline without contention
- Validates optimal performance characteristics
- Identifies slow endpoints needing optimization

**Tier 2: Expected Load (10-50 concurrent users)**

- Simulates typical peak usage (e.g., seminar class of PhD students)
- Validates SLA compliance under realistic conditions
- Measures throughput, latency, error rate

**Tier 3: Stress Testing (100-200 concurrent users)**

- Identifies breaking point and graceful degradation
- Validates rate limiting, queue management, resource constraints
- Ensures no data corruption under extreme load

---

## Performance SLAs (Service Level Agreements)

### Critical Endpoints (User-Facing Operations)

| Endpoint                                            | Operation                          | p50 Latency | p95 Latency | p99 Latency | Throughput  | Error Rate |
| --------------------------------------------------- | ---------------------------------- | ----------- | ----------- | ----------- | ----------- | ---------- |
| `POST /api/literature/search/public`                | Literature Search                  | <1.5s       | <3s         | <5s         | ≥20 req/s   | <1%        |
| `POST /api/literature/themes/unified-extract`       | Single Paper Theme Extraction      | <15s        | <30s        | <45s        | ≥5 req/s    | <2%        |
| `POST /api/literature/themes/unified-extract-batch` | Batch Theme Extraction (25 papers) | <300s       | <600s       | <900s       | ≥1 req/s    | <5%        |
| `GET /api/health/ready`                             | Health Check                       | <20ms       | <50ms       | <100ms      | ≥1000 req/s | <0.1%      |
| `POST /api/auth/login`                              | Authentication                     | <200ms      | <500ms      | <1s         | ≥50 req/s   | <0.5%      |
| `GET /api/papers`                                   | List Papers                        | <500ms      | <1s         | <2s         | ≥30 req/s   | <1%        |

### Background Operations (System Health)

| Metric                   | Target           | Critical Threshold |
| ------------------------ | ---------------- | ------------------ |
| Database Connection Pool | ≤80% utilization | 100% = fail        |
| Memory Usage             | ≤1.5GB           | 2GB = OOM risk     |
| CPU Usage                | ≤70% average     | 90% = degradation  |
| API Rate Limit           | ≤80% of quota    | 100% = 429 errors  |
| Cache Hit Rate           | ≥60%             | <30% = inefficient |

---

## Part 1: K6 Load Testing Setup (30 minutes)

### Installation

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker (alternative)
docker pull grafana/k6

# Verify installation
k6 version
```

### K6 Test Script Anatomy

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.01'], // Error rate must be below 1%
  },
};

// Test scenario
export default function () {
  const res = http.post(
    'http://localhost:4000/api/literature/search/public',
    JSON.stringify({
      query: 'machine learning healthcare',
      sources: ['arxiv', 'pubmed'],
      limit: 20,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'has papers': (r) => JSON.parse(r.body).papers.length > 0,
  });

  sleep(1); // Think time between requests
}
```

---

## Part 2: Load Test Scenarios (90 minutes execution)

### Scenario 1: Literature Search Load Test

**Objective:** Validate search endpoint can handle 50 concurrent users
**Duration:** 10 minutes
**Success Criteria:** p95 < 3s, error rate < 1%

**Execution:**

```bash
k6 run backend/test/performance/k6-literature-search.js
```

**Expected Results:**

```
✓ status is 200           | 100% of checks pass
✓ response time < 3s      | ≥95% of requests under 3s
✓ has papers             | 100% return results

http_req_duration...: avg=1.2s  min=800ms med=1.1s max=2.8s p(90)=1.8s p(95)=2.1s
http_req_failed.....: 0.2%     | 2 failures out of 1000 requests
http_reqs...........: 1000      | ~16.7 req/s
```

**Interpretation:**

- ✅ **Pass:** p95 = 2.1s (within 3s SLA)
- ✅ **Pass:** Error rate = 0.2% (within 1% SLA)
- ✅ **Pass:** Throughput = 16.7 req/s (exceeds 10 req/s minimum)

---

### Scenario 2: Theme Extraction Load Test (Single Paper)

**Objective:** Validate extraction endpoint under concurrent load
**Duration:** 15 minutes
**Success Criteria:** p95 < 30s, error rate < 2%, no rate limit violations

**Key Consideration:** This endpoint calls OpenAI GPT-4, which has rate limits:

- Free tier: 3 requests/minute
- Tier 1: 500 requests/day
- Rate limiting must prevent 429 errors

**Execution:**

```bash
k6 run backend/test/performance/k6-theme-extraction.js
```

**Expected Results:**

```
✓ status is 200           | ≥98% of checks pass
✓ response time < 30s     | ≥95% of requests under 30s
✓ has themes             | 100% return themes

http_req_duration...: avg=12.5s min=8s   med=11s  max=28s  p(90)=18s p(95)=22s
http_req_failed.....: 1.5%      | 15 failures out of 1000 requests
http_reqs...........: 1000       | ~1.1 req/s (limited by rate limiter)

✓ No 429 rate limit errors detected
✓ Concurrency control effective (max 2 concurrent GPT-4 calls)
```

---

### Scenario 3: Batch Theme Extraction Stress Test

**Objective:** Validate 25-paper batch extraction under load
**Duration:** 30 minutes (long-running operations)
**Success Criteria:** p95 < 600s (10 minutes), error rate < 5%, memory stable

**Execution:**

```bash
k6 run --vus 5 --duration 30m backend/test/performance/k6-batch-extraction.js
```

**Why 5 VUs only?**
Each batch takes ~5-10 minutes and consumes 50-100 OpenAI API calls. Running 50 concurrent batches would:

- Exhaust API quota in minutes
- Cost $50-100 in API fees
- Not reflect realistic usage (PhD researchers don't submit 50 batches simultaneously)

**Expected Results:**

```
✓ status is 200           | ≥95% of checks pass
✓ response time < 600s    | ≥95% complete within 10 minutes
✓ batch complete         | ≥95% return all 25 themes

http_req_duration...: avg=420s  min=280s med=400s max=580s p(90)=520s p(95)=560s
http_req_failed.....: 3.2%      | 3 failures out of 94 requests
http_reqs...........: 94         | ~0.05 req/s

Memory usage: Stable at 1.2GB (no memory leak detected)
```

---

### Scenario 4: Mixed Workload (Realistic User Behavior)

**Objective:** Simulate realistic PhD researcher workflow
**Duration:** 20 minutes
**Success Criteria:** All endpoints meet SLAs concurrently

**User Journey:**

1. Login (5% of traffic)
2. Search for papers (40% of traffic)
3. Browse/filter results (30% of traffic)
4. Select papers (15% of traffic)
5. Extract themes (10% of traffic)

**Execution:**

```bash
k6 run backend/test/performance/k6-mixed-workload.js
```

**Expected Results:**

```
Scenario: login
  ✓ http_req_duration..: p95=480ms (SLA: <500ms)

Scenario: search
  ✓ http_req_duration..: p95=2.8s (SLA: <3s)

Scenario: browse
  ✓ http_req_duration..: p95=950ms (SLA: <1s)

Scenario: select
  ✓ http_req_duration..: p95=450ms (SLA: <500ms)

Scenario: extract
  ✓ http_req_duration..: p95=28s (SLA: <30s)

Overall: All SLAs met ✅
```

---

### Scenario 5: Stress Test (Breaking Point Analysis)

**Objective:** Identify system breaking point and graceful degradation
**Duration:** 15 minutes
**Success Criteria:** Graceful degradation (no crashes), clear error messages, partial service maintained

**Load Profile:**

```
Stage 1: 0 → 50 users (2 minutes)    | Baseline load
Stage 2: 50 → 100 users (2 minutes)  | Expected peak
Stage 3: 100 → 200 users (2 minutes) | Stress testing
Stage 4: 200 users (5 minutes)       | Breaking point
Stage 5: 200 → 0 users (2 minutes)   | Recovery
```

**Execution:**

```bash
k6 run backend/test/performance/k6-stress-test.js
```

**Expected Results:**

```
VUs: 0-50   | p95=2.1s   | Error rate: 0.5%   | ✅ Normal operation
VUs: 50-100 | p95=4.2s   | Error rate: 2.1%   | ⚠️  Degraded performance
VUs: 100-200| p95=8.5s   | Error rate: 8.5%   | ❌ Breaking point reached
VUs: 200    | p95=12s    | Error rate: 15%    | ❌ Unacceptable performance

Recovery: System returns to normal after load decreases ✅
No crashes detected ✅
Database connections released properly ✅
```

**Interpretation:**

- **Comfortable capacity:** 50 concurrent users
- **Degraded capacity:** 100 concurrent users (SLA violations)
- **Breaking point:** 200 concurrent users (15% error rate)
- **Recommendation:** Set rate limit at 50-75 concurrent users

---

## Part 3: Application Performance Monitoring (30 minutes)

### Backend Performance Profiling

**Objective:** Identify slow code paths and optimization opportunities

**Tools:**

1. **NestJS Built-in Logger:** Already configured
2. **Node.js Profiler:** V8 CPU profiler
3. **Clinic.js:** Performance diagnostics tool

**Setup Clinic.js:**

```bash
cd backend
npm install -g clinic

# Run profiler during load test
clinic doctor -- node dist/main.js

# In another terminal, run K6 load test
k6 run test/performance/k6-literature-search.js

# Stop backend (Ctrl+C)
# Clinic.js will generate HTML report automatically
```

**What to Look For:**

- **Event Loop Delay:** Should be <10ms (>50ms = blocked event loop)
- **CPU Usage:** Should be <70% average (>90% = CPU bottleneck)
- **Memory Leaks:** Heap should stabilize (continuous growth = leak)
- **Hot Paths:** Functions called >10,000 times during test

**Example Findings:**

```
🔥 Hot Path Detected: JSON.parse() called 45,000 times
   → Optimization: Cache parsed results

⚠️  Event Loop Delay: 35ms average (acceptable but improvable)
   → Cause: Synchronous crypto operations in auth middleware
   → Fix: Use async bcrypt.compare()

✅ Memory: Stable at 1.2GB (no leaks detected)
```

---

### Frontend Performance Analysis

**Objective:** Ensure UI remains responsive under data load

**Tools:**

1. **Chrome DevTools Performance Tab**
2. **Lighthouse Performance Audit**
3. **React Developer Tools Profiler**

**Test Scenarios:**

```
Scenario A: Render 100 papers in search results
  - Measure: Time to Interactive (TTI)
  - Target: TTI < 2s
  - Monitor: Frame rate (should stay >30fps during scroll)

Scenario B: Update theme extraction progress (100 updates/second)
  - Measure: React re-renders
  - Target: <10 re-renders per progress update
  - Monitor: Memory usage (should not grow)

Scenario C: Navigate between 10 pages quickly
  - Measure: Route transition time
  - Target: <300ms per transition
  - Monitor: Unused JavaScript (should be code-split)
```

**Chrome DevTools Performance Recipe:**

1. Open DevTools → Performance tab
2. Start recording
3. Execute test scenario (e.g., load 100 papers)
4. Stop recording
5. Analyze:
   - **LCP (Largest Contentful Paint):** <2.5s
   - **FID (First Input Delay):** <100ms
   - **CLS (Cumulative Layout Shift):** <0.1
   - **Long Tasks:** None >50ms

**Lighthouse Performance Audit:**

```bash
lighthouse http://localhost:3000/discover/literature \
  --only-categories=performance \
  --output=html \
  --output=json \
  --chrome-flags="--headless"

# Expected Score: ≥90/100
```

---

## Part 4: Database Performance Testing (45 minutes)

### Query Performance Analysis

**Objective:** Identify slow queries and missing indexes

**Tool:** Prisma Query Analysis + Database Explain Plans

**Setup Query Logging:**

```typescript
// backend/src/common/prisma.service.ts
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    // Log queries >100ms
    console.log(`[SLOW QUERY] ${e.duration}ms: ${e.query}`);
  }
});
```

**Run Load Test with Query Logging:**

```bash
# Terminal 1: Start backend with query logging
cd backend
npm run start:dev

# Terminal 2: Run K6 search load test
k6 run test/performance/k6-literature-search.js

# Terminal 3: Monitor slow queries
tail -f logs/slow-queries.log
```

**Expected Findings:**

```sql
-- Example slow query (350ms)
SELECT * FROM papers WHERE userId = 'user-123' ORDER BY createdAt DESC LIMIT 20;
   └─ Fix: Add index on (userId, createdAt)

-- Example slow query (520ms)
SELECT * FROM papers WHERE title LIKE '%machine learning%';
   └─ Fix: Add full-text search index or use search service

-- Fast query (12ms) ✅
SELECT * FROM papers WHERE id = 'paper-123';
   └─ Already indexed on primary key
```

**Create Missing Indexes:**

```prisma
// backend/prisma/schema.prisma
model Paper {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  title     String
  // ... other fields

  @@index([userId, createdAt])  // Composite index for user's recent papers
  @@index([title])               // Index for title searches (or use @@fulltext)
}
```

---

### Connection Pool Sizing

**Objective:** Optimize database connection pool for concurrent load

**Current Configuration:**

```env
# backend/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/vqmethod_db?connection_limit=10"
```

**Load Test Findings:**

```
10 connections:
  - 10 VUs: 0% connection wait time ✅
  - 50 VUs: 25% connection wait time ⚠️
  - 100 VUs: 60% connection wait time ❌

20 connections:
  - 50 VUs: 0% connection wait time ✅
  - 100 VUs: 15% connection wait time ⚠️

30 connections:
  - 100 VUs: 0% connection wait time ✅
  - 200 VUs: 20% connection wait time ⚠️
```

**Recommendation:**

```env
# For 50 concurrent users (expected peak)
DATABASE_URL="postgresql://user:pass@localhost:5432/vqmethod_db?connection_limit=20"

# For 100 concurrent users (stress scenario)
DATABASE_URL="postgresql://user:pass@localhost:5432/vqmethod_db?connection_limit=30"

# Rule of thumb: (concurrent users / 2) + 5 buffer
```

---

## Part 5: Performance Optimization Checklist

### Quick Wins (Immediate Impact)

- [ ] **Enable Response Compression (Gzip)**

  ```typescript
  // backend/src/main.ts
  app.use(compression());
  ```

  Impact: 70-80% bandwidth reduction

- [ ] **Add HTTP Caching Headers**

  ```typescript
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/papers')) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    next();
  });
  ```

  Impact: 30-50% reduction in API calls

- [ ] **Enable Database Query Caching (Redis)**
  - Already implemented in `cache.service.ts`
  - Verify cache hit rate >60%

- [ ] **Implement Pagination (Infinite Scroll)**
  - Current: Load all papers (may be 100s)
  - Optimized: Load 20 papers per page
  - Impact: 80% reduction in initial load time

- [ ] **Code Splitting (Frontend)**
  ```tsx
  // frontend/app/(researcher)/discover/literature/page.tsx
  const LiteratureSearch = dynamic(
    () => import('@/components/literature/LiteratureSearch'),
    {
      loading: () => <Skeleton />,
    },
  );
  ```
  Impact: 40% reduction in initial bundle size

### Medium Effort (Significant Impact)

- [ ] **Database Indexing**
  - Add indexes identified in query analysis
  - Impact: 50-90% query speed improvement

- [ ] **API Response Optimization**
  - Remove unused fields from responses
  - Use GraphQL or field selection
  - Impact: 30-50% payload reduction

- [ ] **Background Job Queue**
  - Move theme extraction to queue (Bull/BullMQ)
  - Return job ID immediately, poll for completion
  - Impact: Instant API response, better resource management

- [ ] **CDN for Static Assets**
  - Offload images, fonts, CSS to CDN
  - Impact: 60-80% reduction in server bandwidth

### Long-term Optimizations (Architectural)

- [ ] **Microservices Architecture**
  - Separate theme extraction into dedicated service
  - Scale independently based on load

- [ ] **Read Replicas**
  - Separate read/write database connections
  - Route searches to read replicas

- [ ] **Horizontal Scaling**
  - Deploy multiple backend instances
  - Load balance with Nginx/AWS ALB

- [ ] **Caching Layer (Redis)**
  - Already partially implemented
  - Expand to cache search results, themes

---

## Performance Testing Summary Template

```markdown
# Performance Test Results - [Date]

## Test Configuration

- K6 Version: 0.48.0
- Backend Version: [Git commit hash]
- Database: PostgreSQL 15.3
- Hardware: [CPU, RAM, specs]

## Load Test Results

### Scenario 1: Literature Search

- ✅ PASS: p95 = 2.1s (SLA: <3s)
- ✅ PASS: Error rate = 0.2% (SLA: <1%)
- ✅ PASS: Throughput = 16.7 req/s (Target: ≥10 req/s)

### Scenario 2: Theme Extraction

- ✅ PASS: p95 = 22s (SLA: <30s)
- ✅ PASS: Error rate = 1.5% (SLA: <2%)
- ⚠️ WARNING: Throughput = 1.1 req/s (limited by OpenAI rate limits)

### Scenario 3: Batch Extraction

- ✅ PASS: p95 = 560s (SLA: <600s)
- ✅ PASS: Error rate = 3.2% (SLA: <5%)
- ✅ PASS: Memory stable (no leaks)

### Scenario 4: Mixed Workload

- ✅ PASS: All endpoints meet SLAs under realistic load

### Scenario 5: Stress Test

- ✅ PASS: Graceful degradation (no crashes)
- ⚠️ WARNING: Breaking point at 200 concurrent users
- 📊 Recommendation: Set rate limit at 75 concurrent users

## Bottlenecks Identified

1. OpenAI API rate limits (expected, cannot optimize)
2. Database connection pool exhaustion at 100+ VUs
3. JSON parsing in hot path (45K calls during test)

## Optimizations Applied

- [x] Increased connection pool: 10 → 20 connections
- [x] Added database index on (userId, createdAt)
- [x] Enabled response compression (gzip)
- [ ] TODO: Implement background job queue for batch extractions
- [ ] TODO: Add Redis caching for search results

## Production Readiness: ✅ YES

- System meets all SLAs under expected load (50 concurrent users)
- Graceful degradation under stress
- No memory leaks or crashes detected
- Recommendation: Deploy with monitoring for first 2 weeks
```

---

## Next Steps

After completing performance testing:

1. Document all bottlenecks and optimizations
2. Set up production monitoring (Datadog, New Relic, or Prometheus)
3. Configure alerts for SLA violations
4. Proceed to Stage 3: Security Testing (OWASP ZAP)

**Stage 3 Performance Testing Status:** [ ] Complete [ ] Needs Optimization

---

**Testing Guide Version:** 1.0
**Last Updated:** October 29, 2025
**Owner:** Phase 10 Day 5.7 Stage 3
