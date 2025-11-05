/**
 * K6 Load Test: Literature Search Endpoint
 * Phase 10 Day 5.7 Stage 3: Performance Testing
 *
 * Objective: Validate search endpoint can handle 50 concurrent users
 * Duration: 10 minutes
 * Success Criteria: p95 < 3s, error rate < 1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const searchLatency = new Trend('search_latency');
const searchErrors = new Rate('search_errors');
const papersReturned = new Counter('papers_returned');
const cacheHits = new Rate('cache_hits');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Warm-up: Ramp to 10 users
    { duration: '3m', target: 50 }, // Load: Ramp to 50 users
    { duration: '5m', target: 50 }, // Sustain: Hold at 50 users
    { duration: '2m', target: 10 }, // Ramp down: Cool down to 10 users
    { duration: '1m', target: 0 }, // End: Ramp to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.01'], // Error rate must be below 1%
    search_latency: ['p(95)<3000'], // Custom metric threshold
    search_errors: ['rate<0.01'], // Custom error rate
    'http_req_duration{status:200}': ['p(95)<3000'], // Only successful requests
  },
};

// Test data: Diverse research queries
const searchQueries = [
  {
    query: 'machine learning healthcare',
    sources: ['arxiv', 'pubmed'],
    limit: 20,
  },
  {
    query: 'climate change agriculture',
    sources: ['crossref', 'pubmed'],
    limit: 15,
  },
  { query: 'quantum computing algorithms', sources: ['arxiv'], limit: 25 },
  {
    query: 'neural networks deep learning',
    sources: ['arxiv', 'crossref'],
    limit: 20,
  },
  { query: 'CRISPR gene editing', sources: ['pubmed'], limit: 10 },
  { query: 'renewable energy policy', sources: ['crossref'], limit: 20 },
  { query: 'natural language processing', sources: ['arxiv'], limit: 20 },
  { query: 'covid-19 vaccine efficacy', sources: ['pubmed'], limit: 15 },
  {
    query: 'blockchain distributed systems',
    sources: ['arxiv', 'crossref'],
    limit: 20,
  },
  { query: 'microbiome gut health', sources: ['pubmed'], limit: 20 },
];

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  // Select random query
  const queryData =
    searchQueries[Math.floor(Math.random() * searchQueries.length)];

  // Execute search request
  const startTime = new Date().getTime();
  const res = http.post(
    `${BASE_URL}/api/literature/search/public`,
    JSON.stringify(queryData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'literature_search' },
    },
  );
  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  // Record custom metrics
  searchLatency.add(duration);

  // Check response
  const checkResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'response time < 5s (p99)': (r) => r.timings.duration < 5000,
    'has papers': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.papers && body.papers.length > 0;
      } catch (e) {
        return false;
      }
    },
    'has metadata': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.total !== undefined && body.sources !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  // Track errors
  if (res.status !== 200) {
    searchErrors.add(1);
  } else {
    searchErrors.add(0);

    // Count papers returned
    try {
      const body = JSON.parse(res.body);
      papersReturned.add(body.papers.length);

      // Check if response was cached (custom header)
      if (res.headers['X-Cache-Hit'] === 'true') {
        cacheHits.add(1);
      } else {
        cacheHits.add(0);
      }
    } catch (e) {
      console.error(`Failed to parse response: ${e}`);
    }
  }

  // Think time: Simulate user reading results (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

// Setup function (runs once at start)
export function setup() {
  console.log('🚀 Starting Literature Search Load Test');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Queries: ${searchQueries.length} diverse research topics`);
  console.log(`   Max VUs: 50 concurrent users`);
  console.log(`   Duration: 13 minutes total`);
  console.log('');
  console.log('📊 Success Criteria:');
  console.log('   ✅ p95 latency < 3s');
  console.log('   ✅ Error rate < 1%');
  console.log('   ✅ All queries return results');
  console.log('');
}

// Teardown function (runs once at end)
export function teardown(data) {
  console.log('');
  console.log('✅ Literature Search Load Test Complete');
  console.log('   Review results above for SLA compliance');
  console.log('');
}
