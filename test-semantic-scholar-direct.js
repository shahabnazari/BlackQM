/**
 * Direct Semantic Scholar API Test
 * Tests if the API works with our exact field configuration
 */

const axios = require('axios');

const API_BASE_URL = 'https://api.semanticscholar.org/graph/v1';

// EXACT fields we're using in backend
const API_FIELDS = 'paperId,title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy,externalIds';

async function testSemanticScholarAPI() {
  console.log('\n🔬 SEMANTIC SCHOLAR API DIAGNOSTIC TEST\n');
  console.log('='  .repeat(60));

  const query = 'machine learning';
  const limit = 5;

  const url = `${API_BASE_URL}/paper/search`;
  const params = {
    query,
    fields: API_FIELDS,
    limit
  };

  console.log('\n📡 REQUEST:');
  console.log(`   URL: ${url}`);
  console.log(`   Query: ${params.query}`);
  console.log(`   Fields: ${params.fields}`);
  console.log(`   Limit: ${params.limit}`);

  try {
    const startTime = Date.now();
    const response = await axios.get(url, { params, timeout: 10000 });
    const duration = Date.now() - startTime;

    console.log('\n✅ RESPONSE SUCCESS:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Has response.data: ${!!response.data}`);
    console.log(`   Has response.data.data: ${!!(response.data && response.data.data)}`);
    console.log(`   response.data.data type: ${response.data && response.data.data ? typeof response.data.data : 'undefined'}`);
    console.log(`   response.data.data isArray: ${response.data && response.data.data ? Array.isArray(response.data.data) : false}`);
    console.log(`   response.data.data length: ${response.data && response.data.data && Array.isArray(response.data.data) ? response.data.data.length : 'N/A'}`);
    console.log(`   response.data.total: ${response.data && response.data.total !== undefined ? response.data.total : 'undefined'}`);

    if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      console.log('\n📄 FIRST PAPER SAMPLE:');
      const firstPaper = response.data.data[0];
      console.log(`   Title: ${firstPaper.title}`);
      console.log(`   Authors: ${firstPaper.authors ? firstPaper.authors.length : 0} authors`);
      console.log(`   Year: ${firstPaper.year}`);
      console.log(`   Abstract: ${firstPaper.abstract ? firstPaper.abstract.substring(0, 100) + '...' : 'none'}`);
      console.log(`   Citations: ${firstPaper.citationCount}`);
      console.log(`   External IDs: ${firstPaper.externalIds ? Object.keys(firstPaper.externalIds).join(', ') : 'none'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED - API WORKS CORRECTLY');
    console.log('='.repeat(60) + '\n');

    return response.data;

  } catch (error) {
    console.log('\n❌ RESPONSE ERROR:');
    console.log(`   Error message: ${error.message}`);
    console.log(`   Error code: ${error.code || 'none'}`);

    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60) + '\n');

    throw error;
  }
}

// Run the test
testSemanticScholarAPI()
  .then(data => {
    console.log(`\n✅ Retrieved ${data.data ? data.data.length : 0} papers out of ${data.total || 'unknown'} total results\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message, '\n');
    process.exit(1);
  });
