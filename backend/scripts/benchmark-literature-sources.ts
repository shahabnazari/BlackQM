/**
 * Performance Benchmark Script for Literature Sources
 *
 * Tests all literature sources and measures:
 * - Response time (p50, p95, p99)
 * - Success rate
 * - Results quality
 *
 * Usage: npx ts-node scripts/benchmark-literature-sources.ts
 */

import axios from 'axios';

interface BenchmarkResult {
  source: string;
  attempts: number;
  successful: number;
  failed: number;
  times: number[];
  p50: number;
  p95: number;
  p99: number;
  avgResultsPerSearch: number;
}

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const ITERATIONS = 10;
const TEST_QUERIES = [
  'machine learning healthcare',
  'climate change research',
  'quantum computing applications',
];

// Calculate percentiles
function calculatePercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

async function benchmarkSource(
  source: string,
  query: string
): Promise<{ time: number; resultsCount: number; success: boolean }> {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${API_BASE}/api/literature/search`,
      {
        query,
        sources: [source],
        limit: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_TOKEN || 'test-token'}`,
        },
        timeout: 10000, // 10s timeout
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      time: responseTime,
      resultsCount: response.data.papers?.length || 0,
      success: true,
    };
  } catch (error: any) {
    const endTime = Date.now();
    return {
      time: endTime - startTime,
      resultsCount: 0,
      success: false,
    };
  }
}

async function benchmarkAlternativeSource(
  source: string,
  query: string
): Promise<{ time: number; resultsCount: number; success: boolean }> {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${API_BASE}/api/literature/alternative-sources`,
      {
        query,
        sources: [source],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_TOKEN || 'test-token'}`,
        },
        timeout: 10000,
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      time: responseTime,
      resultsCount: response.data?.results?.length || 0,
      success: true,
    };
  } catch (error: any) {
    const endTime = Date.now();
    return {
      time: endTime - startTime,
      resultsCount: 0,
      success: false,
    };
  }
}

async function runBenchmark(
  sourceName: string,
  benchmarkFn: (source: string, query: string) => Promise<any>
): Promise<BenchmarkResult> {
  console.log(`\n📊 Benchmarking ${sourceName}...`);

  const times: number[] = [];
  let successful = 0;
  let failed = 0;
  let totalResults = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const query = TEST_QUERIES[i % TEST_QUERIES.length];
    console.log(`  Attempt ${i + 1}/${ITERATIONS}: "${query.substring(0, 30)}..."`);

    const result = await benchmarkFn(sourceName, query);

    times.push(result.time);

    if (result.success) {
      successful++;
      totalResults += result.resultsCount;
      console.log(`    ✅ ${result.time}ms - ${result.resultsCount} results`);
    } else {
      failed++;
      console.log(`    ❌ Failed after ${result.time}ms`);
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const sortedTimes = times.filter(t => t > 0).sort((a, b) => a - b);

  return {
    source: sourceName,
    attempts: ITERATIONS,
    successful,
    failed,
    times: sortedTimes,
    p50: calculatePercentile(sortedTimes, 50),
    p95: calculatePercentile(sortedTimes, 95),
    p99: calculatePercentile(sortedTimes, 99),
    avgResultsPerSearch: successful > 0 ? totalResults / successful : 0,
  };
}

function printResults(results: BenchmarkResult[]) {
  console.log('\n\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║             LITERATURE SOURCES PERFORMANCE BENCHMARK                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  console.log('┌─────────────────────┬──────────┬──────────┬──────────┬──────────┬────────────┬────────────┐');
  console.log('│ Source              │ Success  │ P50 (ms) │ P95 (ms) │ P99 (ms) │ Avg Results│ Status     │');
  console.log('├─────────────────────┼──────────┼──────────┼──────────┼──────────┼────────────┼────────────┤');

  results.forEach((result) => {
    const successRate = ((result.successful / result.attempts) * 100).toFixed(0);
    const status = result.successful > result.failed ? '✅ PASS' : '❌ FAIL';
    const performance = result.p95 < 4000 ? '🚀' : result.p95 < 6000 ? '🟡' : '🔴';

    console.log(
      `│ ${result.source.padEnd(19)} │ ${successRate.padStart(6)}%  │ ${String(result.p50).padStart(8)} │ ${String(result.p95).padStart(8)} │ ${String(result.p99).padStart(8)} │ ${result.avgResultsPerSearch.toFixed(1).padStart(10)} │ ${status} ${performance}     │`
    );
  });

  console.log('└─────────────────────┴──────────┴──────────┴──────────┴──────────┴────────────┴────────────┘\n');

  // Summary
  const totalSources = results.length;
  const passingS

ources = results.filter(r => r.successful > r.failed).length;
  const avgP95 = results.reduce((sum, r) => sum + r.p95, 0) / totalSources;

  console.log('📈 SUMMARY:');
  console.log(`   Sources Tested: ${totalSources}`);
  console.log(`   Passing: ${passingSources}/${totalSources} (${((passingS ources/totalSources)*100).toFixed(0)}%)`);
  console.log(`   Average P95: ${avgP95.toFixed(0)}ms`);
  console.log(`   Target: <4000ms P95 ✅\n`);

  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  results.forEach(result => {
    if (result.p95 > 4000) {
      console.log(`   ⚠️  ${result.source}: Consider caching or optimization (P95: ${result.p95}ms)`);
    }
    if (result.failed > result.attempts * 0.2) {
      console.log(`   ❌ ${result.source}: High failure rate (${result.failed}/${result.attempts})`);
    }
  });
  console.log('');
}

async function main() {
  console.log('🚀 Starting Literature Sources Performance Benchmark');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log(`🔄 Iterations per source: ${ITERATIONS}`);
  console.log(`📝 Test Queries: ${TEST_QUERIES.length}\n`);

  const results: BenchmarkResult[] = [];

  // Main literature sources
  console.log('\n═══ MAIN LITERATURE SOURCES ═══');

  const mainSources = ['semantic_scholar', 'crossref', 'pubmed', 'arxiv'];
  for (const source of mainSources) {
    const result = await runBenchmark(source, benchmarkSource);
    results.push(result);
  }

  // Alternative sources
  console.log('\n\n═══ ALTERNATIVE SOURCES ═══');

  const altSources = ['arxiv', 'biorxiv', 'github', 'stackoverflow'];
  for (const source of altSources) {
    const result = await runBenchmark(source, benchmarkAlternativeSource);
    results.push(result);
  }

  // Print final results
  printResults(results);

  // Write results to file
  const resultsFile = './benchmark-results-' + new Date().toISOString().split('T')[0] + '.json';
  const fs = require('fs');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`📁 Results saved to: ${resultsFile}\n`);
}

// Run benchmark
main().catch((error) => {
  console.error('❌ Benchmark failed:', error.message);
  process.exit(1);
});
