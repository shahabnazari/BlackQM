/**
 * Phase 10.1 Day 12: Direct enrichment test
 *
 * Bypasses HTTP/auth layer to test enrichment directly
 */

const path = require('path');

// Bootstrap NestJS app
async function testEnrichment() {
  console.log('🔄 Starting direct enrichment test...\n');

  try {
    // Load compiled service
    const LiteratureService = require('./backend/dist/modules/literature/literature.service').LiteratureService;
    const OpenAlexEnrichmentService = require('./backend/dist/modules/literature/services/openalex-enrichment.service').OpenAlexEnrichmentService;

    // Create test paper
    const testPaper = {
      title: 'Social media and political polarization',
      doi: '10.1177/1461444815616224',
      source: 'SEMANTIC_SCHOLAR',
      citationCount: 100,
      year: 2015,
      authors: ['Test Author'],
      venue: 'New Media & Society',
      abstract: 'Test abstract',
      url: 'https://example.com',
    };

    console.log('📋 Test Paper:');
    console.log(`   Title: ${testPaper.title}`);
    console.log(`   DOI: ${testPaper.doi}`);
    console.log(`   Current Citations: ${testPaper.citationCount}\n`);

    // Import required dependencies
    const { HttpService } = require('@nestjs/axios');
    const axios = require('axios');

    // Create axios instance
    const axiosInstance = axios.create();

    // Create HttpService manually
    const httpService = new HttpService(axiosInstance);

    // Create enrichment service
    const enrichmentService = new OpenAlexEnrichmentService(httpService);

    console.log('🔄 Calling OpenAlex enrichment...\n');

    // Call enrichment
    const enrichedPaper = await enrichmentService.enrichPaper(testPaper);

    console.log('\n✅ Enrichment Complete!\n');
    console.log('📊 Results:');
    console.log(`   Citations: ${testPaper.citationCount} → ${enrichedPaper.citationCount}`);
    console.log(`   Impact Factor: ${enrichedPaper.impactFactor || 'N/A'}`);
    console.log(`   h-index (Journal): ${enrichedPaper.hIndexJournal || 'N/A'}`);
    console.log(`   Quartile: ${enrichedPaper.quartile || 'N/A'}`);

    if (enrichedPaper.impactFactor || enrichedPaper.hIndexJournal) {
      console.log('\n✅ SUCCESS: Enrichment is working! Journal metrics were fetched.');
    } else {
      console.log('\n⚠️  WARNING: No journal metrics fetched. Check OpenAlex API or DOI.');
    }

  } catch (error) {
    console.error('\n❌ Error during enrichment test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEnrichment();
