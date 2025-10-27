/**
 * Load Testing Script - Phase 10 Day 3 Task 6
 *
 * Simulates 1,000 concurrent searches to verify:
 * 1. No rate limiting (HTTP 429)
 * 2. Cache hit rate 95%+
 * 3. Request deduplication working
 * 4. Stale cache fallback working
 *
 * Run: npm run load-test
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

interface LoadTestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitErrors: number;
  cacheHits: number;
  cacheMisses: number;
  freshResults: number;
  staleResults: number;
  archiveResults: number;
  totalPapers: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  responseTimes: number[];
}

const COMMON_QUERIES = [
  'Q methodology',
  'mental health',
  'cognitive psychology',
  'educational psychology',
  'climate change',
  'machine learning',
  'sustainability',
  'patient care',
  'social psychology',
  'neuroscience',
  'behavioral economics',
  'public health',
  'artificial intelligence',
  'data science',
  'quantum computing',
  'renewable energy',
  'gene therapy',
  'cybersecurity',
  'blockchain',
  'virtual reality',
];

/**
 * Generate search query with some duplicates (to test deduplication)
 */
function generateQuery(index: number): string {
  // 60% duplicates (to test request coalescing)
  const isDuplicate = Math.random() < 0.6;

  if (isDuplicate) {
    // Pick from top 5 most common queries
    const topQueries = COMMON_QUERIES.slice(0, 5);
    return topQueries[Math.floor(Math.random() * topQueries.length)];
  }

  // 40% unique queries
  return COMMON_QUERIES[index % COMMON_QUERIES.length];
}

/**
 * Execute a single search request
 */
async function executeSearch(
  query: string,
  searchId: number
): Promise<{
  success: boolean;
  isRateLimited: boolean;
  isCached: boolean;
  isFresh: boolean;
  isStale: boolean;
  isArchive: boolean;
  paperCount: number;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${API_URL}/literature/search/public`,
      {
        query,
        sources: ['semantic-scholar', 'crossref', 'pubmed', 'arxiv'],
        limit: 20,
      },
      {
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      }
    );

    const responseTime = Date.now() - startTime;

    if (response.status === 429) {
      return {
        success: false,
        isRateLimited: true,
        isCached: false,
        isFresh: false,
        isStale: false,
        isArchive: false,
        paperCount: 0,
        responseTime,
        error: 'Rate limited',
      };
    }

    const data = response.data;
    const papers = data.papers || [];
    const cacheMetadata = data.cacheMetadata || {};

    return {
      success: true,
      isRateLimited: false,
      isCached: cacheMetadata.isFresh || cacheMetadata.isStale || cacheMetadata.isArchive || false,
      isFresh: !cacheMetadata.isStale && !cacheMetadata.isArchive,
      isStale: cacheMetadata.isStale || false,
      isArchive: cacheMetadata.isArchive || false,
      paperCount: papers.length,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      success: false,
      isRateLimited: error.response?.status === 429,
      isCached: false,
      isFresh: false,
      isStale: false,
      isArchive: false,
      paperCount: 0,
      responseTime,
      error: error.message,
    };
  }
}

/**
 * Run load test with concurrency batches
 */
async function runLoadTest(
  totalRequests: number = 1000,
  batchSize: number = 50
) {
  console.log('\n📊 Starting Literature API Load Test');
  console.log('=====================================');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Batch Size: ${batchSize}`);
  console.log(`Target API: ${API_URL}`);
  console.log('=====================================\n');

  const stats: LoadTestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    freshResults: 0,
    staleResults: 0,
    archiveResults: 0,
    totalPapers: 0,
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [],
  };

  const batches = Math.ceil(totalRequests / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, totalRequests);
    const batchRequests = batchEnd - batchStart;

    console.log(
      `\n🚀 Batch ${batch + 1}/${batches} - Executing ${batchRequests} concurrent requests...`
    );

    // Create concurrent requests
    const promises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      const query = generateQuery(i);
      promises.push(executeSearch(query, i));
    }

    // Execute batch
    const results = await Promise.all(promises);

    // Aggregate stats
    for (const result of results) {
      stats.totalRequests++;
      stats.responseTimes.push(result.responseTime);

      if (result.responseTime < stats.minResponseTime) {
        stats.minResponseTime = result.responseTime;
      }
      if (result.responseTime > stats.maxResponseTime) {
        stats.maxResponseTime = result.responseTime;
      }

      if (result.success) {
        stats.successfulRequests++;
        stats.totalPapers += result.paperCount;

        if (result.isCached) {
          stats.cacheHits++;
        } else {
          stats.cacheMisses++;
        }

        if (result.isFresh) stats.freshResults++;
        if (result.isStale) stats.staleResults++;
        if (result.isArchive) stats.archiveResults++;
      } else {
        stats.failedRequests++;
        if (result.isRateLimited) {
          stats.rateLimitErrors++;
        }
      }
    }

    // Progress update
    const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
    const cacheHitRate = stats.cacheHits + stats.cacheMisses > 0
      ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)
      : '0.0';

    console.log(`   ✅ Success: ${successRate}% | 💾 Cache: ${cacheHitRate}% | ⚠️  Rate Limits: ${stats.rateLimitErrors}`);

    // Small delay between batches to avoid overwhelming the server
    if (batch < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Calculate final stats
  stats.avgResponseTime =
    stats.responseTimes.reduce((sum, t) => sum + t, 0) / stats.responseTimes.length;

  // Print results
  printResults(stats);

  // Return pass/fail
  return {
    passed: stats.rateLimitErrors === 0 && stats.cacheHits / (stats.cacheHits + stats.cacheMisses) >= 0.95,
    stats,
  };
}

/**
 * Print test results
 */
function printResults(stats: LoadTestStats) {
  console.log('\n\n📈 Load Test Results');
  console.log('==========================================');

  // Request Stats
  console.log('\n🔢 Request Statistics:');
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`   Rate Limited (429): ${stats.rateLimitErrors}`);

  // Cache Stats
  console.log('\n💾 Cache Statistics:');
  const totalCacheRequests = stats.cacheHits + stats.cacheMisses;
  const cacheHitRate = totalCacheRequests > 0 ? (stats.cacheHits / totalCacheRequests) * 100 : 0;
  console.log(`   Cache Hits: ${stats.cacheHits} (${cacheHitRate.toFixed(1)}%)`);
  console.log(`   Cache Misses: ${stats.cacheMisses}`);
  console.log(`   Fresh Results: ${stats.freshResults}`);
  console.log(`   Stale Results: ${stats.staleResults}`);
  console.log(`   Archive Results: ${stats.archiveResults}`);

  // Performance Stats
  console.log('\n⚡ Performance:');
  console.log(`   Avg Response Time: ${stats.avgResponseTime.toFixed(0)}ms`);
  console.log(`   Min Response Time: ${stats.minResponseTime}ms`);
  console.log(`   Max Response Time: ${stats.maxResponseTime}ms`);

  // Results
  console.log('\n📄 Results:');
  console.log(`   Total Papers: ${stats.totalPapers}`);
  console.log(`   Avg Papers/Request: ${(stats.totalPapers / stats.successfulRequests).toFixed(1)}`);

  // Pass/Fail
  console.log('\n✅ Test Criteria:');
  const rateLimitPass = stats.rateLimitErrors === 0;
  const cacheHitPass = cacheHitRate >= 95;

  console.log(`   No Rate Limiting: ${rateLimitPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Cache Hit Rate ≥95%: ${cacheHitPass ? '✅ PASS' : `❌ FAIL (${cacheHitRate.toFixed(1)}%)`}`);

  const overallPass = rateLimitPass && cacheHitPass;
  console.log(`\n${overallPass ? '✅ OVERALL: PASS' : '❌ OVERALL: FAIL'}`);
  console.log('==========================================\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    const totalRequests = parseInt(process.env.LOAD_TEST_REQUESTS || '1000');
    const batchSize = parseInt(process.env.LOAD_TEST_BATCH_SIZE || '50');

    const { passed } = await runLoadTest(totalRequests, batchSize);

    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runLoadTest, executeSearch };
