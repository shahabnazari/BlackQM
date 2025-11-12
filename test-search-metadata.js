/**
 * Test Script: Search Metadata Visibility
 * Tests if SearchProcessIndicator appears after search
 */

const http = require('http');

console.log('🧪 Testing Search API and Metadata...\n');

// Test backend search endpoint
const searchData = JSON.stringify({
  query: 'cloth',
  sources: [], // Will use defaults
  page: 1,
  limit: 20,
  sortByEnhanced: 'quality_score',
  includeCitations: true,
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/literature/search/public',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': searchData.length,
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      console.log('✅ Search API Response received\n');

      // Check if it's an error response
      if (response.error || response.message) {
        console.log('❌ API Error Response:');
        console.log('  - statusCode:', response.statusCode);
        console.log('  - error:', response.error);
        console.log('  - message:', response.message);
        console.log('\nFull response:', JSON.stringify(response, null, 2));
        return;
      }

      console.log('📊 Response Structure:');
      console.log('  - papers:', response.papers?.length || 0);
      console.log('  - total:', response.total);
      console.log('  - page:', response.page);
      console.log('  - metadata:', response.metadata ? '✅ EXISTS' : '❌ MISSING');

      if (response.metadata) {
        console.log('\n📦 Metadata Contents:');
        console.log('  - totalCollected:', response.metadata.totalCollected);
        console.log('  - uniqueAfterDedup:', response.metadata.uniqueAfterDedup);
        console.log('  - totalQualified:', response.metadata.totalQualified);
        console.log('  - displayed:', response.metadata.displayed);
        console.log('  - sourceBreakdown:', Object.keys(response.metadata.sourceBreakdown || {}));
        console.log('\n✅ METADATA IS BEING RETURNED BY BACKEND');
      } else {
        console.log('\n❌ CRITICAL: Metadata is MISSING from backend response!');
        console.log('Response keys:', Object.keys(response));
      }

      // Check visibility condition
      console.log('\n🔍 Visibility Condition Check:');
      console.log('  - searchMetadata !== null:', response.metadata !== null);
      console.log('  - papers.length > 0:', (response.papers?.length || 0) > 0);
      console.log('  - isVisible:', response.metadata !== null && (response.papers?.length || 0) > 0);

      if (response.metadata !== null && (response.papers?.length || 0) > 0) {
        console.log('\n✅ SearchProcessIndicator SHOULD BE VISIBLE');
      } else {
        console.log('\n❌ SearchProcessIndicator WILL NOT BE VISIBLE');
        if (!response.metadata) {
          console.log('   Reason: searchMetadata is null');
        }
        if ((response.papers?.length || 0) === 0) {
          console.log('   Reason: papers.length is 0');
        }
      }

    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure backend server is running on port 4000');
});

req.write(searchData);
req.end();
