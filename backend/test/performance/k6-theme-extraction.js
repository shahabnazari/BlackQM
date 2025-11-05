/**
 * K6 Load Test: Theme Extraction Endpoint (Single Paper)
 * Phase 10 Day 5.7 Stage 3: Performance Testing
 *
 * Objective: Validate extraction endpoint under concurrent load
 * Duration: 15 minutes
 * Success Criteria: p95 < 30s, error rate < 2%, no rate limit violations
 *
 * IMPORTANT: This test makes real OpenAI API calls. Costs ~$0.02-0.05 per extraction.
 * For a full load test with 100 requests, expect $2-5 in API costs.
 * Use VUs=2-5 to avoid excessive costs and rate limits.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const extractionLatency = new Trend('extraction_latency');
const extractionErrors = new Rate('extraction_errors');
const themesExtracted = new Counter('themes_extracted');
const rateLimitHits = new Counter('rate_limit_429_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 2 },   // Warm-up: Ramp to 2 users
    { duration: '3m', target: 5 },   // Load: Ramp to 5 users (respects rate limits)
    { duration: '8m', target: 5 },   // Sustain: Hold at 5 users
    { duration: '2m', target: 0 },   // End: Ramp to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<30000'], // 95% of requests must complete below 30s
    'http_req_failed': ['rate<0.02'],     // Error rate must be below 2%
    'extraction_latency': ['p(95)<30000'],
    'extraction_errors': ['rate<0.02'],
    'rate_limit_429_errors': ['count<5'], // Should have <5 rate limit errors total
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''; // Must provide valid JWT token

// Test data: Sample papers for extraction
const samplePapers = [
  {
    type: 'paper',
    id: 'test-paper-ml-1',
    title: 'Deep Learning for Medical Image Analysis: A Comprehensive Review',
    content: 'Deep learning has revolutionized medical image analysis, enabling automated detection of diseases from X-rays, MRIs, and CT scans. Convolutional neural networks (CNNs) have shown remarkable accuracy in identifying tumors, lesions, and other abnormalities. This review examines the state-of-the-art deep learning architectures used in radiology, pathology, and ophthalmology.',
    authors: ['Smith, J.', 'Johnson, M.', 'Lee, K.'],
    year: 2024,
  },
  {
    type: 'paper',
    id: 'test-paper-climate-2',
    title: 'Climate Change Impacts on Global Agricultural Productivity',
    content: 'Climate change poses significant threats to global food security. Rising temperatures, altered precipitation patterns, and increased frequency of extreme weather events are reducing crop yields worldwide. This study analyzes the vulnerability of major staple crops (wheat, rice, maize) to climate variability and proposes adaptation strategies.',
    authors: ['Garcia, A.', 'Martinez, L.'],
    year: 2023,
  },
  {
    type: 'paper',
    id: 'test-paper-quantum-3',
    title: 'Quantum Algorithms for Optimization Problems: A Survey',
    content: 'Quantum computing promises exponential speedups for certain computational problems. This survey reviews quantum algorithms for combinatorial optimization, including quantum annealing, QAOA (Quantum Approximate Optimization Algorithm), and variational quantum eigensolvers. We discuss applications in logistics, finance, and drug discovery.',
    authors: ['Chen, W.', 'Patel, R.', 'Kim, S.'],
    year: 2024,
  },
  {
    type: 'paper',
    id: 'test-paper-nlp-4',
    title: 'Transformer Models in Natural Language Understanding: BERT to GPT-4',
    content: 'Transformer architectures have become the foundation of modern NLP. This paper traces the evolution from BERT (bidirectional encoding) to GPT (autoregressive generation), examining their strengths, limitations, and applications. We analyze performance on tasks including question answering, sentiment analysis, and text summarization.',
    authors: ['Brown, T.', 'Wilson, D.'],
    year: 2023,
  },
  {
    type: 'paper',
    id: 'test-paper-crispr-5',
    title: 'CRISPR-Cas9 Gene Editing: Therapeutic Applications and Ethical Considerations',
    content: 'CRISPR-Cas9 technology enables precise genome editing with applications in treating genetic disorders, cancer, and infectious diseases. This review discusses recent clinical trials, off-target effects, and delivery mechanisms. We also address ethical concerns regarding germline editing and equitable access to gene therapies.',
    authors: ['Young, B.', 'King, V.', 'Scott, T.'],
    year: 2024,
  },
];

export default function () {
  // Check if auth token is provided
  if (!AUTH_TOKEN) {
    console.error('❌ ERROR: AUTH_TOKEN environment variable not set');
    console.error('   Run: k6 run -e AUTH_TOKEN=your_jwt_token k6-theme-extraction.js');
    return;
  }

  // Select random paper
  const paper = samplePapers[Math.floor(Math.random() * samplePapers.length)];

  // Prepare request payload
  const payload = JSON.stringify({
    sources: [paper],
    options: {
      researchContext: paper.title.split(':')[0], // Use paper domain as context
      minConfidence: 0.5,
    },
  });

  // Execute theme extraction request
  const startTime = new Date().getTime();
  const res = http.post(
    `${BASE_URL}/api/literature/themes/unified-extract`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      tags: { name: 'theme_extraction' },
      timeout: '60s', // 60 second timeout
    }
  );
  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  // Record custom metrics
  extractionLatency.add(duration);

  // Check for rate limit errors
  if (res.status === 429) {
    rateLimitHits.add(1);
    console.warn(`⚠️  Rate limit hit (429 Too Many Requests) - VU: ${__VU}, Iteration: ${__ITER}`);
  }

  // Check response
  const checkResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'not rate limited (429)': (r) => r.status !== 429,
    'response time < 30s': (r) => r.timings.duration < 30000,
    'response time < 45s (p99)': (r) => r.timings.duration < 45000,
    'has themes': (r) => {
      if (r.status !== 200) return false;
      try {
        const body = JSON.parse(r.body);
        return body.themes && body.themes.length > 0;
      } catch (e) {
        return false;
      }
    },
    'themes have confidence scores': (r) => {
      if (r.status !== 200) return false;
      try {
        const body = JSON.parse(r.body);
        return body.themes.every(theme => theme.confidence !== undefined);
      } catch (e) {
        return false;
      }
    },
  });

  // Track metrics
  if (res.status !== 200) {
    extractionErrors.add(1);
  } else {
    extractionErrors.add(0);

    // Count themes extracted
    try {
      const body = JSON.parse(res.body);
      themesExtracted.add(body.themes.length);
    } catch (e) {
      console.error(`Failed to parse response: ${e}`);
    }
  }

  // Think time: Simulate user reviewing themes (5-10 seconds)
  // Also helps respect OpenAI rate limits
  sleep(Math.random() * 5 + 5);
}

export function setup() {
  console.log('🚀 Starting Theme Extraction Load Test');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Test Papers: ${samplePapers.length} diverse domains`);
  console.log(`   Max VUs: 5 concurrent users (respects rate limits)`);
  console.log(`   Duration: 15 minutes total`);
  console.log('');
  console.log('⚠️  WARNING: This test makes real OpenAI API calls');
  console.log('   Estimated cost: $2-5 for full test run');
  console.log('');
  console.log('📊 Success Criteria:');
  console.log('   ✅ p95 latency < 30s');
  console.log('   ✅ Error rate < 2%');
  console.log('   ✅ <5 rate limit errors (429)');
  console.log('   ✅ All extractions return themes');
  console.log('');

  // Verify auth token
  if (!AUTH_TOKEN) {
    console.error('❌ SETUP FAILED: No AUTH_TOKEN provided');
    console.error('   Set environment variable: k6 run -e AUTH_TOKEN=your_jwt k6-theme-extraction.js');
    throw new Error('AUTH_TOKEN required');
  }
}

export function teardown(data) {
  console.log('');
  console.log('✅ Theme Extraction Load Test Complete');
  console.log('   Review results above for SLA compliance');
  console.log('   Check rate limit hits - should be <5 total');
  console.log('');
}
