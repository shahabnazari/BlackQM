/**
 * Quick Test: Springer API Integration
 * Tests if the new Springer API key is working
 */

const https = require('https');

const API_KEY = '37ca6a5d59a12115066b4a5343c03c2d';
const query = 'energy efficiency';
const url = `https://api.springernature.com/meta/v2/json?api_key=${API_KEY}&q=${encodeURIComponent(query)}&p=5&s=1`;

console.log('🔍 Testing Springer API Integration...');
console.log(`📊 Query: "${query}"`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
console.log('');

https.get(url, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (res.statusCode === 200) {
        const totalResults = json.result?.[0]?.total || 0;
        const recordsDisplayed = json.result?.[0]?.recordsDisplayed || 0;
        const records = json.records || [];

        console.log('✅ SUCCESS! Springer API is working!');
        console.log('');
        console.log(`📈 Total Results: ${totalResults.toLocaleString()}`);
        console.log(`📄 Records Returned: ${recordsDisplayed}`);
        console.log('');

        if (records.length > 0) {
          console.log('📚 Sample Papers:');
          records.slice(0, 3).forEach((record, idx) => {
            console.log(`\n${idx + 1}. ${record.title}`);
            console.log(`   Authors: ${record.creators?.map(c => c.creator || c).slice(0, 2).join(', ')}${record.creators?.length > 2 ? '...' : ''}`);
            console.log(`   Journal: ${record.publicationName || 'N/A'}`);
            console.log(`   Year: ${record.publicationDate || record.onlineDate || 'N/A'}`);
            console.log(`   DOI: ${record.doi || 'N/A'}`);
          });
        }

        console.log('');
        console.log('✅ Springer integration is working correctly!');
        console.log('✅ API key is valid and active');

      } else if (res.statusCode === 401) {
        console.log('❌ FAILED: API key is invalid or expired');
        console.log(`   Status: ${json.status}`);
        console.log(`   Message: ${json.message}`);
      } else {
        console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
        console.log(JSON.stringify(json, null, 2));
      }

    } catch (error) {
      console.log('❌ Failed to parse response');
      console.log(data);
    }
  });

}).on('error', (error) => {
  console.log('❌ Request failed:', error.message);
});
