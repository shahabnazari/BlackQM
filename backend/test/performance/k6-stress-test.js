/**
 * K6 Stress Test: Breaking Point Analysis
 * Phase 10 Day 5.7 Stage 3: Performance Testing
 *
 * Objective: Identify system breaking point and graceful degradation
 * Duration: 15 minutes
 * Success Criteria: Graceful degradation (no crashes), clear error messages
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const totalRequests = new Counter('total_requests');
const totalErrors = new Counter('total_errors');
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time_ms');

// Test configuration - gradually increase load to find breaking point
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Stage 1: Baseline (expected load)
    { duration: '2m', target: 100 },  // Stage 2: Peak load
    { duration: '2m', target: 150 },  // Stage 3: Stress
    { duration: '2m', target: 200 },  // Stage 4: Breaking point
    { duration: '5m', target: 200 },  // Stage 5: Sustained stress
    { duration: '2m', target: 0 },    // Stage 6: Recovery
  ],
  thresholds: {
    // Intentionally lenient thresholds - we expect degradation
    'http_req_duration': ['p(95)<10000'], // 10s (degraded, but still responsive)
    'http_req_failed': ['rate<0.20'],     // 20% error rate acceptable during stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Lightweight endpoints for stress testing
const endpoints = [
  { method: 'GET', url: '/api/health/ready', name: 'health_check' },
  { method: 'GET', url: '/api/health/live', name: 'liveness' },
  { method: 'POST', url: '/api/literature/search/public', name: 'search', body: JSON.stringify({
    query: 'machine learning',
    sources: ['arxiv'],
    limit: 10,
  })},
];

export default function () {
  // Select random endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: endpoint.name },
  };

  // Execute request
  const startTime = new Date().getTime();
  let res;
  if (endpoint.method === 'GET') {
    res = http.get(`${BASE_URL}${endpoint.url}`, params);
  } else {
    res = http.post(`${BASE_URL}${endpoint.url}`, endpoint.body, params);
  }
  const duration = new Date().getTime() - startTime;

  // Track metrics
  totalRequests.add(1);
  responseTime.add(duration);

  // Check response
  const isSuccess = res.status >= 200 && res.status < 300;
  errorRate.add(isSuccess ? 0 : 1);

  if (!isSuccess) {
    totalErrors.add(1);

    // Log critical errors (but not rate limits - those are expected under stress)
    if (res.status !== 429 && res.status !== 503) {
      console.error(`❌ Unexpected error: ${res.status} - ${endpoint.name} - VU:${__VU}`);
    }
  }

  check(res, {
    'not a crash (500)': (r) => r.status !== 500,
    'response received': (r) => r.body !== undefined && r.body !== '',
    'response time < 15s': (r) => r.timings.duration < 15000,
  });

  // Minimal think time - we're stress testing
  sleep(0.1);
}

export function setup() {
  console.log('💥 Starting Stress Test - Breaking Point Analysis');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Load Profile:`);
  console.log('     Stage 1: 0 → 50 VUs   (Baseline)');
  console.log('     Stage 2: 50 → 100 VUs (Peak)');
  console.log('     Stage 3: 100 → 150 VUs (Stress)');
  console.log('     Stage 4: 150 → 200 VUs (Breaking Point)');
  console.log('     Stage 5: 200 VUs      (Sustained Stress)');
  console.log('     Stage 6: 200 → 0 VUs  (Recovery)');
  console.log('');
  console.log('📊 What We\'re Testing:');
  console.log('   • System capacity limits');
  console.log('   • Graceful degradation patterns');
  console.log('   • Error handling under extreme load');
  console.log('   • Recovery after stress');
  console.log('');
  console.log('✅ Success Criteria:');
  console.log('   • No crashes (500 errors)');
  console.log('   • Clear error messages (429/503 for rate limits)');
  console.log('   • System recovers after load decreases');
  console.log('   • Error rate <20% even under stress');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Stress Test Complete');
  console.log('');
  console.log('📊 Analysis Checklist:');
  console.log('   1. At what VU count did performance degrade? (p95 >5s)');
  console.log('   2. At what VU count did errors spike? (>5% error rate)');
  console.log('   3. What was the breaking point? (>15% error rate)');
  console.log('   4. Did the system recover after load decreased?');
  console.log('   5. Were there any 500 errors (crashes)?');
  console.log('');
  console.log('💡 Recommendation:');
  console.log('   Set production rate limit to 70% of breaking point');
  console.log('   Example: If breaking point = 150 VUs, limit = ~105 concurrent users');
  console.log('');
}
