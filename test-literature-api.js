#!/usr/bin/env node

/**
 * Test script for Literature API integration
 */

const axios = require('axios');

async function testLiteratureSearch() {
  console.log('🧪 Testing Literature Search API...\n');

  // Test public endpoint
  try {
    console.log('1️⃣ Testing public search endpoint...');
    const response = await axios.post(
      'http://localhost:4000/api/literature/search/public',
      {
        query: 'artificial intelligence',
        sources: ['semantic_scholar'],
        limit: 3,
      }
    );

    console.log('✅ Public search successful!');
    console.log(`   Found ${response.data.papers.length} papers`);
    console.log(`   Total results: ${response.data.total}`);

    if (response.data.papers.length > 0) {
      console.log('\n📄 Sample paper:');
      const paper = response.data.papers[0];
      console.log(`   Title: ${paper.title}`);
      console.log(`   Authors: ${paper.authors.join(', ')}`);
      console.log(`   Year: ${paper.year}`);
      console.log(`   Citations: ${paper.citationCount || 'N/A'}`);
    }
  } catch (error) {
    console.error(
      '❌ Public search failed:',
      error.response?.data?.message || error.message
    );
  }

  console.log('\n2️⃣ Testing health endpoint...');
  try {
    const health = await axios.get('http://localhost:4000/api/health');
    console.log('✅ Backend health:', health.data.status);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  console.log('\n3️⃣ Testing frontend API service...');
  try {
    // Simulate frontend API call
    const frontendResponse = await axios.post(
      'http://localhost:4000/api/literature/search/public',
      {
        query: 'climate change',
        sources: ['semantic_scholar', 'crossref'],
        yearFrom: 2020,
        yearTo: 2024,
        sortBy: 'relevance',
        page: 1,
        limit: 5,
        includeCitations: true,
      }
    );

    console.log('✅ Frontend-style search successful!');
    console.log(`   Papers returned: ${frontendResponse.data.papers.length}`);
    console.log(`   Sources searched: semantic_scholar, crossref`);
    console.log(`   Year range: 2020-2024`);
  } catch (error) {
    console.error(
      '❌ Frontend-style search failed:',
      error.response?.data?.message || error.message
    );
  }

  console.log('\n✨ API Integration Test Complete!');
}

// Run the tests
testLiteratureSearch().catch(console.error);
