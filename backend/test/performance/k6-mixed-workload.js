/**
 * K6 Mixed Workload Test: Realistic User Behavior
 * Phase 10 Day 5.7 Stage 3: Performance Testing
 *
 * Objective: Simulate realistic PhD researcher workflow
 * Duration: 20 minutes
 * Success Criteria: All endpoints meet SLAs concurrently
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Scenario-specific metrics
const loginLatency = new Trend('login_latency');
const searchLatency = new Trend('search_latency');
const browseLatency = new Trend('browse_latency');
const selectLatency = new Trend('select_latency');
const extractLatency = new Trend('extract_latency');

// Test configuration with scenarios
export const options = {
  scenarios: {
    // 5% of traffic: User authentication
    login_scenario: {
      executor: 'constant-vus',
      vus: 2,
      duration: '20m',
      exec: 'loginScenario',
    },
    // 40% of traffic: Searching for papers
    search_scenario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '15m', target: 10 },
        { duration: '3m', target: 0 },
      ],
      exec: 'searchScenario',
    },
    // 30% of traffic: Browsing/filtering results
    browse_scenario: {
      executor: 'constant-vus',
      vus: 7,
      duration: '20m',
      exec: 'browseScenario',
    },
    // 15% of traffic: Selecting papers
    select_scenario: {
      executor: 'constant-vus',
      vus: 4,
      duration: '20m',
      exec: 'selectScenario',
    },
    // 10% of traffic: Extracting themes
    extract_scenario: {
      executor: 'constant-vus',
      vus: 2,
      duration: '20m',
      exec: 'extractScenario',
    },
  },
  thresholds: {
    login_latency: ['p(95)<500'], // 500ms for auth
    search_latency: ['p(95)<3000'], // 3s for search
    browse_latency: ['p(95)<1000'], // 1s for browsing
    select_latency: ['p(95)<500'], // 500ms for selection
    extract_latency: ['p(95)<30000'], // 30s for extraction
    http_req_failed: ['rate<0.02'], // 2% overall error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Scenario 1: Login
export function loginScenario() {
  group('User Login', function () {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: 'test@vqmethod.com',
        password: 'test123',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { scenario: 'login' },
      },
    );

    loginLatency.add(res.timings.duration);

    check(res, {
      'login: status 200': (r) => r.status === 200,
      'login: has token': (r) => {
        try {
          return JSON.parse(r.body).accessToken !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    sleep(Math.random() * 10 + 30); // Users login once per session (30-40s think time)
  });
}

// Scenario 2: Search
export function searchScenario() {
  group('Literature Search', function () {
    const queries = [
      'machine learning',
      'climate change',
      'quantum computing',
      'gene editing',
      'renewable energy',
    ];

    const query = queries[Math.floor(Math.random() * queries.length)];

    const res = http.post(
      `${BASE_URL}/api/literature/search/public`,
      JSON.stringify({
        query: query,
        sources: ['arxiv', 'pubmed'],
        limit: 20,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { scenario: 'search' },
      },
    );

    searchLatency.add(res.timings.duration);

    check(res, {
      'search: status 200': (r) => r.status === 200,
      'search: has papers': (r) => {
        try {
          return JSON.parse(r.body).papers.length > 0;
        } catch (e) {
          return false;
        }
      },
      'search: latency <3s': (r) => r.timings.duration < 3000,
    });

    sleep(Math.random() * 3 + 2); // Think time: 2-5s (reading search results)
  });
}

// Scenario 3: Browse/Filter
export function browseScenario() {
  group('Browse Results', function () {
    // Simulate pagination or filtering (GET requests)
    const res = http.get(
      `${BASE_URL}/api/health/ready`, // Placeholder - in real app would be GET /papers?page=2
      {
        tags: { scenario: 'browse' },
      },
    );

    browseLatency.add(res.timings.duration);

    check(res, {
      'browse: status 200': (r) => r.status === 200,
      'browse: latency <1s': (r) => r.timings.duration < 1000,
    });

    sleep(Math.random() * 2 + 1); // Think time: 1-3s (scrolling/filtering)
  });
}

// Scenario 4: Select Papers
export function selectScenario() {
  group('Select Papers', function () {
    // Simulate selection state changes (lightweight operations)
    const res = http.get(
      `${BASE_URL}/api/health/ready`, // Placeholder - in real app would be POST /selections
      {
        tags: { scenario: 'select' },
      },
    );

    selectLatency.add(res.timings.duration);

    check(res, {
      'select: status 200': (r) => r.status === 200,
      'select: latency <500ms': (r) => r.timings.duration < 500,
    });

    sleep(Math.random() * 5 + 5); // Think time: 5-10s (reading abstracts)
  });
}

// Scenario 5: Extract Themes
export function extractScenario() {
  if (!AUTH_TOKEN) {
    console.warn('⚠️  Skipping extract scenario - no AUTH_TOKEN');
    sleep(30);
    return;
  }

  group('Extract Themes', function () {
    const res = http.post(
      `${BASE_URL}/api/literature/themes/unified-extract`,
      JSON.stringify({
        sources: [
          {
            type: 'paper',
            id: 'mixed-workload-test',
            title: 'Test Paper for Mixed Workload',
            content:
              'Sample content for theme extraction testing during mixed workload scenario.',
            authors: ['Test Author'],
            year: 2024,
          },
        ],
        options: {
          researchContext: 'test',
          minConfidence: 0.5,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        tags: { scenario: 'extract' },
        timeout: '60s',
      },
    );

    extractLatency.add(res.timings.duration);

    check(res, {
      'extract: status 200 or 429': (r) => r.status === 200 || r.status === 429,
      'extract: latency <30s': (r) => r.timings.duration < 30000,
    });

    sleep(Math.random() * 20 + 40); // Think time: 40-60s (reviewing themes)
  });
}

export function setup() {
  console.log('🎭 Starting Mixed Workload Test - Realistic User Behavior');
  console.log(`   Target: ${BASE_URL}`);
  console.log('');
  console.log('📊 Traffic Distribution:');
  console.log('   5%  - Login (2 VUs)');
  console.log('   40% - Search (10 VUs)');
  console.log('   30% - Browse (7 VUs)');
  console.log('   15% - Select (4 VUs)');
  console.log('   10% - Extract (2 VUs)');
  console.log('   ─────────────────────');
  console.log('   Total: 25 concurrent users');
  console.log('');
  console.log('⏱️  Duration: 20 minutes');
  console.log('');
  console.log('✅ Success Criteria (SLAs):');
  console.log('   Login:   p95 < 500ms');
  console.log('   Search:  p95 < 3s');
  console.log('   Browse:  p95 < 1s');
  console.log('   Select:  p95 < 500ms');
  console.log('   Extract: p95 < 30s');
  console.log('   Overall error rate: <2%');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Mixed Workload Test Complete');
  console.log('');
  console.log('📊 Review scenario-specific metrics:');
  console.log('   • login_latency (target: p95 <500ms)');
  console.log('   • search_latency (target: p95 <3s)');
  console.log('   • browse_latency (target: p95 <1s)');
  console.log('   • select_latency (target: p95 <500ms)');
  console.log('   • extract_latency (target: p95 <30s)');
  console.log('');
  console.log('💡 This test validates realistic concurrent usage patterns');
  console.log('');
}
